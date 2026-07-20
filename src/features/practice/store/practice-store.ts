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

  createPractice: (input: {
    title: string
    topicId: string | null
    assumption: string
    periodDays: number
  }) => Promise<{ error: string | null }>
  endPractice: (id: string) => Promise<void>
  deletePractice: (id: string) => Promise<void>
}

function daysFromNow(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days - 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function todayIso(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
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

  createPractice: async ({ title, topicId, assumption, periodDays }) => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return { error: 'Not authenticated' }

    const t = title.trim()
    if (!t) return { error: '实践名不能为空' }
    if (periodDays < 3 || periodDays > 60) return { error: '周期必须在 3–60 天之间' }

    const { data: practice, error: pErr } = await supabase
      .from('practices')
      .insert({
        user_id: user.id,
        title: t,
        topic_id: topicId,
        assumption: assumption.trim() || null,
      })
      .select()
      .single()

    if (pErr || !practice) return { error: pErr?.message ?? '创建失败' }

    const { data: round, error: rErr } = await supabase
      .from('practice_rounds')
      .insert({
        user_id: user.id,
        practice_id: practice.id,
        round_number: 1,
        start_date: todayIso(),
        end_date: daysFromNow(periodDays),
        assumption: assumption.trim() || null,
      })
      .select()
      .single()

    if (rErr) return { error: rErr.message }

    const withRound: PracticeWithLatestRound = { ...practice, latestRound: round ?? null }
    set({ practices: [withRound, ...get().practices] })
    return { error: null }
  },

  endPractice: async (id) => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return

    await supabase.from('practices').update({ status: 'ended' }).eq('id', id).eq('user_id', user.id)
    const { data: latestRound } = await supabase
      .from('practice_rounds')
      .select('*')
      .eq('user_id', user.id)
      .eq('practice_id', id)
      .order('round_number', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (latestRound && latestRound.status === 'active') {
      await supabase.from('practice_rounds').update({ status: 'ended' }).eq('id', latestRound.id)
    }
    const practices = get().practices.map((p) =>
      p.id === id
        ? { ...p, status: 'ended' as const, latestRound: p.latestRound ? { ...p.latestRound, status: 'ended' as const } : null }
        : p,
    )
    set({ practices })
  },

  deletePractice: async (id) => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return

    await supabase.from('practices').delete().eq('id', id).eq('user_id', user.id)
    set({ practices: get().practices.filter((p) => p.id !== id) })
  },
}))
