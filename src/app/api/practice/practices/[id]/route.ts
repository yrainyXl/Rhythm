import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET /api/practice/practices/[id] - 实践详情:实践 + 所有轮次(按 round_number)+ 每轮日志数。 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return withUser(request, async (userId, db) => {
    const practiceRes = await db.query(
      `SELECT * FROM practices WHERE id = $1 AND user_id = $2`,
      [params.id, userId],
    )
    if (practiceRes.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const roundsRes = await db.query(
      `SELECT r.*,
              (SELECT count(*)::int FROM practice_logs l WHERE l.round_id = r.id) AS log_count
       FROM practice_rounds r
       WHERE r.practice_id = $1 AND r.user_id = $2
       ORDER BY r.round_number ASC`,
      [params.id, userId],
    )
    return NextResponse.json({
      practice: practiceRes.rows[0],
      rounds: roundsRes.rows,
    })
  })
}

/** PATCH /api/practice/practices/[id]?action=end - 结束实践及其最新 active 轮。 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return withUser(request, async (userId, db) => {
    const id = params.id
    const action = request.nextUrl.searchParams.get('action')
    if (action !== 'end') {
      return NextResponse.json({ error: 'unsupported action' }, { status: 400 })
    }
    await db.query(
      `UPDATE practices SET status = 'ended' WHERE id = $1 AND user_id = $2`,
      [id, userId],
    )
    // 结束最新 active 轮
    await db.query(
      `UPDATE practice_rounds SET status = 'ended'
       WHERE id = (
         SELECT id FROM practice_rounds
         WHERE practice_id = $1 AND user_id = $2 AND status = 'active'
         ORDER BY round_number DESC LIMIT 1
       )`,
      [id, userId],
    )
    return NextResponse.json({ success: true })
  })
}

/** DELETE /api/practice/practices/[id] - 删除实践(级联删 rounds/logs,由 FK 处理)。 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return withUser(request, async (userId, db) => {
    await db.query('DELETE FROM practices WHERE id = $1 AND user_id = $2', [params.id, userId])
    return NextResponse.json({ success: true })
  })
}
