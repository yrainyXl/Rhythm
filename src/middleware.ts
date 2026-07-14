import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  // Public routes
  const publicPaths = ['/login', '/auth/callback', '/debug']

  if (!session && !publicPaths.some((p) => pathname.startsWith(p))) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If logged in and trying to access login, redirect to today
  if (session && pathname === '/login') {
    return NextResponse.redirect(new URL('/today', req.url))
  }

  return res
}

export const config = {
  // sb-proxy 走 rewrites 转发 Supabase,必须排除,否则会被当作受保护路由重定向到登录
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sb-proxy).*)'],
}
