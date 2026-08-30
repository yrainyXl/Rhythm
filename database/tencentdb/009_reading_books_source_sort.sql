-- 009_reading_books_source_sort.sql
-- reading_books 增加 source_sort:存微信读书 notebooks 接口的官方排序值(越大 = 最近阅读越靠前)。
-- 背景:updated_at 被 sync 的无条件 upsert + 触发器刷成全相同,不能作为「最后阅读」排序依据;
-- highlighted_at 只是「最后划线时间」。sort 才是微信读书书架的真实阅读顺序。
-- 前置:已执行 001~008。存量行 source_sort 为 NULL,下次微信读书同步后回填。

begin;

alter table public.reading_books
  add column if not exists source_sort bigint;

create index if not exists reading_books_source_sort_idx
  on public.reading_books(user_id, source_sort desc nulls last);

commit;
