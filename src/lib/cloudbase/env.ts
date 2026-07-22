import { z } from 'zod'

const cloudbaseEnvSchema = z.object({
  NEXT_PUBLIC_CLOUDBASE_ENV_ID: z.string().min(1),
  CLOUDBASE_SECRET_ID: z.string().min(1),
  CLOUDBASE_SECRET_KEY: z.string().min(1),
  TENCENTDB_HOST: z.string().min(1),
  TENCENTDB_PORT: z.coerce.number().int().min(1).default(5432),
  TENCENTDB_DATABASE: z.string().min(1),
  TENCENTDB_USER: z.string().min(1),
  TENCENTDB_PASSWORD: z.string().min(1),
  TENCENTDB_SSL: z.coerce.boolean().default(true),
})

export type CloudbaseEnv = z.infer<typeof cloudbaseEnvSchema>

export function parseCloudbaseEnv(env: Record<string, undefined | string>): CloudbaseEnv {
  return cloudbaseEnvSchema.parse({
    NEXT_PUBLIC_CLOUDBASE_ENV_ID: env.NEXT_PUBLIC_CLOUDBASE_ENV_ID,
    CLOUDBASE_SECRET_ID: env.CLOUDBASE_SECRET_ID,
    CLOUDBASE_SECRET_KEY: env.CLOUDBASE_SECRET_KEY,
    TENCENTDB_HOST: env.TENCENTDB_HOST,
    TENCENTDB_PORT: env.TENCENTDB_PORT,
    TENCENTDB_DATABASE: env.TENCENTDB_DATABASE,
    TENCENTDB_USER: env.TENCENTDB_USER,
    TENCENTDB_PASSWORD: env.TENCENTDB_PASSWORD,
    TENCENTDB_SSL: env.TENCENTDB_SSL,
  })
}

// Lazy initialize to avoid top-level evaluation failure in tests
let cloudbaseEnvInstance: CloudbaseEnv

export function getCloudbaseEnv(): CloudbaseEnv {
  if (!cloudbaseEnvInstance) {
    cloudbaseEnvInstance = parseCloudbaseEnv(process.env)
  }
  return cloudbaseEnvInstance
}

// Keep cloudbaseEnv as a getter that evaluates lazily when accessed
export const cloudbaseEnv = new Proxy({} as CloudbaseEnv, {
  get(target, prop) {
    return getCloudbaseEnv()[prop as keyof CloudbaseEnv]
  },
})
