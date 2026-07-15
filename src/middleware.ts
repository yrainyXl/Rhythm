import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  AUTH_COOKIE_OPTIONS,
  getSupabaseStorageKey,
  normalizeLegacyAuthCookies,
} from '@/lib/supabase/legacy-auth-cookie'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

function redirectWithCookies(url: URL, source: NextResponse) {
  const redirect = NextResponse.redirect(url)
  source.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
  source.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'set-cookie') redirect.headers.set(key, value)
  })
  return redirect
}

export async function middleware(req: NextRequest) {
  const storageKey = getSupabaseStorageKey(SUPABASE_URL)
  const originalCookies = req.cookies.getAll()
  const requestCookies = normalizeLegacyAuthCookies(originalCookies, storageKey)
  const migratedCookies = requestCookies.filter((cookie) => {
    const original = originalCookies.find(({ name }) => name === cookie.name)
    return original && original.value !== cookie.value
  })
  const applyMigrations = (target: NextResponse) => {
    migratedCookies.forEach(({ name, value }) =>
      target.cookies.set(name, value, AUTH_COOKIE_OPTIONS)
    )
    if (migratedCookies.length) {
      target.headers.set(
        'Cache-Control',
        'private, no-cache, no-store, must-revalidate, max-age=0'
      )
      target.headers.set('Expires', '0')
      target.headers.set('Pragma', 'no-cache')
    }
  }

  let response = NextResponse.next({ request: req })
  applyMigrations(response)

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookieEncoding: 'raw',
    cookies: {
      getAll: () => requestCookies,
      setAll: (cookiesToSet, headersToSet) => {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
        response = NextResponse.next({ request: req })
        applyMigrations(response)
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
        Object.entries(headersToSet).forEach(([key, value]) => response.headers.set(key, value))
      },
    },
  })

  const { data } = await supabase.auth.getClaims()
  const isAuthenticated = Boolean(data?.claims?.sub)
  const { pathname } = req.nextUrl
  const publicPaths = ['/login', '/auth/callback', '/debug']

  if (!isAuthenticated && !publicPaths.some((path) => pathname.startsWith(path))) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return redirectWithCookies(redirectUrl, response)
  }

  if (isAuthenticated && pathname === '/login') {
    return redirectWithCookies(new URL('/today', req.url), response)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|apple-icon|icon.svg|sb-proxy).*)',
  ],
}
