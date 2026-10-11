'use client'

import { useAuthStore } from '@/features/auth/store/auth-store'
import { useThemeStore } from '@/features/app/store/theme-store'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { CalendarCheck, Target, LineChart, BookOpen, User } from 'lucide-react'

const navItems = [
  { href: '/today', label: '今天', Icon: CalendarCheck },
  { href: '/habits', label: '计划', Icon: Target },
  { href: '/records', label: '记录', Icon: LineChart },
  { href: '/reading', label: '阅读', Icon: BookOpen },
  { href: '/me', label: '我的', Icon: User },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { profile } = useAuthStore()
  const initTheme = useThemeStore((s) => s.initTheme)

  useEffect(() => {
    initTheme()
  }, [initTheme])

  const showNav = !['/login', '/onboarding', '/'].includes(pathname)

  return (
    <div className="max-w-lg mx-auto min-h-screen relative">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-xl focus:bg-rhythm-card focus:px-4 focus:py-3 focus:text-rhythm-text-primary">跳到主要内容</a>
      {showNav && (
        <header className="sticky top-0 z-20 px-6 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))] bg-rhythm-void border-b border-rhythm-border">
          <div className="flex items-center justify-between">
            <Link href="/today" className="inline-flex min-h-[44px] items-center text-lg font-semibold tracking-tight text-rhythm-text-primary no-underline">Rhythm</Link>
            <Link
              href="/me"
              aria-label="我的资料与设置"
              className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-medium text-rhythm-text-primary border border-rhythm-border bg-rhythm-card-hover transition-colors"
            >
              {profile?.nickname?.[0] ?? '·'}
            </Link>
          </div>
        </header>
      )}

      <main id="main-content" tabIndex={-1} className={showNav ? 'pb-[calc(6rem+env(safe-area-inset-bottom))]' : ''}>
        {children}
      </main>

      {showNav && (
        <nav aria-label="主要导航" className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg z-20 bg-rhythm-void border-t border-rhythm-border">
          <div className="flex justify-around px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
            {navItems.map(({ href, label, Icon }) => {
              const isActive = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex min-h-[48px] flex-1 flex-col justify-center items-center gap-1 px-1 py-1 text-xs transition-colors ${
                    isActive ? 'text-rhythm-text-primary font-semibold' : 'text-rhythm-text-secondary hover:text-rhythm-text-primary'
                  }`}
                >
                  <Icon aria-hidden="true" size={22} strokeWidth={isActive ? 2 : 1.7} />
                  <span>{label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}
