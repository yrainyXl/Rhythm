'use client'

import { useEffect } from 'react'
import { createCloudbaseClient } from '@/lib/cloudbase/client'
import { onAuthStateChanged } from '@/lib/cloudbase/client'
import { useAuthStore } from '@/features/auth/store/auth-store'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    const cloudbase = createCloudbaseClient()
    let active = true

    const initializeAuth = async () => {
      try {
        const auth = cloudbase.auth({ persistence: 'local' })
        const user = await auth.currentUser
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

    // @cloudbase/js-sdk 的 onLoginStateChanged 运行时返回 Promise(非函数),
    // 不能直接作为 useEffect cleanup 返回,否则 React 调用 destroy 时报错。
    const unsubscribe = onAuthStateChanged(cloudbase, (user) => {
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
