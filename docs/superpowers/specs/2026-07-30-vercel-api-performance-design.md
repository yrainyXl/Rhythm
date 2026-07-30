# Vercel API 性能修复设计

## 背景

生产环境固定到 Vercel `iad1` 后，登录和业务接口能够稳定成功，但网络瀑布显示部分接口仍需 2–4 秒。相同接口在后续请求中可下降到约 0.5–0.9 秒，说明主要问题不是响应体大小或单条 SQL，而是跨云冷启动、重复鉴权、重复请求和串行数据库往返共同放大了延迟。

已确认的请求放大包括：

- 阅读首页会请求三次 `books`、两次 `highlights`。
- 会话恢复可能并发或短时间内重复请求 `/api/auth/refresh`。
- 今日打卡先调用生成接口，再调用列表接口；生成接口还会逐条插入打卡记录。
- 每个 Route Handler 都独立执行鉴权和 TencentDB 连接，进程内缓存无法跨函数实例共享。

## 目标

1. 阅读首页同一轮加载只请求一次书籍、一次词条和一次阅读会话。
2. 同一时刻只允许一个会话恢复请求，成功恢复或登录后的短时间内复用结果。
3. 今日打卡生成使用一次批量插入，并在同一响应中返回当天列表。
4. API 响应通过 `Server-Timing` 暴露鉴权、数据库连接和业务处理耗时。
5. 保持现有页面展示、认证 Cookie 和 API 返回字段兼容。

## 方案选择

### 方案 A：客户端请求去重和局部接口合并（采用）

保留现有页面和 Route Handler 边界，在 Zustand Store 中加入 single-flight；将阅读页加载责任提升到页面入口；将今日打卡生成与读取合并；为服务端公共入口增加耗时头。

优点是改动集中、可回归、不会引入新的部署依赖，并能直接消除瀑布图中已确认的重复请求。

### 方案 B：新增 `/api/today` 和 `/api/reading/overview` 聚合接口

可以进一步减少函数数量和重复鉴权，但会形成较大的新接口，修改多个 Store 的数据流，当前缺少分段耗时数据来证明必须立即采用。

本轮不实施；若方案 A 后冷态仍不可接受，再基于 `Server-Timing` 数据决定。

### 方案 C：将全部 API 迁移到腾讯云

能够从根本上减少 `iad1` 到 TencentDB 的跨云延迟，但涉及部署、域名、Cookie、网络和运维边界迁移，不适合作为本轮性能修复。

## 设计

### 请求去重

新增通用 single-flight 工具：

- 并发调用共享同一个 Promise。
- Promise 完成或失败后自动释放，后续显式加载仍会重新请求。
- 带 TTL 的版本用于会话恢复；登录成功可主动写入最新值，退出登录时清空。

阅读 Store 的 `loadBooks`、`loadHighlights` 使用并发去重。阅读首页统一触发书籍、词条和统计加载，展示子组件不再各自发起请求。统计加载复用 `loadBooks` 的结果，只额外请求阅读会话。

### 会话恢复

`refreshProfile` 使用 30 秒 TTL 的 single-flight：

- 并发恢复只产生一个 HTTP 请求。
- 登录成功后把返回的 Profile 写入 TTL 缓存，避免紧接着再次恢复。
- 网络错误不缓存。
- 退出登录清空缓存。

### 今日打卡

生成接口继续在服务端判断日程匹配，但写入改为单条多值 `INSERT ... ON CONFLICT DO NOTHING`。随后在同一个请求中查询当天打卡并返回：

```json
{
  "generated": 2,
  "occurrences": []
}
```

客户端直接写入返回列表，不再追加 `/api/habits/occurrences` 请求。

### 服务端耗时

`withUser` 在响应头增加：

```text
Server-Timing: auth;dur=..., db-connect;dur=..., handler;dur=..., total;dur=...
X-Rhythm-Timing: auth;dur=..., db-connect;dur=..., handler;dur=..., total;dur=...
```

鉴权阶段进一步按实际执行路径追加 `jwks-cache`、`jwks-fetch`、
`jwks-refetch`、`jwt-initial`、`jwt-refetch`、`userinfo`、
`refresh-token`、`uid-cache-hit`、`uid-db-connect`、`uid-query`，
用于区分 CloudBase 网络回退、应用用户映射和业务数据库连接耗时。

数据库连接失败也由公共入口捕获并返回带 `x-error-tag=db-connect:*` 的 500，避免无诊断的原始错误。

## 错误处理

- single-flight 不吞掉异常，由原 Store 保持现有降级逻辑。
- 今日打卡批量 SQL 使用参数占位符，不拼接用户输入。
- 数据库连接失败不暴露主机、用户名或完整错误堆栈。
- `Server-Timing` 与生产诊断备用头 `X-Rhythm-Timing` 只包含阶段名和毫秒数。

## 验证

- single-flight 并发调用只执行一次工厂函数，完成后允许再次执行。
- TTL 缓存命中时不执行工厂函数，过期后重新执行。
- 打卡批量 SQL 为每条记录生成正确参数并保持 `ON CONFLICT`。
- 阅读首页源代码中只有页面入口负责加载，子组件不再重复加载。
- 全量单元测试、类型检查和生产构建通过。
