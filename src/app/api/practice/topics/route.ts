import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'

/** GET /api/practice/topics - 列出 active 议题。 */
export async function GET(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    const res = await db.query(
      `SELECT * FROM topics WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC`,
      [userId],
    )
    return NextResponse.json({ topics: res.rows })
  })
}

/** POST /api/practice/topics - 创建议题。body: { question } */
export async function POST(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    const { question } = (await request.json()) as { question?: string }
    const trimmed = question?.trim()
    if (!trimmed) return NextResponse.json({ error: '议题不能为空' }, { status: 400 })
    const res = await db.query(
      `INSERT INTO topics (user_id, question) VALUES ($1, $2) RETURNING *`,
      [userId, trimmed],
    )
    return NextResponse.json(res.rows[0], { status: 201 })
  })
}
