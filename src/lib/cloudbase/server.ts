import { Pool } from 'pg'
import { cloudbaseEnv } from './env'

// Import cloudbase dynamically because webpack/Next.js static analysis
// will error on dynamic code evaluation inside @cloudbase/node-sdk
// even though we explicitly use nodejs runtime in middleware
let cloudbaseModule: any = null
function getCloudbase() {
  if (!cloudbaseModule) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    cloudbaseModule = require('@cloudbase/node-sdk')
  }
  // require returns the module directly in CommonJS
  return cloudbaseModule.default || cloudbaseModule
}

export function createCloudbaseServer() {
  const cloudbase = getCloudbase()
  return cloudbase.init({
    env: cloudbaseEnv.NEXT_PUBLIC_CLOUDBASE_ENV_ID,
    secretId: cloudbaseEnv.CLOUDBASE_SECRET_ID,
    secretKey: cloudbaseEnv.CLOUDBASE_SECRET_KEY,
  })
}

export function createPgPool() {
  return new Pool({
    host: cloudbaseEnv.TENCENTDB_HOST,
    port: cloudbaseEnv.TENCENTDB_PORT,
    user: cloudbaseEnv.TENCENTDB_USER,
    password: cloudbaseEnv.TENCENTDB_PASSWORD,
    database: cloudbaseEnv.TENCENTDB_DATABASE,
    ssl: cloudbaseEnv.TENCENTDB_SSL
      ? { rejectUnauthorized: false }
      : false,
  })
}

interface CloudbaseUserInfo {
  sub: string
  user_id?: string
  username?: string
  email?: string
  status?: string
}

/**
 * 用浏览器传来的 CloudBase access_token 调用 userinfo 端点,换取 cloudbase uid。
 *
 * 设计说明:CloudBase node-sdk 的 getAuthContext/getUserInfo 只在 SCF 云函数运行时
 * 由平台注入身份字段,在 Next.js Route Handler(Vercel)中无法工作(返回空)。
 * 改用标准 OAuth2 userinfo 端点(/auth/v1/user/me)——浏览器登录后持有的 RS256
 * access_token(JWT)是标准 Bearer 凭证,带它打 userinfo 即可换出 uid,
 * 同时 status 字段可校验账号是否仍有效。无需 SCF,无需验签库。
 */
async function fetchCloudbaseUid(accessToken: string): Promise<string | null> {
  const envId = cloudbaseEnv.NEXT_PUBLIC_CLOUDBASE_ENV_ID
  const url = `https://${envId}.api.tcloudbasegateway.com/auth/v1/user/me`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })
  if (!res.ok) {
    return null
  }
  const info = (await res.json()) as CloudbaseUserInfo
  if (!info || (info.status && info.status !== 'ACTIVE')) {
    return null
  }
  const uid = info.user_id || info.sub
  return uid ?? null
}

export async function getUserIdFromCloudbase(ctx: {
  request: Request
}): Promise<string | null> {
  const authHeader = ctx.request.headers.get('authorization')
  const accessToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : undefined

  if (!accessToken) {
    return null
  }

  const cloudbaseUid = await fetchCloudbaseUid(accessToken)
  if (!cloudbaseUid) {
    return null
  }

  // 查询 app_users 映射: cloudbase_uid = uid -> id
  const pool = createPgPool()
  const client = await pool.connect()
  try {
    const res = await client.query(
      'SELECT id FROM public.app_users WHERE cloudbase_uid = $1',
      [cloudbaseUid],
    )
    if (res.rows.length === 0) {
      return null
    }
    return res.rows[0].id
  } finally {
    client.release()
    await pool.end()
  }
}
