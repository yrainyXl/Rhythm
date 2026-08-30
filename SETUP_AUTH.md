# 认证说明

> 本项目鉴权已从 Supabase Auth 迁移为**自托管数据库 Session Cookie**，不再依赖任何第三方鉴权网关（Supabase / CloudBase）。

## 当前鉴权方式

- 账号由管理员通过 `scripts/create-user.mjs` 创建（口令经 scrypt 哈希存入 `app_users.password_hash`）。
- 登录走同源 `/api/auth/signin`，成功后写入 httpOnly cookie `rhythm_session`。
- 会话存于 PostgreSQL `sessions` 表，登出/改密即时撤销，无 refresh token。

## 创建账号

```bash
node scripts/create-user.mjs <email>
# 口令经交互式输入（或管道），不进入命令行历史
```

## 验证登录流程

1. 打开 `http://localhost:3000/login`
2. 输入管理员创建好的邮箱与口令登录
3. 首次登录进入引导页，设置昵称和时区
4. 完成引导后进入今日页

## 相关文档

- `docs/migration-self-hosted.md` - 鉴权迁移方案（P0 章节）
- `README.md` - 项目概述
