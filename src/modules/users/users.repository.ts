import { eq } from 'drizzle-orm'
import { db, type Executor } from '../../db/index.ts'
import { users } from '../../db/schema.ts'

export type NewUser = typeof users.$inferInsert
export type UserUpdate = Partial<Pick<NewUser, 'nm_user' | 'email'>>

export const usersRepository = {
  async findById(cd_user: number, executor: Executor = db) {
    return executor.query.users.findFirst({ where: eq(users.cd_user, cd_user) })
  },

  async findByEmail(email: string, executor: Executor = db) {
    return executor.query.users.findFirst({ where: eq(users.email, email) })
  },

  async create(data: NewUser, executor: Executor = db) {
    const [user] = await executor.insert(users).values(data).returning()
    return user!
  },

  async update(cd_user: number, data: UserUpdate, executor: Executor = db) {
    const [user] = await executor.update(users).set(data).where(eq(users.cd_user, cd_user)).returning()
    return user
  },
}
