import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'

/** PATCH /api/practice/ai-recommendations/[id] - 更新状态。body: { status } */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return withUser(request, async (userId, db) => {
    const { status } = (await request.json().catch(() => ({}))) as { status?: string }
    await db.query(
      `UPDATE ai_recommendations SET status = $1 WHERE id = $2 AND user_id = $3`,
      [status ?? 'pending', params.id, userId],
    )
    return NextResponse.json({ success: true })
  })
}
