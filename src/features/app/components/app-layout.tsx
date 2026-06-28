'use client'

import { useAuthStore } from '@/features/auth/store/auth-store'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NotificationPrompt } from '@/features/notifications/notification-prompt'

const navItems = [
  { href: '/today', label: '今天', icon: '📋' },
  { href: '/habits', label: '计划', icon: '🎯' },
  { href: '/records', label: '记录', icon: '📊' },
  { href: '/couple', label: '我们', icon: '💑' },
  { href: '/me', label: '我的', icon: '👤' },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { profile } = useAuthStore()

  const showNav = !['/login', '/onboarding'].includes(pathname)

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-white shadow-sm relative">
      {showNav && (
        <header className="sticky top-0 z-10 bg-white border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-900">
              {profile?.nickname ? `${profile.nickname} 的生活` : 'Rhythm'}
            </h1>
            <Link href="/me" className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm text-gray-600">
              {profile?.nickname?.[0] ?? '?'}
            </Link>
          </div>
        </header>
      )}

      <main className={showNav ? 'pb-20' : ''}>
        {children}
      </main>

      {showNav && <NotificationPrompt />}

      {showNav && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white border-t z-10">
          <div className="flex justify-around py-2">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${
                    isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}
