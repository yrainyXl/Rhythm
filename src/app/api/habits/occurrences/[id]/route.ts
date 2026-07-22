import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'

interface CompleteBody {
  actual_value?: number | null
  actual_duration?: number | null
  feeling?: number | null
  note?: string | null
}

/**
 * POST /api/habits/occurrences/[id]?action=complete|skip|reset
 * 完成打卡 / 跳过 / 重置。action 默认 complete。
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return withUser(request, async (userId, db) => {
    const occurrenceId = params.id
    const action = request.nextUrl.searchParams.get('action') ?? 'complete'
    const now = new Date().toISOString()

    // 校验该 occurrence 属于当前用户
    const own = await db.query<{ id: string }>(
      'SELECT id FROM habit_occurrences WHERE id = $1 AND user_id = $2',
      [occurrenceId, userId],
    )
    if (own.rows.length === 0) {
      return NextResponse.json({ error: 'not found' }, { status: 404 })
    }

    if (action === 'reset') {
      await db.query(
        `UPDATE habit_occurrences
           SET status = 'pending', completed_at = null, skipped_at = null, note = null
         WHERE id = $1`,
        [occurrenceId],
      )
      await db.query('DELETE FROM habit_logs WHERE occurrence_id = $1', [occurrenceId])
      return NextResponse.json({ status: 'pending' })
    }

    if (action === 'skip') {
      await db.query(
        `UPDATE habit_occurrences SET status = 'skipped', skipped_at = $1 WHERE id = $2`,
        [now, occurrenceId],
      )
      return NextResponse.json({ status: 'skipped', skipped_at: now })
    }

    // complete
    const body = (await request.json().catch(() => ({}))) as CompleteBody
    await db.query(
      `UPDATE habit_occurrences
         SET status = 'done', completed_at = $1, note = COALESCE($2, note)
       WHERE id = $3`,
      [now, body.note ?? null, occurrenceId],
    )
    await db.query(
      `INSERT INTO habit_logs
         (occurrence_id, user_id, actual_value, actual_duration, feeling, note)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        occurrenceId,
        userId,
        body.actual_value ?? null,
        body.actual_duration ?? null,
        body.feeling ?? null,
        body.note ?? null,
      ],
    )
    return NextResponse.json({ status: 'done', completed_at: now })
  })
}
