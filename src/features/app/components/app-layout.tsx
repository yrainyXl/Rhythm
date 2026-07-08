'use client'

import { useAuthStore } from '@/features/auth/store/auth-store'
import { useThemeStore } from '@/features/app/store/theme-store'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { NotificationPrompt } from '@/features/notifications/notification-prompt'
import { CalendarCheck, Target, LineChart, BookOpen, User } from 'lucide-react'

const navItems = [
  { href: '/today', label: '今天', Icon: CalendarCheck },
  { href: '/habits', label: '计划', Icon: Target },
  { href: '/records', label: '记录', Icon: LineChart },
  { href: '/couple', label: '词条', Icon: BookOpen },
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
      {showNav && (
        <header className="sticky top-0 z-20 px-5 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] backdrop-blur-md bg-rhythm-void/70 border-b border-rhythm-border">
          <div className="flex items-center justify-between">
            <h1 className="r-title text-base">
              {profile?.nickname ? `${profile.nickname} 的节奏` : 'Rhythm'}
            </h1>
            <Link
              href="/me"
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-rhythm-text-secondary border border-rhythm-border-strong bg-rhythm-glow-soft transition-colors hover:text-rhythm-text-primary"
            >
              {profile?.nickname?.[0] ?? '·'}
            </Link>
          </div>
        </header>
      )}

      <main className={showNav ? 'pb-[calc(6rem+env(safe-area-inset-bottom))]' : ''}>
        {children}
      </main>

      {showNav && <NotificationPrompt />}

      {showNav && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg z-20 backdrop-blur-md bg-rhythm-void/80 border-t border-rhythm-border">
          <div className="flex justify-around px-2 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))]">
            {navItems.map(({ href, label, Icon }) => {
              const isActive = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-col items-center gap-1 px-3 py-1 text-[0.65rem] tracking-[0.05em] transition-colors duration-300 ${
                    isActive ? 'text-rhythm-glow' : 'text-rhythm-text-muted hover:text-rhythm-text-secondary'
                  }`}
                >
                  <Icon size={19} strokeWidth={isActive ? 2 : 1.5} />
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
