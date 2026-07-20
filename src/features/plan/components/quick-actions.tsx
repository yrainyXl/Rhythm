'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

interface Entry {
  key: string
  label: string
  href: string
  icon: ReactNode
}

const ENTRIES: Entry[] = [
  {
    key: 'direction',
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
    <div className="grid grid-cols-5 gap-2">
      {ENTRIES.map((a) => (
        <Link
          key={a.key}
          href={a.href}
          className="flex flex-col items-center gap-1.5 px-1 py-3 rounded-xl border border-rhythm-border bg-rhythm-card/40 text-rhythm-text-secondary text-[0.68rem] tracking-tight cursor-pointer transition-colors hover:border-rhythm-border-strong hover:text-rhythm-text-primary no-underline">
          <span className="flex-none w-8 h-8 rounded-[10px] grid place-items-center bg-rhythm-glow-soft text-rhythm-glow">
            {a.icon}
          </span>
          <b className="font-medium tracking-tight leading-tight">{a.label}</b>
        </Link>
      ))}
    </div>
  )
}
