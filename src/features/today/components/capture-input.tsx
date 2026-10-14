'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { useCaptureStore } from '@/features/today/store/capture-store'

function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** 此刻：想到什么记一句，不用先分类。下面是今天记下的内容。 */
export function CaptureInput({ today, onRecorded }: { today: string; onRecorded: () => void }) {
  const { captures, isSaving, loadByDate, create, remove } = useCaptureStore()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

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
      onRecorded()
    } catch {
      setError('没保存上，内容还在，再试一次。')
    }
  }

  const removeCapture = async (id: string) => {
    setError(null)
    setRemovingId(id)
    try {
      await remove(id)
      if (useCaptureStore.getState().captures.some((c) => c.id === id)) setError('删除失败，请重试。')
      else onRecorded()
    } catch {
      setError('删除失败，请重试。')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <section aria-labelledby="today-moments-title">
      <h2 id="today-moments-title" className="px-5 pb-2 pt-5 text-[22px] font-bold">此刻</h2>
      <div className="mx-4 mb-2.5 flex min-h-[56px] items-center gap-2 rounded-[22px] bg-rhythm-card py-1.5 pl-4 pr-1.5 focus-within:shadow-[0_0_0_2px_rgb(var(--r-glow)/0.5)]">
        <input
          type="text"
          name="capture"
          autoComplete="off"
          aria-label="记一句"
          disabled={isSaving}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) void submit()
          }}
          placeholder="想到什么，记一句，不用分类"
          className="h-11 min-w-0 flex-1 bg-transparent text-[16px] text-rhythm-text-primary outline-none placeholder:text-rhythm-text-muted"
        />
        <button
          type="button"
          onClick={() => void submit()}
          disabled={isSaving || !value.trim()}
          aria-label={isSaving ? '保存中' : '保存这一句'}
          className="grid h-11 w-11 flex-none place-items-center rounded-full bg-rhythm-glow text-white transition-opacity disabled:opacity-30"
        >
          <ArrowUp size={20} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </div>

      {error && <p role="alert" className="px-5 pb-2 text-sm text-rhythm-danger">{error}</p>}

      {captures.map((c) => (
        <article key={c.id} className="mx-4 mb-2 rounded-[18px] bg-rhythm-card px-4 pb-2 pt-3">
          <div className="flex items-center justify-between text-[13px] text-rhythm-text-secondary">
            <time className="tabular-nums">{formatTime(c.created_at)}</time>
            <button
              type="button"
              disabled={removingId !== null}
              onClick={() => void removeCapture(c.id)}
              aria-label={`删除：${c.content}`}
              className="-mr-2 min-h-[36px] px-2 hover:text-rhythm-danger disabled:opacity-40"
            >
              {removingId === c.id ? '删除中' : '删除'}
            </button>
          </div>
          <p className="pb-1.5 text-[16px] leading-relaxed text-rhythm-text-primary break-words">{c.content}</p>
        </article>
      ))}
    </section>
  )
}
