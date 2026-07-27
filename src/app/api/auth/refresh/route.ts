import { NextResponse, type NextRequest } from 'next/server'
import { getPgPool, ensureAppUser, refreshTokens, getUserIdFromCloudbase } from '@/lib/cloudbase/server'
import { getAccessToken, getRefreshToken, setAuthCookies } from '@/lib/cloudbase/auth-cookie'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/refresh - 恢复会话/确保 app_users + profiles 已建立,返回当前 profile。
 * token 来源:httpOnly cookie(主),Authorization Bearer(过渡兼容)。
 * access_token 失效时用 refresh_token 续期并刷新 cookie。
 */
export async function POST(request: NextRequest) {
  const accessToken = getAccessToken(request)
  if (!accessToken) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  // 先尝试用现有 access_token 取/建用户
  let userId = await ensureAppUser(accessToken)

  // access_token 失效 -> 用 refresh_token 续期后重试
  if (!userId) {
    const refreshToken = getRefreshToken(request)
    if (!refreshToken) {
      return NextResponse.json({ user: null }, { status: 401 })
    }
    const refreshed = await refreshTokens(refreshToken)
    if (!refreshed) {
      return NextResponse.json({ user: null }, { status: 401 })
    }
    userId = await ensureAppUser(refreshed.access_token)
    if (!userId) {
      return NextResponse.json({ user: null }, { status: 401 })
    }
    // 续期成功,刷新 cookie + 用新 token 取 profile
    const res = NextResponse.json({ user: await fetchProfile(userId) })
    setAuthCookies(res, refreshed)
    return res
  }

  // 兼容过渡:Bearer 请求(前端未带 cookie 时)走老路径
  // 正常 cookie 请求 userId 已拿到
  const profile = await fetchProfile(userId)
  return NextResponse.json({ user: profile })
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
