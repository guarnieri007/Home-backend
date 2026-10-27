import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto'

// Parâmetros recomendados pela OWASP para scrypt: N=2^17, r=8, p=1 (~128 MiB por hash)
const N = 2 ** 17
const R = 8
const P = 1
const KEY_LENGTH = 64
const SALT_LENGTH = 16

function derive(password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password.normalize('NFKC'), salt, KEY_LENGTH, options, (err, key) => (err ? reject(err) : resolve(key)))
  })
}

const maxmem = (n: number, r: number) => 256 * n * r

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH)
  const key = await derive(password, salt, { N, r: R, p: P, maxmem: maxmem(N, R) })
  return ['scrypt', N, R, P, salt.toString('base64'), key.toString('base64')].join('$')
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, n, r, p, salt, hash] = stored.split('$')
  if (algorithm !== 'scrypt' || !salt || !hash) return false

  const expected = Buffer.from(hash, 'base64')
  const options = { N: Number(n), r: Number(r), p: Number(p), maxmem: maxmem(Number(n), Number(r)) }
  const key = await derive(password, Buffer.from(salt, 'base64'), options)
  return key.length === expected.length && timingSafeEqual(key, expected)
}

// Hash usado quando o email não existe, para o login levar o mesmo tempo
// nos dois casos e não revelar quais emails estão cadastrados
let dummyHash: Promise<string> | undefined
export function getDummyHash(): Promise<string> {
  dummyHash ??= hashPassword(randomBytes(16).toString('hex'))
  return dummyHash
}
