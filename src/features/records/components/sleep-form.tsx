'use client'

import { useState, useEffect } from 'react'
import { useSleepStore } from '@/features/records/store/sleep-store'

const activityOptions = [
  '看手机', '刷视频', '看书', '听音乐', '冥想',
  '喝咖啡', '喝茶', '吃东西', '洗澡', '运动',
  '工作', '玩手机游戏', '看电影', '和伴侣聊天',
]

export function SleepForm({ onBack }: { onBack: () => void }) {
  const { isSaving, saveSleepRecord, loadRecentSleep } = useSleepStore()
  const [sleepDate, setSleepDate] = useState(() => {
    const d = new Date()
    return d.toISOString().split('T')[0]
  })
  const [sleepTime, setSleepTime] = useState('23:30')
  const [wakeDate, setWakeDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  })
  const [wakeTime, setWakeTime] = useState('07:30')
  const [quality, setQuality] = useState<'great' | 'fair' | 'poor' | null>('fair')
  const [activities, setActivities] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Auto-calculate duration
  const calculateDuration = () => {
    const sleep = new Date(`${sleepDate}T${sleepTime}`)
    const wake = new Date(`${wakeDate}T${wakeTime}`)
    const diff = (wake.getTime() - sleep.getTime()) / (1000 * 60)
    return diff > 0 ? diff : null
  }

  const duration = calculateDuration()
  const durationDisplay = duration
    ? `${Math.floor(duration / 60)} 小时 ${Math.round(duration % 60)} 分钟`
    : '--'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!duration || duration < 60) {
      setError('睡眠时长似乎太短了，请检查入睡和起床时间')
      return
    }
    if (duration > 720) {
      setError('睡眠时长似乎太长了，请检查入睡和起床时间')
      return
    }

    const supabase = (await import('@/lib/supabase/client')).createBrowserClient()
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return

    const result = await saveSleepRecord({
      user_id: user.id,
      sleep_date: sleepDate,
      sleep_time,
      wake_date: wakeDate,
      wake_time,
      duration_minutes: Math.round(duration),
      quality,
      pre_sleep_activities: activities.map((a) => ({ activity: a, time: sleepTime })),
      note: note || null,
    })

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setTimeout(() => onBack(), 1500)
    }
  }

  const toggleActivity = (activity: string) => {
    setActivities((prev) =>
      prev.includes(activity) ? prev.filter((a) => a !== activity) : [...prev]
    )
  }

  if (success) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-4xl mb-3">😴</div>
          <p className="text-lg font-bold text-gray-900 mb-1">已记录</p>
          <p className="text-sm text-gray-400">睡眠时长 {durationDisplay}</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Sleep & Wake time */}
      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-bold text-gray-900 mb-3">睡眠时间</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">入睡日期</label>
            <input
              type="date"
              value={sleepDate}
              onChange={(e) => setSleepDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">入睡时间</label>
            <input
              type="time"
              value={sleepTime}
              onChange={(e) => setSleepTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">起床日期</label>
            <input
              type="date"
              value={wakeDate}
              onChange={(e) => setWakeDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">起床时间</label>
            <input
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <p className="text-center text-sm text-gray-500 mt-3">
          睡眠时长：<span className="font-medium text-gray-900">{durationDisplay}</span>
        </p>
      </div>

      {/* Quality */}
      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-bold text-gray-900 mb-3">睡眠质量</h3>
        <div className="flex gap-3">
          {([
            { value: 'great', label: '很好', icon: '😊', color: 'border-green-300 bg-green-50' },
            { value: 'fair', label: '一般', icon: '😐', color: 'border-yellow-300 bg-yellow-50' },
            { value: 'poor', label: '较差', icon: '😞', color: 'border-red-300 bg-red-50' },
          ] as const).map(({ value, label, icon, color: colorClass }) => (
            <button
              key={value}
              type="button"
              onClick={() => setQuality(value)}
              className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border transition-colors ${
                quality === value ? colorClass + ' border-2' : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <span className="text-xl">{icon}</span>
              <span className="text-xs font-medium text-gray-700">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Pre-sleep activities */}
      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-bold text-gray-900 mb-2">睡前活动</h3>
        <p className="text-xs text-gray-400 mb-3">选择你在睡前 1 小时做过的事情</p>
        <div className="flex flex-wrap gap-2">
          {activityOptions.map((activity) => (
            <button
              key={activity}
              type="button"
              onClick={() => toggleActivity(activity)}
              className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                activities.includes(activity)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {activity}
            </button>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-bold text-gray-900 mb-2">备注（可选）</h3>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="睡得如何？有什么特殊情况吗？"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}

      <button
        type="submit"
        disabled={isSaving || !quality}
        className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSaving ? '保存中...' : '保存睡眠记录'}
      </button>
    </form>
  )
}
