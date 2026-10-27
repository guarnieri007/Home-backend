import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { authenticate } from '../auth/authenticate.ts'
import { CreateUserBody, UpdateUserBody, UserResponse } from './users.schemas.ts'
import { usersService } from './users.service.ts'

export const usersRoutes: FastifyPluginAsyncTypebox = async (app) => {
  // Cadastro: rota pública
  app.post('/', {
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    schema: { body: CreateUserBody, response: { 201: UserResponse } },
  }, async (request, reply) => {
    const user = await usersService.create(request.body)
    return reply.status(201).send(user)
  })

  app.get('/me', {
    onRequest: authenticate,
    schema: { response: { 200: UserResponse } },
  }, async (request) => {
    return usersService.getById(request.user.cd_user)
  })

  app.patch('/me', {
    onRequest: authenticate,
    schema: { body: UpdateUserBody, response: { 200: UserResponse } },
  }, async (request) => {
    return usersService.update(request.user.cd_user, request.body)
  })
}
