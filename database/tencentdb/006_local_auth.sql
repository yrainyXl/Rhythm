-- 006_local_auth.sql
-- 增量 migration: 自托管本地鉴权（数据库 Session Cookie）。
-- 在已执行 001~005 的库上执行;不修改既有表结构（cloudbase_uid 的删除放到 007）。
-- 说明: app_users 新增 password_hash 存 scrypt 口令哈希;新增 sessions 会话表。

begin;

-- 1) app_users：加口令哈希。
-- 存量行先为 null（口令由 scripts/create-user.mjs 补齐），补齐后可在 007 收 NOT NULL。
alter table public.app_users
  add column if not exists password_hash text;

-- 新增用户不再需要 CloudBase 标识（该列将在 007 删除），先放宽 NOT NULL，
-- 使 create-user.mjs 可以只按 email 插入。
alter table public.app_users
  alter column cloudbase_uid drop not null;

-- 2) 会话表：token_hash 为主键（sha256(cookie token)），支持即时撤销与多端会话。
create table if not exists public.sessions (
  token_hash text primary key,             -- sha256(随机 256-bit token)
  user_id uuid not null references public.app_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  expires_at timestamptz not null,         -- 空闲过期（滑动续期作用于它）
  absolute_expires_at timestamptz not null -- 硬上限 = created_at + 90天
);

create index if not exists sessions_user_idx on public.sessions(user_id);
create index if not exists sessions_expires_idx on public.sessions(expires_at);

commit;
