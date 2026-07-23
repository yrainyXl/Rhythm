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

    return () => {
      active = false
      if (typeof unsubscribe === 'function') {
        ;(unsubscribe as () => void)()
      }
    }
  }, [setUser, setLoading])

  return <>{children}</>
}
