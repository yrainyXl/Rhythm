'use client'

import { useEffect, useMemo, useState } from 'react'
import { useReadingStore, type HighlightWithBook } from '@/features/records/store/reading-store'

type BookGroup = {
  bookId: string
  title: string
  author: string | null
  cover: string | null
  items: HighlightWithBook[]
}

export function ReadingHighlights() {
  const {
    highlights,
    loadHighlights,
    isLoadingHighlights,
    syncWeread,
    isSyncing,
    syncError,
    lastSyncResult,
  } = useReadingStore()

  useEffect(() => {
    loadHighlights()
  }, [loadHighlights])

  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const toggle = (bookId: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(bookId)) next.delete(bookId)
      else next.add(bookId)
      return next
    })

  const groups = useMemo<BookGroup[]>(() => {
    const map = new Map<string, BookGroup>()
    for (const h of highlights) {
      let g = map.get(h.book_id)
      if (!g) {
        g = {
          bookId: h.book_id,
          title: h.reading_books?.title ?? '未知书籍',
          author: h.reading_books?.author ?? null,
          cover: h.reading_books?.cover_url ?? null,
          items: [],
        }
        map.set(h.book_id, g)
      }
      g.items.push(h)
    }
    return [...map.values()]
  }, [highlights])

  return (
    <div className="space-y-4">
      {/* Sync control */}
      <div className="r-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="r-title text-sm">微信读书词条</p>
            <p className="text-xs text-rhythm-text-muted mt-0.5">
              同步在读书籍的划线与想法
            </p>
          </div>
          <button
            type="button"
            onClick={() => syncWeread()}
            disabled={isSyncing}
            className="r-btn-primary px-4 py-2 text-sm disabled:opacity-50 whitespace-nowrap"
          >
            {isSyncing ? '同步中...' : '从微信读书同步'}
          </button>
        </div>

        {lastSyncResult && !syncError && (
          <p className="text-xs text-rhythm-success mt-3">
            已同步 {lastSyncResult.books} 本书 · {lastSyncResult.highlights} 条划线 ·{' '}
            {lastSyncResult.thoughts} 条想法
          </p>
        )}
        {syncError && <p className="text-xs text-rhythm-danger mt-3">{syncError}</p>}
      </div>

      {/* Empty state */}
      {!isLoadingHighlights && groups.length === 0 && (
        <div className="r-card p-8 text-center">
          <p className="text-4xl mb-3">📑</p>
          <p className="text-rhythm-text-secondary text-sm">还没有词条</p>
          <p className="text-rhythm-text-muted text-xs mt-1">
            点上方按钮，从微信读书同步你的划线笔记
          </p>
        </div>
      )}

      {/* Grouped card flow */}
      {groups.map((g) => {
        const isOpen = expanded.has(g.bookId)
        return (
          <div key={g.bookId} className="r-card p-4">
            <button
              type="button"
              onClick={() => toggle(g.bookId)}
              className="flex items-center gap-3 w-full text-left"
            >
              {g.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={g.cover}
                  alt={g.title}
                  className="w-9 h-12 rounded object-cover border border-rhythm-border shrink-0"
                />
              ) : (
                <div className="w-9 h-12 rounded bg-rhythm-void/40 border border-rhythm-border flex items-center justify-center text-base shrink-0">
                  📖
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="r-title text-sm truncate">{g.title}</p>
                {g.author && <p className="text-xs text-rhythm-text-muted truncate">{g.author}</p>}
                <p className="text-xs text-rhythm-text-muted mt-0.5">{g.items.length} 条词条</p>
              </div>
              <span
                className={`text-rhythm-text-muted text-xs transition-transform shrink-0 ${
                  isOpen ? 'rotate-90' : ''
                }`}
              >
                ▶
              </span>
            </button>

            {isOpen && (
              <div className="space-y-3 mt-3">
                {g.items.map((h) => (
                  <div key={h.id} className="border-l-2 border-rhythm-glow/60 pl-3 py-0.5">
                    {h.chapter_title && (
                      <p className="text-[11px] text-rhythm-text-muted mb-1">{h.chapter_title}</p>
                    )}
                    {h.mark_text && (
                      <p className="text-sm text-rhythm-text-primary leading-relaxed">
                        {h.mark_text}
                      </p>
                    )}
                    {h.thought && (
                      <p className="text-xs text-rhythm-text-secondary mt-1.5 pl-2 border-l border-rhythm-border">
                        💭 {h.thought}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
