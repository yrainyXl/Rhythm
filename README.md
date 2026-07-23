# 双人生活节奏管理 Web App

一个仅供两人使用的生活管理 Web 应用，帮助双方建立稳定、可持续的生活节奏。

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **后端**: Supabase (Auth + PostgreSQL + RLS)
- **状态管理**: Zustand
- **表单**: React Hook Form + Zod
- **图表**: Recharts

## 开始使用

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 Supabase

1. 在 [Supabase](https://supabase.com) 创建新项目
2. 复制 `.env.example` 为 `.env.local`
3. 填入你的 Supabase URL 和 Anon Key

```bash
cp .env.example .env.local
```

### 3. 运行数据库迁移

在 Supabase SQL Editor 中按顺序执行 `supabase/migrations/` 目录下的 SQL 文件。

### 4. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 项目结构

```
├── src/
│   ├── app/                    # Next.js App Router 页面
│   ├── components/             # 通用 UI 组件
│   ├── features/               # 按功能模块划分的代码
│   │   ├── auth/              # 认证相关
│   │   ├── habits/            # 习惯管理
│   │   ├── today/             # 今日页
│   │   ├── records/           # 睡眠/运动记录
│   │   └── reflection/        # 每日复盘
│   └── lib/                    # 工具函数和配置
├── supabase/
│   └── migrations/             # 数据库迁移文件
└── public/                     # 静态资源
```

## 核心功能

### 第一阶段 (MVP)

- [x] 项目初始化和配置
- [ ] 用户登录和个人资料
- [ ] 习惯管理（创建、编辑、启用/停用）
- [ ] 今日页（每日待办生成和展示）
- [ ] 习惯完成、跳过、补记
- [ ] 睡眠和运动记录
- [ ] 每日复盘
- [ ] 浏览器通知和提醒
- [ ] 情侣邀请和绑定
- [ ] 数据共享权限
- [ ] 建议计划和鼓励功能
- [ ] 周报

## 开发指南

### 类型安全

- 项目使用 TypeScript strict 模式
- 禁止使用 `any` 类型
- 所有 Supabase 查询使用类型化接口

### 数据库

- 所有数据库变更通过 migration 管理
- 所有用户数据访问受 RLS 保护
- 客户端不使用 service role key

### 权限模型

- 所有数据默认私有
- 情侣关系需要双方授权
- 共享数据按用户设置的范围限制
- 解除关系后立即失去访问权限

## 脚本命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 运行 ESLint
npm run typecheck    # TypeScript 类型检查
```

## License

私有项目，仅供两人使用。
