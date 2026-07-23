import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'

interface BookStatusBody {
  status: 'reading' | 'finished' | 'paused' | 'dropped'
}

/** PATCH /api/reading/books/[id] - 更新书籍状态(完成时写 finished_at)。 */
export async function PATCH(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    const url = new URL(request.url)
    const bookId = url.pathname.split('/').at(-2)
    const body = (await request.json().catch(() => null)) as BookStatusBody | null
    if (!body || !bookId) {
      return NextResponse.json({ error: 'status 必填' }, { status: 400 })
    }
    const finishedAt = body.status === 'finished' ? new Date().toISOString().split('T')[0] : null
    await db.query(
      `UPDATE public.reading_books
       SET status = $1, finished_at = $2
       WHERE id = $3 AND user_id = $4`,
      [body.status, finishedAt, bookId, userId],
    )
    return NextResponse.json({ success: true })
  })
}
