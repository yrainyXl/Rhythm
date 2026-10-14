'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api-client'
import { formatDayTitle, shortWeekday } from '@/features/today/lib/dates'

interface WeekDay {
  date: string
  count: number
}

/** 标题行：左边「今天 + 日期」，右边最近 7 天是否留下记录。断一天不归零，只数本周有几天。 */
export function TodayHeader({ today, refreshKey }: { today: string; refreshKey: number }) {
  const [days, setDays] = useState<WeekDay[] | null>(null)

  useEffect(() => {
    let cancelled = false
    apiFetch<{ days: WeekDay[] }>(`/api/today/week?date=${today}`)
      .then((data) => { if (!cancelled) setDays(data.days ?? []) })
      .catch(() => { if (!cancelled) setDays(null) })
    return () => { cancelled = true }
  }, [today, refreshKey])

  const recorded = days?.filter((d) => d.count > 0).length ?? 0
  const label = days
    ? days.map((d) => `${d.date === today ? '今天' : `星期${shortWeekday(d.date)}`}${d.count > 0 ? '有记录' : '没有记录'}`).join('，')
    : ''

  return (
    <header className="flex items-end justify-between px-5 pt-3 pb-4">
      <div>
        <h1 className="text-[34px] font-bold leading-tight">今天</h1>
        <p className="mt-0.5 text-[15px] text-rhythm-text-secondary">{formatDayTitle(today)}</p>
      </div>
      {days && (
        <Link href="/records" className="grid justify-items-end gap-1.5 pb-1" aria-label={`最近 7 天里 ${recorded} 天留下了记录：${label}`}>
          <span className="flex gap-1" aria-hidden="true">
            {days.map((d) => (
              <i
                key={d.date}
                className={`block h-2.5 w-2.5 rounded-full ${
                  d.count > 0
                    ? 'bg-rhythm-glow'
                    : d.date === today
                      ? 'shadow-[inset_0_0_0_1.5px_rgb(var(--r-glow))]'
                      : 'bg-[rgb(var(--r-neutral)/0.16)]'
                }`}
              />
            ))}
          </span>
          <span className="text-[13px] text-rhythm-text-secondary">
            <b className="r-rounded text-[15px] text-rhythm-glow">{recorded}</b> 天有记录
          </span>
        </Link>
      )}
    </header>
  )
}
