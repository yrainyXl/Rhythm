'use client'

import Link from 'next/link'
import { useReadingStore } from '@/features/records/store/reading-store'
import type { ReadingBook } from '@/features/records/store/reading-store'

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  finished: { label: '读完', className: 'text-rhythm-text-secondary' },
  paused: { label: '暂停', className: 'text-rhythm-text-secondary' },
  dropped: { label: '放弃', className: 'text-rhythm-text-secondary' },
}

export function DoneBooksList() {
  const { books } = useReadingStore()

  // Show finished and paused books on homepage
  const doneBooks = books.filter(b => b.status === 'finished' || b.status === 'paused' || b.status === 'dropped').slice(0, 6)

  if (doneBooks.length === 0) {
    return (
      <div className="py-4">
        <p className="text-sm text-rhythm-text-secondary">还没有已读完或暂停的书籍</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-rhythm-border">
      {doneBooks.map((b) => {
        const meta = STATUS_LABEL[b.status] ?? STATUS_LABEL.paused
        return (
          <Link
            key={b.id}
            href={`/reading/${b.id}`}
            className={`flex items-center gap-2.5 py-4  hover:bg-rhythm-void/30 transition-colors cursor-pointer`}>
            <div className="w-6 h-8 rounded-sm flex-none"
              style={{
                background: b.cover_url
                  ? `url(${b.cover_url}) center/cover`
                  : 'var(--r-book-placeholder)',
              }} />
            <div className="flex-1 min-w-0">
              <b className="block text-[15px] font-semibold truncate">《{b.title}》</b>
              <small className="block text-sm text-rhythm-text-secondary mt-0.5">
                {b.finished_at ? `${b.finished_at.split('T')[0]} 读完` : ''}
                {b.current_page && b.total_pages ? `${b.current_page} / ${b.total_pages} 页` : ''}
              </small>
            </div>
            <span className={`text-sm px-2 py-1 rounded-md ${meta.className}`}>
              {meta.label}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
