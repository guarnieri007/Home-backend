import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import Fastify from 'fastify'
import { sql } from 'drizzle-orm'
import { env } from './config/env.ts'
import { client, db } from './db/index.ts'
import { authRoutes } from './modules/auth/auth.routes.ts'
import { favoritesRoutes } from './modules/favorites/favorites.routes.ts'
import { profilesRoutes } from './modules/profiles/profiles.routes.ts'
import { usersRoutes } from './modules/users/users.routes.ts'
import { AppError, registerErrorHandlers } from './shared/errors.ts'

export async function buildApp() {
  const app = Fastify({
    logger: true,
    bodyLimit: 64 * 1024,
    ajv: {
      // Campos extras geram erro 400 (additionalProperties: false) em vez de sumirem calados
      customOptions: { removeAdditional: false, allErrors: true },
    },
  }).withTypeProvider<TypeBoxTypeProvider>()

  app.decorateRequest('user', null as never)
  registerErrorHandlers(app)

  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })

  // global: false — o limite só vale nas rotas com config.rateLimit
  await app.register(rateLimit, {
    global: false,
    errorResponseBuilder: (_request, context) =>
      new AppError(429, 'TOO_MANY_REQUESTS', `Muitas tentativas, tente novamente em ${context.after}`),
  })

  app.get('/health', async () => {
    await db.run(sql`select 1`)
    return { status: 'ok' }
  })

  await app.register(usersRoutes, { prefix: '/users' })
  await app.register(authRoutes, { prefix: '/auth' })
  await app.register(profilesRoutes, { prefix: '/profiles' })
  await app.register(favoritesRoutes, { prefix: '/favorites' })

  app.addHook('onClose', async () => client.close())

  return app
}
