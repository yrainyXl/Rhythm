'use client'

import { useEffect, useRef, useState } from 'react'
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
    <div
      className="w-full h-full p-4 rounded-2xl border relative overflow-hidden flex flex-col"
      style={{
        borderColor: 'rgba(143,180,220,0.28)',
        background: 'linear-gradient(180deg, rgba(143,180,220,0.10), rgba(20,27,39,0.8))',
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
      <h3 className="font-serifsc font-medium text-[1.05rem] tracking-tight leading-snug m-0 mb-2 line-clamp-2">
        {practice.title}
      </h3>
      {practice.assumption && (
        <div className="text-[0.7rem] text-rhythm-text-secondary leading-relaxed mb-2 pl-2 border-l-2 line-clamp-2"
          style={{ borderColor: 'rgba(143,180,220,0.25)' }}>
          <span className="text-rhythm-text-muted tracking-wider">假设　</span>{practice.assumption}
        </div>
      )}
      {dayInfo && (
        <div className="text-[0.68rem] text-rhythm-text-muted tracking-tight">
          第 <span className="font-serifsc text-rhythm-text-primary">{dayInfo.elapsed}</span> / {dayInfo.total} 天
          <span className="mx-1">·</span>
          {round?.start_date} 起
        </div>
      )}
      <Link
        href="/habits/practices"
        className="mt-auto pt-3 self-end text-[0.68rem] tracking-tight text-rhythm-glow no-underline hover:text-rhythm-text-primary transition-colors">
        进入实践 →
      </Link>
    </div>
  )
}

function NewPracticeSlide({ onOpen }: { onOpen: () => void }) {
  return (
    <div
      className="w-full h-full p-4 rounded-2xl border border-dashed relative overflow-hidden flex flex-col justify-center items-center gap-2.5"
      style={{ borderColor: 'rgba(143,180,220,0.32)' }}>
      <div className="w-10 h-10 rounded-full grid place-items-center"
        style={{ background: 'rgba(143,180,220,0.16)', color: 'rgb(143,180,220)' }}>
        <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ stroke: 'currentColor', strokeWidth: 2, fill: 'none' }}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      </div>
      <div className="font-serifsc text-[0.9rem] font-medium tracking-tight text-rhythm-text-primary">
        发起新实践
      </div>
      <div className="text-[0.66rem] text-rhythm-text-muted tracking-tight text-center px-4">
        可以同时进行多轮实践,左右滑动切换
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="mt-0.5 px-4 py-1.5 rounded-full text-[0.72rem] cursor-pointer"
        style={{ background: 'rgba(143,180,220,0.22)', border: '1px solid rgba(143,180,220,0.42)', color: 'rgb(143,180,220)' }}>
        开始
      </button>
    </div>
  )
}

export function PracticeCurrentCard() {
  const { practices, isLoadingPractices, loadPractices } = usePracticeStore()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const scrollerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadPractices()
  }, [loadPractices])

  const activePractices = practices.filter((p) => p.status === 'active')
  const hasActive = activePractices.length > 0
  // 有进行中实践时不展示"发起新实践"占位卡,通过实践管理页统一新建
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
        className="h-[220px] flex overflow-x-auto snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none' }}>
        {hasActive ? (
          activePractices.map((p, i) => (
            <div key={p.id} className={`min-w-full snap-start ${i < activePractices.length - 1 ? 'pr-2' : ''}`}>
              <PracticeSlide practice={p} />
            </div>
          ))
        ) : (
          <div className="min-w-full snap-start">
            <NewPracticeSlide onOpen={() => setSheetOpen(true)} />
          </div>
        )}
      </div>

      {slides > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {Array.from({ length: slides }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`第 ${i + 1} 个实践`}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === activeIdx ? 'w-4 bg-rhythm-glow' : 'w-1.5 bg-rhythm-border-strong'
              }`}
            />
          ))}
        </div>
      )}

      <PracticeFormSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  )
}
