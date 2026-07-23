import { NextResponse } from 'next/server'
import { createPgPool, ensureAppUser } from '@/lib/cloudbase/server'

export const dynamic = 'force-dynamic'

/**
 * 登录后/会话恢复时调:确保 app_users + profiles 已建立(首次登录自动建),
 * 返回当前 profile 供前端 hydrate。
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!accessToken) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  const userId = await ensureAppUser(accessToken)
  if (!userId) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  const pool = createPgPool()
  const client = await pool.connect()
  try {
    const res = await client.query(
      `SELECT id, email, nickname, avatar_url, timezone,
              preferred_wake_time, preferred_sleep_time, work_days
       FROM public.profiles WHERE id = $1`,
      [userId],
    )
    return NextResponse.json({ user: res.rows[0] ?? null })
  } finally {
    client.release()
    await pool.end()
  }
}
