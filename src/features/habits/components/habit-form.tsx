'use client'

import { useHabitStore } from '@/features/habits/store/habit-store'

const categoryOptions = [
  { value: 'self_discipline', label: '自律', icon: '🎯' },
  { value: 'learning', label: '学习', icon: '📚' },
  { value: 'exercise', label: '运动', icon: '🏃' },
  { value: 'sleep', label: '睡眠', icon: '😴' },
  { value: 'diet', label: '饮食', icon: '🥗' },
  { value: 'life', label: '生活', icon: '🏠' },
  { value: 'other', label: '其他', icon: '📌' },
]

const repeatTypeOptions = [
  { value: 'daily', label: '每天' },
  { value: 'weekdays', label: '工作日' },
  { value: 'weekends', label: '周末' },
  { value: 'weekly', label: '每周指定几天' },
]

const targetTypeOptions = [
  { value: 'boolean', label: '是否完成' },
  { value: 'duration', label: '时长', unit: '分钟' },
  { value: 'count', label: '次数', unit: '次' },
  { value: 'value', label: '数量', unit: '自定义单位' },
]

const dayLabels = ['一', '二', '三', '四', '五', '六', '日']

interface HabitFormProps {
  onClose: () => void
  editHabitId?: string | null
}

export function HabitForm({ onClose, editHabitId }: HabitFormProps) {
  const { formData, updateFormField, createHabit, updateHabit, isSaving, errorMessage, resetForm } = useHabitStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    let success: boolean
    if (editHabitId) {
      success = await updateHabit(editHabitId)
    } else {
      success = await createHabit()
    }

    if (success) {
      resetForm()
      onClose()
    }
  }

  const handleDayToggle = (dayIndex: number) => {
    const currentDays = formData.schedule_repeat_days
    const newDays = currentDays.includes(dayIndex)
      ? currentDays.filter((d) => d !== dayIndex)
      : [...currentDays, dayIndex].sort()
    updateFormField('schedule_repeat_days', newDays)
  }

  const currentCategory = categoryOptions.find((c) => c.value === formData.category)
  const currentTargetType = targetTypeOptions.find((t) => t.value === formData.target_type)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="r-card w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-rhythm-surface border-b border-rhythm-border px-4 py-3 flex items-center justify-between">
          <h3 className="r-title">
            {editHabitId ? '编辑习惯' : '新建习惯'}
          </h3>
          <button
            type="button"
            onClick={() => { resetForm(); onClose() }}
            className="text-rhythm-text-muted hover:text-rhythm-text-secondary text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-5">
          {/* Name */}
          <div>
            <label className="r-label">名称</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateFormField('name', e.target.value)}
              placeholder="如：冥想、晨跑、阅读..."
              maxLength={50}
              required
              className="r-input"
            />
          </div>

          {/* Category */}
          <div>
            <label className="r-label">分类</label>
            <div className="grid grid-cols-4 gap-2">
              {categoryOptions.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => updateFormField('category', cat.value as typeof formData.category)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs transition-colors ${
                    formData.category === cat.value
                      ? 'border-rhythm-glow bg-rhythm-glow-soft text-rhythm-glow'
                      : 'border-rhythm-border text-rhythm-text-secondary hover:border-rhythm-glow'
                  }`}
                >
                  <span className="text-lg">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Target Type */}
          <div>
            <label className="r-label">目标类型</label>
            <div className="grid grid-cols-2 gap-2">
              {targetTypeOptions.map((tt) => (
                <button
                  key={tt.value}
                  type="button"
                  onClick={() => updateFormField('target_type', tt.value as typeof formData.target_type)}
                  className={`px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                    formData.target_type === tt.value
                      ? 'border-rhythm-glow bg-rhythm-glow-soft text-rhythm-glow'
                      : 'border-rhythm-border text-rhythm-text-secondary hover:border-rhythm-glow'
                  }`}
                >
                  {tt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Target Value (only for non-boolean) */}
          {formData.target_type !== 'boolean' && (
            <div className="flex gap-3 items-start">
              <div className="flex-1">
                <label className="r-label">
                  目标值
                </label>
                <input
                  type="number"
                  value={formData.target_value ?? ''}
                  onChange={(e) => updateFormField('target_value', e.target.value ? Number(e.target.value) : null)}
                  placeholder={`输入${
                    currentTargetType?.unit === '自定义单位' ? '' : currentTargetType?.unit ?? ''
                  }`}
                  min={1}
                  className="r-input"
                />
              </div>
              <div className="flex-1">
                <label className="r-label">单位</label>
                <input
                  type="text"
                  value={formData.target_unit}
                  onChange={(e) => updateFormField('target_unit', e.target.value)}
                  placeholder={'分钟、页、次...'}
                  className="r-input"
                />
              </div>
            </div>
          )}

          {/* Repeat Type */}
          <div>
            <label className="r-label">重复</label>
            <div className="grid grid-cols-2 gap-2">
              {repeatTypeOptions.map((rt) => (
                <button
                  key={rt.value}
                  type="button"
                  onClick={() => updateFormField('schedule_repeat_type', rt.value as typeof formData.schedule_repeat_type)}
                  className={`px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                    formData.schedule_repeat_type === rt.value
                      ? 'border-rhythm-glow bg-rhythm-glow-soft text-rhythm-glow'
                      : 'border-rhythm-border text-rhythm-text-secondary hover:border-rhythm-glow'
                  }`}
                >
                  {rt.label}
                </button>
              ))}
            </div>

            {formData.schedule_repeat_type === 'weekly' && (
              <div className="flex gap-2 mt-2">
                {dayLabels.map((label, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleDayToggle(i + 1)}
                    className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                      formData.schedule_repeat_days.includes(i + 1)
                        ? 'r-btn-primary'
                        : 'bg-rhythm-void/40 text-rhythm-text-secondary border border-rhythm-border hover:bg-rhythm-void/60'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reminder */}
          <div>
            <label className="r-label">提醒时间（可选）</label>
            <input
              type="time"
              value={formData.schedule_reminder_time}
              onChange={(e) => updateFormField('schedule_reminder_time', e.target.value)}
              className="r-input"
            />
          </div>

          {/* Important toggle */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_important}
                onChange={(e) => updateFormField('is_important', e.target.checked)}
                className="w-4 h-4 text-rhythm-glow rounded border-rhythm-border focus:ring-rhythm-glow"
              />
              <span className="text-sm text-rhythm-text-secondary">标记为重要</span>
            </label>
          </div>

          {/* Error */}
          {errorMessage && (
            <p className="text-sm text-rhythm-danger">{errorMessage}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSaving || !formData.name.trim()}
            className="r-btn-primary w-full py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? '保存中...' : editHabitId ? '保存修改' : '创建习惯'}
          </button>
        </form>
      </div>
    </div>
  )
}
