# Plan 5: Practice 领域 + 记录页数据接入

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development

**Goal:** 建 practice 领域数据模型(topics / practices / practice_rounds / practice_logs / methods),配套 zustand store + 列表 API,把记录页"记录"子 tab 的占位换成真实数据。

**Architecture:** 生成 SQL migrations 但**不自动 push**(用户手动执行);建 zustand `practice-store`,记录页列表直接读该 store。首轮只做 CRUD 骨架,详情页与创建流程延后。

**Tech:** Supabase Postgres + RLS · Zustand · Next.js 14

---

## 重要约束

- **不执行 `supabase db push`**。所有 DB 变更只输出 SQL 文件,提交到 git,用户自己执行。
- SQL 文件命名 `20260719_000010_*.sql` 起(避开已有的 20240101 序列)。
- 所有表启用 RLS,策略基于 `auth.uid() = user_id`。
- 所有表都有 `created_at / updated_at`,并挂 `handle_updated_at()` trigger(现有函数)。

---

## 数据模型

### topics(议题)
- id uuid pk, user_id uuid → auth.users
- question text not null(议题原话)
- status text: 'active' / 'archived' default 'active'
- created_at, updated_at

### practices(实践)
- id uuid pk, user_id, topic_id → topics(nullable,允许无议题的独立实践)
- title text not null
- assumption text(本轮假设,写在 practice 而不是 round 上,允许 round 之间迭代时更新)
- status text: 'active' / 'ended' default 'active'
- created_at, updated_at

### practice_rounds(轮次)
- id uuid pk, user_id, practice_id → practices
- round_number integer(第几轮,从 1 起)
- start_date date, end_date date(计划的开始/结束)
- assumption text(本轮独立的假设,覆盖 practice.assumption)
- conclusion text(本轮结论,ended 后填)
- status text: 'active' / 'ended'
- created_at, updated_at
- UNIQUE (practice_id, round_number)

### practice_logs(轮次内的每日记录)
- id uuid pk, user_id, round_id → practice_rounds
- local_date date not null
- status text: 'done' / 'partial' / 'skipped'
- note text(可选详细记录)
- created_at, updated_at
- UNIQUE (round_id, local_date)

### methods(我的方法)
- id uuid pk, user_id
- title text not null
- condition text(适用条件)
- source_round_id uuid → practice_rounds(nullable,方法来源的轮次)
- status text: 'confirmed' / 'validating' / 'archived' default 'confirmed'
- created_at, updated_at

---

## File Structure

**新增 migration(用户手动 push):**
- `supabase/migrations/20260719_000010_practice_domain.sql` — 5 张表 + RLS + triggers

**新增 store:**
- `src/features/practice/store/practice-store.ts` — zustand,含 `loadTopics/loadPractices/loadRounds/loadLogs` + CRUD API

**新增组件:**
- `src/features/records/components/practices-list.tsx` — 替代 records 页的 list 子 tab 占位

**修改:**
- `src/features/records/components/records-page-client.tsx` — list 子 tab 用 PracticesList
- `src/lib/supabase/database.types.ts` — 补充 5 张新表的类型(手动追加,直到用户跑 supabase gen types)

---

## Task 1: 生成 migration SQL

**Files:** Create `supabase/migrations/20260719_000010_practice_domain.sql`

- [ ] **Step 1: Write SQL**

```sql
-- Migration: Practice 领域数据模型
-- Depends on: 20240101000000_create_profiles.sql (handle_updated_at function)

-- 1. TOPICS
create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question text not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.topics enable row level security;
create policy "topics select own" on public.topics for select using (auth.uid() = user_id);
create policy "topics insert own" on public.topics for insert with check (auth.uid() = user_id);
create policy "topics update own" on public.topics for update using (auth.uid() = user_id);
create policy "topics delete own" on public.topics for delete using (auth.uid() = user_id);
create trigger topics_updated_at before update on public.topics
  for each row execute function public.handle_updated_at();
create index topics_user_status_idx on public.topics(user_id, status);

-- 2. PRACTICES
create table if not exists public.practices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid references public.topics(id) on delete set null,
  title text not null,
  assumption text,
  status text not null default 'active' check (status in ('active', 'ended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.practices enable row level security;
create policy "practices select own" on public.practices for select using (auth.uid() = user_id);
create policy "practices insert own" on public.practices for insert with check (auth.uid() = user_id);
create policy "practices update own" on public.practices for update using (auth.uid() = user_id);
create policy "practices delete own" on public.practices for delete using (auth.uid() = user_id);
create trigger practices_updated_at before update on public.practices
  for each row execute function public.handle_updated_at();
create index practices_user_status_idx on public.practices(user_id, status);
create index practices_topic_idx on public.practices(topic_id);

-- 3. PRACTICE_ROUNDS
create table if not exists public.practice_rounds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  practice_id uuid not null references public.practices(id) on delete cascade,
  round_number integer not null check (round_number > 0),
  start_date date not null,
  end_date date not null,
  assumption text,
  conclusion text,
  status text not null default 'active' check (status in ('active', 'ended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (practice_id, round_number)
);
alter table public.practice_rounds enable row level security;
create policy "practice_rounds select own" on public.practice_rounds for select using (auth.uid() = user_id);
create policy "practice_rounds insert own" on public.practice_rounds for insert with check (auth.uid() = user_id);
create policy "practice_rounds update own" on public.practice_rounds for update using (auth.uid() = user_id);
create policy "practice_rounds delete own" on public.practice_rounds for delete using (auth.uid() = user_id);
create trigger practice_rounds_updated_at before update on public.practice_rounds
  for each row execute function public.handle_updated_at();
create index practice_rounds_user_status_idx on public.practice_rounds(user_id, status);
create index practice_rounds_practice_idx on public.practice_rounds(practice_id);

-- 4. PRACTICE_LOGS
create table if not exists public.practice_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  round_id uuid not null references public.practice_rounds(id) on delete cascade,
  local_date date not null,
  status text not null check (status in ('done', 'partial', 'skipped')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (round_id, local_date)
);
alter table public.practice_logs enable row level security;
create policy "practice_logs select own" on public.practice_logs for select using (auth.uid() = user_id);
create policy "practice_logs insert own" on public.practice_logs for insert with check (auth.uid() = user_id);
create policy "practice_logs update own" on public.practice_logs for update using (auth.uid() = user_id);
create policy "practice_logs delete own" on public.practice_logs for delete using (auth.uid() = user_id);
create trigger practice_logs_updated_at before update on public.practice_logs
  for each row execute function public.handle_updated_at();
create index practice_logs_round_date_idx on public.practice_logs(round_id, local_date desc);
create index practice_logs_user_date_idx on public.practice_logs(user_id, local_date desc);

-- 5. METHODS
create table if not exists public.methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  condition text,
  source_round_id uuid references public.practice_rounds(id) on delete set null,
  status text not null default 'confirmed' check (status in ('confirmed', 'validating', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.methods enable row level security;
create policy "methods select own" on public.methods for select using (auth.uid() = user_id);
create policy "methods insert own" on public.methods for insert with check (auth.uid() = user_id);
create policy "methods update own" on public.methods for update using (auth.uid() = user_id);
create policy "methods delete own" on public.methods for delete using (auth.uid() = user_id);
create trigger methods_updated_at before update on public.methods
  for each row execute function public.handle_updated_at();
create index methods_user_status_idx on public.methods(user_id, status);
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260719_000010_practice_domain.sql
git commit -m "feat(db): add practice domain migration (topics/practices/rounds/logs/methods)"
```

**注意:此 SQL 不自动执行。用户需运行 `supabase db push` 手动 apply。**

---

## Task 2: 补充 database.types.ts

**Files:** Modify `src/lib/supabase/database.types.ts`

**动作:** 在 `Tables:` 键下追加 5 张新表的类型定义。**格式模仿现有 habit_occurrences 等表**(Row / Insert / Update)。

**注意:** 不要用 `supabase gen types` 自动生成 —— 项目 note 已说明 database.types.ts 是手写的、缺 Relationships 键。手动追加 5 张表的类型即可。

- [ ] **Step 1: Read** `src/lib/supabase/database.types.ts` 找 `Tables:` 键的位置(约在文件中段),看现有 `habit_occurrences` 表的 Row / Insert / Update 格式。

- [ ] **Step 2:** 在 `Tables:` 键下追加以下 5 个块(放在 `couples` 前 or 文件末尾,follow the existing convention):

```ts
      topics: {
        Row: {
          id: string
          user_id: string
          question: string
          status: 'active' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          question: string
          status?: 'active' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          question?: string
          status?: 'active' | 'archived'
          created_at?: string
          updated_at?: string
        }
      }
      practices: {
        Row: {
          id: string
          user_id: string
          topic_id: string | null
          title: string
          assumption: string | null
          status: 'active' | 'ended'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          topic_id?: string | null
          title: string
          assumption?: string | null
          status?: 'active' | 'ended'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          topic_id?: string | null
          title?: string
          assumption?: string | null
          status?: 'active' | 'ended'
          created_at?: string
          updated_at?: string
        }
      }
      practice_rounds: {
        Row: {
          id: string
          user_id: string
          practice_id: string
          round_number: number
          start_date: string
          end_date: string
          assumption: string | null
          conclusion: string | null
          status: 'active' | 'ended'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          practice_id: string
          round_number: number
          start_date: string
          end_date: string
          assumption?: string | null
          conclusion?: string | null
          status?: 'active' | 'ended'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          practice_id?: string
          round_number?: number
          start_date?: string
          end_date?: string
          assumption?: string | null
          conclusion?: string | null
          status?: 'active' | 'ended'
          created_at?: string
          updated_at?: string
        }
      }
      practice_logs: {
        Row: {
          id: string
          user_id: string
          round_id: string
          local_date: string
          status: 'done' | 'partial' | 'skipped'
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          round_id: string
          local_date: string
          status: 'done' | 'partial' | 'skipped'
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          round_id?: string
          local_date?: string
          status?: 'done' | 'partial' | 'skipped'
          note?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      methods: {
        Row: {
          id: string
          user_id: string
          title: string
          condition: string | null
          source_round_id: string | null
          status: 'confirmed' | 'validating' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          condition?: string | null
          source_round_id?: string | null
          status?: 'confirmed' | 'validating' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          condition?: string | null
          source_round_id?: string | null
          status?: 'confirmed' | 'validating' | 'archived'
          created_at?: string
          updated_at?: string
        }
      }
```

- [ ] **Step 3:** `npm run typecheck` — expect no new errors from `database.types.ts`

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/database.types.ts
git commit -m "feat(db): add practice domain types to database.types.ts"
```

---

## Task 3: 建 practice-store

**Files:** Create `src/features/practice/store/practice-store.ts`

- [ ] **Step 1: Write store**

```ts
'use client'

import { create } from 'zustand'
import { createBrowserClient, getCurrentUser } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type Topic = Database['public']['Tables']['topics']['Row']
type Practice = Database['public']['Tables']['practices']['Row']
type PracticeRound = Database['public']['Tables']['practice_rounds']['Row']

export interface PracticeWithLatestRound extends Practice {
  latestRound: PracticeRound | null
}

interface PracticeState {
  practices: PracticeWithLatestRound[]
  topics: Topic[]
  isLoadingPractices: boolean

  loadPractices: () => Promise<void>
  loadTopics: () => Promise<void>
}

export const usePracticeStore = create<PracticeState>((set) => ({
  practices: [],
  topics: [],
  isLoadingPractices: true,

  loadPractices: async () => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) {
      set({ isLoadingPractices: false })
      return
    }

    const { data: practices } = await supabase
      .from('practices')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!practices) {
      set({ practices: [], isLoadingPractices: false })
      return
    }

    const { data: rounds } = await supabase
      .from('practice_rounds')
      .select('*')
      .eq('user_id', user.id)
      .order('round_number', { ascending: false })

    const roundsByPractice = new Map<string, PracticeRound>()
    for (const r of rounds ?? []) {
      if (!roundsByPractice.has(r.practice_id)) {
        roundsByPractice.set(r.practice_id, r)
      }
    }

    const withRounds: PracticeWithLatestRound[] = practices.map((p) => ({
      ...p,
      latestRound: roundsByPractice.get(p.id) ?? null,
    }))

    set({ practices: withRounds, isLoadingPractices: false })
  },

  loadTopics: async () => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return

    const { data } = await supabase
      .from('topics')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    set({ topics: data ?? [] })
  },
}))
```

- [ ] **Step 2:** `mkdir -p src/features/practice/store` + `npm run typecheck`

- [ ] **Step 3: Commit**

```bash
git add src/features/practice/store/practice-store.ts
git commit -m "feat(practice): add zustand store with loadPractices/loadTopics"
```

---

## Task 4: PracticesList 组件替代占位

**Files:** Create `src/features/records/components/practices-list.tsx`

- [ ] **Step 1: Write**

```tsx
'use client'

import { useEffect } from 'react'
import { usePracticeStore } from '@/features/practice/store/practice-store'
import { TabPlaceholder } from '@/features/records/components/tab-placeholder'

function formatRange(start: string, end: string): string {
  const parseM = (iso: string) => {
    const [, m, d] = iso.split('-').map(Number)
    return `${m}月${d}日`
  }
  return `${parseM(start)}–${parseM(end)}`
}

export function PracticesList() {
  const { practices, isLoadingPractices, loadPractices } = usePracticeStore()

  useEffect(() => {
    loadPractices()
  }, [loadPractices])

  if (isLoadingPractices) {
    return (
      <div className="r-card p-6 text-center text-xs text-rhythm-text-muted">加载中...</div>
    )
  }

  if (practices.length === 0) {
    return (
      <TabPlaceholder
        title="还没有实践"
        hint="发起你的第一轮实践,记录假设和每日进展"
      />
    )
  }

  return (
    <div className="space-y-3">
      {practices.map((p) => {
        const active = p.status === 'active'
        const r = p.latestRound
        return (
          <div key={p.id} className="r-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[0.6rem] tracking-[0.12em] uppercase ${
                active ? 'text-rhythm-glow' : 'text-rhythm-text-muted'
              }`}>
                {active ? '进行中' : '已完成'}
              </span>
              {r && (
                <span className="text-[0.62rem] text-rhythm-text-muted">
                  {formatRange(r.start_date, r.end_date)}
                </span>
              )}
            </div>
            <h3 className="font-serifsc text-[0.9rem] font-medium m-0 mb-1">{p.title}</h3>
            {p.assumption && (
              <p className="text-[0.72rem] text-rhythm-text-secondary leading-relaxed m-0 mb-2">
                {p.assumption}
              </p>
            )}
            {r && (
              <div className="text-[0.68rem] text-rhythm-text-muted">
                第 <span className="font-serifsc text-rhythm-text-primary">{r.round_number}</span> 轮
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2:** `npm run typecheck`

- [ ] **Step 3: Commit**

```bash
git add src/features/records/components/practices-list.tsx
git commit -m "feat(records): add PracticesList backed by practice-store"
```

---

## Task 5: 记录页 list 子 tab 用 PracticesList 替代占位

**Files:** Modify `src/features/records/components/records-page-client.tsx`

- [ ] **Step 1: Read the current file to locate the list branch**

The current file has a section like:
```tsx
{activeSubTab === 'list' ? (
  <TabPlaceholder
    title="实践记录建设中"
    hint="下阶段接入实践数据后,这里会显示所有实践的轮次与时间线"
  />
) : (
  <TabPlaceholder title="趋势建设中" hint="..." />
)}
```

- [ ] **Step 2: Add import at top**

```tsx
import { PracticesList } from '@/features/records/components/practices-list'
```

- [ ] **Step 3: Replace the list-branch placeholder with `<PracticesList />`**

Result:
```tsx
{activeSubTab === 'list' ? (
  <PracticesList />
) : (
  <TabPlaceholder title="趋势建设中" hint="..." />
)}
```

Keep the trends branch and TabPlaceholder import unchanged.

- [ ] **Step 4:** `npm run typecheck && npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/features/records/components/records-page-client.tsx
git commit -m "feat(records): wire records list tab to PracticesList"
```

---

## Task 6: 验证

- [ ] **Step 1: Full tests** — expect 8 files still PASS.
- [ ] **Step 2: Typecheck + build** — no new errors from practice-scope files; build succeeds.
- [ ] **Step 3: Grep** `@/features/practice/store/` — expect 1 hit in `practices-list.tsx`.
- [ ] **Step 4: Empty checkpoint commit**

```bash
git commit --allow-empty -m "chore(practice): plan 5 verification checkpoint"
```

**注意:** 由于 migrations 未 apply,`practices` 表不存在,`loadPractices` 会返回 null → 组件走空状态。这在没跑 db push 前是预期。跑完 db push 后再看真实数据。

---

## Self-Review

**范围:**
- 5 张新表 SQL(用户自己 push)✓
- database.types.ts 手动追加类型 ✓
- practice-store(loadPractices/loadTopics 只读)✓
- PracticesList 组件 + 记录页接线 ✓

**不做:**
- 详情页 /records/practice/[id]
- 创建实践 / 新增轮次 / 添加 log 的写入 UI
- topics/methods 的独立 UI
- 计划页 /habits 的 EntryCard 接实数据(下轮或 plan 6)

**未来:**
- 计划页需要 practice/topic/method 计数 → 让 EntryCard 消费 practice-store
- 记录页详情页 → 独立路由
- 阅读页 AI 主题 → Plan 6
