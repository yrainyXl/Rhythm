'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AuthGuard } from '@/features/app/components/auth-guard'
import { useReadingStore } from '@/features/records/store/reading-store'
import { RandomHighlightHero } from '@/features/reading/components/random-highlight-hero'
import { ReadingStatsBar } from '@/features/reading/components/reading-stats-bar'
import { BookshelfRow } from '@/features/reading/components/bookshelf-row'
import { HighlightsStream } from '@/features/reading/components/highlights-stream'
import { DoneBooksList } from '@/features/reading/components/done-books-list'

function SectionTitle({ label, href, action }: { label: string; href?: string; action?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="r-section-title">{label}</h2>
      {href && <Link href={href} className="r-link">{action}</Link>}
    </div>
  )
}

function ReadingContent() {
  const { loadBooks, loadHighlights, runAnalysis, maybeAutoSyncWeread } = useReadingStore()

  useEffect(() => {
    void Promise.all([
      loadBooks(),
      loadHighlights({ recentBooks: 5 }),
      runAnalysis(),
    ])
    // 后台静默自动同步(距上次超过 6 小时才触发),完成后自动刷新书籍与词条
    void maybeAutoSyncWeread()
  }, [loadBooks, loadHighlights, runAnalysis, maybeAutoSyncWeread])

  return (
    <div className="r-page">
      <header>
        <h1 className="r-page-title">阅读</h1>
        <p className="r-page-description mt-2">留下触动你的想法，把收获带进生活。</p>
      </header>
      <section>
        <SectionTitle label="正在读" href="/reading/books" action="书架" />
        <BookshelfRow />
      </section>
      <section>
        <SectionTitle label="最近的划线" href="/reading/highlights" action="全部划线" />
        <HighlightsStream />
      </section>
      <section>
        <SectionTitle label="重读一句" />
        <RandomHighlightHero />
      </section>
      <ReadingStatsBar />
      <section>
        <SectionTitle label="读过的书" />
        <DoneBooksList />
      </section>
    </div>
  )
}

export default function ReadingPage() {
  return (
    <AuthGuard>
      <ReadingContent />
    </AuthGuard>
  )
}
