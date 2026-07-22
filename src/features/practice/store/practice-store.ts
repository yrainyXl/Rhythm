'use client'

import { create } from 'zustand'
import { apiFetch, ApiError } from '@/lib/cloudbase/api-client'

type TopicStatus = 'active' | 'archived'
type PracticeStatus = 'active' | 'ended'
type RoundStatus = 'active' | 'ended'
type MethodStatus = 'confirmed' | 'validating' | 'archived'
type LogStatus = 'done' | 'partial' | 'skipped'

interface Topic {
  id: string
  user_id: string
  question: string
  status: TopicStatus
  created_at: string
  updated_at: string
}
interface Direction {
  id: string
  user_id: string
  title: string
  description: string | null
  status: string
  created_at: string
  updated_at: string
}
interface Practice {
  id: string
  user_id: string
  topic_id: string | null
  title: string
  assumption: string | null
  status: PracticeStatus
  created_at: string
  updated_at: string
}
interface PracticeRound {
  id: string
  user_id: string
  practice_id: string
  round_number: number
  start_date: string
  end_date: string
  assumption: string | null
  conclusion: string | null
  status: RoundStatus
  created_at: string
  updated_at: string
}
interface MethodRow {
  id: string
  user_id: string
  title: string
  condition: string | null
  source_round_id: string | null
  status: MethodStatus
  created_at: string
  updated_at: string
}
interface PracticeLog {
  id: string
  user_id: string
  round_id: string
  local_date: string
  status: LogStatus
  note: string | null
  created_at: string
  updated_at: string
}

export interface PracticeWithLatestRound extends Practice {
  latestRound: PracticeRound | null
}

const toErr = (e: unknown, fallback: string) =>
  e instanceof ApiError ? (typeof e.body === 'string' ? e.body : (e.body as { error?: string })?.error ?? fallback) : fallback

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
  createTopic: (question: string) => Promise<{ error: string | null }>
  archiveTopic: (id: string) => Promise<void>
  deleteTopic: (id: string) => Promise<void>
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
    try {
      const data = await apiFetch<{ practices: PracticeWithLatestRound[] }>('/api/practice/practices')
      set({ practices: data.practices ?? [], isLoadingPractices: false })
    } catch {
      set({ practices: [], isLoadingPractices: false })
    }
  },

  loadTopics: async () => {
    try {
      const data = await apiFetch<{ topics: Topic[] }>('/api/practice/topics')
      set({ topics: data.topics ?? [], isLoadingTopics: false })
    } catch {
      set({ isLoadingTopics: false })
    }
  },

  createTopic: async (question) => {
    const trimmed = question.trim()
    if (!trimmed) return { error: '议题不能为空' }
    try {
      const data = await apiFetch<Topic>('/api/practice/topics', {
        method: 'POST',
        body: JSON.stringify({ question: trimmed }),
      })
      set({ topics: [data, ...get().topics] })
      return { error: null }
    } catch (e) {
      return { error: toErr(e, '创建失败') }
    }
  },

  archiveTopic: async (id) => {
    try {
      await apiFetch(`/api/practice/topics/${id}`, { method: 'PATCH', body: JSON.stringify({}) })
      set({ topics: get().topics.filter((t) => t.id !== id) })
    } catch {}
  },

  deleteTopic: async (id) => {
    try {
      await apiFetch(`/api/practice/topics/${id}`, { method: 'DELETE' })
      set({ topics: get().topics.filter((t) => t.id !== id) })
    } catch {}
  },

  loadDirections: async () => {
    try {
      const data = await apiFetch<{ directions: Direction[] }>('/api/practice/directions')
      set({ directions: data.directions ?? [], isLoadingDirections: false })
    } catch {
      set({ isLoadingDirections: false })
    }
  },

  createDirection: async (title, description) => {
    const trimmed = title.trim()
    if (!trimmed) return { error: '方向标题不能为空' }
    try {
      const data = await apiFetch<Direction>('/api/practice/directions', {
        method: 'POST',
        body: JSON.stringify({ title: trimmed, description: description?.trim() || null }),
      })
      set({ directions: [data, ...get().directions] })
      return { error: null }
    } catch (e) {
      return { error: toErr(e, '创建失败') }
    }
  },

  archiveDirection: async (id) => {
    try {
      await apiFetch(`/api/practice/directions/${id}`, { method: 'PATCH', body: JSON.stringify({}) })
      set({ directions: get().directions.filter((d) => d.id !== id) })
    } catch {}
  },

  deleteDirection: async (id) => {
    try {
      await apiFetch(`/api/practice/directions/${id}`, { method: 'DELETE' })
      set({ directions: get().directions.filter((d) => d.id !== id) })
    } catch {}
  },

  createPractice: async ({ title, topicId, assumption, periodDays }) => {
    const t = title.trim()
    if (!t) return { error: '实践名不能为空' }
    if (periodDays < 3 || periodDays > 60) return { error: '周期必须在 3–60 天之间' }
    try {
      const data = await apiFetch<PracticeWithLatestRound>('/api/practice/practices', {
        method: 'POST',
        body: JSON.stringify({ title: t, topicId, assumption: assumption.trim(), periodDays }),
      })
      set({ practices: [data, ...get().practices] })
      return { error: null }
    } catch (e) {
      return { error: toErr(e, '创建失败') }
    }
  },

  endPractice: async (id) => {
    try {
      await apiFetch(`/api/practice/practices/${id}?action=end`, { method: 'PATCH', body: JSON.stringify({}) })
      const practices = get().practices.map((p) =>
        p.id === id
          ? { ...p, status: 'ended' as const, latestRound: p.latestRound ? { ...p.latestRound, status: 'ended' as const } : null }
          : p,
      )
      set({ practices })
    } catch {}
  },

  deletePractice: async (id) => {
    try {
      await apiFetch(`/api/practice/practices/${id}`, { method: 'DELETE' })
      set({ practices: get().practices.filter((p) => p.id !== id) })
    } catch {}
  },

  loadMethods: async () => {
    try {
      const data = await apiFetch<{ methods: MethodRow[] }>('/api/practice/methods')
      set({ methods: data.methods ?? [], isLoadingMethods: false })
    } catch {
      set({ isLoadingMethods: false })
    }
  },

  createMethod: async ({ title, condition, status }) => {
    const t = title.trim()
    if (!t) return { error: '方法标题不能为空' }
    try {
      const data = await apiFetch<MethodRow>('/api/practice/methods', {
        method: 'POST',
        body: JSON.stringify({ title: t, condition: condition.trim() || '', status }),
      })
      set({ methods: [data, ...get().methods] })
      return { error: null }
    } catch (e) {
      return { error: toErr(e, '创建失败') }
    }
  },

  updateMethodStatus: async (id, status) => {
    try {
      await apiFetch(`/api/practice/methods/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
      if (status === 'archived') {
        set({ methods: get().methods.filter((m) => m.id !== id) })
      } else {
        set({ methods: get().methods.map((m) => (m.id === id ? { ...m, status } : m)) })
      }
    } catch {}
  },

  deleteMethod: async (id) => {
    try {
      await apiFetch(`/api/practice/methods/${id}`, { method: 'DELETE' })
      set({ methods: get().methods.filter((m) => m.id !== id) })
    } catch {}
  },

  loadLogsForRound: async (roundId) => {
    set({ isLoadingLogs: true })
    try {
      const data = await apiFetch<{ logs: PracticeLog[] }>(`/api/practice/rounds/${roundId}/logs`)
      set({ logsByRound: { ...get().logsByRound, [roundId]: data.logs ?? [] }, isLoadingLogs: false })
    } catch {
      set({ isLoadingLogs: false })
    }
  },

  upsertLog: async ({ roundId, localDate, status, note }) => {
    try {
      const data = await apiFetch<PracticeLog>(`/api/practice/rounds/${roundId}/logs`, {
        method: 'POST',
        body: JSON.stringify({ localDate, status, note: note?.trim() || null }),
      })
      const list = get().logsByRound[roundId] ?? []
      const existingIdx = list.findIndex((l) => l.local_date === localDate)
      const newList =
        existingIdx >= 0
          ? list.map((l) => (l.id === data.id ? data : l))
          : [data, ...list]
      set({ logsByRound: { ...get().logsByRound, [roundId]: newList } })
      return { error: null }
    } catch (e) {
      return { error: toErr(e, '保存失败') }
    }
  },

  deleteLog: async (id) => {
    try {
      await apiFetch(`/api/practice/logs/${id}`, { method: 'DELETE' })
      const map = get().logsByRound
      const newMap: Record<string, PracticeLog[]> = {}
      for (const [k, list] of Object.entries(map)) {
        newMap[k] = list.filter((l) => l.id !== id)
      }
      set({ logsByRound: newMap })
    } catch {}
  },
}))
