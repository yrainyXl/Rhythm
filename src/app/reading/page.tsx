'use client'

import { AuthGuard } from '@/features/app/components/auth-guard'
import { RandomHighlightHero } from '@/features/reading/components/random-highlight-hero'
import { ReadingStatsBar } from '@/features/reading/components/reading-stats-bar'
import { BookshelfRow } from '@/features/reading/components/bookshelf-row'
import { HighlightsStream } from '@/features/reading/components/highlights-stream'
import { ThemesRow } from '@/features/reading/components/themes-row'
import { TryRecommendation } from '@/features/reading/components/try-recommendation'
import { DoneBooksList } from '@/features/reading/components/done-books-list'

function SectionTitle({ label, action }: { label: string; action?: string }) {
  return (
    <div className="flex items-center justify-between mb-2 px-0.5">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-rhythm-glow opacity-60" />
        <span className="text-xs tracking-[0.06em] text-rhythm-text-secondary">{label}</span>
      </div>
      {action && (
        <button type="button" className="text-xs text-rhythm-glow bg-transparent border-0 cursor-pointer">
          {action}
        </button>
      )}
    </div>
  )
}

export default function ReadingPage() {
  return (
    <AuthGuard>
      <div className="p-5 space-y-5">
        <RandomHighlightHero />
        <ReadingStatsBar />

        <section>
          <SectionTitle label="在读" action="全部书架 →" />
          <BookshelfRow />
        </section>

        <section>
          <SectionTitle label="词条 · 按书" action="全部 →" />
          <HighlightsStream />
        </section>

        <section>
          <SectionTitle label="AI · 跨书主题" />
          <ThemesRow />
        </section>

        <section>
          <SectionTitle label="想试试 · AI 推荐" />
          <TryRecommendation />
        </section>

        <section>
          <SectionTitle label="已读 · 暂停" action="14 本 →" />
          <DoneBooksList />
        </section>
      </div>
    </AuthGuard>
  )
}
