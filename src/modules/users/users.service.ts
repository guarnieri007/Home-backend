import { db } from '../../db/index.ts'
import { conflict, isUniqueViolation, notFound } from '../../shared/errors.ts'
import { authService } from '../auth/auth.service.ts'
import { profilesRepository } from '../profiles/profiles.repository.ts'
import { usersRepository, type UserUpdate } from './users.repository.ts'

const DEFAULT_PROFILE_NAME = 'Meus favoritos'

const normalizeEmail = (email: string) => email.trim().toLowerCase()
const emailInUse = () => conflict('Este email já está em uso', 'EMAIL_ALREADY_IN_USE')

export const usersService = {
  async create(input: { nm_user: string; email: string; password: string }) {
    const email = normalizeEmail(input.email)
    if (await usersRepository.findByEmail(email)) throw emailInUse()

    try {
      // Usuário, senha e perfil padrão são criados juntos: se um falhar, nenhum é salvo
      return await db.transaction(async (tx) => {
        const user = await usersRepository.create({ nm_user: input.nm_user.trim(), email }, tx)
        await authService.createCredentials(user.cd_user, input.password, tx)
        await profilesRepository.create(user.cd_user, DEFAULT_PROFILE_NAME, tx)
        return user
      })
    } catch (error) {
      if (isUniqueViolation(error)) throw emailInUse()
      throw error
    }
  },

  async getById(cd_user: number) {
    const user = await usersRepository.findById(cd_user)
    if (!user) throw notFound('Usuário não encontrado', 'USER_NOT_FOUND')
    return user
  },

  async update(cd_user: number, input: UserUpdate) {
    const data: UserUpdate = {}
    if (input.nm_user !== undefined) data.nm_user = input.nm_user.trim()
    if (input.email !== undefined) {
      data.email = normalizeEmail(input.email)
      const owner = await usersRepository.findByEmail(data.email)
      if (owner && owner.cd_user !== cd_user) throw emailInUse()
    }

    try {
      const user = await usersRepository.update(cd_user, data)
      if (!user) throw notFound('Usuário não encontrado', 'USER_NOT_FOUND')
      return user
    } catch (error) {
      if (isUniqueViolation(error)) throw emailInUse()
      throw error
    }
  },
}
