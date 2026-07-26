'use client'

import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { apiFetch } from '@/lib/cloudbase/api-client'
import { ReflectionHistory } from '@/features/records/components/reflection-history'
import { ReflectionCTA } from '@/features/records/components/reflection-cta.tsx'

type Mood = 'great' | 'fair' | 'poor'

interface Reflection {
  id: string
  user_id: string
  local_date: string
  mood: Mood | null
  best_thing: string | null
  improve_thing: string | null
  tomorrow_focus: string | null
  note: string | null
  is_shared: boolean
  created_at: string
  updated_at: string
}

interface ReflectionState {
  todayReflection: Reflection | null
  history: Reflection[]
  isSaving: boolean
  isLoadingHistory: boolean

  loadToday: (localDate: string) => Promise<void>
  loadHistory: () => Promise<void>
  saveReflection: (data: {
    local_date: string
    mood: Mood | null
    best_thing: string | null
    improve_thing: string | null
    tomorrow_focus: string | null
    note: string | null
    is_shared: boolean
  }) => Promise<{ error: string | null }>
}

export const useReflectionStore = create<ReflectionState>((set) => ({
  todayReflection: null,
  history: [],
  isSaving: false,
  isLoadingHistory: true,

  loadToday: async (localDate) => {
    try {
      const { reflection } = await apiFetch<{ reflection: Reflection | null }>(
        `/api/records/reflections?date=${localDate}`,
      )
      set({ todayReflection: reflection ?? null })
    } catch {
      // 保持空
    }
  },

  loadHistory: async () => {
    try {
      const { reflections } = await apiFetch<{ reflections: Reflection[] }>(
        '/api/records/reflections',
      )
      set({ history: reflections ?? [], isLoadingHistory: false })
    } catch {
      set({ isLoadingHistory: false })
    }
  },

  saveReflection: async (data) => {
    set({ isSaving: true })
    try {
      await apiFetch('/api/records/reflections', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      set({ isSaving: false })
      await useReflectionStore.getState().loadToday(data.local_date)
      await useReflectionStore.getState().loadHistory()
      return { error: null }
    } catch (e) {
      set({ isSaving: false })
      return { error: e instanceof Error ? e.message : '保存失败' }
    }
  },
}))

export function ReflectionView() {
  const { todayReflection, loadToday } = useReflectionStore()
  const [localDate] = useState(() => new Date().toISOString().split('T')[0])

  useEffect(() => {
    loadToday(localDate)
  }, [localDate, loadToday])

  return (
    <div className="space-y-4">
      <ReflectionCTA hasReflection={!!todayReflection} />
      <ReflectionHistory />
    </div>
  )
}
