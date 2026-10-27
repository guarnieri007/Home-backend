import type { FastifyError, FastifyInstance } from 'fastify'

export type ErrorDetail = { field: string; message: string }

export class AppError extends Error {
  readonly statusCode: number
  readonly code: string
  readonly details?: ErrorDetail[]

  constructor(statusCode: number, code: string, message: string, details?: ErrorDetail[]) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

export const badRequest = (message: string, code = 'BAD_REQUEST') => new AppError(400, code, message)
export const unauthorized = (message = 'Não autenticado', code = 'UNAUTHORIZED') => new AppError(401, code, message)
export const forbidden = (message = 'Acesso negado', code = 'FORBIDDEN') => new AppError(403, code, message)
export const notFound = (message = 'Recurso não encontrado', code = 'NOT_FOUND') => new AppError(404, code, message)
export const conflict = (message: string, code = 'CONFLICT') => new AppError(409, code, message)

// Corpo padrão de todas as respostas de erro:
// { "error": { "code": "...", "message": "...", "details": [...] } }
function body(code: string, message: string, details?: ErrorDetail[]) {
  return { error: details?.length ? { code, message, details } : { code, message } }
}

const STATUS_CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  405: 'METHOD_NOT_ALLOWED',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  415: 'UNSUPPORTED_MEDIA_TYPE',
  429: 'TOO_MANY_REQUESTS',
}

export function registerErrorHandlers(app: FastifyInstance) {
  app.setErrorHandler((error: FastifyError | AppError, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send(body(error.code, error.message, error.details))
    }

    // Erros de validação do JSON Schema (body, params, querystring, headers)
    if ('validation' in error && error.validation) {
      const details = error.validation.map((v) => ({
        field: `${error.validationContext ?? ''}${v.instancePath || ''}`.replace(/\//g, '.') +
          (v.params && 'missingProperty' in v.params ? `.${v.params.missingProperty}` : '') +
          (v.params && 'additionalProperty' in v.params ? `.${v.params.additionalProperty}` : ''),
        message: v.message ?? 'inválido',
      }))
      return reply.status(400).send(body('VALIDATION_ERROR', 'Dados da requisição inválidos', details))
    }

    // Erros do próprio Fastify com status 4xx (JSON malformado, body grande demais etc.)
    const status = error.statusCode ?? 500
    if (status >= 400 && status < 500) {
      return reply.status(status).send(body(STATUS_CODES[status] ?? 'BAD_REQUEST', error.message))
    }

    request.log.error(error)
    return reply.status(500).send(body('INTERNAL_ERROR', 'Erro interno do servidor'))
  })

  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send(body('ROUTE_NOT_FOUND', `Rota ${request.method} ${request.url} não encontrada`))
  })
}

// Violação de UNIQUE do SQLite (o Drizzle embrulha o erro original em `cause`)
export function isUniqueViolation(error: unknown): boolean {
  for (let e: unknown = error; e instanceof Error; e = e.cause) {
    if (e.message.includes('UNIQUE constraint failed')) return true
  }
  return false
}
