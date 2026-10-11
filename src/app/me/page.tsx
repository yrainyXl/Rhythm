'use client'

import { useState } from 'react'
import { AuthGuard } from '@/features/app/components/auth-guard'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { useRouter } from 'next/navigation'
import { apiFetch, ApiError } from '@/lib/api-client'
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
        <div className="r-page">
          <button
            type="button"
            onClick={() => setShowGoals(false)}
            className="r-link mb-4"
          >
            ← 我的
          </button>
          <GoalView />
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="r-page">
        <header>
          <h1 className="r-page-title">我的</h1>
          <p className="r-page-description">个人资料与应用设置。</p>
        </header>
        {/* Profile Card */}
        <div className="r-panel">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-semibold border border-rhythm-border bg-rhythm-card-hover text-rhythm-text-primary">
              {profile?.nickname?.[0] ?? user?.email?.[0].toUpperCase() ?? '·'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl font-semibold break-words">{profile?.nickname ?? '未设置昵称'}</p>
              <p className="text-sm text-rhythm-text-secondary mt-1 break-all">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!isEditing) {
                  setNickname(profile?.nickname ?? '')
                  setTimezone(profile?.timezone ?? 'Asia/Shanghai')
                  setWakeTime(profile?.preferred_wake_time?.slice(0, 5) ?? '07:00')
                  setSleepTime(profile?.preferred_sleep_time?.slice(0, 5) ?? '23:30')
                  setSaveMessage(null)
                }
                setIsEditing(!isEditing)
              }}
              className="r-link shrink-0"
            >
              {isEditing ? '取消' : '编辑'}
            </button>
          </div>
        </div>

        {/* Edit Form */}
        {isEditing && (
          <div className="r-panel space-y-4">
            <div>
              <label htmlFor="profile-nickname" className="block text-sm font-medium mb-2">昵称</label>
              <input
                type="text"
                id="profile-nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                className="r-input"
              />
            </div>

            <div>
              <label htmlFor="profile-timezone" className="block text-sm font-medium mb-2">时区</label>
              <select
                id="profile-timezone"
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
              <label htmlFor="profile-wakeTime" className="block text-sm font-medium mb-2">起床时间</label>
              <input
                type="time"
                id="profile-wakeTime"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="r-input"
              />
            </div>

            <div>
              <label htmlFor="profile-sleepTime" className="block text-sm font-medium mb-2">睡觉时间</label>
              <input
                type="time"
                id="profile-sleepTime"
                value={sleepTime}
                onChange={(e) => setSleepTime(e.target.value)}
                className="r-input"
              />
            </div>

            {saveMessage && (
              <p role="status" className={`text-sm ${saveMessage === '保存成功' ? 'text-rhythm-success' : 'text-rhythm-danger'}`}>
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

        <h2 className="r-section-title">设置</h2>
        {/* Menu items */}
        <div className="rounded-[20px] border border-rhythm-border divide-y divide-rhythm-border overflow-hidden">
          <button
            type="button"
            onClick={() => setShowGoals(true)}
            className="w-full px-5 py-4 text-[15px] text-rhythm-text-primary text-left hover:bg-rhythm-card-hover/60 flex items-center justify-between transition-colors"
          >
            <span>目标和里程碑</span>
            <span className="text-rhythm-text-secondary">→</span>
          </button>
          <div className="px-5 py-4 flex items-center justify-between">
            <span className="text-sm text-rhythm-text-primary">外观</span>
            <button
              type="button"
              onClick={toggle}
              aria-label={`切换到${theme === 'dark' ? '白天' : '黑夜'}模式`}
              className="flex min-h-[44px] items-center gap-2 text-sm text-rhythm-text-primary border border-rhythm-border rounded-full px-4 transition-colors hover:bg-rhythm-card-hover"
            >
              {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
              {theme === 'dark' ? '黑夜' : '白天'}
            </button>
          </div>
          <div className="px-5 py-4 text-[15px] text-rhythm-text-primary flex flex-wrap gap-2 items-center justify-between">
            <span>提醒设置</span>
            <span className="text-rhythm-text-secondary text-sm">即将支持</span>
          </div>
          <div className="px-5 py-4 text-[15px] text-rhythm-text-primary flex flex-wrap gap-2 items-center justify-between">
            <span>通知权限</span>
            <span className="text-rhythm-text-secondary text-sm">已关闭 · 暂未开放</span>
          </div>
        </div>

        <h2 className="r-section-title">个人信息</h2>
        {/* Info */}
        <div className="rounded-[20px] border border-rhythm-border divide-y divide-rhythm-border overflow-hidden">
          <div className="px-5 py-4 text-[15px]">
            <span className="text-rhythm-text-secondary text-sm">邮箱</span>
            <p className="text-rhythm-text-primary mt-1 break-words">{user?.email}</p>
          </div>
          <div className="px-5 py-4 text-[15px]">
            <span className="text-rhythm-text-secondary text-sm">时区</span>
            <p className="text-rhythm-text-primary mt-1 break-words">{profile?.timezone ?? '未设置'}</p>
          </div>
          <div className="px-5 py-4 text-[15px]">
            <span className="text-rhythm-text-secondary text-sm">作息</span>
            <p className="text-rhythm-text-primary mt-1 break-words">
              {profile?.preferred_wake_time?.slice(0, 5) ?? '--'} 起床 / {profile?.preferred_sleep_time?.slice(0, 5) ?? '--'} 睡觉
            </p>
          </div>
        </div>

        {saveMessage && !isEditing && <p role="status" className="text-sm text-rhythm-success">{saveMessage}</p>}
        {/* Sign out */}
        <button
          type="button"
          onClick={handleSignOut}
          className="r-btn w-full text-rhythm-danger"
          style={{ border: '1px solid rgb(var(--r-danger-rgb) / 0.3)' }}
        >
          退出登录
        </button>
      </div>
    </AuthGuard>
  )
}
