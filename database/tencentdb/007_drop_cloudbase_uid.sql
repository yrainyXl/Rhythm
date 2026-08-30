-- 007_drop_cloudbase_uid.sql
-- 收尾迁移:本地鉴权落地后删除 CloudBase 遗留列,并收 password_hash NOT NULL。
-- 前置:已执行 006;所有存量用户已通过 scripts/create-user.mjs 设置口令。
-- 注意:此为不可逆步骤,须在 P0/P1 稳定运行后单独执行。

begin;

alter table public.app_users
  drop column if exists cloudbase_uid;

alter table public.app_users
  alter column password_hash set not null;

commit;
