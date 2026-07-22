import { NextResponse, type NextRequest } from 'next/server'
import { getCloudbaseAppUserId } from './lib/cloudbase/route-handler'

export async function middleware(request: NextRequest) {
  const userId = await getCloudbaseAppUserId(request)
  if (!userId) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  // Add user id to request headers for downstream use
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-app-user-id', userId)
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - login
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!login|api|_next/static|_next/image|favicon.ico).*)',
  ],
}
