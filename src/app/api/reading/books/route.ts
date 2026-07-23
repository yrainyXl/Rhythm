import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'

interface BookBody {
  title: string
  author?: string | null
  total_pages?: number | null
  source?: 'manual' | 'weixin_read' | 'kindle' | 'other'
  status?: 'reading' | 'finished' | 'paused' | 'dropped'
}

/** GET /api/reading/books - 列出当前用户的书籍。 */
export async function GET(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    const res = await db.query(
      `SELECT * FROM public.reading_books
       WHERE user_id = $1
       ORDER BY created_at DESC`,
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
