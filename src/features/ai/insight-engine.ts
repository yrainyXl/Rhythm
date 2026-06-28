/**
 * AI 接口抽象层
 *
 * 使用方式：
 * 1. 所有 AI 调用通过此模块代理
 * 2. 支持本地规则模式（默认）和 LLM 模式（需配置 API key）
 * 3. 切换模式无需修改业务代码
 */

// ============================================
// Types
// ============================================

export interface AIProviderConfig {
  mode: 'local' | 'llm'
  apiKey?: string
  apiEndpoint?: string
  model?: string
}

export interface PatternInput {
  sleepRecords?: {
    date: string
    duration: number
    quality: string
    preSleepActivities: string[]
  }[]
  exerciseRecords?: {
    date: string
    duration: number
    category: string
    feeling: number | null
  }[]
  habitOccurrences?: {
    date: string
    name: string
    status: string
  }[]
  reflections?: {
    date: string
    mood: string | null
    bestThing: string | null
  }[]
}

export interface PatternInsight {
  type: string
  title: string
  content: string
  dataSource: string
  confidence: 'high' | 'medium' | 'low'
}

export interface WeeklySummaryInput {
  habitRate: number
  exerciseCount: number
  avgSleepDuration: number
  avgSleepQuality: number
  bestHabit: string | null
  skipHabit: string | null
  moodScore: number
  readingDuration: number
}

export interface GoalSuggestion {
  title: string
  description: string
  keyResults: { title: string; targetValue: number; unit: string }[]
}

// ============================================
// Local rule engine (runs without any API)
// ============================================

function detectSleepPatterns(input: PatternInput): PatternInsight[] {
  const insights: PatternInsight[] = []

  if (!input.sleepRecords || input.sleepRecords.length < 3) return insights

  const records = input.sleepRecords

  // Check if phone usage affects sleep
  const withPhone = records.filter((r) =>
    r.preSleepActivities?.some((a) => a.includes('手机') || a.includes('视频') || a.includes('游戏'))
  )
  const withoutPhone = records.filter((r) =>
    !r.preSleepActivities?.some((a) => a.includes('手机') || a.includes('视频') || a.includes('游戏'))
  )

  if (withPhone.length >= 2 && withoutPhone.length >= 2) {
    const withAvg = withPhone.reduce((s, r) => s + r.duration, 0) / withPhone.length
    const withoutAvg = withoutPhone.reduce((s, r) => s + r.duration, 0) / withoutPhone.length

    if (withoutAvg > withAvg + 10) {
      insights.push({
        type: 'sleep_duration',
        title: '睡前不玩手机睡眠更长',
        content: `睡前不玩手机的日子平均睡眠多 ${Math.round(withoutAvg - withAvg)} 分钟`,
        dataSource: 'sleep_records',
        confidence: 'medium',
      })
    }
  }

  // Exercise and sleep quality correlation
  if (input.exerciseRecords && input.sleepRecords) {
    const exerciseDays = new Set(
      input.exerciseRecords.map((r) => r.date)
    )

    const postExerciseSleep = records.filter((r) => exerciseDays.has(r.date))
    const noExerciseSleep = records.filter((r) => !exerciseDays.has(r.date))

    if (postExerciseSleep.length >= 2 && noExerciseSleep.length >= 2) {
      const postAvgDuration = postExerciseSleep.reduce((s, r) => s + r.duration, 0) / postExerciseSleep.length
      const noAvgDuration = noExerciseSleep.reduce((s, r) => s + r.duration, 0) / noExerciseSleep.length
      const postAvgQuality = postExerciseSleep.filter((r) => r.quality === 'great').length / postExerciseSleep.length
      const noAvgQuality = noExerciseSleep.filter((r) => r.quality === 'great').length / noExerciseSleep.length

      if (postAvgDuration > noAvgDuration || postAvgQuality > noAvgQuality) {
        insights.push({
          type: 'exercise_sleep',
          title: '运动让你睡得更香',
          content: `有运动的日子平均睡眠时长多 ${Math.round(postAvgDuration - noAvgDuration)} 分钟`,
          dataSource: 'sleep_records + exercise_records',
          confidence: 'low',
        })
      }
    }
  }

  return insights
}

function detectHabitPatterns(input: PatternInput): PatternInsight[] {
  const insights: PatternInsight[] = []

  if (!input.habitOccurrences || input.habitOccurrences.length < 7) return insights

  const occurrences = input.habitOccurrences

  // Find habits that are consistently skipped
  const habitStats: Record<string, { total: number; done: number; skipped: number }> = {}
  occurrences.forEach((o) => {
    if (!habitStats[o.name]) {
      habitStats[o.name] = { total: 0, done: 0, skipped: 0 }
    }
    habitStats[o.name].total++
    if (o.status === 'done') habitStats[o.name].done++
    if (o.status === 'skipped') habitStats[o.name].skipped++
  })

  Object.entries(habitStats).forEach(([name, stats]) => {
    if (stats.total >= 5 && stats.done === 0) {
      insights.push({
        type: 'habit_stuck',
        title: `「${name}」一直没有开始`,
        content: `连续 ${stats.total} 天都跳过了「${name}」，是不是目标太大了？试试降低到容易完成的量。`,
        dataSource: 'habit_occurrences',
        confidence: 'high',
      })
    }

    if (stats.total >= 5 && stats.done / stats.total > 0.8) {
      insights.push({
        type: 'habit_steady',
        title: `「${name}」保持得不错`,
        content: `完成率 ${Math.round((stats.done / stats.total) * 100)}%，已经形成了稳定的节奏。`,
        dataSource: 'habit_occurrences',
        confidence: 'high',
      })
    }
  })

  // Check week day patterns
  const weekdayCount: Record<string, { total: number; done: number }> = {
    '周一': { total: 0, done: 0 },
    '周二': { total: 0, done: 0 },
    '周三': { total: 0, done: 0 },
    '周四': { total: 0, done: 0 },
    '周五': { total: 0, done: 0 },
    '周六': { total: 0, done: 0 },
    '周日': { total: 0, done: 0 },
  }

  occurrences.forEach((o) => {
    const d = new Date(o.date + 'T00:00')
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const dayName = dayNames[d.getDay()]
    if (weekdayCount[dayName]) {
      weekdayCount[dayName].total++
      if (o.status === 'done') weekdayCount[dayName].done++
    }
  })

  Object.entries(weekdayCount).forEach(([day, stats]) => {
    if (stats.total >= 3 && stats.done / stats.total < 0.3) {
      insights.push({
        type: 'weekday_pattern',
        title: `周${day}容易松懈`,
        content: `周${day}的习惯完成率只有 ${Math.round((stats.done / stats.total) * 100)}%，这个时间点可能需要调整提醒或降低目标。`,
        dataSource: 'habit_occurrences',
        confidence: 'medium',
      })
    }
  })

  return insights
}

function generateLocalSummary(input: WeeklySummaryInput): string {
  const parts: string[] = []

  if (input.habitRate > 0) {
    if (input.habitRate >= 80) {
      parts.push('本周习惯完成率不错')
    } else if (input.habitRate >= 50) {
      parts.push('本周习惯完成率还有提升空间')
    } else {
      parts.push('本周习惯完成率偏低，看看是不是目标定得太多或太大')
    }
  }

  if (input.exerciseCount > 0) {
    parts.push(`运动 ${input.exerciseCount} 次`)
  } else {
    parts.push('本周还没有运动记录')
  }

  if (input.avgSleepDuration > 0) {
    const hours = Math.floor(input.avgSleepDuration / 60)
    const mins = input.avgSleepDuration % 60
    if (hours >= 7) {
      parts.push(`平均睡眠 ${hours}h${mins}m，达到了推荐标准`)
    } else {
      parts.push(`平均睡眠 ${hours}h${mins}m，建议增加到 7 小时以上`)
    }
  }

  if (input.bestHabit) {
    parts.push(`「${input.bestHabit}」完成得最好`)
  }

  if (input.skipHabit) {
    parts.push(`「${input.skipHabit}」容易跳过，可以考虑调整`)
  }

  return parts.length > 0 ? parts.join('；') + '。' : '继续加油。'
}

// ============================================
// LLM provider (placeholder for future)
// ============================================

async function generateWithLLM(
  _prompt: string,
  _config: AIProviderConfig
): Promise<string> {
  // TODO: Implement when API key is configured
  // const response = await fetch(config.apiEndpoint ?? 'https://api.openai.com/v1/chat/completions', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${config.apiKey}`,
  //   },
  //   body: JSON.stringify({
  //     model: config.model ?? 'gpt-4o-mini',
  //     messages: [{ role: 'user', content: prompt }],
  //   }),
  // })
  // const data = await response.json()
  // return data.choices[0].message.content
  throw new Error('LLM mode not yet configured. Set AI_API_KEY in env.')
}

// ============================================
// Public API
// ============================================

let globalConfig: AIProviderConfig = { mode: 'local' }

export function configureAI(config: Partial<AIProviderConfig>) {
  globalConfig = { ...globalConfig, ...config }
}

export async function detectPatterns(input: PatternInput): Promise<PatternInsight[]> {
  if (globalConfig.mode === 'llm') {
    // TODO: LLM-based pattern detection
    return []
  }

  // Local rule engine
  const insights: PatternInsight[] = [
    ...detectSleepPatterns(input),
    ...detectHabitPatterns(input),
  ]

  return insights
}

export async function generateWeeklyNarrative(
  input: WeeklySummaryInput
): Promise<string> {
  if (globalConfig.mode === 'llm') {
    const prompt = `你是一个温和的生活节奏助手。请根据以下本周数据用一段自然的中文总结：
- 习惯完成率：${input.habitRate}%
- 运动次数：${input.exerciseCount}
- 平均睡眠时长：${input.avgSleepDuration} 分钟
- 完成最好的习惯：${input.bestHabit ?? '无'}
- 容易跳过的习惯：${input.skipHabit ?? '无'}
- 心情评分：${input.moodScore}/3
- 阅读时长：${input.readingDuration} 分钟

要求：温和、客观、有建设性。不说负面词汇。结尾给一个下周的小建议。`

    return generateWithLLM(prompt, globalConfig)
  }

  return generateLocalSummary(input)
}

export async function suggestGoalAdjustments(
  _input: WeeklySummaryInput
): Promise<string> {
  if (globalConfig.mode === 'llm') {
    // TODO
    return ''
  }

  // Simple rule-based suggestions
  const suggestions: string[] = []

  if (_input.habitRate < 50) {
    suggestions.push('本周习惯完成率偏低，建议减少习惯数量或降低目标值')
  }

  if (_input.exerciseCount < 2) {
    suggestions.push('运动次数较少，下周可以设定每周运动 3 次的小目标')
  }

  if (_input.avgSleepDuration > 0 && _input.avgSleepDuration < 420) {
    suggestions.push('平均睡眠不足 7 小时，下周尝试睡前 30 分钟放下手机')
  }

  return suggestions.length > 0 ? suggestions.join('；') : '保持当前节奏即可'
}
