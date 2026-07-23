import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'

/** GET /api/reading/highlights - 列出当前用户的划线/想法(含书名作者封面),按 book/chapter/time 排序。 */
export async function GET(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    const res = await db.query(
      `SELECT h.*,
              jsonb_build_object(
                'title', b.title, 'author', b.author,
                'cover_url', b.cover_url, 'status', b.status
              ) AS reading_books
       FROM public.reading_highlights h
       JOIN public.reading_books b ON b.id = h.book_id
       WHERE h.user_id = $1
       ORDER BY h.book_id ASC, h.chapter_uid ASC NULLS FIRST, h.highlighted_at ASC NULLS FIRST`,
      [userId],
    )
    return NextResponse.json({ highlights: res.rows })
  })
}
