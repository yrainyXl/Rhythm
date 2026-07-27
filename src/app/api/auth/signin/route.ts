import { NextResponse, type NextRequest } from 'next/server'
import { signinWithPassword, ensureAppUser, getPgPool } from '@/lib/cloudbase/server'
import { setAuthCookies } from '@/lib/cloudbase/auth-cookie'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/signin - 服务端代理登录(避开浏览器直连网关的 CORS)。
 * 成功:写 httpOnly cookie(access/refresh token)+ 建 app_users/profiles + 返回 profile。
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { username?: string; password?: string } | null
  const username = body?.username?.trim()
  const password = body?.password
  if (!username || !password) {
    return NextResponse.json({ error: '邮箱和密码必填' }, { status: 400 })
  }

  const tokens = await signinWithPassword(username, password)
  if (!tokens) {
    return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 })
  }

  // 建 app_users/profiles(首次登录自动建)
  const userId = await ensureAppUser(tokens.access_token)
  if (!userId) {
    return NextResponse.json({ error: '登录后建立用户记录失败' }, { status: 500 })
  }

  // 取 profile 返回前端 hydrate
  const pool = getPgPool()
  const client = await pool.connect()
  let profile = null
  try {
    const res = await client.query(
      `SELECT id, email, nickname, avatar_url, timezone,
              preferred_wake_time, preferred_sleep_time, work_days
       FROM public.profiles WHERE id = $1`,
      [userId],
    )
    profile = res.rows[0] ?? null
  } finally {
    client.release()
  }

  const res = NextResponse.json({ user: profile })
  setAuthCookies(res, tokens)
  return res
}
