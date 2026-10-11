import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/server/with-user'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET /api/reading/highlights - 列出当前用户的划线/想法(含书名作者封面),按 book/chapter/time 排序。
 *  - 无参数:全量(详情页)。
 *  - ?recentBooks=N:只返回最近 N 本书的词条 + 全局 total(阅读首页,避免一次拉全量)。
 *  - ?book_id=X:只返回该书词条(书籍详情页),与 recentBooks 互斥，按笔记时间降序。
 */
export async function GET(request: NextRequest) {
  const bookId = request.nextUrl.searchParams.get('book_id')
  const recentBooksRaw = request.nextUrl.searchParams.get('recentBooks')
  const recentBooks = recentBooksRaw ? Number.parseInt(recentBooksRaw, 10) : null
  const limit = recentBooks && Number.isFinite(recentBooks) && recentBooks > 0
    ? Math.min(recentBooks, 50)
    : null

  return withUser(request, async (userId, db) => {
    if (bookId) {
      const res = await db.query(
        `SELECT h.*,
                jsonb_build_object(
                  'title', b.title, 'author', b.author,
                  'cover_url', b.cover_url, 'status', b.status
                ) AS reading_books
         FROM public.reading_highlights h
         JOIN public.reading_books b ON b.id = h.book_id
         WHERE h.user_id = $1 AND h.book_id = $2
         ORDER BY COALESCE(h.highlighted_at, h.created_at) DESC, h.created_at DESC, h.id DESC`,
        [userId, bookId],
      )
      const highlights = res.rows ?? []
      return NextResponse.json({ highlights, total: highlights.length })
    }

    if (limit !== null) {
      // 一次查询同时拿到「最近 N 本书的词条」与「全局总数」。
      const res = await db.query(
        `WITH total AS (
           SELECT count(*)::int AS total FROM public.reading_highlights WHERE user_id = $1
         ),
         recent AS (
           SELECT book_id
           FROM public.reading_highlights
           WHERE user_id = $1
           GROUP BY book_id
           ORDER BY max(highlighted_at) DESC NULLS LAST
           LIMIT $2
         )
         SELECT h.*,
                jsonb_build_object(
                  'title', b.title, 'author', b.author,
                  'cover_url', b.cover_url, 'status', b.status
                ) AS reading_books,
                total.total
         FROM public.reading_highlights h
         JOIN public.reading_books b ON b.id = h.book_id
         JOIN recent r ON r.book_id = h.book_id
         CROSS JOIN total
         WHERE h.user_id = $1
         ORDER BY h.book_id ASC, h.chapter_uid ASC NULLS FIRST, h.highlighted_at ASC NULLS FIRST`,
        [userId, limit],
      )
      const rows = res.rows ?? []
      const total = rows.length > 0 ? (rows[0].total ?? 0) : 0
      const highlights = rows.map(({ total: _total, ...h }) => h)
      return NextResponse.json({ highlights, total })
    }

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
    const highlights = res.rows ?? []
    return NextResponse.json({ highlights, total: highlights.length })
  })
}
