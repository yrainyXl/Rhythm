import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'

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
