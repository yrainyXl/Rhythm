'use client'

import { useState, useEffect } from 'react'
import { AuthGuard } from '@/features/app/components/auth-guard'
import { useCoupleStore } from '@/features/couple/store/couple-store'
import { useAuthStore } from '@/features/auth/store/auth-store'

export default function CouplePageClient() {
  const {
    couple, partner, myInvite, permissions,
    loadCouple, createInvite, acceptInvite, cancelInvite,
    disbandCouple, loadPermissions, updatePermission,
    sendEncouragement,
  } = useCoupleStore()
  const { profile } = useAuthStore()
  const [showInviteInput, setShowInviteInput] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [createdCode, setCreatedCode] = useState<string | null>(null)
  const [showDisbandConfirm, setShowDisbandConfirm] = useState(false)
  const [encourageText, setEncourageText] = useState('')
  const [encourageType, setEncourageType] = useState<'加油' | '辛苦了' | '早点休息' | 'custom'>('加油')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCouple()
    loadPermissions()
  }, [loadCouple, loadPermissions])

  const handleCreateInvite = async () => {
    const code = await createInvite()
    if (code) setCreatedCode(code)
  }

  const handleAcceptInvite = async () => {
    if (!inviteCode.trim()) return
    setError(null)
    const result = await acceptInvite(inviteCode)
    if (result.error) setError(result.error)
  }

  const handleSendEncouragement = async () => {
    if (!partner || !encourageText.trim()) return
    await sendEncouragement(encourageType, encourageText)
    setEncourageText('')
  }

  // Not paired
  if (!couple && !myInvite && !createdCode) {
    return (
      <AuthGuard>
        <div className="p-4 space-y-4">
          <div className="text-center py-8">
            <p className="text-4xl mb-3">💑</p>
            <p className="text-gray-500 text-sm">还没有绑定情侣关系</p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleCreateInvite}
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              创建邀请码
            </button>

            <button
              type="button"
              onClick={() => setShowInviteInput(!showInviteInput)}
              className="w-full py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              输入邀请码
            </button>
          </div>

          {showInviteInput && (
            <div className="bg-white rounded-xl border p-4 space-y-3">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="输入对方的邀请码"
                maxLength={6}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-center tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="button"
                onClick={handleAcceptInvite}
                disabled={!inviteCode.trim()}
                className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                确认绑定
              </button>
            </div>
          )}
        </div>
      </AuthGuard>
    )
  }

  // Invite created, waiting for partner
  if ((myInvite || createdCode) && !couple) {
    const code = createdCode || myInvite?.invite_code
    return (
      <AuthGuard>
        <div className="p-4 space-y-4">
          <div className="text-center py-8">
            <p className="text-4xl mb-3">💌</p>
            <p className="text-gray-500 text-sm mb-3">邀请已创建，告诉对方你的邀请码</p>
            <div className="text-3xl font-bold tracking-[0.5em] text-blue-600 bg-blue-50 rounded-xl py-4 px-8 inline-block">
              {code}
            </div>
            <p className="text-xs text-gray-400 mt-3">邀请码 48 小时内有效</p>
          </div>
          <button
            type="button"
            onClick={cancelInvite}
            className="w-full py-2.5 border border-red-200 text-sm text-red-500 rounded-lg hover:bg-red-50 transition-colors"
          >
            取消邀请
          </button>
        </div>
      </AuthGuard>
    )
  }

  // Connected
  return (
    <AuthGuard>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-lg">
              {profile?.nickname?.[0] ?? '我'}
            </div>
            <span className="text-2xl text-white/60">❤</span>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-lg">
              {partner?.nickname?.[0] ?? '?'}
            </div>
          </div>
          <p className="text-sm text-white/80 mt-2">
            {profile?.nickname ?? '你'} & {partner?.nickname ?? '对方'}
          </p>
        </div>

        {/* Encouragement quick send */}
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-bold text-gray-900 text-sm mb-3">💬 说点什么</h3>
          <div className="flex gap-2 mb-3">
            {([
              { type: '加油', emoji: '💪' },
              { type: '辛苦了', emoji: '☕' },
              { type: '早点休息', emoji: '🌙' },
            ] as const).map(({ type, emoji }) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setEncourageType(type)
                  setEncourageText(type)
                }}
                className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                  encourageType === type ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {emoji} {type}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={encourageText}
              onChange={(e) => { setEncourageText(e.target.value); setEncourageType('custom') }}
              placeholder="写一句鼓励..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <button
              type="button"
              onClick={handleSendEncouragement}
              disabled={!encourageText.trim()}
              className="px-4 py-2 bg-pink-600 text-white text-sm rounded-lg hover:bg-pink-700 disabled:opacity-50 transition-colors"
            >
              发送
            </button>
          </div>
        </div>

        {/* Shared permissions */}
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-bold text-gray-900 text-sm mb-3">🔒 共享设置</h3>
          <p className="text-xs text-gray-400 mb-3">设置你愿意共享给 ta 的数据</p>

          {([
            { dataType: 'habits', label: '习惯进度', icon: '🎯' },
            { dataType: 'sleep', label: '睡眠记录', icon: '😴' },
            { dataType: 'exercise', label: '运动记录', icon: '🏃' },
            { dataType: 'reflection', label: '每日复盘', icon: '📝' },
          ] as const).map(({ dataType, label, icon }) => {
            const perm = permissions.find((p) => p.data_type === dataType)
            const level = perm?.share_level ?? 'none'
            const enabled = perm?.is_enabled ?? false

            return (
              <div key={dataType} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span>{icon}</span>
                  <span className="text-sm text-gray-700">{label}</span>
                </div>
                <div className="flex items-center gap-1">
                  {(['none', 'status', 'detail'] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => updatePermission(dataType, l, l !== 'none')}
                      className={`px-2 py-0.5 text-xs rounded transition-colors ${
                        enabled && level === l
                          ? 'bg-blue-600 text-white'
                          : level === l && !enabled
                            ? 'bg-gray-200 text-gray-400'
                            : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {l === 'none' ? '不共享' : l === 'status' ? '仅状态' : '详情'}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Danger zone */}
        <button
          type="button"
          onClick={() => setShowDisbandConfirm(true)}
          className="w-full py-2.5 border border-red-200 text-sm text-red-500 rounded-lg hover:bg-red-50 transition-colors"
        >
          解除情侣关系
        </button>

        {showDisbandConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-5 max-w-xs w-full">
              <h3 className="font-bold text-gray-900 mb-2">确认解除关系？</h3>
              <p className="text-sm text-gray-500 mb-4">
                解除后双方将无法查看共享数据。对方记录不受影响。
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDisbandConfirm(false)}
                  className="flex-1 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => { disbandCouple(); setShowDisbandConfirm(false) }}
                  className="flex-1 py-2 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600"
                >
                  确认解除
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
