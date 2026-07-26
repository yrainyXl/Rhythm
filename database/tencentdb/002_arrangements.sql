-- 002_arrangements.sql
-- 增量 migration: 今日安排表。
-- 在已执行 001_init_rhythm_schema.sql 的库上执行;不修改 001。

begin;

create table public.daily_arrangements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  local_date date not null,                 -- 用户时区当天日期
  band text not null check (band in ('morning','afternoon','evening','night')),
  scheduled_time time,                      -- 可选具体时间(如 20:30)
  title text not null,
  status text not null default 'pending' check (status in ('pending','done','cancelled')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index daily_arrangements_user_date
  on public.daily_arrangements(user_id, local_date, band, sort_order);

create trigger daily_arrangements_updated_at
  before update on public.daily_arrangements
  for each row execute function public.handle_updated_at();

commit;
