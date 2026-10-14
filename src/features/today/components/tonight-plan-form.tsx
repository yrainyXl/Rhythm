'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api-client'
import { useArrangementStore } from '@/features/today/store/arrangement-store'
import { addDays } from '@/features/today/lib/dates'

type Band = 'morning' | 'afternoon' | 'evening' | 'night'

const TIME_CHOICES = ['19:30', '20:00', '21:00']

function bandOf(time: string | null): Band {
  if (!time) return 'evening'
  const hour = Number(time.slice(0, 2))
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  if (hour < 22) return 'evening'
  return 'night'
}

/** 早上定今晚的一件事：做什么 + 几点。昨天的安排作为一键建议。 */
export function TonightPlanForm({ today, hint, onSkip }: { today: string; hint: string | null; onSkip?: () => void }) {
  const { create, isSaving } = useArrangementStore()
  const [title, setTitle] = useState('')
  const [time, setTime] = useState<string | null>('20:00')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    apiFetch<{ arrangements: { title: string; status: string }[] }>(`/api/arrangements?date=${addDays(today, -1)}`)
      .then(({ arrangements }) => {
        if (cancelled) return
        const titles = Array.from(new Set((arrangements ?? []).filter((a) => a.status !== 'cancelled').map((a) => a.title)))
        setSuggestions(titles.slice(0, 3))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [today])

  const submit = async () => {
    const value = title.trim()
    if (!value || isSaving) return
    setError(null)
    try {
      await create({ local_date: today, band: bandOf(time), title: value, scheduled_time: time })
    } catch {
      setError('没保存上，内容还在，再试一次。')
    }
  }

  const chip = (active: boolean) =>
    `inline-flex h-9 items-center rounded-full px-3.5 text-[15px] transition-colors ${
      active
        ? 'bg-rhythm-practice/10 font-semibold text-rhythm-practice shadow-[inset_0_0_0_1.5px_rgb(var(--r-practice)/0.4)]'
        : 'bg-rhythm-fill text-rhythm-text-primary'
    }`

  return (
    <div>
      <h2 className="mt-2 text-[22px] font-bold">今晚安排什么？</h2>
      {hint && <p className="mt-1 text-[15px] text-rhythm-text-secondary">这一轮在试：{hint}</p>}

      <label className="mt-4 block text-[13px] text-rhythm-text-secondary" htmlFor="tonight-title">做一件事</label>
      <input
        id="tonight-title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) void submit() }}
        placeholder="比如：读 15 分钟"
        autoComplete="off"
        className="mt-1.5 h-11 w-full rounded-xl bg-rhythm-fill px-3.5 text-[16px] outline-none placeholder:text-rhythm-text-muted focus:shadow-[0_0_0_2px_rgb(var(--r-practice)/0.5)]"
      />
      {suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button key={s} type="button" onClick={() => setTitle(s)} className={chip(title === s)}>{s}</button>
          ))}
        </div>
      )}

      <p className="mt-4 text-[13px] text-rhythm-text-secondary" id="tonight-time-label">几点开始</p>
      <div className="mt-1.5 flex flex-wrap gap-2" role="group" aria-labelledby="tonight-time-label">
        {TIME_CHOICES.map((t) => (
          <button key={t} type="button" aria-pressed={time === t} onClick={() => setTime(t)} className={chip(time === t)}>{t}</button>
        ))}
        <button type="button" aria-pressed={time === null} onClick={() => setTime(null)} className={chip(time === null)}>不定时间</button>
      </div>

      {error && <p role="alert" className="mt-3 text-sm text-rhythm-danger">{error}</p>}
      <button
        type="button"
        onClick={() => void submit()}
        disabled={!title.trim() || isSaving}
        className="mt-4 h-12 w-full rounded-full bg-rhythm-practice font-semibold text-[var(--r-on-practice)] disabled:opacity-40"
      >
        {isSaving ? '保存中…' : '定下来'}
      </button>
      {onSkip && (
        <button type="button" onClick={onSkip} className="mx-auto mt-1 block min-h-[44px] text-sm font-semibold text-rhythm-text-secondary">
          不安排，直接记录今天
        </button>
      )}
    </div>
  )
}
