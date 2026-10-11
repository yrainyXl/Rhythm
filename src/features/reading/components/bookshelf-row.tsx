'use client'

import Link from 'next/link'
import { useReadingStore } from '@/features/records/store/reading-store'
import type { ReadingBook } from '@/features/records/store/reading-store'

const VARIANT_BG: Record<string, string> = {
  reading: 'var(--r-book-reading)',
  finished: 'var(--r-book-finished)',
  paused: 'var(--r-book-paused)',
  dropped: 'var(--r-book-dropped)',
}

function getBookBg(book: ReadingBook): string {
  if (book.cover_url) {
    return `url(${JSON.stringify(book.cover_url)})`
  }
  return VARIANT_BG[book.status] ?? VARIANT_BG.reading
}

export function BookshelfRow() {
  const { books } = useReadingStore()

  // Only show reading books on the homepage row
  const readingBooks = books.filter(b => b.status === 'reading').slice(0, 5)

  return (
    <div className="flex gap-3 overflow-x-auto py-2 -mx-1 px-1 snap-x snap-mandatory">
      {readingBooks.map((b) => (
        <Link
          key={b.id}
          href={`/reading/${b.id}`}
          className="flex-none w-[102px] snap-start no-underline text-inherit cursor-pointer">
          <div className="w-full aspect-[2/3] rounded-lg relative overflow-hidden"
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
        <div className="w-full aspect-[2/3] rounded-lg grid place-items-center border-2 border-dashed border-rhythm-border-strong bg-rhythm-card/40">
          <span className="text-2xl text-rhythm-text-muted">+</span>
        </div>
        <div className="text-[0.62rem] text-rhythm-text-muted mt-1.5 tracking-tight">添加书籍</div>
      </Link>
    </div>
  )
}
