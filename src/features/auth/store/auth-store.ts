import { create } from 'zustand'
import { apiFetch, ApiError } from '@/lib/cloudbase/api-client'

interface Profile {
  id: string
  email?: string
  username?: string
  nickname?: string
  avatar_url?: string
  timezone?: string
  preferred_wake_time?: string
  preferred_sleep_time?: string
  work_days?: number[]
  created_at?: string
  updated_at?: string
}

type CloudbaseUser = {
  uid?: string
  username?: string
  email?: string
}

interface AuthState {
  user: CloudbaseUser | null
  profile: Profile | null
  isLoading: boolean
  setUser: (user: CloudbaseUser | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (isLoading: boolean) => void
  refreshProfile: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const toErr = (e: unknown, fallback: string) =>
  e instanceof ApiError ? (typeof e.body === 'string' ? e.body : (e.body as { error?: string })?.error ?? fallback) : fallback

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isLoading: true,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),

  // 会话恢复/建用户:同源 /api/auth/refresh,cookie 自动携带。
  refreshProfile: async () => {
    try {
      const { user } = await apiFetch<{ user: Profile | null }>('/api/auth/refresh', {
        method: 'POST',
      })
      set({ profile: user ?? null, user: user ? { uid: user.id, email: user.email } : null })
    } catch {
      set({ profile: null, user: null })
    }
  },

  // 同源代理登录:服务端调网关 + 写 httpOnly cookie,避开浏览器直连网关的 CORS。
  signInWithEmail: async (email, password) => {
    try {
      const { user } = await apiFetch<{ user: Profile | null }>('/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ username: email, password }),
      })
      if (!user) return { error: '登录失败' }
      set({ profile: user, user: { uid: user.id, email: user.email } })
      return { error: null }
    } catch (e) {
      return { error: toErr(e, '登录失败') }
    }
  },

  signInWithMagicLink: async () => ({ error: '暂不支持免密码登录' }),

  signUp: async () => ({ error: '请在 CloudBase 控制台创建账号后登录' }),

  signOut: async () => {
    try {
      await apiFetch('/api/auth/signout', { method: 'POST' })
    } catch {
      // 忽略,前端仍清态
    }
    set({ user: null, profile: null, isLoading: false })
  },
}))
