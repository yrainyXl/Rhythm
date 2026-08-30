-- 010_reading_books_source_counts.sql
-- reading_books 增加 source_note_count / source_review_count:存微信读书 notebooks 返回的划线/想法计数。
-- 用于增量同步:计数没变的书跳过 bookmarklist/review 拉取,大幅缩短同步耗时。
-- 前置:已执行 001~009。存量行为 NULL,下次同步时视为「有变化」全量拉一次,之后增量生效。

begin;

alter table public.reading_books
  add column if not exists source_note_count integer,
  add column if not exists source_review_count integer;

commit;
