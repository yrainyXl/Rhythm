import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import test from 'node:test'

// 拼接 database/tencentdb/ 下所有 migration 脚本(001/002/...),按文件名顺序
const schemaDir = new URL('../database/tencentdb/', import.meta.url)
const schema = readdirSync(schemaDir)
  .filter((f) => f.endsWith('.sql'))
  .sort()
  .map((f) => readFileSync(new URL(f, schemaDir), 'utf8'))
  .join('\n')

const requiredTables = [
  'app_users', 'profiles', 'habits', 'habit_schedules', 'habit_occurrences', 'habit_logs',
  'sleep_records', 'exercise_templates', 'exercise_records', 'exercise_set_logs',
  'reading_books', 'reading_sessions', 'reading_highlights', 'daily_reflections', 'goals',
  'goal_key_results', 'goal_milestones',
  'daily_arrangements',
  'notification_settings', 'notification_logs', 'pattern_insights', 'topics', 'directions',
  'practices', 'practice_rounds', 'practice_logs', 'methods', 'weekly_reviews', 'ai_recommendations',
  'sessions',
]

test('TencentDB schema creates every Rhythm table', () => {
  for (const table of requiredTables) {
    assert.match(schema, new RegExp(`create table(?: if not exists)? public\\.${table}\\b`, 'i'), `missing ${table}`)
  }
})

test('TencentDB schema uses local identity without Supabase auth or RLS', () => {
  // cloudbase_uid 在 P0 保留(007 删除),鉴权已本地化
  assert.match(schema, /cloudbase_uid\s+text\s+not null\s+unique/i)
  assert.match(schema, /add column(?: if not exists)? password_hash\s+text/i)
  assert.match(schema, /create (?:or replace )?function public\.handle_updated_at/i)
  assert.match(schema, /create trigger profiles_updated_at/i)
  assert.doesNotMatch(schema, /auth\.users|auth\.uid\(\)|enable row level security|create policy/i)
})

test('TencentDB schema defines session table with dual expiry', () => {
  assert.match(schema, /create table(?: if not exists)? public\.sessions\b/i)
  assert.match(schema, /expires_at\s+timestamptz\s+not null/i)
  assert.match(schema, /absolute_expires_at\s+timestamptz\s+not null/i)
  assert.match(schema, /token_hash\s+text\s+primary key/i)
})
