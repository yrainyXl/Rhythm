import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'

/** GET /api/practice/weekly-reviews - 列出周报(最近 30 条)。 */
export async function GET(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    const res = await db.query(
      `SELECT * FROM weekly_reviews WHERE user_id = $1 ORDER BY week_start DESC LIMIT 30`,
      [userId],
    )
    return NextResponse.json({ reviews: res.rows })
  })
}
