'use client'

import Link from 'next/link'
import { AuthGuard } from '@/features/app/components/auth-guard'
import { PracticesList } from '@/features/records/components/practices-list'

export default function PracticesPage() {
  return (
    <AuthGuard>
      <div className="r-subpage">
        <div className="flex items-center justify-between">
          <Link
            href="/habits"
            className="r-back">
            <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ stroke: 'currentColor', strokeWidth: 2, fill: 'none' }}>
              <path d="M15 18l-6-6 6-6" />
            </svg>
            返回计划
          </Link>
        </div>
        <div>
          <h1 className="r-detail-title">实践管理</h1>
          <p className="r-page-description mt-2">
            持续验证一件事,直到找到适合自己的答案
          </p>
        </div>
        <PracticesList />
      </div>
    </AuthGuard>
  )
}
