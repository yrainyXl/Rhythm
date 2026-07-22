import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'

/** GET /api/practice/ai-recommendations?status=pending | ?weeklyReviewId=xxx */
export async function GET(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    const status = request.nextUrl.searchParams.get('status')
    const weeklyReviewId = request.nextUrl.searchParams.get('weeklyReviewId')

    if (weeklyReviewId) {
      const res = await db.query(
        `SELECT * FROM ai_recommendations
         WHERE user_id = $1 AND weekly_review_id = $2
         ORDER BY created_at ASC`,
        [userId, weeklyReviewId],
      )
      return NextResponse.json({ items: res.rows })
    }

    if (status === 'pending') {
      const res = await db.query(
        `SELECT * FROM ai_recommendations
         WHERE user_id = $1 AND status = 'pending'
         ORDER BY created_at DESC LIMIT 20`,
        [userId],
      )
      return NextResponse.json({ items: res.rows })
    }

    const res = await db.query(
      `SELECT * FROM ai_recommendations WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [userId],
    )
    return NextResponse.json({ items: res.rows })
  })
}
