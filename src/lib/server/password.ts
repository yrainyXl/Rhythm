import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto'

// 口令哈希：Node 内置 scrypt（零新依赖，Docker slim 无需原生编译）。
// 参数取 OWASP 推荐强度 N=2^17 / r=8 / p=1；Node 默认 maxmem 为 32MB，
// N=131072 约需 128MB，必须显式传 maxmem 否则抛错。
const SCRYPT_N = 131072
const SCRYPT_R = 8
const SCRYPT_P = 1
const SCRYPT_MAXMEM = 192 * 1024 * 1024
const KEY_LENGTH = 64
const SALT_LENGTH = 16

interface ScryptOptions {
  N: number
  r: number
  p: number
  maxmem: number
}

// promisify 对 scrypt 的多重载推导会丢失 options 参数(报「Expected 3 arguments」),
// 手动包装回调以获得带 options 的 Promise 签名。
function scryptAsync(
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keylen, options, (err, derivedKey) => {
      if (err) reject(err)
      else resolve(derivedKey)
    })
  })
}

/**
 * 哈希口令，返回自描述格式：scrypt$N$r$p$saltBase64$hashBase64。
 * 自描述便于未来升级参数（旧值仍可按各自参数验证）。
 */
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH)
  const derived = (await scryptAsync(plain, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: SCRYPT_MAXMEM,
  })) as Buffer
  return [
    'scrypt',
    SCRYPT_N,
    SCRYPT_R,
    SCRYPT_P,
    salt.toString('base64'),
    derived.toString('base64'),
  ].join('$')
}

/**
 * 校验口令。stored 为 hashPassword 的输出；格式非法或长度不等直接返回 false。
 * 比较用 timingSafeEqual 防时序侧信道（长度先校验，避免 timingSafeEqual 对长度不等抛异常）。
 */
export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  if (!stored || typeof stored !== 'string') return false
  const parts = stored.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false
  const n = Number(parts[1])
  const r = Number(parts[2])
  const p = Number(parts[3])
  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false
  if (n <= 0 || r <= 0 || p <= 0) return false

  const salt = Buffer.from(parts[4], 'base64')
  const expected = Buffer.from(parts[5], 'base64')
  if (salt.length === 0 || expected.length === 0) return false

  const actual = (await scryptAsync(plain, salt, expected.length, {
    N: n,
    r,
    p,
    maxmem: SCRYPT_MAXMEM,
  })) as Buffer
  if (actual.length !== expected.length) return false
  return timingSafeEqual(actual, expected)
}
