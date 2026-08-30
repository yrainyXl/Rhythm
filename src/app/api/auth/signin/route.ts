import { NextResponse, type NextRequest } from 'next/server'
import { verifyPassword } from '@/lib/server/password'
import { createSession } from '@/lib/server/session'
import { getPgPool } from '@/lib/server/pg'
import { setSessionCookie, clearLegacyCloudbaseCookies } from '@/lib/server/cookies'
import { isLoginBlocked, recordLoginFailure, clearLoginFailures, clientIp } from '@/lib/server/login-throttle'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/signin - 本地口令登录(替换 CloudBase 网关)。
 * 成功:建会话 → 写 httpOnly cookie(rhythm_session)+ 返回 profile。
 * 登录标识为 email(账号由管理员经 scripts/create-user.mjs 创建)。
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { username?: string; password?: string } | null
  const username = body?.username?.trim()
  const password = body?.password
  if (!username || !password) {
    return NextResponse.json({ error: '邮箱和密码必填' }, { status: 400 })
  }

  // 应用层失败退避(第二道防线;第一道是 nginx limit_req)
  const throttleKey = `${clientIp(request)}:${username}`
  const blocked = isLoginBlocked(throttleKey)
  if (blocked.blocked) {
    return NextResponse.json(
      { error: `尝试过于频繁,请 ${blocked.retryAfterSec} 秒后重试` },
      { status: 429, headers: { 'Retry-After': String(blocked.retryAfterSec) } },
    )
  }

  try {
    const pool = getPgPool()
    const client = await pool.connect()
    let profile: unknown = null
    try {
      const res = await client.query(
        `SELECT id, password_hash FROM public.app_users WHERE email = $1`,
        [username],
      )
      if (res.rows.length === 0) {
        recordLoginFailure(throttleKey)
        return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 })
      }
      const row = res.rows[0]
      if (!row.password_hash) {
        // 迁移过渡期:已存在用户但未设口令
        return NextResponse.json(
          { error: '该账号尚未初始化口令,请联系管理员' },
          { status: 401 },
        )
      }
      const ok = await verifyPassword(password, row.password_hash as string)
      if (!ok) {
        recordLoginFailure(throttleKey)
        return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 })
      }
      clearLoginFailures(throttleKey)

      const userId = row.id as string
      const token = await createSession(userId, client)

      const p = await client.query(
        `SELECT id, email, nickname, avatar_url, timezone,
                preferred_wake_time, preferred_sleep_time, work_days
         FROM public.profiles WHERE id = $1`,
        [userId],
      )
      profile = p.rows[0] ?? null
      const response = NextResponse.json({ user: profile })
      setSessionCookie(response, token)
      clearLegacyCloudbaseCookies(response)
      return response
    } finally {
      client.release()
    }
  } catch (e) {
    const tag = e instanceof Error ? e.message.slice(0, 80) : 'signin-error'
    return NextResponse.json(
      { error: '登录失败,请重试' },
      { status: 500, headers: { 'x-error-tag': `signin:${tag}` } },
    )
  }
}
