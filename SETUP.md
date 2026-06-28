# 快速开始指南

## 前置要求

- Node.js 18+ 
- npm 或 yarn
- Supabase 账号

## 第一步：安装依赖

```bash
npm install
```

## 第二步：设置 Supabase

### 2.1 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com)
2. 点击 "New Project"
3. 填写项目名称、数据库密码、选择区域
4. 等待项目创建完成（约 2 分钟）

### 2.2 获取 API 密钥

在项目 Dashboard 中：
1. 点击左侧菜单的 "Settings" (齿轮图标)
2. 选择 "API"
3. 复制以下信息：
   - **Project URL** (形如 `https://xxxxx.supabase.co`)
   - **anon public** key (很长的字符串)

### 2.3 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑 .env.local，填入你的值
NEXT_PUBLIC_SUPABASE_URL=你的项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 第三步：运行数据库迁移

### 3.1 打开 SQL Editor

在 Supabase Dashboard 中：
1. 点击左侧菜单的 "SQL Editor"
2. 点击 "New Query"

### 3.2 执行迁移文件

按顺序复制并执行 `supabase/migrations/` 目录下的 SQL 文件：

**第一个迁移**：`20240101000000_create_profiles.sql`

```sql
-- 复制该文件的完整内容到 SQL Editor
-- 点击右下角 "Run" 按钮执行
```

执行成功后，你应该在左侧看到新创建的 `profiles` 表。

### 3.3 验证表创建

在 Supabase Dashboard 中：
1. 点击左侧菜单的 "Table Editor"
2. 确认能看到 `profiles` 表
3. 点击 `profiles` 表，检查字段是否正确

## 第四步：启动开发服务器

```bash
npm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

目前会重定向到 `/login` 页面（下一个任务将实现登录功能）。

## 第五步：验证配置

### 5.1 检查 Supabase 连接

在浏览器控制台应该不会看到 Supabase 相关错误。

### 5.2 检查 TypeScript

```bash
npm run typecheck
```

应该没有类型错误（可以忽略 Next.js 自动生成文件的警告）。

## 常见问题

### Q: npm install 时出错？

确保 Node.js 版本 >= 18：
```bash
node --version
```

### Q: Supabase 连接失败？

检查：
1. `.env.local` 文件是否存在
2. URL 和 Key 是否正确复制（没有多余空格）
3. Supabase 项目是否处于活跃状态

### Q: SQL 迁移执行失败？

常见原因：
- 已经执行过该迁移（检查 Table Editor 是否已有表）
- 数据库权限问题（确保使用的是项目所有者账号）

### Q: 页面显示 404？

确保：
1. `npm run dev` 正在运行
2. 访问的端口是 3000
3. 没有其他服务占用 3000 端口

## 下一步

项目初始化完成后，下一个任务是实现用户登录和个人资料功能。

查看 `PROGRESS.md` 了解开发进度和计划。

## 项目结构说明

```
life-rhythm-app/
├── src/
│   ├── app/              # Next.js 页面路由
│   │   ├── layout.tsx   # 根布局
│   │   ├── page.tsx     # 首页
│   │   └── globals.css  # 全局样式
│   ├── components/       # 共享 UI 组件（将创建）
│   ├── features/         # 功能模块（将创建）
│   └── lib/             # 工具和配置
│       └── supabase/    # Supabase 客户端
├── supabase/
│   └── migrations/      # 数据库迁移文件
└── public/              # 静态资源
```

## 开发命令

```bash
npm run dev        # 启动开发服务器
npm run build      # 构建生产版本
npm run start      # 启动生产服务器
npm run lint       # 代码检查
npm run typecheck  # TypeScript 类型检查
```

## 需要帮助？

查看以下文档：
- `README.md` - 项目概述
- `PROGRESS.md` - 开发进度
- [Next.js 文档](https://nextjs.org/docs)
- [Supabase 文档](https://supabase.com/docs)
