'use client'

import { AuthGuard } from '@/features/app/components/auth-guard'
import { PlanBriefing } from '@/features/plan/components/plan-briefing'
import { PracticeCurrentCard } from '@/features/plan/components/practice-current-card'
import { QuickActions } from '@/features/plan/components/quick-actions'
import { ObservationCard } from '@/features/plan/components/observation-card'
import { RecentActivity } from '@/features/plan/components/recent-activity'

export default function PlanPage() {
  return (
    <AuthGuard>
      <div className="p-5 space-y-4">
        <PlanBriefing />
        <PracticeCurrentCard />
        <QuickActions />
        <ObservationCard />
        <RecentActivity />
      </div>
    </AuthGuard>
  )
}
