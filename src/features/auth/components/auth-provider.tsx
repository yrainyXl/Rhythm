'use client'

import { useEffect } from 'react'
import { createCloudbaseClient } from '@/lib/cloudbase/client'
import { onAuthStateChanged } from '@/lib/cloudbase/client'
import { useAuthStore } from '@/features/auth/store/auth-store'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    const cloudbase = createCloudbaseClient()

    const initializeAuth = async () => {
      const auth = cloudbase.auth({ persistence: 'local' })
      const user = await auth.currentUser
      if (user) {
        setUser(user)
      }
      setLoading(false)
    }

    initializeAuth()

    const unsubscribe = onAuthStateChanged(cloudbase, (user) => {
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [setUser, setLoading])

  return <>{children}</>
}