-- 005_practice_rounds_active_unique.sql
-- 增量 migration: 保证一个实践最多一个 active 轮(部分唯一索引)。
-- 防止并发创建轮次请求导致多个 active 轮。在已执行 001 的库上执行。

begin;

create unique index if not exists practice_rounds_one_active_per_practice
  on public.practice_rounds (practice_id)
  where status = 'active';

commit;
