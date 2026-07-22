'use client'

import { create } from 'zustand'
import { apiFetch } from '@/lib/cloudbase/api-client'

type RecStatus = 'pending' | 'confirmed' | 'more_data' | 'dismissed'
type RecKind = 'observation' | 'try' | 'method_suggest'

interface Recommendation {
  id: string
  user_id: string
  kind: RecKind
  weekly_review_id: string | null
  title: string
  body_md: string | null
  evidence_ref: unknown
  uncertainty_note: string | null
  status: RecStatus
  created_at: string
  updated_at: string
}

interface AiRecState {
  items: Recommendation[]
  isLoading: boolean
  loadByReview: (weeklyReviewId: string) => Promise<void>
  loadPending: () => Promise<void>
  updateStatus: (id: string, status: RecStatus) => Promise<void>
}

export const useAiRecommendationStore = create<AiRecState>((set, get) => ({
  items: [],
  isLoading: true,

  loadByReview: async (weeklyReviewId) => {
    try {
      const data = await apiFetch<{ items: Recommendation[] }>(
        `/api/practice/ai-recommendations?weeklyReviewId=${encodeURIComponent(weeklyReviewId)}`,
      )
      set({ items: data.items ?? [], isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  loadPending: async () => {
    try {
      const data = await apiFetch<{ items: Recommendation[] }>(
        '/api/practice/ai-recommendations?status=pending',
      )
      set({ items: data.items ?? [], isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  updateStatus: async (id, status) => {
    try {
      await apiFetch(`/api/practice/ai-recommendations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      const items = get().items.map((r) => (r.id === id ? { ...r, status } : r))
      set({ items })
    } catch {}
  },
}))
