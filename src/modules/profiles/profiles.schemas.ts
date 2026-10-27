import { Type } from '@sinclair/typebox'
import { profile_max_length } from '../../db/schema.ts'
import { DateTime, Id } from '../../shared/schemas.ts'
import { FavoriteResponse } from '../favorites/favorites.schemas.ts'

const ProfileName = Type.String({ minLength: 1, maxLength: profile_max_length })

export const ProfileParams = Type.Object({ cd_profile: Id })

export const ListProfilesQuery = Type.Object({
  include_favorites: Type.Boolean({ default: false }),
}, { additionalProperties: false })

export const CreateProfileBody = Type.Object({
  nm_profile: ProfileName,
}, { additionalProperties: false })

export const UpdateProfileBody = Type.Object({
  nm_profile: Type.Optional(ProfileName),
}, { additionalProperties: false, minProperties: 1 })

export const ProfileResponse = Type.Object({
  cd_profile: Id,
  cd_user: Id,
  nm_profile: Type.String(),
  created_at: DateTime,
  last_modified: DateTime,
})

export const ProfileWithFavoritesResponse = Type.Composite([
  ProfileResponse,
  Type.Object({ favorites: Type.Array(FavoriteResponse) }),
])

export const ProfileListResponse = Type.Array(Type.Composite([
  ProfileResponse,
  Type.Object({ favorites: Type.Optional(Type.Array(FavoriteResponse)) }),
]))
