'use client'

import { useEffect } from 'react'
import { useSleepStore } from '@/features/records/store/sleep-store'

export function SleepAnalysis() {
  const { analysis, isLoadingAnalysis, runAnalysis, sleepRecords, loadSleepHistory } = useSleepStore()

  useEffect(() => {
    runAnalysis(30)
    loadSleepHistory(30)
  }, [runAnalysis, loadSleepHistory])

  if (isLoadingAnalysis) {
    return (
      <div className="text-center py-8">
        <div className="w-6 h-6 border-2 border-rhythm-glow border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-rhythm-text-muted mt-2">分析中...</p>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="text-center py-8 text-rhythm-text-muted text-sm">
        还没有足够的睡眠数据，连续记录一周后再来看看
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="r-card p-3 text-center">
          <p className="text-xs text-rhythm-text-muted mb-1">平均时长</p>
          <p className="text-lg font-bold text-rhythm-text-primary">
            {Math.floor(analysis.averageDuration / 60)}h{analysis.averageDuration % 60}m
          </p>
        </div>
        <div className="r-card p-3 text-center">
          <p className="text-xs text-rhythm-text-muted mb-1">质量评分</p>
          <p className="text-lg font-bold text-rhythm-text-primary">
            {analysis.averageQuality}/3
          </p>
        </div>
        <div className="r-card p-3 text-center">
          <p className="text-xs text-rhythm-text-muted mb-1">记录天数</p>
          <p className="text-lg font-bold text-rhythm-text-primary">
            {analysis.greatCount + analysis.fairCount + analysis.poorCount}
          </p>
        </div>
      </div>

      {/* Quality breakdown */}
      <div className="r-card p-4">
        <h3 className="r-title text-sm mb-3">质量分布</h3>
        <div className="space-y-2">
          {[
            { label: '很好', count: analysis.greatCount, color: 'bg-rhythm-success' },
            { label: '一般', count: analysis.fairCount, color: 'bg-rhythm-warn' },
            { label: '较差', count: analysis.poorCount, color: 'bg-rhythm-danger' },
          ].map(({ label, count, color }) => {
            const total = analysis.greatCount + analysis.fairCount + analysis.poorCount
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            return (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xs text-rhythm-text-secondary w-8">{label}</span>
                <div className="flex-1 bg-rhythm-void/40 rounded-full h-2">
                  <div
                    className={`${color} rounded-full h-2 transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-rhythm-text-muted w-8 text-right">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Common pre-sleep activities */}
      {analysis.commonPreSleep.length > 0 && (
        <div className="r-card p-4">
          <h3 className="r-title text-sm mb-2">常见睡前活动</h3>
          <div className="flex flex-wrap gap-2">
            {analysis.commonPreSleep.map((activity) => (
              <span key={activity} className="px-2.5 py-1 bg-rhythm-void/40 border border-rhythm-border rounded-full text-xs text-rhythm-text-secondary">
                {activity}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Correlation note */}
      {analysis.correlationNote && (
        <div className="r-card p-4 bg-rhythm-glow-soft border-rhythm-glow">
          <p className="text-xs font-medium text-rhythm-glow mb-1">发现一个模式</p>
          <p className="text-sm text-rhythm-text-secondary">{analysis.correlationNote}</p>
        </div>
      )}

      {/* Weekly trend table */}
      {analysis.weeklyTrend.length > 0 && (
        <div className="r-card p-4">
          <h3 className="r-title text-sm mb-3">近 7 天趋势</h3>
          <div className="space-y-2">
            {analysis.weeklyTrend.map((day) => (
              <div key={day.date} className="flex items-center gap-3 text-sm">
                <span className="text-rhythm-text-secondary w-12 text-xs">
                  {new Date(day.date + 'T12:00').toLocaleDateString('zh-CN', { weekday: 'short' })}
                </span>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 bg-rhythm-void/40 rounded-full h-2">
                    <div
                      className="bg-rhythm-glow rounded-full h-2 transition-all"
                      style={{ width: `${(day.duration / 480) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-rhythm-text-secondary w-16 text-right">
                    {Math.floor(day.duration / 60)}h{day.duration % 60}m
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
