'use client'

import { create } from 'zustand'
import { apiFetch } from '@/lib/cloudbase/api-client'

export interface Capture {
  id: string
  user_id: string
  local_date: string
  content: string
  created_at: string
}

interface CaptureState {
  captures: Capture[]
  isSaving: boolean

  loadByDate: (date: string) => Promise<void>
  create: (input: { local_date: string; content: string }) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useCaptureStore = create<CaptureState>((set, get) => ({
  captures: [],
  isSaving: false,

  loadByDate: async (date) => {
    try {
      const { captures } = await apiFetch<{ captures: Capture[] }>(`/api/captures?date=${date}`)
      set({ captures: captures ?? [] })
    } catch {
      // 保持空
    }
  },

  create: async (input) => {
    set({ isSaving: true })
    try {
      const { capture } = await apiFetch<{ capture: Capture }>('/api/captures', {
        method: 'POST',
        body: JSON.stringify(input),
      })
      if (capture) {
        set({ captures: [capture, ...get().captures] })
      }
    } finally {
      set({ isSaving: false })
    }
  },

  remove: async (id) => {
    try {
      await apiFetch(`/api/captures/${id}`, { method: 'DELETE' })
      set({ captures: get().captures.filter((c) => c.id !== id) })
    } catch {}
  },
}))
