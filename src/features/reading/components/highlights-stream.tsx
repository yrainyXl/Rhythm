'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useReadingStore } from '@/features/records/store/reading-store'
import { groupHighlightsByBook, sortBookGroupsByLatest } from '@/features/reading/lib/highlight-groups'

const VARIANT_BG: Record<string, string> = {
  reading: 'var(--r-book-reading)',
  finished: 'var(--r-book-finished)',
  paused: 'var(--r-book-paused)',
  dropped: 'var(--r-book-dropped)',
}

function getBookBg(bookStatus: string, coverUrl: string | null | undefined): string {
  if (coverUrl) {
    return `url(${coverUrl}) center/cover`
  }
  return VARIANT_BG[bookStatus] ?? VARIANT_BG.reading
}

export function HighlightsStream() {
  const { highlights, isLoadingHighlights } = useReadingStore()

  if (isLoadingHighlights && highlights.length === 0) return <p className="py-4 text-sm text-rhythm-text-secondary" role="status">正在加载划线…</p>

  if (highlights.length === 0) {
    return (
      <div className="py-4">
        <p className="text-sm text-rhythm-text-secondary">还没有划线笔记</p>
        <p className="text-sm text-rhythm-text-secondary mt-2">同步微信读书或手动添加笔记后会显示在这里</p>
      </div>
    )
  }

  const grouped = groupHighlightsByBook(highlights)
  // 按每组 max(highlighted_at) 降序,取最近 5 本有词条的书
  const recentBooks = sortBookGroupsByLatest(grouped).slice(0, 5)

  return (
    <div className="divide-y divide-rhythm-border">
      {recentBooks.map(([bookId, bookHighlights]) => {
        const firstHighlight = bookHighlights[0]
        const bookTitle = firstHighlight.reading_books?.title ?? '未知书籍'
        const bookAuthor = firstHighlight.reading_books?.author
        const bookStatus = firstHighlight.reading_books?.status ?? 'reading'
        const coverUrl = firstHighlight.reading_books?.cover_url
        return (
          <Link
            key={bookId}
            href={`/reading/${bookId}`}
            className="group block rounded-lg py-4 transition-colors hover:bg-rhythm-glow/5">
            <div className="flex items-center gap-3">
              <div aria-hidden="true" className="w-8 h-11 rounded-sm flex-none"
                style={{ background: getBookBg(bookStatus, coverUrl) }} />
              <div className="flex-1 min-w-0">
                <b className="block line-clamp-2 font-semibold text-[15px] leading-snug transition-colors group-hover:text-rhythm-glow">《{bookTitle}》</b>
                <small className="block truncate text-xs text-rhythm-text-secondary mt-1">
                  {bookAuthor ?? '未知作者'} · {bookHighlights.length} 条划线
                </small>
              </div>
              <ArrowRight size={20} className="shrink-0 text-rhythm-glow" aria-hidden="true" />
            </div>
            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-rhythm-text-secondary">{firstHighlight.mark_text || firstHighlight.thought}</p>
          </Link>
        )
      })}
    </div>
  )
}
