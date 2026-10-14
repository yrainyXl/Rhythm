'use client'

import { useAuthStore } from '@/features/auth/store/auth-store'
import { useThemeStore } from '@/features/app/store/theme-store'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { CalendarDays, Target, BarChart3, BookOpen } from 'lucide-react'

// 「我的」放在右上角头像，底部只保留四个主模块
const navItems = [
  { href: '/today', label: '今天', Icon: CalendarDays },
  { href: '/habits', label: '计划', Icon: Target },
  { href: '/records', label: '记录', Icon: BarChart3 },
  { href: '/reading', label: '阅读', Icon: BookOpen },
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
        <header className="px-4 pl-5 pt-[calc(0.5rem+env(safe-area-inset-top))]">
          <div className="flex items-center justify-between">
            <Link href="/today" className="inline-flex min-h-[44px] items-center text-[17px] font-semibold text-rhythm-text-primary no-underline gap-2" translate="no"><span className="r-beats" aria-hidden="true"><i /><i /><i /></span>Rhythm</Link>
            <Link
              href="/me"
              aria-label="我的资料与设置"
              aria-current={pathname.startsWith('/me') ? 'page' : undefined}
              className="grid h-11 w-11 place-items-center"
            >
              <span className={`grid h-9 w-9 place-items-center rounded-full bg-gradient-to-b from-[#A6A6AD] to-[#85858C] text-[15px] font-semibold text-white ${pathname.startsWith('/me') ? 'ring-2 ring-rhythm-glow ring-offset-2 ring-offset-[var(--r-page-background)]' : ''}`}>
                {profile?.nickname?.[0] ?? '·'}
              </span>
            </Link>
          </div>
        </header>
      )}

      <main id="main-content" tabIndex={-1} className={showNav ? 'pb-[calc(7rem+env(safe-area-inset-bottom))]' : ''}>
        {children}
      </main>

      {showNav && (
        <nav aria-label="主要导航" className="fixed left-1/2 -translate-x-1/2 z-20 bottom-[calc(1rem+env(safe-area-inset-bottom))] w-[min(398px,calc(100%-24px))]">
          <div className="r-glass flex h-[62px] rounded-full p-1">
            {navItems.map(({ href, label, Icon }) => {
              const isActive = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                    isActive ? 'bg-[rgb(var(--r-neutral)/0.08)] text-rhythm-glow' : 'text-rhythm-text-primary'
                  }`}
                >
                  <Icon aria-hidden="true" size={24} strokeWidth={1.8} />
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
