import { and, asc, eq, getTableColumns, inArray, max } from 'drizzle-orm'
import { db, type Executor } from '../../db/index.ts'
import { favorites, profiles } from '../../db/schema.ts'

export type NewFavorite = Omit<typeof favorites.$inferInsert, 'cd_favorite' | 'sort_order' | 'created_at' | 'last_modified'>
export type FavoriteUpdate = Partial<NewFavorite> & { sort_order?: number }

// favorites não tem cd_user: o dono é descoberto pelo profile (join)
const ofUser = (cd_user: number, executor: Executor) =>
  inArray(
    favorites.cd_profile,
    executor.select({ cd_profile: profiles.cd_profile }).from(profiles).where(eq(profiles.cd_user, cd_user)),
  )

export const favoritesRepository = {
  async listByUser(cd_user: number, cd_profile?: number, executor: Executor = db) {
    return executor
      .select(getTableColumns(favorites))
      .from(favorites)
      .innerJoin(profiles, eq(favorites.cd_profile, profiles.cd_profile))
      .where(and(
        eq(profiles.cd_user, cd_user),
        cd_profile !== undefined ? eq(favorites.cd_profile, cd_profile) : undefined,
      ))
      .orderBy(asc(favorites.sort_order), asc(favorites.cd_favorite))
  },

  async findOwned(cd_user: number, cd_favorite: number, executor: Executor = db) {
    const [favorite] = await executor
      .select(getTableColumns(favorites))
      .from(favorites)
      .innerJoin(profiles, eq(favorites.cd_profile, profiles.cd_profile))
      .where(and(eq(favorites.cd_favorite, cd_favorite), eq(profiles.cd_user, cd_user)))
    return favorite
  },

  // Próxima posição livre no fim do profile
  async nextSortOrder(cd_profile: number, executor: Executor = db): Promise<number> {
    const [row] = await executor
      .select({ ultimo: max(favorites.sort_order) })
      .from(favorites)
      .where(eq(favorites.cd_profile, cd_profile))
    return row?.ultimo === null || row?.ultimo === undefined ? 0 : row.ultimo + 1
  },

  async listIdsByProfile(cd_profile: number, executor: Executor = db): Promise<number[]> {
    const rows = await executor
      .select({ cd_favorite: favorites.cd_favorite })
      .from(favorites)
      .where(eq(favorites.cd_profile, cd_profile))
    return rows.map((r) => r.cd_favorite)
  },

  async create(data: NewFavorite & { sort_order: number }, executor: Executor = db) {
    const [favorite] = await executor.insert(favorites).values(data).returning()
    return favorite!
  },

  async setSortOrder(cd_favorite: number, sort_order: number, executor: Executor = db) {
    await executor.update(favorites).set({ sort_order }).where(eq(favorites.cd_favorite, cd_favorite))
  },

  async update(cd_user: number, cd_favorite: number, data: FavoriteUpdate, executor: Executor = db) {
    const [favorite] = await executor
      .update(favorites)
      .set(data)
      .where(and(eq(favorites.cd_favorite, cd_favorite), ofUser(cd_user, executor)))
      .returning()
    return favorite
  },

  async delete(cd_user: number, cd_favorite: number, executor: Executor = db): Promise<boolean> {
    const deleted = await executor
      .delete(favorites)
      .where(and(eq(favorites.cd_favorite, cd_favorite), ofUser(cd_user, executor)))
      .returning({ cd_favorite: favorites.cd_favorite })
    return deleted.length > 0
  },
}
