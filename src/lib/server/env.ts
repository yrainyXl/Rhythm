import { z } from 'zod'

// 服务端环境变量（server-only）。鉴权已本地化，无 CloudBase 依赖。
const envSchema = z.object({
  TENCENTDB_HOST: z.string().min(1),
  TENCENTDB_PORT: z.coerce.number().int().min(1).default(5432),
  TENCENTDB_DATABASE: z.string().min(1),
  TENCENTDB_USER: z.string().min(1),
  TENCENTDB_PASSWORD: z.string().min(1),
  TENCENTDB_SSL: z.preprocess(
    (val) => val === 'false' || val === '0' || val === false ? false : val,
    z.coerce.boolean().default(true)
  ),
  // 证书校验开启时腾讯云 PostgreSQL CA 文件路径；留空则用系统 CA。
  TENCENTDB_CA: z.string().optional(),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).default(30),
  SESSION_ABSOLUTE_TTL_DAYS: z.coerce.number().int().min(1).default(90),
})

export type Env = z.infer<typeof envSchema>

export function parseEnv(env: Record<string, undefined | string>): Env {
  return envSchema.parse({
    TENCENTDB_HOST: env.TENCENTDB_HOST,
    TENCENTDB_PORT: env.TENCENTDB_PORT,
    TENCENTDB_DATABASE: env.TENCENTDB_DATABASE,
    TENCENTDB_USER: env.TENCENTDB_USER,
    TENCENTDB_PASSWORD: env.TENCENTDB_PASSWORD,
    TENCENTDB_SSL: env.TENCENTDB_SSL,
    TENCENTDB_CA: env.TENCENTDB_CA,
    SESSION_TTL_DAYS: env.SESSION_TTL_DAYS,
    SESSION_ABSOLUTE_TTL_DAYS: env.SESSION_ABSOLUTE_TTL_DAYS,
  })
}

// 惰性初始化，避免模块加载期解析（Node inspect 可能因 Zod 错误崩溃）。
let envInstance: Env | null = null

export function getEnv(): Env {
  if (!envInstance) {
    envInstance = parseEnv(process.env)
  }
  return envInstance
}

// 懒求值 getter，供各处读取配置。
export const env = {
  get TENCENTDB_HOST() { return getEnv().TENCENTDB_HOST },
  get TENCENTDB_PORT() { return getEnv().TENCENTDB_PORT },
  get TENCENTDB_DATABASE() { return getEnv().TENCENTDB_DATABASE },
  get TENCENTDB_USER() { return getEnv().TENCENTDB_USER },
  get TENCENTDB_PASSWORD() { return getEnv().TENCENTDB_PASSWORD },
  get TENCENTDB_SSL() { return getEnv().TENCENTDB_SSL },
  get TENCENTDB_CA() { return getEnv().TENCENTDB_CA },
  get SESSION_TTL_DAYS() { return getEnv().SESSION_TTL_DAYS },
  get SESSION_ABSOLUTE_TTL_DAYS() { return getEnv().SESSION_ABSOLUTE_TTL_DAYS },
} as Env
