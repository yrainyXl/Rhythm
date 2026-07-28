import { NextResponse } from 'next/server'
import type { PoolClient } from 'pg'
import { getPgPool, getUserIdFromCloudbase } from './server'

type QueryResult<T> = { rows: T[]; rowCount: number }
// rows 默认 any,与原 PoolClient.query 行为一致,避免每个调用点都要显式泛型
type QueryFn = <T = any>(text: string, params?: unknown[]) => Promise<QueryResult<T>>

/** withUser 传给 handler 的 db 对象:query + transaction。 */
export interface DbHandle {
  query: QueryFn
  /**
   * 在同一 client 上跑事务(BEGIN/COMMIT/ROLLBACK)。
   * 多表写入必须用,避免部分成功留下孤儿记录。(DB-P0-05)
   * fn 收一个 { query } 对象,语义与 db.query 一致。
   */
  transaction: <T>(fn: (q: { query: QueryFn }) => Promise<T>) => Promise<T>
}

/**
 * Route Handler 通用入口:鉴权并拿到 app_users.id + 一个 PG client。
 *
 * 用法:
 *   export async function GET(request: NextRequest) {
 *     return withUser(request, async (userId, db) => {
 *       const res = await db.query('SELECT * FROM habits WHERE user_id=$1', [userId])
 *       return NextResponse.json(res.rows)
 *     })
 *   }
 *
 * 多表写入:
 *   return withUser(request, async (userId, db) => {
 *     return db.transaction(async (tx) => {
 *       await tx.query('INSERT ...', [...])
 *       await tx.query('INSERT ...', [...])
 *       return NextResponse.json({ ok: true })
 *     })
 *   })
 *
 * 未登录返回 401,handler 内抛错返回 500。PG client 复用进程级 Pool。(DB-P0-01/02)
 */
export async function withUser<T>(
  request: Request,
  handler: (userId: string, db: DbHandle) => Promise<T>,
): Promise<Response> {
  let userId: string | null = null
  try {
    userId = await getUserIdFromCloudbase({ request })
  } catch (e) {
    // 诊断:鉴权环节抛异常(非 401),标注来源
    const tag = e instanceof Error ? e.message.slice(0, 60) : 'auth-error'
    return NextResponse.json(
      { error: '鉴权异常' },
      { status: 500, headers: { 'x-error-tag': `auth:${tag}` } },
    )
  }
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const pool = getPgPool()
  const client = await pool.connect()
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
  try {
    const result = await handler(userId, db)
    // handler 若已返回 Response 直接透传
    return result instanceof Response ? result : (NextResponse.json(result) as unknown as Response)
  } catch (e) {
    // 诊断:标注是连接/查询错误,不回显原始信息(安全)
    const tag = e instanceof Error ? e.message.slice(0, 60) : 'query-error'
    return NextResponse.json(
      { error: '操作失败,请重试' },
      { status: 500, headers: { 'x-error-tag': `db:${tag}` } },
    )
  } finally {
    client.release()
  }
}

// 保留 PoolClient 类型引用,避免误删
export type { PoolClient }
