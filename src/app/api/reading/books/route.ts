import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/server/with-user'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface BookBody {
  title: string
  author?: string | null
  total_pages?: number | null
  source?: 'manual' | 'weixin_read' | 'kindle' | 'other'
  status?: 'reading' | 'finished' | 'paused' | 'dropped'
}

/**
 * GET /api/reading/books - 列出当前用户的书籍。
 * 排序:微信读书的书按官方 sort(最近阅读在前);无 sort 的(手动添加)按「最后活动时间」降序。
 * 注意:updated_at 会被每次 sync 的 upsert 刷成相同值,不能作为排序依据。
 */
export async function GET(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    const res = await db.query(
      `SELECT b.*,
              GREATEST(
                COALESCE((SELECT max(h.highlighted_at) FROM public.reading_highlights h
                          WHERE h.book_id = b.id AND h.user_id = $1), '-infinity'::timestamptz),
                COALESCE((SELECT max(s.read_date::timestamptz) FROM public.reading_sessions s
                          WHERE s.book_id = b.id AND s.user_id = $1), '-infinity'::timestamptz),
                b.updated_at
              ) AS last_activity_at
       FROM public.reading_books b
       WHERE b.user_id = $1
       ORDER BY b.source_sort DESC NULLS LAST, last_activity_at DESC`,
      [userId],
    )
    return NextResponse.json({ books: res.rows })
  })
}

/** POST /api/reading/books - 新增书籍。 */
export async function POST(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    const body = (await request.json().catch(() => null)) as BookBody | null
    if (!body || !body.title) {
      return NextResponse.json({ error: 'title 必填' }, { status: 400 })
    }
    const res = await db.query(
      `INSERT INTO public.reading_books
         (user_id, title, author, total_pages, source, status)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [userId, body.title, body.author ?? null, body.total_pages ?? null, body.source ?? 'manual', body.status ?? 'reading'],
    )
    return NextResponse.json({ book: res.rows[0] }, { status: 201 })
  })
}
