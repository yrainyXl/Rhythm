'use client'

import { useEffect, useRef } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/features/auth/store/auth-store'
import type { Database } from '@/lib/supabase/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

export function AuthProviderClient({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false)
  const { setUser, setLoading, setProfile } = useAuthStore()

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const supabase = createBrowserClient()

    const initializeAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        setUser(session.user)
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          setProfile(profile as Profile)
        }
      }
      setLoading(false)
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user)
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          setProfile(profile as Profile)
        } else {
          setProfile(null)
        }
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, setLoading, setProfile])

  return <>{children}</>
}
