# CloudBase + TencentDB PostgreSQL 迁移设计

## 目标

将 Rhythm 从 Supabase 迁移至 CloudBase 认证与云函数/API，并使用 TencentDB for PostgreSQL 17 承载业务数据。现有项目仅由单一用户使用，采用一次性数据迁移与切换，不执行灰度或长期双写。

## 边界

本阶段先交付 TencentDB 可执行的数据库初始化结构与数据迁移工具基础，不更改现有前端认证、路由中间件或业务 store。

目标数据库为空库。正式切换前必须完成 CloudBase 邮箱密码认证、服务端 API 层和历史数据导入验证。

## 目标架构

```text
Next.js 浏览器
  └─ CloudBase SDK（邮箱密码认证）
       └─ CloudBase 云函数 / API
            └─ TencentDB for PostgreSQL 17
```

浏览器不直接连接 PostgreSQL。云函数验证 CloudBase 身份，获取 CloudBase UID 后执行所有数据访问和授权判断。

## 身份模型

新增 `app_users` 表作为 CloudBase 用户与业务数据的根实体：

- `id`：UUID，作为现有业务表 `user_id` 的外键目标；
- `cloudbase_uid`：唯一、非空，存储 CloudBase 用户 UID；
- `email`：唯一、非空，存储认证邮箱；
- `created_at`、`updated_at`：审计字段。

正式导入时保留现有 Supabase 用户 UUID 作为 `app_users.id`，使所有历史业务表中的 `user_id` 无需重写。CloudBase UID 与邮箱在账号迁移步骤写入 `app_users`。

## Schema 转换

以 `supabase/migrations/*.sql` 为字段与关系来源，生成一份 TencentDB 专用初始化 SQL。

保留：

- 现有业务表、UUID 主键、JSONB 字段、枚举约束、外键、级联规则和索引；
- `handle_updated_at()` 及所有依赖它的 `BEFORE UPDATE` 触发器；
- 现有业务数据的 UUID 语义。

替换：

- 所有 `references auth.users(id)` 改为 `references public.profiles(id)`；
- `profiles.id` 保持为 `app_users.id` 的一对一外键；
- 缺失但被业务代码使用的 `directions` 表在初始化 SQL 中显式定义。

移除：

- `ENABLE ROW LEVEL SECURITY`；
- `CREATE POLICY`；
- `auth.uid()` 与全部 Supabase `auth` schema 引用。

权限由 CloudBase 云函数/API 显式实现：单用户数据按已验证 CloudBase UID 映射后的 `app_users.id` 过滤；情侣域按 `couple_members` 关系进行服务端授权。

## SQL 执行与数据迁移

初始化脚本路径为 `database/tencentdb/001_init_rhythm_schema.sql`。只允许在 PostgreSQL 17 空库执行；不要对已有数据的生产库重复执行，否则可能因对象已存在而失败，且不应将该脚本用作增量迁移。

使用 `psql` 执行：

```bash
psql "$TENCENTDB_DATABASE_URL" -v ON_ERROR_STOP=1 -f database/tencentdb/001_init_rhythm_schema.sql
```

执行后列出 `public` schema 的表：

```bash
psql "$TENCENTDB_DATABASE_URL" -c "\\dt public.*"
```

初始化 SQL 在 TencentDB 空数据库执行顺序：

1. 创建 `public` schema 所需扩展、`app_users` 和 `handle_updated_at()`；
2. 创建所有业务表及其约束；
3. 创建索引与更新时间触发器；
4. 导入 `app_users`，再按外键依赖顺序导入业务表；
5. 重设序列（如存在）、执行行数和外键校验。

历史认证凭据不能从 Supabase 导入 CloudBase。CloudBase 侧创建邮箱密码账号后，将其 UID 写入与既有 UUID 对应的 `app_users` 行。由于仅支持邮箱密码，切换窗口内需先确认所有历史用户都能在 CloudBase 完成账号创建与密码设置。

## 验收

- 初始化 SQL 可在 PostgreSQL 17 空数据库无错误执行；
- 所有业务表、索引、外键、触发器均创建成功；
- 每张导入表的新旧行数一致；
- 每个业务表的 `user_id` 均能关联到 `app_users`；
- CloudBase UID 映射唯一；
- 迁移后 API 仅能访问认证用户拥有的数据，情侣数据访问需按成员关系授权；
- 完成后再移除 Supabase SDK、Cookie/session 恢复代码和 RLS 依赖。
