'use client'

import { create } from 'zustand'
import { createBrowserClient, getCurrentUser } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type Goal = Database['public']['Tables']['goals']['Row']
type GoalKeyResult = Database['public']['Tables']['goal_key_results']['Row']
type GoalMilestone = Database['public']['Tables']['goal_milestones']['Row']

interface GoalState {
  goals: Goal[]
  activeGoal: Goal | null
  keyResults: GoalKeyResult[]
  milestones: GoalMilestone[]
  isSaving: boolean

  loadGoals: () => Promise<void>
  loadGoalDetail: (goalId: string) => Promise<void>
  setActiveGoal: (goal: Goal | null) => void
  createGoal: (data: { title: string; description?: string; category?: string; target_date?: string }) => Promise<Goal | null>
  updateGoalStatus: (goalId: string, status: 'active' | 'completed' | 'abandoned') => Promise<void>
  addKeyResult: (goalId: string, data: { title: string; target_value?: number; unit?: string }) => Promise<void>
  updateKeyResultProgress: (krId: string, currentValue: number) => Promise<void>
  addMilestone: (goalId: string, data: { title: string; key_result_id?: string; due_date?: string }) => Promise<void>
  completeMilestone: (milestoneId: string) => Promise<void>
}

export const useGoalStore = create<GoalState>((set) => ({
  goals: [],
  activeGoal: null,
  keyResults: [],
  milestones: [],
  isSaving: false,

  loadGoals: async () => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return

    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    set({ goals: data ?? [] })
  },

  setActiveGoal: (goal) => set({ activeGoal: goal }),

  loadGoalDetail: async (goalId) => {
    const supabase = createBrowserClient()

    // goal / key results / milestones are independent -> fetch in parallel
    const [goalRes, keyResultsRes, milestonesRes] = await Promise.all([
      supabase.from('goals').select('*').eq('id', goalId).single(),
      supabase.from('goal_key_results').select('*').eq('goal_id', goalId).order('created_at'),
      supabase.from('goal_milestones').select('*').eq('goal_id', goalId).order('created_at'),
    ])

    set({
      activeGoal: goalRes.data ?? null,
      keyResults: keyResultsRes.data ?? [],
      milestones: milestonesRes.data ?? [],
    })
  },

  createGoal: async (data) => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return null

    set({ isSaving: true })
    const { data: goal, error } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        title: data.title,
        description: data.description ?? null,
        category: data.category ?? 'other',
        target_date: data.target_date ?? null,
      })
      .select()
      .single()

    set({ isSaving: false })
    if (!error) await useGoalStore.getState().loadGoals()
    return goal ?? null
  },

  updateGoalStatus: async (goalId, status) => {
    const supabase = createBrowserClient()
    await supabase.from('goals').update({ status }).eq('id', goalId)
    await useGoalStore.getState().loadGoals()
  },

  addKeyResult: async (goalId, data) => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return

    await supabase.from('goal_key_results').insert({
      goal_id: goalId,
      user_id: user.id,
      title: data.title,
      target_value: data.target_value ?? null,
      unit: data.unit ?? null,
    })

    await useGoalStore.getState().loadGoalDetail(goalId)
  },

  updateKeyResultProgress: async (krId, currentValue) => {
    const supabase = createBrowserClient()

    const { data: kr } = await supabase
      .from('goal_key_results')
      .select('target_value')
      .eq('id', krId)
      .single()

    const status = kr?.target_value != null && currentValue >= kr.target_value
      ? 'completed'
      : 'in_progress'

    await supabase
      .from('goal_key_results')
      .update({ current_value: currentValue, status })
      .eq('id', krId)

    // Reload detail
    if (useGoalStore.getState().activeGoal) {
      await useGoalStore.getState().loadGoalDetail(useGoalStore.getState().activeGoal!.id)
    }
  },

  addMilestone: async (goalId, data) => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return

    await supabase.from('goal_milestones').insert({
      goal_id: goalId,
      user_id: user.id,
      title: data.title,
      key_result_id: data.key_result_id ?? null,
      due_date: data.due_date ?? null,
    })

    await useGoalStore.getState().loadGoalDetail(goalId)
  },

  completeMilestone: async (milestoneId) => {
    const supabase = createBrowserClient()
    const now = new Date().toISOString()

    await supabase
      .from('goal_milestones')
      .update({ is_completed: true, completed_at: now })
      .eq('id', milestoneId)

    if (useGoalStore.getState().activeGoal) {
      await useGoalStore.getState().loadGoalDetail(useGoalStore.getState().activeGoal!.id)
    }
  },
}))
