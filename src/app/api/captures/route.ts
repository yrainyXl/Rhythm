import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface CaptureRow {
  id: string
  user_id: string
  local_date: string
  content: string
  created_at: string
}

/** GET /api/captures?date=YYYY-MM-DD - 当天想法列表(按时间倒序)。 */
export async function GET(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    const date = new URL(request.url).searchParams.get('date')
    if (!date) {
      return NextResponse.json({ error: 'date 必填' }, { status: 400 })
    }
    const res = await db.query<CaptureRow>(
      `SELECT * FROM public.daily_captures
       WHERE user_id = $1 AND local_date = $2
       ORDER BY created_at DESC`,
      [userId, date],
    )
    return NextResponse.json({ captures: res.rows })
  })
}

/** POST /api/captures - 创建一条想法。user_id 服务端解析。 */
export async function POST(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    const body = (await request.json().catch(() => null)) as { local_date?: string; content?: string } | null
    if (!body || !body.local_date || !body.content?.trim()) {
      return NextResponse.json({ error: 'local_date/content 必填' }, { status: 400 })
    }
    const res = await db.query<CaptureRow>(
      `INSERT INTO public.daily_captures (user_id, local_date, content)
       VALUES ($1, $2, $3) RETURNING *`,
      [userId, body.local_date, body.content.trim()],
    )
    return NextResponse.json({ capture: res.rows[0] }, { status: 201 })
  })
}
