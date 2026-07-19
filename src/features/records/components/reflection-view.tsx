'use client'

import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { createBrowserClient, getCurrentUser } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'
import { ReflectionHistory } from '@/features/records/components/reflection-history'
import { ReflectionCTA } from '@/features/records/components/reflection-cta.tsx'

type Reflection = Database['public']['Tables']['daily_reflections']['Row']
type Mood = 'great' | 'fair' | 'poor'

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
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return

    const { data } = await supabase
      .from('daily_reflections')
      .select('*')
      .eq('user_id', user.id)
      .eq('local_date', localDate)
      .maybeSingle()

    set({ todayReflection: data ?? null })
  },

  loadHistory: async () => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) {
      set({ isLoadingHistory: false })
      return
    }

    const { data } = await supabase
      .from('daily_reflections')
      .select('*')
      .eq('user_id', user.id)
      .order('local_date', { ascending: false })
      .limit(90)

    set({ history: data ?? [], isLoadingHistory: false })
  },

  saveReflection: async (data) => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return { error: 'Not authenticated' }

    set({ isSaving: true })

    const { error } = await supabase.from('daily_reflections').upsert({
      user_id: user.id,
      local_date: data.local_date,
      mood: data.mood,
      best_thing: data.best_thing,
      improve_thing: data.improve_thing,
      tomorrow_focus: data.tomorrow_focus,
      note: data.note,
      is_shared: data.is_shared,
    }, { onConflict: 'user_id,local_date' })

    set({ isSaving: false })
    if (!error) {
      await useReflectionStore.getState().loadToday(data.local_date)
      await useReflectionStore.getState().loadHistory()
    }
    return { error: error?.message ?? null }
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
