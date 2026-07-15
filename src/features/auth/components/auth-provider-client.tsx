'use client'

import { useEffect } from 'react'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { recoverBrowserSession } from '@/lib/supabase/client'
import { useAuthStore } from '@/features/auth/store/auth-store'
import type { Database } from '@/lib/supabase/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type BrowserClient = SupabaseClient<Database>

const SESSION_REFRESH_MARGIN_MS = 2 * 60 * 1000
const MIN_REFRESH_DELAY_MS = 30 * 1000

export function AuthProviderClient({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading, setProfile } = useAuthStore()

  useEffect(() => {
    let disposed = false
    let recoveryInFlight: Promise<void> | null = null
    let refreshTimer: ReturnType<typeof setTimeout> | null = null
    let unsubscribe = () => {}

    const loadProfile = async (supabase: BrowserClient, user: User) => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (!disposed) setProfile((data as Profile | null) ?? null)
    }

    const scheduleRefresh = async (supabase: BrowserClient) => {
      if (refreshTimer) clearTimeout(refreshTimer)

      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000))
      const result = await Promise.race([supabase.auth.getSession(), timeout])
      const expiresAt = result?.data.session?.expires_at
      if (!expiresAt || disposed) return

      const delay = Math.max(
        MIN_REFRESH_DELAY_MS,
        expiresAt * 1000 - Date.now() - SESSION_REFRESH_MARGIN_MS
      )
      refreshTimer = setTimeout(() => void recover(), Math.min(delay, 2_147_000_000))
    }

    const subscribe = (supabase: BrowserClient) => {
      unsubscribe()
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (disposed) return

        const user = session?.user ?? null
        setUser(user)
        setLoading(false)
        if (user) {
          setTimeout(() => void loadProfile(supabase, user), 0)
        } else {
          setProfile(null)
        }
      })
      unsubscribe = () => data.subscription.unsubscribe()
    }

    const performRecovery = async () => {
      try {
        const { user, supabase } = await recoverBrowserSession()
        if (disposed) return

        subscribe(supabase)
        setUser(user)
        if (user) {
          await loadProfile(supabase, user)
          await scheduleRefresh(supabase)
        } else {
          setProfile(null)
        }
      } catch {
        // Keep an already-rendered session during a transient same-origin
        // failure. Initial load still exits the loading state below.
      } finally {
        if (!disposed) setLoading(false)
      }
    }

    const recover = () => {
      if (recoveryInFlight) return recoveryInFlight
      recoveryInFlight = performRecovery().finally(() => {
        recoveryInFlight = null
      })
      return recoveryInFlight
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') void recover()
    }
    const onPageShow = () => void recover()
    const onOnline = () => void recover()

    void recover()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('pageshow', onPageShow)
    window.addEventListener('online', onOnline)

    return () => {
      disposed = true
      unsubscribe()
      if (refreshTimer) clearTimeout(refreshTimer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('pageshow', onPageShow)
      window.removeEventListener('online', onOnline)
    }
  }, [setUser, setLoading, setProfile])

  return <>{children}</>
}
