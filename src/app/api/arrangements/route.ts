import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'

type Band = 'morning' | 'afternoon' | 'evening' | 'night'

interface ArrangementRow {
  id: string
  user_id: string
  local_date: string
  band: Band
  scheduled_time: string | null
  title: string
  status: 'pending' | 'done' | 'cancelled'
  sort_order: number
  created_at: string
  updated_at: string
}

/** GET /api/arrangements?date=YYYY-MM-DD - 当天安排,按 band+sort_order 排序。 */
export async function GET(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    const date = new URL(request.url).searchParams.get('date')
    if (!date) {
      return NextResponse.json({ error: 'date 必填' }, { status: 400 })
    }
    const res = await db.query<ArrangementRow>(
      `SELECT * FROM public.daily_arrangements
       WHERE user_id = $1 AND local_date = $2
       ORDER BY band, sort_order, created_at`,
      [userId, date],
    )
    return NextResponse.json({ arrangements: res.rows })
  })
}

interface CreateBody {
  local_date: string
  band: Band
  title: string
  scheduled_time?: string | null
}

/** POST /api/arrangements - 创建安排。user_id 服务端解析。 */
export async function POST(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    const body = (await request.json().catch(() => null)) as CreateBody | null
    if (!body || !body.local_date || !body.band || !body.title?.trim()) {
      return NextResponse.json({ error: 'local_date/band/title 必填' }, { status: 400 })
    }
    // sort_order 取该 band 当天最大值+1
    const maxRes = await db.query<{ m: number | null }>(
      `SELECT COALESCE(MAX(sort_order), -1) AS m FROM public.daily_arrangements
       WHERE user_id = $1 AND local_date = $2 AND band = $3`,
      [userId, body.local_date, body.band],
    )
    const sortOrder = (maxRes.rows[0].m ?? -1) + 1
    const res = await db.query<ArrangementRow>(
      `INSERT INTO public.daily_arrangements
         (user_id, local_date, band, scheduled_time, title, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, body.local_date, body.band, body.scheduled_time ?? null, body.title.trim(), sortOrder],
    )
    return NextResponse.json({ arrangement: res.rows[0] }, { status: 201 })
  })
}
