'use client'

import { create } from 'zustand'
import { createBrowserClient, getCurrentUser } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type SleepRecord = Database['public']['Tables']['sleep_records']['Row']
type SleepInsert = Database['public']['Tables']['sleep_records']['Insert']
type SleepQuality = 'great' | 'fair' | 'poor'

interface SleepActivity {
  activity: string
  time: string
}

interface SleepAnalysis {
  averageDuration: number
  averageQuality: number
  greatCount: number
  fairCount: number
  poorCount: number
  weeklyTrend: { date: string; duration: number; quality: number }[]
  commonPreSleep: string[]
  correlationNote: string
}

interface SleepState {
  sleepRecords: SleepRecord[]
  recentRecord: SleepRecord | null
  isSaving: boolean
  analysis: SleepAnalysis | null
  isLoadingAnalysis: boolean

  loadRecentSleep: () => Promise<void>
  loadSleepHistory: (days: number) => Promise<void>
  saveSleepRecord: (record: SleepInsert) => Promise<{ error: string | null }>
  runAnalysis: (days?: number) => Promise<void>
}

export const useSleepStore = create<SleepState>((set) => ({
  sleepRecords: [],
  recentRecord: null,
  isSaving: false,
  analysis: null,
  isLoadingAnalysis: false,

  loadRecentSleep: async () => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return

    const { data } = await supabase
      .from('sleep_records')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    set({ recentRecord: data?.[0] ?? null })
  },

  loadSleepHistory: async (days: number) => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startStr = startDate.toISOString().split('T')[0]

    const { data } = await supabase
      .from('sleep_records')
      .select('*')
      .eq('user_id', user.id)
      .gte('sleep_date', startStr)
      .order('sleep_date', { ascending: false })

    set({ sleepRecords: data ?? [] })
  },

  saveSleepRecord: async (record: SleepInsert) => {
    const supabase = createBrowserClient()
    set({ isSaving: true })

    const { error } = await supabase.from('sleep_records').insert(record)

    set({ isSaving: false })
    if (!error) {
      await useSleepStore.getState().loadRecentSleep()
    }
    return { error: error?.message ?? null }
  },

  runAnalysis: async (days = 30) => {
    set({ isLoadingAnalysis: true })
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) {
      set({ isLoadingAnalysis: false })
      return
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startStr = startDate.toISOString().split('T')[0]

    const { data } = await supabase
      .from('sleep_records')
      .select('*')
      .eq('user_id', user.id)
      .gte('sleep_date', startStr)
      .order('sleep_date', { ascending: true })

    const records = data ?? []
    if (records.length === 0) {
      set({ isLoadingAnalysis: false, analysis: null })
      return
    }

    const durations = records.filter((r) => r.duration_minutes != null).map((r) => r.duration_minutes!)
    const avgDuration = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0

    const greatCount = records.filter((r) => r.quality === 'great').length
    const fairCount = records.filter((r) => r.quality === 'fair').length
    const poorCount = records.filter((r) => r.quality === 'poor').length

    // Calculate average quality score
    const qualityScore = records.filter((r) => r.quality != null).reduce((acc, r) => {
      const scoreMap: Record<string, number> = { great: 3, fair: 2, poor: 1 }
      return acc + scoreMap[r.quality!]
    }, 0)
    const avgQuality = records.filter((r) => r.quality != null).length > 0
      ? Math.round(qualityScore / records.filter((r) => r.quality != null).length)
      : 0

    // Find common pre-sleep activities
    const activityCount = new Map<string, number>()
    records.forEach((r) => {
      const activities = r.pre_sleep_activities as SleepActivity[] | null
      activities?.forEach((a) => {
        activityCount.set(a.activity, (activityCount.get(a.activity) ?? 0) + 1)
      })
    })
    const commonPreSleep = [...activityCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name)

    // Weekly trend
    const weeklyRecords: { date: string; duration: number; quality: number }[] = []
    const daysInRange: string[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      daysInRange.push(d.toISOString().split('T')[0])
    }

    daysInRange.forEach((dateStr) => {
      const dayRecords = records.filter((r) => r.sleep_date === dateStr)
      if (dayRecords.length > 0) {
        const avgDur = dayRecords
          .filter((r) => r.duration_minutes != null)
          .reduce((sum, r) => sum + r.duration_minutes!, 0) / dayRecords.filter((r) => r.duration_minutes != null).length || 0
        const avgQ = dayRecords
          .filter((r) => r.quality != null)
          .reduce((sum, r) => sum + (r.quality === 'great' ? 3 : r.quality === 'fair' ? 2 : 1), 0) / dayRecords.filter((r) => r.quality != null).length || 0

        weeklyRecords.push({ date: dateStr, duration: Math.round(avgDur), quality: Math.round(avgQ * 10) / 10 })
      }
    })

    // Correlation note (rule-based)
    let correlationNote = ''
    if (commonPreSleep.length > 0 && avgQuality > 0) {
      const withPhone = records.filter((r) => {
        const activities = r.pre_sleep_activities as SleepActivity[] | null
        return activities?.some((a) => a.activity.includes('手机'))
      })
      const withoutPhone = records.filter((r) => {
        const activities = r.pre_sleep_activities as SleepActivity[] | null
        return !activities?.some((a) => a.activity.includes('手机'))
      })
      if (withPhone.length >= 3 && withoutPhone.length >= 3) {
        const phoneAvgDuration = withPhone
          .filter((r) => r.duration_minutes != null)
          .reduce((sum, r) => sum + r.duration_minutes!, 0) / withPhone.filter((r) => r.duration_minutes != null).length || 0
        const noPhoneAvgDuration = withoutPhone
          .filter((r) => r.duration_minutes != null)
          .reduce((sum, r) => sum + r.duration_minutes!, 0) / withoutPhone.filter((r) => r.duration_minutes != null).length || 0

        if (noPhoneAvgDuration > phoneAvgDuration) {
          correlationNote = `睡前不玩手机的日子，平均睡眠时长多 ${Math.round(noPhoneAvgDuration - phoneAvgDuration)} 分钟`
        }
      }
    }

    set({
      analysis: {
        averageDuration: avgDuration,
        averageQuality: avgQuality,
        greatCount,
        fairCount,
        poorCount,
        weeklyTrend: weeklyRecords,
        commonPreSleep,
        correlationNote,
      },
      isLoadingAnalysis: false,
    })
  },
}))
