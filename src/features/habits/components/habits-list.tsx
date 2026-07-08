'use client'

import { useState, useEffect } from 'react'
import { useHabitStore } from '@/features/habits/store/habit-store'
import { HabitForm } from '@/features/habits/components/habit-form'

const categoryLabels: Record<string, { label: string; icon: string }> = {
  self_discipline: { label: '自律', icon: '🎯' },
  learning: { label: '学习', icon: '📚' },
  exercise: { label: '运动', icon: '🏃' },
  sleep: { label: '睡眠', icon: '😴' },
  diet: { label: '饮食', icon: '🥗' },
  life: { label: '生活', icon: '🏠' },
  other: { label: '其他', icon: '📌' },
}

export default function HabitsPageClient() {
  const { habits, isLoading, loadHabits, deleteHabit, toggleHabitEnabled, setFormFromHabit, resetForm } = useHabitStore()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    loadHabits()
  }, [loadHabits])

  const handleEdit = (habit: typeof habits[0]) => {
    setFormFromHabit(habit)
    setEditId(habit.id)
    setShowForm(true)
  }

  const handleClose = () => {
    setShowForm(false)
    setEditId(null)
    resetForm()
  }

  const handleDelete = async (id: string) => {
    await deleteHabit(id)
    setConfirmDelete(null)
  }

  const groupedHabits = habits.reduce(
    (acc, h) => {
      const cat = h.category
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(h)
      return acc
    },
    {} as Record<string, typeof habits>
  )

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between pt-2">
        <h2 className="r-title text-lg">我的习惯</h2>
        <button
          type="button"
          onClick={() => { resetForm(); setEditId(null); setShowForm(true) }}
          className="r-btn-primary"
        >
          + 新建习惯
        </button>
      </div>

      {isLoading && habits.length === 0 ? (
        <div className="text-center py-16 text-rhythm-text-muted text-sm">加载中…</div>
      ) : habits.length === 0 ? (
        <div className="r-card p-10 text-center">
          <p className="r-title text-base text-rhythm-text-secondary">还没有创建任何习惯</p>
          <p className="text-rhythm-text-muted text-xs mt-2">点击「新建习惯」开始建立你的节奏</p>
        </div>
      ) : (
        Object.entries(groupedHabits).map(([category, catHabits]) => {
          const catInfo = categoryLabels[category] ?? { label: category, icon: '·' }
          const enabledHabits = catHabits.filter((h) => h.is_enabled)
          const disabledHabits = catHabits.filter((h) => !h.is_enabled)
          if (enabledHabits.length === 0 && disabledHabits.length === 0) return null

          return (
            <div key={category}>
              <h3 className="r-eyebrow mb-3">
                {catInfo.label}
              </h3>
              <div className="space-y-2.5">
                {enabledHabits.map((habit) => (
                  <div
                    key={habit.id}
                    className="r-card p-4 flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-rhythm-text-primary truncate">
                          {habit.name}
                        </p>
                        {habit.is_important && (
                          <span className="text-[0.68rem] text-rhythm-warn shrink-0">★ 重要</span>
                        )}
                      </div>
                      <p className="text-xs text-rhythm-text-muted mt-1">
                        {habit.target_type === 'boolean'
                          ? '完成/未完成'
                          : `${habit.target_value ?? ''} ${habit.target_unit ?? ''}`}
                        {' · '}
                        {habit.schedules?.[0]?.repeat_type === 'daily'
                          ? '每天'
                          : habit.schedules?.[0]?.repeat_type === 'weekdays'
                            ? '工作日'
                            : habit.schedules?.[0]?.repeat_type === 'weekends'
                              ? '周末'
                              : '每周'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 ml-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEdit(habit)}
                        className="px-2.5 py-1 text-xs text-rhythm-text-secondary hover:text-rhythm-glow transition-colors"
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(habit.id)}
                        className="px-2.5 py-1 text-xs text-rhythm-text-muted hover:text-rhythm-danger transition-colors"
                      >
                        停用
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Disabled habits */}
              {disabledHabits.length > 0 && (
                <details className="mt-2">
                  <summary className="text-xs text-rhythm-text-muted cursor-pointer py-1">
                    已停用的习惯 ({disabledHabits.length})
                  </summary>
                  <div className="space-y-1.5 mt-2">
                    {disabledHabits.map((habit) => (
                      <div key={habit.id} className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-rhythm-border bg-rhythm-void/40">
                        <span className="text-sm text-rhythm-text-muted line-through">{habit.name}</span>
                        <button
                          type="button"
                          onClick={() => toggleHabitEnabled(habit.id, true)}
                          className="text-xs text-rhythm-glow hover:text-rhythm-text-primary transition-colors"
                        >
                          启用
                        </button>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )
        })
      )}

      {/* Confirmation dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="r-card p-5 max-w-xs w-full">
            <h3 className="r-title text-base mb-2">停用习惯</h3>
            <p className="text-sm text-rhythm-text-secondary mb-5 leading-relaxed">
              停用后不会再生成新的待办，但历史记录会保留。
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="r-btn-ghost flex-1"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDelete)}
                className="r-btn flex-1 text-rhythm-danger"
                style={{ border: '1px solid rgba(220, 140, 140, 0.35)', background: 'rgba(220, 140, 140, 0.1)' }}
              >
                确认停用
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form modal */}
      {showForm && <HabitForm onClose={handleClose} editHabitId={editId} />}
    </div>
  )
}
