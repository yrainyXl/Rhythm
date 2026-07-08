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
    <div className="min-h-[100dvh] flex flex-col justify-center px-4 py-10">
      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl r-title">Rhythm</h1>
          <p className="text-rhythm-text-muted mt-2">发现你的生活节奏</p>
        </div>

        <div className="r-card p-6">
          <div className="flex border-b border-rhythm-border mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setError(null)
                setMagicLinkSent(false)
              }}
              className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                mode === 'login'
                  ? 'text-rhythm-glow border-b-2 border-rhythm-glow'
                  : 'text-rhythm-text-muted hover:text-rhythm-text-secondary'
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
                  ? 'text-rhythm-glow border-b-2 border-rhythm-glow'
                  : 'text-rhythm-text-muted hover:text-rhythm-text-secondary'
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
                  ? 'text-rhythm-glow border-b-2 border-rhythm-glow'
                  : 'text-rhythm-text-muted hover:text-rhythm-text-secondary'
              }`}
            >
              免密码
            </button>
          </div>

          {magicLinkSent ? (
            <div className="text-center py-4">
              <div className="text-rhythm-success font-medium mb-2">验证邮件已发送</div>
              <p className="text-sm text-rhythm-text-secondary">
                请检查 {email} 的收件箱，点击邮件中的链接登录。
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="r-label">
                  邮箱
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="r-input"
                />
              </div>

              {mode !== 'magic-link' && (
                <div>
                  <label htmlFor="password" className="r-label">
                    密码
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="输入密码"
                    required
                    className="r-input"
                  />
                </div>
              )}

              {mode === 'signup' && (
                <div>
                  <label htmlFor="confirmPassword" className="r-label">
                    确认密码
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="再次输入密码"
                    required
                    className="r-input"
                  />
                </div>
              )}

              {error && (
                <p className="text-sm text-rhythm-danger text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="r-btn-primary w-full py-2.5 px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-rhythm-text-primary border-t-transparent rounded-full animate-spin" />
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
