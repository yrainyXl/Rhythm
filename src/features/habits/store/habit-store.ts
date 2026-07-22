'use client'

import { create } from 'zustand'
import { apiFetch, ApiError } from '@/lib/cloudbase/api-client'

type HabitCategory = 'self_discipline' | 'learning' | 'exercise' | 'sleep' | 'diet' | 'life' | 'other'
type TargetType = 'boolean' | 'duration' | 'count' | 'value'
type RepeatType = 'daily' | 'weekdays' | 'weekends' | 'weekly' | 'custom'
type OccurrenceStatus = 'pending' | 'done' | 'skipped' | 'missed'

interface HabitSchedule {
  id: string
  habit_id: string
  repeat_type: RepeatType
  repeat_days: number[]
  custom_dates: string[]
  start_date: string
  end_date: string | null
  reminder_time: string | null
  reminder_secondary: boolean
  created_at: string
  updated_at: string
}

interface Habit {
  id: string
  user_id: string
  name: string
  category: HabitCategory
  icon: string | null
  color: string
  target_type: TargetType
  target_value: number | null
  target_unit: string | null
  is_important: boolean
  is_shared: boolean
  is_enabled: boolean
  sort_order: number
  created_at: string
  updated_at: string
  schedules?: HabitSchedule[]
}

export type { Habit, HabitSchedule }

export interface HabitOccurrence {
  id: string
  user_id: string
  habit_id: string
  local_date: string
  title_snapshot: string
  target_type_snapshot: string
  target_value_snapshot: number | null
  target_unit_snapshot: string | null
  status: OccurrenceStatus
  completed_at: string | null
  skipped_at: string | null
  note: string | null
  created_at: string
  updated_at: string
}

interface HabitFormData {
  name: string
  category: HabitCategory
  icon: string
  color: string
  target_type: TargetType
  target_value: number | null
  target_unit: string
  is_important: boolean
  is_shared: boolean
  schedule_repeat_type: RepeatType
  schedule_repeat_days: number[]
  schedule_start_date: string
  schedule_reminder_time: string
}

const defaultFormData: HabitFormData = {
  name: '',
  category: 'self_discipline',
  icon: '○',
  color: '#0ea5e9',
  target_type: 'boolean',
  target_value: null,
  target_unit: '',
  is_important: false,
  is_shared: false,
  schedule_repeat_type: 'daily',
  schedule_repeat_days: [],
  schedule_start_date: new Date().toISOString().split('T')[0],
  schedule_reminder_time: '',
}

interface HabitState {
  habits: Habit[]
  occurrences: HabitOccurrence[]
  isLoading: boolean
  isSaving: boolean
  formData: HabitFormData
  errorMessage: string | null

  loadHabits: () => Promise<void>
  loadTodayOccurrences: (localDate: string) => Promise<void>
  updateFormField: <K extends keyof HabitFormData>(field: K, value: HabitFormData[K]) => void
  resetForm: () => void
  setFormFromHabit: (habit: Habit) => void
  createHabit: () => Promise<boolean>
  updateHabit: (id: string) => Promise<boolean>
  toggleHabitEnabled: (id: string, isEnabled: boolean) => Promise<void>
  deleteHabit: (id: string) => Promise<void>
  completeOccurrence: (occurrenceId: string, actualValue?: number, actualDuration?: number, feeling?: number, note?: string) => Promise<void>
  skipOccurrence: (occurrenceId: string) => Promise<void>
  resetOccurrence: (occurrenceId: string) => Promise<void>
  generateOccurrences: (localDate: string) => Promise<void>
}

const toErrMsg = (e: unknown, fallback: string) =>
  e instanceof ApiError ? (typeof e.body === 'string' ? e.body : (e.body as { error?: string })?.error ?? fallback) : fallback

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  occurrences: [],
  isLoading: false,
  isSaving: false,
  formData: { ...defaultFormData },
  errorMessage: null,

  loadHabits: async () => {
    set({ isLoading: true, errorMessage: null })
    try {
      const data = await apiFetch<{ habits: Habit[] }>('/api/habits')
      set({ habits: data.habits ?? [], isLoading: false })
    } catch (e) {
      set({ errorMessage: toErrMsg(e, '加载失败'), isLoading: false })
    }
  },

  loadTodayOccurrences: async (localDate: string) => {
    try {
      const data = await apiFetch<{ occurrences: HabitOccurrence[] }>(
        `/api/habits/occurrences?date=${encodeURIComponent(localDate)}`,
      )
      set({ occurrences: data.occurrences ?? [] })
    } catch {
      // 静默:未登录或失败时不阻塞 UI
    }
  },

  updateFormField: (field, value) => {
    set((state) => ({
      formData: { ...state.formData, [field]: value },
    }))
  },

  resetForm: () => {
    set({ formData: { ...defaultFormData }, errorMessage: null })
  },

  setFormFromHabit: (habit) => {
    const schedule = habit.schedules?.[0]
    set({
      formData: {
        name: habit.name,
        category: habit.category,
        icon: habit.icon ?? '○',
        color: habit.color,
        target_type: habit.target_type,
        target_value: habit.target_value,
        target_unit: habit.target_unit ?? '',
        is_important: habit.is_important,
        is_shared: habit.is_shared,
        schedule_repeat_type: schedule?.repeat_type ?? 'daily',
        schedule_repeat_days: schedule?.repeat_days ?? [],
        schedule_start_date: schedule?.start_date ?? new Date().toISOString().split('T')[0],
        schedule_reminder_time: schedule?.reminder_time?.slice(0, 5) ?? '',
      },
    })
  },

  createHabit: async () => {
    const { formData } = get()
    set({ isSaving: true, errorMessage: null })
    try {
      await apiFetch('/api/habits', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          icon: formData.icon,
          color: formData.color,
          target_type: formData.target_type,
          target_value: formData.target_type === 'boolean' ? null : formData.target_value,
          target_unit: formData.target_unit || null,
          is_important: formData.is_important,
          is_shared: formData.is_shared,
          schedule_repeat_type: formData.schedule_repeat_type,
          schedule_repeat_days: formData.schedule_repeat_days,
          schedule_start_date: formData.schedule_start_date,
          schedule_reminder_time: formData.schedule_reminder_time || null,
        }),
      })
      set({ isSaving: false })
      await get().loadHabits()
      return true
    } catch (e) {
      set({ errorMessage: toErrMsg(e, '创建失败'), isSaving: false })
      return false
    }
  },

  updateHabit: async (id: string) => {
    const { formData } = get()
    set({ isSaving: true, errorMessage: null })
    try {
      await apiFetch(`/api/habits/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          icon: formData.icon,
          color: formData.color,
          target_type: formData.target_type,
          target_value: formData.target_type === 'boolean' ? null : formData.target_value,
          target_unit: formData.target_unit || null,
          is_important: formData.is_important,
          is_shared: formData.is_shared,
          schedule_repeat_type: formData.schedule_repeat_type,
          schedule_repeat_days: formData.schedule_repeat_days,
          schedule_start_date: formData.schedule_start_date,
          schedule_reminder_time: formData.schedule_reminder_time || null,
        }),
      })
      set({ isSaving: false })
      await get().loadHabits()
      return true
    } catch (e) {
      set({ errorMessage: toErrMsg(e, '更新失败'), isSaving: false })
      return false
    }
  },

  toggleHabitEnabled: async (id: string, isEnabled: boolean) => {
    try {
      await apiFetch(`/api/habits/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_enabled: isEnabled }),
      })
    } catch {
      // 静默回退:重载以反映真实状态
    }
    await get().loadHabits()
  },

  deleteHabit: async (id: string) => {
    try {
      await apiFetch(`/api/habits/${id}`, { method: 'DELETE' })
    } catch {
      // 静默
    }
    await get().loadHabits()
  },

  completeOccurrence: async (occurrenceId, actualValue, actualDuration, feeling, note) => {
    try {
      await apiFetch(`/api/habits/occurrences/${occurrenceId}?action=complete`, {
        method: 'POST',
        body: JSON.stringify({
          actual_value: actualValue ?? null,
          actual_duration: actualDuration ?? null,
          feeling: feeling ?? null,
          note: note ?? null,
        }),
      })
      const now = new Date().toISOString()
      set((state) => ({
        occurrences: state.occurrences.map((o) =>
          o.id === occurrenceId
            ? { ...o, status: 'done' as const, completed_at: now, note: note ?? null }
            : o
        ),
      }))
    } catch {
      // 静默
    }
  },

  skipOccurrence: async (occurrenceId) => {
    try {
      await apiFetch(`/api/habits/occurrences/${occurrenceId}?action=skip`, { method: 'POST' })
      const now = new Date().toISOString()
      set((state) => ({
        occurrences: state.occurrences.map((o) =>
          o.id === occurrenceId
            ? { ...o, status: 'skipped' as const, skipped_at: now }
            : o
        ),
      }))
    } catch {
      // 静默
    }
  },

  resetOccurrence: async (occurrenceId) => {
    try {
      await apiFetch(`/api/habits/occurrences/${occurrenceId}?action=reset`, { method: 'POST' })
      set((state) => ({
        occurrences: state.occurrences.map((o) =>
          o.id === occurrenceId
            ? { ...o, status: 'pending' as const, completed_at: null, skipped_at: null, note: null }
            : o
        ),
      }))
    } catch {
      // 静默
    }
  },

  generateOccurrences: async (localDate) => {
    try {
      await apiFetch('/api/habits/occurrences/generate', {
        method: 'POST',
        body: JSON.stringify({ local_date: localDate }),
      })
    } catch {
      // 静默
    }
    // 生成后重载当日打卡
    await get().loadTodayOccurrences(localDate)
  },
}))
