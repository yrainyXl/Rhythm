'use client'

import { useEffect, useRef, useState } from 'react'
import { useReadingStore } from '@/features/records/store/reading-store'

export function RecordSessionSheet({
  open,
  bookId,
  onClose,
  onRecorded,
}: {
  open: boolean
  bookId: string
  onClose: () => void
  onRecorded?: () => void
}) {
  const { recordSession } = useReadingStore()
  const [duration, setDuration] = useState('')
  const [pages, setPages] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const savingRef = useRef(false)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  savingRef.current = saving

  useEffect(() => {
    if (open) {
      setDuration('')
      setPages('')
      setNote('')
      setError(null)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.querySelector<HTMLInputElement>('input')?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !savingRef.current) closeRef.current()
      if (event.key !== 'Tab') return
      const nodes = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, textarea, [tabindex="0"]') ?? [])
      const first = nodes[0], last = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; previous?.focus() }
  }, [open])

  const handleSubmit = async () => {
    if (savingRef.current) return
    const minutes = Number.parseInt(duration, 10)
    if (!Number.isFinite(minutes) || minutes <= 0) {
      setError('时长必须大于 0 分钟')
      return
    }
    setError(null)
    savingRef.current = true
    setSaving(true)
    const result = await recordSession({
      book_id: bookId,
      duration_minutes: minutes,
      pages_read: pages ? Number.parseInt(pages, 10) : undefined,
      note: note.trim() || undefined,
    })
    savingRef.current = false
    setSaving(false)
    if (result.error) {
      setError(result.error)
      return
    }
    onRecorded?.()
    onClose()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-rhythm-void/70 backdrop-blur-sm"
      onClick={() => { if (!saving) onClose() }}>
      <div
        ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="session-title"
        className="w-full sm:max-w-md p-5 rounded-t-2xl sm:rounded-2xl bg-rhythm-card border-t sm:border border-rhythm-border-strong max-h-[85vh] overflow-y-auto"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 id="session-title" className="text-xl font-semibold text-rhythm-text-primary m-0">记录阅读</h3>
          <button
            type="button"
            aria-label="关闭"
            onClick={onClose}
            disabled={saving}
            className="w-11 h-11 grid place-items-center rounded-full bg-transparent border-0 cursor-pointer text-rhythm-text-muted hover:text-rhythm-text-primary transition-colors">
            <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ stroke: 'currentColor', strokeWidth: 1.8, fill: 'none' }}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="session-duration" className="text-sm text-rhythm-text-secondary block mb-1.5">
              阅读时长 <span className="text-rhythm-danger">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                id="session-duration" name="duration" autoComplete="off"
                type="number"
                inputMode="numeric"
                min={1}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="30"
                className="w-full bg-rhythm-void/40 border border-rhythm-border rounded-xl px-3 py-2.5 text-sm text-rhythm-text-primary placeholder-rhythm-text-muted focus:outline-none focus:border-rhythm-border-strong"
              />
              <span className="text-xs text-rhythm-text-muted flex-none">分钟</span>
            </div>
          </div>

          <div>
            <label htmlFor="session-pages" className="text-sm text-rhythm-text-secondary block mb-1.5">
              阅读页数 <span className="text-rhythm-text-muted">(可选)</span>
            </label>
            <input
              type="number"
              inputMode="numeric"
              id="session-pages" name="pages" autoComplete="off"
              min={0}
              value={pages}
              onChange={(e) => setPages(e.target.value)}
              placeholder="例如:45"
              className="w-full bg-rhythm-void/40 border border-rhythm-border rounded-xl px-3 py-2.5 text-sm text-rhythm-text-primary placeholder-rhythm-text-muted focus:outline-none focus:border-rhythm-border-strong"
            />
          </div>

          <div>
            <label htmlFor="session-note" className="text-sm text-rhythm-text-secondary block mb-1.5">
              备注 <span className="text-rhythm-text-muted">(可选)</span>
            </label>
            <textarea id="session-note" name="note" autoComplete="off"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例如:读完第三章,开始第四章"
              rows={3}
              className="w-full bg-rhythm-void/40 border border-rhythm-border rounded-xl px-3 py-2.5 text-sm text-rhythm-text-primary placeholder-rhythm-text-muted resize-none focus:outline-none focus:border-rhythm-border-strong"
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-rhythm-danger mt-3">{error}</p>
        )}

        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm bg-transparent border border-rhythm-border text-rhythm-text-secondary cursor-pointer disabled:opacity-50">
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !duration.trim()}
            className="r-btn-primary flex-1">
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
