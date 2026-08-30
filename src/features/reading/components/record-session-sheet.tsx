'use client'

import { useEffect, useState } from 'react'
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const handleSubmit = async () => {
    const minutes = Number.parseInt(duration, 10)
    if (!Number.isFinite(minutes) || minutes <= 0) {
      setError('时长必须大于 0 分钟')
      return
    }
    setError(null)
    setSaving(true)
    const result = await recordSession({
      book_id: bookId,
      duration_minutes: minutes,
      pages_read: pages ? Number.parseInt(pages, 10) : undefined,
      note: note.trim() || undefined,
    })
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
      onClick={onClose}>
      <div
        className="w-full sm:max-w-md p-5 rounded-t-2xl sm:rounded-2xl bg-rhythm-card border-t sm:border border-rhythm-border-strong max-h-[85vh] overflow-y-auto"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serifsc text-base font-medium text-rhythm-text-primary m-0">记录阅读</h3>
          <button
            type="button"
            aria-label="关闭"
            onClick={onClose}
            className="w-8 h-8 grid place-items-center rounded-full bg-transparent border-0 cursor-pointer text-rhythm-text-muted hover:text-rhythm-text-primary transition-colors">
            <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ stroke: 'currentColor', strokeWidth: 1.8, fill: 'none' }}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-rhythm-text-secondary tracking-tight block mb-1.5">
              阅读时长 <span className="text-rhythm-danger">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="30"
                autoFocus
                className="w-full bg-rhythm-void/40 border border-rhythm-border rounded-xl px-3 py-2.5 text-sm text-rhythm-text-primary placeholder-rhythm-text-muted focus:outline-none focus:border-rhythm-border-strong"
              />
              <span className="text-xs text-rhythm-text-muted flex-none">分钟</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-rhythm-text-secondary tracking-tight block mb-1.5">
              阅读页数 <span className="text-rhythm-text-muted">(可选)</span>
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={pages}
              onChange={(e) => setPages(e.target.value)}
              placeholder="例如:45"
              className="w-full bg-rhythm-void/40 border border-rhythm-border rounded-xl px-3 py-2.5 text-sm text-rhythm-text-primary placeholder-rhythm-text-muted focus:outline-none focus:border-rhythm-border-strong"
            />
          </div>

          <div>
            <label className="text-xs text-rhythm-text-secondary tracking-tight block mb-1.5">
              备注 <span className="text-rhythm-text-muted">(可选)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例如:读完第三章,开始第四章"
              rows={3}
              className="w-full bg-rhythm-void/40 border border-rhythm-border rounded-xl px-3 py-2.5 text-sm text-rhythm-text-primary placeholder-rhythm-text-muted resize-none focus:outline-none focus:border-rhythm-border-strong"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-rhythm-danger mt-3">{error}</p>
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
            className="flex-1 py-2.5 rounded-xl text-sm bg-rhythm-glow-soft border border-rhythm-border-strong text-rhythm-glow cursor-pointer disabled:opacity-50">
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
