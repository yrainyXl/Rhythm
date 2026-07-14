import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import { useAuthStore } from '@/features/auth/store/auth-store'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

// 浏览器直连 *.supabase.co 在国内链路波动大(3-6s,偶发超时),冷加载时
// SDK token 刷新一旦撞上波动会永久卡死 initializePromise,getSession 及所有
// 依赖它的数据查询永久转圈。这里把浏览器发往 Supabase 的请求 URL 重写为
// 同源 /sb-proxy/*,由 Vercel rewrites 转发(机房->Supabase 稳定 ~0.6s),
// 绕开慢链路。supabaseUrl 保持不变,故 cookie 名两端一致、session 共享不受
// 影响;服务器端(middleware/API)不经此 fetch,继续直连。
const fetchWithProxy: typeof fetch = (input, init) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  let finalInput: RequestInfo | URL = input
  if (typeof window !== 'undefined' && SUPABASE_URL) {
    const origin = window.location.origin
    const rewrite = (u: string) =>
      u.startsWith(SUPABASE_URL) ? `${origin}/sb-proxy${u.slice(SUPABASE_URL.length)}` : u
    if (typeof input === 'string') {
      finalInput = rewrite(input)
    } else if (input instanceof Request) {
      const newUrl = rewrite(input.url)
      if (newUrl !== input.url) finalInput = new Request(newUrl, input)
    }
  }
  return fetch(finalInput, { ...init, signal: init?.signal ?? controller.signal }).finally(() =>
    clearTimeout(timer)
  )
}

export const createBrowserClient = () => {
  return createClientComponentClient<Database>({
    options: {
      global: { fetch: fetchWithProxy },
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
