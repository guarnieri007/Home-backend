import { Type, type Static } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'

const EnvSchema = Type.Object({
  HOST: Type.String({ default: 'localhost' }),
  PORT: Type.Integer({ minimum: 1, maximum: 65535, default: 3333 }),
  DB_FILE_NAME: Type.String({ default: 'file:local.db' }),
  // Segredo HMAC dos access tokens: mínimo 32 caracteres
  JWT_SECRET: Type.String({ minLength: 32 }),
  CORS_ORIGIN: Type.String({ default: 'http://localhost:5173' }),
})

export type Env = Static<typeof EnvSchema>

function loadEnv(): Env {
  const raw = Value.Default(EnvSchema, Value.Convert(EnvSchema, { ...process.env }))
  if (!Value.Check(EnvSchema, raw)) {
    const problems = [...Value.Errors(EnvSchema, raw)].map((e) => `  ${e.path}: ${e.message}`)
    throw new Error(`Variáveis de ambiente inválidas:\n${problems.join('\n')}`)
  }
  return Value.Clean(EnvSchema, raw) as Env
}

export const env = loadEnv()
