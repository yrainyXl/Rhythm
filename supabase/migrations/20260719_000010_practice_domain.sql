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
