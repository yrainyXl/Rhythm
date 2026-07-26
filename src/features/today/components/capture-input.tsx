'use client'

import { useEffect, useState } from 'react'
import { useCaptureStore } from '@/features/today/store/capture-store'

function todayIso() {
  return new Date().toISOString().split('T')[0]
}

function formatTime(iso: string): string {
  // created_at 是 ISO 时间串,取本地时分
  const d = new Date(iso)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

export function CaptureInput() {
  const { captures, isSaving, loadByDate, create, remove } = useCaptureStore()
  const [value, setValue] = useState('')
  const [today] = useState(todayIso)

  useEffect(() => {
    void loadByDate(today)
  }, [today, loadByDate])

  const submit = async () => {
    const content = value.trim()
    if (!content || isSaving) return
    setValue('')
    await create({ local_date: today, content })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-2xl border border-rhythm-border bg-rhythm-void/60 px-3 py-2.5 transition-colors focus-within:border-[rgba(143,180,220,0.4)]">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void submit()
          }}
          placeholder="发生了什么,或者你正在怎么想…"
          className="flex-1 bg-transparent border-0 outline-none text-sm text-rhythm-text-primary placeholder-rhythm-text-muted"
        />
        <button
          type="button"
          disabled
          aria-label="语音记录(下阶段接入)"
          className="flex-none w-7 h-7 rounded-full grid place-items-center border border-rhythm-border-strong text-rhythm-glow bg-[rgba(143,180,220,0.06)] opacity-50 cursor-not-allowed"
        >
          <svg viewBox="0 0 24 24" className="w-3 h-3" style={{ stroke: 'rgb(143,180,220)', strokeWidth: 1.9, fill: 'none' }}>
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={isSaving || !value.trim()}
          className="flex-none text-[0.72rem] text-rhythm-glow disabled:opacity-40"
        >
          保存
        </button>
      </div>

      {captures.length > 0 && (
        <div className="space-y-1.5">
          {captures.map((c) => (
            <div key={c.id} className="flex items-start gap-2 px-3 py-2 rounded-xl border border-rhythm-border bg-rhythm-void/40">
              <span className="flex-none text-[0.6rem] text-rhythm-text-muted mt-0.5 tabular-nums">
                {formatTime(c.created_at)}
              </span>
              <p className="flex-1 text-[0.78rem] text-rhythm-text-secondary leading-relaxed m-0 break-words">
                {c.content}
              </p>
              <button
                type="button"
                onClick={() => void remove(c.id)}
                aria-label="删除"
                className="flex-none text-[0.66rem] text-rhythm-text-muted hover:text-rhythm-danger"
              >
                删除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
