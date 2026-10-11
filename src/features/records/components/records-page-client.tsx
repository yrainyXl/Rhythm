'use client'

import { useState } from 'react'
import { AuthGuard } from '@/features/app/components/auth-guard'
import { SleepAnalysis } from '@/features/records/components/sleep-analysis'
import { ReflectionView } from '@/features/records/components/reflection-view'
import { RecordsTabs, type RecordsTab } from '@/features/records/components/records-tabs.tsx'
import { RecordsSubTabs, type RecordsSubTab } from '@/features/records/components/records-sub-tabs.tsx'
import { PracticesList } from '@/features/records/components/practices-list'
import { TrendsPane } from '@/features/records/components/trends-pane'
import { WeeklyReviewFeed } from '@/features/records/components/weekly-review-feed'

export default function RecordsPageClient() {
  const [activeTab, setActiveTab] = useState<RecordsTab>('records')
  const [activeSubTab, setActiveSubTab] = useState<RecordsSubTab>('list')

  return (
    <AuthGuard>
      <div className="r-page">
        <header>
          <h1 className="r-page-title">记录</h1>
          <p className="r-page-description">回看行动与感受，找到适合自己的做法。</p>
        </header>
        <div className="[&_button]:min-h-[44px] [&_button]:text-sm [&_button]:px-2 [&_button]:tracking-normal [&_button]:text-rhythm-text-secondary [&_button[aria-selected=true]]:text-rhythm-text-primary">
          <RecordsTabs active={activeTab} onChange={setActiveTab} />
        </div>

        {activeTab === 'records' && (
          <section aria-label="实践记录" className="space-y-5">
            <div className="[&_button]:min-h-[44px] [&_button]:text-sm [&_button]:tracking-normal [&_button]:text-rhythm-text-secondary [&_button[aria-selected=true]]:text-rhythm-text-primary">
              <RecordsSubTabs active={activeSubTab} onChange={setActiveSubTab} />
            </div>
            {activeSubTab === 'list' ? (
              <PracticesList />
            ) : (
              <TrendsPane />
            )}
          </section>
        )}

        {activeTab === 'sleep' && <SleepAnalysis />}

        {activeTab === 'reflection' && <ReflectionView />}

        {activeTab === 'review' && <WeeklyReviewFeed />}
      </div>
    </AuthGuard>
  )
}
