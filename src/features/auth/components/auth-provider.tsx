'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/features/auth/store/auth-store'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { refreshProfile, setLoading } = useAuthStore()

  useEffect(() => {
    let active = true

    const initializeAuth = async () => {
      try {
        await refreshProfile()
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // PWA 从后台恢复 / 浏览器前进后退回到页面时,重新确认登录态(cookie 自动携带)。
    const handleResume = () => {
      if (document.visibilityState !== 'visible') return
      void (async () => {
        if (!active) return
        await refreshProfile()
      })()
    }
    const onPageshow = (e: PageTransitionEvent) => {
      if (e.persisted) handleResume()
    }
    document.addEventListener('visibilitychange', handleResume)
    window.addEventListener('pageshow', onPageshow)

    return () => {
      active = false
      document.removeEventListener('visibilitychange', handleResume)
      window.removeEventListener('pageshow', onPageshow)
    }
  }, [refreshProfile, setLoading])

  return <>{children}</>
}
