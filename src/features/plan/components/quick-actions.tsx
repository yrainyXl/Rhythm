'use client'

import Link from 'next/link'
import { ArrowRight, Compass, FlaskConical, Lightbulb, BookmarkCheck, CheckCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Entry {
  label: string
  href: string
  icon: LucideIcon
  description: string
}

const ENTRIES: Entry[] = [
  { label: '方向', href: '/habits/directions', icon: Compass, description: '想往哪里走' },
  { label: '议题', href: '/habits/topics', icon: Lightbulb, description: '值得思考的问题' },
  { label: '方法', href: '/habits/methods', icon: BookmarkCheck, description: '留下有效的做法' },
  { label: '习惯', href: '/habits/manage', icon: CheckCheck, description: '管理日常打卡' },
]

export function QuickActions() {
  return (
    <div className="space-y-3">
      <Link href="/habits/practices" className="flex min-h-[88px] items-center gap-4 rounded-2xl bg-rhythm-glow/10 px-5 py-4 text-rhythm-text-primary transition-colors hover:bg-rhythm-glow/15">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rhythm-glow/10 text-rhythm-glow"><FlaskConical size={22} aria-hidden="true" /></span>
        <span className="flex-1 min-w-0"><span className="block text-base font-semibold">实践</span><span className="mt-1 block text-sm text-rhythm-text-secondary">把想法变成行动，记录每次尝试</span></span>
        <ArrowRight size={20} className="shrink-0 text-rhythm-glow" aria-hidden="true" />
      </Link>
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-x-4 gap-y-1">
        {ENTRIES.map(({ label, href, icon: Icon, description }) => (
          <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-2 py-4 text-rhythm-text-primary transition-colors hover:bg-rhythm-glow/5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rhythm-glow/10 text-rhythm-glow"><Icon size={22} aria-hidden="true" /></span>
            <span className="min-w-0"><span className="block text-[15px] font-semibold">{label}</span><span className="mt-1 block text-sm text-rhythm-text-secondary">{description}</span></span>
          </Link>
        ))}
      </div>
    </div>
  )
}
