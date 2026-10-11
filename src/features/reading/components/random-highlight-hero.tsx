'use client'

import { useEffect, useMemo, useState } from 'react'
import { useReadingStore } from '@/features/records/store/reading-store'
import type { HighlightWithBook } from '@/features/records/store/reading-store'
import { PracticeFormSheet } from '@/features/practice/components/practice-form-sheet'

const MIN_HEIGHT_CLASS = 'min-h-[160px]'

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
      <div className={`${MIN_HEIGHT_CLASS} flex flex-col items-center justify-center py-4`}>
        <p className="text-sm text-rhythm-text-secondary">还没有可重读的划线</p>
        <p className="text-sm text-rhythm-text-secondary mt-2">
          在书架添加书籍，或同步微信读书的划线。
        </p>
      </div>
    )
  }

  const book = pick.reading_books

  return (
    <>
      <div className={`${MIN_HEIGHT_CLASS} border-l-2 border-rhythm-border-strong pl-5`}>
        <button type="button" onClick={() => setShowFull(true)} className="block w-full text-left">
          <p className="line-clamp-4 text-lg leading-relaxed font-medium text-rhythm-text-primary">{pick.mark_text}</p>
          <p className="mt-3 text-sm text-rhythm-text-secondary">《{book?.title ?? '未知书籍'}》{book?.author ? ` · ${book.author}` : ''}</p>
        </button>
        <div className="mt-2 flex gap-5">
          <button type="button" onClick={() => setShowFull(true)} className="r-link">读完整句</button>
          <button type="button" onClick={() => setSeed((s) => s + 1)} className="r-link text-rhythm-text-secondary">换一句</button>
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
            className="absolute top-6 right-6 w-11 h-11 grid place-items-center rounded-full bg-transparent border border-rhythm-border-strong cursor-pointer text-rhythm-text-secondary hover:text-rhythm-text-primary transition-colors"
            style={{ top: 'calc(1.5rem + env(safe-area-inset-top))' }}>
            <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ stroke: 'currentColor', strokeWidth: 1.8, fill: 'none' }}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <div className="max-h-full max-w-md overflow-y-auto text-left" onClick={(e) => e.stopPropagation()}>
            <p className="font-medium text-xl leading-loose text-rhythm-text-primary tracking-tight">
              {pick.mark_text}
            </p>
            {pick.thought && (
              <p className="mt-6 text-sm text-rhythm-text-secondary leading-relaxed tracking-tight">
                💭 {pick.thought}
              </p>
            )}
            <p className="mt-8 text-sm text-rhythm-text-secondary tracking-tight">
              ——《{book?.title ?? '未知书籍'}》{book?.author ? ` · ${book.author}` : ''}
            </p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setPracticeOpen(true) }}
              className="r-button-primary mt-6 min-h-11 px-5">
              发起实践
            </button>
          </div>
          <button
            type="button"
            aria-label="换一句"
            onClick={(e) => { e.stopPropagation(); setSeed((s) => s + 1) }}
            className="absolute flex items-center gap-1.5 px-4 py-2 rounded-full bg-transparent border border-rhythm-border-strong text-rhythm-text-secondary text-sm min-h-11 cursor-pointer hover:text-rhythm-text-primary hover:border-rhythm-glow transition-colors"
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
