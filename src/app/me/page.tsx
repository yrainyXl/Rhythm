'use client'

import { useState } from 'react'
import { AuthGuard } from '@/features/app/components/auth-guard'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import { GoalView } from '@/features/records/components/goal-view'

export default function MePage() {
  const router = useRouter()
  const { user, profile, signOut, refreshProfile } = useAuthStore()
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

    const supabase = createBrowserClient()
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email ?? '',
      nickname: nickname || null,
      timezone,
      preferred_wake_time: wakeTime || null,
      preferred_sleep_time: sleepTime || null,
    })

    if (error) {
      setSaveMessage('保存失败: ' + error.message)
    } else {
      await refreshProfile()
      setSaveMessage('保存成功')
      setIsEditing(false)
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
        <div className="p-4">
          <button
            type="button"
            onClick={() => setShowGoals(false)}
            className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
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
      <div className="p-4 space-y-4">
        {/* Profile Card */}
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-xl font-bold text-blue-600">
              {profile?.nickname?.[0] ?? user?.email?.[0].toUpperCase() ?? '?'}
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900">{profile?.nickname ?? '未设置昵称'}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {isEditing ? '取消' : '编辑'}
            </button>
          </div>
        </div>

        {/* Edit Form */}
        {isEditing && (
          <div className="bg-white rounded-xl border p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">昵称</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">时区</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Asia/Shanghai">中国标准时间 (UTC+8)</option>
                <option value="Asia/Tokyo">日本标准时间 (UTC+9)</option>
                <option value="America/New_York">美国东部时间 (UTC-5)</option>
                <option value="America/Los_Angeles">美国太平洋时间 (UTC-8)</option>
                <option value="Europe/London">伦敦时间 (UTC+0)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">起床时间</label>
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">睡觉时间</label>
              <input
                type="time"
                value={sleepTime}
                onChange={(e) => setSleepTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {saveMessage && (
              <p className={`text-sm ${saveMessage === '保存成功' ? 'text-green-600' : 'text-red-600'}`}>
                {saveMessage}
              </p>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        )}

        {/* Menu items */}
        <div className="bg-white rounded-xl border divide-y">
          <button
            type="button"
            onClick={() => setShowGoals(true)}
            className="w-full px-4 py-3 text-sm text-gray-900 text-left hover:bg-gray-50 flex items-center justify-between"
          >
            <span>🎯 目标和里程碑</span>
            <span className="text-gray-300">→</span>
          </button>
          <div className="px-4 py-3 text-sm text-gray-900 flex items-center justify-between">
            <span>⏰ 提醒设置</span>
            <span className="text-gray-400 text-xs">即将支持</span>
          </div>
          <div className="px-4 py-3 text-sm text-gray-900 flex items-center justify-between">
            <span>🔔 通知权限</span>
            <span className="text-gray-400 text-xs">即将支持</span>
          </div>
        </div>

        {/* Info */}
        <div className="bg-white rounded-xl border divide-y">
          <div className="px-4 py-3 text-sm text-gray-900">
            <span className="text-gray-400">邮箱</span>
            <p>{user?.email}</p>
          </div>
          <div className="px-4 py-3 text-sm text-gray-900">
            <span className="text-gray-400">时区</span>
            <p>{profile?.timezone ?? '未设置'}</p>
          </div>
          <div className="px-4 py-3 text-sm text-gray-900">
            <span className="text-gray-400">作息</span>
            <p>
              {profile?.preferred_wake_time?.slice(0, 5) ?? '--'} 起床 / {profile?.preferred_sleep_time?.slice(0, 5) ?? '--'} 睡觉
            </p>
          </div>
        </div>

        {/* Sign out */}
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full py-2.5 px-4 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
        >
          退出登录
        </button>
      </div>
    </AuthGuard>
  )
}
