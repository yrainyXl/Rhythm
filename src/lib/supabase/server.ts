import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './database.types'
import { getSupabaseStorageKey, normalizeLegacyAuthCookies } from './legacy-auth-cookie'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export function createServerSupabaseClient() {
  const cookieStore = cookies()
  const storageKey = getSupabaseStorageKey(SUPABASE_URL)

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookieEncoding: 'raw',
    cookies: {
      getAll: () => normalizeLegacyAuthCookies(cookieStore.getAll(), storageKey),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Server Components cannot always mutate response cookies. Middleware
          // performs the refresh before rendering and persists them there.
        }
      },
    },
  })
}
