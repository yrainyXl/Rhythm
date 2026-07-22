import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'

interface OccurrenceRow {
  id: string
  user_id: string
  habit_id: string
  local_date: string
  title_snapshot: string
  target_type_snapshot: string
  target_value_snapshot: number | null
  target_unit_snapshot: string | null
  status: string
  completed_at: string | null
  skipped_at: string | null
  note: string | null
  created_at: string
  updated_at: string
}

/** GET /api/habits/occurrences?date=YYYY-MM-DD - 列出指定日期的打卡记录。 */
export async function GET(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    const date = request.nextUrl.searchParams.get('date')
    if (!date) {
      return NextResponse.json({ error: 'date is required' }, { status: 400 })
    }
    const res = await db.query<OccurrenceRow>(
      `SELECT * FROM habit_occurrences
       WHERE user_id = $1 AND local_date = $2
       ORDER BY created_at`,
      [userId, date],
    )
    return NextResponse.json({ occurrences: res.rows })
  })
}
