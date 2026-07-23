'use client'

import { create } from 'zustand'
import { apiFetch } from '@/lib/cloudbase/api-client'

interface Goal {
  id: string
  user_id: string
  title: string
  description: string | null
  category: string
  target_date: string | null
  status: 'active' | 'completed' | 'abandoned'
  created_at: string
  updated_at: string
}

interface GoalKeyResult {
  id: string
  goal_id: string
  user_id: string
  title: string
  target_value: number | null
  current_value: number
  unit: string | null
  status: 'not_started' | 'in_progress' | 'completed'
  created_at: string
  updated_at: string
}

interface GoalMilestone {
  id: string
  goal_id: string
  user_id: string
  key_result_id: string | null
  title: string
  due_date: string | null
  is_completed: boolean
  completed_at: string | null
  created_at: string
  updated_at: string
}

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
    try {
      const { goals } = await apiFetch<{ goals: Goal[] }>('/api/records/goals')
      set({ goals: goals ?? [] })
    } catch {
      // 保持空
    }
  },

  setActiveGoal: (goal) => set({ activeGoal: goal }),

  loadGoalDetail: async (goalId) => {
    try {
      const { goal, keyResults, milestones } = await apiFetch<{
        goal: Goal | null
        keyResults: GoalKeyResult[]
        milestones: GoalMilestone[]
      }>(`/api/records/goals?id=${goalId}`)
      set({
        activeGoal: goal ?? null,
        keyResults: keyResults ?? [],
        milestones: milestones ?? [],
      })
    } catch {
      // 保持空
    }
  },

  createGoal: async (data) => {
    set({ isSaving: true })
    try {
      const { goal } = await apiFetch<{ goal: Goal }>('/api/records/goals', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create',
          title: data.title,
          description: data.description ?? null,
          category: data.category ?? 'other',
          target_date: data.target_date ?? null,
        }),
      })
      set({ isSaving: false })
      await useGoalStore.getState().loadGoals()
      return goal ?? null
    } catch {
      set({ isSaving: false })
      return null
    }
  },

  updateGoalStatus: async (goalId, status) => {
    try {
      await apiFetch('/api/records/goals', {
        method: 'POST',
        body: JSON.stringify({ action: 'status', id: goalId, status }),
      })
      await useGoalStore.getState().loadGoals()
    } catch {
      // 忽略
    }
  },

  addKeyResult: async (goalId, data) => {
    try {
      await apiFetch('/api/records/goals', {
        method: 'POST',
        body: JSON.stringify({
          action: 'add_key_result',
          goal_id: goalId,
          title: data.title,
          target_value: data.target_value ?? null,
          unit: data.unit ?? null,
        }),
      })
      await useGoalStore.getState().loadGoalDetail(goalId)
    } catch {
      // 忽略
    }
  },

  updateKeyResultProgress: async (krId, currentValue) => {
    try {
      await apiFetch('/api/records/goals', {
        method: 'POST',
        body: JSON.stringify({ action: 'update_kr', id: krId, current_value: currentValue }),
      })
      const { activeGoal } = useGoalStore.getState()
      if (activeGoal) {
        await useGoalStore.getState().loadGoalDetail(activeGoal.id)
      }
    } catch {
      // 忽略
    }
  },

  addMilestone: async (goalId, data) => {
    try {
      await apiFetch('/api/records/goals', {
        method: 'POST',
        body: JSON.stringify({
          action: 'add_milestone',
          goal_id: goalId,
          title: data.title,
          key_result_id: data.key_result_id ?? null,
          due_date: data.due_date ?? null,
        }),
      })
      await useGoalStore.getState().loadGoalDetail(goalId)
    } catch {
      // 忽略
    }
  },

  completeMilestone: async (milestoneId) => {
    try {
      await apiFetch('/api/records/goals', {
        method: 'POST',
        body: JSON.stringify({ action: 'complete_milestone', id: milestoneId }),
      })
      const { activeGoal } = useGoalStore.getState()
      if (activeGoal) {
        await useGoalStore.getState().loadGoalDetail(activeGoal.id)
      }
    } catch {
      // 忽略
    }
  },
}))
