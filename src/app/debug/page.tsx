'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'

type StepStatus = 'pending' | 'ok' | 'warn' | 'fail'
interface Step {
  name: string
  status: StepStatus
  detail: string
  ms?: number
}

// Race a promise against a timeout so a hung layer is reported as a timeout
// instead of freezing the whole diagnostic.
function withTimeout<T>(p: Promise<T>, ms: number): Promise<{ value?: T; timedOut: boolean }> {
  return Promise.race([
    p.then((value) => ({ value, timedOut: false })),
    new Promise<{ timedOut: boolean }>((resolve) => setTimeout(() => resolve({ timedOut: true }), ms)),
  ])
}

export default function DebugPage() {
  const [steps, setSteps] = useState<Step[]>([])
  const [done, setDone] = useState(false)

  useEffect(() => {
    const results: Step[] = []
    const push = (s: Step) => {
      results.push(s)
      setSteps([...results])
    }

    const run = async () => {
      // 1. Environment
      const isStandalone =
        typeof window !== 'undefined' &&
        (window.matchMedia('(display-mode: standalone)').matches ||
          // @ts-expect-error iOS-only
          window.navigator.standalone === true)
      push({
        name: '1. 运行环境',
        status: 'ok',
        detail: `standalone(主屏PWA)=${isStandalone} · online=${navigator.onLine} · UA=${navigator.userAgent.slice(0, 60)}`,
      })

      // 2. Env vars injected into the bundle
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      push({
        name: '2. 环境变量',
        status: url && anon ? 'ok' : 'fail',
        detail: `SUPABASE_URL=${url ? url.slice(0, 32) + '…' : '缺失!'} · ANON_KEY=${anon ? '已注入(' + anon.length + '字符)' : '缺失!'}`,
      })

      // 3. localStorage session
      const authKeys = Object.keys(localStorage).filter((k) => k.startsWith('sb-') || k.includes('auth-token'))
      let sessionDetail = '没有找到 sb-*-auth-token'
      let sessionStatus: StepStatus = 'warn'
      let storedExpiry: number | null = null
      for (const k of authKeys) {
        try {
          const raw = localStorage.getItem(k)
          if (!raw) continue
          const parsed = JSON.parse(raw)
          const expiresAt = parsed?.expires_at ?? parsed?.currentSession?.expires_at
          const hasToken = !!(parsed?.access_token ?? parsed?.currentSession?.access_token)
          if (hasToken) {
            storedExpiry = expiresAt ?? null
            const now = Math.floor(Date.now() / 1000)
            const expired = expiresAt ? expiresAt < now : false
            sessionStatus = expired ? 'warn' : 'ok'
            sessionDetail = `key=${k} · 有token · expires_at=${expiresAt ? new Date(expiresAt * 1000).toLocaleString() : '?'} · ${expired ? '已过期' : '未过期'}`
          }
        } catch (e) {
          sessionDetail = `key=${k} 解析失败: ${String(e)}`
          sessionStatus = 'fail'
        }
      }
      push({ name: '3. localStorage 会话', status: sessionStatus, detail: sessionDetail })

      const supabase = createBrowserClient()

      // 4. getSession() — reads/refreshes from local storage
      {
        const t0 = performance.now()
        const r = await withTimeout(supabase.auth.getSession(), 8000)
        const ms = Math.round(performance.now() - t0)
        if (r.timedOut) {
          push({ name: '4. getSession()', status: 'fail', detail: '超时(>8s)未返回 — 卡在会话恢复/刷新', ms })
        } else {
          const session = r.value?.data.session
          push({
            name: '4. getSession()',
            status: session?.user ? 'ok' : 'warn',
            detail: session?.user ? `user=${session.user.id.slice(0, 8)}… email=${session.user.email ?? '?'}` : '返回了,但 session 为 null',
            ms,
          })
        }
      }

      // 5. getUser() — validates token against the server (network)
      {
        const t0 = performance.now()
        const r = await withTimeout(supabase.auth.getUser(), 8000)
        const ms = Math.round(performance.now() - t0)
        if (r.timedOut) {
          push({ name: '5. getUser() 网络校验', status: 'fail', detail: '超时(>8s) — 到 Supabase 的网络请求挂起', ms })
        } else {
          const u = r.value?.data.user
          const err = r.value?.error
          push({
            name: '5. getUser() 网络校验',
            status: u ? 'ok' : 'fail',
            detail: u ? `服务端确认 user=${u.id.slice(0, 8)}…` : `无 user · error=${err?.message ?? '未知'}`,
            ms,
          })
        }
      }

      // 6. Real data query (habit_occurrences today) — the actual failing path
      {
        const today = new Date().toISOString().split('T')[0]
        const t0 = performance.now()
        const r = await withTimeout(
          supabase.from('daily_reflections').select('local_date').order('local_date', { ascending: false }).limit(5),
          8000
        )
        const ms = Math.round(performance.now() - t0)
        if (r.timedOut) {
          push({ name: '6. 真实数据查询', status: 'fail', detail: `超时(>8s) — 查询挂起 (today=${today})`, ms })
        } else {
          const err = r.value?.error
          const rows = r.value?.data
          push({
            name: '6. 真实数据查询(复盘)',
            status: err ? 'fail' : 'ok',
            detail: err ? `错误 code=${err.code} · ${err.message}` : `成功,返回 ${rows?.length ?? 0} 行`,
            ms,
          })
        }
      }

      setDone(true)
    }

    run().catch((e) => {
      push({ name: '致命错误', status: 'fail', detail: String(e?.stack ?? e) })
      setDone(true)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const color = (s: StepStatus) =>
    s === 'ok' ? '#4ade80' : s === 'warn' ? '#fbbf24' : s === 'fail' ? '#f87171' : '#94a3b8'

  const copyText = steps.map((s) => `${s.name}: [${s.status}]${s.ms != null ? ` ${s.ms}ms` : ''} ${s.detail}`).join('\n')

  return (
    <div style={{ minHeight: '100vh', background: '#0B1019', color: '#e2e8f0', padding: 16, fontFamily: 'monospace', fontSize: 13 }}>
      <h1 style={{ fontSize: 16, marginBottom: 4 }}>🔬 Rhythm 诊断</h1>
      <p style={{ color: '#94a3b8', marginBottom: 16 }}>
        {done ? '检测完成 — 请截图或点下方复制发给开发者' : '检测中…'}
      </p>

      {steps.map((s, i) => (
        <div key={i} style={{ marginBottom: 12, borderLeft: `3px solid ${color(s.status)}`, paddingLeft: 10 }}>
          <div style={{ color: color(s.status), fontWeight: 600 }}>
            {s.name} [{s.status.toUpperCase()}]{s.ms != null ? ` · ${s.ms}ms` : ''}
          </div>
          <div style={{ color: '#cbd5e1', wordBreak: 'break-all', marginTop: 2 }}>{s.detail}</div>
        </div>
      ))}

      {done && (
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(copyText).then(
              () => alert('已复制到剪贴板'),
              () => alert('复制失败,请手动截图')
            )
          }}
          style={{ marginTop: 16, padding: '10px 16px', background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 8, fontSize: 14 }}
        >
          复制诊断结果
        </button>
      )}
    </div>
  )
}
