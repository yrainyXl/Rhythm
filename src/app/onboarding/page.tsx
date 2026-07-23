'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/cloudbase/api-client'
import { useAuthStore } from '@/features/auth/store/auth-store'

type Step = 'welcome' | 'timezone' | 'sleep-schedule' | 'done'

export default function OnboardingPage() {
  const router = useRouter()
  const { user, profile, refreshProfile } = useAuthStore()
  const [step, setStep] = useState<Step>('welcome')
  const [isLoading, setIsLoading] = useState(false)

  const [nickname, setNickname] = useState(profile?.nickname ?? '')
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [wakeTime, setWakeTime] = useState('07:00')
  const [sleepTime, setSleepTime] = useState('23:30')

  const saveProfile = async () => {
    if (!user) return
    setIsLoading(true)

    try {
      await apiFetch('/api/profile', {
        method: 'POST',
        body: JSON.stringify({
          nickname: nickname || null,
          timezone,
          preferred_wake_time: wakeTime || null,
          preferred_sleep_time: sleepTime || null,
        }),
      })
      await refreshProfile()
      router.push('/today')
    } catch {
      // 保存失败:停留在当前页(apiFetch 已抛出 ApiError)
    }
    setIsLoading(false)
  }

  if (step === 'welcome') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-rhythm-glow-soft border border-rhythm-border rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🌙</span>
            </div>
            <h1 className="text-2xl r-title">欢迎来到 Rhythm</h1>
            <p className="text-rhythm-text-muted mt-2 text-sm">
              先花一分钟设置你的基本信息
            </p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setStep('timezone')}
              className="r-btn-primary w-full py-2.5 px-4 text-sm"
            >
              开始设置
            </button>
            <button
              type="button"
              onClick={() => router.push('/today')}
              className="w-full py-2.5 px-4 text-sm text-rhythm-text-muted hover:text-rhythm-text-secondary transition-colors"
            >
              跳过，稍后再说
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'timezone') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="mb-3">
            <div className="flex items-center gap-2 text-sm text-rhythm-text-muted mb-6">
              <span className="w-2 h-2 bg-rhythm-glow rounded-full" />
              <span className="w-2 h-2 bg-rhythm-border rounded-full" />
              <span className="w-2 h-2 bg-rhythm-border rounded-full" />
            </div>
            <h2 className="text-xl r-title">怎么称呼你？</h2>
            <p className="text-rhythm-text-muted mt-1 text-sm">设置一个昵称，后续可以修改</p>
          </div>

          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="输入昵称或称呼"
            maxLength={20}
            className="r-input mb-6"
          />

          <h2 className="text-xl r-title mb-1">所在时区</h2>
          <p className="text-rhythm-text-muted text-sm mb-3">用于正确计算每天的日期</p>

          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="r-input appearance-none mb-6"
          >
            <option value="Asia/Shanghai">中国标准时间 (UTC+8)</option>
            <option value="Asia/Tokyo">日本标准时间 (UTC+9)</option>
            <option value="Asia/Seoul">韩国标准时间 (UTC+9)</option>
            <option value="Asia/Taipei">台北标准时间 (UTC+8)</option>
            <option value="Asia/Hong_Kong">香港时间 (UTC+8)</option>
            <option value="Asia/Singapore">新加坡时间 (UTC+8)</option>
            <option value="America/New_York">美国东部时间 (UTC-5)</option>
            <option value="America/Chicago">美国中部时间 (UTC-6)</option>
            <option value="America/Denver">美国山地时间 (UTC-7)</option>
            <option value="America/Los_Angeles">美国太平洋时间 (UTC-8)</option>
            <option value="Europe/London">伦敦时间 (UTC+0)</option>
            <option value="Europe/Paris">巴黎时间 (UTC+1)</option>
            <option value="Australia/Sydney">悉尼时间 (UTC+11)</option>
          </select>

          <button
            type="button"
            onClick={() => setStep('sleep-schedule')}
            className="r-btn-primary w-full py-2.5 px-4 text-sm"
          >
            下一步
          </button>
        </div>
      </div>
    )
  }

  if (step === 'sleep-schedule') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 text-sm text-rhythm-text-muted mb-6">
            <span className="w-2 h-2 bg-rhythm-glow rounded-full" />
            <span className="w-2 h-2 bg-rhythm-glow rounded-full" />
            <span className="w-2 h-2 bg-rhythm-border rounded-full" />
          </div>

          <h2 className="text-xl r-title mb-1">作息时间</h2>
          <p className="text-rhythm-text-muted text-sm mb-6">设置你常用的作息时间，后续可以随时修改</p>

          <div className="space-y-4 mb-6">
            <div>
              <label className="r-label">
                通常起床时间
              </label>
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="r-input"
              />
            </div>
            <div>
              <label className="r-label">
                通常睡觉时间
              </label>
              <input
                type="time"
                value={sleepTime}
                onChange={(e) => setSleepTime(e.target.value)}
                className="r-input"
              />
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={saveProfile}
              disabled={isLoading}
              className="r-btn-primary w-full py-2.5 px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '保存中...' : '完成设置'}
            </button>
            <button
              type="button"
              onClick={() => setStep('timezone')}
              className="w-full py-2.5 px-4 text-sm text-rhythm-text-muted hover:text-rhythm-text-secondary transition-colors"
            >
              上一步
            </button>
          </div>
        </div>
      </div>
    )
  }
}
