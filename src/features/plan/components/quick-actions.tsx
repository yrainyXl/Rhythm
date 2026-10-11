'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

interface Entry {
  key: string
  label: string
  href: string
  icon: ReactNode
  description: string
}

const ENTRIES: Entry[] = [
  {
    key: 'direction',
    description: '想往哪里走',
    label: '方向',
    href: '/habits/directions',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ stroke: 'currentColor', strokeWidth: 1.7, fill: 'none' }}>
        <path d="M12 2v20M2 12h20" />
      </svg>
    ),
  },
  {
    key: 'practice',
    description: '尝试行动并记录',
    label: '实践',
    href: '/habits/practices',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ stroke: 'currentColor', strokeWidth: 1.7, fill: 'none' }}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l3 2" />
      </svg>
    ),
  },
  {
    key: 'topic',
    description: '值得思考的问题',
    label: '议题',
    href: '/habits/topics',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ stroke: 'currentColor', strokeWidth: 1.7, fill: 'none' }}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
    ),
  },
  {
    key: 'method',
    description: '留下有效的做法',
    label: '方法',
    href: '/habits/methods',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ stroke: 'currentColor', strokeWidth: 1.7, fill: 'none' }}>
        <circle cx="12" cy="12" r="9" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    key: 'habit',
    description: '管理日常打卡',
    label: '习惯',
    href: '/habits/manage',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ stroke: 'currentColor', strokeWidth: 1.7, fill: 'none' }}>
        <path d="M20 6L9 17l-5-5" />
      </svg>
    ),
  },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3">
      {ENTRIES.map((a) => (
        <Link key={a.key} href={a.href} className="flex items-center gap-3 p-4 rounded-2xl border border-rhythm-border text-rhythm-text-primary no-underline hover:bg-rhythm-card-hover transition-colors">
          <span aria-hidden="true" className="shrink-0">{a.icon}</span>
          <span className="min-w-0">
            <span className="block text-[15px] font-semibold">{a.label}</span>
            <span className="block text-sm text-rhythm-text-secondary mt-1">{a.description}</span>
          </span>
        </Link>
      ))}
    </div>
  )
}
