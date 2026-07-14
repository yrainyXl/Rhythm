import { NextResponse } from 'next/server'

// Server-side latency probe: measures how fast THIS deployment (Vercel) can
// reach Supabase. If this is fast while the browser's direct connection is
// slow, a server-side proxy will fix the client's data-loading problem.
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    return NextResponse.json({ error: 'env missing' }, { status: 500 })
  }

  const t0 = Date.now()
  try {
    const res = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: anon },
      cache: 'no-store',
    })
    return NextResponse.json({
      ok: true,
      status: res.status,
      ms: Date.now() - t0,
      region: process.env.VERCEL_REGION ?? 'unknown',
    })
  } catch (e) {
    return NextResponse.json({ ok: false, ms: Date.now() - t0, error: String(e) }, { status: 502 })
  }
}
