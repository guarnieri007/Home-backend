import { Type } from '@sinclair/typebox'
import { DateTime, Id } from '../../shared/schemas.ts'
import { Password } from '../auth/auth.schemas.ts'

const UserName = Type.String({ minLength: 1, maxLength: 100 })
const Email = Type.String({ format: 'email', maxLength: 254 })

export const CreateUserBody = Type.Object({
  nm_user: UserName,
  email: Email,
  password: Password,
}, { additionalProperties: false })

export const UpdateUserBody = Type.Object({
  nm_user: Type.Optional(UserName),
  email: Type.Optional(Email),
}, { additionalProperties: false, minProperties: 1 })

// Resposta pública: nunca inclui dados de credenciais
export const UserResponse = Type.Object({
  cd_user: Id,
  nm_user: Type.String(),
  email: Type.String(),
  created_at: DateTime,
  last_modified: DateTime,
})
