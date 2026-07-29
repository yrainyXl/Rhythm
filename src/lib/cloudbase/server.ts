import { Pool, types } from 'pg'
import { cloudbaseEnv } from './env'
import { getAccessToken, getRefreshToken } from './auth-cookie'
import { verifyAccessToken } from './jwt'

// pg 默认把 PostgreSQL date/timestamp 解析成 JS Date 对象,JSON.stringify 后
// 变成 UTC ISO 字符串(如 "2026-07-22T16:00:00.000Z"),导致前端按本地日期
// 对比时偏移一天。改成返回原始字符串,date 列就是 "2026-07-22"。
// OID: 1082=date, 1114=timestamp, 1184=timestamptz
types.setTypeParser(1082, (v: string) => v)
types.setTypeParser(1114, (v: string) => v)
types.setTypeParser(1184, (v: string) => v)

// 进程级单例 Pool:复用连接,避免每个请求重复创建+销毁。
// (DB-P0-01) 之前 withUser 与 getUserIdFromCloudbase 各建一个 Pool 并 end,
// 高并发下连接数波动且开销大。
let poolInstance: Pool | null = null

export function getPgPool(): Pool {
  if (!poolInstance) {
    poolInstance = new Pool({
      host: cloudbaseEnv.TENCENTDB_HOST,
      port: cloudbaseEnv.TENCENTDB_PORT,
      user: cloudbaseEnv.TENCENTDB_USER,
      password: cloudbaseEnv.TENCENTDB_PASSWORD,
      database: cloudbaseEnv.TENCENTDB_DATABASE,
      ssl: cloudbaseEnv.TENCENTDB_SSL
        ? { rejectUnauthorized: false }
        : false,
      // (DB-P0-03) 连接超时 5s,避免数据库不可达时请求永久挂起
      connectionTimeoutMillis: 5000,
      // 单实例最大连接数,TencentDB 连接额度有限
      max: 5,
    })
  }
  return poolInstance
}

// 旧 API 名保留兼容(返回单例,不再每次新建)
export function createPgPool(): Pool {
  return getPgPool()
}

interface CloudbaseUserInfo {
  sub: string
  user_id?: string
  username?: string
  email?: string
  status?: string
}

interface CloudbaseUser {
  uid: string
  email: string | null
}

interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
}

/** 服务端代理登录:用户名密码 -> 网关 signin -> {access_token, refresh_token}。无 CORS。 */
export async function signinWithPassword(username: string, password: string): Promise<TokenResponse | null> {
  const envId = cloudbaseEnv.NEXT_PUBLIC_CLOUDBASE_ENV_ID
  const url = `https://${envId}.api.tcloudbasegateway.com/auth/v1/signin?client_id=${envId}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
    cache: 'no-store',
  })
  if (!res.ok) return null
  const data = (await res.json()) as TokenResponse
  if (!data?.access_token) return null
  return data
}

/** 用 refresh_token 换新 access_token(服务端,无 CORS)。 */
export async function refreshTokens(refreshToken: string): Promise<TokenResponse | null> {
  const envId = cloudbaseEnv.NEXT_PUBLIC_CLOUDBASE_ENV_ID
  const url = `https://${envId}.api.tcloudbasegateway.com/auth/v1/token?client_id=${envId}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'refresh_token', refresh_token: refreshToken }),
    cache: 'no-store',
  })
  if (!res.ok) return null
  const data = (await res.json()) as TokenResponse
  if (!data?.access_token) return null
  return data
}

async function fetchUserInfoRaw(accessToken: string): Promise<CloudbaseUser | null> {
  const envId = cloudbaseEnv.NEXT_PUBLIC_CLOUDBASE_ENV_ID
  const url = `https://${envId}.api.tcloudbasegateway.com/auth/v1/user/me`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })
  if (!res.ok) return null
  const info = (await res.json()) as CloudbaseUserInfo
  if (!info || (info.status && info.status !== 'ACTIVE')) return null
  const uid = info.user_id || info.sub
  if (!uid) return null
  return { uid, email: info.email ?? null }
}

/**
 * 用 access_token 拿 cloudbase uid + email。
 * 优先 JWT 本地验签(无网络往返,快);失败 fallback 网关 userinfo;
 * access_token 过期则用 refresh_token 续期一次(服务端,无 CORS)。
 */
async function fetchCloudbaseUserInfo(accessToken: string, request?: Request): Promise<CloudbaseUser | null> {
  // 1. 本地 JWT 验签(快路径)
  const verified = await verifyAccessToken(accessToken)
  if (verified) return verified

  // 2. fallback 网关 userinfo(公钥未刷新/旧 token 等)
  const info = await fetchUserInfoRaw(accessToken)
  if (info) return info

  // 3. access_token 失效 -> refresh 续期
  if (request) {
    const refreshToken = getRefreshToken(request)
    if (refreshToken) {
      const refreshed = await refreshTokens(refreshToken)
      if (refreshed) {
        // 续期后优先验签新 token
        const reVerified = await verifyAccessToken(refreshed.access_token)
        if (reVerified) return reVerified
        return fetchUserInfoRaw(refreshed.access_token)
      }
    }
  }
  return null
}

/** 提取 access_token:优先 httpOnly cookie,fallback Authorization Bearer(过渡兼容)。 */
function extractAccessToken(request: Request): string | null {
  return getAccessToken(request)
}

// 进程级 uid 缓存:cloudbase_uid -> app_users.id,带 TTL。
// 同一函数实例内同用户的后续请求命中缓存,省掉一次 DB 查询。
// (Vercel 跨地域 DB 往返慢,这个缓存对所有业务 API 鉴权都生效)
const uidCache = new Map<string, { id: string; exp: number }>()
const UID_CACHE_TTL = 10 * 60 * 1000 // 10min

/**
 * 查询 cloudbase uid 对应的 app_users.id。只读,不建用户。
 * 用于业务 Route Handler 鉴权--调业务接口不应有建用户副作用。
 * 命中进程级 uid 缓存时跳过 DB 查询。
 */
/**
 * 用 access_token 查 app_users.id。只读,不建用户,命中 uid 缓存跳过 DB。
 * request 可选:提供时支持 access 失效自动 refresh 续期。
 */
export async function getUserIdByToken(
  accessToken: string,
  request?: Request,
): Promise<string | null> {
  const info = await fetchCloudbaseUserInfo(accessToken, request)
  if (!info) {
    return null
  }
  // 命中缓存
  const cached = uidCache.get(info.uid)
  if (cached && cached.exp > Date.now()) {
    return cached.id
  }
  const pool = getPgPool()
  const client = await pool.connect()
  try {
    const res = await client.query(
      'SELECT id FROM public.app_users WHERE cloudbase_uid = $1',
      [info.uid],
    )
    if (res.rows.length === 0) {
      // 不缓存「不存在」:避免首次登录建用户前的竞态
      return null
    }
    const id = res.rows[0].id
    uidCache.set(info.uid, { id, exp: Date.now() + UID_CACHE_TTL })
    return id
  } finally {
    client.release()
  }
}

/**
 * 查询 cloudbase uid 对应的 app_users.id。只读,不建用户。
 * 用于业务 Route Handler 鉴权--调业务接口不应有建用户副作用。
 * 命中进程级 uid 缓存时跳过 DB 查询。
 */
export async function getUserIdFromCloudbase(ctx: {
  request: Request
}): Promise<string | null> {
  const accessToken = extractAccessToken(ctx.request)
  if (!accessToken) {
    return null
  }
  return getUserIdByToken(accessToken, ctx.request)
}

/**
 * 登录后调:确保 app_users + profiles 有记录,首次登录自动建立。
 * 幂等(ON CONFLICT),返回 app_users.id。供 /api/auth/refresh 用。
 * (DB-P0-02) 复用进程级 Pool。
 */
export async function ensureAppUser(accessToken: string): Promise<string | null> {
  const info = await fetchCloudbaseUserInfo(accessToken)
  if (!info) {
    return null
  }
  // email 缺失时兜底(uid@cloudbase),满足 NOT NULL + UNIQUE
  const email = info.email ?? `${info.uid}@cloudbase`
  const pool = getPgPool()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    try {
      const { rows } = await client.query(
        `INSERT INTO public.app_users (cloudbase_uid, email)
         VALUES ($1, $2)
         ON CONFLICT (cloudbase_uid) DO UPDATE SET updated_at = now()
         RETURNING id`,
        [info.uid, email],
      )
      const id = rows[0].id
      await client.query(
        `INSERT INTO public.profiles (id, email)
         VALUES ($1, $2)
         ON CONFLICT (id) DO NOTHING`,
        [id, email],
      )
      await client.query('COMMIT')
      return id
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    }
  } finally {
    client.release()
  }
}
