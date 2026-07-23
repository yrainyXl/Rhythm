import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'

interface GoalBody {
  title: string
  description?: string | null
  category?: string
  target_date?: string | null
}

/**
 * GET /api/records/goals - 列出目标(?id=X 返回单个详情含 key_results+milestones)。
 */
export async function GET(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    const goalId = new URL(request.url).searchParams.get('id')

    if (goalId) {
      const [goalRes, krRes, msRes] = await Promise.all([
        db.query(`SELECT * FROM public.goals WHERE id = $1 AND user_id = $2`, [goalId, userId]),
        db.query(
          `SELECT * FROM public.goal_key_results WHERE goal_id = $1 ORDER BY created_at`,
          [goalId],
        ),
        db.query(`SELECT * FROM public.goal_milestones WHERE goal_id = $1 ORDER BY created_at`, [
          goalId,
        ]),
      ])
      return NextResponse.json({
        goal: goalRes.rows[0] ?? null,
        keyResults: krRes.rows,
        milestones: msRes.rows,
      })
    }

    const res = await db.query(
      `SELECT * FROM public.goals WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    )
    return NextResponse.json({ goals: res.rows })
  })
}

/** POST /api/records/goals - 创建目标。body 含 action 字段细分操作。 */
export async function POST(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body || !body.action) {
      return NextResponse.json({ error: 'action 必填' }, { status: 400 })
    }

    const action = body.action as string

    // createGoal
    if (action === 'create') {
      const res = await db.query(
        `INSERT INTO public.goals (user_id, title, description, category, target_date)
         VALUES ($1,$2,$3,$4,$5)
         RETURNING *`,
        [
          userId,
          body.title,
          body.description ?? null,
          body.category ?? 'other',
          body.target_date ?? null,
        ],
      )
      return NextResponse.json({ goal: res.rows[0] }, { status: 201 })
    }

    // updateGoalStatus
    if (action === 'status') {
      await db.query(`UPDATE public.goals SET status = $1 WHERE id = $2 AND user_id = $3`, [
        body.status,
        body.id,
        userId,
      ])
      return NextResponse.json({ success: true })
    }

    // addKeyResult
    if (action === 'add_key_result') {
      const res = await db.query(
        `INSERT INTO public.goal_key_results (goal_id, user_id, title, target_value, unit)
         VALUES ($1,$2,$3,$4,$5)
         RETURNING *`,
        [body.goal_id, userId, body.title, body.target_value ?? null, body.unit ?? null],
      )
      return NextResponse.json({ keyResult: res.rows[0] }, { status: 201 })
    }

    // updateKeyResultProgress(同时按 target_value 推断 status)
    if (action === 'update_kr') {
      const krId = body.id as string
      const current = body.current_value as number
      const { rows } = await db.query<{ target_value: number | null }>(
        `SELECT target_value FROM public.goal_key_results WHERE id = $1 AND user_id = $2`,
        [krId, userId],
      )
      if (rows.length === 0) {
        return NextResponse.json({ error: 'not found' }, { status: 404 })
      }
      const target = rows[0].target_value
      const status = target != null && current >= target ? 'completed' : 'in_progress'
      await db.query(
        `UPDATE public.goal_key_results
         SET current_value = $1, status = $2
         WHERE id = $3 AND user_id = $4`,
        [current, status, krId, userId],
      )
      return NextResponse.json({ success: true })
    }

    // addMilestone
    if (action === 'add_milestone') {
      const res = await db.query(
        `INSERT INTO public.goal_milestones (goal_id, user_id, title, key_result_id, due_date)
         VALUES ($1,$2,$3,$4,$5)
         RETURNING *`,
        [
          body.goal_id,
          userId,
          body.title,
          body.key_result_id ?? null,
          body.due_date ?? null,
        ],
      )
      return NextResponse.json({ milestone: res.rows[0] }, { status: 201 })
    }

    // completeMilestone
    if (action === 'complete_milestone') {
      await db.query(
        `UPDATE public.goal_milestones
         SET is_completed = true, completed_at = now()
         WHERE id = $1 AND user_id = $2`,
        [body.id, userId],
      )
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: `unknown action: ${action}` }, { status: 400 })
  })
}
