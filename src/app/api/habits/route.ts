import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'

/** GET /api/habits — 列出当前用户的习惯(含 schedules),按 sort_order 排序。 */
export async function GET(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    const res = await db.query<{
      id: string
      user_id: string
      name: string
      category: string
      icon: string | null
      color: string
      target_type: string
      target_value: number | null
      target_unit: string | null
      is_important: boolean
      is_shared: boolean
      is_enabled: boolean
      sort_order: number
      created_at: string
      updated_at: string
      schedules: unknown[]
    }>(
      `SELECT h.*, COALESCE(
         (SELECT json_agg(s.*) FROM habit_schedules s WHERE s.habit_id = h.id),
         '[]'::json
       ) AS schedules
       FROM habits h
       WHERE h.user_id = $1
       ORDER BY h.sort_order`,
      [userId],
    )
    return NextResponse.json({ habits: res.rows })
  })
}

interface HabitCreateBody {
  name: string
  category?: string
  icon?: string | null
  color?: string
  target_type: string
  target_value?: number | null
  target_unit?: string | null
  is_important?: boolean
  is_shared?: boolean
  schedule_repeat_type: string
  schedule_repeat_days?: number[]
  schedule_start_date: string
  schedule_reminder_time?: string | null
}

/** POST /api/habits — 创建习惯及其调度。 */
export async function POST(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    const body = (await request.json()) as HabitCreateBody
    const isBoolean = body.target_type === 'boolean'

    const habitRes = await db.query<{ id: string }>(
      `INSERT INTO habits
         (user_id, name, category, icon, color, target_type, target_value, target_unit,
          is_important, is_shared)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id`,
      [
        userId,
        body.name,
        body.category ?? 'self_discipline',
        body.icon ?? null,
        body.color ?? '#0ea5e9',
        body.target_type,
        isBoolean ? null : (body.target_value ?? null),
        body.target_unit || null,
        body.is_important ?? false,
        body.is_shared ?? false,
      ],
    )
    const habitId = habitRes.rows[0].id

    await db.query(
      `INSERT INTO habit_schedules
         (habit_id, repeat_type, repeat_days, start_date, reminder_time)
       VALUES ($1,$2,$3,$4,$5)`,
      [
        habitId,
        body.schedule_repeat_type,
        body.schedule_repeat_days ?? [],
        body.schedule_start_date,
        body.schedule_reminder_time || null,
      ],
    )

    return NextResponse.json({ id: habitId }, { status: 201 })
  })
}
