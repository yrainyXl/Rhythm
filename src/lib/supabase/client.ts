import { createBrowserClient as createSsrBrowserClient } from '@supabase/ssr'
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import { createBrowserClientOptions, createProxyFetch } from './browser-config'
import { requestServerSession } from './auth-recovery'
import { useAuthStore } from '@/features/auth/store/auth-store'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

type BrowserClient = SupabaseClient<Database>

let browserClient: BrowserClient | null = null

function buildBrowserClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables')
  }

  const proxyFetch = createProxyFetch({ supabaseUrl: SUPABASE_URL })
  return createSsrBrowserClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    createBrowserClientOptions(proxyFetch)
  )
}

export function createBrowserClient() {
  browserClient ??= buildBrowserClient()
  return browserClient
}

/**
 * Drops any pending auth initialization owned by the previous client.
 * This is intentionally application-owned instead of relying on the library
 * singleton, because an iOS PWA may resume with a fetch that will never settle.
 */
export function replaceBrowserClient() {
  if (browserClient) void browserClient.auth.stopAutoRefresh()
  browserClient = buildBrowserClient()
  return browserClient
}

/**
 * Refreshes the cookie on the server, where the Supabase connection is stable,
 * then replaces the browser client so no stale initializePromise survives.
 */
export async function recoverBrowserSession() {
  try {
    const user = await requestServerSession()
    return { user, supabase: replaceBrowserClient() }
  } catch (error) {
    replaceBrowserClient()
    throw error
  }
}

export async function getCurrentUser(_supabase?: BrowserClient) {
  const cached = useAuthStore.getState().user
  if (cached) return cached

  try {
    const { user } = await recoverBrowserSession()
    return user
  } catch {
    return null
  }
}

export function createServerClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables')
  }

  return createSupabaseClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
}
