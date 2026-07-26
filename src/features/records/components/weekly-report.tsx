'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/cloudbase/api-client'

interface WeeklyData {
  habitCompletionRate: number
  bestHabit: string | null
  skipHabit: string | null
  avgSleepDuration: number
  avgSleepQuality: number
  exerciseCount: number
  exerciseDuration: number
  readingDuration: number
  moodScore: number
  weeklySummary: string
  lastWeekComparison: {
    habitRate: number
    exerciseCount: number
  }
}

export function WeeklyReport() {
  const [weeklyData, setWeeklyData] = useState<WeeklyData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - d.getDay() + 1)
    return d.toISOString().split('T')[0]
  })

  useEffect(() => {
    const loadReport = async () => {
      setIsLoading(true)
      try {
        const data = await apiFetch<WeeklyData>(
          `/api/records/weekly-report?week_start=${weekStart}`,
        )
        setWeeklyData(data)
      } catch {
        setWeeklyData(null)
      }
      setIsLoading(false)
    }

    loadReport()
  }, [weekStart])

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="w-6 h-6 border-2 border-rhythm-glow border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-rhythm-text-muted mt-2">生成周报...</p>
      </div>
    )
  }

  if (!weeklyData) {
    return <div className="text-center py-12 text-rhythm-text-muted text-sm">暂无数据</div>
  }

  const weekEnd = new Date(weekStart + 'T00:00')
  weekEnd.setDate(weekEnd.getDate() + 6)
  const weekLabel = `${weekStart.slice(5)}-${weekEnd.toISOString().split('T')[0].slice(5)}`

  return (
    <div className="space-y-4">
      {/* Week header */}
      <div className="r-card p-4 bg-rhythm-glow-soft">
        <p className="text-sm text-rhythm-text-secondary">{weekLabel} 周报</p>
        <p className="text-sm mt-1 text-rhythm-text-primary">{weeklyData.weeklySummary}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="r-card p-3 text-center">
          <p className="text-xs text-rhythm-text-muted">完成率</p>
          <p className="text-lg r-title">{weeklyData.habitCompletionRate}%</p>
        </div>
        <div className="r-card p-3 text-center">
          <p className="text-xs text-rhythm-text-muted">运动</p>
          <p className="text-lg r-title">{weeklyData.exerciseCount}次</p>
        </div>
        <div className="r-card p-3 text-center">
          <p className="text-xs text-rhythm-text-muted">心情</p>
          <p className="text-lg r-title">
            {weeklyData.moodScore > 0 ? `${weeklyData.moodScore}/3` : '--'}
          </p>
        </div>
      </div>

      {/* Sleep */}
      <div className="r-card p-4">
        <h3 className="r-title text-sm mb-2">睡眠</h3>
        <p className="text-sm text-rhythm-text-secondary">
          平均 {Math.floor(weeklyData.avgSleepDuration / 60)}h{weeklyData.avgSleepDuration % 60}m
          {weeklyData.avgSleepQuality > 0 && ` · 质量 ${weeklyData.avgSleepQuality}/3`}
        </p>
      </div>

      {/* Exercise & Reading */}
      <div className="grid grid-cols-2 gap-3">
        <div className="r-card p-4">
          <h3 className="r-title text-sm mb-1">运动</h3>
          <p className="text-sm text-rhythm-text-secondary">{weeklyData.exerciseCount} 次</p>
          <p className="text-xs text-rhythm-text-muted">{weeklyData.exerciseDuration} 分钟</p>
          <p className="text-xs text-rhythm-text-muted mt-1">
            上周 {weeklyData.lastWeekComparison.exerciseCount} 次
          </p>
        </div>
        <div className="r-card p-4">
          <h3 className="r-title text-sm mb-1">阅读</h3>
          <p className="text-sm text-rhythm-text-secondary">
            {weeklyData.readingDuration > 60
              ? `${Math.floor(weeklyData.readingDuration / 60)}h${weeklyData.readingDuration % 60}m`
              : `${weeklyData.readingDuration} 分钟`}
          </p>
        </div>
      </div>

      {/* Best & Skip habits */}
      <div className="r-card p-4">
        <h3 className="r-title text-sm mb-2">习惯</h3>
        <div className="space-y-1 text-sm">
          {weeklyData.bestHabit && (
            <p className="text-rhythm-success">✅ 完成最多：{weeklyData.bestHabit}</p>
          )}
          {weeklyData.skipHabit && (
            <p className="text-rhythm-warn">⏭ 容易跳过：{weeklyData.skipHabit}</p>
          )}
          {weeklyData.lastWeekComparison.habitRate > 0 && (
            <p className="text-rhythm-text-secondary text-xs mt-1">
              上周完成率 {weeklyData.lastWeekComparison.habitRate}%
              {weeklyData.habitCompletionRate >= weeklyData.lastWeekComparison.habitRate
                ? ' ↑ 有进步'
                : ' ↓ 比上周低，看看是不是目标太大了'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
