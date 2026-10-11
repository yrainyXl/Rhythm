'use client'

import { create } from 'zustand'
import { apiFetch, ApiError } from '@/lib/api-client'

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
export interface Practice {
  id: string
  user_id: string
  topic_id: string | null
  title: string
  assumption: string | null
  source_highlight_id: string | null
  status: PracticeStatus
  created_at: string
  updated_at: string
}
export interface PracticeRound {
  id: string
  user_id: string
  practice_id: string
  round_number: number
  start_date: string
  end_date: string
  assumption: string | null
  conclusion: string | null
  review_reality: string | null
  review_effect: string | null
  review_adjustment: string | null
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
export interface PracticeLog {
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
  practicesError: string | null
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
    sourceHighlightId?: string | null
  }) => Promise<{ error: string | null; practiceId?: string }>
  endPractice: (id: string) => Promise<{ error: string | null }>
  deletePractice: (id: string) => Promise<{ error: string | null }>

  // 详情 + 多轮
  detailPractice: (Practice & { sourceHighlight: { id: string; book_id: string; book_title: string; mark_text: string; thought: string | null } | null; rounds: (PracticeRound & { log_count: number })[] }) | null
  isLoadingDetail: boolean
  detailError: string | null
  detailRequestId: number
  loadDetail: (id: string) => Promise<void>
  createRound: (practiceId: string, input: { assumption?: string; periodDays: number; conclusion?: string | null }) => Promise<{ error: string | null }>
  endRound: (roundId: string, input?: {
    conclusion?: string | null
    reviewReality?: string | null
    reviewEffect?: string | null
    reviewAdjustment?: string | null
  }) => Promise<{ error: string | null }>
  saveReview: (roundId: string, input: {
    reviewReality?: string | null
    reviewEffect?: string | null
    reviewAdjustment?: string | null
  }) => Promise<{ error: string | null }>

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
  logsErrorsByRound: Record<string, string | null>
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
  practicesError: null,
  isLoadingPractices: true,
  isLoadingTopics: true,
  isLoadingDirections: true,
  methods: [],
  isLoadingMethods: true,
  logsByRound: {},
  logsErrorsByRound: {},
  isLoadingLogs: false,
  detailPractice: null,
  isLoadingDetail: false,
  detailError: null,
  detailRequestId: 0,

  loadPractices: async () => {
    set({ isLoadingPractices: true, practicesError: null })
    try {
      const data = await apiFetch<{ practices: PracticeWithLatestRound[] }>('/api/practice/practices')
      set({ practices: data.practices ?? [], isLoadingPractices: false, practicesError: null })
    } catch {
      set({ isLoadingPractices: false, practicesError: '实践暂时加载失败，请重试' })
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

  createPractice: async ({ title, topicId, assumption, periodDays, sourceHighlightId }) => {
    const t = title.trim()
    if (!t) return { error: '实践名不能为空' }
    if (periodDays < 3 || periodDays > 60) return { error: '周期必须在 3–60 天之间' }
    try {
      const data = await apiFetch<PracticeWithLatestRound>('/api/practice/practices', {
        method: 'POST',
        body: JSON.stringify({ title: t, topicId, assumption: assumption.trim(), periodDays, sourceHighlightId }),
      })
      set({ practices: [data, ...get().practices] })
      return { error: null, practiceId: data.id }
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
      return { error: null }
    } catch (e) { return { error: toErr(e, '结束实践失败') } }
  },

  deletePractice: async (id) => {
    try {
      await apiFetch(`/api/practice/practices/${id}`, { method: 'DELETE' })
      set({ practices: get().practices.filter((p) => p.id !== id) })
      return { error: null }
    } catch (e) { return { error: toErr(e, '删除实践失败') } }
  },

  loadDetail: async (id) => {
    const requestId = get().detailRequestId + 1
    set({ isLoadingDetail: true, detailPractice: null, detailError: null, detailRequestId: requestId })
    try {
      const data = await apiFetch<{ practice: Practice; sourceHighlight: NonNullable<PracticeState['detailPractice']>['sourceHighlight']; rounds: (PracticeRound & { log_count: number })[] }>(`/api/practice/practices/${id}`)
      if (get().detailRequestId !== requestId) return
      set({ detailPractice: data.practice ? { ...data.practice, sourceHighlight: data.sourceHighlight ?? null, rounds: data.rounds ?? [] } : null, isLoadingDetail: false, detailError: data.practice ? null : '实践不存在' })
    } catch (e) {
      if (get().detailRequestId !== requestId) return
      set({ detailPractice: null, isLoadingDetail: false, detailError: toErr(e, '加载实践失败，请重试') })
    }
  },

  createRound: async (practiceId, input) => {
    try {
      await apiFetch(`/api/practice/practices/${practiceId}/rounds`, {
        method: 'POST',
        body: JSON.stringify(input),
      })
      await get().loadDetail(practiceId)
      await get().loadPractices()
      return { error: null }
    } catch (e) {
      return { error: e instanceof Error ? e.message : '创建轮次失败' }
    }
  },

  endRound: async (roundId, input) => {
    try {
      await apiFetch(`/api/practice/rounds/${roundId}?action=end`, {
        method: 'PATCH',
        body: JSON.stringify({
          conclusion: input?.conclusion ?? null,
          reviewReality: input?.reviewReality ?? null,
          reviewEffect: input?.reviewEffect ?? null,
          reviewAdjustment: input?.reviewAdjustment ?? null,
        }),
      })
      const { detailPractice } = get()
      if (detailPractice) {
        await get().loadDetail(detailPractice.id)
      }
      // 刷新列表缓存:本轮结束后 latestRound.status 变 ended,今天/计划页需据此隐藏
      await get().loadPractices()
      return { error: null }
    } catch (e) { return { error: toErr(e, '结束轮次失败') } }
  },

  saveReview: async (roundId, input) => {
    try {
      await apiFetch(`/api/practice/rounds/${roundId}?action=review`, {
        method: 'PATCH',
        body: JSON.stringify({
          reviewReality: input.reviewReality ?? null,
          reviewEffect: input.reviewEffect ?? null,
          reviewAdjustment: input.reviewAdjustment ?? null,
        }),
      })
      const { detailPractice } = get()
      if (detailPractice) {
        await get().loadDetail(detailPractice.id)
      }
      return { error: null }
    } catch (e) {
      return { error: e instanceof Error ? e.message : '保存复盘失败' }
    }
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
    set({ isLoadingLogs: true, logsErrorsByRound: { ...get().logsErrorsByRound, [roundId]: null } })
    try {
      const data = await apiFetch<{ logs: PracticeLog[] }>(`/api/practice/rounds/${roundId}/logs`)
      set({ logsByRound: { ...get().logsByRound, [roundId]: data.logs ?? [] }, isLoadingLogs: false })
    } catch (e) {
      set({ isLoadingLogs: false, logsErrorsByRound: { ...get().logsErrorsByRound, [roundId]: toErr(e, '加载记录失败，请重试') } })
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
          ? list.map((l) => (l.local_date === localDate ? data : l))
          : [data, ...list]
      const detail = get().detailPractice
      set({ logsByRound: { ...get().logsByRound, [roundId]: newList }, detailPractice: detail ? { ...detail, rounds: detail.rounds.map((r) => r.id === roundId ? { ...r, log_count: newList.length } : r) } : null })
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
