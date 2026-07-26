import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'

/** DELETE /api/captures/[id] - 删除一条想法。 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return withUser(request, async (userId, db) => {
    await db.query('DELETE FROM public.daily_captures WHERE id = $1 AND user_id = $2', [params.id, userId])
    return NextResponse.json({ success: true })
  })
}
