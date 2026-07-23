import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'

interface SleepRecordBody {
  sleep_date: string
  sleep_time: string
  wake_date?: string | null
  wake_time?: string | null
  duration_minutes?: number | null
  quality?: 'great' | 'fair' | 'poor' | null
  pre_sleep_activities?: unknown
  note?: string | null
  is_shared?: boolean
}

/**
 * GET /api/records/sleep - 查询睡眠记录。
 * 无参:返回最近 1 条(recent)。?days=N:返回最近 N 天历史(按 sleep_date 倒序)。
 */
export async function GET(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    const url = new URL(request.url)
    const days = url.searchParams.get('days')

    if (days) {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - Number(days))
      const startStr = startDate.toISOString().split('T')[0]
      const res = await db.query(
        `SELECT * FROM public.sleep_records
         WHERE user_id = $1 AND sleep_date >= $2
         ORDER BY sleep_date DESC`,
        [userId, startStr],
      )
      return NextResponse.json({ records: res.rows })
    }

    const res = await db.query(
      `SELECT * FROM public.sleep_records
       WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [userId],
    )
    return NextResponse.json({ record: res.rows[0] ?? null })
  })
}

/** POST /api/records/sleep - 新增睡眠记录。user_id 由 token 解析,客户端不传。 */
export async function POST(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    const body = (await request.json().catch(() => null)) as SleepRecordBody | null
    if (!body || !body.sleep_date || !body.sleep_time) {
      return NextResponse.json({ error: 'sleep_date 和 sleep_time 必填' }, { status: 400 })
    }

    const res = await db.query(
      `INSERT INTO public.sleep_records
         (user_id, sleep_date, sleep_time, wake_date, wake_time, duration_minutes,
          quality, pre_sleep_activities, note, is_shared)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        userId,
        body.sleep_date,
        body.sleep_time,
        body.wake_date ?? null,
        body.wake_time ?? null,
        body.duration_minutes ?? null,
        body.quality ?? null,
        body.pre_sleep_activities
          ? JSON.stringify(body.pre_sleep_activities)
          : null,
        body.note ?? null,
        body.is_shared ?? false,
      ],
    )
    return NextResponse.json({ record: res.rows[0] }, { status: 201 })
  })
}
