import { NextResponse, type NextRequest } from 'next/server'
import { clearAuthCookies } from '@/lib/cloudbase/auth-cookie'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** POST /api/auth/signout - 清除 token cookie。 */
export async function POST(_request: NextRequest) {
  const res = NextResponse.json({ success: true })
  clearAuthCookies(res)
  return res
}
