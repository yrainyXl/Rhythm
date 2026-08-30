import { NextResponse } from 'next/server'
import { verifySession } from '@/lib/server/session'
import { getSessionToken } from '@/lib/server/cookies'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET /api/auth/me - 校验当前会话,返回是否已认证。 */
export async function GET(request: Request) {
  try {
    const token = getSessionToken(request)
    const userId = token ? await verifySession(token) : null

    if (!userId) {
      return NextResponse.json(
        { success: false, authenticated: false, message: 'No valid session' },
        { status: 401 },
      )
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      userId,
      message: 'Session validated successfully',
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: 'Auth validation failed',
      },
      { status: 500 },
    )
  }
}
