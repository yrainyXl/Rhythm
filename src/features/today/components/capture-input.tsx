'use client'

import { useEffect, useState } from 'react'
import { useCaptureStore } from '@/features/today/store/capture-store'

function todayIso() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
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
  const [error, setError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [today] = useState(todayIso)

  useEffect(() => {
    void loadByDate(today)
  }, [today, loadByDate])

  const submit = async () => {
    const content = value.trim()
    if (!content || isSaving) return
    setError(null)
    const previous = useCaptureStore.getState().captures
    try {
      await create({ local_date: today, content })
      if (useCaptureStore.getState().captures === previous) throw new Error('保存失败')
      setValue('')
    } catch {
      setError('保存失败，内容已保留，请重试。')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-2xl border border-rhythm-border bg-rhythm-card px-3 py-1 transition-colors focus-within:border-[rgb(var(--r-glow)_/_0.4)]">
        <input
          type="text"
          name="capture"
          autoComplete="off"
          aria-label="记录此刻的想法"
          disabled={isSaving}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) void submit()
          }}
          placeholder="发生了什么,或者你正在怎么想…"
          className="min-w-0 min-h-11 flex-1 bg-transparent border-0 outline-none text-[15px] text-rhythm-text-primary placeholder-rhythm-text-muted"
        />
        <button
          type="button"
          onClick={() => void submit()}
          disabled={isSaving}
          className="r-link flex-none min-h-11 px-2 disabled:opacity-40"
        >
          {isSaving ? '保存中…' : '保存'}
        </button>
      </div>

      {error && <p role="alert" className="text-sm text-rhythm-danger">{error}</p>}

      {captures.length > 0 && (
        <div className="divide-y divide-rhythm-border">
          {captures.map((c) => (
            <div key={c.id} className="flex items-start gap-3 py-3">
              <span className="flex-none text-sm text-rhythm-text-secondary mt-3 tabular-nums">
                {formatTime(c.created_at)}
              </span>
              <p className="min-w-0 flex-1 pt-2 text-sm text-rhythm-text-secondary leading-relaxed m-0 break-words">
                {c.content}
              </p>
              <button
                type="button"
                disabled={removingId !== null}
                onClick={async () => {
                  setError(null)
                  setRemovingId(c.id)
                  try {
                    await remove(c.id)
                    if (useCaptureStore.getState().captures.some((capture) => capture.id === c.id)) setError('删除失败，请重试。')
                  } catch {
                    setError('删除失败，请重试。')
                  } finally {
                    setRemovingId(null)
                  }
                }}
                aria-label={`删除记录：${c.content}`}
                className="min-h-11 min-w-11 flex-none text-sm text-rhythm-text-secondary hover:text-rhythm-danger disabled:opacity-40"
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
