import { NextResponse, type NextRequest } from 'next/server'

// Next.js 14.2 middleware 强制 Edge runtime,无法加载 @cloudbase/node-sdk 或 pg
// (动态代码评估/原生模块在 Edge 不可用);且 Cloudbase JS SDK 登录态存在浏览器
// localStorage,Edge middleware 服务端也读不到。因此页面级鉴权交给
// Server Component / Route Handler(nodejs runtime)处理,此处仅放行。
export async function middleware(_request: NextRequest) {
  return NextResponse.next()
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
