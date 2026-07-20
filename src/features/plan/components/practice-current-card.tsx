'use client'

import { useEffect, useState } from 'react'
import { usePracticeStore } from '@/features/practice/store/practice-store'
import { PracticeFormSheet } from '@/features/practice/components/practice-form-sheet'

function daysBetween(start: string, end: string): { total: number; elapsed: number } {
  const [sy, sm, sd] = start.split('-').map(Number)
  const [ey, em, ed] = end.split('-').map(Number)
  const startD = new Date(sy, sm - 1, sd)
  const endD = new Date(ey, em - 1, ed)
  const now = new Date()
  const day = 1000 * 60 * 60 * 24
  const total = Math.round((endD.getTime() - startD.getTime()) / day) + 1
  const elapsed = Math.min(total, Math.max(1, Math.floor((now.getTime() - startD.getTime()) / day) + 1))
  return { total, elapsed }
}

export function PracticeCurrentCard() {
  const { practices, isLoadingPractices, loadPractices } = usePracticeStore()
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    loadPractices()
  }, [loadPractices])

  const active = practices.find((p) => p.status === 'active')

  if (isLoadingPractices) {
    return (
      <div className="col-span-full p-4 rounded-2xl border border-rhythm-border bg-rhythm-card/60 text-center text-xs text-rhythm-text-muted">
        加载中...
      </div>
    )
  }

  if (!active) {
    return (
      <>
        <div className="col-span-full p-4 rounded-2xl border relative overflow-hidden"
          style={{
            borderColor: 'rgba(143,180,220,0.28)',
            background: 'linear-gradient(180deg, rgba(143,180,220,0.10), rgba(20,27,39,0.8))',
          }}>
          <div className="text-[0.58rem] tracking-[0.16em] uppercase mb-2" style={{ color: 'rgba(143,180,220,0.85)' }}>
            当前实践 · 空
          </div>
          <h3 className="font-serifsc font-medium text-[1.05rem] tracking-tight leading-snug m-0 mb-2">
            还没有进行中的实践
          </h3>
          <div className="text-[0.66rem] tracking-tight text-rhythm-text-secondary leading-relaxed mb-3">
            发起一轮实践,记录假设与每日进展。
          </div>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="w-full py-2 rounded-[9px] font-inherit text-[0.75rem] tracking-tight cursor-pointer relative z-10"
            style={{
              background: 'rgba(143,180,220,0.22)',
              border: '1px solid rgba(143,180,220,0.42)',
              color: 'rgb(143,180,220)',
            }}>
            + 发起新实践
          </button>
        </div>
        <PracticeFormSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
      </>
    )
  }

  const round = active.latestRound
  const dayInfo = round ? daysBetween(round.start_date, round.end_date) : null

  return (
    <>
      <a
        className="col-span-full block p-4 rounded-2xl border relative overflow-hidden no-underline"
        style={{
          borderColor: 'rgba(143,180,220,0.28)',
          background: 'linear-gradient(180deg, rgba(143,180,220,0.10), rgba(20,27,39,0.8))',
          color: 'inherit',
        }}>
        <div className="flex items-start justify-between mb-2">
          <span className="text-[0.58rem] tracking-[0.16em] uppercase" style={{ color: 'rgba(143,180,220,0.85)' }}>
            {round ? `当前实践 · 第 ${round.round_number} 轮` : '当前实践'}
          </span>
          <div className="w-6 h-6 rounded-lg grid place-items-center flex-none"
            style={{ background: 'rgba(143,180,220,0.2)', color: 'rgb(143,180,220)' }}>
            <svg viewBox="0 0 24 24" className="w-3 h-3" style={{ stroke: 'currentColor', strokeWidth: 1.7, fill: 'none' }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>
        <h3 className="font-serifsc font-medium text-[1.05rem] tracking-tight leading-snug m-0 mb-2">
          {active.title}
        </h3>
        {active.assumption && (
          <div className="text-[0.7rem] text-rhythm-text-secondary leading-relaxed mb-2 pl-2 border-l-2"
            style={{ borderColor: 'rgba(143,180,220,0.25)' }}>
            <span className="text-rhythm-text-muted tracking-wider">假设　</span>{active.assumption}
          </div>
        )}
        {dayInfo && (
          <div className="text-[0.68rem] text-rhythm-text-muted tracking-tight">
            第 <span className="font-serifsc text-rhythm-text-primary">{dayInfo.elapsed}</span> / {dayInfo.total} 天
            <span className="mx-1">·</span>
            {round?.start_date} 起
          </div>
        )}
        <div className="flex gap-2 mt-3 relative z-10">
          <button
            type="button"
            className="flex-1 px-2 py-2 rounded-[9px] font-inherit text-[0.7rem] tracking-tight cursor-pointer"
            style={{ background: 'rgba(143,180,220,0.22)', border: '1px solid rgba(143,180,220,0.42)', color: 'rgb(143,180,220)' }}>
            记一笔
          </button>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex-1 px-2 py-2 rounded-[9px] font-inherit text-[0.7rem] tracking-tight cursor-pointer bg-transparent text-rhythm-text-primary border border-rhythm-border-strong">
            新实践
          </button>
          <a
            href="/records"
            className="flex-1 px-2 py-2 rounded-[9px] font-inherit text-[0.7rem] tracking-tight cursor-pointer bg-transparent text-rhythm-text-primary border border-rhythm-border-strong text-center no-underline">
            记录
          </a>
        </div>
      </a>
      <PracticeFormSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  )
}
