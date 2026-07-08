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
    updateKeyResultProgress, setActiveGoal } = useGoalStore()
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
            <div className="r-card p-8 text-center">
              <p className="text-4xl mb-3">🎯</p>
              <p className="text-rhythm-text-secondary text-sm">还没有设定目标</p>
              <p className="text-rhythm-text-muted text-xs mt-1">把想法变成一个可执行的目标</p>
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
                className="r-card r-card-hover w-full p-4 text-left"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span>{cat?.icon ?? '🎯'}</span>
                  <p className="r-title text-sm">{goal.title}</p>
                </div>
                {goal.description && (
                  <p className="text-xs text-rhythm-text-secondary ml-7">{goal.description}</p>
                )}
                {goal.target_date && (
                  <p className="text-xs text-rhythm-text-muted ml-7 mt-1">
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
              className="w-full py-3 border-2 border-dashed border-rhythm-border text-sm text-rhythm-text-muted rounded-xl hover:border-rhythm-border-strong hover:text-rhythm-text-secondary transition-colors"
            >
              + 设定新目标
            </button>
          )}

          {showCreate && (
            <div className="r-card p-4 space-y-3">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="目标名称*"
                className="r-input"
              />
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="描述（为什么想实现这个目标）"
                rows={2}
                className="r-input resize-none"
              />
              <div>
                <p className="r-label">分类</p>
                <div className="flex flex-wrap gap-2">
                  {categoryOptions.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setNewCategory(cat.value)}
                      className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                        newCategory === cat.value
                          ? 'bg-rhythm-glow-soft text-rhythm-glow border border-rhythm-glow'
                          : 'bg-rhythm-void/40 border border-rhythm-border text-rhythm-text-muted'
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
                className="r-input"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!newTitle.trim()}
                  className="r-btn-primary flex-1 py-2 text-sm disabled:opacity-50"
                >
                  创建目标
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="r-btn-ghost px-4 py-2 text-sm"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {/* Completed / Abandoned */}
          {completedGoals.length > 0 && (
            <details>
              <summary className="r-eyebrow cursor-pointer py-1">
                已完成 ({completedGoals.length})
              </summary>
              {completedGoals.map((g) => (
                <div key={g.id} className="text-xs text-rhythm-text-muted py-1">{g.title}</div>
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
            className="text-sm text-rhythm-text-secondary hover:text-rhythm-text-primary inline-block"
          >
            ← 所有目标
          </button>

          <div className="r-card p-4 bg-rhythm-glow-soft">
            <p className="r-title text-lg">{activeGoal.title}</p>
            {activeGoal.description && (
              <p className="text-sm text-rhythm-text-secondary mt-1">{activeGoal.description}</p>
            )}
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => updateGoalStatus(activeGoal.id, 'completed')}
                className="px-3 py-1 bg-rhythm-success-soft text-rhythm-success rounded-lg text-xs hover:opacity-80 transition-opacity"
              >
                完成 ✓
              </button>
              <button
                type="button"
                onClick={() => updateGoalStatus(activeGoal.id, 'abandoned')}
                className="px-3 py-1 bg-rhythm-void/40 border border-rhythm-border text-rhythm-text-muted rounded-lg text-xs hover:text-rhythm-text-secondary transition-colors"
              >
                放弃
              </button>
            </div>
          </div>

          {/* Key Results */}
          <div className="r-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="r-title text-sm">关键结果</h3>
              <button
                type="button"
                onClick={() => setShowKrInput(!showKrInput)}
                className="text-xs text-rhythm-glow hover:text-rhythm-text-primary"
              >
                + 添加
              </button>
            </div>

            {keyResults.length === 0 && (
              <p className="text-xs text-rhythm-text-muted">还没有关键结果。一个目标最好有 2-3 个可衡量的关键结果。</p>
            )}

            {keyResults.map((kr) => {
              const pct = kr.target_value ? Math.round((kr.current_value / kr.target_value) * 100) : 0
              return (
                <div key={kr.id} className="mb-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-rhythm-text-primary">{kr.title}</span>
                    <span className="text-xs text-rhythm-text-muted">
                      {kr.current_value}{kr.unit}/{kr.target_value}{kr.unit}
                    </span>
                  </div>
                  <div className="w-full bg-rhythm-void/40 border border-rhythm-border rounded-full h-1.5 mt-1">
                    <div
                      className="bg-rhythm-glow rounded-full h-1.5 transition-all"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  {kr.status !== 'completed' && (
                    <div className="flex gap-1 mt-1">
                      <button
                        type="button"
                        onClick={() => updateKeyResultProgress(kr.id, (kr.current_value || 0) + 1)}
                        className="text-xs text-rhythm-glow hover:text-rhythm-text-primary"
                      >
                        +1
                      </button>
                    </div>
                  )}
                </div>
              )
            })}

            {showKrInput && (
              <div className="mt-3 pt-3 border-t border-rhythm-border space-y-2">
                <input
                  type="text"
                  value={newKrTitle}
                  onChange={(e) => setNewKrTitle(e.target.value)}
                  placeholder="关键结果"
                  className="r-input"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={newKrTarget}
                    onChange={(e) => setNewKrTarget(e.target.value)}
                    placeholder="目标值"
                    className="r-input"
                  />
                  <input
                    type="text"
                    value={newKrUnit}
                    onChange={(e) => setNewKrUnit(e.target.value)}
                    placeholder="单位（次/页/本）"
                    className="r-input"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddKr}
                  className="r-btn-primary w-full py-1.5 text-xs"
                >
                  添加
                </button>
              </div>
            )}
          </div>

          {/* Milestones */}
          <div className="r-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="r-title text-sm">里程碑</h3>
              <button
                type="button"
                onClick={() => setShowMilestoneInput(!showMilestoneInput)}
                className="text-xs text-rhythm-glow hover:text-rhythm-text-primary"
              >
                + 添加
              </button>
            </div>

            {milestones.length === 0 && (
              <p className="text-xs text-rhythm-text-muted">还没有里程碑。里程碑是路上的小步骤。</p>
            )}

            <div className="space-y-2">
              {milestones.map((ms) => (
                <div
                  key={ms.id}
                  className={`flex items-center gap-3 p-2 rounded-xl border border-rhythm-border ${
                    ms.is_completed ? 'bg-rhythm-success-soft' : 'bg-rhythm-void/40'
                  }`}
                >
                  {ms.is_completed ? (
                    <span className="text-rhythm-success">✓</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => completeMilestone(ms.id)}
                      className="w-5 h-5 rounded-full border-2 border-rhythm-border hover:border-rhythm-glow transition-colors"
                    />
                  )}
                  <span className={`text-sm ${ms.is_completed ? 'text-rhythm-text-muted line-through' : 'text-rhythm-text-primary'}`}>
                    {ms.title}
                  </span>
                </div>
              ))}
            </div>

            {showMilestoneInput && (
              <div className="mt-3 pt-3 border-t border-rhythm-border space-y-2">
                <input
                  type="text"
                  value={newMsTitle}
                  onChange={(e) => setNewMsTitle(e.target.value)}
                  placeholder="里程碑"
                  className="r-input"
                />
                <button
                  type="button"
                  onClick={handleAddMs}
                  className="r-btn-primary w-full py-1.5 text-xs"
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
