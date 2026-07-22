import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'

interface HabitWithSchedule {
  id: string
  name: string
  target_type: string
  target_value: number | null
  target_unit: string | null
  schedules: {
    repeat_type: string
    repeat_days: number[]
    custom_dates: string[]
    start_date: string
    end_date: string | null
  }[]
}

/** POST /api/habits/occurrences/generate - 按调度为指定日期补齐缺失的打卡记录。 */
export async function POST(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    const body = (await request.json().catch(() => ({}))) as { local_date?: string }
    const localDate = body.local_date
    if (!localDate) {
      return NextResponse.json({ error: 'local_date is required' }, { status: 400 })
    }

    const habitsRes = await db.query<HabitWithSchedule>(
      `SELECT h.id, h.name, h.target_type, h.target_value, h.target_unit,
              COALESCE(
                (SELECT json_agg(s.*) FROM habit_schedules s WHERE s.habit_id = h.id),
                '[]'::json
              ) AS schedules
       FROM habits h
       WHERE h.user_id = $1 AND h.is_enabled = true`,
      [userId],
    )
    if (habitsRes.rows.length === 0) {
      return NextResponse.json({ generated: 0 })
    }

    const existing = await db.query<{ habit_id: string }>(
      'SELECT habit_id FROM habit_occurrences WHERE user_id = $1 AND local_date = $2',
      [userId, localDate],
    )
    const existingIds = new Set(existing.rows.map((r) => r.habit_id))

    const date = new Date(localDate + 'T00:00:00')
    const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay()

    const matches = (h: HabitWithSchedule): boolean => {
      if (existingIds.has(h.id)) return false
      const schedule = h.schedules[0]
      if (!schedule) return false
      if (date < new Date(schedule.start_date + 'T00:00:00')) return false
      if (schedule.end_date && date > new Date(schedule.end_date + 'T00:00:00')) return false
      switch (schedule.repeat_type) {
        case 'daily':
          return true
        case 'weekdays':
          return dayOfWeek >= 1 && dayOfWeek <= 5
        case 'weekends':
          return dayOfWeek >= 6
        case 'weekly':
          return schedule.repeat_days.includes(dayOfWeek)
        case 'custom':
          return schedule.custom_dates.includes(localDate)
        default:
          return false
      }
    }

    const toInsert = habitsRes.rows.filter(matches)
    if (toInsert.length === 0) {
      return NextResponse.json({ generated: 0 })
    }

    let inserted = 0
    for (const h of toInsert) {
      const r = await db.query(
        `INSERT INTO habit_occurrences
           (user_id, habit_id, local_date, title_snapshot,
            target_type_snapshot, target_value_snapshot, target_unit_snapshot)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (user_id, habit_id, local_date) DO NOTHING`,
        [
          userId, h.id, localDate, h.name,
          h.target_type, h.target_value, h.target_unit,
        ],
      )
      inserted += r.rowCount
    }
    return NextResponse.json({ generated: inserted })
  })
}
