-- 008_practice_source_highlight.sql
-- 实践可溯源到发起它的阅读词条。
-- 前置:已执行 001~007。

begin;

alter table public.practices
  add column if not exists source_highlight_id uuid
  references public.reading_highlights(id) on delete set null;

create index if not exists practices_source_highlight_idx
  on public.practices(source_highlight_id);

commit;
