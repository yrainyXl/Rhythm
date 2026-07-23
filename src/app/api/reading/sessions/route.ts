import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'

interface SessionBody {
  book_id: string
  duration_minutes: number
  pages_read?: number | null
  note?: string | null
}

/**
 * GET /api/reading/sessions?book_id=X 或不带参:列最近阅读会话(含书名)。
 * ?limit=N 默认 10。
 */
export async function GET(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    const limit = Number(new URL(request.url).searchParams.get('limit') ?? 10)
    const res = await db.query(
      `SELECT s.*, b.title AS book_title
       FROM public.reading_sessions s
       JOIN public.reading_books b ON b.id = s.book_id
       WHERE s.user_id = $1
       ORDER BY s.read_date DESC
       LIMIT $2`,
      [userId, limit],
    )
    return NextResponse.json({ sessions: res.rows })
  })
}

/**
 * POST /api/reading/sessions - 记录一次阅读会话,并推进 reading_books.current_page。
 * 单事务:insert session + update current_page。
 */
export async function POST(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    const body = (await request.json().catch(() => null)) as SessionBody | null
    if (!body || !body.book_id || body.duration_minutes == null) {
      return NextResponse.json({ error: 'book_id 和 duration_minutes 必填' }, { status: 400 })
    }

    const { createPgPool } = await import('@/lib/cloudbase/server')
    const pool = createPgPool()
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      try {
        await client.query(
          `INSERT INTO public.reading_sessions
             (book_id, user_id, read_date, duration_minutes, pages_read, note)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [
            body.book_id,
            userId,
            new Date().toISOString().split('T')[0],
            body.duration_minutes,
            body.pages_read ?? null,
            body.note ?? null,
          ],
        )
        if (body.pages_read && body.pages_read > 0) {
          await client.query(
            `UPDATE public.reading_books
             SET current_page = COALESCE(current_page, 0) + $1
             WHERE id = $2 AND user_id = $3`,
            [body.pages_read, body.book_id, userId],
          )
        }
        await client.query('COMMIT')
        return NextResponse.json({ success: true }, { status: 201 })
      } catch (e) {
        await client.query('ROLLBACK')
        throw e
      }
    } finally {
      client.release()
      await pool.end()
    }
  })
}
