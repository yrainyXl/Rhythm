'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AuthGuard } from '@/features/app/components/auth-guard'
import { useReadingStore } from '@/features/records/store/reading-store'
import type { ReadingBook } from '@/features/records/store/reading-store'

const STATUS_LABEL: Record<ReadingBook['status'], string> = {
  reading: '在读',
  finished: '已读完',
  paused: '暂停',
  dropped: '已放弃',
}

const STATUS_COLOR: Record<ReadingBook['status'], string> = {
  reading: 'text-rhythm-glow bg-rhythm-glow-soft',
  finished: 'text-rhythm-success bg-rhythm-success-soft',
  paused: 'text-rhythm-warn bg-rhythm-warn-soft',
  dropped: 'text-rhythm-text-muted bg-rhythm-void/60',
}

function getBookBg(book: ReadingBook): string {
  if (book.cover_url) {
    return `url(${book.cover_url}) center/cover`
  }
  const defaults: Record<string, string> = {
    reading: 'var(--r-book-reading)',
    finished: 'var(--r-book-finished)',
    paused: 'var(--r-book-paused)',
    dropped: 'var(--r-book-dropped)',
  }
  return defaults[book.status] ?? defaults.reading
}

export default function AllBooksPage() {
  const { books, loadBooks } = useReadingStore()

  useEffect(() => {
    loadBooks()
  }, [loadBooks])

  const reading = books.filter(b => b.status === 'reading')
  const others = books.filter(b => b.status !== 'reading')
  const allBooks = [...reading, ...others]

  return (
    <AuthGuard>
      <div className="r-subpage space-y-7">
        <div className="flex items-center justify-between">
          <Link
            href="/reading"
            className="r-back">
            <svg viewBox="0 0 24 24" className="w-3 h-3" style={{ stroke: 'currentColor', strokeWidth: 2, fill: 'none' }}>
              <path d="M15 18l-6-6 6-6" />
            </svg>
            返回阅读
          </Link>
        </div>

        <div>
          <h1 className="r-detail-title">全部书架</h1>
          <p className="text-sm text-rhythm-text-secondary mt-2">
            共 {books.length} 本书 · {reading.length} 本在读
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-7">
          {allBooks.map((b) => (
            <Link
              key={b.id}
              href={`/reading/${b.id}`}
              className="group no-underline text-inherit rounded-lg hover:text-rhythm-glow transition-colors">
              <div className="w-full aspect-[2/3] rounded-lg relative overflow-hidden mb-2"
                style={{
                  background: getBookBg(b),
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  boxShadow: '0 3px 9px rgba(0,0,0,0.12)',
                }}>
              </div>
              <div className="space-y-1 px-0.5 pb-2">
                <h3 className="text-sm font-medium tracking-tight leading-6 m-0 line-clamp-2 min-h-12">
                  {b.title}
                </h3>
                {b.author && (
                  <p className="text-xs text-rhythm-text-muted m-0 truncate">
                    {b.author}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className={`text-xs tracking-tight px-1.5 py-0.5 rounded-full ${STATUS_COLOR[b.status]}`}>
                    {STATUS_LABEL[b.status]}
                  </span>
                  {b.current_page && b.total_pages && (
                    <span className="text-xs text-rhythm-text-muted">
                      {Math.round((b.current_page / b.total_pages) * 100)}%
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AuthGuard>
  )
}