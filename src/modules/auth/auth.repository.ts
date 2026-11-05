import { and, eq, isNull, lt } from 'drizzle-orm'
import { db, type Executor } from '../../db/index.ts'
import { credentials, refresh_tokens, reset_password_tokens } from '../../db/schema.ts'

export const authRepository = {
  async findCredentials(cd_user: number, executor: Executor = db) {
    return executor.query.credentials.findFirst({ where: eq(credentials.cd_user, cd_user) })
  },

  async createCredentials(cd_user: number, password_hash: string, executor: Executor = db) {
    await executor.insert(credentials).values({ cd_user, password_hash })
  },

  async updatePasswordHash(cd_user: number, password_hash: string, executor: Executor = db) {
    await executor.update(credentials).set({ password_hash }).where(eq(credentials.cd_user, cd_user))
  },

  async createRefreshToken(cd_user: number, token_hash: string, expires_at: Date, executor: Executor = db) {
    await executor.insert(refresh_tokens).values({ cd_user, token_hash, expires_at })
  },

  async findRefreshToken(token_hash: string, executor: Executor = db) {
    return executor.query.refresh_tokens.findFirst({ where: eq(refresh_tokens.token_hash, token_hash) })
  },

  // Revoga só se ainda estiver ativo; retorna false se outra requisição já revogou
  async revokeRefreshToken(cd_refresh_token: number, executor: Executor = db): Promise<boolean> {
    const revoked = await executor
      .update(refresh_tokens)
      .set({ revoked_at: new Date() })
      .where(and(eq(refresh_tokens.cd_refresh_token, cd_refresh_token), isNull(refresh_tokens.revoked_at)))
      .returning({ cd_refresh_token: refresh_tokens.cd_refresh_token })
    return revoked.length > 0
  },

  async revokeAllRefreshTokens(cd_user: number, executor: Executor = db) {
    await executor
      .update(refresh_tokens)
      .set({ revoked_at: new Date() })
      .where(and(eq(refresh_tokens.cd_user, cd_user), isNull(refresh_tokens.revoked_at)))
  },

  async deleteExpiredRefreshTokens(cd_user: number, executor: Executor = db) {
    await executor
      .delete(refresh_tokens)
      .where(and(eq(refresh_tokens.cd_user, cd_user), lt(refresh_tokens.expires_at, new Date())))
  },

  async resetTokenHash(cd_user: number, token_hash: string, expires_at: Date, executor: Executor = db) {
    /** remove os hashes anteriores do usuário */
    await executor
      .delete(reset_password_tokens)
      .where(eq(reset_password_tokens.cd_user, cd_user));

    /** insere o novo hash */
    await executor
      .insert(reset_password_tokens)
      .values({ cd_user, token_hash, expires_at, revoked_at: null });
  },

  async findResetToken(token_hash: string, executor: Executor = db) {
    return executor.query.reset_password_tokens.findFirst({ where: eq(reset_password_tokens.token_hash, token_hash) })
  },

  async revokeResetToken(cd_reset_token: number, executor: Executor = db): Promise<boolean> {
    await executor
      .delete(reset_password_tokens)
      .where(and(eq(reset_password_tokens.cd_reset_password_token, cd_reset_token), isNull(reset_password_tokens.revoked_at)))
    return true
  }
}
