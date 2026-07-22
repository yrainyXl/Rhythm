'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AuthGuard } from '@/features/app/components/auth-guard'
import { useReadingStore } from '@/features/records/store/reading-store'
import type { HighlightWithBook } from '@/features/records/store/reading-store'

function getBookBg(bookStatus: string, coverUrl: string | null | undefined): string {
  if (coverUrl) {
    return `url(${coverUrl}) center/cover`
  }
  const defaults: Record<string, string> = {
    reading: 'linear-gradient(135deg, rgba(143,180,220,0.4), rgba(143,180,220,0.2))',
    finished: 'linear-gradient(135deg, #c5a68d, #7f6952)',
    paused: 'linear-gradient(135deg, #8fa8b8, #4a5c74)',
    dropped: 'linear-gradient(135deg, #6b7280, #374151)',
  }
  return defaults[bookStatus] ?? defaults.reading
}

export default function AllHighlightsPage() {
  const { highlights, loadHighlights } = useReadingStore()

  useEffect(() => {
    loadHighlights()
  }, [loadHighlights])

  const grouped = new Map<string, HighlightWithBook[]>()
  highlights.forEach(h => {
    const bookId = h.book_id
    if (!grouped.has(bookId)) {
      grouped.set(bookId, [])
    }
    grouped.get(bookId)!.push(h)
  })
  const books = Array.from(grouped.entries())

  return (
    <AuthGuard>
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <Link
            href="/reading"
            className="flex items-center gap-1 text-xs text-rhythm-text-muted hover:text-rhythm-text-primary transition-colors">
            <svg viewBox="0 0 24 24" className="w-3 h-3" style={{ stroke: 'currentColor', strokeWidth: 2, fill: 'none' }}>
              <path d="M15 18l-6-6 6-6" />
            </svg>
            返回阅读
          </Link>
        </div>

        <div>
          <h1 className="font-serifsc text-lg font-medium m-0">全部词条</h1>
          <p className="text-xs text-rhythm-text-muted mt-1">
            共 {highlights.length} 条划线笔记 · {books.length} 本书
          </p>
        </div>

        <div className="space-y-2">
          {books.map(([bookId, bookHighlights]) => {
            const first = bookHighlights[0]
            const book = first.reading_books
            if (!book) return null
            return (
              <Link
                key={bookId}
                href={`/reading/${bookId}`}
                className="block p-3 rounded-xl border border-rhythm-border bg-rhythm-card/40 hover:bg-rhythm-void/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-14 rounded-sm flex-none"
                    style={{ background: getBookBg(book.status, book.cover_url) }} />
                  <div className="flex-1 min-w-0">
                    <b className="block text-[0.8rem] tracking-tight font-medium truncate">
                      {book.title}
                    </b>
                    {book.author && (
                      <small className="block text-[0.65rem] text-rhythm-text-muted mt-0.5">
                        {book.author}
                      </small>
                    )}
                    <div className="text-[0.6rem] text-rhythm-text-muted mt-1">
                      {bookHighlights.length} {bookHighlights.length === 1 ? '条' : '条'}
                    </div>
                  </div>
                  <span className="text-[0.6rem] text-rhythm-text-muted">→</span>
                </div>
              </Link>
          )})}
        </div>
      </div>
    </AuthGuard>
  )
}