'use client'

import { create } from 'zustand'
import { createBrowserClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type ExerciseTemplate = Database['public']['Tables']['exercise_templates']['Row']
type ExerciseRecord = Database['public']['Tables']['exercise_records']['Row']
type ExerciseSetLog = Database['public']['Tables']['exercise_set_logs']['Row']

type ExerciseCategory = Database['public']['Tables']['exercise_templates']['Insert']['category']
type Intensity = 'light' | 'moderate' | 'intense'
type SetFeeling = 'easy' | 'slight' | 'challenging' | 'painful'

interface ExerciseAnalysis {
  totalSessions: number
  totalDuration: number
  categoryBreakdown: { category: string; count: number; duration: number }[]
  weeklyTrend: { week: string; sessions: number; duration: number }[]
  rehabProgress: { templateName: string; sessions: number; daysSinceStart: number }[]
}

interface ExerciseState {
  templates: ExerciseTemplate[]
  records: ExerciseRecord[]
  isSaving: boolean
  analysis: ExerciseAnalysis | null

  loadTemplates: () => Promise<void>
  loadRecentRecords: (limit?: number) => Promise<void>
  createTemplate: (data: Partial<ExerciseTemplate>) => Promise<ExerciseTemplate | null>
  saveRecord: (data: {
    template_id: string | null
    exercise_date: string
    duration_minutes: number | null
    distance_km: number | null
    intensity: Intensity | null
    feeling: number | null
    note: string | null
    sets?: { set_number: number; reps: number | null; feeling: SetFeeling | null; is_completed: boolean }[]
  }) => Promise<{ error: string | null }>
  runAnalysis: () => Promise<void>
}

export const useExerciseStore = create<ExerciseState>((set) => ({
  templates: [],
  records: [],
  isSaving: false,
  analysis: null,

  loadTemplates: async () => {
    const supabase = createBrowserClient()
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return

    const { data } = await supabase
      .from('exercise_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at')

    set({ templates: data ?? [] })
  },

  loadRecentRecords: async (limit = 20) => {
    const supabase = createBrowserClient()
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return

    const { data } = await supabase
      .from('exercise_records')
      .select('*')
      .eq('user_id', user.id)
      .order('exercise_date', { ascending: false })
      .limit(limit)

    set({ records: data ?? [] })
  },

  createTemplate: async (data) => {
    const supabase = createBrowserClient()
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return null

    const { data: template, error } = await supabase
      .from('exercise_templates')
      .insert({
        user_id: user.id,
        name: data.name ?? '',
        category: data.category ?? 'other',
        is_rehab: data.is_rehab ?? false,
        default_sets: data.default_sets ?? 1,
        default_reps: data.default_reps ?? null,
        default_duration: data.default_duration ?? null,
      })
      .select()
      .single()

    if (!error) {
      await useExerciseStore.getState().loadTemplates()
    }
    return template ?? null
  },

  saveRecord: async (data) => {
    const supabase = createBrowserClient()
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return { error: 'Not authenticated' }

    set({ isSaving: true })

    const { data: record, error: recordError } = await supabase
      .from('exercise_records')
      .insert({
        user_id: user.id,
        template_id: data.template_id,
        exercise_date: data.exercise_date,
        duration_minutes: data.duration_minutes,
        distance_km: data.distance_km,
        intensity: data.intensity,
        feeling: data.feeling,
        note: data.note,
      })
      .select()
      .single()

    if (recordError) {
      set({ isSaving: false })
      return { error: recordError.message }
    }

    // Save set logs if it's a rehab exercise
    if (data.sets && data.sets.length > 0 && record) {
      await supabase.from('exercise_set_logs').insert(
        data.sets.map((set) => ({
          record_id: record.id,
          user_id: user.id,
          set_number: set.set_number,
          reps: set.reps,
          feeling: set.feeling,
          is_completed: set.is_completed,
        }))
      )
    }

    set({ isSaving: false })
    await useExerciseStore.getState().loadRecentRecords()
    return { error: null }
  },

  runAnalysis: async () => {
    const supabase = createBrowserClient()
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return

    // Get records from last 30 days
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    const startStr = startDate.toISOString().split('T')[0]

    const { data: recentRecords } = await supabase
      .from('exercise_records')
      .select('*')
      .eq('user_id', user.id)
      .gte('exercise_date', startStr)
      .order('exercise_date')

    const records = recentRecords ?? []

    const totalSessions = records.length
    const totalDuration = records.reduce((sum, r) => sum + (r.duration_minutes ?? 0), 0)

    // Category breakdown
    const { data: templates } = await supabase
      .from('exercise_templates')
      .select('id, name, category, is_rehab')
      .eq('user_id', user.id)

    const templateMap = new Map(templates?.map((t) => [t.id, t]) ?? [])
    const categoryBreakdown: Record<string, { count: number; duration: number }> = {}

    records.forEach((r) => {
      const template = r.template_id ? templateMap.get(r.template_id) : null
      const cat = template?.category ?? 'other'
      if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { count: 0, duration: 0 }
      categoryBreakdown[cat].count++
      categoryBreakdown[cat].duration += r.duration_minutes ?? 0
    })

    // Weekly trend
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

    // Rehab progress
    const rehabTemplates = templates?.filter((t) => t.is_rehab) ?? []
    const rehabProgress = rehabTemplates.map((t) => {
      const templateRecords = records.filter((r) => r.template_id === t.id)
      const firstRecord = templateRecords[templateRecords.length - 1]
      const daysSinceStart = firstRecord
        ? Math.floor((Date.now() - new Date(firstRecord.exercise_date + 'T00:00').getTime()) / (1000 * 60 * 60 * 24))
        : 0

      return {
        templateName: t.name,
        sessions: templateRecords.length,
        daysSinceStart,
      }
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
  },
}))
