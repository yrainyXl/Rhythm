import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'

/** PATCH /api/practice/weekly-reviews/[id] - 更新周报状态。body: { status } */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return withUser(request, async (userId, db) => {
    const { status } = (await request.json().catch(() => ({}))) as { status?: string }
    await db.query(
      `UPDATE weekly_reviews SET status = $1 WHERE id = $2 AND user_id = $3`,
      [status ?? 'unread', params.id, userId],
    )
    return NextResponse.json({ success: true })
  })
}
