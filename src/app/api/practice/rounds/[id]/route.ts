import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'

/** PATCH /api/practice/rounds/[id]?action=end - 结束当前轮(实践保持 active,可再创建下一轮)。 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return withUser(request, async (userId, db) => {
    const action = new URL(request.url).searchParams.get('action')
    if (action !== 'end') {
      return NextResponse.json({ error: 'unsupported action' }, { status: 400 })
    }
    const body = (await request.json().catch(() => ({}))) as { conclusion?: string | null }
    const res = await db.query(
      `UPDATE practice_rounds SET status = 'ended', conclusion = COALESCE($1, conclusion)
       WHERE id = $2 AND user_id = $3 AND status = 'active'
       RETURNING *`,
      [body.conclusion ?? null, params.id, userId],
    )
    if (res.rows.length === 0) {
      return NextResponse.json({ error: '轮次不存在或已结束' }, { status: 404 })
    }
    return NextResponse.json({ round: res.rows[0] })
  })
}
