import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'

/** PATCH /api/practice/topics/[id] - 归档议题。 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return withUser(request, async (userId, db) => {
    await db.query(
      `UPDATE topics SET status = 'archived' WHERE id = $1 AND user_id = $2`,
      [params.id, userId],
    )
    return NextResponse.json({ success: true })
  })
}

/** DELETE /api/practice/topics/[id] - 删除议题。 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return withUser(request, async (userId, db) => {
    await db.query('DELETE FROM topics WHERE id = $1 AND user_id = $2', [params.id, userId])
    return NextResponse.json({ success: true })
  })
}
