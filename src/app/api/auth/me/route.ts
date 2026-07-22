import { NextResponse } from 'next/server'
import { getCloudbaseAppUserId } from '@/lib/cloudbase/route-handler'

export async function GET(request: Request) {
  try {
    const userId = await getCloudbaseAppUserId(request as any)

    if (!userId) {
      return NextResponse.json(
        { success: false, authenticated: false, message: 'No valid authentication' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      userId,
      message: 'Cloudbase Auth token validated successfully'
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: 'Auth validation failed'
      },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'