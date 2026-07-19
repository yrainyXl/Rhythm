'use client'

import { useEffect, useMemo, useState } from 'react'
import { useReadingStore } from '@/features/records/store/reading-store'

export function RandomHighlightHero() {
  const { highlights, loadHighlights } = useReadingStore()
  const [seed, setSeed] = useState(0)

  useEffect(() => {
    loadHighlights()
  }, [loadHighlights])

  const pool = useMemo(() => highlights.filter((h) => h.mark_text), [highlights])

  const pick = useMemo(() => {
    if (pool.length === 0) return null
    return pool[Math.floor(Math.random() * pool.length)]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, seed])

  if (!pick) {
    return (
      <div className="p-4 rounded-2xl border border-rhythm-border bg-rhythm-card/60 text-center">
        <p className="text-sm text-rhythm-text-secondary">还没有词条</p>
        <p className="text-xs text-rhythm-text-muted mt-1">
          去「记录 · 阅读 · 词条」从微信读书同步你的划线
        </p>
      </div>
    )
  }

  const book = pick.reading_books
  return (
    <div className="p-5 rounded-2xl border relative cursor-pointer"
      style={{
        background: 'linear-gradient(180deg, rgba(143,180,220,0.08), transparent)',
        borderColor: 'rgba(150,175,205,0.10)',
      }}
      onClick={() => setSeed((s) => s + 1)}>
      <span aria-hidden="true" className="absolute top-2 left-3 font-serifsc leading-none text-[2.5rem]"
        style={{ color: 'rgba(143,180,220,0.35)' }}>❝</span>
      <button type="button"
        aria-label="换一句"
        onClick={(e) => { e.stopPropagation(); setSeed((s) => s + 1) }}
        className="absolute top-3 right-3 w-6 h-6 grid place-items-center rounded-full bg-transparent border-0 cursor-pointer text-rhythm-text-muted hover:text-rhythm-text-primary hover:bg-[rgba(143,180,220,0.1)] transition-colors">
        <svg viewBox="0 0 24 24" className="w-3 h-3" style={{ stroke: 'currentColor', strokeWidth: 1.8, fill: 'none' }}>
          <path d="M23 4v6h-6" />
          <path d="M20 9a9 9 0 0 0-14.85-3.36L1 10" />
        </svg>
      </button>
      <p className="font-serifsc font-normal text-[0.95rem] leading-loose text-rhythm-text-primary tracking-tight pt-4 px-2 m-0">
        {pick.mark_text}
      </p>
      <div className="mt-3 text-[0.66rem] tracking-tight text-rhythm-text-muted px-2">
        ——《{book?.title ?? '未知书籍'}》{book?.author ? ` · ${book.author}` : ''}
      </div>
    </div>
  )
}
