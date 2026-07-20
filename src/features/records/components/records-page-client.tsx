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
import { TabPlaceholder } from '@/features/records/components/tab-placeholder'

export default function RecordsPageClient() {
  const [activeTab, setActiveTab] = useState<RecordsTab>('records')
  const [activeSubTab, setActiveSubTab] = useState<RecordsSubTab>('list')

  return (
    <AuthGuard>
      <div className="p-5 space-y-5">
        <RecordsTabs active={activeTab} onChange={setActiveTab} />

        {activeTab === 'records' && (
          <div className="space-y-4">
            <RecordsSubTabs active={activeSubTab} onChange={setActiveSubTab} />
            {activeSubTab === 'list' ? (
              <PracticesList />
            ) : (
              <TrendsPane />
            )}
          </div>
        )}

        {activeTab === 'sleep' && <SleepAnalysis />}

        {activeTab === 'reflection' && <ReflectionView />}

        {activeTab === 'review' && <WeeklyReviewFeed />}
      </div>
    </AuthGuard>
  )
}
