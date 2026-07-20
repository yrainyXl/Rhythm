'use client'

import { useEffect, useMemo } from 'react'
import { usePracticeStore } from '@/features/practice/store/practice-store'

const STATUS_COLOR: Record<string, string> = {
  done: 'bg-rhythm-success',
  partial: 'bg-rhythm-warn',
  skipped: 'bg-rhythm-danger',
}

const STATUS_LABEL: Record<string, string> = {
  done: '完成',
  partial: '做了一点',
  skipped: '没开始',
}

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function isoFromDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function todayIso(): string {
  return isoFromDate(new Date())
}

function buildDates(start: string, end: string): string[] {
  const s = parseIso(start)
  const e = parseIso(end)
  const dates: string[] = []
  const cursor = new Date(s)
  while (cursor.getTime() <= e.getTime()) {
    dates.push(isoFromDate(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}

function shortDate(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${Number(m)}/${Number(d)}`
}

export function RoundTimeline({
  roundId,
  startDate,
  endDate,
}: {
  roundId: string
  startDate: string
  endDate: string
}) {
  const { logsByRound, loadLogsForRound } = usePracticeStore()

  useEffect(() => {
    loadLogsForRound(roundId)
  }, [roundId, loadLogsForRound])

  const dates = useMemo(() => buildDates(startDate, endDate), [startDate, endDate])
  const logs = logsByRound[roundId] ?? []
  const today = todayIso()
  const logByDate = useMemo(() => {
    const map = new Map<string, string>()
    for (const l of logs) map.set(l.local_date, l.status)
    return map
  }, [logs])

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {dates.map((iso) => {
          const status = logByDate.get(iso)
          const isToday = iso === today
          const isPast = parseIso(iso).getTime() < parseIso(today).getTime()
          const colorClass = status ? STATUS_COLOR[status] : (isPast ? 'bg-rhythm-border-strong' : 'bg-rhythm-border')
          return (
            <div
              key={iso}
              title={`${shortDate(iso)}${status ? ` · ${STATUS_LABEL[status]}` : ''}`}
              className={`flex flex-col items-center gap-1 flex-1 min-w-[28px]`}>
              <div
                className={`w-full h-6 rounded-md ${colorClass} ${
                  isToday ? 'ring-2 ring-rhythm-glow ring-offset-2 ring-offset-rhythm-card' : ''
                }`}
              />
              <span className={`text-[0.55rem] tracking-tight ${isToday ? 'text-rhythm-glow' : 'text-rhythm-text-muted'}`}>
                {shortDate(iso)}
              </span>
            </div>
          )
        })}
      </div>
      <div className="flex items-center justify-center gap-3 mt-3 text-[0.6rem] text-rhythm-text-muted">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-rhythm-success" />完成</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-rhythm-warn" />一点</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-rhythm-danger" />没开始</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-rhythm-border-strong" />未记</span>
      </div>
    </div>
  )
}
