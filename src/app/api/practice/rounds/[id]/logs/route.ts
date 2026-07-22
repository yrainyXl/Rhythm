import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'

/** GET /api/practice/rounds/[id]/logs - 列出某轮的打卡日志。 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return withUser(request, async (userId, db) => {
    const res = await db.query(
      `SELECT * FROM practice_logs
       WHERE user_id = $1 AND round_id = $2
       ORDER BY local_date DESC`,
      [userId, params.id],
    )
    return NextResponse.json({ logs: res.rows })
  })
}

interface UpsertLogBody {
  localDate: string
  status: string
  note?: string
}

/** POST /api/practice/rounds/[id]/logs - upsert 某轮某日日志(按 round+date 唯一)。 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return withUser(request, async (userId, db) => {
    const roundId = params.id
    const body = (await request.json()) as UpsertLogBody
    if (!body.localDate) return NextResponse.json({ error: 'localDate required' }, { status: 400 })

    // 校验 round 属于该用户
    const own = await db.query('SELECT id FROM practice_rounds WHERE id = $1 AND user_id = $2', [roundId, userId])
    if (own.rows.length === 0) return NextResponse.json({ error: 'round not found' }, { status: 404 })

    const existing = await db.query<{ id: string }>(
      `SELECT id FROM practice_logs WHERE round_id = $1 AND local_date = $2 AND user_id = $3`,
      [roundId, body.localDate, userId],
    )

    if (existing.rows.length > 0) {
      const res = await db.query(
        `UPDATE practice_logs SET status = $1, note = $2 WHERE id = $3 RETURNING *`,
        [body.status, body.note?.trim() || null, existing.rows[0].id],
      )
      return NextResponse.json(res.rows[0])
    }

    const res = await db.query(
      `INSERT INTO practice_logs (user_id, round_id, local_date, status, note)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, roundId, body.localDate, body.status, body.note?.trim() || null],
    )
    return NextResponse.json(res.rows[0], { status: 201 })
  })
}
