import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/server/with-user'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/**
 * GET /api/today/week?date=YYYY-MM-DD
 * 截止 date 的最近 7 天里，哪些天留下过记录（实践记录、想法、完成的习惯/安排、每日复盘）。
 */
export async function GET(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    const date = new URL(request.url).searchParams.get('date')
    if (!date || !DATE_RE.test(date)) {
      return NextResponse.json({ error: 'date 必填，格式 YYYY-MM-DD' }, { status: 400 })
    }
    const res = await db.query<{ local_date: string; n: number }>(
      `WITH win AS (SELECT ($2::date - 6) AS start_date, $2::date AS end_date),
       entries AS (
         SELECT local_date FROM public.practice_logs, win
           WHERE user_id = $1 AND local_date BETWEEN win.start_date AND win.end_date
         UNION ALL
         SELECT local_date FROM public.daily_captures, win
           WHERE user_id = $1 AND local_date BETWEEN win.start_date AND win.end_date
         UNION ALL
         SELECT local_date FROM public.habit_occurrences, win
           WHERE user_id = $1 AND status = 'done' AND local_date BETWEEN win.start_date AND win.end_date
         UNION ALL
         SELECT local_date FROM public.daily_arrangements, win
           WHERE user_id = $1 AND status = 'done' AND local_date BETWEEN win.start_date AND win.end_date
         UNION ALL
         SELECT local_date FROM public.daily_reflections, win
           WHERE user_id = $1 AND local_date BETWEEN win.start_date AND win.end_date
       )
       SELECT to_char(local_date, 'YYYY-MM-DD') AS local_date, count(*)::int AS n
       FROM entries GROUP BY local_date`,
      [userId, date],
    )
    const counts = new Map(res.rows.map((r) => [r.local_date, r.n]))
    const [y, m, d] = date.split('-').map(Number)
    const days = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(Date.UTC(y, m - 1, d - 6 + i))
      const iso = day.toISOString().slice(0, 10)
      return { date: iso, count: counts.get(iso) ?? 0 }
    })
    return NextResponse.json({ days })
  })
}
