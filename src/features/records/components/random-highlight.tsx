'use client'

import { useEffect, useMemo, useState } from 'react'
import { useReadingStore } from '@/features/records/store/reading-store'

export function RandomHighlight() {
  const { highlights, loadHighlights } = useReadingStore()
  const [seed, setSeed] = useState(0)

  useEffect(() => {
    if (highlights.length === 0) loadHighlights()
  }, [highlights.length, loadHighlights])

  const pool = useMemo(() => highlights.filter((h) => h.mark_text), [highlights])

  const pick = useMemo(() => {
    if (pool.length === 0) return null
    return pool[Math.floor(Math.random() * pool.length)]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, seed])

  if (!pick) return null

  return (
    <div className="r-card p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="r-eyebrow">今日一句</p>
        <button
          type="button"
          onClick={() => setSeed((s) => s + 1)}
          className="text-xs text-rhythm-text-muted hover:text-rhythm-text-secondary transition-colors"
        >
          换一条
        </button>
      </div>
      <p className="text-sm text-rhythm-text-primary leading-relaxed">{pick.mark_text}</p>
      {pick.thought && (
        <p className="text-xs text-rhythm-text-secondary mt-2 pl-2 border-l border-rhythm-border">
          💭 {pick.thought}
        </p>
      )}
      <p className="text-xs text-rhythm-text-muted mt-2.5">
        —— {pick.reading_books?.title ?? '未知书籍'}
        {pick.reading_books?.author ? ` · ${pick.reading_books.author}` : ''}
      </p>
    </div>
  )
}
