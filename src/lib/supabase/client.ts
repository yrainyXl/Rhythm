import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export const createBrowserClient = () => {
  return createClientComponentClient<Database>()
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
