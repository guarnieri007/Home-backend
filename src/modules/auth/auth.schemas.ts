import { Type } from '@sinclair/typebox'

export const Password = Type.String({ minLength: 8, maxLength: 128 })

export const LoginBody = Type.Object({
  email: Type.String({ format: 'email', maxLength: 254 }),
  password: Type.String({ minLength: 1, maxLength: 128 }),
}, { additionalProperties: false })

export const RefreshTokenBody = Type.Object({
  refresh_token: Type.String({ minLength: 1, maxLength: 256 }),
}, { additionalProperties: false })

export const ChangePasswordBody = Type.Object({
  current_password: Type.String({ minLength: 1, maxLength: 128 }),
  new_password: Password,
}, { additionalProperties: false })

export const TokensResponse = Type.Object({
  token_type: Type.Literal('Bearer'),
  access_token: Type.String(),
  expires_in: Type.Integer({ description: 'Segundos até o access token expirar' }),
  refresh_token: Type.String(),
  refresh_expires_in: Type.Integer({ description: 'Segundos até o refresh token expirar' }),
})
