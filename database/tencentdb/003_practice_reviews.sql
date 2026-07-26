-- 003_practice_reviews.sql
-- 增量 migration: practice_rounds 增加复盘字段。
-- 在已执行 001_init_rhythm_schema.sql 的库上执行;不修改 001。

begin;

alter table public.practice_rounds
  add column if not exists review_reality text,
  add column if not exists review_effect text,
  add column if not exists review_adjustment text;

commit;
