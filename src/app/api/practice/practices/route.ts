import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface PracticeRow {
  id: string
  user_id: string
  topic_id: string | null
  title: string
  assumption: string | null
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
    // 单次查询:LEFT JOIN LATERAL 取每个 practice 的最新 round,省一次 DB 往返
    const res = await db.query<{
      id: string
      user_id: string
      topic_id: string | null
      title: string
      assumption: string | null
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
       ORDER BY p.created_at DESC`,
      [userId],
    )
    const practices = res.rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      topic_id: row.topic_id,
      title: row.title,
      assumption: row.assumption,
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
}

/** POST /api/practice/practices - 创建实践 + 首轮。 */
export async function POST(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    const body = (await request.json()) as CreatePracticeBody
    const title = body.title?.trim()
    if (!title) return NextResponse.json({ error: '实践名不能为空' }, { status: 400 })
    if (body.periodDays < 3 || body.periodDays > 60) {
      return NextResponse.json({ error: '周期必须在 3–60 天之间' }, { status: 400 })
    }

    const assumption = body.assumption?.trim() || null
    const today = new Date().toISOString().slice(0, 10)
    const end = new Date()
    end.setDate(end.getDate() + body.periodDays - 1)
    const endDate = end.toISOString().slice(0, 10)

    // (DB-P0-05) practice + 首轮两表写入用事务,失败回滚不留孤儿实践
    return db.transaction(async (tx) => {
      const practiceRes = await tx.query<PracticeRow>(
        `INSERT INTO practices (user_id, title, topic_id, assumption)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [userId, title, body.topicId ?? null, assumption],
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
