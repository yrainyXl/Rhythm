# TencentDB PostgreSQL 初始化 Schema 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 生成可在 TencentDB for PostgreSQL 17 空数据库直接执行的 Rhythm 初始化 SQL，移除 Supabase 身份/RLS 依赖并保留所有业务关系、索引和触发器。

**Architecture:** 新建 `public.app_users` 作为 CloudBase UID 与原有业务 UUID 的映射根实体，业务表继续使用 UUID 和 PostgreSQL 外键。初始化 SQL 只建立 schema；访问权限由后续 CloudBase 云函数/API 认证后显式过滤，不在数据库中保留 Supabase 的 `auth.uid()`、RLS 或 policy。

**Tech Stack:** PostgreSQL 17、PL/pgSQL、UUID、JSONB、CloudBase Auth（后续接入）。

---

## 文件结构

- Create: `database/tencentdb/001_init_rhythm_schema.sql` — TencentDB PostgreSQL 17 完整初始化 schema。
- Create: `tests/tencentdb-schema.test.ts` — 静态回归测试，验证 SQL 无 Supabase 依赖、覆盖所有业务表、包含映射表/触发器/关键索引。
- Modify: `docs/superpowers/specs/2026-07-22-cloudbase-tencentdb-migration-design.md` — 记录初始化脚本实际路径和执行方式。

### Task 1: 建立初始化 SQL 的契约测试

**Files:**
- Create: `tests/tencentdb-schema.test.ts`

- [ ] **Step 1: 写入失败测试，定义不可缺失和不可出现的内容**

```ts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const schema = readFileSync(new URL('../database/tencentdb/001_init_rhythm_schema.sql', import.meta.url), 'utf8')

const tables = [
  'app_users', 'profiles', 'habits', 'habit_schedules', 'habit_occurrences', 'habit_logs',
  'sleep_records', 'exercise_templates', 'exercise_records', 'exercise_set_logs',
  'reading_books', 'reading_sessions', 'reading_highlights', 'daily_reflections', 'goals',
  'goal_key_results', 'goal_milestones', 'couples', 'couple_members', 'couple_invites',
  'shared_permissions', 'shared_plan_suggestions', 'encouragement_messages',
  'notification_settings', 'notification_logs', 'pattern_insights', 'topics', 'directions',
  'practices', 'practice_rounds', 'practice_logs', 'methods', 'weekly_reviews', 'ai_recommendations',
]

test('TencentDB schema creates every Rhythm table', () => {
  for (const table of tables) {
    assert.match(schema, new RegExp(`create table if not exists public\\.${table} \\(`, 'i'))
  }
})

test('TencentDB schema has no Supabase auth or RLS dependency', () => {
  assert.doesNotMatch(schema, /auth\.users|auth\.uid\(\)|enable row level security|create policy/i)
})

test('TencentDB schema maps CloudBase users and preserves timestamp triggers', () => {
  assert.match(schema, /cloudbase_uid text not null unique/i)
  assert.match(schema, /create or replace function public\.handle_updated_at\(\)/i)
  assert.match(schema, /create trigger profiles_updated_at/i)
})
```

- [ ] **Step 2: 运行测试，确认因初始化 SQL 不存在而失败**

Run: `npm test -- tests/tencentdb-schema.test.ts`

Expected: FAIL，`ENOENT` 指向 `database/tencentdb/001_init_rhythm_schema.sql`。

- [ ] **Step 3: 提交测试契约**

```bash
git add tests/tencentdb-schema.test.ts
git commit -m "test(database): define TencentDB schema contract"
```

### Task 2: 定义用户映射、公共函数与个人资料表

**Files:**
- Create: `database/tencentdb/001_init_rhythm_schema.sql`
- Test: `tests/tencentdb-schema.test.ts`

- [ ] **Step 1: 创建 SQL 文件头、`app_users`、更新时间函数和 `profiles`**

```sql
begin;

create extension if not exists pgcrypto;

create table if not exists public.app_users (
  id uuid primary key,
  cloudbase_uid text not null unique,
  email text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.profiles (
  id uuid primary key references public.app_users(id) on delete cascade,
  email text not null,
  nickname text,
  avatar_url text,
  timezone text not null default 'Asia/Shanghai',
  preferred_wake_time time,
  preferred_sleep_time time,
  work_days integer[] not null default '{1,2,3,4,5}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger app_users_updated_at before update on public.app_users
  for each row execute function public.handle_updated_at();
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();
```

- [ ] **Step 2: 运行契约测试，确认通过 `app_users` 与 Supabase 排除项**

Run: `npm test -- tests/tencentdb-schema.test.ts`

Expected: 仍 FAIL，只因剩余业务表尚未定义；不得出现 `auth.users`、`auth.uid()`、RLS 或 policy 断言失败。

- [ ] **Step 3: 提交基础身份 schema**

```bash
git add database/tencentdb/001_init_rhythm_schema.sql
git commit -m "feat(database): add TencentDB user mapping schema"
```

### Task 3: 迁移基础业务、阅读、目标与情侣关系表

**Files:**
- Modify: `database/tencentdb/001_init_rhythm_schema.sql`
- Test: `tests/tencentdb-schema.test.ts`

- [ ] **Step 1: 从原 migration 迁入基础业务表**

将 [supabase/migrations/20240101000001_complete_schema.sql](../../supabase/migrations/20240101000001_complete_schema.sql) 中第 7–457 行的表定义、索引和 `updated_at` 触发器复制到 SQL 文件，并进行以下精确替换：

```sql
-- 所有原来的：
references public.profiles(id) on delete cascade

-- 保持不变：profiles.id 已引用 app_users.id。

-- 所有原来的 RLS 与 policy 区块（原文件第 460–519 行）完全不复制。
```

该步骤必须包含以下表：

```text
habits, habit_schedules, habit_occurrences, habit_logs,
sleep_records, exercise_templates, exercise_records, exercise_set_logs,
reading_books, reading_sessions, daily_reflections,
goals, goal_key_results, goal_milestones,
couples, couple_members, couple_invites, shared_permissions,
shared_plan_suggestions, encouragement_messages,
notification_settings, notification_logs, pattern_insights
```

- [ ] **Step 2: 追加阅读划线表与幂等索引**

```sql
create unique index if not exists reading_books_source_uniq
  on public.reading_books (user_id, source, source_book_id);

create table if not exists public.reading_highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.reading_books(id) on delete cascade,
  source text not null default 'weixin_read'
    check (source in ('weixin_read', 'manual', 'kindle', 'other')),
  source_bookmark_id text,
  kind text not null default 'highlight' check (kind in ('highlight', 'thought')),
  mark_text text,
  thought text,
  chapter_title text,
  chapter_uid bigint,
  color_style integer,
  highlighted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, source, source_bookmark_id)
);

create index if not exists reading_highlights_book_idx on public.reading_highlights (book_id);
```

- [ ] **Step 3: 运行测试，确认基础域、阅读、目标与情侣表全部覆盖**

Run: `npm test -- tests/tencentdb-schema.test.ts`

Expected: 仍 FAIL，仅因实践/AI 表尚未定义。

- [ ] **Step 4: 提交基础业务 schema**

```bash
git add database/tencentdb/001_init_rhythm_schema.sql
git commit -m "feat(database): add TencentDB core domain schema"
```

### Task 4: 添加实践、方向、周复盘与 AI 表

**Files:**
- Modify: `database/tencentdb/001_init_rhythm_schema.sql`
- Test: `tests/tencentdb-schema.test.ts`

- [ ] **Step 1: 添加 `directions` 表**

基于 [src/features/practice/store/practice-store.ts](../../src/features/practice/store/practice-store.ts) 的读取与写入字段，先添加缺失的方向表：

```sql
create table if not exists public.directions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger directions_updated_at before update on public.directions
  for each row execute function public.handle_updated_at();
create index directions_user_status_idx on public.directions (user_id, status);
```

- [ ] **Step 2: 添加实践域 SQL，替换 Supabase 用户外键并去除 RLS/policy**

将 [supabase/migrations/20260719_000010_practice_domain.sql](../../supabase/migrations/20260719_000010_practice_domain.sql) 的 `topics`、`practices`、`practice_rounds`、`practice_logs`、`methods` 表、索引和触发器加入初始化 SQL。每一处：

```sql
-- 原始：
user_id uuid not null references auth.users(id) on delete cascade

-- 替换为：
user_id uuid not null references public.profiles(id) on delete cascade
```

不复制 `alter table ... enable row level security` 或 `create policy` 行。

- [ ] **Step 3: 添加周复盘和 AI 推荐 SQL，替换 Supabase 用户外键并去除 RLS/policy**

将 [supabase/migrations/20260719_000011_ai_review.sql](../../supabase/migrations/20260719_000011_ai_review.sql) 的 `weekly_reviews`、`ai_recommendations` 表、索引和触发器加入初始化 SQL，使用：

```sql
user_id uuid not null references public.profiles(id) on delete cascade
```

不复制 RLS/policy 行。

- [ ] **Step 4: 关闭事务并运行完整测试**

在 SQL 文件最后添加：

```sql
commit;
```

Run: `npm test`

Expected: PASS，全部测试通过，且 `TencentDB schema creates every Rhythm table`、`TencentDB schema has no Supabase auth or RLS dependency`、`TencentDB schema maps CloudBase users and preserves timestamp triggers` 均通过。

- [ ] **Step 5: 提交实践和 AI schema**

```bash
git add database/tencentdb/001_init_rhythm_schema.sql tests/tencentdb-schema.test.ts
git commit -m "feat(database): complete TencentDB migration schema"
```

### Task 5: 增加部署说明和结构完整性检查

**Files:**
- Modify: `docs/superpowers/specs/2026-07-22-cloudbase-tencentdb-migration-design.md`
- Modify: `database/tencentdb/001_init_rhythm_schema.sql`

- [ ] **Step 1: 在 SQL 文件开始处添加可安全重试的部署注释**

```sql
-- Rhythm TencentDB PostgreSQL 17 initialization schema.
-- Run once against a new, empty database with a role that can create extensions.
-- This file creates schema only. Do not run it against the Supabase production database.
-- CloudBase authentication and all authorization checks are implemented by the API layer.
```

- [ ] **Step 2: 在设计文档的“SQL 执行与数据迁移”节后追加执行命令**

```md
### 初始化 TencentDB

将 `database/tencentdb/001_init_rhythm_schema.sql` 上传到可访问 TencentDB 私有网络的主机后执行：

```bash
psql "$TENCENTDB_DATABASE_URL" -v ON_ERROR_STOP=1 -f database/tencentdb/001_init_rhythm_schema.sql
```

完成后检查所有表：

```bash
psql "$TENCENTDB_DATABASE_URL" -c "select tablename from pg_tables where schemaname = 'public' order by tablename;"
```

不要对包含任何数据的生产库重复运行此文件。
```

- [ ] **Step 3: 运行最终静态验证**

Run: `npm test && git diff --check`

Expected: PASS，所有测试通过且无空白格式错误。

- [ ] **Step 4: 提交部署说明**

```bash
git add database/tencentdb/001_init_rhythm_schema.sql docs/superpowers/specs/2026-07-22-cloudbase-tencentdb-migration-design.md
git commit -m "docs(database): document TencentDB schema initialization"
```
