import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'

/** GET /api/practice/methods - 列出非 archived 方法。 */
export async function GET(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    const res = await db.query(
      `SELECT * FROM methods WHERE user_id = $1 AND status <> 'archived' ORDER BY created_at DESC`,
      [userId],
    )
    return NextResponse.json({ methods: res.rows })
  })
}

/** POST /api/practice/methods - 创建方法。body: { title, condition?, status? } */
export async function POST(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    const { title, condition, status } = (await request.json()) as {
      title?: string
      condition?: string
      status?: string
    }
    const trimmed = title?.trim()
    if (!trimmed) return NextResponse.json({ error: '方法标题不能为空' }, { status: 400 })
    const res = await db.query(
      `INSERT INTO methods (user_id, title, condition, status)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, trimmed, condition?.trim() || null, status ?? 'validating'],
    )
    return NextResponse.json(res.rows[0], { status: 201 })
  })
}
