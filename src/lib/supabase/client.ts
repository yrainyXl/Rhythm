import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import { useAuthStore } from '@/features/auth/store/auth-store'

// iOS Safari 独立 PWA(添加到主屏)从后台恢复时，fetch 请求可能永久挂起
// 不返回。supabase 初始化时的 token 刷新一旦卡在这样的请求上，
// initializePromise 永不 resolve，getSession() 及所有依赖它的数据查询
// 就会永久转圈。给每个请求套一个 AbortController 超时，挂起的请求会在
// 15s 后被中断并抛错（刷新失败可恢复），而不是无限等待。
const fetchWithTimeout: typeof fetch = (input, init) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  return fetch(input, { ...init, signal: init?.signal ?? controller.signal }).finally(() =>
    clearTimeout(timer)
  )
}

export const createBrowserClient = () => {
  return createClientComponentClient<Database>({
    options: {
      global: { fetch: fetchWithTimeout },
      auth: {
        // iOS Safari 独立 PWA 模式下 navigator.locks 会永久挂起，导致
        // getSession() 在拿锁阶段就卡死（此时还没发出 fetch，上面的超时
        // 救不了），应用永久停在加载态。用直接执行的 no-op lock 绕过
        // Web Locks，session 仍从 localStorage 正常读取。
        lock: async (_name, _acquireTimeout, fn) => fn(),
      },
    },
  })
}

export const createServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

type BrowserClient = ReturnType<typeof createBrowserClient>

/**
 * Reads the current user for data queries.
 *
 * Prefers the user already cached in the auth store — it's populated by
 * AuthProviderClient's onAuthStateChange listener and kept fresh, so reading
 * it is synchronous and never blocks.
 *
 * Only falls back to `supabase.auth.getSession()` when the cache is empty
 * (e.g. a query fires before auth init completes). That call awaits
 * `initializePromise` internally, which can hang indefinitely on iOS Safari
 * standalone PWAs if the token-refresh request stalls — so we race it against
 * a 3s timeout to guarantee data loads resolve instead of spinning forever.
 */
export async function getCurrentUser(supabase: BrowserClient) {
  const cached = useAuthStore.getState().user
  if (cached) return cached

  const withTimeout = Promise.race([
    supabase.auth.getSession().then(({ data }) => data.session?.user ?? null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
  ])
  return await withTimeout
}
