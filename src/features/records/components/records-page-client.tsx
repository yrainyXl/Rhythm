'use client'

import { Suspense } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { AuthGuard } from '@/features/app/components/auth-guard'
import { SleepAnalysis } from '@/features/records/components/sleep-analysis'
import { ReflectionView } from '@/features/records/components/reflection-view'
import { RecordsTabs, isRecordsTab, type RecordsTab } from '@/features/records/components/records-tabs.tsx'
import { RecordsSubTabs, isRecordsSubTab, type RecordsSubTab } from '@/features/records/components/records-sub-tabs.tsx'
import { PracticesList } from '@/features/records/components/practices-list'
import { TrendsPane } from '@/features/records/components/trends-pane'
import { WeeklyReviewFeed } from '@/features/records/components/weekly-review-feed'

export default function RecordsPageClient() {
  return <Suspense fallback={<div role="status" className="r-page">正在加载记录…</div>}><RecordsContent /></Suspense>
}

function RecordsContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') ?? 'records'
  const view = searchParams.get('view') ?? 'list'
  const activeTab: RecordsTab = isRecordsTab(tab) ? tab : 'records'
  const activeSubTab: RecordsSubTab = isRecordsSubTab(view) ? view : 'list'
  function updateTab(key: 'tab' | 'view', value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <AuthGuard>
      <div className="r-page">
        <header>
          <h1 className="r-page-title">记录</h1>
          <p className="r-page-description">回看行动与感受，找到适合自己的做法。</p>
        </header>
        <div>
          <RecordsTabs active={activeTab} onChange={(value) => updateTab('tab', value)} />
        </div>

        {activeTab === 'records' && (
          <section id="records-panel-records" role="tabpanel" aria-labelledby="records-tab-records" className="space-y-2">
            <div>
              <RecordsSubTabs active={activeSubTab} onChange={(value) => updateTab('view', value)} />
            </div>
            {activeSubTab === 'list' ? (
              <div id="records-view-list" role="tabpanel" aria-labelledby="records-sub-tab-list"><PracticesList /></div>
            ) : (
              <div id="records-view-trends" role="tabpanel" aria-labelledby="records-sub-tab-trends"><TrendsPane /></div>
            )}
          </section>
        )}

        {activeTab === 'sleep' && <section id="records-panel-sleep" role="tabpanel" aria-labelledby="records-tab-sleep"><SleepAnalysis /></section>}

        {activeTab === 'reflection' && <section id="records-panel-reflection" role="tabpanel" aria-labelledby="records-tab-reflection"><ReflectionView /></section>}

        {activeTab === 'review' && <section id="records-panel-review" role="tabpanel" aria-labelledby="records-tab-review"><WeeklyReviewFeed /></section>}
      </div>
    </AuthGuard>
  )
}
