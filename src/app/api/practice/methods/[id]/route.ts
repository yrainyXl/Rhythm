import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'

/** PATCH /api/practice/methods/[id] - 更新方法状态。body: { status } */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return withUser(request, async (userId, db) => {
    const { status } = (await request.json().catch(() => ({}))) as { status?: string }
    await db.query(
      `UPDATE methods SET status = $1 WHERE id = $2 AND user_id = $3`,
      [status ?? 'validating', params.id, userId],
    )
    return NextResponse.json({ success: true })
  })
}

/** DELETE /api/practice/methods/[id] - 删除方法。 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return withUser(request, async (userId, db) => {
    await db.query('DELETE FROM methods WHERE id = $1 AND user_id = $2', [params.id, userId])
    return NextResponse.json({ success: true })
  })
}
