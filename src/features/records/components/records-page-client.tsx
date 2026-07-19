'use client'

import { useState } from 'react'
import { AuthGuard } from '@/features/app/components/auth-guard'
import { SleepAnalysis } from '@/features/records/components/sleep-analysis'
import { ReflectionView } from '@/features/records/components/reflection-view'
import { RecordsTabs, type RecordsTab } from '@/features/records/components/records-tabs.tsx'
import { RecordsSubTabs, type RecordsSubTab } from '@/features/records/components/records-sub-tabs.tsx'
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
              <TabPlaceholder
                title="实践记录建设中"
                hint="下阶段接入实践数据后,这里会显示所有实践的轮次与时间线"
              />
            ) : (
              <TabPlaceholder
                title="趋势建设中"
                hint="完成率对比、方法沉淀累计、睡眠时长、复盘节奏等图表"
              />
            )}
          </div>
        )}

        {activeTab === 'sleep' && <SleepAnalysis />}

        {activeTab === 'reflection' && <ReflectionView />}

        {activeTab === 'review' && (
          <TabPlaceholder
            title="AI 周回顾建设中"
            hint="每周日自动生成,含数据摘要、观察与建议"
          />
        )}
      </div>
    </AuthGuard>
  )
}
