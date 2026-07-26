'use client'

import { create } from 'zustand'
import { apiFetch } from '@/lib/cloudbase/api-client'

type Band = 'morning' | 'afternoon' | 'evening' | 'night'
type Status = 'pending' | 'done' | 'cancelled'

export interface Arrangement {
  id: string
  user_id: string
  local_date: string
  band: Band
  scheduled_time: string | null
  title: string
  status: Status
  sort_order: number
  created_at: string
  updated_at: string
}

interface ArrangementState {
  arrangements: Arrangement[]
  isSaving: boolean

  loadByDate: (date: string) => Promise<void>
  create: (input: { local_date: string; band: Band; title: string; scheduled_time?: string | null }) => Promise<void>
  complete: (id: string) => Promise<void>
  cancel: (id: string) => Promise<void>
  reset: (id: string) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useArrangementStore = create<ArrangementState>((set, get) => ({
  arrangements: [],
  isSaving: false,

  loadByDate: async (date) => {
    try {
      const { arrangements } = await apiFetch<{ arrangements: Arrangement[] }>(
        `/api/arrangements?date=${date}`,
      )
      set({ arrangements: arrangements ?? [] })
    } catch {
      // 保持空
    }
  },

  create: async (input) => {
    set({ isSaving: true })
    try {
      const { arrangement } = await apiFetch<{ arrangement: Arrangement }>(
        '/api/arrangements',
        { method: 'POST', body: JSON.stringify(input) },
      )
      if (arrangement) {
        set({ arrangements: [...get().arrangements, arrangement] })
      }
    } finally {
      set({ isSaving: false })
    }
  },

  complete: async (id) => {
    await apiFetch(`/api/arrangements/${id}?action=complete`, { method: 'PATCH' })
    set({
      arrangements: get().arrangements.map((a) =>
        a.id === id ? { ...a, status: 'done' as Status } : a,
      ),
    })
  },

  cancel: async (id) => {
    await apiFetch(`/api/arrangements/${id}?action=cancel`, { method: 'PATCH' })
    set({
      arrangements: get().arrangements.map((a) =>
        a.id === id ? { ...a, status: 'cancelled' as Status } : a,
      ),
    })
  },

  reset: async (id) => {
    await apiFetch(`/api/arrangements/${id}?action=reset`, { method: 'PATCH' })
    set({
      arrangements: get().arrangements.map((a) =>
        a.id === id ? { ...a, status: 'pending' as Status } : a,
      ),
    })
  },

  remove: async (id) => {
    await apiFetch(`/api/arrangements/${id}`, { method: 'DELETE' })
    set({ arrangements: get().arrangements.filter((a) => a.id !== id) })
  },
}))
