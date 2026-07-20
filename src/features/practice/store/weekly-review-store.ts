'use client'

import { create } from 'zustand'
import { createBrowserClient, getCurrentUser } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type WeeklyReview = Database['public']['Tables']['weekly_reviews']['Row']

interface WeeklyReviewState {
  reviews: WeeklyReview[]
  isLoading: boolean
  loadReviews: () => Promise<void>
  updateStatus: (id: string, status: 'unread' | 'confirmed' | 'edited') => Promise<void>
}

export const useWeeklyReviewStore = create<WeeklyReviewState>((set, get) => ({
  reviews: [],
  isLoading: true,

  loadReviews: async () => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) {
      set({ isLoading: false })
      return
    }
    const { data } = await supabase
      .from('weekly_reviews')
      .select('*')
      .eq('user_id', user.id)
      .order('week_start', { ascending: false })
      .limit(30)
    set({ reviews: (data ?? []) as WeeklyReview[], isLoading: false })
  },

  updateStatus: async (id, status) => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return
    await supabase.from('weekly_reviews').update({ status }).eq('id', id).eq('user_id', user.id)
    const reviews = get().reviews.map((r) => (r.id === id ? { ...r, status } : r))
    set({ reviews })
  },
}))
