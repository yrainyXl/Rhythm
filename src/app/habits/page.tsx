'use client'

import { useEffect, useState } from 'react'
import { AuthGuard } from '@/features/app/components/auth-guard'
import { useHabitStore } from '@/features/habits/store/habit-store'
import { PlanBriefing } from '@/features/plan/components/plan-briefing'
import { PracticeCurrentCard } from '@/features/plan/components/practice-current-card'
import { EntryCard } from '@/features/plan/components/entry-card'
import { QuickActions } from '@/features/plan/components/quick-actions'
import { ObservationCard } from '@/features/plan/components/observation-card'
import { RecentActivity } from '@/features/plan/components/recent-activity'

function todayIsoDate() {
  return new Date().toISOString().split('T')[0]
}

export default function PlanPage() {
  const { occurrences, generateOccurrences } = useHabitStore()
  const [todayDate] = useState(todayIsoDate)

  useEffect(() => {
    generateOccurrences(todayDate)
  }, [todayDate, generateOccurrences])

  const habitTotal = occurrences.length
  const habitDone = occurrences.filter((o) => o.status === 'done').length

  return (
    <AuthGuard>
      <div className="p-5 space-y-4">
        <PlanBriefing />
        <div className="grid grid-cols-2 gap-3">
          <PracticeCurrentCard />
          <EntryCard
            eyebrow="议题"
            title="当前议题"
            count={0}
            unit="个"
            tail="下阶段接入"
            icon={
              <svg viewBox="0 0 24 24" className="w-3 h-3" style={{ stroke: 'currentColor', strokeWidth: 1.7, fill: 'none' }}>
                <path d="M12 8v4M12 16h.01" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            }
          />
          <EntryCard
            eyebrow="方法"
            title="我的方法"
            count={0}
            unit="条"
            tail="下阶段接入"
            icon={
              <svg viewBox="0 0 24 24" className="w-3 h-3" style={{ stroke: 'currentColor', strokeWidth: 1.7, fill: 'none' }}>
                <path d="M9 12l2 2 4-4" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            }
          />
          <EntryCard
            eyebrow="方向"
            title="长期方向"
            count={0}
            unit="个"
            tail="下阶段接入"
            icon={
              <svg viewBox="0 0 24 24" className="w-3 h-3" style={{ stroke: 'currentColor', strokeWidth: 1.7, fill: 'none' }}>
                <path d="M12 2v20M2 12h20" />
              </svg>
            }
          />
          <EntryCard
            eyebrow="习惯"
            title="日常习惯"
            count={`${habitDone}/${habitTotal}`}
            unit=""
            tail={habitTotal === 0 ? '还没有习惯' : `今日已完成 ${habitDone}`}
            icon={
              <svg viewBox="0 0 24 24" className="w-3 h-3" style={{ stroke: 'currentColor', strokeWidth: 1.7, fill: 'none' }}>
                <path d="M20 6L9 17l-5-5" />
              </svg>
            }
            href="/habits/manage"
          />
        </div>
        <QuickActions />
        <ObservationCard />
        <RecentActivity />
      </div>
    </AuthGuard>
  )
}
