import type { FastifyReply, FastifyRequest } from 'fastify'
import { unauthorized } from '../../shared/errors.ts'
import { verifyAccessToken, type AccessTokenPayload } from './tokens.ts'

declare module 'fastify' {
  interface FastifyRequest {
    user: AccessTokenPayload
  }
}

// Hook para rotas protegidas: exige "Authorization: Bearer <access_token>"
export async function authenticate(request: FastifyRequest, _reply: FastifyReply) {
  const [scheme, token] = request.headers.authorization?.split(' ') ?? []
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    throw unauthorized('Envie o header Authorization: Bearer <access_token>', 'MISSING_TOKEN')
  }
  request.user = await verifyAccessToken(token)
}
