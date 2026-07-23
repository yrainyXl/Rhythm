import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'

interface SetLogBody {
  set_number: number
  reps?: number | null
  weight_kg?: number | null
  duration_seconds?: number | null
  feeling?: 'easy' | 'slight' | 'challenging' | 'painful' | null
  is_completed?: boolean
}

interface RecordBody {
  template_id?: string | null
  exercise_date: string
  start_time?: string | null
  end_time?: string | null
  duration_minutes?: number | null
  distance_km?: number | null
  intensity?: 'light' | 'moderate' | 'intense' | null
  feeling?: number | null
  note?: string | null
  is_shared?: boolean
  sets?: SetLogBody[]
}

/** GET /api/records/exercise - 列出最近运动记录(?limit=N,默认 20)。 */
export async function GET(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    const limit = Number(new URL(request.url).searchParams.get('limit') ?? 20)
    const res = await db.query(
      `SELECT * FROM public.exercise_records
       WHERE user_id = $1
       ORDER BY exercise_date DESC
       LIMIT $2`,
      [userId, limit],
    )
    return NextResponse.json({ records: res.rows })
  })
}

/**
 * POST /api/records/exercise - 新增运动记录(含可选 set_logs)。
 * set_logs 在同一事务内插入,失败回滚。
 */
export async function POST(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    const body = (await request.json().catch(() => null)) as RecordBody | null
    if (!body || !body.exercise_date) {
      return NextResponse.json({ error: 'exercise_date 必填' }, { status: 400 })
    }

    // withUser 的 db.query 不支持事务,单独建 pool 插入 record + sets
    const { createPgPool } = await import('@/lib/cloudbase/server')
    const pool = createPgPool()
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      try {
        const recordRes = await client.query(
          `INSERT INTO public.exercise_records
             (user_id, template_id, exercise_date, start_time, end_time,
              duration_minutes, distance_km, intensity, feeling, note, is_shared)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
           RETURNING *`,
          [
            userId,
            body.template_id ?? null,
            body.exercise_date,
            body.start_time ?? null,
            body.end_time ?? null,
            body.duration_minutes ?? null,
            body.distance_km ?? null,
            body.intensity ?? null,
            body.feeling ?? null,
            body.note ?? null,
            body.is_shared ?? false,
          ],
        )
        const record = recordRes.rows[0]

        if (body.sets && body.sets.length > 0) {
          const setRows = body.sets.map((s) => [
            record.id,
            userId,
            s.set_number,
            s.reps ?? null,
            s.weight_kg ?? null,
            s.duration_seconds ?? null,
            s.feeling ?? null,
            s.is_completed ?? true,
          ])
          await client.query(
            `INSERT INTO public.exercise_set_logs
               (record_id, user_id, set_number, reps, weight_kg,
                duration_seconds, feeling, is_completed)
             VALUES ${setRows
               .map((_, i) =>
                 `($${i * 8 + 1},$${i * 8 + 2},$${i * 8 + 3},$${i * 8 + 4},$${i * 8 + 5},$${i * 8 + 6},$${i * 8 + 7},$${i * 8 + 8})`)
               .join(',')}`,
            setRows.flat(),
          )
        }

        await client.query('COMMIT')
        return NextResponse.json({ record }, { status: 201 })
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
