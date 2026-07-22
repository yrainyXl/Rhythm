import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const schema = readFileSync(new URL('../database/tencentdb/001_init_rhythm_schema.sql', import.meta.url), 'utf8')

const requiredTables = [
  'app_users', 'profiles', 'habits', 'habit_schedules', 'habit_occurrences', 'habit_logs',
  'sleep_records', 'exercise_templates', 'exercise_records', 'exercise_set_logs',
  'reading_books', 'reading_sessions', 'reading_highlights', 'daily_reflections', 'goals',
  'goal_key_results', 'goal_milestones', 'couples', 'couple_members', 'couple_invites',
  'shared_permissions', 'shared_plan_suggestions', 'encouragement_messages',
  'notification_settings', 'notification_logs', 'pattern_insights', 'topics', 'directions',
  'practices', 'practice_rounds', 'practice_logs', 'methods', 'weekly_reviews', 'ai_recommendations',
]

test('TencentDB schema creates every Rhythm table', () => {
  for (const table of requiredTables) {
    assert.match(schema, new RegExp(`create table(?: if not exists)? public\\.${table}\\b`, 'i'), `missing ${table}`)
  }
})

test('TencentDB schema uses CloudBase identity without Supabase auth or RLS', () => {
  assert.match(schema, /cloudbase_uid\s+text\s+not null\s+unique/i)
  assert.match(schema, /create (?:or replace )?function public\.handle_updated_at/i)
  assert.match(schema, /create trigger profiles_updated_at/i)
  assert.doesNotMatch(schema, /auth\.users|auth\.uid\(\)|enable row level security|create policy/i)
})
