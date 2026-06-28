'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/features/auth/store/auth-store'

type AuthMode = 'login' | 'signup' | 'magic-link'

export default function LoginPage() {
  const router = useRouter()
  const { signInWithEmail, signUp, signInWithMagicLink } = useAuthStore()
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (mode === 'login') {
        const result = await signInWithEmail(email, password)
        if (result.error) {
          setError(result.error)
        } else {
          router.push('/today')
        }
      } else if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError('两次密码不一致')
          setIsLoading(false)
          return
        }
        if (password.length < 6) {
          setError('密码至少需要 6 位')
          setIsLoading(false)
          return
        }
        const result = await signUp(email, password)
        if (result.error) {
          setError(result.error)
        } else {
          setError(null)
          setMode('login')
          // Show success message
          setError('注册成功！请检查邮箱确认，然后登录。')
        }
      } else {
        // magic link
        const result = await signInWithMagicLink(email)
        if (result.error) {
          setError(result.error)
        } else {
          setMagicLinkSent(true)
        }
      }
    } catch {
      setError('操作失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Rhythm</h1>
          <p className="text-gray-500 mt-2">发现你的生活节奏</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex border-b mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setError(null)
                setMagicLinkSent(false)
              }}
              className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                mode === 'login'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup')
                setError(null)
                setMagicLinkSent(false)
              }}
              className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                mode === 'signup'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              注册
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('magic-link')
                setError(null)
                setMagicLinkSent(false)
              }}
              className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                mode === 'magic-link'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              免密码
            </button>
          </div>

          {magicLinkSent ? (
            <div className="text-center py-4">
              <div className="text-green-600 font-medium mb-2">验证邮件已发送</div>
              <p className="text-sm text-gray-500">
                请检查 {email} 的收件箱，点击邮件中的链接登录。
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  邮箱
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {mode !== 'magic-link' && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    密码
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="输入密码"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {mode === 'signup' && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    确认密码
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="再次输入密码"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    处理中...
                  </span>
                ) : mode === 'login' ? (
                  '登录'
                ) : mode === 'signup' ? (
                  '注册'
                ) : (
                  '发送验证邮件'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
