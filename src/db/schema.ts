import { relations, sql } from 'drizzle-orm'
import { sqliteTable, integer, text, check, index } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  cd_user: integer('cd_user').primaryKey({ autoIncrement: true }),
  nm_user: text('nm_user').notNull(),
  email: text('email').notNull().unique(),
  created_at: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  last_modified: integer('last_modified', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
})

export const favorites = sqliteTable('favorites', {
  cd_favorite: integer('cd_favorite').primaryKey({ autoIncrement: true }),
  cd_profile: integer('cd_profile')
    .notNull()
    .references(() => profiles.cd_profile, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  descricao: text('descricao').notNull(),
  // URL de imagem ou data URL base64 (ver favorites.schemas.ts)
  icone: text('icone').notNull(),
  // Posição do favorito dentro do profile (0, 1, 2...)
  sort_order: integer('sort_order').notNull().default(0),
  created_at: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  last_modified: integer('last_modified', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
}, (table) => [
  index('favorites_profile_id_idx').on(table.cd_profile, table.sort_order),
])

export const profile_max_length = 100;
export const profiles = sqliteTable('profiles', {
  cd_profile: integer('cd_profile').primaryKey({ autoIncrement: true }),
  cd_user: integer('cd_user')
    .notNull()
    .references(() => users.cd_user, { onDelete: 'cascade' }),
  nm_profile: text('nm_profile', { length: profile_max_length }).notNull(),
  created_at: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  last_modified: integer('last_modified', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
}, (table) => [
  index('profiles_user_id_idx').on(table.cd_user),
  // sql.raw: o limite precisa ir literal no DDL (parâmetro "?" não é válido em CHECK)
  check('nm_profile_max_length', sql`length(${table.nm_profile}) <= ${sql.raw(String(profile_max_length))}`),
])

export const credentials = sqliteTable('credentials', {
  cd_user: integer('cd_user')
    .primaryKey()
    .references(() => users.cd_user, { onDelete: 'cascade' }),
  // Formato: scrypt$N$r$p$salt$hash (ver modules/auth/password.ts)
  password_hash: text('password_hash').notNull(),
  last_modified: integer('last_modified', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
})

export const refresh_tokens = sqliteTable('refresh_tokens', {
  cd_refresh_token: integer('cd_refresh_token').primaryKey({ autoIncrement: true }),
  cd_user: integer('cd_user')
    .notNull()
    .references(() => users.cd_user, { onDelete: 'cascade' }),
  // Só o hash SHA-256 é salvo; o token em si fica apenas com o cliente
  token_hash: text('token_hash').notNull().unique(),
  expires_at: integer('expires_at', { mode: 'timestamp' }).notNull(),
  revoked_at: integer('revoked_at', { mode: 'timestamp' }),
  created_at: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => [
  index('refresh_tokens_user_id_idx').on(table.cd_user),
])

export const usersRelations = relations(users, ({ one, many }) => ({
  profiles: many(profiles),
  credentials: one(credentials),
  refresh_tokens: many(refresh_tokens),
}))

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(users, { fields: [profiles.cd_user], references: [users.cd_user] }),
  favorites: many(favorites),
}))

export const favoritesRelations = relations(favorites, ({ one }) => ({
  profile: one(profiles, { fields: [favorites.cd_profile], references: [profiles.cd_profile] }),
}))

export const credentialsRelations = relations(credentials, ({ one }) => ({
  user: one(users, { fields: [credentials.cd_user], references: [users.cd_user] }),
}))

export const refreshTokensRelations = relations(refresh_tokens, ({ one }) => ({
  user: one(users, { fields: [refresh_tokens.cd_user], references: [users.cd_user] }),
}))
