import { createHash, randomBytes } from 'node:crypto'
import { SignJWT, jwtVerify, errors } from 'jose'
import { env } from '../../config/env.ts'
import { unauthorized } from '../../shared/errors.ts'

export const ACCESS_TOKEN_TTL_SECONDS = 2 * 60
export const REFRESH_TOKEN_TTL_SECONDS = 14 * 24 * 60 * 60

const secret = new TextEncoder().encode(env.JWT_SECRET)
const ISSUER = 'firehome'

export type AccessTokenPayload = { cd_user: number }

export function signAccessToken({ cd_user }: AccessTokenPayload): Promise<string> {
  return new SignJWT({ type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(cd_user))
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(secret)
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  try {
    const { payload } = await jwtVerify(token, secret, { issuer: ISSUER, algorithms: ['HS256'] })
    const cd_user = Number(payload.sub)
    if (payload.type !== 'access' || !Number.isInteger(cd_user)) throw unauthorized('Token inválido', 'INVALID_TOKEN')
    return { cd_user }
  } catch (error) {
    if (error instanceof errors.JWTExpired) throw unauthorized('Access token expirado', 'TOKEN_EXPIRED')
    throw unauthorized('Token inválido', 'INVALID_TOKEN')
  }
}

// Refresh token é opaco (aleatório), não JWT: assim pode ser revogado no banco
export function generateRefreshToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
