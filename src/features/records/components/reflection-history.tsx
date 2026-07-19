'use client'

import { useEffect, useState } from 'react'
import { useReflectionStore } from '@/features/records/components/reflection-view'

const WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日']
type Mood = 'great' | 'fair' | 'poor'
const MOOD_META: Record<Mood, { label: string; icon: string }> = {
  great: { label: '很好', icon: '😊' },
  fair: { label: '一般', icon: '😐' },
  poor: { label: '较差', icon: '😞' },
}

function formatCardDate(localDate: string): string {
  const [y, m, d] = localDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()]
  return `${m}月${d}日 周${weekday}`
}

export function ReflectionHistory() {
  const { history, isLoadingHistory, loadHistory } = useReflectionStore()
  const [localDate] = useState(() => new Date().toISOString().split('T')[0])
  const [highlightedDate, setHighlightedDate] = useState<string | null>(null)

  const [viewMonth, setViewMonth] = useState(() => {
    const [y, m] = localDate.split('-').map(Number)
    return { year: y, month: m }
  })

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const datesWithReflection = new Set(history.map((r) => r.local_date))

  const jumpToDate = (date: string) => {
    const el = document.getElementById(`reflection-${date}`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setHighlightedDate(date)
    setTimeout(() => setHighlightedDate(null), 1600)
  }

  const firstDay = new Date(viewMonth.year, viewMonth.month - 1, 1)
  const daysInMonth = new Date(viewMonth.year, viewMonth.month, 0).getDate()
  const leadingBlanks = (firstDay.getDay() + 6) % 7
  const calendarCells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const prevMonth = () =>
    setViewMonth((v) => (v.month === 1 ? { year: v.year - 1, month: 12 } : { year: v.year, month: v.month - 1 }))
  const nextMonth = () =>
    setViewMonth((v) => (v.month === 12 ? { year: v.year + 1, month: 1 } : { year: v.year, month: v.month + 1 }))

  const pad = (n: number) => String(n).padStart(2, '0')
  const cellDate = (day: number) => `${viewMonth.year}-${pad(viewMonth.month)}-${pad(day)}`

  return (
    <div className="space-y-5">
      <div className="r-card p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={prevMonth}
            className="w-8 h-8 rounded-lg text-rhythm-text-muted hover:text-rhythm-text-primary hover:bg-rhythm-void/40 transition-colors"
            aria-label="上个月"
          >
            ‹
          </button>
          <p className="text-sm font-medium text-rhythm-text-primary tracking-[0.04em]">
            {viewMonth.year}年{viewMonth.month}月
          </p>
          <button
            type="button"
            onClick={nextMonth}
            className="w-8 h-8 rounded-lg text-rhythm-text-muted hover:text-rhythm-text-primary hover:bg-rhythm-void/40 transition-colors"
            aria-label="下个月"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {WEEK_LABELS.map((w) => (
            <div key={w} className="text-center text-[10px] text-rhythm-text-muted py-1">
              {w}
            </div>
          ))}
          {calendarCells.map((day, i) => {
            if (day === null) return <div key={`b-${i}`} />
            const date = cellDate(day)
            const has = datesWithReflection.has(date)
            const isToday = date === localDate
            return (
              <button
                key={date}
                type="button"
                disabled={!has}
                onClick={() => jumpToDate(date)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
                  isToday ? 'border border-rhythm-border-strong text-rhythm-text-primary' : ''
                } ${
                  has
                    ? 'text-rhythm-text-primary hover:bg-rhythm-glow-soft cursor-pointer'
                    : 'text-rhythm-text-muted cursor-default'
                }`}
              >
                <span>{day}</span>
                {has && <span className="w-1 h-1 rounded-full bg-rhythm-text-secondary" />}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-3">
        <p className="r-eyebrow">历史复盘</p>

        {isLoadingHistory ? (
          <p className="text-sm text-rhythm-text-muted py-6 text-center">加载中...</p>
        ) : history.length === 0 ? (
          <div className="r-card p-6 text-center">
            <p className="text-sm text-rhythm-text-secondary mb-1">还没有复盘记录</p>
            <p className="text-xs text-rhythm-text-muted">从今天开始，记录一天的收获与感受吧。</p>
          </div>
        ) : (
          history.map((r) => {
            const moodMeta = r.mood ? MOOD_META[r.mood as Mood] : null
            const rows = [
              { label: '最满意', value: r.best_thing },
              { label: '改进', value: r.improve_thing },
              { label: '明日', value: r.tomorrow_focus },
              { label: '备注', value: r.note },
            ].filter((row) => row.value)
            return (
              <div
                key={r.local_date}
                id={`reflection-${r.local_date}`}
                className={`r-card p-4 transition-colors ${
                  highlightedDate === r.local_date ? 'border-rhythm-border-strong bg-rhythm-glow-soft' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-rhythm-text-secondary">{formatCardDate(r.local_date)}</span>
                    {moodMeta && (
                      <span className="text-xs text-rhythm-text-muted">
                        {moodMeta.icon} {moodMeta.label}
                      </span>
                    )}
                  </div>
                </div>

                {rows.length > 0 ? (
                  <div className="space-y-1.5">
                    {rows.map((row) => (
                      <div key={row.label} className="flex gap-2 text-sm">
                        <span className="text-xs text-rhythm-text-muted shrink-0 w-10 pt-0.5">{row.label}</span>
                        <span className="text-rhythm-text-primary break-words">{row.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-rhythm-text-muted">当天只记录了心情</p>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
