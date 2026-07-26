-- 004_captures.sql
-- 增量 migration: 今日「记录此刻的想法」即时捕获表。
-- 一天可多条,按时间倒序。在已执行 001 的库上执行;不修改 001。

begin;

create table if not exists public.daily_captures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  local_date date not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists daily_captures_user_date_idx
  on public.daily_captures (user_id, local_date desc, created_at desc);

commit;
