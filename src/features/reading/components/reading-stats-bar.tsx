'use client'

import { useReadingStore } from '@/features/records/store/reading-store'

export function ReadingStatsBar() {
  const { analysis, isLoadingAnalysis, highlights, highlightsTotal } = useReadingStore()
  if (!analysis) {
    return isLoadingAnalysis ? <p className="text-sm text-rhythm-text-secondary" role="status">正在加载阅读概况…</p> : null
  }

  const stats = [
    { label: '近 30 天阅读', value: `${(analysis.totalDuration / 60).toFixed(1)} 小时` },
    { label: '已读完', value: `${analysis.finishedBooks} 本` },
    { label: '收藏划线', value: `${highlightsTotal || highlights.length} 条` },
  ]
  return (
    <dl className="grid grid-cols-3 gap-3 border-y border-rhythm-border py-5">
      {stats.map(({ label, value }) => (
        <div key={label}>
          <dt className="text-sm text-rhythm-text-secondary">{label}</dt>
          <dd className="mt-2 text-base font-semibold text-rhythm-text-primary">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
