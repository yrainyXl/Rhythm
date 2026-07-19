'use client'

import { useEffect } from 'react'
import { usePracticeStore } from '@/features/practice/store/practice-store'
import { TabPlaceholder } from '@/features/records/components/tab-placeholder'

function formatRange(start: string, end: string): string {
  const parseM = (iso: string) => {
    const [, m, d] = iso.split('-').map(Number)
    return `${m}月${d}日`
  }
  return `${parseM(start)}–${parseM(end)}`
}

export function PracticesList() {
  const { practices, isLoadingPractices, loadPractices } = usePracticeStore()

  useEffect(() => {
    loadPractices()
  }, [loadPractices])

  if (isLoadingPractices) {
    return (
      <div className="r-card p-6 text-center text-xs text-rhythm-text-muted">加载中...</div>
    )
  }

  if (practices.length === 0) {
    return (
      <TabPlaceholder
        title="还没有实践"
        hint="发起你的第一轮实践,记录假设和每日进展"
      />
    )
  }

  return (
    <div className="space-y-3">
      {practices.map((p) => {
        const active = p.status === 'active'
        const r = p.latestRound
        return (
          <div key={p.id} className="r-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[0.6rem] tracking-[0.12em] uppercase ${
                active ? 'text-rhythm-glow' : 'text-rhythm-text-muted'
              }`}>
                {active ? '进行中' : '已完成'}
              </span>
              {r && (
                <span className="text-[0.62rem] text-rhythm-text-muted">
                  {formatRange(r.start_date, r.end_date)}
                </span>
              )}
            </div>
            <h3 className="font-serifsc text-[0.9rem] font-medium m-0 mb-1">{p.title}</h3>
            {p.assumption && (
              <p className="text-[0.72rem] text-rhythm-text-secondary leading-relaxed m-0 mb-2">
                {p.assumption}
              </p>
            )}
            {r && (
              <div className="text-[0.68rem] text-rhythm-text-muted">
                第 <span className="font-serifsc text-rhythm-text-primary">{r.round_number}</span> 轮
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
