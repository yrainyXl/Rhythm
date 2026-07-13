'use client'

import { useState, useEffect } from 'react'
import { create } from 'zustand'
import { createBrowserClient, getCurrentUser } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type Reflection = Database['public']['Tables']['daily_reflections']['Row']
type Mood = 'great' | 'fair' | 'poor'

interface ReflectionState {
  todayReflection: Reflection | null
  history: Reflection[]
  isSaving: boolean
  isLoadingHistory: boolean

  loadToday: (localDate: string) => Promise<void>
  loadHistory: () => Promise<void>
  saveReflection: (data: {
    local_date: string
    mood: Mood | null
    best_thing: string | null
    improve_thing: string | null
    tomorrow_focus: string | null
    note: string | null
    is_shared: boolean
  }) => Promise<{ error: string | null }>
}

export const useReflectionStore = create<ReflectionState>((set) => ({
  todayReflection: null,
  history: [],
  isSaving: false,
  isLoadingHistory: true,

  loadToday: async (localDate) => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return

    const { data } = await supabase
      .from('daily_reflections')
      .select('*')
      .eq('user_id', user.id)
      .eq('local_date', localDate)
      .maybeSingle()

    set({ todayReflection: data ?? null })
  },

  loadHistory: async () => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) {
      set({ isLoadingHistory: false })
      return
    }

    const { data } = await supabase
      .from('daily_reflections')
      .select('*')
      .eq('user_id', user.id)
      .order('local_date', { ascending: false })
      .limit(90)

    set({ history: data ?? [], isLoadingHistory: false })
  },

  saveReflection: async (data) => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return { error: 'Not authenticated' }

    set({ isSaving: true })

    const { error } = await supabase.from('daily_reflections').upsert({
      user_id: user.id,
      local_date: data.local_date,
      mood: data.mood,
      best_thing: data.best_thing,
      improve_thing: data.improve_thing,
      tomorrow_focus: data.tomorrow_focus,
      note: data.note,
      is_shared: data.is_shared,
    }, { onConflict: 'user_id,local_date' })

    set({ isSaving: false })
    if (!error) {
      await useReflectionStore.getState().loadToday(data.local_date)
      await useReflectionStore.getState().loadHistory()
    }
    return { error: error?.message ?? null }
  },
}))

const MOOD_META: Record<Mood, { label: string; icon: string }> = {
  great: { label: '很好', icon: '😊' },
  fair: { label: '一般', icon: '😐' },
  poor: { label: '较差', icon: '😞' },
}

const WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日']

function formatCardDate(localDate: string): string {
  const [y, m, d] = localDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()]
  return `${m}月${d}日 周${weekday}`
}

export function ReflectionView() {
  const { todayReflection, history, isSaving, isLoadingHistory, loadToday, loadHistory, saveReflection } =
    useReflectionStore()
  const [localDate] = useState(() => new Date().toISOString().split('T')[0])
  const [showForm, setShowForm] = useState(false)
  const [mood, setMood] = useState<Mood | null>(null)
  const [bestThing, setBestThing] = useState('')
  const [improveThing, setImproveThing] = useState('')
  const [tomorrowFocus, setTomorrowFocus] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [highlightedDate, setHighlightedDate] = useState<string | null>(null)

  // Calendar view month (first day of the displayed month)
  const [viewMonth, setViewMonth] = useState(() => {
    const [y, m] = localDate.split('-').map(Number)
    return { year: y, month: m } // month is 1-12
  })

  useEffect(() => {
    loadToday(localDate)
    loadHistory()
  }, [localDate, loadToday, loadHistory])

  // Sync form fields from existing reflection when loaded
  useEffect(() => {
    if (todayReflection) {
      setMood(todayReflection.mood)
      setBestThing(todayReflection.best_thing ?? '')
      setImproveThing(todayReflection.improve_thing ?? '')
      setTomorrowFocus(todayReflection.tomorrow_focus ?? '')
      setNote(todayReflection.note ?? '')
    }
  }, [todayReflection])

  const datesWithReflection = new Set(history.map((r) => r.local_date))

  const handleSubmit = async () => {
    setError(null)
    const result = await saveReflection({
      local_date: localDate,
      mood,
      best_thing: bestThing || null,
      improve_thing: improveThing || null,
      tomorrow_focus: tomorrowFocus || null,
      note: note || null,
      is_shared: false,
    })
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setShowForm(false)
      }, 1200)
    }
  }

  const jumpToDate = (date: string) => {
    const el = document.getElementById(`reflection-${date}`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setHighlightedDate(date)
    setTimeout(() => setHighlightedDate(null), 1600)
  }

  // Build the calendar grid for viewMonth (Monday-first)
  const firstDay = new Date(viewMonth.year, viewMonth.month - 1, 1)
  const daysInMonth = new Date(viewMonth.year, viewMonth.month, 0).getDate()
  const leadingBlanks = (firstDay.getDay() + 6) % 7 // Mon=0 ... Sun=6
  const calendarCells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const prevMonth = () => {
    setViewMonth((v) => (v.month === 1 ? { year: v.year - 1, month: 12 } : { year: v.year, month: v.month - 1 }))
  }
  const nextMonth = () => {
    setViewMonth((v) => (v.month === 12 ? { year: v.year + 1, month: 1 } : { year: v.year, month: v.month + 1 }))
  }

  const pad = (n: number) => String(n).padStart(2, '0')
  const cellDate = (day: number) => `${viewMonth.year}-${pad(viewMonth.month)}-${pad(day)}`

  return (
    <div className="space-y-5">
      {/* Calendar */}
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

      {/* Today action */}
      <button
        type="button"
        onClick={() => setShowForm((v) => !v)}
        className="r-btn-primary w-full"
      >
        {showForm ? '← 返回历史' : todayReflection ? '✎ 编辑今日复盘' : '+ 写今日复盘'}
      </button>

      {/* Today form (collapsible) */}
      {showForm && (
        <div className="r-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="r-title">今日复盘</h3>
          </div>

          <div className="space-y-4">
            {/* Mood */}
            <div>
              <p className="r-label">今天整体状态</p>
              <div className="flex gap-3">
                {([
                  { value: 'great', label: '很好', icon: '😊', color: 'border-rhythm-success bg-rhythm-success-soft' },
                  { value: 'fair', label: '一般', icon: '😐', color: 'border-rhythm-warn bg-rhythm-glow-soft' },
                  { value: 'poor', label: '较差', icon: '😞', color: 'border-rhythm-danger bg-rhythm-danger-soft' },
                ] as const).map(({ value, label, icon, color: colorClass }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMood(value)}
                    className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border transition-colors ${
                      mood === value ? colorClass + ' border-2' : 'border-rhythm-border hover:bg-rhythm-void/40'
                    }`}
                  >
                    <span className="text-xl">{icon}</span>
                    <span className="text-xs text-rhythm-text-secondary">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Best thing */}
            <div>
              <label className="r-label">今天最满意的一件事</label>
              <input
                type="text"
                value={bestThing}
                onChange={(e) => setBestThing(e.target.value)}
                placeholder="无论多小都行..."
                className="r-input"
              />
            </div>

            {/* Improve thing */}
            <div>
              <label className="r-label">今天最需要改进的</label>
              <input
                type="text"
                value={improveThing}
                onChange={(e) => setImproveThing(e.target.value)}
                placeholder="不用太苛责自己"
                className="r-input"
              />
            </div>

            {/* Tomorrow focus */}
            <div>
              <label className="r-label">明天最重要的一件事</label>
              <input
                type="text"
                value={tomorrowFocus}
                onChange={(e) => setTomorrowFocus(e.target.value)}
                placeholder="明天最想完成什么？"
                className="r-input"
              />
            </div>

            {/* Free note */}
            <div>
              <label className="r-label">自由备注</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="随便说点什么..."
                rows={3}
                className="r-input resize-none"
              />
            </div>

            {error && <p className="text-sm text-rhythm-danger">{error}</p>}
            {success && <p className="text-sm text-rhythm-success">保存成功 ✓</p>}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="r-btn-primary w-full py-2.5 text-sm disabled:opacity-50"
            >
              {isSaving ? '保存中...' : todayReflection ? '更新复盘' : '保存复盘'}
            </button>
          </div>
        </div>
      )}

      {/* History timeline (read-only) */}
      {!showForm && (
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
              const isTodayCard = r.local_date === localDate
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
                    {isTodayCard && (
                      <button
                        type="button"
                        onClick={() => setShowForm(true)}
                        className="text-xs text-rhythm-text-muted hover:text-rhythm-text-primary transition-colors"
                      >
                        编辑
                      </button>
                    )}
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
      )}
    </div>
  )
}
