'use client'

import { useEffect, useMemo, useState } from 'react'
import { AuthGuard } from '@/features/app/components/auth-guard'
import { useReadingStore } from '@/features/records/store/reading-store'

export default function CouplePageClient() {
  const { highlights, loadHighlights, isLoadingHighlights } = useReadingStore()
  const [seed, setSeed] = useState(0)

  useEffect(() => {
    loadHighlights()
  }, [loadHighlights])

  const pool = useMemo(() => highlights.filter((h) => h.mark_text), [highlights])

  const pick = useMemo(() => {
    if (pool.length === 0) return null
    return pool[Math.floor(Math.random() * pool.length)]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, seed])

  return (
    <AuthGuard>
      <div className="px-6 min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center text-center space-y-6">
        {/* Empty state */}
        {!isLoadingHighlights && pool.length === 0 && (
          <div className="space-y-3">
            <p className="text-4xl">📖</p>
            <p className="text-rhythm-text-secondary text-sm">还没有词条</p>
            <p className="text-rhythm-text-muted text-xs">
              去「记录 · 阅读 · 词条」从微信读书同步你的划线
            </p>
          </div>
        )}

        {/* Random highlight */}
        {pick && (
          <div className="max-w-md">
            <p className="text-base text-rhythm-text-primary font-light leading-loose">
              {pick.mark_text}
            </p>
            {pick.thought && (
              <p className="text-xs text-rhythm-text-secondary mt-5 leading-relaxed">
                💭 {pick.thought}
              </p>
            )}
            <p className="text-xs text-rhythm-text-muted mt-6">
              —— {pick.reading_books?.title ?? '未知书籍'}
              {pick.reading_books?.author ? ` · ${pick.reading_books.author}` : ''}
            </p>
          </div>
        )}

        {pool.length > 0 && (
          <button
            type="button"
            onClick={() => setSeed((s) => s + 1)}
            className="text-xs text-rhythm-text-muted hover:text-rhythm-text-secondary border border-rhythm-border rounded-full px-5 py-2 transition-colors"
          >
            换一条
          </button>
        )}
      </div>
    </AuthGuard>
  )
}
