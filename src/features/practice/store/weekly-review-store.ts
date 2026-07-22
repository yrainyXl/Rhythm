'use client'

import { create } from 'zustand'
import { apiFetch } from '@/lib/cloudbase/api-client'

type ReviewStatus = 'unread' | 'confirmed' | 'edited'

interface WeeklyReview {
  id: string
  user_id: string
  week_start: string
  week_end: string
  practice_completion_rate: number | null
  reflection_count: number
  average_sleep_hours: number | null
  ai_body_md: string | null
  status: ReviewStatus
  created_at: string
  updated_at: string
}

interface WeeklyReviewState {
  reviews: WeeklyReview[]
  isLoading: boolean
  loadReviews: () => Promise<void>
  updateStatus: (id: string, status: ReviewStatus) => Promise<void>
}

export const useWeeklyReviewStore = create<WeeklyReviewState>((set, get) => ({
  reviews: [],
  isLoading: true,

  loadReviews: async () => {
    try {
      const data = await apiFetch<{ reviews: WeeklyReview[] }>('/api/practice/weekly-reviews')
      set({ reviews: data.reviews ?? [], isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  updateStatus: async (id, status) => {
    try {
      await apiFetch(`/api/practice/weekly-reviews/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      const reviews = get().reviews.map((r) => (r.id === id ? { ...r, status } : r))
      set({ reviews })
    } catch {}
  },
}))
