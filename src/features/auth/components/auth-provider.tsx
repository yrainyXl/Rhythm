'use client'

import { useEffect } from 'react'
import { createCloudbaseClient } from '@/lib/cloudbase/client'
import { onAuthStateChange } from '@/lib/cloudbase/client'
import { getCurrentUser } from '@/lib/cloudbase/client'
import { useAuthStore } from '@/features/auth/store/auth-store'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading, refreshProfile } = useAuthStore()

  useEffect(() => {
    const cloudbase = createCloudbaseClient()
    let active = true

    const initializeAuth = async () => {
      try {
        const user = await getCurrentUser(cloudbase)
        if (active && user) {
          setUser(user)
          // 会话有效:拉取/建立 profile(首次登录自动建 app_users + profiles)
          void refreshProfile()
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // v3 onAuthStateChange 回调收到事件名(如 INITIAL_SESSION/SIGNED_OUT),
    // wrapper 内部会主动 getLoginState 取当前用户后再回调。
    const unsubscribe = onAuthStateChange(cloudbase, (user) => {
      if (!active) return
      setUser(user)
      setLoading(false)
      if (user) {
        void refreshProfile()
      }
    })

    // (AUTH-P0-04) PWA 从后台恢复 / 浏览器前进后退回到页面时,重新确认登录态。
    // iOS 主屏 PWA 后台 30 分钟后 token 可能已过期,getLoginState 会校验并触发刷新。
    const handleResume = () => {
      if (document.visibilityState !== 'visible') return
      void (async () => {
        const user = await getCurrentUser(cloudbase)
        if (!active) return
        if (user) {
          setUser(user)
          void refreshProfile()
        } else {
          setUser(null)
        }
      })()
    }
    const onPageshow = (e: PageTransitionEvent) => {
      // persisted=true 表示从 bfcache 恢复(后退/前进)
      if (e.persisted) handleResume()
    }
    document.addEventListener('visibilitychange', handleResume)
    window.addEventListener('pageshow', onPageshow)

    return () => {
      active = false
      document.removeEventListener('visibilitychange', handleResume)
      window.removeEventListener('pageshow', onPageshow)
      if (typeof unsubscribe === 'function') {
        ;(unsubscribe as () => void)()
      }
    }
  }, [setUser, setLoading, refreshProfile])

  return <>{children}</>
}
