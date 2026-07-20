'use client'

import { useEffect, useMemo, useState } from 'react'
import { useReadingStore } from '@/features/records/store/reading-store'

const MIN_HEIGHT_CLASS = 'h-[240px]'

export function RandomHighlightHero() {
  const { highlights, loadHighlights } = useReadingStore()
  const [seed, setSeed] = useState(0)
  const [showFull, setShowFull] = useState(false)

  useEffect(() => {
    loadHighlights()
  }, [loadHighlights])

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
          background: 'linear-gradient(180deg, rgba(143,180,220,0.08), transparent)',
          borderColor: 'rgba(150,175,205,0.10)',
        }}>
        <span aria-hidden="true"
          className="absolute top-2 left-3 font-serifsc leading-none text-[2.5rem] pointer-events-none"
          style={{ color: 'rgba(143,180,220,0.35)' }}>❝</span>
        <button
          type="button"
          aria-label="换一句"
          onClick={(e) => { e.stopPropagation(); setSeed((s) => s + 1) }}
          className="absolute top-3 right-3 w-6 h-6 grid place-items-center rounded-full bg-transparent border-0 cursor-pointer text-rhythm-text-muted hover:text-rhythm-text-primary hover:bg-[rgba(143,180,220,0.1)] transition-colors">
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
    </>
  )
}
