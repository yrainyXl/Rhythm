'use client'

import { useState } from 'react'
import { Check, Plus, SkipForward } from 'lucide-react'
import type { HabitOccurrence } from '@/features/habits/store/habit-store'

interface HabitItemProps {
  occurrence: HabitOccurrence
  onComplete: (id: string) => void
  onCompleteWithDetail: (id: string) => void
  onSkip: (id: string) => void
  onReset: (id: string) => void
}

export function HabitItem({ occurrence, onComplete, onCompleteWithDetail, onSkip, onReset }: HabitItemProps) {
  const [showDetail, setShowDetail] = useState(false)
  const targetLabel = occurrence.target_type_snapshot === 'boolean'
    ? ''
    : `${occurrence.target_value_snapshot ?? ''}${occurrence.target_unit_snapshot ? ' ' + occurrence.target_unit_snapshot : ''}`

  const statusConfig = {
    pending: { text: 'text-rhythm-text-primary', badge: null, dim: false },
    done: { text: 'text-rhythm-text-secondary line-through', badge: '已完成', dim: true },
    skipped: { text: 'text-rhythm-text-muted line-through', badge: '已跳过', dim: true },
    missed: { text: 'text-rhythm-text-muted line-through', badge: '已过期', dim: true },
  }

  const config = statusConfig[occurrence.status]

  return (
    <div className={`r-card p-4 transition-all ${config.dim ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`font-medium text-sm truncate ${config.text}`}>
              {occurrence.title_snapshot}
            </p>
            {config.badge && (
              <span className="text-[0.68rem] text-rhythm-text-muted shrink-0">{config.badge}</span>
            )}
          </div>
          {targetLabel && occurrence.status === 'pending' && (
            <p className="text-xs text-rhythm-text-muted mt-1">{targetLabel}</p>
          )}
        </div>

        <div className="flex items-center gap-2 ml-3 shrink-0">
          {occurrence.status === 'pending' && (
            <>
              <button
                type="button"
                onClick={() => onComplete(occurrence.id)}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all text-rhythm-glow border border-rhythm-border-strong hover:border-rhythm-glow"
                style={{ background: 'rgba(143, 180, 220, 0.12)' }}
                title="完成"
              >
                <Check size={16} strokeWidth={2.2} />
              </button>
              <button
                type="button"
                onClick={() => setShowDetail(!showDetail)}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors text-rhythm-text-muted border border-rhythm-border hover:text-rhythm-text-secondary hover:border-rhythm-border-strong"
                title="记录详情"
              >
                <Plus size={16} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => onSkip(occurrence.id)}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors text-rhythm-text-faint border border-rhythm-border hover:text-rhythm-text-muted"
                title="跳过"
              >
                <SkipForward size={15} strokeWidth={1.8} />
              </button>
            </>
          )}
          {(occurrence.status === 'done' || occurrence.status === 'skipped') && (
            <button
              type="button"
              onClick={() => onReset(occurrence.id)}
              className="text-xs text-rhythm-text-muted hover:text-rhythm-text-secondary transition-colors"
              title="重置"
            >
              撤销
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function HabitDetailForm({
  occurrence,
  onSubmit,
  onCancel,
}: {
  occurrence: HabitOccurrence
  onSubmit: (id: string, actualValue?: number, actualDuration?: number, feeling?: number, note?: string) => void
  onCancel: () => void
}) {
  const [actualValue, setActualValue] = useState(occurrence.target_value_snapshot ?? undefined)
  const [actualDuration, setActualDuration] = useState<number | undefined>(undefined)
  const [feeling, setFeeling] = useState<number | undefined>(undefined)
  const [note, setNote] = useState('')

  return (
    <div className="mt-2.5 r-card p-4 space-y-3.5">
      {(occurrence.target_type_snapshot === 'value' || occurrence.target_type_snapshot === 'count') && (
        <div>
          <label className="r-label">
            实际值 {occurrence.target_unit_snapshot ? `(${occurrence.target_unit_snapshot})` : ''}
          </label>
          <input
            type="number"
            value={actualValue ?? ''}
            onChange={(e) => setActualValue(e.target.value ? Number(e.target.value) : undefined)}
            className="r-input"
          />
        </div>
      )}

      {occurrence.target_type_snapshot === 'duration' && (
        <div>
          <label className="r-label">实际时长（分钟）</label>
          <input
            type="number"
            value={actualDuration ?? ''}
            onChange={(e) => setActualDuration(e.target.value ? Number(e.target.value) : undefined)}
            className="r-input"
          />
        </div>
      )}

      <div>
        <label className="r-label">感受</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setFeeling(v)}
              className={`w-9 h-9 rounded-full text-sm transition-all border ${
                feeling === v
                  ? 'text-rhythm-glow border-rhythm-glow'
                  : 'text-rhythm-text-muted border-rhythm-border hover:border-rhythm-border-strong'
              }`}
              style={feeling === v ? { background: 'rgba(143, 180, 220, 0.12)' } : undefined}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="r-label">备注</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="记录一下感受或情况…"
          className="r-input"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => onSubmit(occurrence.id, actualValue, actualDuration, feeling, note)}
          className="r-btn-primary flex-1"
        >
          确认完成
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="r-btn-ghost"
        >
          取消
        </button>
      </div>
    </div>
  )
}
