import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import { authenticate } from '../auth/authenticate.ts'
import {
  CreateFavoriteBody,
  FavoriteParams,
  FavoriteResponse,
  ListFavoritesQuery,
  ReorderFavoritesBody,
  UpdateFavoriteBody,
} from './favorites.schemas.ts'
import { favoritesService } from './favorites.service.ts'

// Ícones em base64 deixam o corpo maior que o limite global (64 KB)
const bodyLimit = 256 * 1024

export const favoritesRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.addHook('onRequest', authenticate)

  // GET /favorites lista todos do usuário; ?cd_profile=1 filtra por profile
  app.get('/', {
    schema: { querystring: ListFavoritesQuery, response: { 200: Type.Array(FavoriteResponse) } },
  }, async (request) => {
    return favoritesService.list(request.user.cd_user, request.query.cd_profile)
  })

  app.get('/:cd_favorite', {
    schema: { params: FavoriteParams, response: { 200: FavoriteResponse } },
  }, async (request) => {
    return favoritesService.getById(request.user.cd_user, request.params.cd_favorite)
  })

  app.post('/', {
    bodyLimit,
    schema: { body: CreateFavoriteBody, response: { 201: FavoriteResponse } },
  }, async (request, reply) => {
    const favorite = await favoritesService.create(request.user.cd_user, request.body)
    return reply.status(201).send(favorite)
  })

  app.put('/order', {
    schema: { body: ReorderFavoritesBody, response: { 200: Type.Array(FavoriteResponse) } },
  }, async (request) => {
    return favoritesService.reorder(request.user.cd_user, request.body.cd_profile, request.body.cd_favorites)
  })

  app.patch('/:cd_favorite', {
    bodyLimit,
    schema: { params: FavoriteParams, body: UpdateFavoriteBody, response: { 200: FavoriteResponse } },
  }, async (request) => {
    return favoritesService.update(request.user.cd_user, request.params.cd_favorite, request.body)
  })

  app.delete('/:cd_favorite', {
    schema: { params: FavoriteParams },
  }, async (request, reply) => {
    await favoritesService.remove(request.user.cd_user, request.params.cd_favorite)
    return reply.status(204).send()
  })
}
