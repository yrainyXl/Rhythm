'use client'

import { create } from 'zustand'
import { apiFetch } from '@/lib/cloudbase/api-client'

type Intensity = 'light' | 'moderate' | 'intense'
export type SetFeeling = 'easy' | 'slight' | 'challenging' | 'painful'

interface ExerciseTemplate {
  id: string
  user_id: string
  name: string
  category: string
  is_rehab: boolean
  default_sets: number
  default_reps: number | null
  default_duration: number | null
  created_at: string
  updated_at: string
}

interface ExerciseRecord {
  id: string
  user_id: string
  template_id: string | null
  exercise_date: string
  start_time: string | null
  end_time: string | null
  duration_minutes: number | null
  distance_km: number | null
  intensity: Intensity | null
  feeling: number | null
  note: string | null
  is_shared: boolean
  created_at: string
  updated_at: string
}

interface ExerciseAnalysis {
  totalSessions: number
  totalDuration: number
  categoryBreakdown: { category: string; count: number; duration: number }[]
  weeklyTrend: { week: string; sessions: number; duration: number }[]
  rehabProgress: { templateName: string; sessions: number; daysSinceStart: number }[]
}

interface SaveRecordBody {
  template_id: string | null
  exercise_date: string
  duration_minutes: number | null
  distance_km: number | null
  intensity: Intensity | null
  feeling: number | null
  note: string | null
  sets?: { set_number: number; reps: number | null; feeling: SetFeeling | null; is_completed: boolean }[]
}

interface ExerciseState {
  templates: ExerciseTemplate[]
  records: ExerciseRecord[]
  isSaving: boolean
  analysis: ExerciseAnalysis | null
  isLoadingAnalysis: boolean

  loadTemplates: () => Promise<void>
  loadRecentRecords: (limit?: number) => Promise<void>
  createTemplate: (data: Partial<ExerciseTemplate>) => Promise<ExerciseTemplate | null>
  saveRecord: (data: SaveRecordBody) => Promise<{ error: string | null }>
  runAnalysis: () => Promise<void>
}

export const useExerciseStore = create<ExerciseState>((set) => ({
  templates: [],
  records: [],
  isSaving: false,
  analysis: null,
  isLoadingAnalysis: false,

  loadTemplates: async () => {
    try {
      const { templates } = await apiFetch<{ templates: ExerciseTemplate[] }>(
        '/api/records/exercise-templates',
      )
      set({ templates: templates ?? [] })
    } catch {
      // 保持空
    }
  },

  loadRecentRecords: async (limit = 20) => {
    try {
      const { records } = await apiFetch<{ records: ExerciseRecord[] }>(
        `/api/records/exercise?limit=${limit}`,
      )
      set({ records: records ?? [] })
    } catch {
      // 保持空
    }
  },

  createTemplate: async (data) => {
    try {
      const { template } = await apiFetch<{ template: ExerciseTemplate }>(
        '/api/records/exercise-templates',
        {
          method: 'POST',
          body: JSON.stringify({
            name: data.name ?? '',
            category: data.category ?? 'other',
            is_rehab: data.is_rehab ?? false,
            default_sets: data.default_sets ?? 1,
            default_reps: data.default_reps ?? null,
            default_duration: data.default_duration ?? null,
          }),
        },
      )
      await useExerciseStore.getState().loadTemplates()
      return template ?? null
    } catch {
      return null
    }
  },

  saveRecord: async (data) => {
    set({ isSaving: true })
    try {
      await apiFetch('/api/records/exercise', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      await useExerciseStore.getState().loadRecentRecords()
      set({ isSaving: false })
      return { error: null }
    } catch (e) {
      set({ isSaving: false })
      return { error: e instanceof Error ? e.message : '保存失败' }
    }
  },

  runAnalysis: async () => {
    // records(最近30天) 与 templates 并行拉取,前端聚合
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    const startStr = startDate.toISOString().split('T')[0]

    try {
      const [recordsRes, templatesRes] = await Promise.all([
        apiFetch<{ records: ExerciseRecord[] }>('/api/records/exercise?limit=500'),
        apiFetch<{ templates: ExerciseTemplate[] }>('/api/records/exercise-templates'),
      ])
      const records = (recordsRes.records ?? []).filter((r) => r.exercise_date >= startStr)
      const templates = templatesRes.templates ?? []

      const totalSessions = records.length
      const totalDuration = records.reduce((sum, r) => sum + (r.duration_minutes ?? 0), 0)

      const templateMap = new Map(templates.map((t) => [t.id, t]))
      const categoryBreakdown: Record<string, { count: number; duration: number }> = {}
      records.forEach((r) => {
        const template = r.template_id ? templateMap.get(r.template_id) : null
        const cat = template?.category ?? 'other'
        if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { count: 0, duration: 0 }
        categoryBreakdown[cat].count++
        categoryBreakdown[cat].duration += r.duration_minutes ?? 0
      })

      const weeklyData: Record<string, { sessions: number; duration: number }> = {}
      records.forEach((r) => {
        const d = new Date(r.exercise_date + 'T00:00')
        const weekStart = new Date(d)
        weekStart.setDate(d.getDate() - d.getDay() + 1)
        const weekKey = weekStart.toISOString().split('T')[0]
        if (!weeklyData[weekKey]) weeklyData[weekKey] = { sessions: 0, duration: 0 }
        weeklyData[weekKey].sessions++
        weeklyData[weekKey].duration += r.duration_minutes ?? 0
      })
      const weeklyTrend = Object.entries(weeklyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([week, data]) => ({ week, ...data }))

      const rehabTemplates = templates.filter((t) => t.is_rehab)
      const rehabProgress = rehabTemplates.map((t) => {
        const templateRecords = records.filter((r) => r.template_id === t.id)
        const firstRecord = templateRecords[templateRecords.length - 1]
        const daysSinceStart = firstRecord
          ? Math.floor((Date.now() - new Date(firstRecord.exercise_date + 'T00:00').getTime()) / (1000 * 60 * 60 * 24))
          : 0
        return { templateName: t.name, sessions: templateRecords.length, daysSinceStart }
      })

      set({
        analysis: {
          totalSessions,
          totalDuration,
          categoryBreakdown: Object.entries(categoryBreakdown).map(([category, data]) => ({
            category,
            ...data,
          })),
          weeklyTrend,
          rehabProgress,
        },
      })
    } catch {
      // 保持空 analysis
    }
  },
}))
