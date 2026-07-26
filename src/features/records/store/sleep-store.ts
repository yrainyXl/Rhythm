'use client'

import { create } from 'zustand'
import { apiFetch } from '@/lib/cloudbase/api-client'

type SleepQuality = 'great' | 'fair' | 'poor'

interface SleepActivity {
  activity: string
  time: string
}

interface SleepRecord {
  id: string
  user_id: string
  sleep_date: string
  sleep_time: string
  wake_date: string | null
  wake_time: string | null
  duration_minutes: number | null
  quality: SleepQuality | null
  pre_sleep_activities: SleepActivity[] | null
  note: string | null
  is_shared: boolean
  created_at: string
  updated_at: string
}

interface SleepInsert {
  sleep_date: string
  sleep_time: string
  wake_date?: string | null
  wake_time?: string | null
  duration_minutes?: number | null
  quality?: SleepQuality | null
  pre_sleep_activities?: SleepActivity[]
  note?: string | null
  is_shared?: boolean
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
    try {
      const { record } = await apiFetch<{ record: SleepRecord | null }>('/api/records/sleep')
      set({ recentRecord: record ?? null })
    } catch {
      // 未登录或请求失败:保持空
    }
  },

  loadSleepHistory: async (days: number) => {
    try {
      const { records } = await apiFetch<{ records: SleepRecord[] }>(
        `/api/records/sleep?days=${days}`,
      )
      set({ sleepRecords: records ?? [] })
    } catch {
      // 保持空
    }
  },

  saveSleepRecord: async (record: SleepInsert) => {
    set({ isSaving: true })
    try {
      await apiFetch('/api/records/sleep', {
        method: 'POST',
        body: JSON.stringify(record),
      })
      await useSleepStore.getState().loadRecentSleep()
      set({ isSaving: false })
      return { error: null }
    } catch (e) {
      set({ isSaving: false })
      return { error: e instanceof Error ? e.message : '保存失败' }
    }
  },

  runAnalysis: async (days = 30) => {
    set({ isLoadingAnalysis: true })
    try {
      const { records } = await apiFetch<{ records: SleepRecord[] }>(
        `/api/records/sleep?days=${days}`,
      )
      await runSleepAnalysis(records ?? [])
    } finally {
      set({ isLoadingAnalysis: false })
    }
  },
}))

/** 纯前端聚合,与 API 无关。抽出以便 runAnalysis 复用。 */
async function runSleepAnalysis(records: SleepRecord[]) {
  const set = useSleepStore.setState
  if (records.length === 0) {
    set({ analysis: null })
    return
  }

  const durations = records.filter((r) => r.duration_minutes != null).map((r) => r.duration_minutes!)
  const avgDuration = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0

  const greatCount = records.filter((r) => r.quality === 'great').length
  const fairCount = records.filter((r) => r.quality === 'fair').length
  const poorCount = records.filter((r) => r.quality === 'poor').length

  const qualityScore = records.filter((r) => r.quality != null).reduce((acc, r) => {
    const scoreMap: Record<string, number> = { great: 3, fair: 2, poor: 1 }
    return acc + scoreMap[r.quality!]
  }, 0)
  const avgQuality = records.filter((r) => r.quality != null).length > 0
    ? Math.round(qualityScore / records.filter((r) => r.quality != null).length)
    : 0

  const activityCount = new Map<string, number>()
  records.forEach((r) => {
    r.pre_sleep_activities?.forEach((a) => {
      activityCount.set(a.activity, (activityCount.get(a.activity) ?? 0) + 1)
    })
  })
  const commonPreSleep = [...activityCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name)

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

  let correlationNote = ''
  if (commonPreSleep.length > 0 && avgQuality > 0) {
    const withPhone = records.filter((r) =>
      r.pre_sleep_activities?.some((a) => a.activity.includes('手机')),
    )
    const withoutPhone = records.filter((r) =>
      !r.pre_sleep_activities?.some((a) => a.activity.includes('手机')),
    )
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
  })
}
