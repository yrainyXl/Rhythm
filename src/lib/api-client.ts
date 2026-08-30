/**
 * 浏览器侧统一 API 客户端。
 *
 * token 走 httpOnly cookie(由 /api/auth/signin 写入),浏览器自动携带,无需手动加 header。
 * 401 = 会话失效,直接清态跳登录(token 在 httpOnly cookie,前端无法刷新,由服务端
 * /api/auth/refresh 在 access_token 失效时用 refresh_token 续期)。
 *
 * 超时控制;旧版 Bearer header 仍兼容(过渡期 localStorage 残留 token)。
 */
const REQUEST_TIMEOUT_MS = 15_000

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

/** 带 AbortController 超时的 fetch。 */
async function fetchWithTimeout(
  path: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(path, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

/** 401 会话失效:跳登录页。token 在 httpOnly cookie,前端无法刷新。 */
function handleSessionExpired(): void {
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.href = '/login'
  }
}

async function safeJson(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export async function apiFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init.headers as Record<string, string>) ?? {}),
  }

  const res = await fetchWithTimeout(path, { ...init, headers }, REQUEST_TIMEOUT_MS)

  if (res.status === 401) {
    handleSessionExpired()
    throw new ApiError(401, { error: '登录已过期,请重新登录' })
  }

  if (!res.ok) {
    throw new ApiError(res.status, await safeJson(res))
  }
  return (await safeJson(res)) as T
}
