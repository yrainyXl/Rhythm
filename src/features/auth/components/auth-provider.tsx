'use client'

import { useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/features/auth/store/auth-store'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading, refreshProfile } = useAuthStore()

  useEffect(() => {
    const supabase = createBrowserClient()

    const initializeAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        setUser(session.user)
        await refreshProfile()
      }

      setLoading(false)
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user)
        await refreshProfile()
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, setLoading, refreshProfile])

  return <>{children}</>
}
