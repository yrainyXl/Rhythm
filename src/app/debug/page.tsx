'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { BrowserCookieAuthStorageAdapter } from '@supabase/auth-helpers-shared'
import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

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
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

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

      // 2. Env vars
      push({
        name: '2. 环境变量',
        status: url && anon ? 'ok' : 'fail',
        detail: `SUPABASE_URL=${url ? url.slice(0, 32) + '…' : '缺失!'} · ANON_KEY=${anon ? '已注入(' + anon.length + '字符)' : '缺失!'}`,
      })

      // 3. localStorage session
      const authKeys = Object.keys(localStorage).filter((k) => k.startsWith('sb-') || k.includes('auth-token'))
      let sessionDetail = '没有找到 sb-*-auth-token'
      let sessionStatus: StepStatus = 'warn'
      for (const k of authKeys) {
        try {
          const raw = localStorage.getItem(k)
          if (!raw) continue
          const parsed = JSON.parse(raw)
          const expiresAt = parsed?.expires_at ?? parsed?.currentSession?.expires_at
          const hasToken = !!(parsed?.access_token ?? parsed?.currentSession?.access_token)
          if (hasToken) {
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

      // 3b. Cookie session - names + value lengths + whether it contains an access_token
      {
        let cookieNames: string[] = []
        let cookieDetail = '没有 sb-* cookie'
        try {
          const sbCookiesRaw = document.cookie
            .split(';')
            .map((c) => c.trim())
            .filter((c) => c.startsWith('sb-'))
          cookieNames = sbCookiesRaw.map((c) => c.split('=')[0])
          const sbCookies = sbCookiesRaw.map((c) => {
            const [name, ...rest] = c.split('=')
            const val = rest.join('=')
            let info = `${val.length}字符`
            if (name.includes('code-verifier')) {
              info += ' · code-verifier'
            } else if (val.includes('access_token')) {
              info += ' · 含access_token'
            }
            return `${name}(${info})`
          })
          if (sbCookies.length) {
            const hasSession = sbCookiesRaw.some((c) => {
              const [name] = c.split('=')
              return name.endsWith('-auth-token') && !name.includes('verifier')
            })
            cookieDetail = `找到 ${sbCookies.length} 个: ${sbCookies.join(' | ')} · ${hasSession ? '有完整session' : '无完整session'}`
          }
        } catch (e) {
          cookieDetail = `读 cookie 出错: ${String(e)}`
        }
        push({
          name: '3b. Cookie 会话',
          status: cookieNames.length ? 'ok' : 'warn',
          detail: cookieDetail,
        })
      }

      // 3c. RAW connectivity to Supabase (bypasses SDK) - is the host even reachable?
      {
        const t0 = performance.now()
        const r = await withTimeout(
          fetch(`${url}/auth/v1/health`, { headers: anon ? { apikey: anon } : undefined }).then((res) => res.status),
          20000
        )
        const ms = Math.round(performance.now() - t0)
        if (r.timedOut) {
          push({ name: '3c. 直连 Supabase(健康检查)', status: 'fail', detail: `>20s 超时 - 设备根本连不到 ${url}`, ms })
        } else {
          push({ name: '3c. 直连 Supabase(健康检查)', status: 'ok', detail: `HTTP ${r.value} - 可达`, ms })
        }
      }

      // 3d. Control group: reach our own deployment origin
      {
        const t0 = performance.now()
        const r = await withTimeout(
          fetch(`${window.location.origin}/manifest.webmanifest`, { cache: 'no-store' }).then((res) => res.status),
          8000
        )
        const ms = Math.round(performance.now() - t0)
        if (r.timedOut) {
          push({ name: '3d. 对照:直连本站', status: 'fail', detail: '连自己的站点也超时 - 是整体网络问题', ms })
        } else {
          push({ name: '3d. 对照:直连本站', status: 'ok', detail: `HTTP ${r.value} - 本站正常,问题特定于 Supabase`, ms })
        }
      }

      // 3e. Server-side latency: how fast can our Vercel deployment reach Supabase?
      {
        const t0 = performance.now()
        const r = await withTimeout(
          fetch(`${window.location.origin}/api/sb-ping`, { cache: 'no-store' }).then((res) => res.json()),
          8000
        )
        const ms = Math.round(performance.now() - t0)
        if (r.timedOut) {
          push({ name: '3e. 服务端->Supabase', status: 'fail', detail: '连服务端ping也超时', ms })
        } else {
          const v = r.value as { ok?: boolean; status?: number; ms?: number; region?: string }
          push({
            name: '3e. 服务端->Supabase(关键)',
            status: v?.ok ? 'ok' : 'fail',
            detail: v?.ok
              ? `Vercel(${v.region})->Supabase 仅 ${v.ms}ms,HTTP ${v.status} - 代理可行!`
              : `服务端也连不上: ${JSON.stringify(v)}`,
            ms,
          })
        }
      }

      const supabase = createBrowserClient()

      // === 对比实验:切开「no-op lock 适配代码」与「网络/刷新」===
      // 三组对照,都关掉自动刷新(autoRefreshToken:false)以隔离"读本地
      // session"与"发网络请求刷新"两个动作。超时放到 20s(之前 8s 截断
      // 可能误杀 fetchWithTimeout 的 15s 中断)。

      // 7a. 当前生产客户端(带 no-op lock + fetchWithTimeout),不刷新
      {
        const t0 = performance.now()
        const r = await withTimeout(supabase.auth.getSession(), 20000)
        const ms = Math.round(performance.now() - t0)
        if (r.timedOut) {
          push({ name: '7a. 当前客户端(带no-op锁)', status: 'fail', detail: '>20s 超时 - 卡在拿锁或刷新', ms })
        } else {
          const s = r.value?.data.session
          push({
            name: '7a. 当前客户端(带no-op锁)',
            status: s?.user ? 'ok' : 'warn',
            detail: s?.user ? `✓ ${ms}ms 读到 user` : `${ms}ms 返回但 session=null`,
            ms,
          })
        }
      }

      // 7b. 全新客户端:浏览器原生锁(无 no-op lock),不刷新。
      //     如果 7b 秒回而 7a 卡住 -> no-op lock 就是元凶。
      {
        const fresh = createClientComponentClient<Database>({
          options: { auth: { autoRefreshToken: false, persistSession: true } },
        })
        const t0 = performance.now()
        const r = await withTimeout(fresh.auth.getSession(), 20000)
        const ms = Math.round(performance.now() - t0)
        if (r.timedOut) {
          push({ name: '7b. 原生锁(无适配)', status: 'fail', detail: '>20s 超时 - 原生锁也卡(那是网络/刷新)', ms })
        } else {
          const s = r.value?.data.session
          push({
            name: '7b. 原生锁(无适配)',
            status: s?.user ? 'ok' : 'warn',
            detail: s?.user ? `✓ ${ms}ms 读到 user - 对比 7a` : `${ms}ms 返回但 session=null`,
            ms,
          })
        }
      }

      // 7c. 开自动刷新的客户端,超时 20s - 验证刷新请求是否真的挂起(网络)
      {
        const refreshClient = createClientComponentClient<Database>({
          options: { auth: { autoRefreshToken: true, persistSession: true } },
        })
        const t0 = performance.now()
        const r = await withTimeout(refreshClient.auth.getSession(), 20000)
        const ms = Math.round(performance.now() - t0)
        if (r.timedOut) {
          push({ name: '7c. 开自动刷新', status: 'fail', detail: '>20s 超时 - 刷新请求挂起(网络)', ms })
        } else {
          const s = r.value?.data.session
          push({
            name: '7c. 开自动刷新',
            status: s?.user ? 'ok' : 'warn',
            detail: s?.user ? `✓ ${ms}ms 读到 user` : `${ms}ms 返回但 session=null`,
            ms,
          })
        }
      }

      // 7d. 经代理 getUser - 验证代理路径下 cookie 是否正常带上、token 是否被服务端接受
      {
        const t0 = performance.now()
        const r = await withTimeout(supabase.auth.getUser(), 20000)
        const ms = Math.round(performance.now() - t0)
        if (r.timedOut) {
          push({ name: '7d. 代理路径 getUser', status: 'fail', detail: '>20s 超时 - 代理请求挂起', ms })
        } else {
          const u = r.value?.data.user
          const err = r.value?.error
          push({
            name: '7d. 代理路径 getUser',
            status: u ? 'ok' : 'warn',
            detail: u ? `✓ ${ms}ms 代理读到 user=${u.id.slice(0, 8)}` : `${ms}ms · ${err?.message ?? '无user'}`,
            ms,
          })
        }
      }

      // 7e. 解码 access_token JWT 看 exp 是否过期(过期的 token 会触发刷新,刷新挂起=init 卡死)
      {
        try {
          const cookies = document.cookie.split(';').map((c) => c.trim())
          const sessionChunk = cookies
            .filter((c) => c.startsWith('sb-') && c.split('=')[0].endsWith('-auth-token') && !c.includes('verifier'))
            .map((c) => c.split('=').slice(1).join('='))
            .join('')
          if (!sessionChunk) {
            push({ name: '7e. Token 过期检查', status: 'warn', detail: '无 auth-token cookie,无法检查' })
          } else {
            const parsed = JSON.parse(decodeURIComponent(sessionChunk))
            const token = parsed?.access_token
            if (!token) {
              push({ name: '7e. Token 过期检查', status: 'warn', detail: 'cookie 无 access_token 字段' })
            } else {
              const payload = JSON.parse(atob(token.split('.')[1]))
              const exp = payload.exp
              const now = Math.floor(Date.now() / 1000)
              const remainMin = Math.round((exp - now) / 60)
              push({
                name: '7e. Token 过期检查',
                status: remainMin > 0 ? 'ok' : 'warn',
                detail: `exp=${new Date(exp * 1000).toLocaleString()} · ${remainMin > 0 ? `还剩${remainMin}分钟` : `已过期${-remainMin}分钟(会触发刷新!)`}`,
              })
            }
          }
        } catch (e) {
          push({ name: '7e. Token 过期检查', status: 'warn', detail: `解析失败: ${String(e).slice(0, 80)}` })
        }
      }

      // 7f. 关键判决:绕过 auth-helpers,用原生 supabase-js + cookie 适配器,
      //     autoRefreshToken:false(原生客户端不会强制覆盖)。
      //     如果 7f 秒回而 7a/7b/7c 全卡 -> 卡点是「auth-helpers 强制开启的
      //     autoRefreshToken 在 init 阶段触发的刷新请求挂起」。
      {
        const storageKey = `sb-${url.replace('https://', '').split('.')[0]}-auth-token`
        const directClient = createClient<Database>(url, anon, {
          auth: {
            autoRefreshToken: false,
            persistSession: true,
            detectSessionInUrl: false,
            storage: new BrowserCookieAuthStorageAdapter(),
            storageKey,
          },
        })
        const t0 = performance.now()
        const r = await withTimeout(directClient.auth.getSession(), 20000)
        const ms = Math.round(performance.now() - t0)
        if (r.timedOut) {
          push({ name: '7f. 原生客户端·关刷新(关键)', status: 'fail', detail: `>20s 超时 - 不刷新也卡,说明卡点在刷新之外(storage/锁)。key=${storageKey}`, ms })
        } else {
          const s = r.value?.data.session
          push({
            name: '7f. 原生客户端·关刷新(关键)',
            status: s?.user ? 'ok' : 'warn',
            detail: s?.user ? `✓ ${ms}ms 读到 user - 关刷新后正常!卡点=刷新` : `${ms}ms 返回 null · ${r.value?.error?.message ?? ''}`,
            ms,
          })
        }
      }

      // 5. getUser() 已合并到 7d,此处删除避免重复

      // 6. Real data query - the actual failing path
      {
        const today = new Date().toISOString().split('T')[0]
        const t0 = performance.now()
        const r = await withTimeout(
          supabase.from('daily_reflections').select('local_date').order('local_date', { ascending: false }).limit(5),
          20000
        )
        const ms = Math.round(performance.now() - t0)
        if (r.timedOut) {
          push({ name: '6. 真实数据查询', status: 'fail', detail: `>20s 超时 - 查询挂起 (today=${today})`, ms })
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
        {done ? '检测完成 - 请截图或点下方复制发给开发者' : '检测中…'}
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
