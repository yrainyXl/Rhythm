'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePracticeStore } from '@/features/practice/store/practice-store'
import type { PracticeWithLatestRound } from '@/features/practice/store/practice-store'
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

function PracticeSlide({ practice }: { practice: PracticeWithLatestRound }) {
  const round = practice.latestRound
  const dayInfo = round ? daysBetween(round.start_date, round.end_date) : null
  return (
    <article className="r-panel flex flex-col gap-4">
      <h3 className="text-2xl font-semibold leading-snug break-words">{practice.title}</h3>
      {practice.assumption && <p className="text-[15px] leading-relaxed text-rhythm-text-secondary">{practice.assumption}</p>}
      {dayInfo && <p className="text-sm text-rhythm-text-secondary">已进行 {dayInfo.elapsed} 天 · 本次计划 {dayInfo.total} 天</p>}
      <Link href={`/habits/practices/${practice.id}`} className="r-link self-start">查看行动与记录 →</Link>
    </article>
  )
}

export function PracticeCurrentCard() {
  const { practices, practicesError, isLoadingPractices, loadPractices } = usePracticeStore()
  const [sheetOpen, setSheetOpen] = useState(false)
  useEffect(() => { loadPractices() }, [loadPractices])
  const activePractices = practices.filter((p) => p.status === 'active' && p.latestRound?.status === 'active')
  if (practicesError) return <div role="alert" className="r-panel text-sm text-rhythm-text-secondary">{practicesError}<button type="button" onClick={() => void loadPractices()} className="r-link ml-3">重试</button></div>
  if (isLoadingPractices) return <p role="status" className="text-sm text-rhythm-text-secondary py-5">正在加载实践…</p>
  return (
    <div className="space-y-4">
      {activePractices.length ? activePractices.map((practice) => <PracticeSlide key={practice.id} practice={practice} />) : (
        <div className="r-panel space-y-4">
          <h3 className="text-xl font-semibold">从一件小事开始</h3>
          <p className="text-[15px] leading-relaxed text-rhythm-text-secondary">选一个你想尝试的行动，记录每天的结果，再看看它是否适合自己。</p>
          <button type="button" onClick={() => setSheetOpen(true)} className="r-btn-primary">创建实践</button>
        </div>
      )}
      <PracticeFormSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  )
}
