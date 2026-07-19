# 记录页 UI 骨架 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `src/features/records/components/records-page-client.tsx` 从旧的 5 tab(睡眠/运动/阅读/复盘/周报)结构重构为新 4 tab(记录/睡眠/复盘/回顾)结构,复盘 tab 从内联表单改为跳转独立路由,睡眠 tab 去掉手动录入。

**Architecture:** 保持 client-side tab 切换模式(useState),记录 tab 内嵌子 tab 切换(记录列表 / 趋势)。复盘 tab 复用现有 `reflection-view.tsx` 的月历+历史列表部分,只把"写今日复盘"从内联展开改为跳转到 `/records/reflection/today` 新路由(单独页面,复用 `useReflectionStore` 编辑今日复盘)。记录/回顾 tab 因数据模型下阶段做,本阶段先渲染"数据模型建设中"占位。运动/阅读/周报组件不删除文件(下阶段判断是否复用),只从 records-page-client 中不再引用。

**Tech Stack:** Next.js 14 App Router / React 18 client components / Zustand / Tailwind 现有 rhythm token / Supabase(通过 `createBrowserClient`)

---

## Scope

本计划只做 UI 骨架:
- 重构 `records-page-client.tsx`(4 tab + 记录 tab 内子 tab)
- 抽 `reflection-view.tsx` 的"月历+历史列表"部分为独立组件 `reflection-history.tsx`,让主 tab 只显示月历+CTA+历史列表
- 新增独立路由 `/records/reflection/today`,复用 `useReflectionStore` 做今日复盘编辑(不改 store)
- 睡眠 tab:直接嵌 `SleepAnalysis`,去掉"记录睡眠"按钮
- 记录/回顾 tab:占位组件 `<TabPlaceholder />`
- 无数据库迁移、无新表、无微信读书同步改动

不做:实践列表 CRUD、趋势图表接线真实数据、周回顾生成、AI 观察组件、路由级中间件调整。

---

## File Structure

**新增:**
- `src/features/records/components/records-tabs.tsx` — 顶部主 4 tab 分段切换组件(受控组件,props: `active`, `onChange`)
- `src/features/records/components/records-sub-tabs.tsx` — 子 tab(记录/趋势)分段切换组件(受控)
- `src/features/records/components/tab-placeholder.tsx` — 空 tab 占位(如"数据模型建设中")
- `src/features/records/components/reflection-history.tsx` — 从 `reflection-view.tsx` 抽出的月历 + 历史列表部分(纯只读)
- `src/features/records/components/reflection-cta.tsx` — "写今日复盘"按钮(Link → `/records/reflection/today`)
- `src/features/records/components/reflection-detail-page.tsx` — 今日复盘编辑页 client 组件(复用 `useReflectionStore` 已有的写/读逻辑)
- `src/app/records/reflection/today/page.tsx` — App Router 路由,套 `AppLayout` 并渲染 `<ReflectionDetailPage />`
- `tests/records-tabs.test.ts` — 测 tab 切换回调
- `tests/records-sub-tabs.test.ts` — 测子 tab 切换回调
- `tests/reflection-cta.test.ts` — 测 CTA 生成正确的链接

**修改:**
- `src/features/records/components/records-page-client.tsx` — 全量重写(用 Read 后 Write 整替),旧 5 tab 结构删,改为新 4 tab
- `src/features/records/components/reflection-view.tsx` — 保留导出,但作为"复盘 tab 主体"退化到只组合 `<ReflectionHistory />` + `<ReflectionCTA />`(内部表单代码删除)。为避免破坏现有引用,继续导出 `ReflectionView` 组件名

**不动:**
- `src/features/records/store/reflection-store` 逻辑(继续用现有 `useReflectionStore`,`saveReflection` 逻辑不变)
- 现有 sleep/reading/exercise/goal/weekly-report 组件文件(下阶段处理)
- 现有 supabase database.types.ts

---

## Task 1: 创建 tab-placeholder 组件

**Files:**
- Create: `src/features/records/components/tab-placeholder.tsx`

- [ ] **Step 1: Write component**

```tsx
// src/features/records/components/tab-placeholder.tsx
'use client'

export function TabPlaceholder({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="r-card p-10 text-center">
      <p className="r-title text-base text-rhythm-text-secondary">{title}</p>
      <p className="text-rhythm-text-muted text-xs mt-2">{hint}</p>
    </div>
  )
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS (no errors related to the new file)

- [ ] **Step 3: Commit**

```bash
git add src/features/records/components/tab-placeholder.tsx
git commit -m "feat(records): add TabPlaceholder for empty tab states"
```

---

## Task 2: 创建 records-tabs 主 tab 切换组件

**Files:**
- Create: `src/features/records/components/records-tabs.tsx`
- Test: `tests/records-tabs.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/records-tabs.test.ts
import assert from 'node:assert/strict'
import test from 'node:test'

import { RECORDS_TABS, isRecordsTab, type RecordsTab } from '../src/features/records/components/records-tabs.ts'

test('records tabs list is fixed to the four supported tabs in order', () => {
  assert.deepEqual(
    RECORDS_TABS.map((t) => t.id),
    ['records', 'sleep', 'reflection', 'review'] satisfies RecordsTab[],
  )
})

test('isRecordsTab guards unknown ids', () => {
  assert.equal(isRecordsTab('records'), true)
  assert.equal(isRecordsTab('reflection'), true)
  assert.equal(isRecordsTab('exercise'), false)
  assert.equal(isRecordsTab(''), false)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --test-name-pattern="records tabs"`
Expected: FAIL — cannot find module `records-tabs.ts`

- [ ] **Step 3: Write implementation**

```tsx
// src/features/records/components/records-tabs.tsx
'use client'

export type RecordsTab = 'records' | 'sleep' | 'reflection' | 'review'

export const RECORDS_TABS: { id: RecordsTab; label: string }[] = [
  { id: 'records', label: '记录' },
  { id: 'sleep', label: '睡眠' },
  { id: 'reflection', label: '复盘' },
  { id: 'review', label: '回顾' },
]

export function isRecordsTab(value: string): value is RecordsTab {
  return RECORDS_TABS.some((t) => t.id === value)
}

export function RecordsTabs({
  active,
  onChange,
}: {
  active: RecordsTab
  onChange: (t: RecordsTab) => void
}) {
  return (
    <div
      className="flex gap-1 rounded-xl p-1 border border-rhythm-border bg-rhythm-void/40"
      role="tablist"
      aria-label="记录页分类"
    >
      {RECORDS_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium tracking-[0.04em] transition-all ${
            active === tab.id
              ? 'text-rhythm-text-primary bg-rhythm-glow-soft border border-rhythm-border-strong'
              : 'text-rhythm-text-muted hover:text-rhythm-text-secondary border border-transparent'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --test-name-pattern="records tabs"`
Expected: PASS both tests

- [ ] **Step 5: Commit**

```bash
git add src/features/records/components/records-tabs.tsx tests/records-tabs.test.ts
git commit -m "feat(records): add RecordsTabs top-level 4-tab switcher"
```

---

## Task 3: 创建 records-sub-tabs 子 tab 切换组件

**Files:**
- Create: `src/features/records/components/records-sub-tabs.tsx`
- Test: `tests/records-sub-tabs.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/records-sub-tabs.test.ts
import assert from 'node:assert/strict'
import test from 'node:test'

import { RECORDS_SUB_TABS, isRecordsSubTab, type RecordsSubTab } from '../src/features/records/components/records-sub-tabs.ts'

test('records sub-tabs are list/trends only', () => {
  assert.deepEqual(
    RECORDS_SUB_TABS.map((t) => t.id),
    ['list', 'trends'] satisfies RecordsSubTab[],
  )
})

test('isRecordsSubTab rejects unknown ids', () => {
  assert.equal(isRecordsSubTab('list'), true)
  assert.equal(isRecordsSubTab('trends'), true)
  assert.equal(isRecordsSubTab('data'), false)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --test-name-pattern="records sub-tabs"`
Expected: FAIL — module not found

- [ ] **Step 3: Write implementation**

```tsx
// src/features/records/components/records-sub-tabs.tsx
'use client'

export type RecordsSubTab = 'list' | 'trends'

export const RECORDS_SUB_TABS: { id: RecordsSubTab; label: string }[] = [
  { id: 'list', label: '记录' },
  { id: 'trends', label: '趋势' },
]

export function isRecordsSubTab(value: string): value is RecordsSubTab {
  return RECORDS_SUB_TABS.some((t) => t.id === value)
}

export function RecordsSubTabs({
  active,
  onChange,
}: {
  active: RecordsSubTab
  onChange: (t: RecordsSubTab) => void
}) {
  return (
    <div
      className="flex gap-4 border-b border-rhythm-border"
      role="tablist"
      aria-label="实践记录视图"
    >
      {RECORDS_SUB_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={`pb-2 text-xs tracking-[0.06em] transition-colors border-b-2 -mb-px ${
            active === tab.id
              ? 'text-rhythm-glow border-rhythm-glow'
              : 'text-rhythm-text-muted border-transparent hover:text-rhythm-text-secondary'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run test**

Run: `npm test -- --test-name-pattern="records sub-tabs"`
Expected: PASS both tests

- [ ] **Step 5: Commit**

```bash
git add src/features/records/components/records-sub-tabs.tsx tests/records-sub-tabs.test.ts
git commit -m "feat(records): add RecordsSubTabs list/trends switcher"
```

---

## Task 4: 抽出 ReflectionHistory 只读组件

**Files:**
- Create: `src/features/records/components/reflection-history.tsx`

- [ ] **Step 1: Read the existing reflection-view.tsx to see the calendar + history JSX to copy from**

Run: `cat src/features/records/components/reflection-view.tsx | head -320`

The pieces to reuse:
- `MOOD_META` map
- `WEEK_LABELS`
- `formatCardDate` helper
- Calendar rendering (`.r-card` with `<div className="grid grid-cols-7 gap-1.5">`)
- History mapping (each history entry as an `r-card`)
- Jump-to-date scroll interaction

- [ ] **Step 2: Create the new file with the extracted logic**

```tsx
// src/features/records/components/reflection-history.tsx
'use client'

import { useEffect, useState } from 'react'
import { useReflectionStore } from '@/features/records/components/reflection-view'

const WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日']
type Mood = 'great' | 'fair' | 'poor'
const MOOD_META: Record<Mood, { label: string; icon: string }> = {
  great: { label: '很好', icon: '😊' },
  fair: { label: '一般', icon: '😐' },
  poor: { label: '较差', icon: '😞' },
}

function formatCardDate(localDate: string): string {
  const [y, m, d] = localDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()]
  return `${m}月${d}日 周${weekday}`
}

export function ReflectionHistory() {
  const { history, isLoadingHistory, loadHistory } = useReflectionStore()
  const [localDate] = useState(() => new Date().toISOString().split('T')[0])
  const [highlightedDate, setHighlightedDate] = useState<string | null>(null)

  const [viewMonth, setViewMonth] = useState(() => {
    const [y, m] = localDate.split('-').map(Number)
    return { year: y, month: m }
  })

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const datesWithReflection = new Set(history.map((r) => r.local_date))

  const jumpToDate = (date: string) => {
    const el = document.getElementById(`reflection-${date}`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setHighlightedDate(date)
    setTimeout(() => setHighlightedDate(null), 1600)
  }

  const firstDay = new Date(viewMonth.year, viewMonth.month - 1, 1)
  const daysInMonth = new Date(viewMonth.year, viewMonth.month, 0).getDate()
  const leadingBlanks = (firstDay.getDay() + 6) % 7
  const calendarCells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const prevMonth = () =>
    setViewMonth((v) => (v.month === 1 ? { year: v.year - 1, month: 12 } : { year: v.year, month: v.month - 1 }))
  const nextMonth = () =>
    setViewMonth((v) => (v.month === 12 ? { year: v.year + 1, month: 1 } : { year: v.year, month: v.month + 1 }))

  const pad = (n: number) => String(n).padStart(2, '0')
  const cellDate = (day: number) => `${viewMonth.year}-${pad(viewMonth.month)}-${pad(day)}`

  return (
    <div className="space-y-5">
      <div className="r-card p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={prevMonth}
            className="w-8 h-8 rounded-lg text-rhythm-text-muted hover:text-rhythm-text-primary hover:bg-rhythm-void/40 transition-colors"
            aria-label="上个月"
          >
            ‹
          </button>
          <p className="text-sm font-medium text-rhythm-text-primary tracking-[0.04em]">
            {viewMonth.year}年{viewMonth.month}月
          </p>
          <button
            type="button"
            onClick={nextMonth}
            className="w-8 h-8 rounded-lg text-rhythm-text-muted hover:text-rhythm-text-primary hover:bg-rhythm-void/40 transition-colors"
            aria-label="下个月"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {WEEK_LABELS.map((w) => (
            <div key={w} className="text-center text-[10px] text-rhythm-text-muted py-1">
              {w}
            </div>
          ))}
          {calendarCells.map((day, i) => {
            if (day === null) return <div key={`b-${i}`} />
            const date = cellDate(day)
            const has = datesWithReflection.has(date)
            const isToday = date === localDate
            return (
              <button
                key={date}
                type="button"
                disabled={!has}
                onClick={() => jumpToDate(date)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
                  isToday ? 'border border-rhythm-border-strong text-rhythm-text-primary' : ''
                } ${
                  has
                    ? 'text-rhythm-text-primary hover:bg-rhythm-glow-soft cursor-pointer'
                    : 'text-rhythm-text-muted cursor-default'
                }`}
              >
                <span>{day}</span>
                {has && <span className="w-1 h-1 rounded-full bg-rhythm-text-secondary" />}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-3">
        <p className="r-eyebrow">历史复盘</p>

        {isLoadingHistory ? (
          <p className="text-sm text-rhythm-text-muted py-6 text-center">加载中...</p>
        ) : history.length === 0 ? (
          <div className="r-card p-6 text-center">
            <p className="text-sm text-rhythm-text-secondary mb-1">还没有复盘记录</p>
            <p className="text-xs text-rhythm-text-muted">从今天开始，记录一天的收获与感受吧。</p>
          </div>
        ) : (
          history.map((r) => {
            const moodMeta = r.mood ? MOOD_META[r.mood as Mood] : null
            const rows = [
              { label: '最满意', value: r.best_thing },
              { label: '改进', value: r.improve_thing },
              { label: '明日', value: r.tomorrow_focus },
              { label: '备注', value: r.note },
            ].filter((row) => row.value)
            return (
              <div
                key={r.local_date}
                id={`reflection-${r.local_date}`}
                className={`r-card p-4 transition-colors ${
                  highlightedDate === r.local_date ? 'border-rhythm-border-strong bg-rhythm-glow-soft' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-rhythm-text-secondary">{formatCardDate(r.local_date)}</span>
                    {moodMeta && (
                      <span className="text-xs text-rhythm-text-muted">
                        {moodMeta.icon} {moodMeta.label}
                      </span>
                    )}
                  </div>
                </div>

                {rows.length > 0 ? (
                  <div className="space-y-1.5">
                    {rows.map((row) => (
                      <div key={row.label} className="flex gap-2 text-sm">
                        <span className="text-xs text-rhythm-text-muted shrink-0 w-10 pt-0.5">{row.label}</span>
                        <span className="text-rhythm-text-primary break-words">{row.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-rhythm-text-muted">当天只记录了心情</p>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/features/records/components/reflection-history.tsx
git commit -m "feat(records): extract read-only ReflectionHistory (calendar + list)"
```

Note: this file imports `useReflectionStore` from `reflection-view` — that export is preserved. Task 6 refactors `reflection-view.tsx` to compose this component, but does NOT rename `useReflectionStore`.

---

## Task 5: 创建 ReflectionCTA 跳转按钮

**Files:**
- Create: `src/features/records/components/reflection-cta.tsx`
- Test: `tests/reflection-cta.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/reflection-cta.test.ts
import assert from 'node:assert/strict'
import test from 'node:test'

import { REFLECTION_TODAY_HREF } from '../src/features/records/components/reflection-cta.ts'

test('reflection CTA points to /records/reflection/today', () => {
  assert.equal(REFLECTION_TODAY_HREF, '/records/reflection/today')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --test-name-pattern="reflection CTA"`
Expected: FAIL — module not found

- [ ] **Step 3: Write implementation**

```tsx
// src/features/records/components/reflection-cta.tsx
'use client'

import Link from 'next/link'

export const REFLECTION_TODAY_HREF = '/records/reflection/today'

export function ReflectionCTA({ hasReflection }: { hasReflection: boolean }) {
  return (
    <Link href={REFLECTION_TODAY_HREF} className="r-btn-primary w-full flex items-center justify-center">
      {hasReflection ? '✎ 编辑今日复盘' : '+ 写今日复盘'}
    </Link>
  )
}
```

- [ ] **Step 4: Run test**

Run: `npm test -- --test-name-pattern="reflection CTA"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/records/components/reflection-cta.tsx tests/reflection-cta.test.ts
git commit -m "feat(records): add ReflectionCTA linking to today reflection page"
```

---

## Task 6: 重构 reflection-view 组合子组件

**Files:**
- Modify: `src/features/records/components/reflection-view.tsx`(全量重写内容,但保留 `useReflectionStore` 和 `ReflectionView` 导出名)

- [ ] **Step 1: Read the current file to preserve the store definition**

The `useReflectionStore` definition (zustand `create()` call, ~90 lines starting at "export const useReflectionStore") must remain byte-identical so that Task 4's ReflectionHistory and existing callers keep working.

- [ ] **Step 2: Overwrite reflection-view.tsx**

```tsx
// src/features/records/components/reflection-view.tsx
'use client'

import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { createBrowserClient, getCurrentUser } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'
import { ReflectionHistory } from '@/features/records/components/reflection-history'
import { ReflectionCTA } from '@/features/records/components/reflection-cta'

type Reflection = Database['public']['Tables']['daily_reflections']['Row']
type Mood = 'great' | 'fair' | 'poor'

interface ReflectionState {
  todayReflection: Reflection | null
  history: Reflection[]
  isSaving: boolean
  isLoadingHistory: boolean

  loadToday: (localDate: string) => Promise<void>
  loadHistory: () => Promise<void>
  saveReflection: (data: {
    local_date: string
    mood: Mood | null
    best_thing: string | null
    improve_thing: string | null
    tomorrow_focus: string | null
    note: string | null
    is_shared: boolean
  }) => Promise<{ error: string | null }>
}

export const useReflectionStore = create<ReflectionState>((set) => ({
  todayReflection: null,
  history: [],
  isSaving: false,
  isLoadingHistory: true,

  loadToday: async (localDate) => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return

    const { data } = await supabase
      .from('daily_reflections')
      .select('*')
      .eq('user_id', user.id)
      .eq('local_date', localDate)
      .maybeSingle()

    set({ todayReflection: data ?? null })
  },

  loadHistory: async () => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) {
      set({ isLoadingHistory: false })
      return
    }

    const { data } = await supabase
      .from('daily_reflections')
      .select('*')
      .eq('user_id', user.id)
      .order('local_date', { ascending: false })
      .limit(90)

    set({ history: data ?? [], isLoadingHistory: false })
  },

  saveReflection: async (data) => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return { error: 'Not authenticated' }

    set({ isSaving: true })

    const { error } = await supabase.from('daily_reflections').upsert({
      user_id: user.id,
      local_date: data.local_date,
      mood: data.mood,
      best_thing: data.best_thing,
      improve_thing: data.improve_thing,
      tomorrow_focus: data.tomorrow_focus,
      note: data.note,
      is_shared: data.is_shared,
    }, { onConflict: 'user_id,local_date' })

    set({ isSaving: false })
    if (!error) {
      await useReflectionStore.getState().loadToday(data.local_date)
      await useReflectionStore.getState().loadHistory()
    }
    return { error: error?.message ?? null }
  },
}))

export function ReflectionView() {
  const { todayReflection, loadToday } = useReflectionStore()
  const [localDate] = useState(() => new Date().toISOString().split('T')[0])

  useEffect(() => {
    loadToday(localDate)
  }, [localDate, loadToday])

  return (
    <div className="space-y-4">
      <ReflectionCTA hasReflection={!!todayReflection} />
      <ReflectionHistory />
    </div>
  )
}
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Run all node tests**

Run: `npm test`
Expected: PASS (existing 3 test files + 3 new ones from Tasks 2/3/5)

- [ ] **Step 5: Commit**

```bash
git add src/features/records/components/reflection-view.tsx
git commit -m "refactor(records): reduce ReflectionView to compose CTA + history"
```

---

## Task 7: 创建今日复盘详情页组件

**Files:**
- Create: `src/features/records/components/reflection-detail-page.tsx`

- [ ] **Step 1: Write component**

```tsx
// src/features/records/components/reflection-detail-page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/features/app/components/auth-guard'
import { useReflectionStore } from '@/features/records/components/reflection-view'

type Mood = 'great' | 'fair' | 'poor'

function formatToday(): { display: string; iso: string } {
  const now = new Date()
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()]
  const m = now.getMonth() + 1
  const d = now.getDate()
  const iso = `${now.getFullYear()}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  return { display: `${m}月${d}日 · 周${weekday}`, iso }
}

export function ReflectionDetailPage() {
  const router = useRouter()
  const { todayReflection, isSaving, loadToday, saveReflection } = useReflectionStore()
  const [{ display: dateDisplay, iso: localDate }] = useState(formatToday)

  const [mood, setMood] = useState<Mood | null>(null)
  const [bestThing, setBestThing] = useState('')
  const [improveThing, setImproveThing] = useState('')
  const [tomorrowFocus, setTomorrowFocus] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadToday(localDate)
  }, [localDate, loadToday])

  useEffect(() => {
    if (todayReflection) {
      setMood(todayReflection.mood as Mood | null)
      setBestThing(todayReflection.best_thing ?? '')
      setImproveThing(todayReflection.improve_thing ?? '')
      setTomorrowFocus(todayReflection.tomorrow_focus ?? '')
      setNote(todayReflection.note ?? '')
    }
  }, [todayReflection])

  const filledCount =
    (mood ? 1 : 0) +
    (bestThing.trim() ? 1 : 0) +
    (improveThing.trim() ? 1 : 0) +
    (tomorrowFocus.trim() ? 1 : 0) +
    (note.trim() ? 1 : 0)

  const handleSave = async () => {
    setError(null)
    const result = await saveReflection({
      local_date: localDate,
      mood,
      best_thing: bestThing || null,
      improve_thing: improveThing || null,
      tomorrow_focus: tomorrowFocus || null,
      note: note || null,
      is_shared: false,
    })
    if (result.error) {
      setError(result.error)
      return
    }
    router.push('/records')
  }

  return (
    <AuthGuard>
      <div className="p-5 pb-24 space-y-6">
        <div className="text-center pt-2">
          <p className="r-eyebrow">Today</p>
          <h1 className="r-title text-xl mt-1">{dateDisplay}</h1>
          <p className="text-xs text-rhythm-text-muted mt-1">此刻 · 记下今天的收获与念头</p>
        </div>

        <div className="r-card p-4">
          <p className="r-label text-center mb-3">今天整体状态</p>
          <div className="flex gap-2">
            {([
              { value: 'great', label: '很好', icon: '😊' },
              { value: 'fair', label: '一般', icon: '😐' },
              { value: 'poor', label: '较差', icon: '😞' },
            ] as const).map(({ value, label, icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setMood(value)}
                className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border transition-colors ${
                  mood === value
                    ? 'border-rhythm-border-strong bg-rhythm-glow-soft text-rhythm-text-primary'
                    : 'border-rhythm-border text-rhythm-text-secondary hover:bg-rhythm-void/40'
                }`}
              >
                <span className="text-xl">{icon}</span>
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="r-card p-4">
          <label className="r-label">今天最满意的一件事</label>
          <input
            type="text"
            value={bestThing}
            onChange={(e) => setBestThing(e.target.value)}
            placeholder="无论多小都行..."
            className="r-input"
          />
        </div>

        <div className="r-card p-4">
          <label className="r-label">今天最需要改进的</label>
          <input
            type="text"
            value={improveThing}
            onChange={(e) => setImproveThing(e.target.value)}
            placeholder="不用太苛责自己"
            className="r-input"
          />
        </div>

        <div className="r-card p-4">
          <label className="r-label">明天最重要的一件事</label>
          <input
            type="text"
            value={tomorrowFocus}
            onChange={(e) => setTomorrowFocus(e.target.value)}
            placeholder="明天最想完成什么？"
            className="r-input"
          />
        </div>

        <div className="r-card p-4">
          <label className="r-label">自由备注</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="随便说点什么..."
            rows={4}
            className="r-input resize-none"
          />
        </div>

        {error && <p className="text-sm text-rhythm-danger px-2">{error}</p>}
      </div>

      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg z-20 backdrop-blur-md bg-rhythm-void/85 border-t border-rhythm-border"
      >
        <div className="flex items-center gap-3 px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <p className="text-xs text-rhythm-text-muted flex-1">
            <b className="text-rhythm-text-secondary">{filledCount}</b> 项已填
          </p>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="r-btn-primary px-6 disabled:opacity-50"
          >
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </AuthGuard>
  )
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/features/records/components/reflection-detail-page.tsx
git commit -m "feat(records): add today reflection detail page component"
```

---

## Task 8: 挂载 /records/reflection/today 路由

**Files:**
- Create: `src/app/records/reflection/today/page.tsx`

- [ ] **Step 1: Write page**

```tsx
// src/app/records/reflection/today/page.tsx
import { AppLayout } from '@/features/app/components/app-layout'
import { ReflectionDetailPage } from '@/features/records/components/reflection-detail-page'

export default function ReflectionTodayPage() {
  return (
    <AppLayout>
      <ReflectionDetailPage />
    </AppLayout>
  )
}
```

- [ ] **Step 2: Run dev build to verify route compiles**

Run: `npm run build`
Expected: build succeeds, output includes `/records/reflection/today`.

- [ ] **Step 3: Commit**

```bash
git add src/app/records/reflection/today/page.tsx
git commit -m "feat(records): route /records/reflection/today"
```

---

## Task 9: 重写 records-page-client 为新 4 tab 结构

**Files:**
- Modify: `src/features/records/components/records-page-client.tsx`(全量重写)

- [ ] **Step 1: Overwrite records-page-client.tsx**

```tsx
// src/features/records/components/records-page-client.tsx
'use client'

import { useState } from 'react'
import { AuthGuard } from '@/features/app/components/auth-guard'
import { SleepAnalysis } from '@/features/records/components/sleep-analysis'
import { ReflectionView } from '@/features/records/components/reflection-view'
import { RecordsTabs, type RecordsTab } from '@/features/records/components/records-tabs'
import { RecordsSubTabs, type RecordsSubTab } from '@/features/records/components/records-sub-tabs'
import { TabPlaceholder } from '@/features/records/components/tab-placeholder'

export default function RecordsPageClient() {
  const [activeTab, setActiveTab] = useState<RecordsTab>('records')
  const [activeSubTab, setActiveSubTab] = useState<RecordsSubTab>('list')

  return (
    <AuthGuard>
      <div className="p-5 space-y-5">
        <RecordsTabs active={activeTab} onChange={setActiveTab} />

        {activeTab === 'records' && (
          <div className="space-y-4">
            <RecordsSubTabs active={activeSubTab} onChange={setActiveSubTab} />
            {activeSubTab === 'list' ? (
              <TabPlaceholder
                title="实践记录建设中"
                hint="下阶段接入实践数据后,这里会显示所有实践的轮次与时间线"
              />
            ) : (
              <TabPlaceholder
                title="趋势建设中"
                hint="完成率对比、方法沉淀累计、睡眠时长、复盘节奏等图表"
              />
            )}
          </div>
        )}

        {activeTab === 'sleep' && <SleepAnalysis />}

        {activeTab === 'reflection' && <ReflectionView />}

        {activeTab === 'review' && (
          <TabPlaceholder
            title="AI 周回顾建设中"
            hint="每周日自动生成,含数据摘要、观察与建议"
          />
        )}
      </div>
    </AuthGuard>
  )
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Manual smoke test in browser**

Run: `npm run dev`
Then in a browser at `http://localhost:3000/records`:
- Tab 「记录」 显示子 tab 记录/趋势,两个 tab 都显示占位卡
- Tab 「睡眠」 只显示 SleepAnalysis(无"记录睡眠"按钮)
- Tab 「复盘」 显示月历 + "写今日复盘" 按钮 + 历史列表
- Tab 「回顾」 显示占位卡
- 点击「写今日复盘」 → 跳到 `/records/reflection/today`,可以填写并保存,保存后返回 `/records`

- [ ] **Step 4: Commit**

```bash
git add src/features/records/components/records-page-client.tsx
git commit -m "refactor(records): rewrite page-client to 4-tab structure (records/sleep/reflection/review)"
```

---

## Task 10: 清理并确认

**Files:**
- No file changes; verification only.

- [ ] **Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass (existing 3 + new 3 = 6 test files)

- [ ] **Step 2: Run typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: Both succeed.

- [ ] **Step 3: Verify these still work in dev**

Run `npm run dev` and click through:
- `/today` — 未受影响
- `/plan` (或对应路由) — 未受影响
- `/records` — 新 4 tab
- `/records/reflection/today` — 今日复盘编辑,保存返回

- [ ] **Step 4: (optional) Clean up unused imports**

`records-page-client.tsx` 不再引用 `ExerciseForm/ExerciseAnalysis/ReadingView/ReadingHighlights/WeeklyReport/SleepForm`。这些组件文件本身仍保留(下阶段决定是否复用/删除)。

- [ ] **Step 5: Commit if any cleanup**

```bash
git commit --allow-empty -m "chore(records): task 10 verification checkpoint"
```

---

## Self-Review Notes

**Spec coverage:**
- Spec §2 顶层 4 tab → Task 2 + Task 9 ✓
- Spec §3 记录 tab 内子 tab → Task 3 + Task 9 ✓
- Spec §3 记录列表 / 趋势 → 本计划用占位替代(spec §12 明确"数据模型下阶段做")✓
- Spec §4 睡眠去手动录入 → Task 9(只嵌 SleepAnalysis)✓
- Spec §5 复盘复用现有 + 独立详情页 → Tasks 4, 5, 6, 7, 8 ✓
- Spec §6 回顾 → 占位(下阶段做)✓
- Spec §7 AI 观察规范 → 无占位内容,下阶段做 ✓

**Type consistency:**
- `RecordsTab` 4 值(records/sleep/reflection/review)在 Task 2 定义并被 Task 9 消费 ✓
- `RecordsSubTab` 2 值(list/trends)在 Task 3 定义并被 Task 9 消费 ✓
- `useReflectionStore` 在 Task 6 保留原样,被 Task 4 和 Task 7 消费 ✓
- `REFLECTION_TODAY_HREF` 常量在 Task 5 定义,与 Task 8 路由匹配 ✓

**Placeholder scan:** 无 TODO / TBD / 未定义引用。

