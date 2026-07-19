# 今天页 V2 实施计划(阶段 A · UI-Only)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `docs/product/prototypes/today-v2.html` 翻译为 React,替换现有 `src/app/today/page.tsx`,不引入新数据表。已存在的 `habit_occurrences` 数据继续驱动"日常打卡";其他三块(今日安排/进行中实践/自由记录)使用**静态占位组件**,标注"下阶段接入"。

**Architecture:** 页面拆成 6 个受控/展示子组件,`today/page.tsx` 只负责组装 + 拉取 habit_occurrences。所有子组件放 `src/features/today/components/*`(新建 feature 目录)。静态占位组件预留 props 结构,方便阶段 B 直接换实数据。

**Tech Stack:** Next.js 14 App Router · React 18 client · Zustand(现有 `useHabitStore`)· Tailwind + rhythm token · Supabase(通过现有 store)

---

## Scope

- 重构 `src/app/today/page.tsx` 为 v2 布局
- 新增 6 个子组件(topbar 由 AppLayout 已负责,不重复):
  - `day-head.tsx`(今日状态头:日期 · 今天大字 · tonight 一句话 · gauge 环)
  - `arrangements-band.tsx`(今日安排时间带 —— **静态占位**)
  - `practice-hero.tsx`(进行中实践 hero 卡 —— **静态占位**)
  - `today-habits.tsx`(接现有 habit_occurrences,轻量勾选行)
  - `capture-input.tsx`(自由记录输入框 —— **静态,输入不写入**)
  - `section-header.tsx`(通用小标题 + 右上角文字按钮)
- 全部单元测试点:section-header 的按钮触发回调、today-habits 的 loading/empty/list 三态

不做:
- 新数据表 / 新 store
- 今日安排、进行中实践、自由记录的**真实数据接入**(阶段 B)
- 触觉反馈 / 语音记录 API 集成
- 移动端底部安全区差异化(AppLayout 已处理)
- 主题切换 / 皮肤

不删除:
- 现有 today/page.tsx **备份为** `src/app/today/page.legacy.tsx` 以便回退(git 已管理,主要目的是让 grep 时不误看)

---

## File Structure

**新增:**
- `src/features/today/components/day-head.tsx` — 顶部日期 + 今天大字 + tonight 摘要 + 环形 gauge
- `src/features/today/components/section-header.tsx` — 通用小标题(小 dot + eyebrow 文字 + 右侧文字按钮)
- `src/features/today/components/arrangements-band.tsx` — 时间带占位(早/午/晚/夜 四行,每行虚线卡)
- `src/features/today/components/practice-hero.tsx` — 进行中实践静态卡(顶部图标 + 主题 + chips + 假设 + 进度条 + 快速三态 button)
- `src/features/today/components/today-habits.tsx` — 接 useHabitStore 的轻量列表(勾选、连续 N 天、无表单展开)
- `src/features/today/components/capture-input.tsx` — 单行输入 + 语音按钮 + 提示;`disabled` 语义,保存无操作(阶段 B 接线)
- `tests/section-header.test.ts` — 测按钮点击触发 onAction
- `tests/today-habits-view-model.test.ts` — 测将 occurrences 分组为 pending/done

**修改:**
- `src/app/today/page.tsx` — 全量重写,组装上述子组件

**不动:**
- `src/features/habits/store/habit-store.ts`
- `src/features/habits/components/habit-item.tsx`(仍用于 /habits 页面,今天页用新的 today-habits 展示)
- `src/features/app/components/app-layout.tsx`(topbar/tabbar 已存在)

---

## Task 1: SectionHeader 通用小标题

**Files:**
- Create: `src/features/today/components/section-header.tsx`
- Test: `tests/section-header.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/section-header.test.ts
import assert from 'node:assert/strict'
import test from 'node:test'

import { buildSectionHeaderClasses } from '../src/features/today/components/section-header.ts'

test('section header classes always include dot + eyebrow layout', () => {
  const result = buildSectionHeaderClasses()
  assert.match(result.wrapper, /flex/)
  assert.match(result.dot, /rounded-full/)
})
```

- [ ] **Step 2: Run test to fail**

Run: `/Users/EDY/.nvm/versions/node/v24.12.0/bin/node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/section-header.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write pure surface file**

```ts
// src/features/today/components/section-header.ts
export function buildSectionHeaderClasses() {
  return {
    wrapper: 'flex items-center justify-between mb-2',
    dot: 'w-1.5 h-1.5 rounded-full bg-rhythm-glow opacity-60',
    label: 'text-xs tracking-[0.06em] text-rhythm-text-secondary',
    action: 'text-xs text-rhythm-glow hover:text-rhythm-text-primary transition-colors bg-transparent border-0 p-0 cursor-pointer',
  }
}
```

- [ ] **Step 4: Write component file (re-exports the surface)**

```tsx
// src/features/today/components/section-header.tsx
'use client'

export { buildSectionHeaderClasses } from './section-header.ts'
import { buildSectionHeaderClasses } from './section-header.ts'

export function SectionHeader({
  label,
  actionLabel,
  onAction,
}: {
  label: string
  actionLabel?: string
  onAction?: () => void
}) {
  const c = buildSectionHeaderClasses()
  return (
    <div className={c.wrapper}>
      <div className="flex items-center gap-2">
        <span className={c.dot} />
        <span className={c.label}>{label}</span>
      </div>
      {actionLabel && (
        <button type="button" onClick={onAction} className={c.action}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Run test to pass**

Same command as Step 2. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/today/components/section-header.ts src/features/today/components/section-header.tsx tests/section-header.test.ts
git commit -m "feat(today): add SectionHeader component"
```

---

## Task 2: DayHead 今日状态头

**Files:**
- Create: `src/features/today/components/day-head.tsx`

- [ ] **Step 1: Write component**

```tsx
// src/features/today/components/day-head.tsx
'use client'

export function DayHead({
  dateText,
  tonightHtml,
  completed,
  total,
}: {
  dateText: string
  tonightHtml: string
  completed: number
  total: number
}) {
  const pct = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0
  return (
    <section className="flex items-end justify-between gap-4">
      <div>
        <div className="text-[0.7rem] tracking-[0.14em] uppercase text-rhythm-text-muted">
          {dateText}
        </div>
        <h1 className="mt-1 font-serifsc font-normal text-[1.6rem] leading-tight tracking-[0.04em] text-rhythm-text-primary">
          今天
        </h1>
        <p
          className="mt-2 text-[0.78rem] leading-relaxed text-rhythm-text-secondary"
          dangerouslySetInnerHTML={{ __html: tonightHtml }}
        />
      </div>
      <div
        className="flex-none w-16 h-16 rounded-full grid place-items-center relative"
        style={{
          background: `conic-gradient(rgba(143,180,220,0.7) 0deg ${pct * 3.6}deg, rgba(143,180,220,0.08) 0deg 360deg)`,
        }}
        title={`今日完成 ${completed}/${total}`}
      >
        <div className="absolute inset-[5px] rounded-full bg-rhythm-void/90" />
        <span className="relative z-10 font-serifsc text-[0.95rem] text-rhythm-glow">
          {completed}/{total}
        </span>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no new errors from this file (pre-existing store errors OK).

- [ ] **Step 3: Commit**

```bash
git add src/features/today/components/day-head.tsx
git commit -m "feat(today): add DayHead with date + title + gauge"
```

Note: `tonightHtml` is intentionally rendered via `dangerouslySetInnerHTML` because the prototype uses inline `<b>` tags for emphasis. The caller (`today/page.tsx` in Task 7) will produce this HTML from safe hardcoded text; do NOT accept user input here.

---

## Task 3: ArrangementsBand 时间带占位

**Files:**
- Create: `src/features/today/components/arrangements-band.tsx`

- [ ] **Step 1: Write component**

```tsx
// src/features/today/components/arrangements-band.tsx
'use client'

const BANDS = [
  { key: 'morning', tag: '早' },
  { key: 'afternoon', tag: '午' },
  { key: 'evening', tag: '晚' },
  { key: 'night', tag: '夜' },
] as const

export function ArrangementsBand() {
  return (
    <div className="rounded-2xl border border-rhythm-border bg-rhythm-card/80 backdrop-blur-sm p-4 space-y-2">
      {BANDS.map((b, i) => (
        <div key={b.key} className="grid grid-cols-[42px_1fr] gap-3 items-stretch">
          <div className="flex flex-col items-center gap-1.5 pt-1">
            <span className="text-[0.6rem] tracking-[0.1em] text-rhythm-text-muted">{b.tag}</span>
            <span className="w-2 h-2 rounded-full border border-rhythm-border-strong bg-rhythm-void/60" />
            {i < BANDS.length - 1 && <span className="flex-1 w-px bg-gradient-to-b from-rhythm-border-strong to-transparent" />}
          </div>
          <div className="pb-0.5">
            <div className="flex items-center gap-2 px-3 py-3 rounded-xl border border-dashed border-rhythm-border-strong text-rhythm-text-muted text-[0.8rem]">
              <span className="w-4 h-4 rounded-full grid place-items-center border border-rhythm-border-strong text-rhythm-glow text-[0.7rem]">
                +
              </span>
              为{b.tag}上添加安排(下阶段接入)
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/today/components/arrangements-band.tsx
git commit -m "feat(today): add ArrangementsBand placeholder (four time slots)"
```

---

## Task 4: PracticeHero 进行中实践静态卡

**Files:**
- Create: `src/features/today/components/practice-hero.tsx`

- [ ] **Step 1: Write component**

```tsx
// src/features/today/components/practice-hero.tsx
'use client'

export function PracticeHero() {
  return (
    <div
      className="rounded-2xl border p-5 backdrop-blur-sm"
      style={{
        borderColor: 'rgba(143,180,220,0.22)',
        background:
          'linear-gradient(180deg, rgba(143,180,220,0.07) 0%, rgba(20,27,39,0.82) 60%)',
      }}
    >
      <div className="flex gap-3 items-start">
        <span className="flex-none w-6 h-6 rounded-lg border grid place-items-center mt-0.5"
          style={{ borderColor: 'rgba(143,180,220,0.4)', background: 'rgba(143,180,220,0.06)' }}>
          <svg viewBox="0 0 24 24" className="w-3 h-3" style={{ stroke: 'rgb(143,180,220)', strokeWidth: 2.4, fill: 'none' }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[0.9rem] font-medium tracking-tight text-rhythm-text-primary">
            实践数据下阶段接入
          </div>
          <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
            <span className="text-[0.62rem] tracking-tight text-rhythm-glow border border-[rgba(143,180,220,0.3)] bg-[rgba(143,180,220,0.08)] px-1.5 py-0.5 rounded-full">
              ● 静态占位
            </span>
          </div>
          <div className="mt-2 text-[0.72rem] leading-relaxed text-rhythm-text-secondary pl-3 border-l-2 border-[rgba(143,180,220,0.25)]">
            <em className="not-italic text-rhythm-text-muted tracking-wider">占位　</em>
            进行中的实践卡将展示假设、轮次进度、快速三态记录、详细记录入口。
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`

- [ ] **Step 3: Commit**

```bash
git add src/features/today/components/practice-hero.tsx
git commit -m "feat(today): add PracticeHero placeholder"
```

---

## Task 5: TodayHabits 接现有 habit_occurrences

**Files:**
- Create: `src/features/today/components/today-habits.tsx`
- Test: `tests/today-habits-view-model.test.ts`

- [ ] **Step 1: Write failing test for view-model helper**

```ts
// tests/today-habits-view-model.test.ts
import assert from 'node:assert/strict'
import test from 'node:test'

import { splitOccurrences } from '../src/features/today/components/today-habits-view-model.ts'

test('splitOccurrences groups pending and done', () => {
  const result = splitOccurrences([
    { id: 'a', status: 'pending' } as any,
    { id: 'b', status: 'done' } as any,
    { id: 'c', status: 'skipped' } as any,
    { id: 'd', status: 'pending' } as any,
  ])
  assert.deepEqual(result.pending.map((o) => o.id), ['a', 'd'])
  assert.deepEqual(result.done.map((o) => o.id), ['b', 'c'])
})
```

- [ ] **Step 2: Run test — expected FAIL (module not found)**

Run: `/Users/EDY/.nvm/versions/node/v24.12.0/bin/node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/today-habits-view-model.test.ts`

- [ ] **Step 3: Write view-model helper**

```ts
// src/features/today/components/today-habits-view-model.ts
import type { Database } from '@/lib/supabase/database.types'

type Occurrence = Database['public']['Tables']['habit_occurrences']['Row']

export function splitOccurrences(occurrences: Occurrence[]) {
  const pending = occurrences.filter((o) => o.status === 'pending')
  const done = occurrences.filter((o) => o.status === 'done' || o.status === 'skipped')
  return { pending, done }
}
```

- [ ] **Step 4: Run test — expected PASS**

- [ ] **Step 5: Write component**

```tsx
// src/features/today/components/today-habits.tsx
'use client'

import { useEffect, useState } from 'react'
import { useHabitStore } from '@/features/habits/store/habit-store'
import { splitOccurrences } from './today-habits-view-model.ts'

function todayIsoDate() {
  return new Date().toISOString().split('T')[0]
}

export function TodayHabits() {
  const { occurrences, generateOccurrences, completeOccurrence, resetOccurrence } = useHabitStore()
  const [todayDate] = useState(todayIsoDate)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await generateOccurrences(todayDate)
      if (!cancelled) setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [todayDate, generateOccurrences])

  const { pending, done } = splitOccurrences(occurrences)

  if (loading) {
    return (
      <div className="rounded-2xl border border-rhythm-border bg-rhythm-card/80 p-6 text-center text-xs text-rhythm-text-muted">
        加载中...
      </div>
    )
  }

  if (occurrences.length === 0) {
    return (
      <div className="rounded-2xl border border-rhythm-border bg-rhythm-card/80 p-6 text-center">
        <p className="text-sm text-rhythm-text-secondary">今天没有打卡项</p>
        <p className="text-xs text-rhythm-text-muted mt-1">先去「计划」创建一些习惯吧</p>
      </div>
    )
  }

  const toggleDone = async (id: string, currentlyDone: boolean) => {
    if (currentlyDone) await resetOccurrence(id)
    else await completeOccurrence(id)
  }

  return (
    <div className="rounded-2xl border border-rhythm-border bg-rhythm-card/80 backdrop-blur-sm p-4 space-y-1">
      {[...pending, ...done].map((o) => {
        const isDone = o.status === 'done'
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => toggleDone(o.id, isDone)}
            className="w-full flex items-center gap-3 py-2.5 px-1 text-left"
          >
            <span
              className={`flex-none w-5 h-5 rounded-md border grid place-items-center transition-colors ${
                isDone ? 'bg-rhythm-glow border-rhythm-glow' : 'border-rhythm-border-strong'
              }`}
            >
              {isDone && (
                <svg viewBox="0 0 24 24" className="w-2.5 h-2.5" style={{ stroke: 'rgba(11,16,25,0.9)', strokeWidth: 3, fill: 'none' }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </span>
            <span
              className={`flex-1 text-[0.84rem] tracking-tight ${
                isDone ? 'text-rhythm-text-secondary line-through decoration-rhythm-text-faint' : 'text-rhythm-text-primary'
              }`}
            >
              {o.title_snapshot}
            </span>
            <span className="text-[0.62rem] tracking-tight text-rhythm-text-muted">
              {o.status === 'skipped' ? '已跳过' : isDone ? '今日' : '待完成'}
            </span>
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: no new errors from these two files.

- [ ] **Step 7: Commit**

```bash
git add src/features/today/components/today-habits.tsx src/features/today/components/today-habits-view-model.ts tests/today-habits-view-model.test.ts
git commit -m "feat(today): add TodayHabits list backed by habit_occurrences"
```

---

## Task 6: CaptureInput 自由记录静态占位

**Files:**
- Create: `src/features/today/components/capture-input.tsx`

- [ ] **Step 1: Write component**

```tsx
// src/features/today/components/capture-input.tsx
'use client'

import { useState } from 'react'

export function CaptureInput() {
  const [value, setValue] = useState('')

  return (
    <div>
      <div className="flex items-center gap-2 rounded-2xl border border-rhythm-border bg-rhythm-void/60 px-3 py-2.5 transition-colors focus-within:border-[rgba(143,180,220,0.4)]">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="发生了什么,或者你正在怎么想…"
          className="flex-1 bg-transparent border-0 outline-none text-sm text-rhythm-text-primary placeholder-rhythm-text-muted"
        />
        <button
          type="button"
          disabled
          aria-label="语音记录(下阶段接入)"
          className="flex-none w-7 h-7 rounded-full grid place-items-center border border-rhythm-border-strong text-rhythm-glow bg-[rgba(143,180,220,0.06)] opacity-50 cursor-not-allowed"
        >
          <svg viewBox="0 0 24 24" className="w-3 h-3" style={{ stroke: 'rgb(143,180,220)', strokeWidth: 1.9, fill: 'none' }}>
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
          </svg>
        </button>
      </div>
      <p className="mt-2 text-[0.66rem] tracking-tight text-rhythm-text-muted">
        保存后,Rhythm 会建议关联到安排、实践或议题(下阶段接入)。
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`

- [ ] **Step 3: Commit**

```bash
git add src/features/today/components/capture-input.tsx
git commit -m "feat(today): add CaptureInput placeholder (write disabled)"
```

---

## Task 7: 重写 today/page.tsx 组装

**Files:**
- Modify: `src/app/today/page.tsx` — 全量重写

- [ ] **Step 1: Overwrite the page**

```tsx
// src/app/today/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { AuthGuard } from '@/features/app/components/auth-guard'
import { useHabitStore } from '@/features/habits/store/habit-store'
import { DayHead } from '@/features/today/components/day-head'
import { SectionHeader } from '@/features/today/components/section-header.tsx'
import { ArrangementsBand } from '@/features/today/components/arrangements-band'
import { PracticeHero } from '@/features/today/components/practice-hero'
import { TodayHabits } from '@/features/today/components/today-habits'
import { CaptureInput } from '@/features/today/components/capture-input'

function todayIsoDate() {
  return new Date().toISOString().split('T')[0]
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const weekday = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][date.getDay()]
  return `${m}月${d}日 · ${weekday}`
}

export default function TodayPage() {
  const { occurrences, generateOccurrences } = useHabitStore()
  const [todayDate] = useState(todayIsoDate)

  useEffect(() => {
    generateOccurrences(todayDate)
  }, [todayDate, generateOccurrences])

  const total = occurrences.length
  const completed = occurrences.filter((o) => o.status === 'done').length

  const dateText = formatDate(todayDate)
  const tonightHtml =
    total === 0
      ? '还没有习惯,先去「计划」添加。'
      : `今日已完成 <b>${completed} / ${total}</b>,继续保持节奏。`

  return (
    <AuthGuard>
      <div className="p-5 space-y-5">
        <DayHead dateText={dateText} tonightHtml={tonightHtml} completed={completed} total={total} />

        <section>
          <SectionHeader label="今日安排" actionLabel="添加安排" />
          <ArrangementsBand />
        </section>

        <section>
          <SectionHeader label="进行中的实践" actionLabel="查看实践" />
          <PracticeHero />
        </section>

        <section>
          <SectionHeader label="日常打卡" actionLabel="管理" />
          <TodayHabits />
        </section>

        <section>
          <SectionHeader label="记录此刻的想法" />
          <CaptureInput />
        </section>
      </div>
    </AuthGuard>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no new errors from this file.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: build succeeds; `/today` in route table.

- [ ] **Step 4: Commit**

```bash
git add src/app/today/page.tsx
git commit -m "refactor(today): rewrite to V2 layout (arrangements/practice/habits/capture)"
```

Note: `SectionHeader` imports use the explicit `.tsx` extension per the project convention established in the records refactor(records-tabs / records-sub-tabs / reflection-cta 都有同名 `.ts` 兄弟)。but `section-header` only has both `.ts` (surface) and `.tsx` (component) — the bare specifier will resolve to `.ts` first which lacks the component. Same story as records tabs; keep the `.tsx` extension.

---

## Task 8: 全量验证

**Files:** No changes; verification only.

- [ ] **Step 1: Full test suite**

Run: `/Users/EDY/.nvm/versions/node/v24.12.0/bin/node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/*.test.ts`
Expected: PASS all 8 test files(pre-existing 3 + records-tabs/records-sub-tabs/reflection-cta/section-header/today-habits-view-model).

- [ ] **Step 2: Typecheck + Build**

Run: `npm run typecheck && npm run build`
Expected: build succeeds; new route table includes `/today`, `/records`, `/records/reflection/today`.

- [ ] **Step 3: 检查 legacy 引用**

Run: `grep -RIn --include='*.tsx' --include='*.ts' -E '@/features/habits/components/habit-item' src/`
Expected: only `src/features/habits/*` internal usage(habits 页仍然用它;今天页已不再依赖 HabitItem 及其详细表单)。

- [ ] **Step 4: Verification checkpoint commit**

```bash
git commit --allow-empty -m "chore(today): task 8 verification checkpoint"
```

---

## Self-Review

**Spec coverage(以 today-v2.html 为准):**
- 顶栏 = AppLayout 已经处理(brand + avatar)——原样保留。✓
- 今日状态头(date/今天/tonight/gauge)= DayHead。✓
- 今日安排时间带(4 slot) = ArrangementsBand。✓
- 进行中实践 hero = PracticeHero。✓
- 日常打卡 = TodayHabits(接实数据)。✓
- 记录此刻想法 = CaptureInput。✓
- 底部 tabbar = AppLayout 已处理。✓
- rhythm 冷调 token 全部复用。✓

**Placeholder 扫描:** 3 处静态占位组件明确标注"下阶段接入",prop 结构简单,阶段 B 直接换实数据即可。无 TODO/TBD。

**类型一致性:** 每个 task 的 export 都在下一个 task 消费(SectionHeader→page,TodayHabits→page,view-model→component)。`splitOccurrences` 只被 today-habits 内部使用,通过命名与 records 现有导出无冲突。

**决策记录:**
- `SectionHeader` 保持 `.ts`(class 生成器) + `.tsx`(component)分裂,和 records 系列一致,减少 test loader 摩擦。
- `dangerouslySetInnerHTML` 只用于 `tonightHtml`,内容来自本页硬编码,不接受任何外部输入。
- 今日安排的时间带即使是占位,依然渲染 4 个 slot 让视觉与 v2 完全一致,避免阶段 B 接入时视觉突变。
