import { createRouteHandlerSupabaseClient } from '@/lib/supabase/route-handler'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { nickname, timezone, preferred_wake_time, preferred_sleep_time, work_days } = body

  const payload: Record<string, string | number[] | null> = {
    id: user.id,
    email: user.email ?? '',
    nickname: nickname || null,
    timezone: timezone || 'Asia/Shanghai',
    preferred_wake_time: preferred_wake_time || null,
    preferred_sleep_time: preferred_sleep_time || null,
  }

  if (work_days) {
    payload.work_days = work_days
  }

  const { error } = await supabase.from('profiles').upsert(payload)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
