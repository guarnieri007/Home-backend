import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { ChangePasswordBody, LoginBody, RefreshTokenBody, TokensResponse } from './auth.schemas.ts'
import { authService } from './auth.service.ts'
import { authenticate } from './authenticate.ts'

// Limite contra força bruta nas rotas que recebem credenciais
const rateLimit = { max: 10, timeWindow: '1 minute' }

export const authRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.post('/login', {
    config: { rateLimit },
    schema: { body: LoginBody, response: { 200: TokensResponse } },
  }, async (request) => {
    return authService.login(request.body.email.trim().toLowerCase(), request.body.password)
  })

  app.post('/refresh', {
    config: { rateLimit },
    schema: { body: RefreshTokenBody, response: { 200: TokensResponse } },
  }, async (request) => {
    return authService.refresh(request.body.refresh_token)
  })

  app.post('/logout', {
    schema: { body: RefreshTokenBody },
  }, async (request, reply) => {
    await authService.logout(request.body.refresh_token)
    return reply.status(204).send()
  })

  app.patch('/password', {
    config: { rateLimit },
    onRequest: authenticate,
    schema: { body: ChangePasswordBody },
  }, async (request, reply) => {
    const { current_password, new_password } = request.body
    await authService.changePassword(request.user.cd_user, current_password, new_password)
    return reply.status(204).send()
  })
}
