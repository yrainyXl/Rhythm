'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient, getCurrentUser } from '@/lib/supabase/client'

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
      const supabase = createBrowserClient()
      const user = await getCurrentUser(supabase)
      if (!user) return

      // Calculate date ranges
      const weekStartDate = new Date(weekStart + 'T00:00')
      const weekEndDate = new Date(weekStartDate)
      weekEndDate.setDate(weekEndDate.getDate() + 7)
      const weekEnd = weekEndDate.toISOString().split('T')[0]

      const prevWeekStart = new Date(weekStartDate)
      prevWeekStart.setDate(prevWeekStart.getDate() - 7)
      const prevWeekStartStr = prevWeekStart.toISOString().split('T')[0]
      const prevWeekEndStr = weekStart

      // All seven queries are independent -> fire them together instead of
      // waiting for each one sequentially.
      const base = (table: string) =>
        supabase.from(table).select('*').eq('user_id', user.id)

      const [
        occurrencesRes,
        prevOccurrencesRes,
        sleepRecordsRes,
        exerciseRecordsRes,
        prevExerciseRes,
        readingSessionsRes,
        reflectionsRes,
      ] = await Promise.all([
        base('habit_occurrences').gte('local_date', weekStart).lt('local_date', weekEnd),
        base('habit_occurrences').gte('local_date', prevWeekStartStr).lt('local_date', prevWeekEndStr),
        base('sleep_records').gte('sleep_date', weekStart).lt('sleep_date', weekEnd),
        base('exercise_records').gte('exercise_date', weekStart).lt('exercise_date', weekEnd),
        base('exercise_records').gte('exercise_date', prevWeekStartStr).lt('exercise_date', prevWeekEndStr),
        base('reading_sessions').gte('read_date', weekStart).lt('read_date', weekEnd),
        base('daily_reflections').gte('local_date', weekStart).lt('local_date', weekEnd),
      ])

      const occurrences = occurrencesRes.data ?? []
      const prevOccurrences = prevOccurrencesRes.data ?? []
      const sleepRecords = sleepRecordsRes.data ?? []
      const exerciseRecords = exerciseRecordsRes.data ?? []
      const prevExercise = prevExerciseRes.data ?? []
      const readingSessions = readingSessionsRes.data ?? []
      const reflections = reflectionsRes.data ?? []

      // Calculate metrics
      const occs = occurrences ?? []
      const total = occs.length
      const done = occs.filter((o) => o.status === 'done').length
      const skipped = occs.filter((o) => o.status === 'skipped').length
      const completionRate = total > 0 ? Math.round((done / total) * 100) : 0

      // Best habit
      const habitCounts: Record<string, { done: number; total: number }> = {}
      occs.forEach((o) => {
        if (!habitCounts[o.title_snapshot]) {
          habitCounts[o.title_snapshot] = { done: 0, total: 0 }
        }
        habitCounts[o.title_snapshot].total++
        if (o.status === 'done') habitCounts[o.title_snapshot].done++
      })

      const bestHabit = Object.entries(habitCounts)
        .sort(([, a], [, b]) => b.done - a.done)
        .filter(([, v]) => v.total > 1)[0]?.[0] ?? null

      const skipHabit = Object.entries(habitCounts)
        .sort(([, a], [, b]) => (a.total - a.done) - (b.total - b.done))
        .filter(([, v]) => v.total > 1)
        .reverse()[0]?.[0] ?? null

      // Sleep
      const sleeps = sleepRecords ?? []
      const sleepDuration = sleeps.filter((s) => s.duration_minutes != null).length > 0
        ? Math.round(sleeps.filter((s) => s.duration_minutes != null).reduce((sum, s) => sum + s.duration_minutes!, 0) / sleeps.filter((s) => s.duration_minutes != null).length)
        : 0
      const sleepQuality = sleeps.filter((s) => s.quality != null).length > 0
        ? Math.round(sleeps.filter((s) => s.quality != null).reduce((sum, s) => sum + (s.quality === 'great' ? 3 : s.quality === 'fair' ? 2 : 1), 0) / sleeps.filter((s) => s.quality != null).length * 10) / 10
        : 0

      // Exercise
      const exercises = exerciseRecords ?? []
      const prevExercises = prevExercise ?? []
      const totalExerciseDuration = exercises.reduce((sum, r) => sum + (r.duration_minutes ?? 0), 0)

      // Reading
      const readings = readingSessions ?? []
      const totalReadingDuration = readings.reduce((sum, r) => sum + r.duration_minutes, 0)

      // Mood
      const refls = reflections ?? []
      const moodScore = refls.filter((r) => r.mood != null).length > 0
        ? Math.round(refls.filter((r) => r.mood != null).reduce((sum, r) => sum + (r.mood === 'great' ? 3 : r.mood === 'fair' ? 2 : 1), 0) / refls.filter((r) => r.mood != null).length * 10) / 10
        : 0

      // Previous week
      const prevTotal = (prevOccurrences ?? []).length
      const prevDone = (prevOccurrences ?? []).filter((o) => o.status === 'done').length
      const prevRate = prevTotal > 0 ? Math.round((prevDone / prevTotal) * 100) : 0

      // Generate summary
      let summary = ''
      if (total === 0 && exercises.length === 0 && sleeps.length === 0) {
        summary = '本周还没有记录数据。从创建一个习惯或记录一次睡眠开始吧。'
      } else {
        const parts: string[] = []
        if (completionRate > 0) {
          parts.push(`习惯完成率 ${completionRate}%`)
        }
        if (exercises.length > 0) {
          parts.push(`运动 ${exercises.length} 次，共 ${totalExerciseDuration} 分钟`)
        }
        if (sleepDuration > 0) {
          parts.push(`平均睡眠 ${Math.floor(sleepDuration / 60)} 小时 ${sleepDuration % 60} 分钟`)
        }
        if (bestHabit) {
          parts.push(`完成最多的是「${bestHabit}」`)
        }
        if (skipHabit && habitCounts[skipHabit]?.done === 0) {
          parts.push(`「${skipHabit}」本周尚未完成，可能需要调整目标`)
        }
        summary = parts.join('；') + '。'
      }

      setWeeklyData({
        habitCompletionRate: completionRate,
        bestHabit,
        skipHabit,
        avgSleepDuration: sleepDuration,
        avgSleepQuality: sleepQuality,
        exerciseCount: exercises.length,
        exerciseDuration: totalExerciseDuration,
        readingDuration: totalReadingDuration,
        moodScore,
        weeklySummary: summary,
        lastWeekComparison: {
          habitRate: prevRate,
          exerciseCount: prevExercises.length,
        },
      })

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
