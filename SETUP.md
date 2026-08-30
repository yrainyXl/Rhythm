# 快速开始指南

> 本项目已从 Supabase 迁移为**全自托管**（数据库 Session 鉴权 + TencentDB PostgreSQL + Docker/nginx 部署）。Supabase 相关的旧配置说明已废弃。

## 前置要求

- Node.js 20+
- npm
- 一个 TencentDB PostgreSQL 实例

## 第一步：安装依赖

```bash
npm install
```

## 第二步：配置环境变量

```bash
cp .env.example .env
# 编辑 .env 填入 TENCENTDB_* 与 AUTH_COOKIE_SECURE
```

## 第三步：初始化数据库

按顺序在 TencentDB 上执行 `database/tencentdb/` 下的迁移：

```bash
for f in database/tencentdb/*.sql; do
  psql "$TENCENTDB_ADMIN_URL" -f "$f"
done
```

## 第四步：创建账号

```bash
node scripts/create-user.mjs <email>
```

## 第五步：启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 生产部署

见 `docs/deploy/ubuntu-docker.md`。

## 常见问题

- **登录后立即掉线**：`AUTH_COOKIE_SECURE=true` 但实际走 HTTP → 设 `false`。
- **数据库连接失败**：TencentDB 白名单 / SSL 证书校验配置问题，见部署文档。
- **提示「未初始化口令」**：该账号尚未跑 `scripts/create-user.mjs`。

## 需要帮助？

- `README.md` - 项目概述
- `PROGRESS.md` - 开发进度
- `docs/migration-self-hosted.md` - 迁移方案
- `docs/deploy/ubuntu-docker.md` - 部署指南
