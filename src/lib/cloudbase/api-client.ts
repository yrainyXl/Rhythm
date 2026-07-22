/**
 * 浏览器侧统一 API 客户端:自动携带 CloudBase access_token,401 时触发 SDK 刷新并重试一次。
 *
 * CloudBase v3 SDK 登录后把 access_token(RS256 JWT)持久化在 localStorage 的
 * `credentials_<envId>` 里。服务端 Route Handler 据此 token 走 userinfo 端点换 uid
 * (见 server.ts getUserIdFromCloudbase)。所有业务 store 的 fetch 调用都应走 apiFetch,
 * 不要手写 Authorization 头。
 */
import { createCloudbaseClient } from './client'

const CLOUDBASE_ENV_ID = process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID

export class ApiError extends Error {
  status: number
  body: unknown
  constructor(status: number, body: unknown) {
    super(`API ${status}: ${typeof body === 'string' ? body : (body as any)?.error ?? 'request failed'}`)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

/** 从 localStorage 读取当前 access_token。 */
function getAccessToken(): string | null {
  if (typeof window === 'undefined' || !CLOUDBASE_ENV_ID) return null
  const raw = window.localStorage.getItem(`credentials_${CLOUDBASE_ENV_ID}`)
  if (!raw) return null
  try {
    const creds = JSON.parse(raw)
    return creds?.access_token ?? null
  } catch {
    return null
  }
}

/** 触发 SDK 内部刷新 token(更新 localStorage),best-effort。 */
async function refreshAccessToken(): Promise<void> {
  try {
    const client = createCloudbaseClient()
    const auth = client.auth()
    // getLoginState 会校验本地态,必要时触发刷新;refresh 亦可
    await auth.getLoginState()
  } catch {
    // 忽略,交给重试后的 401 处理
  }
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    return await res.text()
  }
}

export async function apiFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAccessToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init.headers as Record<string, string>) ?? {}),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(path, { ...init, headers })

  if (res.status === 401) {
    // token 可能过期,触发 SDK 刷新后重试一次
    await refreshAccessToken()
    const newToken = getAccessToken()
    if (newToken && newToken !== token) {
      headers.Authorization = `Bearer ${newToken}`
      const retry = await fetch(path, { ...init, headers })
      if (!retry.ok) throw new ApiError(retry.status, await safeJson(retry))
      return (await safeJson(retry)) as T
    }
    throw new ApiError(401, { error: '登录已过期,请重新登录' })
  }

  if (!res.ok) {
    throw new ApiError(res.status, await safeJson(res))
  }
  return (await safeJson(res)) as T
}
