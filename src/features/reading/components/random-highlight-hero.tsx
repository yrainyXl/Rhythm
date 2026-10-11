'use client'

import { useEffect, useMemo, useState } from 'react'
import { useReadingStore } from '@/features/records/store/reading-store'
import type { HighlightWithBook } from '@/features/records/store/reading-store'
import { PracticeFormSheet } from '@/features/practice/components/practice-form-sheet'

const MIN_HEIGHT_CLASS = 'h-[240px]'

function derivePracticeTitle(h: HighlightWithBook): string {
  const text = (h.mark_text || h.thought || '').replace(/\s+/g, ' ').trim()
  return text.length > 18 ? `${text.slice(0, 18)}…` : text
}

function deriveAssumption(h: HighlightWithBook): string {
  const parts = [h.mark_text, h.thought ? `💭 ${h.thought}` : null].filter(Boolean) as string[]
  return parts.join('\n\n')
}

export function RandomHighlightHero() {
  const { highlights } = useReadingStore()
  const [seed, setSeed] = useState(0)
  const [showFull, setShowFull] = useState(false)
  const [practiceOpen, setPracticeOpen] = useState(false)

  useEffect(() => {
    if (!showFull) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowFull(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showFull])

  const pool = useMemo(() => highlights.filter((h) => h.mark_text), [highlights])

  const pick = useMemo(() => {
    if (pool.length === 0) return null
    return pool[Math.floor(Math.random() * pool.length)]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, seed])

  if (!pick) {
    return (
      <div className={`${MIN_HEIGHT_CLASS} flex flex-col items-center justify-center p-4 rounded-2xl border border-rhythm-border bg-rhythm-card/60 text-center`}>
        <p className="text-sm text-rhythm-text-secondary">还没有词条</p>
        <p className="text-xs text-rhythm-text-muted mt-1">
          去「记录 · 阅读 · 词条」从微信读书同步你的划线
        </p>
      </div>
    )
  }

  const book = pick.reading_books

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setShowFull(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowFull(true) }
        }}
        className={`${MIN_HEIGHT_CLASS} relative flex flex-col justify-center p-5 rounded-2xl border cursor-pointer transition-colors hover:border-rhythm-border-strong`}
        style={{
          background: 'var(--r-subtle-background)',
          borderColor: 'rgb(var(--r-neutral) / 0.10)',
        }}>
        <span aria-hidden="true"
          className="absolute top-2 left-3 font-serifsc leading-none text-[2.5rem] pointer-events-none"
          style={{ color: 'rgb(var(--r-glow) / 0.35)' }}>❝</span>
        <button
          type="button"
          aria-label="换一句"
          onClick={(e) => { e.stopPropagation(); setSeed((s) => s + 1) }}
          className="absolute top-3 right-3 w-6 h-6 grid place-items-center rounded-full bg-transparent border-0 cursor-pointer text-rhythm-text-muted hover:text-rhythm-text-primary hover:bg-[rgb(var(--r-glow)_/_0.1)] transition-colors">
          <svg viewBox="0 0 24 24" className="w-3 h-3" style={{ stroke: 'currentColor', strokeWidth: 1.8, fill: 'none' }}>
            <path d="M23 4v6h-6" />
            <path d="M20 9a9 9 0 0 0-14.85-3.36L1 10" />
          </svg>
        </button>
        <p
          className="font-serifsc font-normal text-[0.95rem] leading-loose text-rhythm-text-primary tracking-tight pt-4 px-2 m-0 overflow-hidden"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
          }}>
          {pick.mark_text}
        </p>
        <div className="mt-3 text-[0.66rem] tracking-tight text-rhythm-text-muted px-2">
          ——《{book?.title ?? '未知书籍'}》{book?.author ? ` · ${book.author}` : ''}
        </div>
      </div>

      {showFull && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8 py-16 bg-rhythm-void/95 backdrop-blur-md"
          onClick={() => setShowFull(false)}>
          <button
            type="button"
            aria-label="关闭"
            onClick={(e) => { e.stopPropagation(); setShowFull(false) }}
            className="absolute top-6 right-6 w-9 h-9 grid place-items-center rounded-full bg-transparent border border-rhythm-border-strong cursor-pointer text-rhythm-text-secondary hover:text-rhythm-text-primary transition-colors"
            style={{ top: 'calc(1.5rem + env(safe-area-inset-top))' }}>
            <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ stroke: 'currentColor', strokeWidth: 1.8, fill: 'none' }}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <div className="max-w-md text-center" onClick={(e) => e.stopPropagation()}>
            <p className="font-serifsc font-light text-[1.15rem] leading-loose text-rhythm-text-primary tracking-tight">
              {pick.mark_text}
            </p>
            {pick.thought && (
              <p className="mt-6 text-xs text-rhythm-text-secondary leading-relaxed tracking-tight">
                💭 {pick.thought}
              </p>
            )}
            <p className="mt-8 text-xs text-rhythm-text-muted tracking-tight">
              ——《{book?.title ?? '未知书籍'}》{book?.author ? ` · ${book.author}` : ''}
            </p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setPracticeOpen(true) }}
              className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-rhythm-border-strong text-rhythm-glow text-xs tracking-tight cursor-pointer hover:border-rhythm-glow hover:bg-rhythm-glow-soft transition-colors">
              发起实践
            </button>
          </div>
          <button
            type="button"
            aria-label="换一句"
            onClick={(e) => { e.stopPropagation(); setSeed((s) => s + 1) }}
            className="absolute flex items-center gap-1.5 px-4 py-2 rounded-full bg-transparent border border-rhythm-border-strong text-rhythm-text-muted text-xs tracking-tight cursor-pointer hover:text-rhythm-text-primary hover:border-rhythm-glow transition-colors"
            style={{ bottom: 'calc(2rem + env(safe-area-inset-bottom))' }}>
            <svg viewBox="0 0 24 24" className="w-3 h-3" style={{ stroke: 'currentColor', strokeWidth: 1.8, fill: 'none' }}>
              <path d="M23 4v6h-6" />
              <path d="M20 9a9 9 0 0 0-14.85-3.36L1 10" />
            </svg>
            换一句
          </button>
        </div>
      )}

      <PracticeFormSheet
        open={practiceOpen}
        onClose={() => setPracticeOpen(false)}
        initialTitle={derivePracticeTitle(pick)}
        initialAssumption={deriveAssumption(pick)}
        sourceHighlightId={pick.id}
        sourceLabel={book?.title ? `来自《${book.title}》的划线` : undefined}
      />
    </>
  )
}
