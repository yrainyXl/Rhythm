import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'

interface ProfileBody {
  nickname?: string | null
  timezone?: string | null
  preferred_wake_time?: string | null
  preferred_sleep_time?: string | null
  work_days?: number[] | null
}

/** POST /api/profile - 保存当前用户资料(首次写入 / 后续更新)。 */
export async function POST(request: NextRequest) {
  return withUser(request, async (_userId, db) => {
    const body = (await request.json().catch(() => null)) as ProfileBody | null
    if (!body) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    const setClauses: string[] = []
    const params: unknown[] = []
    const push = (col: string, val: unknown) => {
      params.push(val)
      setClauses.push(`${col} = $${params.length}`)
    }

    if (body.nickname !== undefined) push('nickname', body.nickname || null)
    if (body.timezone !== undefined) push('timezone', body.timezone || 'Asia/Shanghai')
    if (body.preferred_wake_time !== undefined)
      push('preferred_wake_time', body.preferred_wake_time || null)
    if (body.preferred_sleep_time !== undefined)
      push('preferred_sleep_time', body.preferred_sleep_time || null)
    if (body.work_days !== undefined) push('work_days', body.work_days ?? [1, 2, 3, 4, 5])

    if (setClauses.length === 0) {
      return NextResponse.json({ success: true })
    }

    await db.query(
      `UPDATE public.profiles
       SET ${setClauses.join(', ')}
       WHERE id = $${params.length + 1}`,
      [...params, _userId],
    )

    return NextResponse.json({ success: true })
  })
}
