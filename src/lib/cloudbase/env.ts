import { z } from 'zod'

const common = {
  NEXT_PUBLIC_CLOUDBASE_ENV_ID: z.string().min(1),
  TENCENTDB_PORT: z.coerce.number().int().min(1).default(5432),
  TENCENTDB_SSL: z.preprocess(
    (val) => val === 'false' || val === '0' || val === false ? false : val,
    z.coerce.boolean().default(true)
  ),
}

const serverSchema = z.object({
  ...common,
  CLOUDBASE_SECRET_ID: z.string().min(1),
  CLOUDBASE_SECRET_KEY: z.string().min(1),
  TENCENTDB_HOST: z.string().min(1),
  TENCENTDB_DATABASE: z.string().min(1),
  TENCENTDB_USER: z.string().min(1),
  TENCENTDB_PASSWORD: z.string().min(1),
})

const clientSchema = z.object({
  ...common,
  CLOUDBASE_SECRET_ID: z.string().optional(),
  CLOUDBASE_SECRET_KEY: z.string().optional(),
  TENCENTDB_HOST: z.string().optional(),
  TENCENTDB_DATABASE: z.string().optional(),
  TENCENTDB_USER: z.string().optional(),
  TENCENTDB_PASSWORD: z.string().optional(),
})

const isServer = typeof window === 'undefined'
const cloudbaseEnvSchema = isServer ? serverSchema : clientSchema

export type CloudbaseEnv = z.infer<typeof serverSchema>

export function parseCloudbaseEnv(env: Record<string, undefined | string>): CloudbaseEnv {
  const schema = isServer ? serverSchema : clientSchema
  return schema.parse({
    NEXT_PUBLIC_CLOUDBASE_ENV_ID: env.NEXT_PUBLIC_CLOUDBASE_ENV_ID,
    CLOUDBASE_SECRET_ID: env.CLOUDBASE_SECRET_ID,
    CLOUDBASE_SECRET_KEY: env.CLOUDBASE_SECRET_KEY,
    TENCENTDB_HOST: env.TENCENTDB_HOST,
    TENCENTDB_PORT: env.TENCENTDB_PORT,
    TENCENTDB_DATABASE: env.TENCENTDB_DATABASE,
    TENCENTDB_USER: env.TENCENTDB_USER,
    TENCENTDB_PASSWORD: env.TENCENTDB_PASSWORD,
    TENCENTDB_SSL: env.TENCENTDB_SSL,
  }) as CloudbaseEnv
}

// Lazy initialize, don't parse at module load time
let cloudbaseEnvInstance: CloudbaseEnv

export function getCloudbaseEnv(): CloudbaseEnv {
  if (!cloudbaseEnvInstance) {
    try {
      cloudbaseEnvInstance = parseCloudbaseEnv(process.env)
    } catch (e) {
      // Don't console.log here - Node inspect can crash on Zod errors
      throw e
    }
  }
  return cloudbaseEnvInstance
}

// Keep cloudbaseEnv as a getter that evaluates lazily
export const cloudbaseEnv = {
  get NEXT_PUBLIC_CLOUDBASE_ENV_ID() { return getCloudbaseEnv().NEXT_PUBLIC_CLOUDBASE_ENV_ID },
  get CLOUDBASE_SECRET_ID() { return getCloudbaseEnv().CLOUDBASE_SECRET_ID },
  get CLOUDBASE_SECRET_KEY() { return getCloudbaseEnv().CLOUDBASE_SECRET_KEY },
  get TENCENTDB_HOST() { return getCloudbaseEnv().TENCENTDB_HOST },
  get TENCENTDB_PORT() { return getCloudbaseEnv().TENCENTDB_PORT },
  get TENCENTDB_DATABASE() { return getCloudbaseEnv().TENCENTDB_DATABASE },
  get TENCENTDB_USER() { return getCloudbaseEnv().TENCENTDB_USER },
  get TENCENTDB_PASSWORD() { return getCloudbaseEnv().TENCENTDB_PASSWORD },
  get TENCENTDB_SSL() { return getCloudbaseEnv().TENCENTDB_SSL },
} as CloudbaseEnv