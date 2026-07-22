'use client'

import { useEffect, useState } from 'react'
import { usePracticeStore } from '@/features/practice/store/practice-store'

export function DirectionFormSheet({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { createDirection } = usePracticeStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setTitle('')
      setDescription('')
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
    setError(null)
    setSaving(true)
    const result = await createDirection(title, description || null)
    setSaving(false)
    if (result.error) {
      setError(result.error)
      return
    }
    onClose()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-rhythm-void/70 backdrop-blur-sm"
      onClick={onClose}>
      <div
        className="w-full sm:max-w-md p-5 rounded-t-2xl sm:rounded-2xl bg-rhythm-card border-t sm:border border-rhythm-border-strong"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serifsc text-base font-medium text-rhythm-text-primary m-0">新建长期方向</h3>
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

        <p className="text-xs text-rhythm-text-muted mb-2 tracking-tight">
          描述你想逐渐成为怎样、生活想往哪里走。
        </p>

        <div className="space-y-3">
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：成为一个能从容应对压力的人"
            rows={2}
            autoFocus
            className="w-full bg-rhythm-void/40 border border-rhythm-border rounded-xl px-3 py-2.5 text-sm text-rhythm-text-primary placeholder-rhythm-text-muted resize-none focus:outline-none focus:border-rhythm-border-strong"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="补充描述：为什么这个方向对你重要？希望达成什么状态？（可选）"
            rows={3}
            className="w-full bg-rhythm-void/40 border border-rhythm-border rounded-xl px-3 py-2.5 text-sm text-rhythm-text-primary placeholder-rhythm-text-muted resize-none focus:outline-none focus:border-rhythm-border-strong"
          />
        </div>

        {error && (
          <p className="text-xs text-rhythm-danger mt-2">{error}</p>
        )}

        <div className="flex gap-2 mt-4">
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
            disabled={saving || !title.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm bg-rhythm-glow-soft border border-rhythm-border-strong text-rhythm-glow cursor-pointer disabled:opacity-50">
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}