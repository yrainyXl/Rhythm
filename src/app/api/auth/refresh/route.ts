import { NextResponse, type NextRequest } from 'next/server'
import { getPgPool } from '@/lib/server/pg'
import { verifySession } from '@/lib/server/session'
import { getSessionToken } from '@/lib/server/cookies'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/refresh - 会话恢复(前端每次加载/恢复页面时调用)。
 * 已从 CloudBase 网关迁移到本地 Session:校验 cookie 会话,返回当前 profile。
 * 不再签发任何新凭证(无 refresh token)。路由名保留以兼容前端。
 */
export async function POST(request: NextRequest) {
  const token = getSessionToken(request)
  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  let userId: string | null = null
  try {
    userId = await verifySession(token)
  } catch (e) {
    const tag = e instanceof Error ? e.message.slice(0, 60) : 'refresh-error'
    return NextResponse.json(
      { error: '会话校验失败' },
      { status: 500, headers: { 'x-error-tag': `refresh:${tag}` } },
    )
  }

  if (!userId) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  return NextResponse.json({ user: await fetchProfile(userId) })
}

async function fetchProfile(userId: string) {
  const pool = getPgPool()
  const client = await pool.connect()
  try {
    const res = await client.query(
      `SELECT id, email, nickname, avatar_url, timezone,
              preferred_wake_time, preferred_sleep_time, work_days
       FROM public.profiles WHERE id = $1`,
      [userId],
    )
    return res.rows[0] ?? null
  } finally {
    client.release()
  }
}
