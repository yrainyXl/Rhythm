import { readFileSync } from 'fs'
import { Pool, types } from 'pg'
import { env } from './env'

// pg 默认把 PostgreSQL date/timestamp 解析成 JS Date 对象,JSON.stringify 后
// 变成 UTC ISO 字符串(如 "2026-07-22T16:00:00.000Z"),导致前端按本地日期
// 对比时偏移一天。改成返回原始字符串,date 列就是 "2026-07-22"。
// OID: 1082=date, 1114=timestamp, 1184=timestamptz
types.setTypeParser(1082, (v: string) => v)
types.setTypeParser(1114, (v: string) => v)
types.setTypeParser(1184, (v: string) => v)

// 进程级单例 Pool:复用连接,避免每个请求重复创建+销毁。
let poolInstance: Pool | null = null

function pgSslConfig() {
  if (!env.TENCENTDB_SSL) return false
  const config: { rejectUnauthorized: boolean; ca?: string } = {
    rejectUnauthorized: true, // 必须校验证书,防中间人
  }
  if (env.TENCENTDB_CA) {
    config.ca = readFileSync(env.TENCENTDB_CA, 'utf8')
  }
  return config
}

export function getPgPool(): Pool {
  if (!poolInstance) {
    poolInstance = new Pool({
      host: env.TENCENTDB_HOST,
      port: env.TENCENTDB_PORT,
      user: env.TENCENTDB_USER,
      password: env.TENCENTDB_PASSWORD,
      database: env.TENCENTDB_DATABASE,
      ssl: pgSslConfig(),
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10 * 60_000, // 10 分钟,减少空闲连接被回收后的冷启动建连(实测 ~167ms)
      max: 10,
    })
    warmupPool(poolInstance)
  }
  return poolInstance
}

// 预热:创建后预建若干连接放回池中,避免首个请求冷启动 TCP+TLS 握手(远程 DB 建连 ~167ms)。
// 失败静默——DB 暂不可达时由请求路径的 withUser 兜底返回 500。
function warmupPool(pool: Pool): void {
  const count = Math.min(pool.options.max ?? 3, 3)
  for (let i = 0; i < count; i++) {
    pool.connect().then((client) => client.release()).catch(() => {})
  }
}

// 旧 API 名保留兼容(返回单例,不再每次新建)
export function createPgPool(): Pool {
  return getPgPool()
}
