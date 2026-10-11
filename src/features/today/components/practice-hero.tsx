'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePracticeStore, type PracticeWithLatestRound } from '@/features/practice/store/practice-store'
import { PracticeLogInline } from '@/features/practice/components/practice-log-inline'
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
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const expired = !!round && round.end_date < today
  const upcoming = !!round && round.start_date > today
  return (
    <div className="r-panel h-full">
      <Link href={`/habits/practices/${practice.id}`} className="block py-1 text-2xl font-semibold leading-snug tracking-tight hover:text-rhythm-glow">
        {practice.title}<span className="ml-2 text-base text-rhythm-text-muted" aria-hidden="true">↗</span>
      </Link>
      {practice.assumption && <p className="mt-2 text-sm leading-relaxed text-rhythm-text-secondary">{practice.assumption}</p>}
      {dayInfo && <p className="mt-3 mb-5 text-sm text-rhythm-text-secondary">{expired ? '本次尝试已到期' : upcoming ? `${round?.start_date} 开始` : `第 ${dayInfo.elapsed} 天 · 共 ${dayInfo.total} 天`}</p>}
      {round && !expired && !upcoming && <PracticeLogInline roundId={round.id} />}
      {expired && <div className="border-t border-rhythm-border pt-4">
        <p className="text-sm text-rhythm-text-secondary">回看这次尝试，决定接下来怎么做。</p>
        <Link href={`/habits/practices/${practice.id}`} className="r-btn-primary mt-4">回顾这次实践</Link>
      </div>}
    </div>
  )
}

function NewPracticeSlide({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="r-panel">
      <h3 className="text-xl font-semibold">从一个小行动开始</h3>
      <p className="mt-2 text-sm text-rhythm-text-secondary">选一件想尝试的事，做几天，再看看感受。</p>
      <button type="button" onClick={onOpen} className="r-btn-primary mt-5">开始一个实践</button>
    </div>
  )
}

export function PracticeHero() {
  const { practices, practicesError, isLoadingPractices, loadPractices } = usePracticeStore()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const scrollerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadPractices()
  }, [loadPractices])

  const activePractices = practices.filter(
    (p) => p.status === 'active' && p.latestRound?.status === 'active',
  )
  const hasActive = activePractices.length > 0
  const slides = hasActive ? activePractices.length : 1

  const handleScroll = () => {
    const el = scrollerRef.current
    if (!el) return
    const w = el.clientWidth
    if (w === 0) return
    const idx = Math.round(el.scrollLeft / w)
    if (idx !== activeIdx) setActiveIdx(idx)
  }

  const goTo = (idx: number) => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' })
  }

  if (practicesError) return <div role="alert" className="r-panel text-sm text-rhythm-text-secondary">{practicesError}<button type="button" onClick={() => void loadPractices()} className="r-link ml-3">重试</button></div>
  if (isLoadingPractices) {
    return (
      <div className="p-4 rounded-2xl border border-rhythm-border bg-rhythm-card/60 text-center text-xs text-rhythm-text-muted">
        加载中...
      </div>
    )
  }

  return (
    <div>
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none' }}>
        {hasActive ? (
          activePractices.map((p, i) => (
            <div key={p.id} className={`w-full min-w-full shrink-0 snap-start ${i < activePractices.length - 1 ? 'pr-2' : ''}`}>
              <PracticeSlide practice={p} />
            </div>
          ))
        ) : (
          <div className="w-full min-w-full shrink-0 snap-start">
            <NewPracticeSlide onOpen={() => setSheetOpen(true)} />
          </div>
        )}
      </div>

      {slides > 1 && (
        <div className="flex justify-center gap-1 mt-2">
          {Array.from({ length: slides }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`第 ${i + 1} 个实践`}
              onClick={() => goTo(i)}
              className={`min-h-[44px] min-w-[44px] rounded-full transition-colors text-sm ${
                i === activeIdx ? 'bg-rhythm-glow-soft text-rhythm-glow' : 'text-rhythm-text-secondary'
              }`}
            >{i + 1}</button>
          ))}
        </div>
      )}

      <PracticeFormSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  )
}
