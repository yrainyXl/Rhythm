import type { NextResponse } from 'next/server'

// httpOnly cookie 名:浏览器 JS 不可读,防 XSS 窃取 token。
// access_token 用于业务 API 鉴权;refresh_token 仅服务端用于续期。
export const ACCESS_COOKIE = 'cb_access_token'
export const REFRESH_COOKIE = 'cb_refresh_token'

const isProd = process.env.NODE_ENV === 'production'

/** 写入 access/refresh token cookie(httpOnly)。days=0 表示会话级(浏览器关即失效)。 */
export function setAuthCookies(
  res: NextResponse,
  tokens: { access_token: string; refresh_token: string },
) {
  res.cookies.set(ACCESS_COOKIE, tokens.access_token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 7200, // 2h,与 access_token expires_in 对齐
  })
  res.cookies.set(REFRESH_COOKIE, tokens.refresh_token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30d,refresh_token 长效
  })
}

/** 清除 token cookie。 */
export function clearAuthCookies(res: NextResponse) {
  res.cookies.set(ACCESS_COOKIE, '', { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/', maxAge: 0 })
  res.cookies.set(REFRESH_COOKIE, '', { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/', maxAge: 0 })
}

/** 从请求读 access_token:优先 cookie,fallback Authorization Bearer(过渡兼容)。 */
export function getAccessToken(request: Request): string | null {
  // cookie
  const cookieHeader = request.headers.get('cookie') ?? ''
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${ACCESS_COOKIE}=`))
  if (match) return decodeURIComponent(match.split('=')[1] ?? '')

  // Bearer header(过渡:前端未带 cookie 时)
  const authHeader = request.headers.get('authorization')
  return authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
}

/** 从请求读 refresh_token(仅 cookie)。 */
export function getRefreshToken(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${REFRESH_COOKIE}=`))
  return match ? decodeURIComponent(match.split('=')[1] ?? '') : null
}
