# Vercel API 性能修复 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 消除生产环境已确认的重复数据请求和串行打卡往返，并为剩余跨云耗时提供分段诊断。

**Architecture:** 使用通用 single-flight 约束并发加载，阅读页统一触发 Store 加载；认证恢复增加短 TTL；今日打卡生成改为批量写入并直接返回列表；`withUser` 统一追加 `Server-Timing` 和生产诊断备用头 `X-Rhythm-Timing`。不新增依赖，不改变页面结构。

**Tech Stack:** Next.js 14 Route Handlers、TypeScript、Zustand、PostgreSQL、Node test runner。

---

鉴权诊断在公共入口继续拆分为 JWKS、JWT 验签、CloudBase userinfo、
token 续期、UID 缓存和 UID 数据库查询阶段，避免把所有跨云耗时混在
`auth` 总时间中。

### Task 1: 通用请求去重

**Files:**
- Create: `src/lib/async/single-flight.ts`
- Test: `tests/single-flight.test.ts`

- [ ] **Step 1: 编写失败测试**

覆盖并发共享 Promise、完成后重新执行、TTL 命中、TTL 过期和主动写入缓存。

- [ ] **Step 2: 运行测试并确认因模块不存在而失败**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/single-flight.test.ts`

- [ ] **Step 3: 实现 `createSingleFlight` 和 `createTimedSingleFlight`**

实现只管理 Promise 与成功值，不捕获业务异常。

- [ ] **Step 4: 运行测试并确认通过**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/single-flight.test.ts`

### Task 2: 阅读页消除重复请求

**Files:**
- Modify: `src/app/reading/page.tsx`
- Modify: `src/features/records/store/reading-store.ts`
- Modify: `src/features/reading/components/bookshelf-row.tsx`
- Modify: `src/features/reading/components/done-books-list.tsx`
- Modify: `src/features/reading/components/random-highlight-hero.tsx`
- Modify: `src/features/reading/components/highlights-stream.tsx`
- Modify: `src/features/reading/components/reading-stats-bar.tsx`
- Test: `tests/reading-request-dedup.test.ts`

- [ ] **Step 1: 编写失败测试**

断言阅读首页统一触发加载，展示子组件不再调用 `loadBooks` 或 `loadHighlights`。

- [ ] **Step 2: 运行测试并确认当前重复加载导致失败**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/reading-request-dedup.test.ts`

- [ ] **Step 3: 将加载责任移到阅读页并在 Store 中接入 single-flight**

`runAnalysis` 通过 `get().loadBooks()` 复用书籍请求，只额外读取阅读会话。

- [ ] **Step 4: 运行测试并确认通过**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/reading-request-dedup.test.ts`

### Task 3: 会话恢复去重

**Files:**
- Modify: `src/features/auth/store/auth-store.ts`
- Test: `tests/auth-refresh-dedup.test.ts`

- [ ] **Step 1: 编写失败测试**

断言认证 Store 使用带 TTL 的 single-flight，并在登录成功与退出时更新缓存。

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/auth-refresh-dedup.test.ts`

- [ ] **Step 3: 接入 30 秒恢复缓存**

网络失败不缓存；登录成功写入 Profile；退出登录清空。

- [ ] **Step 4: 运行测试并确认通过**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/auth-refresh-dedup.test.ts`

### Task 4: 今日打卡生成和读取合并

**Files:**
- Create: `src/features/habits/server/occurrence-batch.ts`
- Modify: `src/app/api/habits/occurrences/generate/route.ts`
- Modify: `src/features/habits/store/habit-store.ts`
- Test: `tests/occurrence-batch.test.ts`

- [ ] **Step 1: 编写失败测试**

覆盖空输入和多条记录的占位符、参数顺序及冲突处理。

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/occurrence-batch.test.ts`

- [ ] **Step 3: 实现批量 SQL 并让生成接口返回当天列表**

客户端使用返回的 `occurrences` 更新 Store，不再请求列表接口。

- [ ] **Step 4: 运行测试并确认通过**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/occurrence-batch.test.ts`

### Task 5: 服务端分段耗时

**Files:**
- Create: `src/lib/server-timing.ts`
- Modify: `src/lib/cloudbase/db.ts`
- Test: `tests/server-timing.test.ts`

- [ ] **Step 1: 编写失败测试**

断言耗时格式只输出合法阶段名和非负毫秒数。

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/server-timing.test.ts`

- [ ] **Step 3: 在 `withUser` 中记录鉴权、连接、业务和总耗时**

同时捕获连接异常并返回安全的 `x-error-tag`。

- [ ] **Step 4: 运行测试并确认通过**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/server-timing.test.ts`

### Task 6: 延长数据库连接复用窗口

**Files:**
- Modify: `src/lib/cloudbase/server.ts`
- Test: `tests/db-pool-config.test.ts`

- [ ] **Step 1: 写连接池配置失败测试**

```ts
assert.match(source, /idleTimeoutMillis:\s*60_000/)
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/db-pool-config.test.ts`

Expected: FAIL，因为当前使用 `pg` 默认 10 秒空闲回收时间。

- [ ] **Step 3: 设置 60 秒空闲回收时间**

```ts
idleTimeoutMillis: 60_000,
```

- [ ] **Step 4: 运行测试并确认通过**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/db-pool-config.test.ts`

Expected: PASS。

### Task 7: 全量验证

**Files:**
- Modify: `docs/superpowers/plans/2026-07-30-vercel-api-performance.md`

- [ ] **Step 1: 运行全量测试**

Run: `npm test`

- [ ] **Step 2: 运行类型检查**

Run: `npm run typecheck`

- [ ] **Step 3: 运行生产构建**

Run: `npm run build`

- [ ] **Step 4: 检查差异和空白错误**

Run: `git diff --check`
