'use client'

import { create } from 'zustand'
import { createBrowserClient, getCurrentUser } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type Topic = Database['public']['Tables']['topics']['Row']
type Practice = Database['public']['Tables']['practices']['Row']
type PracticeRound = Database['public']['Tables']['practice_rounds']['Row']

export interface PracticeWithLatestRound extends Practice {
  latestRound: PracticeRound | null
}

interface PracticeState {
  practices: PracticeWithLatestRound[]
  topics: Topic[]
  isLoadingPractices: boolean
  isLoadingTopics: boolean

  loadPractices: () => Promise<void>
  loadTopics: () => Promise<void>
  createTopic: (question: string) => Promise<{ error: string | null }>
  archiveTopic: (id: string) => Promise<void>
  deleteTopic: (id: string) => Promise<void>
}

export const usePracticeStore = create<PracticeState>((set, get) => ({
  practices: [],
  topics: [],
  isLoadingPractices: true,
  isLoadingTopics: true,

  loadPractices: async () => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) {
      set({ isLoadingPractices: false })
      return
    }

    const { data: practices } = await supabase
      .from('practices')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!practices) {
      set({ practices: [], isLoadingPractices: false })
      return
    }

    const { data: rounds } = await supabase
      .from('practice_rounds')
      .select('*')
      .eq('user_id', user.id)
      .order('round_number', { ascending: false })

    const roundsByPractice = new Map<string, PracticeRound>()
    for (const r of rounds ?? []) {
      if (!roundsByPractice.has(r.practice_id)) {
        roundsByPractice.set(r.practice_id, r)
      }
    }

    const withRounds: PracticeWithLatestRound[] = practices.map((p) => ({
      ...p,
      latestRound: roundsByPractice.get(p.id) ?? null,
    }))

    set({ practices: withRounds, isLoadingPractices: false })
  },

  loadTopics: async () => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) {
      set({ isLoadingTopics: false })
      return
    }

    const { data } = await supabase
      .from('topics')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    set({ topics: data ?? [], isLoadingTopics: false })
  },

  createTopic: async (question) => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return { error: 'Not authenticated' }

    const trimmed = question.trim()
    if (!trimmed) return { error: '议题不能为空' }

    const { data, error } = await supabase
      .from('topics')
      .insert({ user_id: user.id, question: trimmed })
      .select()
      .single()

    if (error) return { error: error.message }
    if (data) {
      set({ topics: [data, ...get().topics] })
    }
    return { error: null }
  },

  archiveTopic: async (id) => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return

    await supabase.from('topics').update({ status: 'archived' }).eq('id', id).eq('user_id', user.id)
    set({ topics: get().topics.filter((t) => t.id !== id) })
  },

  deleteTopic: async (id) => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return

    await supabase.from('topics').delete().eq('id', id).eq('user_id', user.id)
    set({ topics: get().topics.filter((t) => t.id !== id) })
  },
}))
