import { and, eq, isNull, lt } from 'drizzle-orm'
import { db, type Executor } from '../../db/index.ts'
import { credentials, refresh_tokens } from '../../db/schema.ts'

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
}
