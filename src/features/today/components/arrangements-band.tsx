'use client'

import { useEffect, useState } from 'react'
import { useArrangementStore, type Arrangement } from '@/features/today/store/arrangement-store'

const BANDS = [
  { key: 'morning', tag: '早' },
  { key: 'afternoon', tag: '午' },
  { key: 'evening', tag: '晚' },
  { key: 'night', tag: '夜' },
] as const

type BandKey = (typeof BANDS)[number]['key']

function todayIso() {
  return new Date().toISOString().split('T')[0]
}

export function ArrangementsBand() {
  const { arrangements, loadByDate, create, complete, reset, cancel, remove, isSaving } =
    useArrangementStore()
  const [today] = useState(todayIso)
  const [activeBand, setActiveBand] = useState<BandKey | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftTime, setDraftTime] = useState('')

  useEffect(() => {
    void loadByDate(today)
  }, [today, loadByDate])

  const submitCreate = async (band: BandKey) => {
    const title = draftTitle.trim()
    if (!title) {
      setActiveBand(null)
      return
    }
    await create({
      local_date: today,
      band,
      title,
      scheduled_time: draftTime || null,
    })
    setDraftTitle('')
    setDraftTime('')
    setActiveBand(null)
  }

  const byBand = (b: BandKey) =>
    arrangements.filter((a) => a.band === b).sort((x, y) => x.sort_order - y.sort_order)

  return (
    <div className="rounded-2xl border border-rhythm-border bg-rhythm-card/80 backdrop-blur-sm p-4 space-y-2">
      {BANDS.map((b, i) => (
        <div key={b.key} className="grid grid-cols-[42px_1fr] gap-3 items-stretch">
          <div className="flex flex-col items-center gap-1.5 pt-1">
            <span className="text-[0.6rem] tracking-[0.1em] text-rhythm-text-muted">{b.tag}</span>
            <span className="w-2 h-2 rounded-full border border-rhythm-border-strong bg-rhythm-void/60" />
            {i < BANDS.length - 1 && (
              <span className="flex-1 w-px bg-gradient-to-b from-rhythm-border-strong to-transparent" />
            )}
          </div>
          <div className="pb-0.5 space-y-1.5">
            {byBand(b.key).map((a) => (
              <ArrangementRow
                key={a.id}
                a={a}
                onComplete={() => complete(a.id)}
                onReset={() => reset(a.id)}
                onCancel={() => cancel(a.id)}
                onRemove={() => remove(a.id)}
              />
            ))}

            {activeBand === b.key ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[rgba(143,180,220,0.4)] bg-rhythm-void/60">
                <input
                  autoFocus
                  type="text"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void submitCreate(b.key)
                    if (e.key === 'Escape') {
                      setActiveBand(null)
                      setDraftTitle('')
                      setDraftTime('')
                    }
                  }}
                  placeholder={`${b.tag}间要做什么…`}
                  className="flex-1 bg-transparent border-0 outline-none text-sm text-rhythm-text-primary placeholder-rhythm-text-muted"
                />
                <input
                  type="time"
                  value={draftTime}
                  onChange={(e) => setDraftTime(e.target.value)}
                  className="w-[88px] bg-transparent border-0 outline-none text-xs text-rhythm-text-muted"
                />
                <button
                  type="button"
                  onClick={() => void submitCreate(b.key)}
                  disabled={isSaving || !draftTitle.trim()}
                  className="text-xs text-rhythm-glow disabled:opacity-50"
                >
                  确定
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setActiveBand(b.key)
                  setDraftTitle('')
                  setDraftTime('')
                }}
                className="w-full flex items-center gap-2 px-3 py-3 rounded-xl border border-dashed border-rhythm-border-strong text-rhythm-text-muted text-[0.8rem] hover:border-rhythm-glow/40 hover:text-rhythm-glow transition-colors"
              >
                <span className="w-4 h-4 rounded-full grid place-items-center border border-rhythm-border-strong text-rhythm-glow text-[0.7rem]">
                  +
                </span>
                添加{b.tag}间安排
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function ArrangementRow({
  a,
  onComplete,
  onReset,
  onCancel,
  onRemove,
}: {
  a: Arrangement
  onComplete: () => void
  onReset: () => void
  onCancel: () => void
  onRemove: () => void
}) {
  const isDone = a.status === 'done'
  const isCancelled = a.status === 'cancelled'

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-rhythm-border bg-rhythm-void/40">
      <button
        type="button"
        onClick={isDone ? onReset : onComplete}
        disabled={isCancelled}
        className={`flex-none w-5 h-5 rounded-md border grid place-items-center transition-colors ${
          isDone
            ? 'bg-rhythm-glow border-rhythm-glow'
            : isCancelled
              ? 'border-rhythm-border opacity-40'
              : 'border-rhythm-border-strong'
        }`}
        aria-label={isDone ? '恢复' : '完成'}
      >
        {isDone && (
          <svg viewBox="0 0 24 24" className="w-2.5 h-2.5" style={{ stroke: 'rgba(11,16,25,0.9)', strokeWidth: 3, fill: 'none' }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
      <span
        className={`flex-1 text-[0.84rem] tracking-tight ${
          isDone || isCancelled
            ? 'text-rhythm-text-secondary line-through decoration-rhythm-text-faint'
            : 'text-rhythm-text-primary'
        }`}
      >
        {a.title}
        {a.scheduled_time && (
          <span className="ml-2 text-[0.66rem] text-rhythm-text-muted">
            {a.scheduled_time.slice(0, 5)}
          </span>
        )}
      </span>
      {!isCancelled && (
        <button
          type="button"
          onClick={onCancel}
          className="text-[0.66rem] text-rhythm-text-muted hover:text-rhythm-text-secondary"
          aria-label="取消"
        >
          取消
        </button>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="text-[0.66rem] text-rhythm-text-muted hover:text-rhythm-danger"
        aria-label="删除"
      >
        删除
      </button>
    </div>
  )
}
