'use client'

import { groupRecentHighlightsByChapter } from '@/features/reading/lib/highlight-groups'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api-client'
import type { PracticeWithLatestRound } from '@/features/practice/store/practice-store'
import { BookPractices } from '@/features/reading/components/book-practices'
import { AuthGuard } from '@/features/app/components/auth-guard'
import { useReadingStore } from '@/features/records/store/reading-store'
import type { ReadingBook } from '@/features/records/store/reading-store'
import type { HighlightWithBook } from '@/features/records/store/reading-store'
import { PracticeFormSheet } from '@/features/practice/components/practice-form-sheet'
import { RecordSessionSheet } from '@/features/reading/components/record-session-sheet'

type BookSessions = ReturnType<typeof useReadingStore.getState>['bookSessions']

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

function sourceExcerpt(h: HighlightWithBook): string {
  const parts = [h.mark_text, h.thought ? `💭 ${h.thought}` : null].filter(Boolean) as string[]
  return parts.join('\n\n')
}

export default function BookDetailPage({ params }: { params: { bookId: string } }) {
  const router = useRouter()
  const { updateBookStatus } = useReadingStore()
  const [detail, setDetail] = useState<{
    bookId: string
    book: ReadingBook | null
    highlights: HighlightWithBook[]
    sessions: BookSessions
    practices: PracticeWithLatestRound[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reload, setReload] = useState(0)
  const [sessionOpen, setSessionOpen] = useState(false)
  const [practiceTarget, setPracticeTarget] = useState<HighlightWithBook | null>(null)

  useEffect(() => {
    let cancelled = false
    const bookId = encodeURIComponent(params.bookId)
    setLoading(true)
    setError(null)
    setDetail(null)
    setSessionOpen(false)
    setPracticeTarget(null)
    Promise.all([
      apiFetch<{ books: ReadingBook[] }>('/api/reading/books'),
      apiFetch<{ highlights: HighlightWithBook[] }>(`/api/reading/highlights?book_id=${bookId}`),
      apiFetch<{ sessions: BookSessions }>(`/api/reading/sessions?book_id=${bookId}`),
      apiFetch<{ practices: PracticeWithLatestRound[] }>(`/api/practice/practices?bookId=${bookId}`),
    ]).then(([books, highlights, sessions, practices]) => {
      if (cancelled) return
      setDetail({ bookId: params.bookId, book: books.books.find((b) => b.id === params.bookId) ?? null,
        highlights: highlights.highlights ?? [], sessions: sessions.sessions ?? [], practices: practices.practices ?? [] })
      setLoading(false)
    }).catch((e: unknown) => {
      if (cancelled) return
      setError(e instanceof Error ? e.message : '加载失败')
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [params.bookId, reload])

  const current = detail?.bookId === params.bookId ? detail : null
  const book = current?.book ?? null
  const bookHighlights = current?.highlights ?? []
  const bookSessions = current?.sessions ?? []
  const handleRecorded = () => setReload((value) => value + 1)

  // 保持最新笔记优先，仅合并相邻的同章节笔记。
  const chapterEntries = groupRecentHighlightsByChapter(bookHighlights)

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
            <p className="text-sm text-rhythm-text-secondary">{loading || (detail !== null && detail.bookId !== params.bookId) ? '正在加载书籍…' : error ? '书籍加载失败' : '书籍不存在'}</p>
            {error && <p className="text-xs text-rhythm-danger" role="alert">{error}</p>}
            {error && <button type="button" onClick={handleRecorded} className="text-sm text-rhythm-glow">重新加载</button>}
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
                onClick={async () => { await updateBookStatus(book.id, opt.value); handleRecorded() }}
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
              {chapterEntries.map(([chapter, items], index) => (
                <div key={`${chapter}-${index}`}>
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
                        <BookPractices practices={current?.practices.filter((p) => p.source_highlight_id === h.id) ?? []} />
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
          sourceExcerpt={practiceTarget ? sourceExcerpt(practiceTarget) : undefined}
          onCreated={(practiceId) => router.push(`/habits/practices/${practiceId}`)}
          sourceHighlightId={practiceTarget?.id}
          sourceLabel={practiceTarget ? `来自《${book.title}》的划线` : undefined}
        />
      </div>
    </AuthGuard>
  )
}
