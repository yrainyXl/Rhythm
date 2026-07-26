import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'

/**
 * GET /api/records/weekly-report?week_start=YYYY-MM-DD
 * 聚合本周(week_start ~ +7天)与前一周的 habit_occurrences/sleep_records/
 * exercise_records/reading_sessions/daily_reflections,返回周报数据。
 */
export async function GET(request: NextRequest) {
  return withUser(request, async (userId, db) => {
    const weekStart = new URL(request.url).searchParams.get('week_start')
    if (!weekStart) {
      return NextResponse.json({ error: 'week_start 必填' }, { status: 400 })
    }

    const weekStartDate = new Date(weekStart + 'T00:00')
    const weekEndDate = new Date(weekStartDate)
    weekEndDate.setDate(weekEndDate.getDate() + 7)
    const weekEnd = weekEndDate.toISOString().split('T')[0]

    const prevWeekStart = new Date(weekStartDate)
    prevWeekStart.setDate(prevWeekStart.getDate() - 7)
    const prevWeekStartStr = prevWeekStart.toISOString().split('T')[0]
    const prevWeekEndStr = weekStart

    const [occRes, prevOccRes, sleepRes, exRes, prevExRes, readRes, reflRes] = await Promise.all([
      db.query(
        `SELECT * FROM public.habit_occurrences WHERE user_id=$1 AND local_date>=$2 AND local_date<$3`,
        [userId, weekStart, weekEnd],
      ),
      db.query(
        `SELECT * FROM public.habit_occurrences WHERE user_id=$1 AND local_date>=$2 AND local_date<$3`,
        [userId, prevWeekStartStr, prevWeekEndStr],
      ),
      db.query(
        `SELECT * FROM public.sleep_records WHERE user_id=$1 AND sleep_date>=$2 AND sleep_date<$3`,
        [userId, weekStart, weekEnd],
      ),
      db.query(
        `SELECT * FROM public.exercise_records WHERE user_id=$1 AND exercise_date>=$2 AND exercise_date<$3`,
        [userId, weekStart, weekEnd],
      ),
      db.query(
        `SELECT * FROM public.exercise_records WHERE user_id=$1 AND exercise_date>=$2 AND exercise_date<$3`,
        [userId, prevWeekStartStr, prevWeekEndStr],
      ),
      db.query(
        `SELECT * FROM public.reading_sessions WHERE user_id=$1 AND read_date>=$2 AND read_date<$3`,
        [userId, weekStart, weekEnd],
      ),
      db.query(
        `SELECT * FROM public.daily_reflections WHERE user_id=$1 AND local_date>=$2 AND local_date<$3`,
        [userId, weekStart, weekEnd],
      ),
    ])

    const occs = occRes.rows as { status: string; title_snapshot: string }[]
    const prevOccs = prevOccRes.rows as { status: string }[]
    const sleeps = sleepRes.rows as { duration_minutes: number | null; quality: string | null }[]
    const exercises = exRes.rows as { duration_minutes: number | null }[]
    const prevExercises = prevExRes.rows as unknown[]
    const readings = readRes.rows as { duration_minutes: number }[]
    const refls = reflRes.rows as { mood: string | null }[]

    const total = occs.length
    const done = occs.filter((o) => o.status === 'done').length
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0

    const habitCounts: Record<string, { done: number; total: number }> = {}
    occs.forEach((o) => {
      if (!habitCounts[o.title_snapshot]) habitCounts[o.title_snapshot] = { done: 0, total: 0 }
      habitCounts[o.title_snapshot].total++
      if (o.status === 'done') habitCounts[o.title_snapshot].done++
    })

    const bestHabit = Object.entries(habitCounts)
      .sort(([, a], [, b]) => b.done - a.done)
      .filter(([, v]) => v.total > 1 && v.done > 0)[0]?.[0] ?? null
    const skipHabit = Object.entries(habitCounts)
      .sort(([, a], [, b]) => a.total - a.done - (b.total - b.done))
      .filter(([, v]) => v.total > 1)
      .reverse()[0]?.[0] ?? null

    const sleepsDur = sleeps.filter((s) => s.duration_minutes != null) as { duration_minutes: number }[]
    const sleepDuration = sleepsDur.length > 0
      ? Math.round(sleepsDur.reduce((sum, s) => sum + s.duration_minutes, 0) / sleepsDur.length)
      : 0
    const sleepsQ = sleeps.filter((s) => s.quality != null) as { quality: string }[]
    const sleepQuality = sleepsQ.length > 0
      ? Math.round(
          (sleepsQ.reduce((sum, s) => sum + (s.quality === 'great' ? 3 : s.quality === 'fair' ? 2 : 1), 0) / sleepsQ.length) * 10,
        ) / 10
      : 0

    const totalExerciseDuration = exercises.reduce((sum, r) => sum + (r.duration_minutes ?? 0), 0)
    const totalReadingDuration = readings.reduce((sum, r) => sum + r.duration_minutes, 0)

    const moodRefls = refls.filter((r) => r.mood != null) as { mood: string }[]
    const moodScore = moodRefls.length > 0
      ? Math.round(
          (moodRefls.reduce((sum, r) => sum + (r.mood === 'great' ? 3 : r.mood === 'fair' ? 2 : 1), 0) / moodRefls.length) * 10,
        ) / 10
      : 0

    const prevTotal = prevOccs.length
    const prevDone = prevOccs.filter((o) => o.status === 'done').length
    const prevRate = prevTotal > 0 ? Math.round((prevDone / prevTotal) * 100) : 0

    let summary = ''
    if (total === 0 && exercises.length === 0 && sleeps.length === 0) {
      summary = '本周还没有记录数据。从创建一个习惯或记录一次睡眠开始吧。'
    } else {
      const parts: string[] = []
      if (completionRate > 0) parts.push(`习惯完成率 ${completionRate}%`)
      if (exercises.length > 0) parts.push(`运动 ${exercises.length} 次，共 ${totalExerciseDuration} 分钟`)
      if (sleepDuration > 0) parts.push(`平均睡眠 ${Math.floor(sleepDuration / 60)} 小时 ${sleepDuration % 60} 分钟`)
      if (bestHabit) parts.push(`完成最多的是「${bestHabit}」`)
      if (skipHabit && habitCounts[skipHabit]?.done === 0) parts.push(`「${skipHabit}」本周尚未完成，可能需要调整目标`)
      summary = parts.join('；') + '。'
    }

    return NextResponse.json({
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
      lastWeekComparison: { habitRate: prevRate, exerciseCount: prevExercises.length },
    })
  })
}
