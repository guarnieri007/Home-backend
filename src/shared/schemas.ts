import { Type } from '@sinclair/typebox'

// O banco devolve Date; na resposta vira string ISO 8601
export const DateTime = Type.Unsafe<Date>({ type: 'string', format: 'date-time' })

export const Id = Type.Integer({ minimum: 1 })
