# CloudBase 接入 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将项目认证层从 Supabase 迁移至 CloudBase，接入 CloudBase Node SDK，维护登录态、认证回调和环境变量配置，保持现有 API 数据访问不变。

**Architecture:** 在 `src/lib/cloudbase/` 下新建客户端/服务端 SDK 封装，遵循 Supabase 当前的 client/server/route-handler 目录结构模式。中间件提取认证后获取 `cloudbase_uid` → 映射 `app_users.id` → 所有业务查询均通过服务端注入用户 ID 过滤数据。前端保持现有 store 结构，但将 Supabase 客户端替换为 CloudBase API 客户端。

**Tech Stack:** @cloudbase/js-sdk, @cloudbase/node-sdk, Next.js App Router, PostgreSQL, TencentDB for PostgreSQL 17, zod 环境变量校验。

---

### Task 1: 添加 CloudBase SDK 依赖和环境变量模板

**Files:**
- Modify: `package.json`
- Modify: `.env.example`
- Create: `.env.local.example`

- [ ] **Step 1: 添加 CloudBase 依赖**

```json
  "dependencies": {
    "@cloudbase/js-sdk": "^latest",
    "@cloudbase/node-sdk": "^latest"
  }
```

- [ ] **Step 2: 添加 CloudBase 环境变量占位到 `.env.example` 和 `.env.local.example`**

```ini
# Cloudbase / Tencent Cloud
# Required:
NEXT_PUBLIC_CLOUDBASE_ENV_ID=your-env-id
CLOUDBASE_SECRET_ID=your-secret-id
CLOUDBASE_SECRET_KEY=your-secret-key

# TencentDB PostgreSQL
# Required after schema initialized:
TENCENTDB_HOST=your-db-host
TENCENTDB_PORT=5432
TENCENTDB_DATABASE=rhythm
TENCENTDB_USER=rhythm
TENCENTDB_PASSWORD=your-db-password
TENCENTDB_SSL=true
```

- [ ] **Step 3: 安装依赖并提交**

```bash
npm install
git add package.json .env.example .env.local.example
git commit -m "chore: add CloudBase and TencentDB dependencies and env template"
```

### Task 2: 建立 CloudBase 客户端/服务端目录结构和类型

**Files:**
- Create: `src/lib/cloudbase/client.ts`
- Create: `src/lib/cloudbase/server.ts`
- Create: `src/lib/cloudbase/route-handler.ts`
- Create: `src/lib/cloudbase/env.ts`
- Create: `tests/cloudbase-env.test.ts`

- [ ] **Step 1: 实现环境变量 Zod 校验 `src/lib/cloudbase/env.ts`**

```typescript
import { z } from 'zod'

const cloudbaseEnvSchema = z.object({
  NEXT_PUBLIC_CLOUDBASE_ENV_ID: z.string().min(1),
  CLOUDBASE_SECRET_ID: z.string().min(1),
  CLOUDBASE_SECRET_KEY: z.string().min(1),
  TENCENTDB_HOST: z.string().min(1),
  TENCENTDB_PORT: z.coerce.number().int().min(1).default(5432),
  TENCENTDB_DATABASE: z.string().min(1),
  TENCENTDB_USER: z.string().min(1),
  TENCENTDB_PASSWORD: z.string().min(1),
  TENCENTDB_SSL: z.coerce.boolean().default(true),
})

export const cloudbaseEnv = cloudbaseEnvSchema.parse({
  NEXT_PUBLIC_CLOUDBASE_ENV_ID: process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID,
  CLOUDBASE_SECRET_ID: process.env.CLOUDBASE_SECRET_ID,
  CLOUDBASE_SECRET_KEY: process.env.CLOUDBASE_SECRET_KEY,
  TENCENTDB_HOST: process.env.TENCENTDB_HOST,
  TENCENTDB_PORT: process.env.TENCENTDB_PORT,
  TENCENTDB_DATABASE: process.env.TENCENTDB_DATABASE,
  TENCENTDB_USER: process.env.TENCENTDB_USER,
  TENCENTDB_PASSWORD: process.env.TENCENTDB_PASSWORD,
  TENCENTDB_SSL: process.env.TENCENTDB_SSL,
})

export type CloudbaseEnv = typeof cloudbaseEnv
```

- [ ] **Step 2: 浏览器客户端 `src/lib/cloudbase/client.ts`**

```typescript
import cloudbase from '@cloudbase/js-sdk'
import { cloudbaseEnv } from './env'

export type { cloudbase }

let cloudbaseClient: ReturnType<typeof cloudbase.init> | null = null

export function createCloudbaseClient() {
  if (cloudbaseClient) {
    return cloudbaseClient
  }
  cloudbaseClient = cloudbase.init({
    envId: cloudbaseEnv.NEXT_PUBLIC_CLOUDBASE_ENV_ID,
  })
  return cloudboardClient
}

export async function getCurrentUser(client: ReturnType<typeof cloudbase.init>) {
  const auth = client.auth()
  return auth.currentUser
}

export async function signInWithEmailAndPassword(
  client: ReturnType<typeof cloudbase.init>,
  email: string,
  password: string,
) {
  const auth = client.auth()
  return auth.signInWithEmailAndPassword(email, password)
}

export async function signOut(client: ReturnType<typeof cloudbase.init>) {
  const auth = client.auth()
  return auth.signOut()
}

export function onAuthStateChanged(
  client: ReturnType<typeof cloudbase.init>,
  callback: (user: cloudbase.User | null) => void,
) {
  const auth = client.auth()
  return auth.onAuthStateChanged(callback)
}
```

- [ ] **Step 3: 服务端初始化 `src/lib/cloudbase/server.ts`**

```typescript
import cloudbase from '@cloudbase/node-sdk'
import { Pool } from 'pg'
import { cloudbaseEnv } from './env'

export function createCloudbaseServer() {
  return cloudbase.init({
    envId: cloudbaseEnv.NEXT_PUBLIC_CLOUDBASE_ENV_ID,
    secretId: cloudbaseEnv.CLOUDBASE_SECRET_ID,
    secretKey: cloudbaseEnv.CLOUDBASE_SECRET_KEY,
  })
}

export function createPgPool() {
  return new Pool({
    host: cloudbaseEnv.TENCENTDB_HOST,
    port: cloudbaseEnv.TENCENTDB_PORT,
    user: cloudbaseEnv.TENCENTDB_USER,
    password: cloudbaseEnv.TENCENTDB_PASSWORD,
    database: cloudbaseEnv.TENCENTDB_DATABASE,
    ssl: cloudbaseEnv.TENCENTDB_SSL
      ? { rejectUnauthorized: false }
      : undefined,
  })
}

export async function getUserIdFromCloudbase(ctx: {
  cloudbase: cloudbase.Cloudbase
  request: Request
}): Promise<string | null> {
  const auth = ctx.cloudbase.auth()
  const ticket = await auth.getAuthContext(ctx.request)
  if (!ticket?.openid) {
    return null
  }
  // 查询 app_users 映射: cloudbase_uid = openid → id
  const pool = createPgPool()
  const client = await pool.connect()
  try {
    const res = await client.query(
      'SELECT id FROM public.app_users WHERE cloudbase_uid = $1',
      [ticket.openid],
    )
    if (res.rows.length === 0) {
      return null
    }
    return res.rows[0].id
  } finally {
    client.release()
    await pool.end()
  }
}
```

- [ ] **Step 4: 路由处理工具 `src/lib/cloudbase/route-handler.ts` (类似 Supabase 现有 pattern)**

```typescript
import type { NextRequest } from 'next/server'
import { createCloudbaseServer } from './server'

export async function getCloudbaseAppUserId(request: NextRequest) {
  const cloudbase = createCloudbaseServer()
  return getUserIdFromCloudbase({ cloudbase, request })
}
```

- [ ] **Step 5: 静态测试 `tests/cloudbase-env.test.ts`**

```typescript
import assert from 'node:assert/strict'
import test from 'node:test'
import { cloudbaseEnv } from '@/lib/cloudbase/env'

test('cloudbase environment schema validates required variables', () => {
  // Mock required env
  const original = process.env
  process.env = {
    ...original,
    NEXT_PUBLIC_CLOUDBASE_ENV_ID: 'test-env',
    CLOUDBASE_SECRET_ID: 'test-id',
    CLOUDBASE_SECRET_KEY: 'test-key',
    TENCENTDB_HOST: 'localhost',
    TENCENTDB_DATABASE: 'rhythm',
    TENCENTDB_USER: 'postgres',
    TENCENTDB_PASSWORD: 'password',
  }
  const parsed = cloudbaseEnv
  assert.equal(parsed.NEXT_PUBLIC_CLOUDBASE_ENV_ID, 'test-env')
  process.env = original
})

test('cloudbase environment schema fails when required variables missing', () => {
  const original = process.env
  process.env = {}
  assert.throws(() => cloudbaseEnv)
  process.env = original
})
```

- [ ] **Step 6: 运行测试并提交**

```bash
npm test -- tests/cloudbase-env.test.ts
git add src/lib/cloudbase/env.ts src/lib/cloudbase/client.ts src/lib/cloudbase/server.ts src/lib/cloudbase/route-handler.ts tests/cloudbase-env.test.ts
git commit -m "feat(cloudbase): add CloudBase SDK and env validation"
```

### Task 3: 修改 Next.js 中间件，使用 CloudBase 认证替代 Supabase

**Files:**
- Modify: `src/middleware.ts`

- [ ] **Step 1: 修改导入和认证逻辑**

原：
```typescript
import { createServerClient, CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) { ... }
```

改为在认证失败时重定向 `/login`：

```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { getCloudbaseAppUserId } from './lib/cloudbase/route-handler'

export async function middleware(request: NextRequest) {
  const userId = await getCloudbaseAppUserId(request)
  if (!userId) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  // Add user id to request headers for downstream use
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-app-user-id', userId)
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - login
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!login|api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

- [ ] **Step 2: 运行测试，确认无语法错误并提交**

```bash
npm run typecheck
git add src/middleware.ts
git commit -m "refactor(middleware): switch to CloudBase authentication"
```

### Task 4: 重构登录/注册页面替换 Supabase Auth 为 CloudBase Auth

**Files:**
- Modify: `src/app/login/page.tsx`
- Modify: `src/features/auth/store/auth-store.ts`
- Modify: `src/features/auth/components/auth-provider.tsx`

- [ ] **Step 1: `auth-store` 替换 createClient 依赖并更新类型**

修改导入：

```typescript
import type { User } from '@cloudbase/js-sdk'
import { createCloudbaseClient } from '@/lib/cloudbase/client'
```

更新 store 接口：保持现有 `user`、`loading`、`setUser`、`login`、`logout` 接口名称不变，实现改为 CloudBase。

- [ ] **Step 2: `auth-provider.tsx` 替换 auth 状态监听，使用 `onAuthStateChanged` from CloudBase**

- [ ] **Step 3: `login/page.tsx` 修改表单提交调用 `signInWithEmailAndPassword` 替换 Supabase 调用**

- [ ] **Step 4: 运行测试，确认可以编译并提交**

```bash
npm run typecheck
git add src/features/auth/store/auth-store.ts src/features/auth/components/auth-provider.tsx src/app/login/page.tsx
git commit -m "refactor(auth): switch login flow to CloudBase Auth"
```

### Task 5: 迁移 API 路由访问 TencentDB PostgreSQL

**Files:**
- Modify: `src/app/api/auth/refresh/route.ts`
- Modify: `src/app/api/profile/route.ts`
- Modify: `src/app/api/weread/sync/route.ts`
- Modify: `src/app/api/sb-ping/route.ts` → rename to `src/app/api/db-ping/route.ts`

- [ ] **Step 1: 修改每个 route 导入**

```typescript
import { createCloudbaseServer, createPgPool, getUserIdFromCloudbase } from '@/lib/cloudbase/server'
```

- [ ] **Step 2: 替换 Supabase 客户端获取 user → 从 Cloudbase 获取 app_users.id**

```typescript
export async function GET(request: NextRequest) {
  const cloudbase = createCloudbaseServer()
  const userId = await getUserIdFromCloudbase({ cloudbase, request })
  if (!userId) {
    return new Response(null, { status: 401 })
  }
  const pool = createPgPool()
  const client = await pool.connect()
  // ... perform query using userId
  const result = await client.query(...)
  client.release()
  await pool.end()
  return Response.json(result.rows)
}
```

- [ ] **Step 3: 更新 sb-ping → db-ping: 修改路由文件 ping PostgreSQL**

```typescript
import { createPgPool } from '@/lib/cloudbase/server'

export async function GET() {
  try {
    const pool = createPgPool()
    const client = await pool.connect()
    await client.query('select 1')
    client.release()
    await pool.end()
    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500 })
  }
}
```

- [ ] **Step 4: 类型检查并提交**

```bash
npm run typecheck
git add src/app/api/auth/refresh/route.ts src/app/api/profile/route.ts src/app/api/weread/sync/route.ts src/app/api/db-ping/route.ts
git rm src/app/api/sb-ping/route.ts
git commit -m "refactor(api): switch to Cloudbase auth + PostgreSQL querying"
```

### Task 6: 迁移客户端 store CRUD 到 CloudBase API 端点

**Files:**
- 遍历各 store：
  - `src/features/habits/store/habit-store.ts`
  - `src/features/practice/store/practice-store.ts`
  - `src/features/practice/store/weekly-review-store.ts`
  - `src/features/practice/store/ai-recommendation-store.ts`
  - `src/features/records/store/sleep-store.ts`
  - `src/features/records/store/exercise-store.ts`
  - `src/features/records/store/reading-store.ts`
  - `src/features/records/store/goal-store.ts`
  - `src/features/couple/store/couple-store.ts`

- [ ] **Step 1: 每个 store 依次改造：移除 Supabase createBrowserClient 导入，改为 fetch `/api/...` 端点调用**

```typescript
// Before:
const { data } = await supabase.from('table').select('*').eq('user_id', userId)

// After:
const res = await fetch('/api/habits/list')
const data = await res.json()
```

- [ ] **Step 2: 确保 upsert、update、delete 对应 POST/PUT/DELETE 到对应的 API 端点**

- [ ] **Step 3: 类型检查，确认修改完毕后提交**

```bash
npm run typecheck
# commit per store or grouped:
git add ...
git commit -m "refactor(habits): switch habit-store to Cloudbase API client"
```

### Task 7: 移除 Supabase 依赖和清理

**Files:**
- Modify: `package.json`
- Remove: `src/lib/supabase/` (optional, can keep for comparison until full migration verified)

- [ ] **Step 1: 移除 `@supabase/ssr` `@supabase/supabase-js` 依赖**

```bash
npm uninstall @supabase/ssr @supabase/supabase-js
```

- [ ] **Step 2: 如果选择保留 Supabase 文件不删除，提交即可；否则删除目录并提交**

```bash
git rm -r src/lib/supabase
git add package.json
git commit -m "chore: remove Supabase dependencies"
```
