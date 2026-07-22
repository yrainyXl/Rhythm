'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useReadingStore } from '@/features/records/store/reading-store'
import type { HighlightWithBook } from '@/features/records/store/reading-store'

const VARIANT_BG: Record<string, string> = {
  reading: 'linear-gradient(135deg, rgba(143,180,220,0.4), rgba(143,180,220,0.2))',
  finished: 'linear-gradient(135deg, #c5a68d, #7f6952)',
  paused: 'linear-gradient(135deg, #8fa8b8, #4a5c74)',
  dropped: 'linear-gradient(135deg, #6b7280, #374151)',
}

function getBookBg(bookStatus: string, coverUrl: string | null | undefined): string {
  if (coverUrl) {
    return `url(${coverUrl}) center/cover`
  }
  return VARIANT_BG[bookStatus] ?? VARIANT_BG.reading
}

function groupHighlightsByBook(highlights: HighlightWithBook[]): Map<string, HighlightWithBook[]> {
  const map = new Map<string, HighlightWithBook[]>()
  highlights.forEach(h => {
    const bookId = h.book_id
    if (!map.has(bookId)) {
      map.set(bookId, [])
    }
    map.get(bookId)!.push(h)
  })
  return map
}

export function HighlightsStream() {
  const { highlights, loadHighlights } = useReadingStore()

  useEffect(() => {
    loadHighlights()
  }, [loadHighlights])

  if (highlights.length === 0) {
    return (
      <div className="p-6 rounded-2xl border border-rhythm-border bg-rhythm-card/60 text-center">
        <p className="text-sm text-rhythm-text-secondary">还没有划线笔记</p>
        <p className="text-xs text-rhythm-text-muted mt-1">同步微信读书或手动添加笔记后会显示在这里</p>
      </div>
    )
  }

  const grouped = groupHighlightsByBook(highlights)
  // Take the most recent 5 books with highlights
  const recentBooks = Array.from(grouped.entries()).slice(0, 5)

  return (
    <div className="space-y-2">
      {recentBooks.map(([bookId, bookHighlights]) => {
        const firstHighlight = bookHighlights[0]
        const bookTitle = firstHighlight.reading_books?.title ?? '未知书籍'
        const bookAuthor = firstHighlight.reading_books?.author
        const bookStatus = firstHighlight.reading_books?.status ?? 'reading'
        const coverUrl = firstHighlight.reading_books?.cover_url
        return (
          <Link
            key={bookId}
            href={`/reading/${bookId}`}
            className="block p-4 rounded-2xl border border-rhythm-border bg-rhythm-card/80 backdrop-blur-sm hover:bg-rhythm-void/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-11 rounded-sm flex-none"
                style={{ background: getBookBg(bookStatus, coverUrl) }} />
              <div className="flex-1 min-w-0">
                <b className="block font-serifsc font-medium text-[0.85rem] tracking-tight truncate">《{bookTitle}》</b>
                <small className="block text-[0.65rem] text-rhythm-text-muted mt-0.5">
                  {bookAuthor ?? '未知作者'} · {bookHighlights.length} {bookHighlights.length === 1 ? '条' : '条'}
                </small>
              </div>
              <span className="text-[0.6rem] text-rhythm-text-muted">→</span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
