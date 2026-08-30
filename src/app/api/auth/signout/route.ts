import { NextResponse, type NextRequest } from 'next/server'
import { deleteSession } from '@/lib/server/session'
import { getSessionToken, clearSessionCookie, clearLegacyCloudbaseCookies } from '@/lib/server/cookies'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** POST /api/auth/signout - 撤销会话并清除 cookie。 */
export async function POST(request: NextRequest) {
  const token = getSessionToken(request)
  if (token) {
    try {
      await deleteSession(token)
    } catch {
      // 撤销失败也继续清 cookie,避免前端卡在无法登出
    }
  }
  const res = NextResponse.json({ success: true })
  clearSessionCookie(res)
  clearLegacyCloudbaseCookies(res)
  return res
}
