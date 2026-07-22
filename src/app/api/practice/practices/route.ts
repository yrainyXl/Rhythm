import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'

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
    const practices = await db.query<PracticeRow>(
      `SELECT * FROM practices WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    )
    const rounds = await db.query<RoundRow>(
      `SELECT * FROM practice_rounds WHERE user_id = $1 ORDER BY round_number DESC`,
      [userId],
    )
    const latestByPractice = new Map<string, RoundRow>()
    for (const r of rounds.rows) {
      if (!latestByPractice.has(r.practice_id)) latestByPractice.set(r.practice_id, r)
    }
    const withRounds = practices.rows.map((p): PracticeRow & { latestRound: RoundRow | null } => ({
      ...p,
      latestRound: latestByPractice.get(p.id) ?? null,
    }))
    return NextResponse.json({ practices: withRounds })
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
    const practiceRes = await db.query<PracticeRow>(
      `INSERT INTO practices (user_id, title, topic_id, assumption)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, title, body.topicId ?? null, assumption],
    )
    const practice = practiceRes.rows[0]

    const today = new Date().toISOString().slice(0, 10)
    const end = new Date()
    end.setDate(end.getDate() + body.periodDays - 1)
    const endDate = end.toISOString().slice(0, 10)

    const roundRes = await db.query<RoundRow>(
      `INSERT INTO practice_rounds (user_id, practice_id, round_number, start_date, end_date, assumption)
       VALUES ($1, $2, 1, $3, $4, $5) RETURNING *`,
      [userId, practice.id, today, endDate, assumption],
    )
    return NextResponse.json(
      { ...practice, latestRound: roundRes.rows[0] ?? null },
      { status: 201 },
    )
  })
}
