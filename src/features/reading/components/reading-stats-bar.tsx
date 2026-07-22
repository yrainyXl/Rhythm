'use client'

import { useEffect } from 'react'
import { useReadingStore } from '@/features/records/store/reading-store'

export function ReadingStatsBar() {
  const { analysis, runAnalysis, isLoadingAnalysis } = useReadingStore()

  useEffect(() => {
    runAnalysis()
  }, [runAnalysis])

  if (isLoadingAnalysis || !analysis) {
    return (
      <div className="flex justify-around py-3 rounded-xl border border-rhythm-border bg-rhythm-card/40">
        {['本周', '在读', '读完', '划线'].map((label, i) => (
          <div key={i} className="text-center opacity-50">
            <div className="font-serifsc text-[1.15rem] text-rhythm-text-primary leading-tight">
              —<small className="font-inherit text-[0.6rem] text-rhythm-text-muted ml-0.5"></small>
            </div>
            <div className="text-[0.6rem] tracking-tight text-rhythm-text-muted mt-1">{label}</div>
          </div>
        ))}
      </div>
    )
  }

  // Calculate total highlights from store
  const { highlights } = useReadingStore.getState()
  const totalHighlights = highlights.length

  // Calculate this week reading time
  const weekDuration = analysis.weeklyTrend.reduce((sum, week) => sum + week.duration, 0)
  const weekHours = (weekDuration / 60).toFixed(1)

  return (
    <div className="flex justify-around py-3 rounded-xl border border-rhythm-border bg-rhythm-card/40">
      <div className="text-center">
        <div className="font-serifsc text-[1.15rem] text-rhythm-text-primary leading-tight">
          {weekHours}
          <small className="font-inherit text-[0.6rem] text-rhythm-text-muted ml-0.5">h</small>
        </div>
        <div className="text-[0.6rem] tracking-tight text-rhythm-text-muted mt-1">本周</div>
      </div>
      <div className="text-center">
        <div className="font-serifsc text-[1.15rem] text-rhythm-text-primary leading-tight">
          {analysis.readingBooks}
          <small className="font-inherit text-[0.6rem] text-rhythm-text-muted ml-0.5">本</small>
        </div>
        <div className="text-[0.6rem] tracking-tight text-rhythm-text-muted mt-1">在读</div>
      </div>
      <div className="text-center">
        <div className="font-serifsc text-[1.15rem] text-rhythm-text-primary leading-tight">
          {analysis.finishedBooks}
          <small className="font-inherit text-[0.6rem] text-rhythm-text-muted ml-0.5">本</small>
        </div>
        <div className="text-[0.6rem] tracking-tight text-rhythm-text-muted mt-1">已读完</div>
      </div>
      <div className="text-center">
        <div className="font-serifsc text-[1.15rem] text-rhythm-text-primary leading-tight">
          {totalHighlights}
          <small className="font-inherit text-[0.6rem] text-rhythm-text-muted ml-0.5">条</small>
        </div>
        <div className="text-[0.6rem] tracking-tight text-rhythm-text-muted mt-1">划线</div>
      </div>
    </div>
  )
}
