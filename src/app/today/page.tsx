'use client'

import { useCallback, useEffect, useState } from 'react'
import { AuthGuard } from '@/features/app/components/auth-guard'
import { usePracticeStore } from '@/features/practice/store/practice-store'
import { TodayHeader } from '@/features/today/components/today-header'
import { TonightCard } from '@/features/today/components/tonight-card'
import { OtherPractices } from '@/features/today/components/other-practices'
import { InsightCard } from '@/features/today/components/insight-card'
import { TodayHabits } from '@/features/today/components/today-habits'
import { CaptureInput } from '@/features/today/components/capture-input'
import { todayIso } from '@/features/today/lib/dates'

/**
 * 今天：按「现在该做什么」排，不按时段分组。
 * 首屏只有一张主卡「今晚」；反思类内容同一时间最多一张（检查点在今晚卡里，优先于这周发现）。
 */
export default function TodayPage() {
  const [today] = useState(() => todayIso())
  const [refreshKey, setRefreshKey] = useState(0)
  const { practices, practicesError, isLoadingPractices, loadPractices, logsByRound } = usePracticeStore()

  useEffect(() => {
    void loadPractices()
  }, [loadPractices])

  const onRecorded = useCallback(() => setRefreshKey((k) => k + 1), [])

  const active = practices.filter((p) => p.status === 'active' && p.latestRound?.status === 'active')
  const primary = active[0] ?? null
  const primaryRound = primary?.latestRound
  const primaryLoggedToday = !!primaryRound && (logsByRound[primaryRound.id] ?? []).some((l) => l.local_date === today)

  return (
    <AuthGuard>
      <TodayHeader today={today} refreshKey={refreshKey} />

      {practicesError && (
        <p role="alert" className="mx-5 mb-3 text-sm text-rhythm-danger">
          实践没有加载出来。<button type="button" className="font-semibold" onClick={() => void loadPractices()}>重试</button>
        </p>
      )}
      {isLoadingPractices && practices.length === 0 ? (
        <div className="mx-4 mb-3 h-40 animate-pulse rounded-[22px] bg-rhythm-card" aria-label="正在加载" />
      ) : (
        <TonightCard today={today} practice={primary} onRecorded={onRecorded} />
      )}
      <OtherPractices practices={active.slice(1)} today={today} onRecorded={onRecorded} />

      <InsightCard hidden={primaryLoggedToday} />
      <TodayHabits today={today} onRecorded={onRecorded} />
      <CaptureInput today={today} onRecorded={onRecorded} />
    </AuthGuard>
  )
}
