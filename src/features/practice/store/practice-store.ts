'use client'

import { create } from 'zustand'
import { createBrowserClient, getCurrentUser } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type Topic = Database['public']['Tables']['topics']['Row']
type Direction = Database['public']['Tables']['directions']['Row']
type Practice = Database['public']['Tables']['practices']['Row']
type PracticeRound = Database['public']['Tables']['practice_rounds']['Row']
type MethodRow = Database['public']['Tables']['methods']['Row']
type MethodStatus = 'confirmed' | 'validating' | 'archived'
type PracticeLog = Database['public']['Tables']['practice_logs']['Row']
type LogStatus = 'done' | 'partial' | 'skipped'

export interface PracticeWithLatestRound extends Practice {
  latestRound: PracticeRound | null
}

interface PracticeState {
  practices: PracticeWithLatestRound[]
  topics: Topic[]
  directions: Direction[]
  isLoadingPractices: boolean
  isLoadingTopics: boolean
  isLoadingDirections: boolean

  loadPractices: () => Promise<void>
  loadTopics: () => Promise<void>
  loadDirections: () => Promise<void>
  createDirection: (title: string, description: string | null) => Promise<{ error: string | null }>
  archiveDirection: (id: string) => Promise<void>
  deleteDirection: (id: string) => Promise<void>

  createPractice: (input: {
    title: string
    topicId: string | null
    assumption: string
    periodDays: number
  }) => Promise<{ error: string | null }>
  endPractice: (id: string) => Promise<void>
  deletePractice: (id: string) => Promise<void>

  methods: MethodRow[]
  isLoadingMethods: boolean

  loadMethods: () => Promise<void>
  createMethod: (input: {
    title: string
    condition: string
    status: MethodStatus
  }) => Promise<{ error: string | null }>
  updateMethodStatus: (id: string, status: MethodStatus) => Promise<void>
  deleteMethod: (id: string) => Promise<void>

  logsByRound: Record<string, PracticeLog[]>
  isLoadingLogs: boolean

  loadLogsForRound: (roundId: string) => Promise<void>
  upsertLog: (input: {
    roundId: string
    localDate: string
    status: LogStatus
    note?: string
  }) => Promise<{ error: string | null }>
  deleteLog: (id: string) => Promise<void>
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
  directions: [],
  isLoadingPractices: true,
  isLoadingTopics: true,
  isLoadingDirections: true,
  methods: [],
  isLoadingMethods: true,
  logsByRound: {},
  isLoadingLogs: false,

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

  loadDirections: async () => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) {
      set({ isLoadingDirections: false })
      return
    }

    const { data } = await supabase
      .from('directions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    set({ directions: data ?? [], isLoadingDirections: false })
  },

  createDirection: async (title, description) => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return { error: 'Not authenticated' }

    const trimmed = title.trim()
    if (!trimmed) return { error: '方向标题不能为空' }

    const { data, error } = await supabase
      .from('directions')
      .insert({
        user_id: user.id,
        title: trimmed,
        description: description?.trim() || null
      })
      .select()
      .single()

    if (error) return { error: error.message }
    if (data) {
      set({ directions: [data, ...get().directions] })
    }
    return { error: null }
  },

  archiveDirection: async (id) => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return

    await supabase.from('directions').update({ status: 'archived' }).eq('id', id).eq('user_id', user.id)
    set({ directions: get().directions.filter((d) => d.id !== id) })
  },

  deleteDirection: async (id) => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return

    await supabase.from('directions').delete().eq('id', id).eq('user_id', user.id)
    set({ directions: get().directions.filter((d) => d.id !== id) })
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

  loadMethods: async () => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) {
      set({ isLoadingMethods: false })
      return
    }

    const { data } = await supabase
      .from('methods')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'archived')
      .order('created_at', { ascending: false })

    set({ methods: data ?? [], isLoadingMethods: false })
  },

  createMethod: async ({ title, condition, status }) => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return { error: 'Not authenticated' }

    const t = title.trim()
    if (!t) return { error: '方法标题不能为空' }

    const { data, error } = await supabase
      .from('methods')
      .insert({
        user_id: user.id,
        title: t,
        condition: condition.trim() || null,
        status,
      })
      .select()
      .single()

    if (error) return { error: error.message }
    if (data) {
      set({ methods: [data, ...get().methods] })
    }
    return { error: null }
  },

  updateMethodStatus: async (id, status) => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return

    await supabase.from('methods').update({ status }).eq('id', id).eq('user_id', user.id)
    if (status === 'archived') {
      set({ methods: get().methods.filter((m) => m.id !== id) })
    } else {
      set({ methods: get().methods.map((m) => (m.id === id ? { ...m, status } : m)) })
    }
  },

  deleteMethod: async (id) => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return

    await supabase.from('methods').delete().eq('id', id).eq('user_id', user.id)
    set({ methods: get().methods.filter((m) => m.id !== id) })
  },

  loadLogsForRound: async (roundId) => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return

    set({ isLoadingLogs: true })
    const { data } = await supabase
      .from('practice_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('round_id', roundId)
      .order('local_date', { ascending: false })

    set({
      logsByRound: { ...get().logsByRound, [roundId]: data ?? [] },
      isLoadingLogs: false,
    })
  },

  upsertLog: async ({ roundId, localDate, status, note }) => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return { error: 'Not authenticated' }

    const existing = (get().logsByRound[roundId] ?? []).find((l) => l.local_date === localDate)

    if (existing) {
      const { data, error } = await supabase
        .from('practice_logs')
        .update({ status, note: note?.trim() || null })
        .eq('id', existing.id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) return { error: error.message }
      if (data) {
        const list = (get().logsByRound[roundId] ?? []).map((l) => (l.id === existing.id ? data : l))
        set({ logsByRound: { ...get().logsByRound, [roundId]: list } })
      }
      return { error: null }
    }

    const { data, error } = await supabase
      .from('practice_logs')
      .insert({
        user_id: user.id,
        round_id: roundId,
        local_date: localDate,
        status,
        note: note?.trim() || null,
      })
      .select()
      .single()

    if (error) return { error: error.message }
    if (data) {
      const list = [data, ...(get().logsByRound[roundId] ?? [])]
      set({ logsByRound: { ...get().logsByRound, [roundId]: list } })
    }
    return { error: null }
  },

  deleteLog: async (id) => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return

    await supabase.from('practice_logs').delete().eq('id', id).eq('user_id', user.id)
    const map = get().logsByRound
    const newMap: Record<string, PracticeLog[]> = {}
    for (const [k, list] of Object.entries(map)) {
      newMap[k] = list.filter((l) => l.id !== id)
    }
    set({ logsByRound: newMap })
  },
}))
