import { createHash, randomBytes } from 'crypto'
import type { PoolClient } from 'pg'
import { getPgPool } from './pg'
import { env } from './env'

type QueryFn = (text: string, params?: unknown[]) => Promise<{ rows: any[] }>

function sha256hex(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

// 在给定 client 上跑一段查询;未传 client 时自取连接并释放。
async function withSessionClient<T>(
  client: PoolClient | undefined,
  fn: (q: QueryFn) => Promise<T>,
): Promise<T> {
  if (client) {
    const q: QueryFn = (text, params) => client.query(text, params as never[])
    return fn(q)
  }
  const pool = getPgPool()
  const c = await pool.connect()
  try {
    const q: QueryFn = (text, params) => c.query(text, params as never[])
    return await fn(q)
  } finally {
    c.release()
  }
}

/** 新建会话,返回原始 token(写入 cookie)。库中只存其 SHA-256 哈希。 */
export async function createSession(userId: string, client?: PoolClient): Promise<string> {
  const token = randomBytes(32).toString('base64url')
  const hash = sha256hex(token)
  const ttlDays = env.SESSION_TTL_DAYS
  const absDays = env.SESSION_ABSOLUTE_TTL_DAYS
  await withSessionClient(client, (q) =>
    q(
      `INSERT INTO public.sessions (token_hash, user_id, expires_at, absolute_expires_at)
       VALUES ($1, $2, now() + make_interval(days => $3), now() + make_interval(days => $4))`,
      [hash, userId, ttlDays, absDays],
    ),
  )
  return token
}

/**
 * 校验会话,返回 user_id | null。
 * 流程:哈希 token → 索引查询 → 无行返回 null → 过期(空闲或硬上限)则 DELETE 后返回 null
 * → 剩余 < TTL/2 则滑动续期 expires_at(absolute_expires_at 永不刷新)→ 返回 user_id。
 */
export async function verifySession(token: string, client?: PoolClient): Promise<string | null> {
  if (!token) return null
  const hash = sha256hex(token)
  const ttlDays = env.SESSION_TTL_DAYS
  const slideDays = Math.max(1, Math.floor(ttlDays / 2))
  return withSessionClient(client, async (q) => {
    const res = await q(
      `SELECT user_id,
              (expires_at < now()) AS is_expired,
              (absolute_expires_at < now()) AS is_abs_expired,
              (expires_at < now() + make_interval(days => $2)) AS should_slide
       FROM public.sessions WHERE token_hash = $1`,
      [hash, slideDays],
    )
    if (res.rows.length === 0) return null
    const row = res.rows[0]
    if (row.is_expired || row.is_abs_expired) {
      await q('DELETE FROM public.sessions WHERE token_hash = $1', [hash])
      return null
    }
    if (row.should_slide) {
      await q(
        `UPDATE public.sessions
         SET expires_at = now() + make_interval(days => $2), last_used_at = now()
         WHERE token_hash = $1`,
        [hash, ttlDays],
      )
    }
    return row.user_id as string
  })
}

/** 撤销单个会话(登出)。 */
export async function deleteSession(token: string): Promise<void> {
  if (!token) return
  const hash = sha256hex(token)
  await withSessionClient(undefined, (q) =>
    q('DELETE FROM public.sessions WHERE token_hash = $1', [hash]),
  )
}

/** 撤销某用户全部会话(改密/踢人用)。 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
  await withSessionClient(undefined, (q) =>
    q('DELETE FROM public.sessions WHERE user_id = $1', [userId]),
  )
}
