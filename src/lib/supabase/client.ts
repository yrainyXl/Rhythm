import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export const createBrowserClient = () => {
  return createClientComponentClient<Database>({
    options: {
      auth: {
        // iOS Safari 独立 PWA 模式下 navigator.locks 会永久挂起，
        // 导致 getSession() 卡死、应用停在加载态。用直接执行的 no-op
        // lock 绕过 Web Locks，session 仍从 localStorage 正常读取。
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
 * Reads the current user from the locally-cached session.
 * Prefer this over `supabase.auth.getUser()`, which makes a network round-trip
 * to the Auth server on every call and is the main source of slow data loads.
 * `getSession()` reads from the in-memory/localStorage cache (auto-refreshed
 * by the onAuthStateChange listener) so it's effectively free.
 */
export async function getCurrentUser(supabase: BrowserClient) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.user ?? null
}
