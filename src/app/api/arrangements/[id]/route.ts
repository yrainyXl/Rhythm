import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * PATCH /api/arrangements/[id]?action=complete|cancel|reset|reorder
 * - complete: pending -> done
 * - cancel:   pending -> cancelled
 * - reset:    done/cancelled -> pending
 * - reorder:  body { sort_order } 设置新排序
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return withUser(request, async (userId, db) => {
    const action = new URL(request.url).searchParams.get('action')
    const id = params.id

    if (action === 'reorder') {
      const body = (await request.json().catch(() => null)) as { sort_order?: number } | null
      if (body?.sort_order == null) {
        return NextResponse.json({ error: 'sort_order 必填' }, { status: 400 })
      }
      await db.query(
        `UPDATE public.daily_arrangements SET sort_order = $1
         WHERE id = $2 AND user_id = $3`,
        [body.sort_order, id, userId],
      )
      return NextResponse.json({ success: true })
    }

    const statusMap: Record<string, string> = {
      complete: 'done',
      cancel: 'cancelled',
      reset: 'pending',
    }
    const newStatus = action ? statusMap[action] : undefined
    if (!newStatus) {
      return NextResponse.json({ error: 'unsupported action' }, { status: 400 })
    }

    const res = await db.query(
      `UPDATE public.daily_arrangements SET status = $1
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [newStatus, id, userId],
    )
    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ arrangement: res.rows[0] })
  })
}

/** DELETE /api/arrangements/[id] - 删除安排。 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return withUser(request, async (userId, db) => {
    const res = await db.query(
      `DELETE FROM public.daily_arrangements
       WHERE id = $1 AND user_id = $2 RETURNING id`,
      [params.id, userId],
    )
    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  })
}
