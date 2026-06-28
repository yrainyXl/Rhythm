'use client'

import { useEffect } from 'react'
import { useExerciseStore } from '@/features/records/store/exercise-store'

const categoryLabels: Record<string, string> = {
  running: '跑步', walking: '散步', gym: '健身', stretching: '拉伸',
  cycling: '骑行', yoga: '瑜伽', ball: '球类', rehab: '康复', other: '其他',
}

export function ExerciseAnalysis() {
  const { analysis, isLoadingAnalysis, runAnalysis } = useExerciseStore()

  useEffect(() => {
    runAnalysis()
  }, [runAnalysis])

  if (isLoadingAnalysis || !analysis) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        还没有足够的运动数据
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border p-3 text-center">
          <p className="text-xs text-gray-400">本月运动</p>
          <p className="text-xl font-bold text-gray-900">{analysis.totalSessions} 次</p>
        </div>
        <div className="bg-white rounded-xl border p-3 text-center">
          <p className="text-xs text-gray-400">总时长</p>
          <p className="text-xl font-bold text-gray-900">
            {analysis.totalDuration > 60
              ? `${Math.floor(analysis.totalDuration / 60)}h${analysis.totalDuration % 60}m`
              : `${analysis.totalDuration}m`}
          </p>
        </div>
      </div>

      {/* Category breakdown */}
      {analysis.categoryBreakdown.length > 0 && (
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-bold text-gray-900 text-sm mb-3">运动分布</h3>
          <div className="space-y-2">
            {analysis.categoryBreakdown.map(({ category, count, duration }) => (
              <div key={category} className="flex items-center gap-3 text-sm">
                <span className="text-gray-500 w-12 text-xs">
                  {categoryLabels[category] ?? category}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-blue-500 rounded-full h-2"
                    style={{
                      width: `${(count / Math.max(...analysis.categoryBreakdown.map((c) => c.count))) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-16 text-right">
                  {count}次 / {duration}m
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly trend */}
      {analysis.weeklyTrend.length > 0 && (
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-bold text-gray-900 text-sm mb-3">每周趋势</h3>
          <div className="space-y-2">
            {analysis.weeklyTrend.map(({ week, sessions, duration }) => (
              <div key={week} className="flex items-center gap-3 text-sm">
                <span className="text-gray-500 w-20 text-xs truncate">{week}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-green-500 rounded-full h-2"
                    style={{
                      width: `${(sessions / Math.max(...analysis.weeklyTrend.map((w) => w.sessions))) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-20 text-right">
                  {sessions}次 / {duration}m
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rehab progress */}
      {analysis.rehabProgress.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-bold text-blue-800 text-sm mb-2">💪 康复进展</h3>
          {analysis.rehabProgress.map(({ templateName, sessions, daysSinceStart }) => (
            <div key={templateName} className="text-sm text-blue-700">
              <p>
                「{templateName}」已坚持 {daysSinceStart} 天，完成 {sessions} 次训练
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
