import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'

/** PATCH /api/practice/directions/[id] - 归档方向。 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return withUser(request, async (userId, db) => {
    await db.query(
      `UPDATE directions SET status = 'archived' WHERE id = $1 AND user_id = $2`,
      [params.id, userId],
    )
    return NextResponse.json({ success: true })
  })
}

/** DELETE /api/practice/directions/[id] - 删除方向。 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return withUser(request, async (userId, db) => {
    await db.query('DELETE FROM directions WHERE id = $1 AND user_id = $2', [params.id, userId])
    return NextResponse.json({ success: true })
  })
}
