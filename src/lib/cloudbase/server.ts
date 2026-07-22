import cloudbase from '@cloudbase/node-sdk'
import { Pool } from 'pg'
import { cloudbaseEnv } from './env'

export function createCloudbaseServer() {
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
      : undefined,
  })
}

export async function getUserIdFromCloudbase(ctx: {
  cloudbase: cloudbase.CloudBase
  request: Request
}): Promise<string | null> {
  const auth = ctx.cloudbase.auth()
  // Extract Cloudbase session token from authorization header
  const authHeader = ctx.request.headers.get('authorization')
  const sessionToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : undefined

  // Build IContextParam with the right info
  const context: cloudbase.IContextParam = {
    memory_limit_in_mb: 128,
    time_limit_in_ms: 10000,
    request_id: '',
    function_version: 'v1',
    function_name: '',
    namespace: 'default',
    environ: JSON.stringify({
      TCB_SESSIONTOKEN: sessionToken,
    }),
  }

  const ticket = await auth.getAuthContext(context)
  if (!ticket?.openId) {
    return null
  }
  // 查询 app_users 映射: cloudbase_uid = openId → id
  const pool = createPgPool()
  const client = await pool.connect()
  try {
    const res = await client.query(
      'SELECT id FROM public.app_users WHERE cloudbase_uid = $1',
      [ticket.openId],
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
