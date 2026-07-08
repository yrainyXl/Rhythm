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

create table if not exists public.reading_highlights (
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

alter table public.reading_highlights enable row level security;

create policy "Users can manage own highlights"
  on public.reading_highlights for all using (auth.uid() = user_id);
