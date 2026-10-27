import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { env } from '../config/env.ts'
import * as schema from './schema.ts'

export const client = createClient({ url: env.DB_FILE_NAME })

export const db = drizzle(client, { schema })

// Aceita tanto o db quanto uma transação, para os repositories poderem
// participar de uma transação aberta pelo service
export type Executor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0]
