import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'

interface HabitUpdateBody {
  name?: string
  category?: string
  icon?: string | null
  color?: string
  target_type?: string
  target_value?: number | null
  target_unit?: string | null
  is_important?: boolean
  is_shared?: boolean
  schedule_repeat_type?: string
  schedule_repeat_days?: number[]
  schedule_start_date?: string
  schedule_reminder_time?: string | null
}

/** PUT /api/habits/[id] - 更新习惯及调度(upsert schedule)。 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return withUser(request, async (userId, db) => {
    const id = params.id
    const body = (await request.json()) as HabitUpdateBody
    const isBoolean = body.target_type ? body.target_type === 'boolean' : false

    await db.query(
      `UPDATE habits SET
         name = COALESCE($1, name),
         category = COALESCE($2, category),
         icon = COALESCE($3, icon),
         color = COALESCE($4, color),
         target_type = COALESCE($5, target_type),
         target_value = CASE WHEN $5 IS NOT NULL AND $5 = 'boolean' THEN NULL
                             WHEN $6 IS NOT NULL THEN $6 ELSE target_value END,
         target_unit = COALESCE($7, target_unit),
         is_important = COALESCE($8, is_important),
         is_shared = COALESCE($9, is_shared)
       WHERE id = $10 AND user_id = $11`,
      [
        body.name ?? null,
        body.category ?? null,
        body.icon ?? null,
        body.color ?? null,
        body.target_type ?? null,
        isBoolean ? null : (body.target_value ?? null),
        body.target_unit ?? null,
        body.is_important ?? null,
        body.is_shared ?? null,
        id,
        userId,
      ],
    )

    // schedule: 存在则更新,不存在则插入
    if (body.schedule_repeat_type || body.schedule_start_date) {
      const existing = await db.query<{ id: string }>(
        'SELECT id FROM habit_schedules WHERE habit_id = $1',
        [id],
      )
      if (existing.rows.length > 0) {
        await db.query(
          `UPDATE habit_schedules SET
             repeat_type = COALESCE($1, repeat_type),
             repeat_days = COALESCE($2, repeat_days),
             start_date = COALESCE($3, start_date),
             reminder_time = COALESCE($4, reminder_time)
           WHERE habit_id = $5`,
          [
            body.schedule_repeat_type ?? null,
            body.schedule_repeat_days ?? null,
            body.schedule_start_date ?? null,
            body.schedule_reminder_time ?? null,
            id,
          ],
        )
      } else {
        await db.query(
          `INSERT INTO habit_schedules
             (habit_id, repeat_type, repeat_days, start_date, reminder_time)
           VALUES ($1,$2,$3,$4,$5)`,
          [
            id,
            body.schedule_repeat_type ?? 'daily',
            body.schedule_repeat_days ?? [],
            body.schedule_start_date ?? new Date().toISOString().slice(0, 10),
            body.schedule_reminder_time || null,
          ],
        )
      }
    }

    return NextResponse.json({ success: true })
  })
}

/** PATCH /api/habits/[id] - 切换启用状态。body: { is_enabled: boolean } */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return withUser(request, async (userId, db) => {
    const body = (await request.json().catch(() => ({}))) as { is_enabled?: boolean }
    await db.query(
      'UPDATE habits SET is_enabled = $1 WHERE id = $2 AND user_id = $3',
      [body.is_enabled ?? true, params.id, userId],
    )
    return NextResponse.json({ success: true })
  })
}

/** DELETE /api/habits/[id] - 软删除(置 is_enabled=false),与原 store 行为一致。 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return withUser(request, async (userId, db) => {
    await db.query(
      'UPDATE habits SET is_enabled = false WHERE id = $1 AND user_id = $2',
      [params.id, userId],
    )
    return NextResponse.json({ success: true })
  })
}
