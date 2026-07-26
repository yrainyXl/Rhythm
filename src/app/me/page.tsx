'use client'

import { useState } from 'react'
import { AuthGuard } from '@/features/app/components/auth-guard'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { useRouter } from 'next/navigation'
import { apiFetch, ApiError } from '@/lib/cloudbase/api-client'
import { GoalView } from '@/features/records/components/goal-view'
import { useThemeStore } from '@/features/app/store/theme-store'
import { Sun, Moon } from 'lucide-react'

export default function MePage() {
  const router = useRouter()
  const { user, profile, signOut, refreshProfile } = useAuthStore()
  const { theme, toggle } = useThemeStore()
  const [isEditing, setIsEditing] = useState(false)
  const [nickname, setNickname] = useState(profile?.nickname ?? '')
  const [timezone, setTimezone] = useState(profile?.timezone ?? 'Asia/Shanghai')
  const [wakeTime, setWakeTime] = useState(profile?.preferred_wake_time?.slice(0, 5) ?? '07:00')
  const [sleepTime, setSleepTime] = useState(profile?.preferred_sleep_time?.slice(0, 5) ?? '23:30')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [showGoals, setShowGoals] = useState(false)

  const handleSave = async () => {
    if (!user) return
    setIsSaving(true)
    setSaveMessage(null)

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
      setSaveMessage('保存成功')
      setIsEditing(false)
    } catch (e) {
      setSaveMessage('保存失败: ' + (e instanceof ApiError ? e.message : '请重试'))
    }
    setIsSaving(false)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  if (showGoals) {
    return (
      <AuthGuard>
        <div className="p-5">
          <button
            type="button"
            onClick={() => setShowGoals(false)}
            className="text-sm text-rhythm-text-secondary hover:text-rhythm-text-primary mb-4 inline-block transition-colors"
          >
            ← 个人资料
          </button>
          <GoalView />
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="p-5 space-y-4">
        {/* Profile Card */}
        <div className="r-card p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl r-title border border-rhythm-border-strong bg-rhythm-glow-soft text-rhythm-glow">
              {profile?.nickname?.[0] ?? user?.email?.[0].toUpperCase() ?? '·'}
            </div>
            <div className="flex-1">
              <p className="r-title text-base">{profile?.nickname ?? '未设置昵称'}</p>
              <p className="text-sm text-rhythm-text-muted mt-0.5">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="text-sm text-rhythm-glow hover:text-rhythm-text-primary transition-colors"
            >
              {isEditing ? '取消' : '编辑'}
            </button>
          </div>
        </div>

        {/* Edit Form */}
        {isEditing && (
          <div className="r-card p-5 space-y-4">
            <div>
              <label className="r-label">昵称</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                className="r-input"
              />
            </div>

            <div>
              <label className="r-label">时区</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="r-input"
              >
                <option value="Asia/Shanghai">中国标准时间 (UTC+8)</option>
                <option value="Asia/Tokyo">日本标准时间 (UTC+9)</option>
                <option value="America/New_York">美国东部时间 (UTC-5)</option>
                <option value="America/Los_Angeles">美国太平洋时间 (UTC-8)</option>
                <option value="Europe/London">伦敦时间 (UTC+0)</option>
              </select>
            </div>

            <div>
              <label className="r-label">起床时间</label>
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="r-input"
              />
            </div>

            <div>
              <label className="r-label">睡觉时间</label>
              <input
                type="time"
                value={sleepTime}
                onChange={(e) => setSleepTime(e.target.value)}
                className="r-input"
              />
            </div>

            {saveMessage && (
              <p className={`text-sm ${saveMessage === '保存成功' ? 'text-rhythm-success' : 'text-rhythm-danger'}`}>
                {saveMessage}
              </p>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="r-btn-primary w-full disabled:opacity-50"
            >
              {isSaving ? '保存中…' : '保存'}
            </button>
          </div>
        )}

        {/* Menu items */}
        <div className="r-card divide-y divide-rhythm-border overflow-hidden">
          <button
            type="button"
            onClick={() => setShowGoals(true)}
            className="w-full px-4 py-3.5 text-sm text-rhythm-text-primary text-left hover:bg-rhythm-card-hover/60 flex items-center justify-between transition-colors"
          >
            <span>目标和里程碑</span>
            <span className="text-rhythm-text-faint">→</span>
          </button>
          <div className="px-4 py-3.5 flex items-center justify-between">
            <span className="text-sm text-rhythm-text-primary">外观</span>
            <button
              type="button"
              onClick={toggle}
              className="flex items-center gap-1.5 text-xs text-rhythm-glow border border-rhythm-border-strong bg-rhythm-glow-soft rounded-full px-3 py-1.5 transition-colors hover:border-rhythm-glow"
            >
              {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
              {theme === 'dark' ? '黑夜' : '白天'}
            </button>
          </div>
          <div className="px-4 py-3.5 text-sm text-rhythm-text-primary flex items-center justify-between">
            <span>提醒设置</span>
            <span className="text-rhythm-text-muted text-xs">即将支持</span>
          </div>
          <div className="px-4 py-3.5 text-sm text-rhythm-text-primary flex items-center justify-between">
            <span>通知权限</span>
            <span className="text-rhythm-text-muted text-xs">即将支持</span>
          </div>
        </div>

        {/* Info */}
        <div className="r-card divide-y divide-rhythm-border overflow-hidden">
          <div className="px-4 py-3.5 text-sm">
            <span className="text-rhythm-text-muted text-xs">邮箱</span>
            <p className="text-rhythm-text-primary mt-0.5">{user?.email}</p>
          </div>
          <div className="px-4 py-3.5 text-sm">
            <span className="text-rhythm-text-muted text-xs">时区</span>
            <p className="text-rhythm-text-primary mt-0.5">{profile?.timezone ?? '未设置'}</p>
          </div>
          <div className="px-4 py-3.5 text-sm">
            <span className="text-rhythm-text-muted text-xs">作息</span>
            <p className="text-rhythm-text-primary mt-0.5">
              {profile?.preferred_wake_time?.slice(0, 5) ?? '--'} 起床 / {profile?.preferred_sleep_time?.slice(0, 5) ?? '--'} 睡觉
            </p>
          </div>
        </div>

        {/* Sign out */}
        <button
          type="button"
          onClick={handleSignOut}
          className="r-btn w-full text-rhythm-danger"
          style={{ border: '1px solid rgba(220, 140, 140, 0.3)' }}
        >
          退出登录
        </button>
      </div>
    </AuthGuard>
  )
}
