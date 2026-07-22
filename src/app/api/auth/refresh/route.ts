import { NextResponse } from 'next/server'
import { createPgPool, getUserIdFromCloudbase } from '@/lib/cloudbase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const userId = await getUserIdFromCloudbase({ request })
  if (!userId) {
    return NextResponse.json({ user: null }, { status: 401 })
  }
  const pool = createPgPool()
  const client = await pool.connect()
  try {
    const res = await client.query(
      'SELECT id, username, nickname, avatar_url, timezone FROM public.app_users WHERE id = $1',
      [userId],
    )
    return NextResponse.json({ user: res.rows[0] ?? null })
  } finally {
    client.release()
    await pool.end()
  }
}
