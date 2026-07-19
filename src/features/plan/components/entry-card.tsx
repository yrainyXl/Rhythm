'use client'

import type { ReactNode } from 'react'

export function EntryCard({
  eyebrow,
  title,
  count,
  unit,
  tail,
  icon,
  href,
}: {
  eyebrow: string
  title: string
  count: number | string
  unit?: string
  tail: string
  icon: ReactNode
  href?: string
}) {
  const Tag: any = href ? 'a' : 'div'
  return (
    <Tag
      href={href}
      className="flex flex-col justify-between min-h-[130px] p-4 rounded-2xl border border-rhythm-border bg-rhythm-card/80 backdrop-blur-sm no-underline text-inherit cursor-pointer transition-colors hover:border-rhythm-border-strong"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-[0.58rem] tracking-[0.16em] uppercase text-rhythm-text-muted">{eyebrow}</span>
        <span className="flex-none w-[26px] h-[26px] rounded-lg grid place-items-center bg-rhythm-glow-soft text-rhythm-glow">
          {icon}
        </span>
      </div>
      <h3 className="font-serifsc font-medium text-[0.95rem] tracking-tight m-0 mb-1">{title}</h3>
      <div className="mt-auto">
        <div className="font-serifsc text-[1.65rem] text-rhythm-glow leading-none tracking-tight">
          {count}
          {unit && <small className="font-inherit text-[0.62rem] tracking-tight uppercase text-rhythm-text-muted ml-1 font-normal">{unit}</small>}
        </div>
        <div className="text-[0.66rem] tracking-tight text-rhythm-text-muted leading-normal mt-1">{tail}</div>
      </div>
    </Tag>
  )
}
