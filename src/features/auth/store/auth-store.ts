import { create } from 'zustand'
import { createCloudbaseClient, signInWithPassword, signOut } from '@/lib/cloudbase/client'
import { getCurrentUser } from '@/lib/cloudbase/client'
import { apiFetch } from '@/lib/cloudbase/api-client'

interface Profile {
  id: string
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

// v3 SDK 的 IUser 类型在此处不便直接导入(类型链绕),
// 用最小可用结构承接,实际字段由 SDK 返回。
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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isLoading: true,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),

  refreshProfile: async () => {
    try {
      const { user } = await apiFetch<{ user: Profile | null }>('/api/auth/refresh', {
        method: 'POST',
      })
      set({ profile: user ?? null })
    } catch {
      // 未登录或 token 失效,保持 profile=null
      set({ profile: null })
    }
  },

  signInWithEmail: async (email: string, password: string) => {
    try {
      const cloudbaseClient = createCloudbaseClient()
      // v3 走「用户名密码登录」,用户名即邮箱。返回 { data, error },不抛异常。
      const { error } = await signInWithPassword(cloudbaseClient, email, password)
      if (error) {
        return { error: error instanceof Error ? error.message : '登录失败' }
      }
      const user = await getCurrentUser(cloudbaseClient)
      set({ user: user as CloudbaseUser | null })
      // 登录成功后拉取/建立 profile(首次登录会自动建 app_users + profiles)
      void useAuthStore.getState().refreshProfile()
      return { error: null }
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : '登录失败' }
    }
  },

  signInWithMagicLink: async () => {
    // Cloudbase does not support magic link login out of the box
    return { error: '暂不支持免密码登录' }
  },

  signUp: async (email: string, password: string) => {
    // 用户名密码登录场景下,账号由 CloudBase 控制台创建;
    // SDK 未提供「用户名密码」对应的注册入口,暂不支持前端注册
    void email
    void password
    return { error: '请在 CloudBase 控制台创建账号后登录' }
  },

  signOut: async () => {
    const cloudbaseClient = createCloudbaseClient()
    await signOut(cloudbaseClient)
    set({ user: null })
  },
}))
