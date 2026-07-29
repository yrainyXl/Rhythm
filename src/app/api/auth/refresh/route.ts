import { NextResponse, type NextRequest } from 'next/server'
import { getPgPool, ensureAppUser, refreshTokens, getUserIdByToken } from '@/lib/cloudbase/server'
import { getAccessToken, getRefreshToken, setAuthCookies } from '@/lib/cloudbase/auth-cookie'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/refresh - 恢复会话,返回当前 profile。
 * 老用户走只读 getUserIdByToken(命中 uid 缓存,0 次 DB),省 ensureAppUser 的 2 次写。
 * 仅首次登录(用户不存在)才 ensureAppUser 建用户。
 */
export async function POST(request: NextRequest) {
  const accessToken = getAccessToken(request)
  const refreshToken = getRefreshToken(request)

  // 既无 access 也无 refresh:确实未登录
  if (!accessToken && !refreshToken) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  // 有 access_token:先只读取用户(命中缓存无 DB 往返)
  if (accessToken) {
    let userId = await getUserIdByToken(accessToken, request)
    if (!userId) {
      // 用户不存在(首次登录) -> 建用户
      userId = await ensureAppUser(accessToken)
    }
    if (userId) {
      const profile = await fetchProfile(userId)
      return NextResponse.json({ user: profile })
    }
    // access 失效,落到下面用 refresh 续期
  }

  // access 缺失或失效:用 refresh_token 续期
  if (!refreshToken) {
    return NextResponse.json({ user: null }, { status: 401 })
  }
  const refreshed = await refreshTokens(refreshToken)
  if (!refreshed) {
    return NextResponse.json({ user: null }, { status: 401 })
  }
  let userId = await getUserIdByToken(refreshed.access_token)
  if (!userId) {
    userId = await ensureAppUser(refreshed.access_token)
  }
  if (!userId) {
    return NextResponse.json({ user: null }, { status: 401 })
  }
  // 续期成功,刷新 cookie + 返回 profile
  const res = NextResponse.json({ user: await fetchProfile(userId) })
  setAuthCookies(res, refreshed)
  return res
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
