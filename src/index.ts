import { fileURLToPath } from 'node:url'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { buildApp } from './app.ts'
import { env } from './config/env.ts'
import { db } from './db/index.ts'

// Aplica as migrations pendentes (pasta drizzle/) antes de aceitar conexões;
// num banco novo, cria todas as tabelas
await migrate(db, { migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)) })

const app = await buildApp()

await app.listen({ host: env.HOST, port: env.PORT })
console.log(`🔥 Servidor rodando em http://${env.HOST}:${env.PORT} (host: ${env.HOST}, porta: ${env.PORT})`)

async function shutdown() {
  await app.close()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
