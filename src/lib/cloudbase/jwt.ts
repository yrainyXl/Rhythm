import { createPublicKey } from 'crypto'
import jwt from 'jsonwebtoken'
import { cloudbaseEnv } from './env'

/**
 * access_token 是 CloudBase 网关签发的 RS256 JWT。
 * 服务端本地验签拿 uid,跳过网关 userinfo 往返(每个业务 API 省 ~150ms)。
 *
 * 验签:RS256 + iss + aud + exp,用 JWKS 公钥。
 * 公钥轮换:JWKS 进程级缓存 1h,验签失败时强制刷新一次重试,再不行由调用方 fallback 网关。
 */

interface Jwk {
  kid: string
  kty: string
  use?: string
  alg?: string
  n: string
  e: string
}
interface Jwks { keys: Jwk[] }

interface TokenPayload {
  sub: string
  email?: string
  iss: string
  aud: string
  exp: number
}

export type AuthTimingRecorder = (name: string, duration: number) => void

let jwksCache: Jwks | null = null
let jwksExpireAt = 0
let jwksFetchPromise: Promise<Jwks | null> | null = null

function jwksUrl(): string {
  const envId = cloudbaseEnv.NEXT_PUBLIC_CLOUDBASE_ENV_ID
  return `https://${envId}.api.tcloudbasegateway.com/auth/v1/certs`
}

function issuer(): string {
  const envId = cloudbaseEnv.NEXT_PUBLIC_CLOUDBASE_ENV_ID
  return `https://${envId}.api.tcloudbasegateway.com`
}

/** 拉取 JWKS,进程级缓存 1h,并发单飞。force=true 跳过缓存(公钥轮换重试用)。 */
async function getJwks(
  force = false,
  recordTiming?: AuthTimingRecorder,
): Promise<Jwks | null> {
  const startedAt = performance.now()
  const now = Date.now()
  if (!force && jwksCache && now < jwksExpireAt) {
    recordTiming?.('jwks-cache', performance.now() - startedAt)
    return jwksCache
  }
  if (jwksFetchPromise) {
    const result = await jwksFetchPromise
    recordTiming?.(force ? 'jwks-refetch' : 'jwks-fetch', performance.now() - startedAt)
    return result
  }

  jwksFetchPromise = (async () => {
    try {
      const res = await fetch(jwksUrl(), { cache: 'no-store' })
      if (!res.ok) return null
      const data = (await res.json()) as Jwks
      jwksCache = data
      jwksExpireAt = Date.now() + 60 * 60 * 1000 // 1h
      return data
    } catch {
      return null
    } finally {
      jwksFetchPromise = null
    }
  })()
  const result = await jwksFetchPromise
  recordTiming?.(force ? 'jwks-refetch' : 'jwks-fetch', performance.now() - startedAt)
  return result
}

/** JWK -> Node PublicKey(用于 jwt.verify 验签)。 */
function jwkToPublicKey(jwk: Jwk) {
  // cast: JWK 的 n/e 字段类型与 Node crypto JsonWebKey 略有差异,运行时一致
  return createPublicKey({ key: jwk as unknown as import('crypto').JsonWebKey, format: 'jwk' })
}

/**
 * 验签 access_token,返回 {uid, email} | null。
 * uid = payload.sub(cloudbase uid)。
 * 失败(kid 无匹配/验签不通过/过期)返回 null,由调用方 fallback 网关 userinfo。
 */
export async function verifyAccessToken(
  token: string,
  recordTiming?: AuthTimingRecorder,
): Promise<{ uid: string; email: string | null } | null> {
  const initialStartedAt = performance.now()
  // 解 header 拿 kid(不信任 payload,未验签前)
  let kid: string | undefined
  try {
    const headerB64 = token.split('.')[0]
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'))
    kid = header.kid
  } catch {
    recordTiming?.('jwt-initial', performance.now() - initialStartedAt)
    return null
  }

  const tryVerify = async (jwks: Jwks | null) => {
    if (!jwks?.keys?.length) return null
    const jwk = kid ? jwks.keys.find((k) => k.kid === kid) : jwks.keys[0]
    if (!jwk) return null
    try {
      const payload = jwt.verify(token, jwkToPublicKey(jwk), {
        algorithms: ['RS256'],
        issuer: issuer(),
        audience: cloudbaseEnv.NEXT_PUBLIC_CLOUDBASE_ENV_ID,
      }) as TokenPayload
      if (!payload.sub) return null
      return { uid: payload.sub, email: payload.email ?? null }
    } catch {
      return null
    }
  }

  // 首次:用缓存的 JWKS 验
  const result = await tryVerify(await getJwks(false, recordTiming))
  recordTiming?.('jwt-initial', performance.now() - initialStartedAt)
  if (result) return result

  // 失败:强制刷新 JWKS(公钥可能刚轮换)再试一次
  const refetchStartedAt = performance.now()
  const result2 = await tryVerify(await getJwks(true, recordTiming))
  recordTiming?.('jwt-refetch', performance.now() - refetchStartedAt)
  return result2
}
