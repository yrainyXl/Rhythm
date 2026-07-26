import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface ReviewBody {
  conclusion?: string | null
  reviewReality?: string | null
  reviewEffect?: string | null
  reviewAdjustment?: string | null
}

/**
 * PATCH /api/practice/rounds/[id]?action=end   - 结束轮次,可同时写复盘
 * PATCH /api/practice/rounds/[id]?action=review - 单独写/补填复盘(不改变轮次状态)
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return withUser(request, async (userId, db) => {
    const action = new URL(request.url).searchParams.get('action')
    const body = (await request.json().catch(() => ({}))) as ReviewBody

    const reviewReality = body.reviewReality?.trim() || null
    const reviewEffect = body.reviewEffect?.trim() || null
    const reviewAdjustment = body.reviewAdjustment?.trim() || null

    if (action === 'end') {
      const res = await db.query(
        `UPDATE practice_rounds
         SET status = 'ended',
             conclusion = COALESCE($1, conclusion),
             review_reality = $2,
             review_effect = $3,
             review_adjustment = $4
         WHERE id = $5 AND user_id = $6 AND status = 'active'
         RETURNING *`,
        [body.conclusion ?? null, reviewReality, reviewEffect, reviewAdjustment, params.id, userId],
      )
      if (res.rows.length === 0) {
        return NextResponse.json({ error: '轮次不存在或已结束' }, { status: 404 })
      }
      return NextResponse.json({ round: res.rows[0] })
    }

    if (action === 'review') {
      // 补填/编辑复盘:对任意轮次(active 或 ended)均可写
      const res = await db.query(
        `UPDATE practice_rounds
         SET review_reality = $1,
             review_effect = $2,
             review_adjustment = $3
         WHERE id = $4 AND user_id = $5
         RETURNING *`,
        [reviewReality, reviewEffect, reviewAdjustment, params.id, userId],
      )
      if (res.rows.length === 0) {
        return NextResponse.json({ error: '轮次不存在' }, { status: 404 })
      }
      return NextResponse.json({ round: res.rows[0] })
    }

    return NextResponse.json({ error: 'unsupported action' }, { status: 400 })
  })
}
