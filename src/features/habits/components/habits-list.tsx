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
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">我的习惯</h2>
        <button
          type="button"
          onClick={() => { resetForm(); setEditId(null); setShowForm(true) }}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + 新建习惯
        </button>
      </div>

      {isLoading && habits.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">加载中...</div>
      ) : habits.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-500 text-sm">还没有创建任何习惯</p>
          <p className="text-gray-400 text-xs mt-1">点击「新建习惯」开始建立你的节奏</p>
        </div>
      ) : (
        Object.entries(groupedHabits).map(([category, catHabits]) => {
          const catInfo = categoryLabels[category] ?? { label: category, icon: '📌' }
          const enabledHabits = catHabits.filter((h) => h.is_enabled)
          const disabledHabits = catHabits.filter((h) => !h.is_enabled)
          if (enabledHabits.length === 0 && disabledHabits.length === 0) return null

          return (
            <div key={category}>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                <span>{catInfo.icon}</span>
                <span>{catInfo.label}</span>
              </h3>
              <div className="space-y-2">
                {enabledHabits.map((habit) => (
                  <div
                    key={habit.id}
                    className="bg-white rounded-xl border p-3.5 flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{habit.icon ?? '○'}</span>
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {habit.name}
                        </p>
                        {habit.is_important && (
                          <span className="text-xs text-orange-500">★ 重要</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
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
                        className="px-2.5 py-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(habit.id)}
                        className="px-2.5 py-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
                      >
                        停用
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Disabled habits */}
              {disabledHabits.length > 0 && (
                <details className="mt-1">
                  <summary className="text-xs text-gray-400 cursor-pointer py-1">
                    已停用的习惯 ({disabledHabits.length})
                  </summary>
                  <div className="space-y-1 mt-1">
                    {disabledHabits.map((habit) => (
                      <div key={habit.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-400 line-through">{habit.name}</span>
                        <button
                          type="button"
                          onClick={() => toggleHabitEnabled(habit.id, true)}
                          className="text-xs text-blue-500 hover:text-blue-700"
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-5 max-w-xs w-full">
            <h3 className="font-bold text-gray-900 mb-2">停用习惯</h3>
            <p className="text-sm text-gray-500 mb-4">
              停用后不会再生成新的待办，但历史记录会保留。
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-2 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600"
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
