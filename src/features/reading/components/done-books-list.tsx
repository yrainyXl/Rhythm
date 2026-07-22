'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useReadingStore } from '@/features/records/store/reading-store'
import type { ReadingBook } from '@/features/records/store/reading-store'

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  finished: { label: '读完', className: 'text-rhythm-success bg-rhythm-success-soft' },
  paused: { label: '暂停', className: 'text-rhythm-warn bg-rhythm-warn-soft' },
  dropped: { label: '放弃', className: 'text-rhythm-text-muted bg-rhythm-void/60' },
}

export function DoneBooksList() {
  const { books, loadBooks } = useReadingStore()

  useEffect(() => {
    loadBooks()
  }, [loadBooks])

  // Show finished and paused books on homepage
  const doneBooks = books.filter(b => b.status === 'finished' || b.status === 'paused' || b.status === 'dropped').slice(0, 6)

  if (doneBooks.length === 0) {
    return (
      <div className="rounded-xl overflow-hidden bg-rhythm-card/40 border border-rhythm-border p-6 text-center">
        <p className="text-sm text-rhythm-text-secondary">还没有已读完或暂停的书籍</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl overflow-hidden bg-rhythm-card/40 border border-rhythm-border">
      {doneBooks.map((b, i) => {
        const meta = STATUS_LABEL[b.status] ?? STATUS_LABEL.paused
        return (
          <Link
            key={b.id}
            href={`/reading/${b.id}`}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 ${i > 0 ? 'border-t border-rhythm-border' : ''} hover:bg-rhythm-void/30 transition-colors cursor-pointer`}>
            <div className="w-6 h-8 rounded-sm flex-none"
              style={{
                background: b.cover_url
                  ? `url(${b.cover_url}) center/cover`
                  : 'linear-gradient(135deg, rgba(150,175,205,0.35), rgba(150,175,205,0.15))',
              }} />
            <div className="flex-1 min-w-0">
              <b className="block text-[0.78rem] tracking-tight font-medium truncate">《{b.title}》</b>
              <small className="block text-[0.62rem] text-rhythm-text-muted mt-0.5">
                {b.finished_at ? `${b.finished_at.split('T')[0]} 读完` : ''}
                {b.current_page && b.total_pages ? `${b.current_page} / ${b.total_pages} 页` : ''}
              </small>
            </div>
            <span className={`text-[0.6rem] tracking-tight px-1.5 py-0.5 rounded-full ${meta.className}`}>
              {meta.label}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
