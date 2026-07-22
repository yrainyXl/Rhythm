import { NextResponse } from 'next/server'
import { createPgPool } from '@/lib/cloudbase/server'
import { cloudbaseEnv } from '@/lib/cloudbase/env'

export async function GET() {
  try {
    // Debug: log env config
    const config = {
      host: cloudbaseEnv.TENCENTDB_HOST,
      port: cloudbaseEnv.TENCENTDB_PORT,
      database: cloudbaseEnv.TENCENTDB_DATABASE,
      user: cloudbaseEnv.TENCENTDB_USER,
      ssl: cloudbaseEnv.TENCENTDB_SSL,
      typeof_ssl: typeof cloudbaseEnv.TENCENTDB_SSL,
    }

    const pool = createPgPool()
    const client = await pool.connect()

    try {
      const start = Date.now()
      const result = await client.query('SELECT 1 AS ok')
      const latency = Date.now() - start

      return NextResponse.json({
        success: true,
        config,
        result: result.rows[0],
        latencyMs: latency,
        message: 'CloudBase PostgreSQL connection successful'
      })
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          config,
          error: error instanceof Error ? error.message : String(error),
          message: 'CloudBase PostgreSQL query failed'
        },
        { status: 500 }
      )
    } finally {
      client.release()
      await pool.end()
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        message: 'Initialization failed - check your environment variables'
      },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'