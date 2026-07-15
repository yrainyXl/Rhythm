import { NextResponse } from 'next/server'
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/route-handler'

export const dynamic = 'force-dynamic'

const SERVER_AUTH_TIMEOUT_MS = 10_000
const NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
  Expires: '0',
  Pragma: 'no-cache',
}

export async function POST() {
  const supabase = createRouteHandlerSupabaseClient()
  const timeout = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), SERVER_AUTH_TIMEOUT_MS)
  )
  const result = await Promise.race([supabase.auth.getUser(), timeout])

  if (!result) {
    return NextResponse.json(
      { error: 'Auth refresh timed out' },
      { status: 504, headers: NO_STORE_HEADERS }
    )
  }

  const { data, error } = result
  if (error || !data.user) {
    return NextResponse.json({ user: null }, { status: 401, headers: NO_STORE_HEADERS })
  }

  return NextResponse.json(
    { user: data.user },
    {
      headers: NO_STORE_HEADERS,
    }
  )
}
