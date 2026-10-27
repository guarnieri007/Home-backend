import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { authenticate } from '../auth/authenticate.ts'
import {
  CreateProfileBody,
  ListProfilesQuery,
  ProfileListResponse,
  ProfileParams,
  ProfileResponse,
  ProfileWithFavoritesResponse,
  UpdateProfileBody,
} from './profiles.schemas.ts'
import { profilesService } from './profiles.service.ts'

export const profilesRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.addHook('onRequest', authenticate)

  // GET /profiles?include_favorites=true traz os favorites agrupados por profile
  app.get('/', {
    schema: { querystring: ListProfilesQuery, response: { 200: ProfileListResponse } },
  }, async (request) => {
    return profilesService.list(request.user.cd_user, request.query.include_favorites)
  })

  app.get('/:cd_profile', {
    schema: { params: ProfileParams, response: { 200: ProfileWithFavoritesResponse } },
  }, async (request) => {
    return profilesService.getById(request.user.cd_user, request.params.cd_profile)
  })

  app.post('/', {
    schema: { body: CreateProfileBody, response: { 201: ProfileResponse } },
  }, async (request, reply) => {
    const profile = await profilesService.create(request.user.cd_user, request.body.nm_profile)
    return reply.status(201).send(profile)
  })

  app.patch('/:cd_profile', {
    schema: { params: ProfileParams, body: UpdateProfileBody, response: { 200: ProfileResponse } },
  }, async (request) => {
    return profilesService.update(request.user.cd_user, request.params.cd_profile, request.body)
  })

  app.delete('/:cd_profile', {
    schema: { params: ProfileParams },
  }, async (request, reply) => {
    await profilesService.remove(request.user.cd_user, request.params.cd_profile)
    return reply.status(204).send()
  })
}
