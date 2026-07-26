import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface CreateRoundBody {
  assumption?: string
  periodDays: number
  conclusion?: string | null
}

/**
 * POST /api/practice/practices/[id]/rounds - 创建下一轮(调整再试)。
 * 事务:1) 最新 active 轮置 ended(+conclusion) 2) 新轮 round_number = max+1。
 * 校验实践属于用户且 status=active。
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return withUser(request, async (userId, db) => {
    const body = (await request.json().catch(() => null)) as CreateRoundBody | null
    if (!body || !body.periodDays || body.periodDays < 3 || body.periodDays > 60) {
      return NextResponse.json({ error: 'periodDays 必须在 3–60 之间' }, { status: 400 })
    }

    return db.transaction(async (tx) => {
      // 校验实践属于用户且 active
      const practiceRes = await tx.query(
        `SELECT id FROM practices WHERE id = $1 AND user_id = $2 AND status = 'active'`,
        [params.id, userId],
      )
      if (practiceRes.rows.length === 0) {
        return NextResponse.json({ error: '实践不存在或已结束' }, { status: 404 })
      }

      // 结束当前 active 轮
      await tx.query(
        `UPDATE practice_rounds SET status = 'ended', conclusion = COALESCE($1, conclusion)
         WHERE id = (
           SELECT id FROM practice_rounds
           WHERE practice_id = $2 AND user_id = $3 AND status = 'active'
           ORDER BY round_number DESC LIMIT 1
         )`,
        [body.conclusion ?? null, params.id, userId],
      )

      // 新轮 round_number = max+1
      const maxRes = await tx.query<{ m: number }>(
        `SELECT COALESCE(MAX(round_number), 0) AS m FROM practice_rounds WHERE practice_id = $1 AND user_id = $2`,
        [params.id, userId],
      )
      const nextRound = maxRes.rows[0].m + 1
      const today = new Date().toISOString().slice(0, 10)
      const end = new Date()
      end.setDate(end.getDate() + body.periodDays - 1)
      const endDate = end.toISOString().slice(0, 10)
      const assumption = body.assumption?.trim() || null

      const roundRes = await tx.query(
        `INSERT INTO practice_rounds
           (user_id, practice_id, round_number, start_date, end_date, assumption)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [userId, params.id, nextRound, today, endDate, assumption],
      )
      return NextResponse.json({ round: roundRes.rows[0] }, { status: 201 })
    })
  })
}
