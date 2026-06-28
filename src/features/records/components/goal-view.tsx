'use client'

import { useState, useEffect } from 'react'
import { useGoalStore } from '@/features/records/store/goal-store'

const categoryOptions = [
  { value: 'personal_growth', label: '个人成长', icon: '🌱' },
  { value: 'health', label: '健康', icon: '💪' },
  { value: 'career', label: '事业', icon: '💼' },
  { value: 'learning', label: '学习', icon: '📚' },
  { value: 'reading', label: '阅读', icon: '📖' },
  { value: 'fitness', label: '健身', icon: '🏋️' },
]

export function GoalView() {
  const { goals, loadGoals, createGoal, updateGoalStatus, activeGoal, loadGoalDetail,
    keyResults, milestones, addKeyResult, addMilestone, completeMilestone,
    updateKeyResultProgress } = useGoalStore()
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newCategory, setNewCategory] = useState('personal_growth')
  const [newTargetDate, setNewTargetDate] = useState('')
  const [showKrInput, setShowKrInput] = useState(false)
  const [newKrTitle, setNewKrTitle] = useState('')
  const [newKrTarget, setNewKrTarget] = useState('')
  const [newKrUnit, setNewKrUnit] = useState('')
  const [showMilestoneInput, setShowMilestoneInput] = useState(false)
  const [newMsTitle, setNewMsTitle] = useState('')

  useEffect(() => {
    loadGoals()
  }, [loadGoals])

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    const goal = await createGoal({
      title: newTitle,
      description: newDesc || undefined,
      category: newCategory,
      target_date: newTargetDate || undefined,
    })
    if (goal) {
      setNewTitle('')
      setNewDesc('')
      setNewTargetDate('')
      setShowCreate(false)
    }
  }

  const handleAddKr = async () => {
    if (!activeGoal || !newKrTitle.trim()) return
    await addKeyResult(activeGoal.id, {
      title: newKrTitle,
      target_value: newKrTarget ? Number(newKrTarget) : undefined,
      unit: newKrUnit || undefined,
    })
    setNewKrTitle('')
    setNewKrTarget('')
    setNewKrUnit('')
    setShowKrInput(false)
  }

  const handleAddMs = async () => {
    if (!activeGoal || !newMsTitle.trim()) return
    await addMilestone(activeGoal.id, { title: newMsTitle })
    setNewMsTitle('')
    setShowMilestoneInput(false)
  }

  const activeGoals = goals.filter((g) => g.status === 'active')
  const completedGoals = goals.filter((g) => g.status === 'completed')
  const abandonedGoals = goals.filter((g) => g.status === 'abandoned')

  return (
    <div className="space-y-4">
      {/* Goal list */}
      {!activeGoal && (
        <>
          {activeGoals.length === 0 && !showCreate && (
            <div className="bg-white rounded-xl border p-8 text-center">
              <p className="text-4xl mb-3">🎯</p>
              <p className="text-gray-500 text-sm">还没有设定目标</p>
              <p className="text-gray-400 text-xs mt-1">把想法变成一个可执行的目标</p>
            </div>
          )}

          {/* Active goals */}
          {activeGoals.map((goal) => {
            const cat = categoryOptions.find((c) => c.value === goal.category)
            return (
              <button
                key={goal.id}
                type="button"
                onClick={() => loadGoalDetail(goal.id)}
                className="w-full bg-white rounded-xl border p-4 text-left hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span>{cat?.icon ?? '🎯'}</span>
                  <p className="font-bold text-gray-900 text-sm">{goal.title}</p>
                </div>
                {goal.description && (
                  <p className="text-xs text-gray-500 ml-7">{goal.description}</p>
                )}
                {goal.target_date && (
                  <p className="text-xs text-gray-400 ml-7 mt-1">
                    目标日期：{goal.target_date}
                  </p>
                )}
              </button>
            )
          })}

          {/* Create new goal */}
          {!showCreate && activeGoals.length < 5 && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="w-full py-3 bg-white border-2 border-dashed border-gray-200 text-sm text-gray-400 rounded-xl hover:border-gray-300 hover:text-gray-500 transition-colors"
            >
              + 设定新目标
            </button>
          )}

          {showCreate && (
            <div className="bg-white rounded-xl border p-4 space-y-3">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="目标名称*"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="描述（为什么想实现这个目标）"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div>
                <p className="text-xs text-gray-500 mb-1">分类</p>
                <div className="flex flex-wrap gap-2">
                  {categoryOptions.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setNewCategory(cat.value)}
                      className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                        newCategory === cat.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="date"
                value={newTargetDate}
                onChange={(e) => setNewTargetDate(e.target.value)}
                placeholder="目标截止日期（可选）"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!newTitle.trim()}
                  className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  创建目标
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {/* Completed / Abandoned */}
          {completedGoals.length > 0 && (
            <details>
              <summary className="text-xs text-gray-400 cursor-pointer py-1">
                已完成 ({completedGoals.length})
              </summary>
              {completedGoals.map((g) => (
                <div key={g.id} className="text-xs text-gray-400 py-1">{g.title}</div>
              ))}
            </details>
          )}
        </>
      )}

      {/* Goal detail */}
      {activeGoal && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => { loadGoals(); setActiveGoal(null) }}
            className="text-sm text-gray-500 hover:text-gray-700 inline-block"
          >
            ← 所有目标
          </button>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
            <p className="font-bold text-lg">{activeGoal.title}</p>
            {activeGoal.description && (
              <p className="text-sm text-white/80 mt-1">{activeGoal.description}</p>
            )}
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => updateGoalStatus(activeGoal.id, 'completed')}
                className="px-3 py-1 bg-white/20 rounded-lg text-xs hover:bg-white/30 transition-colors"
              >
                完成 ✓
              </button>
              <button
                type="button"
                onClick={() => updateGoalStatus(activeGoal.id, 'abandoned')}
                className="px-3 py-1 bg-white/10 rounded-lg text-xs hover:bg-white/20 transition-colors"
              >
                放弃
              </button>
            </div>
          </div>

          {/* Key Results */}
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 text-sm">关键结果</h3>
              <button
                type="button"
                onClick={() => setShowKrInput(!showKrInput)}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                + 添加
              </button>
            </div>

            {keyResults.length === 0 && (
              <p className="text-xs text-gray-400">还没有关键结果。一个目标最好有 2-3 个可衡量的关键结果。</p>
            )}

            {keyResults.map((kr) => {
              const pct = kr.target_value ? Math.round((kr.current_value / kr.target_value) * 100) : 0
              return (
                <div key={kr.id} className="mb-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-900">{kr.title}</span>
                    <span className="text-xs text-gray-400">
                      {kr.current_value}{kr.unit}/{kr.target_value}{kr.unit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-blue-500 rounded-full h-1.5 transition-all"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  {kr.status === 'active' && (
                    <div className="flex gap-1 mt-1">
                      <button
                        type="button"
                        onClick={() => updateKeyResultProgress(kr.id, (kr.current_value || 0) + 1)}
                        className="text-xs text-blue-500 hover:text-blue-700"
                      >
                        +1
                      </button>
                    </div>
                  )}
                </div>
              )
            })}

            {showKrInput && (
              <div className="mt-3 pt-3 border-t space-y-2">
                <input
                  type="text"
                  value={newKrTitle}
                  onChange={(e) => setNewKrTitle(e.target.value)}
                  placeholder="关键结果"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={newKrTarget}
                    onChange={(e) => setNewKrTarget(e.target.value)}
                    placeholder="目标值"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={newKrUnit}
                    onChange={(e) => setNewKrUnit(e.target.value)}
                    placeholder="单位（次/页/本）"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddKr}
                  className="w-full py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  添加
                </button>
              </div>
            )}
          </div>

          {/* Milestones */}
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 text-sm">里程碑</h3>
              <button
                type="button"
                onClick={() => setShowMilestoneInput(!showMilestoneInput)}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                + 添加
              </button>
            </div>

            {milestones.length === 0 && (
              <p className="text-xs text-gray-400">还没有里程碑。里程碑是路上的小步骤。</p>
            )}

            <div className="space-y-2">
              {milestones.map((ms) => (
                <div
                  key={ms.id}
                  className={`flex items-center gap-3 p-2 rounded-lg ${
                    ms.is_completed ? 'bg-green-50' : 'bg-gray-50'
                  }`}
                >
                  {ms.is_completed ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => completeMilestone(ms.id)}
                      className="w-5 h-5 rounded-full border-2 border-gray-300 hover:border-blue-500 transition-colors"
                    />
                  )}
                  <span className={`text-sm ${ms.is_completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {ms.title}
                  </span>
                </div>
              ))}
            </div>

            {showMilestoneInput && (
              <div className="mt-3 pt-3 border-t space-y-2">
                <input
                  type="text"
                  value={newMsTitle}
                  onChange={(e) => setNewMsTitle(e.target.value)}
                  placeholder="里程碑"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddMs}
                  className="w-full py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  添加
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
