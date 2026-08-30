import type { NextResponse } from 'next/server'

// httpOnly cookie：浏览器 JS 不可读，防 XSS 窃取。会话 token 由服务端校验。
export const SESSION_COOKIE = 'rhythm_session'

// 迁移前 CloudBase 时代的旧 cookie 名，signin/signout 时顺带清除，避免历史残留。
const LEGACY_COOKIE_NAMES = ['cb_access_token', 'cb_refresh_token']

function isSecureCookie(): boolean {
  if (process.env.AUTH_COOKIE_SECURE !== undefined) {
    return process.env.AUTH_COOKIE_SECURE === 'true'
  }
  return process.env.NODE_ENV === 'production'
}

function sessionMaxAgeSec(): number {
  // cookie 寿命对齐会话硬上限（90 天），滑动续期/撤销由服务端 DB 决定。
  const days = Number(process.env.SESSION_ABSOLUTE_TTL_DAYS ?? 90)
  return (Number.isFinite(days) && days > 0 ? days : 90) * 24 * 60 * 60
}

function cookieBase() {
  return {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: 'lax' as const,
    path: '/',
  }
}

/** 写会话 cookie（httpOnly，寿命对齐硬上限）。 */
export function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(SESSION_COOKIE, token, {
    ...cookieBase(),
    maxAge: sessionMaxAgeSec(),
  })
}

/** 清会话 cookie。 */
export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, '', { ...cookieBase(), maxAge: 0 })
}

/** 清迁移前 CloudBase 的旧 token cookie。 */
export function clearLegacyCloudbaseCookies(res: NextResponse) {
  for (const name of LEGACY_COOKIE_NAMES) {
    res.cookies.set(name, '', { ...cookieBase(), maxAge: 0 })
  }
}

/** 从请求读会话 token（仅 cookie，不再接受 Authorization Bearer）。 */
export function getSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE}=`))
  if (!match) return null
  const raw = match.slice(SESSION_COOKIE.length + 1)
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}
