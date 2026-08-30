# 双人生活节奏管理 Web App

一个仅供两人使用的生活管理 Web 应用，帮助双方建立稳定、可持续的生活节奏。

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **鉴权**: 自托管数据库 Session Cookie（scrypt 口令哈希 + PostgreSQL sessions 表，httpOnly cookie）
- **数据库**: TencentDB PostgreSQL 直连（`pg` 连接池 + 事务）
- **状态管理**: Zustand
- **表单**: React Hook Form + Zod
- **图表**: Recharts
- **部署**: Docker（Next.js standalone）+ 宿主机 nginx + certbot

> 架构演进：Supabase → CloudBase + TencentDB → 全自托管（当前）。详见 `docs/migration-self-hosted.md`。

## 开始使用

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 填入 TENCENTDB_*（PostgreSQL 连接）与 AUTH_COOKIE_SECURE
```

### 3. 初始化数据库

在 TencentDB 上按顺序执行 `database/tencentdb/` 目录下的 SQL 文件（001 → 007）。

### 4. 创建账号

```bash
node scripts/create-user.mjs <email>
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 项目结构

```
├── src/
│   ├── app/                    # Next.js App Router 页面 + API Route
│   ├── components/             # 通用 UI 组件
│   ├── features/               # 按功能模块划分的代码
│   │   ├── auth/              # 认证相关
│   │   ├── habits/            # 习惯管理
│   │   ├── today/             # 今日页
│   │   ├── records/           # 睡眠/运动记录
│   │   ├── practice/          # 实践闭环
│   │   └── reading/           # 阅读专项
│   └── lib/
│       ├── api-client.ts      # 浏览器侧统一 API 客户端
│       └── server/            # 服务端:鉴权 + DB 连接 + 会话
├── database/tencentdb/         # 数据库迁移文件（按序执行）
├── deploy/nginx/               # nginx 反代配置
├── scripts/                    # 运维脚本（建号等）
└── docs/                       # 部署与迁移文档
```

## 核心功能

- 习惯管理（创建、编辑、启用/停用、完成/跳过/补记）
- 今日页（每日待办生成和展示）
- 睡眠、运动/康复、阅读专项记录与分析
- 每日复盘
- 周报（本地规则生成）
- 目标拆解（plan）+ 实践闭环（practice）
- 浏览器通知提醒

## 开发指南

### 类型安全

- 项目使用 TypeScript strict 模式
- 禁止使用 `any` 类型
- 所有数据库查询使用类型化接口

### 数据库

- 所有数据库变更通过 `database/tencentdb/` 下的 migration 管理
- 数据访问统一走 `withUser`（`src/lib/server/with-user.ts`），复用单连接 + 事务

### 权限模型

- 所有数据默认私有，按 `user_id` 隔离
- 会话为数据库 Session Cookie：登出/改密即时撤销

## 脚本命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 运行 ESLint
npm run typecheck    # TypeScript 类型检查
npm test             # 运行单元测试
```

## 部署

见 `docs/deploy/ubuntu-docker.md`（Docker + nginx + TencentDB）与 `docs/migration-self-hosted.md`（迁移方案）。

## License

私有项目，仅供两人使用。
