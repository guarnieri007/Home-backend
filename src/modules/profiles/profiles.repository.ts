import { and, asc, eq } from 'drizzle-orm'
import { db, type Executor } from '../../db/index.ts'
import { favorites, profiles } from '../../db/schema.ts'

export type ProfileUpdate = Partial<Pick<typeof profiles.$inferInsert, 'nm_profile'>>

// Toda busca filtra pelo dono, para um usuário nunca enxergar profiles de outro
const owned = (cd_user: number, cd_profile: number) =>
  and(eq(profiles.cd_profile, cd_profile), eq(profiles.cd_user, cd_user))

export const profilesRepository = {
  async listByUser(cd_user: number, withFavorites: boolean, executor: Executor = db) {
    return executor.query.profiles.findMany({
      where: eq(profiles.cd_user, cd_user),
      orderBy: asc(profiles.cd_profile),
      with: withFavorites ? { favorites: { orderBy: [asc(favorites.sort_order), asc(favorites.cd_favorite)] } } : undefined,
    })
  },

  async findOwned(cd_user: number, cd_profile: number, executor: Executor = db) {
    return executor.query.profiles.findFirst({
      where: owned(cd_user, cd_profile),
      with: { favorites: { orderBy: [asc(favorites.sort_order), asc(favorites.cd_favorite)] } },
    })
  },

  async create(cd_user: number, nm_profile: string, executor: Executor = db) {
    const [profile] = await executor.insert(profiles).values({ cd_user, nm_profile }).returning()
    return profile!
  },

  async update(cd_user: number, cd_profile: number, data: ProfileUpdate, executor: Executor = db) {
    const [profile] = await executor.update(profiles).set(data).where(owned(cd_user, cd_profile)).returning()
    return profile
  },

  async delete(cd_user: number, cd_profile: number, executor: Executor = db): Promise<boolean> {
    const deleted = await executor
      .delete(profiles)
      .where(owned(cd_user, cd_profile))
      .returning({ cd_profile: profiles.cd_profile })
    return deleted.length > 0
  },
}
