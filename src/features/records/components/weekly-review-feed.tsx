'use client'

import { useEffect, useState } from 'react'
import { useWeeklyReviewStore } from '@/features/practice/store/weekly-review-store'
import { useAiRecommendationStore } from '@/features/practice/store/ai-recommendation-store'
import { ObservationCard } from '@/features/records/components/observation-card'
import { TabPlaceholder } from '@/features/records/components/tab-placeholder'

function formatWeek(start: string, end: string): string {
  const parseM = (iso: string) => {
    const [, m, d] = iso.split('-').map(Number)
    return `${m}月${d}日`
  }
  return `${parseM(start)}–${parseM(end)}`
}

export function WeeklyReviewFeed() {
  const { reviews, isLoading, loadReviews, updateStatus } = useWeeklyReviewStore()
  const { items: recs, loadByReview } = useAiRecommendationStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    loadReviews()
  }, [loadReviews])

  useEffect(() => {
    if (expandedId) loadByReview(expandedId)
  }, [expandedId, loadByReview])

  if (isLoading) {
    return <div className="r-card p-6 text-center text-xs text-rhythm-text-muted">加载中...</div>
  }

  if (reviews.length === 0) {
    return (
      <TabPlaceholder
        title="还没有周回顾"
        hint="每周日 AI 会自动生成本周的观察与建议"
      />
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((r) => {
        const isExpanded = expandedId === r.id
        return (
          <div key={r.id} className="r-card p-4">
            <button type="button"
              onClick={() => setExpandedId(isExpanded ? null : r.id)}
              className="w-full flex justify-between items-baseline mb-2 bg-transparent border-0 p-0 cursor-pointer text-left">
              <div>
                <div className="text-[0.6rem] tracking-[0.12em] uppercase text-rhythm-text-muted">
                  {r.status === 'confirmed' ? '已确认' : '未读'}
                </div>
                <h3 className="font-serifsc text-[0.95rem] font-medium m-0 mt-0.5">
                  {formatWeek(r.week_start, r.week_end)}
                </h3>
              </div>
              <span className="text-rhythm-text-muted text-sm">{isExpanded ? '−' : '+'}</span>
            </button>
            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-rhythm-border space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <Stat label="完成率" value={r.practice_completion_rate != null ? `${Math.round(r.practice_completion_rate * 100)}%` : '—'} />
                  <Stat label="复盘条数" value={String(r.reflection_count)} />
                  <Stat label="平均睡眠" value={r.average_sleep_hours != null ? `${r.average_sleep_hours.toFixed(1)}h` : '—'} />
                </div>
                {r.ai_body_md && (
                  <p className="text-[0.78rem] text-rhythm-text-secondary leading-relaxed whitespace-pre-line">
                    {r.ai_body_md}
                  </p>
                )}
                <div className="space-y-2">
                  {recs.map((rec) => <ObservationCard key={rec.id} rec={rec} />)}
                  {recs.length === 0 && (
                    <p className="text-[0.7rem] text-rhythm-text-muted text-center py-2">本周没有 AI 观察</p>
                  )}
                </div>
                {r.status !== 'confirmed' && (
                  <button type="button" onClick={() => updateStatus(r.id, 'confirmed')}
                    className="w-full py-2 rounded-lg text-xs bg-rhythm-glow-soft border border-rhythm-border-strong text-rhythm-glow cursor-pointer">
                    确认这周回顾
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-2 rounded-lg bg-rhythm-void/40 border border-rhythm-border">
      <div className="font-serifsc text-[1rem] text-rhythm-text-primary">{value}</div>
      <div className="text-[0.6rem] text-rhythm-text-muted mt-0.5">{label}</div>
    </div>
  )
}
