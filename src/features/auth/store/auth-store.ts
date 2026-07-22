import { create } from 'zustand'
import cloudbase from '@cloudbase/js-sdk'
import { createCloudbaseClient } from '@/lib/cloudbase/client'
import { signInWithEmailAndPassword, signOut } from '@/lib/cloudbase/client'

interface AuthState {
  user: cloudbase.auth.IUser | null
  isLoading: boolean
  setUser: (user: cloudbase.auth.IUser | null) => void
  setLoading: (isLoading: boolean) => void
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,

  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),

  signInWithEmail: async (email: string, password: string) => {
    try {
      const cloudbaseClient = createCloudbaseClient()
      await signInWithEmailAndPassword(cloudbaseClient, email, password)
      const auth = cloudbaseClient.auth({ persistence: 'local' })
      const user = await auth.currentUser
      set({ user })
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
    try {
      const cloudbaseClient = createCloudbaseClient()
      const auth = cloudbaseClient.auth({ persistence: 'local' })
      // In cloudbase, signUpWithEmailAndPassword is the correct method
      await auth.signUpWithEmailAndPassword(email, password)
      return { error: null }
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : '注册失败' }
    }
  },

  signOut: async () => {
    const cloudbaseClient = createCloudbaseClient()
    await signOut(cloudbaseClient)
    set({ user: null })
  },
}))
