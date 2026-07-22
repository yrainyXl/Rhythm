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
    reading: 'linear-gradient(135deg, rgba(143,180,220,0.35), rgba(143,180,220,0.15))',
    finished: 'linear-gradient(135deg, #c5a68d, #7f6952)',
    paused: 'linear-gradient(135deg, #8fa8b8, #4a5c74)',
    dropped: 'linear-gradient(135deg, #6b7280, #374151)',
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
          <h1 className="font-serifsc text-lg font-medium m-0">全部书架</h1>
          <p className="text-xs text-rhythm-text-muted mt-1">
            共 {books.length} 本书 · {reading.length} 本在读
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-7 px-5 sm:px-8">
          {allBooks.map((b) => (
            <Link
              key={b.id}
              href={`/reading/${b.id}`}
              className="no-underline text-inherit">
              <div className="w-full aspect-[2/3] rounded-lg relative overflow-hidden mb-2"
                style={{
                  background: getBookBg(b),
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  boxShadow: '1px 3px 12px -3px rgba(0,0,0,0.4)',
                }}>
              </div>
              <div className="space-y-1 px-0.5 pb-2">
                <h3 className="font-serifsc text-[0.8rem] font-medium tracking-tight leading-tight m-0 truncate">
                  {b.title}
                </h3>
                {b.author && (
                  <p className="text-[0.6rem] text-rhythm-text-muted m-0 truncate">
                    {b.author}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className={`text-[0.6rem] tracking-tight px-1.5 py-0.5 rounded-full ${STATUS_COLOR[b.status]}`}>
                    {STATUS_LABEL[b.status]}
                  </span>
                  {b.current_page && b.total_pages && (
                    <span className="text-[0.6rem] text-rhythm-text-muted">
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