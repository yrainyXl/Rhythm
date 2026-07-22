'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useReadingStore } from '@/features/records/store/reading-store'
import type { ReadingBook } from '@/features/records/store/reading-store'

const VARIANT_BG: Record<string, string> = {
  reading: 'linear-gradient(135deg, rgba(143,180,220,0.35), rgba(143,180,220,0.15))',
  finished: 'linear-gradient(135deg, #c5a68d, #7f6952)',
  paused: 'linear-gradient(135deg, #8fa8b8, #4a5c74)',
  dropped: 'linear-gradient(135deg, #6b7280, #374151)',
}

function getBookBg(book: ReadingBook): string {
  if (book.cover_url) {
    // If we have a cover, use a subtle gradient overlay
    return `linear-gradient(135deg, rgba(0,0,0,0.2), rgba(0,0,0,0.5)), url(${book.cover_url})`
  }
  return VARIANT_BG[book.status] ?? VARIANT_BG.reading
}

export function BookshelfRow() {
  const { books, loadBooks } = useReadingStore()

  useEffect(() => {
    loadBooks()
  }, [loadBooks])

  // Only show reading books on the homepage row
  const readingBooks = books.filter(b => b.status === 'reading').slice(0, 5)

  return (
    <div className="flex gap-3 overflow-x-auto py-2 -mx-1 px-1 snap-x snap-mandatory">
      {readingBooks.map((b) => (
        <Link
          key={b.id}
          href={`/reading/${b.id}`}
          className="flex-none w-[102px] snap-start no-underline text-inherit cursor-pointer">
          <div className="w-full aspect-[3/2] rounded-lg relative overflow-hidden"
            style={{
              background: getBookBg(b),
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              boxShadow: '1px 3px 12px -3px rgba(0,0,0,0.4)',
            }}>
          </div>
          <div className="text-[0.62rem] text-rhythm-text-muted mt-1.5 tracking-tight">
            {b.current_page && b.total_pages ? (
              <b className="text-rhythm-text-secondary font-serifsc font-medium">
                {Math.round((b.current_page / b.total_pages) * 100)}%
              </b>
            ) : (
              <b className="text-rhythm-text-secondary font-serifsc font-medium">
                {b.status === 'reading' ? '在读' : b.status}
              </b>
            )}
            {b.total_pages ? ` · ${b.total_pages} 页` : ''}
          </div>
        </Link>
      ))}
      <Link
        href="/reading"
        className="flex-none w-[102px] snap-start cursor-pointer no-underline text-inherit">
        <div className="w-full aspect-[3/2] rounded-lg grid place-items-center border-2 border-dashed border-rhythm-border-strong bg-rhythm-card/40">
          <span className="text-2xl text-rhythm-text-muted">+</span>
        </div>
        <div className="text-[0.62rem] text-rhythm-text-muted mt-1.5 tracking-tight">添加书籍</div>
      </Link>
    </div>
  )
}
