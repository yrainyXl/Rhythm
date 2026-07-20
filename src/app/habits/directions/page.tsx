'use client'

import Link from 'next/link'
import { AuthGuard } from '@/features/app/components/auth-guard'

export default function DirectionsPage() {
  return (
    <AuthGuard>
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <Link
            href="/habits"
            className="flex items-center gap-1 text-xs text-rhythm-text-muted hover:text-rhythm-text-primary transition-colors">
            <svg viewBox="0 0 24 24" className="w-3 h-3" style={{ stroke: 'currentColor', strokeWidth: 2, fill: 'none' }}>
              <path d="M15 18l-6-6 6-6" />
            </svg>
            返回计划
          </Link>
        </div>
        <div>
          <h1 className="font-serifsc text-lg font-medium m-0">长期方向</h1>
          <p className="text-xs text-rhythm-text-muted mt-1">
            回答:我想逐渐成为怎样、生活想往哪里走
          </p>
        </div>
        <div className="r-card p-8 text-center">
          <p className="text-sm text-rhythm-text-secondary">方向管理下阶段接入</p>
          <p className="text-xs text-rhythm-text-muted mt-1">从议题与实践中逐渐形成阶段目标或长期方向</p>
        </div>
      </div>
    </AuthGuard>
  )
}
