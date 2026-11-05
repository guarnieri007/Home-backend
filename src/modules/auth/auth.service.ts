import { db, type Executor } from '../../db/index.ts'
import { enviarEmail } from '../../shared/email.ts'
import { badRequest, unauthorized } from '../../shared/errors.ts'
import { usersRepository } from '../users/users.repository.ts'
import { authRepository } from './auth.repository.ts'
import { getDummyHash, hashPassword, verifyPassword } from './password.ts'
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
  generateRefreshToken,
  hashRefreshToken,
  signAccessToken,
} from './tokens.ts'

async function issueTokens(cd_user: number, executor: Executor = db) {
  const refresh_token = generateRefreshToken()
  const expires_at = new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000)
  await authRepository.createRefreshToken(cd_user, hashRefreshToken(refresh_token), expires_at, executor)

  return {
    token_type: 'Bearer' as const,
    access_token: await signAccessToken({ cd_user }),
    expires_in: ACCESS_TOKEN_TTL_SECONDS,
    refresh_token,
    refresh_expires_in: REFRESH_TOKEN_TTL_SECONDS,
  }
}

const invalidCredentials = () => unauthorized('Email ou senha inválidos', 'INVALID_CREDENTIALS')
const invalidRefreshToken = () => unauthorized('Refresh token inválido ou expirado', 'INVALID_REFRESH_TOKEN')

export const authService = {
  // Chamado pelo users.service dentro da transação de criação do usuário
  async createCredentials(cd_user: number, password: string, executor: Executor = db) {
    await authRepository.createCredentials(cd_user, await hashPassword(password), executor)
  },

  async login(email: string, password: string) {
    const user = await usersRepository.findByEmail(email)
    const creds = user && (await authRepository.findCredentials(user.cd_user))

    // Sempre roda o scrypt, mesmo sem usuário, para não vazar por tempo de resposta
    const valid = await verifyPassword(password, creds?.password_hash ?? (await getDummyHash()))
    if (!user || !creds || !valid) throw invalidCredentials()

    await authRepository.deleteExpiredRefreshTokens(user.cd_user)
    return issueTokens(user.cd_user)
  },

  // Rotação: cada refresh token só pode ser usado uma vez
  async refresh(refresh_token: string) {
    const stored = await authRepository.findRefreshToken(hashRefreshToken(refresh_token))
    if (!stored) throw invalidRefreshToken()

    if (stored.revoked_at) {
      // Token já usado sendo reaproveitado: possível roubo, derruba todas as sessões
      await authRepository.revokeAllRefreshTokens(stored.cd_user)
      throw invalidRefreshToken()
    }
    if (stored.expires_at.getTime() <= Date.now()) throw invalidRefreshToken()

    return db.transaction(async (tx) => {
      const revoked = await authRepository.revokeRefreshToken(stored.cd_refresh_token, tx)
      if (!revoked) throw invalidRefreshToken()
      return issueTokens(stored.cd_user, tx)
    })
  },

  async logout(refresh_token: string) {
    const stored = await authRepository.findRefreshToken(hashRefreshToken(refresh_token))
    if (stored) await authRepository.revokeRefreshToken(stored.cd_refresh_token)
  },

  async changePassword(cd_user: number, current_password: string, new_password: string) {
    const creds = await authRepository.findCredentials(cd_user)
    if (!creds || !(await verifyPassword(current_password, creds.password_hash))) {
      throw unauthorized('Senha atual incorreta', 'INVALID_CREDENTIALS')
    }

    const password_hash = await hashPassword(new_password)
    await db.transaction(async (tx) => {
      await authRepository.updatePasswordHash(cd_user, password_hash, tx)
      // Encerra as sessões abertas em outros dispositivos
      await authRepository.revokeAllRefreshTokens(cd_user, tx)
    })
  },

  async changePasswordWithToken(token: string, new_password: string) {
    const stored = await authRepository.findResetToken(hashRefreshToken(token))
    if (!stored || stored.expires_at.getTime() <= Date.now()) {
      throw badRequest('Token de redefinição de senha inválido ou expirado', 'INVALID_RESET_TOKEN')
    }

    const password_hash = await hashPassword(new_password)
    await db.transaction(async (tx) => {
      await authRepository.updatePasswordHash(stored.cd_user, password_hash, tx)
      // Encerra as sessões abertas em outros dispositivos
      await authRepository.revokeAllRefreshTokens(stored.cd_user, tx)
      // Revoga o token de redefinição de senha usado
      await authRepository.revokeResetToken(stored.cd_reset_password_token, tx)
    })
  },

  async forgotPassword(email: string) {
    const user = await usersRepository.findByEmail(email)
    if (!user) return // Não vaza se o email existe ou não

    const expires_in = new Date(Date.now() + 45 * 60 * 1000); // 45 minutos, mesmo valor usado no front-end para expiração do link
    const token = generateRefreshToken()
    const tokenHash = hashRefreshToken(token)
    const link = `${process.env.APP_URL}/redefinir-senha?token=${token}`;

    await authRepository.resetTokenHash(user.cd_user, tokenHash, expires_in)
    console.log(`Redefinição de senha para ${user.email}: ${link}`) // Para testes, loga o link no console

    await enviarEmail({
      para: user.email,
      assunto: 'Redefinição de senha home',
      texto: `Para redefinir sua senha, acesse: ${link}\nO link expira em 45 minutos.`,
      html: `<p>Para redefinir sua senha, <a href="${link}">clique aqui</a>.</p>
           <p>O link expira em 45 minutos. Se não foi você, ignore este email.</p>`,
    });
    return { message: 'Se o email existir, um link de redefinição de senha foi enviado.' }
  },

  async checkResetToken(token: string) {
    const stored = await authRepository.findResetToken(hashRefreshToken(token))
    console.log('checkResetToken', { token, stored })
    if (!stored || stored.expires_at.getTime() <= Date.now()) {
      return { message: false }
    }
    return { message: true }
  }
}