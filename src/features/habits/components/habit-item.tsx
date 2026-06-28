'use client'

import { useState } from 'react'
import type { Database } from '@/lib/supabase/database.types'

type HabitOccurrence = Database['public']['Tables']['habit_occurrences']['Row']

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
    pending: { bg: 'white', border: 'border-gray-200', text: 'text-gray-900', badge: null },
    done: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-gray-600 line-through', badge: '✅ 已完成' },
    skipped: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-400 line-through', badge: '⏭ 已跳过' },
    missed: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-gray-600 line-through', badge: '⏰ 已过期' },
  }

  const config = statusConfig[occurrence.status]

  return (
    <div className={`rounded-xl border ${config.bg} ${config.border} p-4 transition-all`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`font-medium text-sm truncate ${config.text}`}>
              {occurrence.title_snapshot}
            </p>
            {config.badge && (
              <span className="text-xs text-gray-400 shrink-0">{config.badge}</span>
            )}
          </div>
          {targetLabel && occurrence.status === 'pending' && (
            <p className="text-xs text-gray-400 mt-0.5">{targetLabel}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 ml-3 shrink-0">
          {occurrence.status === 'pending' && (
            <>
              <button
                type="button"
                onClick={() => onComplete(occurrence.id)}
                className="w-8 h-8 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700 transition-colors flex items-center justify-center"
                title="完成"
              >
                ✓
              </button>
              <button
                type="button"
                onClick={() => setShowDetail(!showDetail)}
                className="w-8 h-8 bg-gray-100 text-gray-500 rounded-full text-sm hover:bg-gray-200 transition-colors flex items-center justify-center"
                title="记录详情"
              >
                +
              </button>
            </>
          )}
          {occurrence.status === 'pending' && (
            <button
              type="button"
              onClick={() => onSkip(occurrence.id)}
              className="w-8 h-8 bg-gray-100 text-gray-400 rounded-full text-sm hover:bg-gray-200 transition-colors flex items-center justify-center"
              title="跳过"
            >
              ⏭
            </button>
          )}
          {(occurrence.status === 'done' || occurrence.status === 'skipped') && (
            <button
              type="button"
              onClick={() => onReset(occurrence.id)}
              className="text-xs text-gray-400 hover:text-gray-600"
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
    <div className="mt-3 pt-3 border-t space-y-3">
      {(occurrence.target_type_snapshot === 'value' || occurrence.target_type_snapshot === 'count') && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            实际值 {occurrence.target_unit_snapshot ? `(${occurrence.target_unit_snapshot})` : ''}
          </label>
          <input
            type="number"
            value={actualValue ?? ''}
            onChange={(e) => setActualValue(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {occurrence.target_type_snapshot === 'duration' && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">实际时长（分钟）</label>
          <input
            type="number"
            value={actualDuration ?? ''}
            onChange={(e) => setActualDuration(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      <div>
        <label className="block text-xs text-gray-500 mb-1">感受</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setFeeling(v)}
              className={`w-8 h-8 rounded-full text-sm transition-colors ${
                feeling === v
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">备注</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="记录一下感受或情况..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSubmit(occurrence.id, actualValue, actualDuration, feeling, note)}
          className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          确认完成
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          取消
        </button>
      </div>
    </div>
  )
}
