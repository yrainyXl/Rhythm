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
