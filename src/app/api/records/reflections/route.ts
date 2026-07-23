import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'

interface ReflectionBody {
  local_date: string
  mood?: 'great' | 'fair' | 'poor' | null
  best_thing?: string | null
  improve_thing?: string | null
  tomorrow_focus?: string | null
  note?: string | null
  is_shared?: boolean
}

/**
 * GET /api/records/reflections - 查询复盘。
 * ?date=YYYY-MM-DD:返回当天单条(maybeSingle)。
 * 无参:返回最近 90 条历史(按 local_date 倒序)。
 */
export async function GET(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    const date = new URL(request.url).searchParams.get('date')

    if (date) {
      const res = await db.query(
        `SELECT * FROM public.daily_reflections
         WHERE user_id = $1 AND local_date = $2`,
        [userId, date],
      )
      return NextResponse.json({ reflection: res.rows[0] ?? null })
    }

    const res = await db.query(
      `SELECT * FROM public.daily_reflections
       WHERE user_id = $1
       ORDER BY local_date DESC
       LIMIT 90`,
      [userId],
    )
    return NextResponse.json({ reflections: res.rows })
  })
}

/** POST /api/records/reflections - upsert 当天复盘(unique user_id,local_date)。 */
export async function POST(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    const body = (await request.json().catch(() => null)) as ReflectionBody | null
    if (!body || !body.local_date) {
      return NextResponse.json({ error: 'local_date 必填' }, { status: 400 })
    }

    const res = await db.query(
      `INSERT INTO public.daily_reflections
         (user_id, local_date, mood, best_thing, improve_thing,
          tomorrow_focus, note, is_shared)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (user_id, local_date)
       DO UPDATE SET mood = EXCLUDED.mood, best_thing = EXCLUDED.best_thing,
                     improve_thing = EXCLUDED.improve_thing, tomorrow_focus = EXCLUDED.tomorrow_focus,
                     note = EXCLUDED.note, is_shared = EXCLUDED.is_shared
       RETURNING *`,
      [
        userId,
        body.local_date,
        body.mood ?? null,
        body.best_thing ?? null,
        body.improve_thing ?? null,
        body.tomorrow_focus ?? null,
        body.note ?? null,
        body.is_shared ?? false,
      ],
    )
    return NextResponse.json({ reflection: res.rows[0] })
  })
}
