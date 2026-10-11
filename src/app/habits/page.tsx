'use client'

import { AuthGuard } from '@/features/app/components/auth-guard'
import { PracticeCurrentCard } from '@/features/plan/components/practice-current-card'
import { QuickActions } from '@/features/plan/components/quick-actions'

export default function PlanPage() {
  return (
    <AuthGuard>
      <div className="r-page">
        <header>
          <h1 className="r-page-title">计划</h1>
          <p className="r-page-description">把一个想法，变成可以尝试的行动。</p>
        </header>
        <section aria-labelledby="active-practices">
          <h2 id="active-practices" className="r-section-title mb-4">正在尝试</h2>
          <PracticeCurrentCard />
        </section>
        <section aria-labelledby="plan-management">
          <h2 id="plan-management" className="r-section-title mb-4">整理与管理</h2>
          <QuickActions />
        </section>
      </div>
    </AuthGuard>
  )
}
