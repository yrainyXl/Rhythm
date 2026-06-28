-- Migration 2: Complete database schema for 节奏 App
-- Run after 20240101000000_create_profiles.sql
-- Note: handle_updated_at() function already exists from migration 1

----------------------------------------------------------------------
-- 1. HABITS
----------------------------------------------------------------------
create table if not exists public.habits (
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
create table if not exists public.habit_schedules (
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
create table if not exists public.habit_occurrences (
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
create table if not exists public.habit_logs (
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
create table if not exists public.sleep_records (
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
create table if not exists public.exercise_templates (
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
create table if not exists public.exercise_records (
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
create table if not exists public.exercise_set_logs (
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
create table if not exists public.reading_books (
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
create table if not exists public.reading_sessions (
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
create table if not exists public.daily_reflections (
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
create table if not exists public.goals (
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
create table if not exists public.goal_key_results (
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
create table if not exists public.goal_milestones (
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
create table if not exists public.couples (
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
create table if not exists public.couple_members (
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
create table if not exists public.couple_invites (
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
create table if not exists public.shared_permissions (
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
create table if not exists public.shared_plan_suggestions (
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
create table if not exists public.encouragement_messages (
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
create table if not exists public.notification_settings (
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
create table if not exists public.notification_logs (
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
create table if not exists public.pattern_insights (
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
-- RLS 策略
----------------------------------------------------------------------
alter table public.habits enable row level security;
alter table public.habit_schedules enable row level security;
alter table public.habit_occurrences enable row level security;
alter table public.habit_logs enable row level security;
alter table public.sleep_records enable row level security;
alter table public.exercise_templates enable row level security;
alter table public.exercise_records enable row level security;
alter table public.exercise_set_logs enable row level security;
alter table public.reading_books enable row level security;
alter table public.reading_sessions enable row level security;
alter table public.daily_reflections enable row level security;
alter table public.goals enable row level security;
alter table public.goal_key_results enable row level security;
alter table public.goal_milestones enable row level security;
alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.couple_invites enable row level security;
alter table public.shared_permissions enable row level security;
alter table public.shared_plan_suggestions enable row level security;
alter table public.encouragement_messages enable row level security;
alter table public.notification_settings enable row level security;
alter table public.notification_logs enable row level security;
alter table public.pattern_insights enable row level security;

-- 用户只能访问自己的数据
create policy "Users can manage own habits" on public.habits for all using (auth.uid() = user_id);
create policy "Users can manage own habit schedules" on public.habit_schedules for all using (habit_id in (select id from public.habits where user_id = auth.uid()));
create policy "Users can manage own occurrences" on public.habit_occurrences for all using (auth.uid() = user_id);
create policy "Users can manage own habit logs" on public.habit_logs for all using (auth.uid() = user_id);
create policy "Users can manage own sleep records" on public.sleep_records for all using (auth.uid() = user_id);
create policy "Users can manage own exercise templates" on public.exercise_templates for all using (auth.uid() = user_id);
create policy "Users can manage own exercise records" on public.exercise_records for all using (auth.uid() = user_id);
create policy "Users can manage own exercise set logs" on public.exercise_set_logs for all using (auth.uid() = user_id);
create policy "Users can manage own books" on public.reading_books for all using (auth.uid() = user_id);
create policy "Users can manage own reading sessions" on public.reading_sessions for all using (auth.uid() = user_id);
create policy "Users can manage own reflections" on public.daily_reflections for all using (auth.uid() = user_id);
create policy "Users can manage own goals" on public.goals for all using (auth.uid() = user_id);
create policy "Users can manage own key results" on public.goal_key_results for all using (auth.uid() = user_id);
create policy "Users can manage own milestones" on public.goal_milestones for all using (auth.uid() = user_id);

-- 情侣相关
create policy "Couple members can view own couple" on public.couples for select using (exists (select 1 from public.couple_members where couple_id = id and user_id = auth.uid()));
create policy "Users can view own couple memberships" on public.couple_members for select using (user_id = auth.uid() or couple_id in (select couple_id from public.couple_members where user_id = auth.uid()));
create policy "Users can manage own invites" on public.couple_invites for all using (inviter_id = auth.uid());
create policy "Anyone can lookup invite codes" on public.couple_invites for select using (true);
create policy "Users can manage own shared permissions" on public.shared_permissions for all using (auth.uid() = user_id);
create policy "Partner can view shared permissions" on public.shared_permissions for select using (exists (select 1 from public.couple_members cm1 join public.couple_members cm2 on cm1.couple_id = cm2.couple_id where cm1.user_id = auth.uid() and cm2.user_id = shared_permissions.user_id));
create policy "Users can view suggestions involving them" on public.shared_plan_suggestions for select using (sender_id = auth.uid() or receiver_id = auth.uid());
create policy "Users can send suggestions" on public.shared_plan_suggestions for insert with check (sender_id = auth.uid());
create policy "Receivers can update suggestion status" on public.shared_plan_suggestions for update using (receiver_id = auth.uid());
create policy "Couple members can view encouragement messages" on public.encouragement_messages for select using (couple_id in (select couple_id from public.couple_members where user_id = auth.uid()));
create policy "Users can send encouragement messages" on public.encouragement_messages for insert with check (sender_id = auth.uid());

-- 通知和 AI
create policy "Users can manage own notification settings" on public.notification_settings for all using (auth.uid() = user_id);
create policy "Users can manage own notification logs" on public.notification_logs for all using (auth.uid() = user_id);
create policy "Users can view own pattern insights" on public.pattern_insights for all using (auth.uid() = user_id);
