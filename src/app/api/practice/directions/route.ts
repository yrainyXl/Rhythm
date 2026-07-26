import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'

/** GET /api/practice/directions - 列出 active 方向。 */
export async function GET(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    const res = await db.query(
      `SELECT * FROM directions WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC`,
      [userId],
    )
    return NextResponse.json({ directions: res.rows })
  })
}

/** POST /api/practice/directions - 创建方向。body: { title, description? } */
export async function POST(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    const { title, description } = (await request.json()) as { title?: string; description?: string }
    const trimmed = title?.trim()
    if (!trimmed) return NextResponse.json({ error: '方向标题不能为空' }, { status: 400 })
    const res = await db.query(
      `INSERT INTO directions (user_id, title, description) VALUES ($1, $2, $3) RETURNING *`,
      [userId, trimmed, description?.trim() || null],
    )
    return NextResponse.json(res.rows[0], { status: 201 })
  })
}
