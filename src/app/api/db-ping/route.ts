import { NextResponse } from 'next/server'
import { getPgPool } from '@/lib/cloudbase/server'

// 连通性检查端点。只返回成功状态与耗时,不泄露 host/database/user 等连接配置,
// 也不回显 SQL 错误堆栈。(SEC-P0-01/02)
export async function GET() {
  const pool = getPgPool()
  const client = await pool.connect()
  try {
    const start = Date.now()
    await client.query('SELECT 1')
    return NextResponse.json({
      success: true,
      latencyMs: Date.now() - start,
    })
  } catch {
    return NextResponse.json(
      { success: false, error: '数据库不可用' },
      { status: 500 },
    )
  } finally {
    client.release()
  }
}

export const runtime = 'nodejs'
