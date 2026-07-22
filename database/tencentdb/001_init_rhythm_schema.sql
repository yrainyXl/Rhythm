-- Rhythm TencentDB PostgreSQL 17 initialization schema.
-- For an empty PostgreSQL 17 database only. Schema only; API layer enforces permissions.
-- Do not re-run against a production database that contains data.

begin;

create extension if not exists pgcrypto;

create table public.app_users (
  id uuid primary key default gen_random_uuid(),
  cloudbase_uid text not null unique,
  email text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
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

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger app_users_updated_at before update on public.app_users
  for each row execute function public.handle_updated_at();

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();


----------------------------------------------------------------------
-- 1. HABITS
----------------------------------------------------------------------
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  category text not null default 'other'
    check (category in ('self_discipline', 'learning', 'exercise', 'sleep', 'diet', 'life', 'other')),
  icon text,
  color text default '#0ea5e9',
  target_type text not null
    check (target_type in ('boolean', 'duration', 'count', 'value')),
  target_value numeric,
  target_unit text,
  is_important boolean not null default false,
  is_shared boolean not null default false,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger habits_updated_at
  before update on public.habits
  for each row execute function public.handle_updated_at();

----------------------------------------------------------------------
-- 2. HABIT SCHEDULES
----------------------------------------------------------------------
create table public.habit_schedules (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  repeat_type text not null
    check (repeat_type in ('daily', 'weekdays', 'weekends', 'weekly', 'custom')),
  repeat_days integer[] default '{}',
  custom_dates date[] default '{}',
  start_date date not null,
  end_date date,
  reminder_time time,
  reminder_secondary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger habit_schedules_updated_at
  before update on public.habit_schedules
  for each row execute function public.handle_updated_at();

----------------------------------------------------------------------
-- 3. HABIT OCCURRENCES
----------------------------------------------------------------------
create table public.habit_occurrences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  local_date date not null,
  title_snapshot text not null,
  target_type_snapshot text not null,
  target_value_snapshot numeric,
  target_unit_snapshot text,
  status text not null default 'pending'
    check (status in ('pending', 'done', 'skipped', 'missed')),
  completed_at timestamptz,
  skipped_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, habit_id, local_date)
);

create trigger habit_occurrences_updated_at
  before update on public.habit_occurrences
  for each row execute function public.handle_updated_at();

----------------------------------------------------------------------
-- 4. HABIT LOGS
----------------------------------------------------------------------
create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  occurrence_id uuid not null references public.habit_occurrences(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  actual_value numeric,
  actual_duration integer,
  feeling integer check (feeling between 1 and 5),
  context text,
  note text,
  created_at timestamptz not null default now()
);

----------------------------------------------------------------------
-- 5. SLEEP RECORDS
----------------------------------------------------------------------
create table public.sleep_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  sleep_date date not null,
  sleep_time time not null,
  wake_date date,
  wake_time time,
  duration_minutes integer,
  quality text check (quality in ('great', 'fair', 'poor')),
  pre_sleep_activities jsonb default '[]'::jsonb,
  note text,
  is_shared boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger sleep_records_updated_at
  before update on public.sleep_records
  for each row execute function public.handle_updated_at();

----------------------------------------------------------------------
-- 6. EXERCISE TEMPLATES
----------------------------------------------------------------------
create table public.exercise_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  category text not null default 'other'
    check (category in ('running', 'walking', 'gym', 'stretching', 'cycling', 'yoga', 'ball', 'rehab', 'other')),
  is_rehab boolean not null default false,
  default_sets integer default 1,
  default_reps integer,
  default_duration integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger exercise_templates_updated_at
  before update on public.exercise_templates
  for each row execute function public.handle_updated_at();

----------------------------------------------------------------------
-- 7. EXERCISE RECORDS
----------------------------------------------------------------------
create table public.exercise_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  template_id uuid references public.exercise_templates(id) on delete set null,
  exercise_date date not null,
  start_time timestamptz,
  end_time timestamptz,
  duration_minutes integer,
  distance_km numeric,
  intensity text check (intensity in ('light', 'moderate', 'intense')),
  feeling integer check (feeling between 1 and 5),
  note text,
  is_shared boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger exercise_records_updated_at
  before update on public.exercise_records
  for each row execute function public.handle_updated_at();

----------------------------------------------------------------------
-- 8. EXERCISE SET LOGS
----------------------------------------------------------------------
create table public.exercise_set_logs (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.exercise_records(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  set_number integer not null,
  reps integer,
  weight_kg numeric,
  duration_seconds integer,
  feeling text check (feeling in ('easy', 'slight', 'challenging', 'painful')),
  is_completed boolean not null default true,
  created_at timestamptz not null default now()
);

----------------------------------------------------------------------
-- 9. READING BOOKS
----------------------------------------------------------------------
create table public.reading_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  author text,
  isbn text,
  total_pages integer,
  current_page integer default 0,
  status text not null default 'reading'
    check (status in ('reading', 'finished', 'paused', 'dropped')),
  source text default 'manual'
    check (source in ('manual', 'weixin_read', 'kindle', 'other')),
  source_book_id text,
  cover_url text,
  rating integer check (rating between 1 and 5),
  is_shared boolean not null default false,
  started_at date,
  finished_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger reading_books_updated_at
  before update on public.reading_books
  for each row execute function public.handle_updated_at();

----------------------------------------------------------------------
-- 10. READING SESSIONS
----------------------------------------------------------------------
create table public.reading_sessions (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.reading_books(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_date date not null,
  duration_minutes integer not null,
  pages_read integer,
  start_page integer,
  end_page integer,
  highlights text,
  note text,
  created_at timestamptz not null default now()
);

----------------------------------------------------------------------
-- 11. DAILY REFLECTIONS
----------------------------------------------------------------------
create table public.daily_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  local_date date not null,
  mood text check (mood in ('great', 'fair', 'poor')),
  best_thing text,
  improve_thing text,
  tomorrow_focus text,
  note text,
  is_shared boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, local_date)
);

create trigger daily_reflections_updated_at
  before update on public.daily_reflections
  for each row execute function public.handle_updated_at();

----------------------------------------------------------------------
-- 12. GOALS
----------------------------------------------------------------------
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  category text default 'other'
    check (category in ('personal_growth', 'health', 'career', 'learning', 'reading', 'fitness', 'other')),
  target_date date,
  status text not null default 'active'
    check (status in ('active', 'completed', 'abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger goals_updated_at
  before update on public.goals
  for each row execute function public.handle_updated_at();

----------------------------------------------------------------------
-- 13. GOAL KEY RESULTS
----------------------------------------------------------------------
create table public.goal_key_results (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  target_value numeric,
  current_value numeric default 0,
  unit text,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger goal_key_results_updated_at
  before update on public.goal_key_results
  for each row execute function public.handle_updated_at();

----------------------------------------------------------------------
-- 14. GOAL MILESTONES
----------------------------------------------------------------------
create table public.goal_milestones (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  key_result_id uuid references public.goal_key_results(id) on delete set null,
  title text not null,
  due_date date,
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger goal_milestones_updated_at
  before update on public.goal_milestones
  for each row execute function public.handle_updated_at();

----------------------------------------------------------------------
-- 15. COUPLES
----------------------------------------------------------------------
create table public.couples (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'active'
    check (status in ('active', 'disbanded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger couples_updated_at
  before update on public.couples
  for each row execute function public.handle_updated_at();

----------------------------------------------------------------------
-- 16. COUPLE MEMBERS
----------------------------------------------------------------------
create table public.couple_members (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique(couple_id, user_id),
  unique(user_id)
);

----------------------------------------------------------------------
-- 17. COUPLE INVITES
----------------------------------------------------------------------
create table public.couple_invites (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  invite_code text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger couple_invites_updated_at
  before update on public.couple_invites
  for each row execute function public.handle_updated_at();

----------------------------------------------------------------------
-- 18. SHARED PERMISSIONS
----------------------------------------------------------------------
create table public.shared_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  data_type text not null
    check (data_type in ('habits', 'sleep', 'exercise', 'reading', 'reflection', 'goals')),
  share_level text not null default 'none'
    check (share_level in ('none', 'status', 'detail')),
  is_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, data_type)
);

create trigger shared_permissions_updated_at
  before update on public.shared_permissions
  for each row execute function public.handle_updated_at();

----------------------------------------------------------------------
-- 19. SHARED PLAN SUGGESTIONS
----------------------------------------------------------------------
create table public.shared_plan_suggestions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  suggested_date date,
  suggested_time time,
  suggestion_type text not null default 'exercise'
    check (suggestion_type in ('exercise', 'rest', 'sleep', 'other')),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'modified', 'rejected', 'ignored')),
  receiver_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger shared_plan_suggestions_updated_at
  before update on public.shared_plan_suggestions
  for each row execute function public.handle_updated_at();

----------------------------------------------------------------------
-- 20. ENCOURAGEMENT MESSAGES
----------------------------------------------------------------------
create table public.encouragement_messages (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  message_type text not null default 'custom'
    check (message_type in ('加油', '辛苦了', '早点休息', 'custom')),
  created_at timestamptz not null default now()
);

----------------------------------------------------------------------
-- 21. NOTIFICATION SETTINGS
----------------------------------------------------------------------
create table public.notification_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  habit_id uuid references public.habits(id) on delete cascade,
  is_enabled boolean not null default true,
  reminder_time time,
  reminder_type text not null default 'primary'
    check (reminder_type in ('primary', 'secondary')),
  last_triggered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger notification_settings_updated_at
  before update on public.notification_settings
  for each row execute function public.handle_updated_at();

----------------------------------------------------------------------
-- 22. NOTIFICATION LOGS
----------------------------------------------------------------------
create table public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  habit_id uuid references public.habits(id) on delete set null,
  notification_type text not null,
  title text not null,
  body text,
  triggered_at timestamptz not null default now(),
  read_at timestamptz
);

----------------------------------------------------------------------
-- 23. PATTERN INSIGHTS
----------------------------------------------------------------------
create table public.pattern_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  insight_type text not null,
  title text not null,
  content text not null,
  data_snapshot jsonb default '{}'::jsonb,
  is_read boolean not null default false,
  generated_at timestamptz not null default now()
);


----------------------------------------------------------------------
-- 微信读书划线 → 词条 (reading_highlights)
--
-- 存储从微信读书官方网关同步来的划线原文与个人想法，作为「词条」。
-- 幂等键 unique(user_id, source, source_bookmark_id)：重复同步用
-- upsert(onConflict) 覆盖，不产生重复词条。
----------------------------------------------------------------------

-- 让来源书籍(weixin_read)可按 source_book_id 幂等 upsert；
-- 用完整唯一索引(不带 WHERE)以便 supabase onConflict 按列名推断命中；
-- manual 书 source_book_id 为 null，Postgres 默认多个 null 互不冲突。
create unique index if not exists reading_books_source_uniq
  on public.reading_books (user_id, source, source_book_id);

create table public.reading_highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.reading_books(id) on delete cascade,
  source text not null default 'weixin_read'
    check (source in ('weixin_read', 'manual', 'kindle', 'other')),
  source_bookmark_id text,             -- 微信 bookmarkId / reviewId，幂等去重
  kind text not null default 'highlight'
    check (kind in ('highlight', 'thought')),
  mark_text text,                      -- 划线原文
  thought text,                        -- 个人想法(kind=thought，或划线关联想法)
  chapter_title text,
  chapter_uid bigint,
  color_style integer,
  highlighted_at timestamptz,          -- 微信 createTime
  created_at timestamptz not null default now(),
  unique (user_id, source, source_bookmark_id)
);

create index if not exists reading_highlights_book_idx
  on public.reading_highlights (book_id);



----------------------------------------------------------------------
-- 24. DIRECTIONS
----------------------------------------------------------------------
create table public.directions (
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

create index directions_user_status_idx on public.directions(user_id, status);

-- Migration: Practice 领域数据模型
-- Depends on: 20240101000000_create_profiles.sql (handle_updated_at function)

-- 1. TOPICS
create table public.topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  question text not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger topics_updated_at before update on public.topics
  for each row execute function public.handle_updated_at();
create index topics_user_status_idx on public.topics(user_id, status);

-- 2. PRACTICES
create table public.practices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic_id uuid references public.topics(id) on delete set null,
  title text not null,
  assumption text,
  status text not null default 'active' check (status in ('active', 'ended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger practices_updated_at before update on public.practices
  for each row execute function public.handle_updated_at();
create index practices_user_status_idx on public.practices(user_id, status);
create index practices_topic_idx on public.practices(topic_id);

-- 3. PRACTICE_ROUNDS
create table public.practice_rounds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
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
create trigger practice_rounds_updated_at before update on public.practice_rounds
  for each row execute function public.handle_updated_at();
create index practice_rounds_user_status_idx on public.practice_rounds(user_id, status);
create index practice_rounds_practice_idx on public.practice_rounds(practice_id);

-- 4. PRACTICE_LOGS
create table public.practice_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  round_id uuid not null references public.practice_rounds(id) on delete cascade,
  local_date date not null,
  status text not null check (status in ('done', 'partial', 'skipped')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (round_id, local_date)
);
create trigger practice_logs_updated_at before update on public.practice_logs
  for each row execute function public.handle_updated_at();
create index practice_logs_round_date_idx on public.practice_logs(round_id, local_date desc);
create index practice_logs_user_date_idx on public.practice_logs(user_id, local_date desc);

-- 5. METHODS
create table public.methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  condition text,
  source_round_id uuid references public.practice_rounds(id) on delete set null,
  status text not null default 'confirmed' check (status in ('confirmed', 'validating', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger methods_updated_at before update on public.methods
  for each row execute function public.handle_updated_at();
create index methods_user_status_idx on public.methods(user_id, status);
-- Migration: weekly reviews + AI recommendations

-- 1. WEEKLY REVIEWS
create table public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
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

create trigger on_weekly_reviews_updated before update on public.weekly_reviews for each row execute function public.handle_updated_at();
create index idx_weekly_reviews_user_week on public.weekly_reviews(user_id, week_start desc);

-- 2. AI RECOMMENDATIONS (共用于观察 + 推荐尝试)
create table public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
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

create trigger on_ai_rec_updated before update on public.ai_recommendations for each row execute function public.handle_updated_at();
create index idx_ai_rec_user_created on public.ai_recommendations(user_id, created_at desc);
create index idx_ai_rec_review on public.ai_recommendations(weekly_review_id);
commit;
