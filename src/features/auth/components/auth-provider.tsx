'use client'

import { useEffect } from 'react'
import { createCloudbaseClient } from '@/lib/cloudbase/client'
import { onAuthStateChange } from '@/lib/cloudbase/client'
import { getCurrentUser } from '@/lib/cloudbase/client'
import { useAuthStore } from '@/features/auth/store/auth-store'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    const cloudbase = createCloudbaseClient()
    let active = true

    const initializeAuth = async () => {
      try {
        const user = await getCurrentUser(cloudbase)
        if (active && user) {
          setUser(user)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // v3 onAuthStateChange 同步返回 { data: { subscription: { unsubscribe } } },
    // 返回的 unsubscribe 是真正的清理函数。
    const unsubscribe = onAuthStateChange(cloudbase, (user) => {
      if (!active) return
      setUser(user)
      setLoading(false)
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
