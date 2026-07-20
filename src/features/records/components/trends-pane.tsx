'use client'

import { useEffect } from 'react'
import { usePracticeStore } from '@/features/practice/store/practice-store'
import { useWeeklyReviewStore } from '@/features/practice/store/weekly-review-store'

function Section({ title, subtitle, children, empty }: {
  title: string
  subtitle: string
  children: React.ReactNode
  empty?: string
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5 px-0.5">
        <span className="text-[0.62rem] tracking-[0.14em] uppercase text-rhythm-text-secondary">{title}</span>
        <span className="text-[0.6rem] text-rhythm-text-muted">{subtitle}</span>
      </div>
      <div className="r-card p-4">
        {empty ? (
          <div className="text-center py-6 text-xs text-rhythm-text-muted">{empty}</div>
        ) : children}
      </div>
    </div>
  )
}

export function TrendsPane() {
  const { practices, loadPractices } = usePracticeStore()
  const { reviews, loadReviews } = useWeeklyReviewStore()

  useEffect(() => {
    loadPractices()
    loadReviews()
  }, [loadPractices, loadReviews])

  const completedRounds = practices
    .filter((p) => p.latestRound)
    .slice(0, 5)
    .map((p) => ({
      label: p.title,
      value: p.latestRound && p.latestRound.total_days > 0
        ? Math.round((p.latestRound.done_days / p.latestRound.total_days) * 100)
        : 0,
    }))

  return (
    <div className="space-y-5">
      <Section
        title="实践 · 完成率"
        subtitle={`近 ${completedRounds.length} 轮`}
        empty={completedRounds.length === 0 ? '发起实践后,这里会显示每轮的完成率对比' : undefined}>
        <svg viewBox="0 0 320 160" className="w-full h-auto block" preserveAspectRatio="none">
          <line x1="0" y1="130" x2="320" y2="130" stroke="rgba(150,175,205,0.18)" strokeWidth="0.5" />
          <line x1="0" y1="80" x2="320" y2="80" stroke="rgba(150,175,205,0.10)" strokeWidth="0.5" strokeDasharray="2 2" />
          <line x1="0" y1="40" x2="320" y2="40" stroke="rgba(150,175,205,0.10)" strokeWidth="0.5" strokeDasharray="2 2" />
          {completedRounds.map((r, i) => {
            const barH = (r.value / 100) * 90
            const x = 30 + i * 55
            return (
              <g key={i}>
                <rect x={x} y={130 - barH} width="42" height={barH} rx="4" fill="url(#barGrad)" />
                <text x={x + 21} y="146" fontSize="8" textAnchor="middle" fill="rgba(210,218,228,0.55)">
                  {r.label.slice(0, 4)}
                </text>
                <text x={x + 21} y={126 - barH} fontSize="9" textAnchor="middle" fill="rgba(222,228,236,0.92)" fontFamily="Noto Serif SC">
                  {r.value}%
                </text>
              </g>
            )
          })}
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(143,180,220)" stopOpacity="0.95" />
              <stop offset="100%" stopColor="rgb(143,180,220)" stopOpacity="0.35" />
            </linearGradient>
          </defs>
        </svg>
      </Section>

      <Section
        title="方法沉淀"
        subtitle="累计条数"
        empty="确认第一条方法后开始累计">
        <div className="text-center py-6 text-xs text-rhythm-text-muted">
          需要在 methods 表插入数据后接入
        </div>
      </Section>

      <Section
        title="睡眠 · 时长趋势"
        subtitle="近 30 天"
        empty="接入小米手环后显示" />

      <Section
        title="复盘 · 节奏"
        subtitle="近 30 天"
        empty={reviews.length === 0 ? '开始写复盘,这里会显示热力图' : undefined}>
        <div className="text-center py-4 text-xs text-rhythm-text-muted">
          已有 {reviews.length} 条周回顾
        </div>
      </Section>
    </div>
  )
}
