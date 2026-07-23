import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'

interface TemplateBody {
  name: string
  category?: string
  is_rehab?: boolean
  default_sets?: number
  default_reps?: number | null
  default_duration?: number | null
}

/** GET /api/records/exercise-templates - 列出当前用户的运动模板。 */
export async function GET(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    const res = await db.query(
      `SELECT * FROM public.exercise_templates
       WHERE user_id = $1 ORDER BY created_at`,
      [userId],
    )
    return NextResponse.json({ templates: res.rows })
  })
}

/** POST /api/records/exercise-templates - 创建运动模板。 */
export async function POST(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    const body = (await request.json().catch(() => null)) as TemplateBody | null
    if (!body || !body.name) {
      return NextResponse.json({ error: 'name 必填' }, { status: 400 })
    }
    const res = await db.query(
      `INSERT INTO public.exercise_templates
         (user_id, name, category, is_rehab, default_sets, default_reps, default_duration)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        userId,
        body.name,
        body.category ?? 'other',
        body.is_rehab ?? false,
        body.default_sets ?? 1,
        body.default_reps ?? null,
        body.default_duration ?? null,
      ],
    )
    return NextResponse.json({ template: res.rows[0] }, { status: 201 })
  })
}
