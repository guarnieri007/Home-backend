import { Type } from '@sinclair/typebox'
import { DateTime, Id } from '../../shared/schemas.ts'

// Ícone enviado pelo front já redimensionado (até 192px), em geral bem abaixo de 50 KB.
// 150 mil caracteres de base64 ≈ 110 KB de imagem: folga para PNGs mais detalhados
export const ICONE_DATA_URL_MAX = 150_000

const Url = Type.String({ format: 'uri', pattern: '^https?://', maxLength: 2048 })
const Descricao = Type.String({ minLength: 1, maxLength: 255 })
const Icone = Type.Union([
  Type.String({ format: 'uri', pattern: '^https?://', maxLength: 2048 }),
  Type.String({
    pattern: '^data:image/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$',
    maxLength: ICONE_DATA_URL_MAX,
  }),
], { description: 'URL http(s) de imagem ou data URL base64 (png, jpeg, webp, gif)' })

export const FavoriteParams = Type.Object({ cd_favorite: Id })

export const ListFavoritesQuery = Type.Object({
  cd_profile: Type.Optional(Id),
}, { additionalProperties: false })

export const CreateFavoriteBody = Type.Object({
  cd_profile: Id,
  url: Url,
  descricao: Descricao,
  // Sem ícone: o backend busca o favicon do site
  icone: Type.Optional(Icone),
}, { additionalProperties: false })

export const UpdateFavoriteBody = Type.Object({
  cd_profile: Type.Optional(Id),
  url: Type.Optional(Url),
  descricao: Type.Optional(Descricao),
  icone: Type.Optional(Icone),
}, { additionalProperties: false, minProperties: 1 })

export const ReorderFavoritesBody = Type.Object({
  cd_profile: Id,
  // Todos os favoritos do profile, na nova ordem
  cd_favorites: Type.Array(Id, { uniqueItems: true, maxItems: 1000 }),
}, { additionalProperties: false })

export const FavoriteResponse = Type.Object({
  cd_favorite: Id,
  cd_profile: Id,
  url: Type.String(),
  descricao: Type.String(),
  icone: Type.String(),
  sort_order: Type.Integer(),
  created_at: DateTime,
  last_modified: DateTime,
})
