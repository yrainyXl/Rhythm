'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePracticeStore } from '@/features/practice/store/practice-store'
import { Dropdown } from '@/features/practice/components/dropdown'

const PERIOD_PRESETS = [
  { label: '7 天', value: 7 },
  { label: '14 天', value: 14 },
  { label: '21 天', value: 21 },
] as const

export function PracticeFormSheet({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { topics, loadTopics, createPractice } = usePracticeStore()
  const [title, setTitle] = useState('')
  const [assumption, setAssumption] = useState('')
  const [topicId, setTopicId] = useState<string>('')
  const [periodDays, setPeriodDays] = useState<number>(7)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const topicOptions = useMemo(
    () => [{ value: '', label: '不关联' }, ...topics.map((t) => ({ value: t.id, label: t.question }))],
    [topics],
  )

  useEffect(() => {
    if (open) {
      setTitle('')
      setAssumption('')
      setTopicId('')
      setPeriodDays(7)
      setError(null)
      loadTopics()
    }
  }, [open, loadTopics])

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
    const result = await createPractice({
      title,
      topicId: topicId || null,
      assumption,
      periodDays,
    })
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
        className="w-full sm:max-w-md p-5 rounded-t-2xl sm:rounded-2xl bg-rhythm-card border-t sm:border border-rhythm-border-strong max-h-[85vh] overflow-y-auto"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serifsc text-base font-medium text-rhythm-text-primary m-0">发起新实践</h3>
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
            <label className="text-xs text-rhythm-text-secondary tracking-tight block mb-1.5">实践名称</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如:找回工作日晚上的主动权"
              autoFocus
              className="w-full bg-rhythm-void/40 border border-rhythm-border rounded-xl px-3 py-2.5 text-sm text-rhythm-text-primary placeholder-rhythm-text-muted focus:outline-none focus:border-rhythm-border-strong"
            />
          </div>

          <div>
            <label className="text-xs text-rhythm-text-secondary tracking-tight block mb-1.5">
              关联议题 <span className="text-rhythm-text-muted">(可选)</span>
            </label>
            {topics.length === 0 ? (
              <p className="text-xs text-rhythm-text-muted py-2">还没有议题,可以先去「计划 → 议题」创建</p>
            ) : (
              <Dropdown
                value={topicId}
                onChange={setTopicId}
                options={topicOptions}
                placeholder="选择议题"
              />
            )}
          </div>

          <div>
            <label className="text-xs text-rhythm-text-secondary tracking-tight block mb-1.5">
              本轮假设 <span className="text-rhythm-text-muted">(可选)</span>
            </label>
            <textarea
              value={assumption}
              onChange={(e) => setAssumption(e.target.value)}
              placeholder="例如:确定一件事 + 约定娱乐结束时间,看开始率是否提高"
              rows={3}
              className="w-full bg-rhythm-void/40 border border-rhythm-border rounded-xl px-3 py-2.5 text-sm text-rhythm-text-primary placeholder-rhythm-text-muted resize-none focus:outline-none focus:border-rhythm-border-strong"
            />
          </div>

          <div>
            <label className="text-xs text-rhythm-text-secondary tracking-tight block mb-1.5">本轮周期</label>
            <div className="flex gap-2">
              {PERIOD_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPeriodDays(p.value)}
                  className={`flex-1 py-2 rounded-xl text-sm border cursor-pointer transition-colors ${
                    periodDays === p.value
                      ? 'bg-rhythm-glow-soft border-rhythm-border-strong text-rhythm-glow'
                      : 'bg-transparent border-rhythm-border text-rhythm-text-muted hover:text-rhythm-text-secondary'
                  }`}>
                  {p.label}
                </button>
              ))}
            </div>
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
            disabled={saving || !title.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm bg-rhythm-glow-soft border border-rhythm-border-strong text-rhythm-glow cursor-pointer disabled:opacity-50">
            {saving ? '保存中...' : '发起实践'}
          </button>
        </div>
      </div>
    </div>
  )
}
