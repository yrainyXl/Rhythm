/**
 * 浏览器侧统一 API 客户端:自动携带 CloudBase access_token,
 * 401 时触发 SDK 刷新并重试(并发去重),超时控制,刷新失败清态跳登录。
 *
 * CloudBase v3 SDK 登录后把 access_token(RS256 JWT)持久化在 localStorage 的
 * `credentials_<envId>` 里。服务端 Route Handler 据此 token 走 userinfo 端点换 uid
 * (见 server.ts getUserIdFromCloudbase)。所有业务 store 的 fetch 调用都应走 apiFetch。
 */
import { createCloudbaseClient } from './client'

const CLOUDBASE_ENV_ID = process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID

// (AUTH-P0-03) 业务请求 15s 超时,避免永久挂起
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

// (AUTH-P0-05) 并发刷新单飞:多个 401 同时发生时只触发一次刷新,其余共用结果
let refreshPromise: Promise<void> | null = null

/** 触发 SDK 内部刷新 token(更新 localStorage),并发去重。 */
async function refreshAccessToken(): Promise<void> {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    try {
      const client = createCloudbaseClient()
      const auth = client.auth()
      // getLoginState 会校验本地态,必要时触发刷新
      await auth.getLoginState()
    } catch {
      // 忽略,交给重试后的 401 处理
    } finally {
      refreshPromise = null
    }
  })()
  return refreshPromise
}

async function safeJson(res: Response): Promise<unknown> {
  // 先一次性读成文本(body 流只能读一次),再尝试 JSON.parse。
  // 避免先 res.json() 失败后又 res.text() 导致 "body stream already read"。
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
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

/** (AUTH-P0-06) 刷新失败:清失效态,跳登录页。 */
function handleSessionExpired(): void {
  try {
    if (CLOUDBASE_ENV_ID) {
      window.localStorage.removeItem(`credentials_${CLOUDBASE_ENV_ID}`)
    }
  } catch {
    // 忽略
  }
  // 跳登录页(若有当前路径则带 redirect)
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.href = '/login'
  }
}

export async function apiFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAccessToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init.headers as Record<string, string>) ?? {}),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetchWithTimeout(path, { ...init, headers }, REQUEST_TIMEOUT_MS)

  if (res.status === 401) {
    // (AUTH-P0-05) token 可能过期,触发 SDK 刷新(并发去重)后重试一次
    await refreshAccessToken()
    const newToken = getAccessToken()
    if (newToken && newToken !== token) {
      headers.Authorization = `Bearer ${newToken}`
      const retry = await fetchWithTimeout(path, { ...init, headers }, REQUEST_TIMEOUT_MS)
      if (!retry.ok) throw new ApiError(retry.status, await safeJson(retry))
      return (await safeJson(retry)) as T
    }
    // (AUTH-P0-06) 刷新失败或仍无 token,清态跳登录
    handleSessionExpired()
    throw new ApiError(401, { error: '登录已过期,请重新登录' })
  }

  if (!res.ok) {
    throw new ApiError(res.status, await safeJson(res))
  }
  return (await safeJson(res)) as T
}
