import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/server/with-user'
import { validateLog } from '@/features/practice/server/input'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
    const body = (await request.json().catch(() => null)) as UpsertLogBody | null
    if (!body) return NextResponse.json({ error: '请填写记录内容' }, { status: 400 })

    return db.transaction(async (tx) => {
      // 与结束轮次更新串行，补记仍允许已结束轮的历史日期。
      const own = await tx.query<{ start_date: string; end_date: string }>(
        'SELECT start_date, end_date FROM practice_rounds WHERE id = $1 AND user_id = $2 FOR UPDATE',
        [roundId, userId],
      )
      if (!own.rows.length) return NextResponse.json({ error: '轮次不存在' }, { status: 404 })
      const error = validateLog(body, own.rows[0])
      if (error) return NextResponse.json({ error }, { status: 400 })
      const res = await tx.query(
        `INSERT INTO practice_logs (user_id, round_id, local_date, status, note)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (round_id, local_date)
         DO UPDATE SET status = EXCLUDED.status, note = EXCLUDED.note
         WHERE practice_logs.user_id = EXCLUDED.user_id
         RETURNING *`,
        [userId, roundId, body.localDate, body.status, body.note?.trim() || null],
      )
      return NextResponse.json(res.rows[0])
    })
  })
}
