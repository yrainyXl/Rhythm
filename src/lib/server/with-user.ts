import { NextResponse } from 'next/server'
import type { PoolClient } from 'pg'
import { getPgPool } from './pg'
import { verifySession } from './session'
import { getSessionToken } from './cookies'
import { formatServerTiming, type ServerTimingEntry } from '@/lib/server-timing'

type QueryResult<T> = { rows: T[]; rowCount: number }
// rows 默认 any,与原 PoolClient.query 行为一致,避免每个调用点都要显式泛型
type QueryFn = <T = any>(text: string, params?: unknown[]) => Promise<QueryResult<T>>

function withServerTiming(
  response: Response,
  entries: ServerTimingEntry[],
  startedAt: number,
): Response {
  const value = formatServerTiming([
    ...entries,
    { name: 'total', duration: performance.now() - startedAt },
  ])
  response.headers.set('Server-Timing', value)
  response.headers.set('X-Rhythm-Timing', value)
  return response
}

/** withUser 传给 handler 的 db 对象:query + transaction。 */
export interface DbHandle {
  query: QueryFn
  /**
   * 在同一 client 上跑事务(BEGIN/COMMIT/ROLLBACK)。
   * 多表写入必须用,避免部分成功留下孤儿记录。
   * fn 收一个 { query } 对象,语义与 db.query 一致。
   */
  transaction: <T>(fn: (q: { query: QueryFn }) => Promise<T>) => Promise<T>
}

/**
 * Route Handler 通用入口:鉴权并拿到 app_users.id + 一个 PG client。
 *
 * 与迁移前的区别:鉴权与会话校验、handler 复用同一条连接(先取连接,再在同一连接上
 * verifySession),消除旧实现「鉴权一条连接 + handler 一条连接」的双连接开销。
 *
 * 未登录返回 401,handler 内抛错返回 500。PG client 复用进程级 Pool。
 */
export async function withUser<T>(
  request: Request,
  handler: (userId: string, db: DbHandle) => Promise<T>,
): Promise<Response> {
  const startedAt = performance.now()
  const timings: ServerTimingEntry[] = []

  // 1) 取连接(先于鉴权,供鉴权与 handler 复用)
  const pool = getPgPool()
  const connectStartedAt = performance.now()
  let client: PoolClient
  try {
    client = await pool.connect()
  } catch (e) {
    timings.push({ name: 'db-connect', duration: performance.now() - connectStartedAt })
    const tag = e instanceof Error ? e.message.slice(0, 60) : 'connect-error'
    return withServerTiming(
      NextResponse.json(
        { error: '数据库连接失败,请重试' },
        { status: 500, headers: { 'x-error-tag': `db-connect:${tag}` } },
      ),
      timings,
      startedAt,
    )
  }
  timings.push({ name: 'db-connect', duration: performance.now() - connectStartedAt })

  // 2) 鉴权(同一连接)
  let userId: string | null = null
  const authStartedAt = performance.now()
  try {
    const token = getSessionToken(request)
    userId = token ? await verifySession(token, client) : null
  } catch (e) {
    timings.push({ name: 'auth', duration: performance.now() - authStartedAt })
    client.release()
    const tag = e instanceof Error ? e.message.slice(0, 60) : 'auth-error'
    return withServerTiming(
      NextResponse.json(
        { error: '鉴权异常' },
        { status: 500, headers: { 'x-error-tag': `auth:${tag}` } },
      ),
      timings,
      startedAt,
    )
  }
  timings.push({ name: 'auth', duration: performance.now() - authStartedAt })
  if (!userId) {
    client.release()
    return withServerTiming(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      timings,
      startedAt,
    )
  }

  // 3) handler(同一连接)
  const queryFn: QueryFn = ((text: string, params?: unknown[]) =>
    client.query(text, params as never[])) as QueryFn
  const tx = async <R>(fn: (q: { query: QueryFn }) => Promise<R>): Promise<R> => {
    await client.query('BEGIN')
    try {
      const r = await fn({ query: queryFn })
      await client.query('COMMIT')
      return r
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    }
  }
  const db: DbHandle = { query: queryFn, transaction: tx }

  const handlerStartedAt = performance.now()
  let response: Response
  try {
    const result = await handler(userId, db)
    response = result instanceof Response
      ? result
      : (NextResponse.json(result) as unknown as Response)
  } catch (e) {
    const tag = e instanceof Error ? e.message.slice(0, 60) : 'query-error'
    response = NextResponse.json(
      { error: '操作失败,请重试' },
      { status: 500, headers: { 'x-error-tag': `db:${tag}` } },
    )
  } finally {
    timings.push({ name: 'handler', duration: performance.now() - handlerStartedAt })
    client.release()
  }
  return withServerTiming(response, timings, startedAt)
}

// 保留 PoolClient 类型引用,避免误删
export type { PoolClient }
