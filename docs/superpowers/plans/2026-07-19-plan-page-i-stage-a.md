# 计划页 I · 主索引 实施计划(阶段 A · UI-Only)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to execute task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 把 `docs/product/prototypes/plan-i-dashboard.html` 翻译为 React,替换 `src/app/habits/page.tsx` 为新计划主索引;把旧的习惯 CRUD 页移到 `/habits/manage`。不引入新数据表。

**Architecture:** 页面拆成 6 个 client 子组件,`habits/page.tsx` 只负责组装。仅"习惯"入口卡接现有 `habit_occurrences`;其他 3 大入口(方向/议题/方法/当前实践)静态占位,预留 props 结构,阶段 B 换真数据。

**Tech Stack:** Next.js 14 App Router / React 18 / Zustand(现有 useHabitStore) / Tailwind rhythm token

---

## Scope

- 新增 6 子组件在 `src/features/plan/components/*`:
  - `plan-briefing.tsx` — 顶部一句提醒条(静态)
  - `practice-current-card.tsx` — 当前实践 hero 宽卡(静态)
  - `entry-card.tsx` — 通用 2×2 入口大卡组件(受控 props: eyebrow/title/count/tail/iconSlot)
  - `quick-actions.tsx` — 4 快速动作按钮(静态,点击暂无操作)
  - `observation-card.tsx` — AI 观察卡(静态占位,含依据 + 三态按钮)
  - `recent-activity.tsx` — 最近动态列表(静态占位)
- 重写 `src/app/habits/page.tsx` 为新计划主索引(替代旧 HabitsPageClient)
- 新增路由 `src/app/habits/manage/page.tsx`,渲染旧 `HabitsPageClient`(不做修改,直接引用)
- 更新 tabbar `showNav` 逻辑无需变(依然 `/habits` 是计划页,内部改了)

不做:
- 新数据表 / 新 store
- 方向/议题/实践/方法的 CRUD
- AI 观察真实数据
- 最近动态真实数据
- 单测(新组件都是纯展示,无需覆盖)

---

## File Structure

**新增:**
- `src/features/plan/components/plan-briefing.tsx`
- `src/features/plan/components/practice-current-card.tsx`
- `src/features/plan/components/entry-card.tsx`
- `src/features/plan/components/quick-actions.tsx`
- `src/features/plan/components/observation-card.tsx`
- `src/features/plan/components/recent-activity.tsx`
- `src/app/habits/manage/page.tsx` — 旧 HabitsPageClient 的新路由

**修改:**
- `src/app/habits/page.tsx` — 全量重写为计划主索引(不再直接渲染旧 HabitsPageClient)

**不动:**
- `src/features/habits/components/habits-list.tsx`(旧 HabitsPageClient)—— 仍被新 manage 路由消费
- `src/features/habits/store/habit-store.ts`

---

## Task 1: PlanBriefing 顶部提醒条

**Files:** Create `src/features/plan/components/plan-briefing.tsx`

- [ ] **Step 1: Write component**

```tsx
// src/features/plan/components/plan-briefing.tsx
'use client'

export function PlanBriefing() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-rhythm-border"
      style={{ background: 'linear-gradient(180deg, rgba(143,180,220,0.08), transparent)' }}>
      <div className="flex-none w-9 h-9 rounded-full grid place-items-center"
        style={{ background: 'rgba(143,180,220,0.18)', color: 'rgb(143,180,220)' }}>
        <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ stroke: 'currentColor', strokeWidth: 1.8, fill: 'none' }}>
          <path d="M12 8v4l3 2" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </div>
      <div className="flex-1 text-xs text-rhythm-text-secondary leading-relaxed">
        实践与议题数据下阶段接入,先看结构。
      </div>
      <button type="button" className="text-[0.68rem] tracking-tight text-rhythm-glow bg-transparent border-0 cursor-pointer">
        了解 →
      </button>
    </div>
  )
}
```

- [ ] **Step 2:** `npm run typecheck` — expect no new errors from this file.

- [ ] **Step 3: Commit**

```bash
git add src/features/plan/components/plan-briefing.tsx
git commit -m "feat(plan): add PlanBriefing top summary bar"
```

---

## Task 2: PracticeCurrentCard 当前实践 hero(静态)

**Files:** Create `src/features/plan/components/practice-current-card.tsx`

- [ ] **Step 1: Write component**

```tsx
// src/features/plan/components/practice-current-card.tsx
'use client'

export function PracticeCurrentCard() {
  return (
    <a className="col-span-full block p-4 rounded-2xl border relative overflow-hidden no-underline"
      style={{
        borderColor: 'rgba(143,180,220,0.28)',
        background: 'linear-gradient(180deg, rgba(143,180,220,0.10), rgba(20,27,39,0.8))',
        color: 'inherit',
      }}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-[0.58rem] tracking-[0.16em] uppercase" style={{ color: 'rgba(143,180,220,0.85)' }}>
          当前实践 · 静态占位
        </span>
        <div className="w-6 h-6 rounded-lg grid place-items-center flex-none"
          style={{ background: 'rgba(143,180,220,0.2)', color: 'rgb(143,180,220)' }}>
          <svg viewBox="0 0 24 24" className="w-3 h-3" style={{ stroke: 'currentColor', strokeWidth: 1.7, fill: 'none' }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>
      <h3 className="font-serifsc font-medium text-[1.05rem] tracking-tight leading-snug m-0 mb-2">
        实践数据下阶段接入
      </h3>
      <div className="text-[0.66rem] tracking-tight text-rhythm-text-secondary leading-relaxed">
        接入后:显示当前实践名称、本轮第 N/M 天、假设、快速三态记录、详细记录入口。
      </div>
      <div className="flex gap-2 mt-3 relative z-10">
        <button type="button" className="flex-1 px-2 py-2 rounded-[9px] font-inherit text-[0.7rem] tracking-tight cursor-pointer"
          style={{ background: 'rgba(143,180,220,0.22)', border: '1px solid rgba(143,180,220,0.42)', color: 'rgb(143,180,220)' }}>
          记一笔
        </button>
        <button type="button" className="flex-1 px-2 py-2 rounded-[9px] font-inherit text-[0.7rem] tracking-tight cursor-pointer bg-transparent text-rhythm-text-primary border border-rhythm-border-strong">
          调整
        </button>
        <button type="button" className="flex-1 px-2 py-2 rounded-[9px] font-inherit text-[0.7rem] tracking-tight cursor-pointer bg-transparent text-rhythm-text-primary border border-rhythm-border-strong">
          结束
        </button>
      </div>
    </a>
  )
}
```

- [ ] **Step 2:** `npm run typecheck`

- [ ] **Step 3: Commit**

```bash
git add src/features/plan/components/practice-current-card.tsx
git commit -m "feat(plan): add PracticeCurrentCard placeholder hero"
```

---

## Task 3: EntryCard 通用 2×2 入口大卡

**Files:** Create `src/features/plan/components/entry-card.tsx`

- [ ] **Step 1: Write component**

```tsx
// src/features/plan/components/entry-card.tsx
'use client'

import type { ReactNode } from 'react'

export function EntryCard({
  eyebrow,
  title,
  count,
  unit,
  tail,
  icon,
  href,
}: {
  eyebrow: string
  title: string
  count: number | string
  unit?: string
  tail: string
  icon: ReactNode
  href?: string
}) {
  const Tag: any = href ? 'a' : 'div'
  return (
    <Tag
      href={href}
      className="flex flex-col justify-between min-h-[130px] p-4 rounded-2xl border border-rhythm-border bg-rhythm-card/80 backdrop-blur-sm no-underline text-inherit cursor-pointer transition-colors hover:border-rhythm-border-strong"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-[0.58rem] tracking-[0.16em] uppercase text-rhythm-text-muted">{eyebrow}</span>
        <span className="flex-none w-[26px] h-[26px] rounded-lg grid place-items-center bg-rhythm-glow-soft text-rhythm-glow">
          {icon}
        </span>
      </div>
      <h3 className="font-serifsc font-medium text-[0.95rem] tracking-tight m-0 mb-1">{title}</h3>
      <div className="mt-auto">
        <div className="font-serifsc text-[1.65rem] text-rhythm-glow leading-none tracking-tight">
          {count}
          {unit && <small className="font-inherit text-[0.62rem] tracking-tight uppercase text-rhythm-text-muted ml-1 font-normal">{unit}</small>}
        </div>
        <div className="text-[0.66rem] tracking-tight text-rhythm-text-muted leading-normal mt-1">{tail}</div>
      </div>
    </Tag>
  )
}
```

- [ ] **Step 2:** `npm run typecheck`

- [ ] **Step 3: Commit**

```bash
git add src/features/plan/components/entry-card.tsx
git commit -m "feat(plan): add EntryCard grid item component"
```

---

## Task 4: QuickActions 4 快速动作

**Files:** Create `src/features/plan/components/quick-actions.tsx`

- [ ] **Step 1: Write component**

```tsx
// src/features/plan/components/quick-actions.tsx
'use client'

const ACTIONS = [
  { key: 'practice', label: '发起实践', path: 'M12 2v6l4-4M12 8l-4-4' },
  { key: 'topic', label: '新议题', path: 'M12 8v4M12 16h.01' },
  { key: 'method', label: '写方法', path: 'M9 12l2 2 4-4' },
  { key: 'habit', label: '加习惯', path: 'M20 6L9 17l-5-5' },
] as const

export function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-2">
      {ACTIONS.map((a) => (
        <button
          key={a.key}
          type="button"
          className="flex flex-col items-center gap-1.5 px-1 py-3 rounded-xl border border-rhythm-border bg-rhythm-card/40 text-rhythm-text-secondary text-[0.68rem] tracking-tight cursor-pointer transition-colors hover:border-rhythm-border-strong hover:text-rhythm-text-primary"
        >
          <span className="flex-none w-8 h-8 rounded-[10px] grid place-items-center bg-rhythm-glow-soft text-rhythm-glow">
            <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ stroke: 'currentColor', strokeWidth: 1.7, fill: 'none' }}>
              {a.key === 'topic' && <circle cx="12" cy="12" r="9" />}
              {a.key === 'method' && <circle cx="12" cy="12" r="9" />}
              {a.key === 'practice' && <circle cx="12" cy="14" r="8" />}
              <path d={a.path} />
            </svg>
          </span>
          <b className="font-medium tracking-tight leading-tight">{a.label}</b>
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2:** `npm run typecheck`

- [ ] **Step 3: Commit**

```bash
git add src/features/plan/components/quick-actions.tsx
git commit -m "feat(plan): add QuickActions 4-button row"
```

---

## Task 5: ObservationCard AI 观察占位

**Files:** Create `src/features/plan/components/observation-card.tsx`

- [ ] **Step 1: Write component**

```tsx
// src/features/plan/components/observation-card.tsx
'use client'

export function ObservationCard() {
  return (
    <div className="p-4 rounded-2xl border relative"
      style={{
        borderColor: 'rgba(220,180,130,0.18)',
        background: 'linear-gradient(180deg, rgba(220,180,130,0.08), transparent)',
      }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="w-5 h-5 rounded-full grid place-items-center"
          style={{ background: 'rgba(220,180,130,0.2)', color: 'rgb(220,180,130)' }}>
          <svg viewBox="0 0 24 24" className="w-3 h-3" style={{ stroke: 'currentColor', strokeWidth: 2, fill: 'none' }}>
            <path d="M12 3l9 5-9 5-9-5 9-5z" />
            <path d="M3 13l9 5 9-5" />
          </svg>
        </span>
        <span className="text-[0.6rem] tracking-[0.14em] uppercase font-medium" style={{ color: 'rgb(220,180,130)' }}>
          Rhythm 的一个观察
        </span>
      </div>
      <p className="text-[0.78rem] text-rhythm-text-primary leading-relaxed tracking-tight m-0 mb-2">
        AI 观察数据下阶段接入,示例:最近 4 次"没开始",有 3 次提到工作疲惫。
      </p>
      <div className="text-[0.64rem] text-rhythm-text-muted tracking-tight mb-2 leading-normal">
        依据:接入后将显示证据引用和样本量提示。
      </div>
      <div className="flex gap-1.5">
        <button type="button" className="px-2 py-1.5 rounded-lg font-inherit text-[0.68rem] tracking-tight cursor-pointer"
          style={{ background: 'rgba(220,180,130,0.16)', border: '1px solid rgba(220,180,130,0.28)', color: 'rgb(220,180,130)' }}>
          是的,值得看
        </button>
        <button type="button" className="px-2 py-1.5 rounded-lg font-inherit text-[0.68rem] tracking-tight cursor-pointer bg-transparent"
          style={{ border: '1px solid rgba(220,180,130,0.28)', color: 'rgb(220,180,130)' }}>
          需要更多数据
        </button>
        <button type="button" className="px-2 py-1.5 rounded-lg font-inherit text-[0.68rem] tracking-tight cursor-pointer bg-transparent border border-rhythm-border text-rhythm-text-muted">
          忽略
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2:** `npm run typecheck`

- [ ] **Step 3: Commit**

```bash
git add src/features/plan/components/observation-card.tsx
git commit -m "feat(plan): add ObservationCard placeholder"
```

---

## Task 6: RecentActivity 最近动态占位

**Files:** Create `src/features/plan/components/recent-activity.tsx`

- [ ] **Step 1: Write component**

```tsx
// src/features/plan/components/recent-activity.tsx
'use client'

export function RecentActivity() {
  return (
    <div className="p-4 rounded-2xl border border-rhythm-border bg-rhythm-card/60">
      <div className="flex justify-between items-baseline mb-3">
        <span className="text-[0.6rem] tracking-[0.14em] uppercase text-rhythm-text-muted">最近动态</span>
        <a className="text-[0.68rem] text-rhythm-glow no-underline tracking-tight">全部 →</a>
      </div>
      <div className="text-[0.72rem] text-rhythm-text-muted leading-relaxed py-4 text-center">
        最近动态下阶段接入,将显示实践、议题、方法的操作时间线。
      </div>
    </div>
  )
}
```

- [ ] **Step 2:** `npm run typecheck`

- [ ] **Step 3: Commit**

```bash
git add src/features/plan/components/recent-activity.tsx
git commit -m "feat(plan): add RecentActivity placeholder"
```

---

## Task 7: 新增 /habits/manage 路由承接旧习惯 CRUD

**Files:** Create `src/app/habits/manage/page.tsx`

- [ ] **Step 1: Write route**

```tsx
// src/app/habits/manage/page.tsx
'use client'

import { AuthGuard } from '@/features/app/components/auth-guard'
import HabitsPageClient from '@/features/habits/components/habits-list'

export default function HabitsManagePage() {
  return (
    <AuthGuard>
      <HabitsPageClient />
    </AuthGuard>
  )
}
```

- [ ] **Step 2:** `npm run build` — expect `/habits/manage` in route table.

- [ ] **Step 3: Commit**

```bash
git add src/app/habits/manage/page.tsx
git commit -m "feat(habits): move legacy habits CRUD to /habits/manage"
```

---

## Task 8: 重写 /habits/page.tsx 为计划主索引

**Files:** Modify `src/app/habits/page.tsx`

- [ ] **Step 1: Overwrite**

```tsx
// src/app/habits/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { AuthGuard } from '@/features/app/components/auth-guard'
import { useHabitStore } from '@/features/habits/store/habit-store'
import { PlanBriefing } from '@/features/plan/components/plan-briefing'
import { PracticeCurrentCard } from '@/features/plan/components/practice-current-card'
import { EntryCard } from '@/features/plan/components/entry-card'
import { QuickActions } from '@/features/plan/components/quick-actions'
import { ObservationCard } from '@/features/plan/components/observation-card'
import { RecentActivity } from '@/features/plan/components/recent-activity'

function todayIsoDate() {
  return new Date().toISOString().split('T')[0]
}

export default function PlanPage() {
  const { occurrences, generateOccurrences } = useHabitStore()
  const [todayDate] = useState(todayIsoDate)

  useEffect(() => {
    generateOccurrences(todayDate)
  }, [todayDate, generateOccurrences])

  const habitTotal = occurrences.length
  const habitDone = occurrences.filter((o) => o.status === 'done').length

  return (
    <AuthGuard>
      <div className="p-5 space-y-4">
        <PlanBriefing />
        <div className="grid grid-cols-2 gap-3">
          <PracticeCurrentCard />
          <EntryCard
            eyebrow="议题"
            title="当前议题"
            count={0}
            unit="个"
            tail="下阶段接入"
            icon={
              <svg viewBox="0 0 24 24" className="w-3 h-3" style={{ stroke: 'currentColor', strokeWidth: 1.7, fill: 'none' }}>
                <path d="M12 8v4M12 16h.01" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            }
          />
          <EntryCard
            eyebrow="方法"
            title="我的方法"
            count={0}
            unit="条"
            tail="下阶段接入"
            icon={
              <svg viewBox="0 0 24 24" className="w-3 h-3" style={{ stroke: 'currentColor', strokeWidth: 1.7, fill: 'none' }}>
                <path d="M9 12l2 2 4-4" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            }
          />
          <EntryCard
            eyebrow="方向"
            title="长期方向"
            count={0}
            unit="个"
            tail="下阶段接入"
            icon={
              <svg viewBox="0 0 24 24" className="w-3 h-3" style={{ stroke: 'currentColor', strokeWidth: 1.7, fill: 'none' }}>
                <path d="M12 2v20M2 12h20" />
              </svg>
            }
          />
          <EntryCard
            eyebrow="习惯"
            title="日常习惯"
            count={`${habitDone}/${habitTotal}`}
            unit=""
            tail={habitTotal === 0 ? '还没有习惯' : `今日已完成 ${habitDone}`}
            icon={
              <svg viewBox="0 0 24 24" className="w-3 h-3" style={{ stroke: 'currentColor', strokeWidth: 1.7, fill: 'none' }}>
                <path d="M20 6L9 17l-5-5" />
              </svg>
            }
            href="/habits/manage"
          />
        </div>
        <QuickActions />
        <ObservationCard />
        <RecentActivity />
      </div>
    </AuthGuard>
  )
}
```

- [ ] **Step 2:** `npm run typecheck && npm run build` — build should succeed with `/habits` and `/habits/manage` both in route table.

- [ ] **Step 3: Commit**

```bash
git add src/app/habits/page.tsx
git commit -m "refactor(habits): rewrite / to plan I main index"
```

---

## Task 9: 全量验证 + dev 冒烟

**Files:** Verification only.

- [ ] **Step 1: Full tests**

Run: `/Users/EDY/.nvm/versions/node/v24.12.0/bin/node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/*.test.ts`
Expected: 8 test files, all PASS (no new tests in this plan).

- [ ] **Step 2: Typecheck + Build**

Run: `npm run typecheck && npm run build`
Expected: build succeeds; routes include `/habits`, `/habits/manage`, `/today`, `/records`, `/records/reflection/today`, `/`.

- [ ] **Step 3: Dangling reference check**

Run: `grep -RIn --include='*.tsx' --include='*.ts' -E '@/features/plan/components/' src/`
Expected: exactly 6 imports, all in `src/app/habits/page.tsx`.

- [ ] **Step 4: Verification checkpoint commit**

```bash
git commit --allow-empty -m "chore(plan): task 9 verification checkpoint"
```

---

## Self-Review

**Spec coverage:**
- Briefing 卡 → Task 1 ✓
- 当前实践 hero → Task 2 ✓
- 4 大入口 2×2 → Task 3 + Task 8 ✓
- Quick 4 键 → Task 4 ✓
- AI 观察 → Task 5 ✓
- 最近动态 → Task 6 ✓
- 组装 → Task 8 ✓
- 旧习惯 CRUD 迁移 → Task 7 ✓

**Placeholder scan:** 5 处静态占位("下阶段接入"),1 处接现有 habit_occurrences。无 TODO/TBD。

**类型一致性:** EntryCard 的 `count: number | string` 覆盖两种情况;`href` 可选,只有习惯卡传 `/habits/manage`。

**依赖:** 旧 HabitsPageClient 保留原地,新 manage 路由直接引用,零风险。
