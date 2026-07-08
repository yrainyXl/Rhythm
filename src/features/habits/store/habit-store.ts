'use client'

import { create } from 'zustand'
import { createBrowserClient, getCurrentUser } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type Habit = Database['public']['Tables']['habits']['Row'] & {
  schedules?: Database['public']['Tables']['habit_schedules']['Row'][]
}
type HabitOccurrence = Database['public']['Tables']['habit_occurrences']['Row']
type HabitLog = Database['public']['Tables']['habit_logs']['Row']

type HabitCategory = Database['public']['Tables']['habits']['Insert']['category']
type TargetType = Database['public']['Tables']['habits']['Insert']['target_type']
type RepeatType = Database['public']['Tables']['habit_schedules']['Insert']['repeat_type']

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

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  occurrences: [],
  isLoading: false,
  isSaving: false,
  formData: { ...defaultFormData },
  errorMessage: null,

  loadHabits: async () => {
    set({ isLoading: true, errorMessage: null })
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)

    let query = supabase.from('habits').select('*, habit_schedules(*)').order('sort_order')
    if (user) query = query.eq('user_id', user.id)

    const { data: habits, error } = await query

    if (error) {
      set({ errorMessage: error.message, isLoading: false })
      return
    }

    set({ habits: habits ?? [], isLoading: false })
  },

  loadTodayOccurrences: async (localDate: string) => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return

    const { data } = await supabase
      .from('habit_occurrences')
      .select('*')
      .eq('user_id', user.id)
      .eq('local_date', localDate)
      .order('created_at')

    set({ occurrences: data ?? [] })
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
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return false

    set({ isSaving: true, errorMessage: null })

    // Create habit
    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .insert({
        user_id: user.id,
        name: formData.name,
        category: formData.category,
        icon: formData.icon,
        color: formData.color,
        target_type: formData.target_type,
        target_value: formData.target_type === 'boolean' ? null : formData.target_value,
        target_unit: formData.target_unit || null,
        is_important: formData.is_important,
        is_shared: formData.is_shared,
      })
      .select()
      .single()

    if (habitError || !habit) {
      set({ errorMessage: habitError?.message ?? '创建失败', isSaving: false })
      return false
    }

    // Create schedule
    const { error: scheduleError } = await supabase
      .from('habit_schedules')
      .insert({
        habit_id: habit.id,
        repeat_type: formData.schedule_repeat_type,
        repeat_days: formData.schedule_repeat_days,
        start_date: formData.schedule_start_date,
        reminder_time: formData.schedule_reminder_time || null,
      })

    if (scheduleError) {
      set({ errorMessage: scheduleError.message, isSaving: false })
      return false
    }

    set({ isSaving: false })
    await get().loadHabits()
    return true
  },

  updateHabit: async (id: string) => {
    const { formData } = get()
    const supabase = createBrowserClient()

    set({ isSaving: true, errorMessage: null })

    const { error: habitError } = await supabase
      .from('habits')
      .update({
        name: formData.name,
        category: formData.category,
        icon: formData.icon,
        color: formData.color,
        target_type: formData.target_type,
        target_value: formData.target_type === 'boolean' ? null : formData.target_value,
        target_unit: formData.target_unit || null,
        is_important: formData.is_important,
        is_shared: formData.is_shared,
      })
      .eq('id', id)

    if (habitError) {
      set({ errorMessage: habitError.message, isSaving: false })
      return false
    }

    // Update schedule
    const { data: existingSchedules } = await supabase
      .from('habit_schedules')
      .select('id')
      .eq('habit_id', id)

    if (existingSchedules && existingSchedules.length > 0) {
      await supabase
        .from('habit_schedules')
        .update({
          repeat_type: formData.schedule_repeat_type,
          repeat_days: formData.schedule_repeat_days,
          start_date: formData.schedule_start_date,
          reminder_time: formData.schedule_reminder_time || null,
        })
        .eq('id', existingSchedules[0].id)
    } else {
      await supabase
        .from('habit_schedules')
        .insert({
          habit_id: id,
          repeat_type: formData.schedule_repeat_type,
          repeat_days: formData.schedule_repeat_days,
          start_date: formData.schedule_start_date,
          reminder_time: formData.schedule_reminder_time || null,
        })
    }

    set({ isSaving: false })
    await get().loadHabits()
    return true
  },

  toggleHabitEnabled: async (id: string, isEnabled: boolean) => {
    const supabase = createBrowserClient()
    await supabase.from('habits').update({ is_enabled: isEnabled }).eq('id', id)
    await get().loadHabits()
  },

  deleteHabit: async (id: string) => {
    const supabase = createBrowserClient()
    await supabase.from('habits').update({ is_enabled: false }).eq('id', id)
    await get().loadHabits()
  },

  completeOccurrence: async (occurrenceId, actualValue, actualDuration, feeling, note) => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return

    const now = new Date().toISOString()

    // Update occurrence status
    await supabase
      .from('habit_occurrences')
      .update({
        status: 'done',
        completed_at: now,
        note: note || null,
      })
      .eq('id', occurrenceId)

    // Create detailed log
    await supabase
      .from('habit_logs')
      .insert({
        occurrence_id: occurrenceId,
        user_id: user.id,
        actual_value: actualValue ?? null,
        actual_duration: actualDuration ?? null,
        feeling: feeling ?? null,
        note: note ?? null,
      })

    set((state) => ({
      occurrences: state.occurrences.map((o) =>
        o.id === occurrenceId
          ? { ...o, status: 'done' as const, completed_at: now, note: note ?? null }
          : o
      ),
    }))
  },

  skipOccurrence: async (occurrenceId) => {
    const supabase = createBrowserClient()
    const now = new Date().toISOString()

    await supabase
      .from('habit_occurrences')
      .update({ status: 'skipped', skipped_at: now })
      .eq('id', occurrenceId)

    set((state) => ({
      occurrences: state.occurrences.map((o) =>
        o.id === occurrenceId
          ? { ...o, status: 'skipped' as const, skipped_at: now }
          : o
      ),
    }))
  },

  resetOccurrence: async (occurrenceId) => {
    const supabase = createBrowserClient()

    await supabase
      .from('habit_occurrences')
      .update({
        status: 'pending',
        completed_at: null,
        skipped_at: null,
        note: null,
      })
      .eq('id', occurrenceId)

    await supabase
      .from('habit_logs')
      .delete()
      .eq('occurrence_id', occurrenceId)

    set((state) => ({
      occurrences: state.occurrences.map((o) =>
        o.id === occurrenceId
          ? { ...o, status: 'pending' as const, completed_at: null, skipped_at: null, note: null }
          : o
      ),
    }))
  },

  generateOccurrences: async (localDate) => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return

    // One query for all enabled habits + their schedules.
    const { data: habits } = await supabase
      .from('habits')
      .select('*, habit_schedules(*)')
      .eq('user_id', user.id)
      .eq('is_enabled', true)

    if (!habits || habits.length === 0) {
      return
    }

    // One query for any occurrences that already exist for this date, so we
    // can skip them instead of firing one request per habit.
    const { data: existing } = await supabase
      .from('habit_occurrences')
      .select('habit_id')
      .eq('user_id', user.id)
      .eq('local_date', localDate)

    const existingHabitIds = new Set((existing ?? []).map((o) => o.habit_id))

    const date = new Date(localDate + 'T00:00:00')
    const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay() // Convert Sunday=0 to 7

    const toInsert = habits
      .filter((habit) => !existingHabitIds.has(habit.id))
      .filter((habit) => {
        const schedule = habit.habit_schedules?.[0]
        if (!schedule) return false

        // Check if date is within the schedule window
        if (date < new Date(schedule.start_date + 'T00:00:00')) return false
        if (schedule.end_date && date > new Date(schedule.end_date + 'T00:00:00')) return false

        switch (schedule.repeat_type) {
          case 'daily':
            return true
          case 'weekdays':
            return dayOfWeek >= 1 && dayOfWeek <= 5
          case 'weekends':
            return dayOfWeek >= 6
          case 'weekly':
            return schedule.repeat_days.includes(dayOfWeek)
          case 'custom':
            return schedule.custom_dates?.includes(localDate) ?? false
          default:
            return false
        }
      })
      .map((habit) => ({
        user_id: user.id,
        habit_id: habit.id,
        local_date: localDate,
        title_snapshot: habit.name,
        target_type_snapshot: habit.target_type,
        target_value_snapshot: habit.target_value,
        target_unit_snapshot: habit.target_unit,
        status: 'pending' as const,
      }))

    if (toInsert.length > 0) {
      // upsert with ignoreDuplicates makes this idempotent: concurrent calls
      // (e.g. React StrictMode double-invoke) that both try to seed the same
      // (habit_id, local_date) no longer collide on the unique constraint.
      await supabase
        .from('habit_occurrences')
        .upsert(toInsert, { onConflict: 'habit_id,local_date', ignoreDuplicates: true })
    }

    // Reload occurrences (single query)
    await get().loadTodayOccurrences(localDate)
  },
}))
