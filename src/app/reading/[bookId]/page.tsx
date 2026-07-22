'use client'

import { useEffect, useState } from 'react'
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

export default function BookDetailPage({ params }: { params: { bookId: string } }) {
  const { books, loadBooks, addBook, updateBookStatus } = useReadingStore()
  const [book, setBook] = useState<ReadingBook | null>(null)

  useEffect(() => {
    loadBooks()
  }, [loadBooks])

  useEffect(() => {
    const found = books.find(b => b.id === params.bookId)
    setBook(found || null)
  }, [books, params.bookId])

  if (!book) {
    return (
      <AuthGuard>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-1">
            <Link
              href="/reading"
              className="flex items-center gap-1 text-xs text-rhythm-text-muted hover:text-rhythm-text-primary transition-colors">
              <svg viewBox="0 0 24 24" className="w-3 h-3" style={{ stroke: 'currentColor', strokeWidth: 2, fill: 'none' }}>
                <path d="M15 18l-6-6 6-6" />
              </svg>
              返回阅读
            </Link>
          </div>
          <div className="r-card p-8 text-center">
            <p className="text-sm text-rhythm-text-secondary">书籍不存在</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="p-5 space-y-4">
        {/* Header */}
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

        {/* Book info card */}
        <div className="r-card p-4">
          <div className="flex gap-4">
            {book.cover_url && (
              <div className="flex-none w-24 h-36">
                <img
                  src={book.cover_url}
                  alt={book.title}
                  className="w-full h-full object-cover rounded-lg shadow-md"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="font-serifsc text-xl font-medium m-0 mb-1">{book.title}</h1>
              {book.author && (
                <p className="text-sm text-rhythm-text-secondary mb-2">{book.author}</p>
              )}
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`text-[0.65rem] tracking-tight px-2 py-1 rounded-full border ${STATUS_COLOR[book.status]}`}>
                  {STATUS_LABEL[book.status]}
                </span>
                {book.total_pages && (
                  <span className="text-[0.65rem] text-rhythm-text-muted px-2 py-1 rounded-full border border-rhythm-border bg-transparent">
                    {book.current_page || 0} / {book.total_pages} 页
                  </span>
                )}
                {book.source && (
                  <span className="text-[0.65rem] text-rhythm-text-muted px-2 py-1 rounded-full border border-rhythm-border bg-transparent">
                    {book.source === 'weixin_read' ? '微信读书' : book.source}
                  </span>
                )}
              </div>
              {book.finished_at && (
                <div className="text-xs text-rhythm-text-muted">
                  读完于 {book.finished_at}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 这里后续添加：阅读记录、划线笔记列表 */}
        <div className="r-card p-6 text-center">
          <p className="text-sm text-rhythm-text-secondary">阅读记录和划线笔记下阶段接入</p>
        </div>
      </div>
    </AuthGuard>
  )
}