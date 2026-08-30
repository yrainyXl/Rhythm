'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AuthGuard } from '@/features/app/components/auth-guard'
import { useReadingStore } from '@/features/records/store/reading-store'
import type { ReadingBook } from '@/features/records/store/reading-store'
import type { HighlightWithBook } from '@/features/records/store/reading-store'
import { PracticeFormSheet } from '@/features/practice/components/practice-form-sheet'
import { RecordSessionSheet } from '@/features/reading/components/record-session-sheet'

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

const STATUS_OPTIONS: { value: ReadingBook['status']; label: string }[] = [
  { value: 'reading', label: '在读' },
  { value: 'paused', label: '暂停' },
  { value: 'finished', label: '读完' },
  { value: 'dropped', label: '放弃' },
]

function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  return iso.slice(0, 10)
}

function derivePracticeTitle(h: HighlightWithBook): string {
  const text = (h.mark_text || h.thought || '').replace(/\s+/g, ' ').trim()
  return text.length > 18 ? `${text.slice(0, 18)}…` : text
}

function deriveAssumption(h: HighlightWithBook): string {
  const parts = [h.mark_text, h.thought ? `💭 ${h.thought}` : null].filter(Boolean) as string[]
  return parts.join('\n\n')
}

export default function BookDetailPage({ params }: { params: { bookId: string } }) {
  const { books, loadBooks, updateBookStatus, loadBookDetail, bookHighlights, bookSessions } =
    useReadingStore()
  const [book, setBook] = useState<ReadingBook | null>(null)
  const [sessionOpen, setSessionOpen] = useState(false)
  const [practiceTarget, setPracticeTarget] = useState<HighlightWithBook | null>(null)

  useEffect(() => {
    loadBooks()
  }, [loadBooks])

  useEffect(() => {
    const found = books.find((b) => b.id === params.bookId)
    setBook(found || null)
  }, [books, params.bookId])

  useEffect(() => {
    void loadBookDetail(params.bookId)
  }, [loadBookDetail, params.bookId])

  const handleRecorded = () => {
    void loadBookDetail(params.bookId)
    void loadBooks()
  }

  // 划线笔记按章节分组
  const chapterGroups = new Map<string, HighlightWithBook[]>()
  bookHighlights.forEach((h) => {
    const key = h.chapter_title?.trim() || '其他章节'
    if (!chapterGroups.has(key)) chapterGroups.set(key, [])
    chapterGroups.get(key)!.push(h)
  })
  const chapterEntries = Array.from(chapterGroups.entries())

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
                  读完于 {formatDate(book.finished_at)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action row: 记录阅读 + 状态切换 */}
        <div className="r-card p-4">
          <button
            type="button"
            onClick={() => setSessionOpen(true)}
            className="w-full py-2.5 rounded-xl text-sm bg-rhythm-glow-soft border border-rhythm-border-strong text-rhythm-glow cursor-pointer">
            记录阅读
          </button>
          <div className="flex gap-2 mt-3">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateBookStatus(book.id, opt.value)}
                className={`flex-1 py-2 rounded-xl text-sm border cursor-pointer transition-colors ${
                  book.status === opt.value
                    ? 'bg-rhythm-glow-soft border-rhythm-border-strong text-rhythm-glow'
                    : 'bg-transparent border-rhythm-border text-rhythm-text-muted hover:text-rhythm-text-secondary'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 划线笔记区 */}
        <section>
          <h2 className="font-serifsc text-sm font-medium m-0 mb-2 px-0.5">划线笔记</h2>
          {chapterEntries.length === 0 ? (
            <div className="r-card p-6 text-center">
              <p className="text-sm text-rhythm-text-secondary">
                还没有划线笔记,同步微信读书后会显示在这里
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {chapterEntries.map(([chapter, items]) => (
                <div key={chapter}>
                  <p className="text-[0.65rem] tracking-wide text-rhythm-text-muted mb-1.5 px-0.5">
                    {chapter} · {items.length} 条
                  </p>
                  <div className="space-y-2">
                    {items.map((h) => (
                      <div key={h.id} className="r-card p-3">
                        {h.mark_text && (
                          <p className="text-sm leading-relaxed text-rhythm-text-primary m-0 whitespace-pre-wrap">
                            {h.mark_text}
                          </p>
                        )}
                        {h.thought && (
                          <p className="text-xs leading-relaxed text-rhythm-text-secondary mt-2 mb-0 whitespace-pre-wrap">
                            💭 {h.thought}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2.5">
                          <span className="text-[0.6rem] text-rhythm-text-muted">
                            {formatDate(h.highlighted_at || h.created_at)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setPracticeTarget(h)}
                            className="text-[0.65rem] px-2 py-1 rounded-lg border border-rhythm-border-strong text-rhythm-glow bg-transparent cursor-pointer hover:bg-rhythm-glow-soft transition-colors">
                            发起实践
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 阅读记录区 */}
        <section>
          <h2 className="font-serifsc text-sm font-medium m-0 mb-2 px-0.5">阅读记录</h2>
          {bookSessions.length === 0 ? (
            <div className="r-card p-6 text-center">
              <p className="text-sm text-rhythm-text-secondary">还没有阅读记录</p>
              <p className="text-xs text-rhythm-text-muted mt-1">点击「记录阅读」记录一次阅读时长</p>
            </div>
          ) : (
            <div className="space-y-2">
              {bookSessions.map((s) => (
                <div key={s.id} className="r-card p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-rhythm-text-primary">
                      {formatDate(s.read_date)}
                    </span>
                    <span className="text-xs text-rhythm-text-muted">
                      {s.duration_minutes} 分钟{s.pages_read ? ` · ${s.pages_read} 页` : ''}
                    </span>
                  </div>
                  {s.note && (
                    <p className="text-xs text-rhythm-text-secondary mt-1.5 mb-0">{s.note}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <RecordSessionSheet
          open={sessionOpen}
          bookId={book.id}
          onClose={() => setSessionOpen(false)}
          onRecorded={handleRecorded}
        />
        <PracticeFormSheet
          open={practiceTarget !== null}
          onClose={() => setPracticeTarget(null)}
          initialTitle={practiceTarget ? derivePracticeTitle(practiceTarget) : undefined}
          initialAssumption={practiceTarget ? deriveAssumption(practiceTarget) : undefined}
          sourceHighlightId={practiceTarget?.id}
          sourceLabel={practiceTarget ? `来自《${book.title}》的划线` : undefined}
        />
      </div>
    </AuthGuard>
  )
}
