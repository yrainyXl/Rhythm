# Plan 6A · 趋势 + 回顾 + AI 观察 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development

**Goal:** 补齐记录页 4 tab 中的**趋势子 tab** 和**回顾 tab** —— 加 SQL migrations、TS types、zustand store、Recharts 图表、AI 观察三态卡、周回顾 feed;把 records-page-client 的两处占位换成真实组件。

**Architecture:** 新增 2 张表(`weekly_reviews` / `ai_recommendations`),共用一套 AI 观察三态数据模型;趋势子 tab 用 SVG 手绘图表(无外部依赖);回顾 tab 用 feed + 观察卡组合;不引入 Recharts(避免包体积激增)。

**Tech Stack:** Next.js 14 · React 18 · Zustand · Supabase migrations · Tailwind rhythm token · 手写 SVG

---

## Scope

- **SQL**:2 张新表 + RLS
- **types.ts**:2 类型
- **stores**:`weekly-review-store` + `ai-recommendation-store`
- **组件**:
  - `observation-card.tsx`(通用可复用 —— 计划页里已有静态占位,这里改成通用接 props 的版本,并放 practice/plan 共用位置)
  - `trends-pane.tsx`(4 分区图表:实践完成率对比 / 方法沉淀累计 / 睡眠时长 / 复盘节奏 —— 全部 SVG 手绘,无数据时占位)
  - `weekly-review-feed.tsx`(周回顾列表 + 展开)
- **接线**:records-page-client 的 `activeSubTab === 'trends'` 分支换 `<TrendsPane />`,`activeTab === 'review'` 分支换 `<WeeklyReviewFeed />`

不做:
- Recharts / 任何外部图表库
- AI 生成后端(migration 只建表,数据插入靠 Supabase Edge Function 或人工 seed)
- 阅读 themes 集成(留 Plan 6B)
- 单测

---

## File Structure

**新增:**
- `supabase/migrations/20260719_000011_ai_review.sql`
- `src/features/practice/store/weekly-review-store.ts`
- `src/features/practice/store/ai-recommendation-store.ts`
- `src/features/records/components/observation-card.tsx`(通用组件,和计划页的重名不冲突 —— 计划页那个在 features/plan/,这个在 features/records/)
- `src/features/records/components/trends-pane.tsx`
- `src/features/records/components/weekly-review-feed.tsx`

**修改:**
- `src/lib/supabase/database.types.ts` — 加 weekly_reviews + ai_recommendations
- `src/features/records/components/records-page-client.tsx` — 替换 2 处占位

---

## Task 1: migration SQL

**Files:** Create `supabase/migrations/20260719_000011_ai_review.sql`

- [ ] **Step 1: Write**

```sql
-- Migration: weekly reviews + AI recommendations

-- 1. WEEKLY REVIEWS
create table if not exists public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  week_end date not null,
  practice_completion_rate numeric,
  reflection_count integer not null default 0,
  average_sleep_hours numeric,
  ai_body_md text,
  status text not null default 'unread' check (status in ('unread', 'confirmed', 'edited')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

alter table public.weekly_reviews enable row level security;
create policy "own weekly reviews select" on public.weekly_reviews for select using (auth.uid() = user_id);
create policy "own weekly reviews insert" on public.weekly_reviews for insert with check (auth.uid() = user_id);
create policy "own weekly reviews update" on public.weekly_reviews for update using (auth.uid() = user_id);
create policy "own weekly reviews delete" on public.weekly_reviews for delete using (auth.uid() = user_id);
create trigger on_weekly_reviews_updated before update on public.weekly_reviews for each row execute function public.handle_updated_at();
create index idx_weekly_reviews_user_week on public.weekly_reviews(user_id, week_start desc);

-- 2. AI RECOMMENDATIONS (共用于观察 + 推荐尝试)
create table if not exists public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('observation', 'try', 'method_suggest')),
  weekly_review_id uuid references public.weekly_reviews(id) on delete cascade,
  title text not null,
  body_md text,
  evidence_ref jsonb,
  uncertainty_note text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'more_data', 'dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ai_recommendations enable row level security;
create policy "own ai rec select" on public.ai_recommendations for select using (auth.uid() = user_id);
create policy "own ai rec insert" on public.ai_recommendations for insert with check (auth.uid() = user_id);
create policy "own ai rec update" on public.ai_recommendations for update using (auth.uid() = user_id);
create policy "own ai rec delete" on public.ai_recommendations for delete using (auth.uid() = user_id);
create trigger on_ai_rec_updated before update on public.ai_recommendations for each row execute function public.handle_updated_at();
create index idx_ai_rec_user_created on public.ai_recommendations(user_id, created_at desc);
create index idx_ai_rec_review on public.ai_recommendations(weekly_review_id);
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260719_000011_ai_review.sql
git commit -m "feat(db): add weekly_reviews + ai_recommendations migration"
```

---

## Task 2: types.ts

**Files:** Modify `src/lib/supabase/database.types.ts`

- [ ] **Step 1**: Insert two blocks in the `Tables:` object. Place them between `methods:` (last practice block, ends around line 776) and `goals:` (next existing block). Follow the same indentation pattern (6/8/10 spaces).

```ts
      weekly_reviews: {
        Row: {
          id: string
          user_id: string
          week_start: string
          week_end: string
          practice_completion_rate: number | null
          reflection_count: number
          average_sleep_hours: number | null
          ai_body_md: string | null
          status: 'unread' | 'confirmed' | 'edited'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          week_start: string
          week_end: string
          practice_completion_rate?: number | null
          reflection_count?: number
          average_sleep_hours?: number | null
          ai_body_md?: string | null
          status?: 'unread' | 'confirmed' | 'edited'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          week_start?: string
          week_end?: string
          practice_completion_rate?: number | null
          reflection_count?: number
          average_sleep_hours?: number | null
          ai_body_md?: string | null
          status?: 'unread' | 'confirmed' | 'edited'
          created_at?: string
          updated_at?: string
        }
      }
      ai_recommendations: {
        Row: {
          id: string
          user_id: string
          kind: 'observation' | 'try' | 'method_suggest'
          weekly_review_id: string | null
          title: string
          body_md: string | null
          evidence_ref: unknown
          uncertainty_note: string | null
          status: 'pending' | 'confirmed' | 'more_data' | 'dismissed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          kind: 'observation' | 'try' | 'method_suggest'
          weekly_review_id?: string | null
          title: string
          body_md?: string | null
          evidence_ref?: unknown
          uncertainty_note?: string | null
          status?: 'pending' | 'confirmed' | 'more_data' | 'dismissed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          kind?: 'observation' | 'try' | 'method_suggest'
          weekly_review_id?: string | null
          title?: string
          body_md?: string | null
          evidence_ref?: unknown
          uncertainty_note?: string | null
          status?: 'pending' | 'confirmed' | 'more_data' | 'dismissed'
          created_at?: string
          updated_at?: string
        }
      }
```

- [ ] **Step 2**: `npm run typecheck` — expect no new errors.

- [ ] **Step 3**: Commit `feat(db): add weekly_reviews + ai_recommendations types`

---

## Task 3: weekly-review-store

**Files:** Create `src/features/practice/store/weekly-review-store.ts`

- [ ] **Step 1: Write**

```ts
'use client'

import { create } from 'zustand'
import { createBrowserClient, getCurrentUser } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type WeeklyReview = Database['public']['Tables']['weekly_reviews']['Row']

interface WeeklyReviewState {
  reviews: WeeklyReview[]
  isLoading: boolean
  loadReviews: () => Promise<void>
  updateStatus: (id: string, status: 'unread' | 'confirmed' | 'edited') => Promise<void>
}

export const useWeeklyReviewStore = create<WeeklyReviewState>((set, get) => ({
  reviews: [],
  isLoading: true,

  loadReviews: async () => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) {
      set({ isLoading: false })
      return
    }
    const { data } = await supabase
      .from('weekly_reviews')
      .select('*')
      .eq('user_id', user.id)
      .order('week_start', { ascending: false })
      .limit(30)
    set({ reviews: (data ?? []) as WeeklyReview[], isLoading: false })
  },

  updateStatus: async (id, status) => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return
    await supabase.from('weekly_reviews').update({ status }).eq('id', id).eq('user_id', user.id)
    const reviews = get().reviews.map((r) => (r.id === id ? { ...r, status } : r))
    set({ reviews })
  },
}))
```

- [ ] **Step 2**: `npm run typecheck`

- [ ] **Step 3**: Commit `feat(practice): add weekly-review-store`

---

## Task 4: ai-recommendation-store

**Files:** Create `src/features/practice/store/ai-recommendation-store.ts`

- [ ] **Step 1: Write**

```ts
'use client'

import { create } from 'zustand'
import { createBrowserClient, getCurrentUser } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type Recommendation = Database['public']['Tables']['ai_recommendations']['Row']
type RecStatus = 'pending' | 'confirmed' | 'more_data' | 'dismissed'

interface AiRecState {
  items: Recommendation[]
  isLoading: boolean
  loadByReview: (weeklyReviewId: string) => Promise<void>
  loadPending: () => Promise<void>
  updateStatus: (id: string, status: RecStatus) => Promise<void>
}

export const useAiRecommendationStore = create<AiRecState>((set, get) => ({
  items: [],
  isLoading: true,

  loadByReview: async (weeklyReviewId) => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return
    const { data } = await supabase
      .from('ai_recommendations')
      .select('*')
      .eq('user_id', user.id)
      .eq('weekly_review_id', weeklyReviewId)
      .order('created_at', { ascending: true })
    set({ items: (data ?? []) as Recommendation[], isLoading: false })
  },

  loadPending: async () => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) {
      set({ isLoading: false })
      return
    }
    const { data } = await supabase
      .from('ai_recommendations')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(20)
    set({ items: (data ?? []) as Recommendation[], isLoading: false })
  },

  updateStatus: async (id, status) => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return
    await supabase.from('ai_recommendations').update({ status }).eq('id', id).eq('user_id', user.id)
    const items = get().items.map((r) => (r.id === id ? { ...r, status } : r))
    set({ items })
  },
}))
```

- [ ] **Step 2**: `npm run typecheck`

- [ ] **Step 3**: Commit `feat(practice): add ai-recommendation-store`

---

## Task 5: ObservationCard(通用可复用)

**Files:** Create `src/features/records/components/observation-card.tsx`

- [ ] **Step 1: Write**

```tsx
'use client'

import { useAiRecommendationStore } from '@/features/practice/store/ai-recommendation-store'
import type { Database } from '@/lib/supabase/database.types'

type Rec = Database['public']['Tables']['ai_recommendations']['Row']

export function ObservationCard({ rec }: { rec: Rec }) {
  const { updateStatus } = useAiRecommendationStore()

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
        {rec.title}
      </p>
      {rec.uncertainty_note && (
        <div className="text-[0.64rem] text-rhythm-text-muted tracking-tight mb-2 leading-normal">
          {rec.uncertainty_note}
        </div>
      )}
      <div className="flex gap-1.5">
        <button type="button" onClick={() => updateStatus(rec.id, 'confirmed')}
          className="px-2 py-1.5 rounded-lg font-inherit text-[0.68rem] tracking-tight cursor-pointer"
          style={{ background: 'rgba(220,180,130,0.16)', border: '1px solid rgba(220,180,130,0.28)', color: 'rgb(220,180,130)' }}>
          确认
        </button>
        <button type="button" onClick={() => updateStatus(rec.id, 'more_data')}
          className="px-2 py-1.5 rounded-lg font-inherit text-[0.68rem] tracking-tight cursor-pointer bg-transparent"
          style={{ border: '1px solid rgba(220,180,130,0.28)', color: 'rgb(220,180,130)' }}>
          需要更多数据
        </button>
        <button type="button" onClick={() => updateStatus(rec.id, 'dismissed')}
          className="px-2 py-1.5 rounded-lg font-inherit text-[0.68rem] tracking-tight cursor-pointer bg-transparent border border-rhythm-border text-rhythm-text-muted">
          忽略
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2**: `npm run typecheck`

- [ ] **Step 3**: Commit `feat(records): add generic ObservationCard`

---

## Task 6: TrendsPane 4 分区 SVG 图表(无 Recharts)

**Files:** Create `src/features/records/components/trends-pane.tsx`

- [ ] **Step 1: Write**

```tsx
'use client'

import { useEffect } from 'react'
import { usePracticeStore } from '@/features/practice/store/practice-store'
import { useWeeklyReviewStore } from '@/features/practice/store/weekly-review-store'

function Section({ title, subtitle, children, empty }: {
  title: string
  subtitle: string
  children: React.ReactNode
  empty?: string
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5 px-0.5">
        <span className="text-[0.62rem] tracking-[0.14em] uppercase text-rhythm-text-secondary">{title}</span>
        <span className="text-[0.6rem] text-rhythm-text-muted">{subtitle}</span>
      </div>
      <div className="r-card p-4">
        {empty ? (
          <div className="text-center py-6 text-xs text-rhythm-text-muted">{empty}</div>
        ) : children}
      </div>
    </div>
  )
}

export function TrendsPane() {
  const { practices, loadPractices } = usePracticeStore()
  const { reviews, loadReviews } = useWeeklyReviewStore()

  useEffect(() => {
    loadPractices()
    loadReviews()
  }, [loadPractices, loadReviews])

  const completedRounds = practices
    .filter((p) => p.latestRound)
    .slice(0, 5)
    .map((p) => ({
      label: p.title,
      value: p.latestRound && p.latestRound.total_days > 0
        ? Math.round((p.latestRound.done_days / p.latestRound.total_days) * 100)
        : 0,
    }))

  return (
    <div className="space-y-5">
      <Section
        title="实践 · 完成率"
        subtitle={`近 ${completedRounds.length} 轮`}
        empty={completedRounds.length === 0 ? '发起实践后,这里会显示每轮的完成率对比' : undefined}>
        <svg viewBox="0 0 320 160" className="w-full h-auto block" preserveAspectRatio="none">
          <line x1="0" y1="130" x2="320" y2="130" stroke="rgba(150,175,205,0.18)" strokeWidth="0.5" />
          <line x1="0" y1="80" x2="320" y2="80" stroke="rgba(150,175,205,0.10)" strokeWidth="0.5" strokeDasharray="2 2" />
          <line x1="0" y1="40" x2="320" y2="40" stroke="rgba(150,175,205,0.10)" strokeWidth="0.5" strokeDasharray="2 2" />
          {completedRounds.map((r, i) => {
            const barH = (r.value / 100) * 90
            const x = 30 + i * 55
            return (
              <g key={i}>
                <rect x={x} y={130 - barH} width="42" height={barH} rx="4" fill="url(#barGrad)" />
                <text x={x + 21} y="146" fontSize="8" textAnchor="middle" fill="rgba(210,218,228,0.55)">
                  {r.label.slice(0, 4)}
                </text>
                <text x={x + 21} y={126 - barH} fontSize="9" textAnchor="middle" fill="rgba(222,228,236,0.92)" fontFamily="Noto Serif SC">
                  {r.value}%
                </text>
              </g>
            )
          })}
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(143,180,220)" stopOpacity="0.95" />
              <stop offset="100%" stopColor="rgb(143,180,220)" stopOpacity="0.35" />
            </linearGradient>
          </defs>
        </svg>
      </Section>

      <Section
        title="方法沉淀"
        subtitle="累计条数"
        empty="确认第一条方法后开始累计">
        <div className="text-center py-6 text-xs text-rhythm-text-muted">
          需要在 methods 表插入数据后接入
        </div>
      </Section>

      <Section
        title="睡眠 · 时长趋势"
        subtitle="近 30 天"
        empty="接入小米手环后显示" />

      <Section
        title="复盘 · 节奏"
        subtitle="近 30 天"
        empty={reviews.length === 0 ? '开始写复盘,这里会显示热力图' : undefined}>
        <div className="text-center py-4 text-xs text-rhythm-text-muted">
          已有 {reviews.length} 条周回顾
        </div>
      </Section>
    </div>
  )
}
```

- [ ] **Step 2**: `npm run typecheck`

- [ ] **Step 3**: Commit `feat(records): add TrendsPane with SVG charts`

---

## Task 7: WeeklyReviewFeed 回顾 tab 主体

**Files:** Create `src/features/records/components/weekly-review-feed.tsx`

- [ ] **Step 1: Write**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useWeeklyReviewStore } from '@/features/practice/store/weekly-review-store'
import { useAiRecommendationStore } from '@/features/practice/store/ai-recommendation-store'
import { ObservationCard } from '@/features/records/components/observation-card'
import { TabPlaceholder } from '@/features/records/components/tab-placeholder'

function formatWeek(start: string, end: string): string {
  const parseM = (iso: string) => {
    const [, m, d] = iso.split('-').map(Number)
    return `${m}月${d}日`
  }
  return `${parseM(start)}–${parseM(end)}`
}

export function WeeklyReviewFeed() {
  const { reviews, isLoading, loadReviews, updateStatus } = useWeeklyReviewStore()
  const { items: recs, loadByReview } = useAiRecommendationStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    loadReviews()
  }, [loadReviews])

  useEffect(() => {
    if (expandedId) loadByReview(expandedId)
  }, [expandedId, loadByReview])

  if (isLoading) {
    return <div className="r-card p-6 text-center text-xs text-rhythm-text-muted">加载中...</div>
  }

  if (reviews.length === 0) {
    return (
      <TabPlaceholder
        title="还没有周回顾"
        hint="每周日 AI 会自动生成本周的观察与建议"
      />
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((r) => {
        const isExpanded = expandedId === r.id
        return (
          <div key={r.id} className="r-card p-4">
            <button type="button"
              onClick={() => setExpandedId(isExpanded ? null : r.id)}
              className="w-full flex justify-between items-baseline mb-2 bg-transparent border-0 p-0 cursor-pointer text-left">
              <div>
                <div className="text-[0.6rem] tracking-[0.12em] uppercase text-rhythm-text-muted">
                  {r.status === 'confirmed' ? '已确认' : '未读'}
                </div>
                <h3 className="font-serifsc text-[0.95rem] font-medium m-0 mt-0.5">
                  {formatWeek(r.week_start, r.week_end)}
                </h3>
              </div>
              <span className="text-rhythm-text-muted text-sm">{isExpanded ? '−' : '+'}</span>
            </button>
            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-rhythm-border space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <Stat label="完成率" value={r.practice_completion_rate != null ? `${Math.round(r.practice_completion_rate * 100)}%` : '—'} />
                  <Stat label="复盘条数" value={String(r.reflection_count)} />
                  <Stat label="平均睡眠" value={r.average_sleep_hours != null ? `${r.average_sleep_hours.toFixed(1)}h` : '—'} />
                </div>
                {r.ai_body_md && (
                  <p className="text-[0.78rem] text-rhythm-text-secondary leading-relaxed whitespace-pre-line">
                    {r.ai_body_md}
                  </p>
                )}
                <div className="space-y-2">
                  {recs.map((rec) => <ObservationCard key={rec.id} rec={rec} />)}
                  {recs.length === 0 && (
                    <p className="text-[0.7rem] text-rhythm-text-muted text-center py-2">本周没有 AI 观察</p>
                  )}
                </div>
                {r.status !== 'confirmed' && (
                  <button type="button" onClick={() => updateStatus(r.id, 'confirmed')}
                    className="w-full py-2 rounded-lg text-xs bg-rhythm-glow-soft border border-rhythm-border-strong text-rhythm-glow cursor-pointer">
                    确认这周回顾
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-2 rounded-lg bg-rhythm-void/40 border border-rhythm-border">
      <div className="font-serifsc text-[1rem] text-rhythm-text-primary">{value}</div>
      <div className="text-[0.6rem] text-rhythm-text-muted mt-0.5">{label}</div>
    </div>
  )
}
```

- [ ] **Step 2**: `npm run typecheck`

- [ ] **Step 3**: Commit `feat(records): add WeeklyReviewFeed with observations`

---

## Task 8: 接入 records-page-client

**Files:** Modify `src/features/records/components/records-page-client.tsx`

- [ ] **Step 1**: Read current file. Add imports:
```tsx
import { TrendsPane } from '@/features/records/components/trends-pane'
import { WeeklyReviewFeed } from '@/features/records/components/weekly-review-feed'
```

- [ ] **Step 2**: Replace `activeSubTab === 'trends'` branch (the `<TabPlaceholder title="趋势建设中" ... />`) with `<TrendsPane />`.

- [ ] **Step 3**: Replace `activeTab === 'review'` branch (the `<TabPlaceholder title="AI 周回顾建设中" ... />`) with `<WeeklyReviewFeed />`.

- [ ] **Step 4**: `npm run typecheck && npm run build`.

- [ ] **Step 5**: Commit `feat(records): wire trends + review tabs to real components`

---

## Task 9: 全量验证

- [ ] **Step 1**: `/Users/EDY/.nvm/versions/node/v24.12.0/bin/node --test tests/*.test.ts` — 8 files PASS
- [ ] **Step 2**: `npm run build` — routes include all previous + no new routes changed
- [ ] **Step 3**: `git commit --allow-empty -m "chore(records): plan 6A verification checkpoint"`
