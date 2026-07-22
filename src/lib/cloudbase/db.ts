import { NextResponse } from 'next/server'
import { createPgPool, getUserIdFromCloudbase } from './server'

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
 * 未登录返回 401,handler 内抛错返回 500。PG client 与 pool 在请求结束时自动释放。
 */
export async function withUser<T>(
  request: Request,
  handler: (userId: string, db: { query: PoolClientQuery; release: () => void }) => Promise<T>,
): Promise<Response> {
  const userId = await getUserIdFromCloudbase({ request })
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const pool = createPgPool()
  const client = await pool.connect()
  try {
    const wrapped = {
      query: ((client.query.bind(client) as unknown) as PoolClientQuery),
      release: () => client.release(),
    }
    const result = await handler(userId, wrapped)
    // handler 若已返回 Response 直接透传
    return result instanceof Response ? result : (NextResponse.json(result) as unknown as Response)
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: message }, { status: 500 })
  } finally {
    client.release()
    await pool.end()
  }
}

type PoolClientQuery = <T = unknown>(text: string, params?: unknown[]) => Promise<{ rows: T[]; rowCount: number }>
