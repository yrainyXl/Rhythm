'use client'

import { create } from 'zustand'
import { createBrowserClient, getCurrentUser } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type Recommendation = Database['public']['Tables']['ai_recommendations']['Row']
type RecStatus = 'pending' | 'confirmed' | 'more_data' | 'dismissed'

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
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return
    const { data } = await supabase
      .from('ai_recommendations')
      .select('*')
      .eq('user_id', user.id)
      .eq('weekly_review_id', weeklyReviewId)
      .order('created_at', { ascending: true })
    set({ items: (data ?? []) as Recommendation[], isLoading: false })
  },

  loadPending: async () => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) {
      set({ isLoading: false })
      return
    }
    const { data } = await supabase
      .from('ai_recommendations')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(20)
    set({ items: (data ?? []) as Recommendation[], isLoading: false })
  },

  updateStatus: async (id, status) => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return
    await supabase.from('ai_recommendations').update({ status }).eq('id', id).eq('user_id', user.id)
    const items = get().items.map((r) => (r.id === id ? { ...r, status } : r))
    set({ items })
  },
}))
