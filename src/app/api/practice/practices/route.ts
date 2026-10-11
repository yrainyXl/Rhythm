import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/server/with-user'
import { practiceDates, validPeriod } from '@/features/practice/server/input'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface PracticeRow {
  id: string
  user_id: string
  topic_id: string | null
  title: string
  assumption: string | null
  source_highlight_id: string | null
  status: string
  created_at: string
  updated_at: string
}
interface RoundRow {
  id: string
  user_id: string
  practice_id: string
  round_number: number
  start_date: string
  end_date: string
  assumption: string | null
  conclusion: string | null
  status: string
  created_at: string
  updated_at: string
}

/** GET /api/practice/practices - 列出实践及其最新一轮(round_number 最大)。 */
export async function GET(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    const bookId = request.nextUrl.searchParams.get('bookId')
    // 单次查询:LEFT JOIN LATERAL 取每个 practice 的最新 round,省一次 DB 往返
    const res = await db.query<{
      id: string
      user_id: string
      topic_id: string | null
      title: string
      assumption: string | null
      source_highlight_id: string | null
      status: string
      created_at: string
      updated_at: string
      latest_round: RoundRow | null
    }>(
      `SELECT p.*,
              COALESCE(
                (SELECT to_jsonb(r) FROM practice_rounds r
                 WHERE r.practice_id = p.id AND r.user_id = $1
                 ORDER BY r.round_number DESC LIMIT 1),
                'null'::jsonb
              ) AS latest_round
       FROM practices p
       WHERE p.user_id = $1
         AND ($2::uuid IS NULL OR EXISTS (
           SELECT 1 FROM reading_highlights h
           JOIN reading_books b ON b.id = h.book_id AND b.user_id = $1
           WHERE h.id = p.source_highlight_id AND h.user_id = $1 AND h.book_id = $2::uuid
         ))
       ORDER BY p.created_at DESC`,
      [userId, bookId],
    )
    const practices = res.rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      topic_id: row.topic_id,
      title: row.title,
      assumption: row.assumption,
      source_highlight_id: row.source_highlight_id,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      latestRound: row.latest_round,
    }))
    return NextResponse.json({ practices })
  })
}

interface CreatePracticeBody {
  title: string
  topicId: string | null
  assumption: string
  periodDays: number
  sourceHighlightId?: string | null
}

/** POST /api/practice/practices - 创建实践 + 首轮。 */
export async function POST(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    const body = (await request.json().catch(() => null)) as CreatePracticeBody | null
    if (!body || typeof body.title !== 'string' || (body.assumption != null && typeof body.assumption !== 'string')) {
      return NextResponse.json({ error: '请填写有效的实践内容' }, { status: 400 })
    }
    const title = body.title?.trim()
    if (!title) return NextResponse.json({ error: '实践名不能为空' }, { status: 400 })
    if (!validPeriod(body.periodDays)) {
      return NextResponse.json({ error: '周期必须在 3–60 天之间' }, { status: 400 })
    }

    const assumption = body.assumption?.trim() || null
    const sourceHighlightId = body.sourceHighlightId ?? null
    if (sourceHighlightId && !assumption) return NextResponse.json({ error: '请写下要尝试的行动与假设' }, { status: 400 })
    const { startDate: today, endDate } = practiceDates(body.periodDays)

    // (DB-P0-05) practice + 首轮两表写入用事务,失败回滚不留孤儿实践
    return db.transaction(async (tx) => {
      if (sourceHighlightId) {
        const source = await tx.query(
          'SELECT h.id FROM reading_highlights h JOIN reading_books b ON b.id = h.book_id AND b.user_id = $2 WHERE h.id = $1 AND h.user_id = $2',
          [sourceHighlightId, userId],
        )
        if (!source.rows.length) return NextResponse.json({ error: '来源笔记不存在' }, { status: 404 })
      }
      if (body.topicId) {
        const topic = await tx.query('SELECT id FROM topics WHERE id = $1 AND user_id = $2', [body.topicId, userId])
        if (!topic.rows.length) return NextResponse.json({ error: '议题不存在' }, { status: 404 })
      }
      const practiceRes = await tx.query<PracticeRow>(
        `INSERT INTO practices (user_id, title, topic_id, assumption, source_highlight_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [userId, title, body.topicId ?? null, assumption, sourceHighlightId],
      )
      const practice = practiceRes.rows[0]

      const roundRes = await tx.query<RoundRow>(
        `INSERT INTO practice_rounds (user_id, practice_id, round_number, start_date, end_date, assumption)
         VALUES ($1, $2, 1, $3, $4, $5) RETURNING *`,
        [userId, practice.id, today, endDate, assumption],
      )
      return NextResponse.json(
        { ...practice, latestRound: roundRes.rows[0] ?? null },
        { status: 201 },
      )
    })
  })
}
