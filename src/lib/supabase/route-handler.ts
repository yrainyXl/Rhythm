import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './database.types'
import {
  AUTH_COOKIE_OPTIONS,
  getSupabaseStorageKey,
  normalizeLegacyAuthCookies,
} from './legacy-auth-cookie'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export function createRouteHandlerSupabaseClient() {
  const cookieStore = cookies()
  const storageKey = getSupabaseStorageKey(SUPABASE_URL)
  const originalCookies = cookieStore.getAll()
  const normalizedCookies = normalizeLegacyAuthCookies(originalCookies, storageKey)

  normalizedCookies.forEach((cookie) => {
    const original = originalCookies.find(({ name }) => name === cookie.name)
    if (original && original.value !== cookie.value) {
      cookieStore.set(cookie.name, cookie.value, AUTH_COOKIE_OPTIONS)
    }
  })

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookieEncoding: 'raw',
    cookies: {
      getAll: () => normalizedCookies,
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
      },
    },
  })
}
