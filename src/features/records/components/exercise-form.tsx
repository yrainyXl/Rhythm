'use client'

import { useState, useEffect } from 'react'
import { useExerciseStore } from '@/features/records/store/exercise-store'

const categoryOptions = [
  { value: 'running', label: '跑步', icon: '🏃' },
  { value: 'walking', label: '散步', icon: '🚶' },
  { value: 'gym', label: '健身', icon: '🏋️' },
  { value: 'stretching', label: '拉伸', icon: '🧘' },
  { value: 'cycling', label: '骑行', icon: '🚴' },
  { value: 'yoga', label: '瑜伽', icon: '🧘‍♀️' },
  { value: 'ball', label: '球类', icon: '⚽' },
  { value: 'rehab', label: '康复', icon: '💪' },
  { value: 'other', label: '其他', icon: '📌' },
]

const setFeelings: { value: string; label: string }[] = [
  { value: 'easy', label: '轻松' },
  { value: 'slight', label: '有感觉' },
  { value: 'challenging', label: '吃力' },
  { value: 'painful', label: '疼痛' },
]

interface ExerciseFormProps {
  onBack: () => void
}

export function ExerciseForm({ onBack }: ExerciseFormProps) {
  const { templates, createTemplate, saveRecord, isSaving, loadTemplates } = useExerciseStore()
  const [showCreateTemplate, setShowCreateTemplate] = useState(false)

  // Form state
  const [exerciseDate, setExerciseDate] = useState(() => new Date().toISOString().split('T')[0])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [isRehabMode, setIsRehabMode] = useState(false)
  const [duration, setDuration] = useState('')
  const [distance, setDistance] = useState('')
  const [intensity, setIntensity] = useState<'light' | 'moderate' | 'intense' | null>(null)
  const [feeling, setFeeling] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Rehab-specific
  const [sets, setSets] = useState<
    { set_number: number; reps: string; feeling: string; is_completed: boolean }[]
  >([{ set_number: 1, reps: '', feeling: '', is_completed: true }])

  // Custom exercise fields (no template)
  const [customName, setCustomName] = useState('')
  const [customCategory, setCustomCategory] = useState('other')

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)
  const rehabTemplates = templates.filter((t) => t.is_rehab)
  const regularTemplates = templates.filter((t) => !t.is_rehab)

  const handleAddSet = () => {
    setSets((prev) => [
      ...prev,
      { set_number: prev.length + 1, reps: '', feeling: '', is_completed: true },
    ])
  }

  const handleUpdateSet = (index: number, field: string, value: string | boolean) => {
    setSets((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    )
  }

  const handleRemoveSet = (index: number) => {
    setSets((prev) =>
      prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, set_number: i + 1 }))
    )
  }

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId)
    const template = templates.find((t) => t.id === templateId)
    setIsRehabMode(template?.is_rehab ?? false)

    if (template?.is_rehab) {
      const defaultSets = template.default_sets ?? 1
      setSets(
        Array.from({ length: defaultSets }, (_, i) => ({
          set_number: i + 1,
          reps: template.default_reps?.toString() ?? '',
          feeling: '',
          is_completed: true,
        }))
      )
    }
  }

  const handleCreateTemplate = async () => {
    if (!customName.trim()) return
    const template = await createTemplate({
      name: customName,
      category: customCategory as ExerciseFormProps[''],
      is_rehab: false,
    })
    if (template) {
      setSelectedTemplateId(template.id)
      setShowCreateTemplate(false)
      setCustomName('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const effectiveTemplateId = selectedTemplateId || (customName.trim() ? null : null)

    const result = await saveRecord({
      template_id: effectiveTemplateId,
      exercise_date: exerciseDate,
      duration_minutes: duration ? Number(duration) : null,
      distance_km: distance ? Number(distance) : null,
      intensity,
      feeling,
      note: note || null,
      sets: isRehabMode
        ? sets.map((s) => ({
            set_number: s.set_number,
            reps: s.reps ? Number(s.reps) : null,
            feeling: s.feeling as SetFeeling | null,
            is_completed: s.is_completed,
          }))
        : undefined,
    })

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setTimeout(() => onBack(), 1500)
    }
  }

  if (success) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-lg r-title mb-1">已记录！</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Date */}
      <div className="r-card p-4">
        <label className="r-label">运动日期</label>
        <input
          type="date"
          value={exerciseDate}
          onChange={(e) => setExerciseDate(e.target.value)}
          className="r-input"
        />
      </div>

      {/* Template selection */}
      <div className="r-card p-4">
        <h3 className="r-title text-sm mb-3">运动类型</h3>

        <div className="space-y-2">
          {regularTemplates.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {regularTemplates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTemplateSelect(t.id)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                    selectedTemplateId === t.id
                      ? 'r-btn-primary'
                      : 'bg-rhythm-void/40 text-rhythm-text-secondary border border-rhythm-border hover:bg-rhythm-void/60'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}
          {!selectedTemplateId && !showCreateTemplate && (
            <button
              type="button"
              onClick={() => { setSelectedTemplateId(null); setShowCreateTemplate(true) }}
              className="text-xs text-rhythm-glow hover:opacity-80"
            >
              + 新运动类型
            </button>
          )}
        </div>

        {showCreateTemplate && (
          <div className="mt-3 pt-3 border-t border-rhythm-border space-y-3">
            <div>
              <label className="r-label">运动名称</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="如：晨跑、游泳..."
                className="r-input"
              />
            </div>
            <div>
              <label className="r-label">分类</label>
              <div className="grid grid-cols-5 gap-1.5">
                {categoryOptions.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCustomCategory(cat.value)}
                    className={`flex flex-col items-center gap-0.5 p-2 rounded-xl text-xs transition-colors ${
                      customCategory === cat.value
                        ? 'bg-rhythm-glow-soft text-rhythm-glow border border-rhythm-glow'
                        : 'bg-rhythm-void/40 text-rhythm-text-secondary border border-rhythm-border'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreateTemplate}
                disabled={!customName.trim()}
                className="r-btn-primary flex-1 py-2 text-xs font-medium disabled:opacity-50"
              >
                创建
              </button>
              <button
                type="button"
                onClick={() => setShowCreateTemplate(false)}
                className="r-btn-ghost px-3 py-2 text-xs"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rehab sets */}
      {isRehabMode && (
        <div className="r-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="r-title text-sm">
              训练组 (康复)
            </h3>
            <button type="button" onClick={handleAddSet} className="text-xs text-rhythm-glow hover:opacity-80">
              + 添加一组
            </button>
          </div>

          <div className="space-y-2">
            {sets.map((set, index) => (
              <div key={index} className="flex items-center gap-2 bg-rhythm-void/40 border border-rhythm-border rounded-xl p-2.5">
                <span className="text-xs text-rhythm-text-muted w-6">#{set.set_number}</span>
                <div className="flex-1">
                  <label className="block text-xs text-rhythm-text-secondary">次数</label>
                  <input
                    type="number"
                    value={set.reps}
                    onChange={(e) => handleUpdateSet(index, 'reps', e.target.value)}
                    placeholder="0"
                    className="r-input"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-rhythm-text-secondary">感受</label>
                  <select
                    value={set.feeling}
                    onChange={(e) => handleUpdateSet(index, 'feeling', e.target.value)}
                    className="r-input"
                  >
                    <option value="">选感受</option>
                    {setFeelings.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
                {sets.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSet(index)}
                    className="text-rhythm-danger hover:opacity-80 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Duration & Distance */}
      <div className="r-card p-4">
        <h3 className="r-title text-sm mb-3">运动数据</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="r-label">时长（分钟）</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="30"
              min={1}
              className="r-input"
            />
          </div>
          <div>
            <label className="r-label">距离（公里）</label>
            <input
              type="number"
              step="0.1"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="5.0"
              className="r-input"
            />
          </div>
        </div>
      </div>

      {/* Intensity */}
      <div className="r-card p-4">
        <h3 className="r-title text-sm mb-3">强度</h3>
        <div className="flex gap-3">
          {([
            { value: 'light', label: '轻度', icon: '🚶' },
            { value: 'moderate', label: '中等', icon: '🏃' },
            { value: 'intense', label: '高强度', icon: '💨' },
          ] as const).map(({ value, label, icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setIntensity(value)}
              className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border transition-colors ${
                intensity === value
                  ? 'border-rhythm-glow bg-rhythm-glow-soft'
                  : 'border-rhythm-border bg-rhythm-void/40 hover:bg-rhythm-void/60'
              }`}
            >
              <span>{icon}</span>
              <span className="text-xs text-rhythm-text-secondary">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Feeling */}
      <div className="r-card p-4">
        <h3 className="r-title text-sm mb-2">体感评分</h3>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setFeeling(v)}
              className={`w-10 h-10 rounded-full text-sm transition-colors ${
                feeling === v
                  ? 'r-btn-primary'
                  : 'bg-rhythm-void/40 text-rhythm-text-secondary border border-rhythm-border hover:bg-rhythm-void/60'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="r-card p-4">
        <h3 className="r-title text-sm mb-2">备注（可选）</h3>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="今天运动状态怎么样？"
          className="r-input"
        />
      </div>

      {error && <p className="text-sm text-rhythm-danger text-center">{error}</p>}

      <button
        type="submit"
        disabled={isSaving}
        className="r-btn-primary w-full py-2.5 text-sm font-medium disabled:opacity-50"
      >
        {isSaving ? '保存中...' : '保存运动记录'}
      </button>
    </form>
  )
}
