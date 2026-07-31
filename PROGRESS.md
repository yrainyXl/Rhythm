# 开发进度文档

## 总体状态：核心功能开发完成 ✅

> 架构变更说明：项目已从 **Supabase（Auth + PostgreSQL + RLS）整体迁移到 CloudBase（腾讯云）+ TencentDB PostgreSQL 直连**。情侣（couple）功能已移除。本文档已与当前代码对齐。

### 技术栈

- Next.js 14 (App Router) + TypeScript strict mode + Tailwind CSS
- 后端：CloudBase（鉴权网关）+ TencentDB PostgreSQL 直连（连接池复用 + 事务）
- 浏览器侧不直连网关：登录走同源 `/api/auth/signin` 服务端代理，token 存 httpOnly cookie
- 状态管理：Zustand ｜ 表单：React Hook Form + Zod ｜ 图表：Recharts

### 已开发完成的功能模块

#### ✅ 项目初始化 + CloudBase 配置
- Next.js 14 (App Router) + TypeScript strict mode + Tailwind CSS
- CloudBase 浏览器端 client、服务端 server、route-handler、db 连接池
- env 配置（Zod 校验）、JWT 本地验签、auth cookie（httpOnly）
- TencentDB schema 迁移（`database/tencentdb/`）

#### ✅ 登录和个人资料
- 用户名/密码登录（服务端代理，绕开浏览器直连网关的 CORS）
- token 存 httpOnly cookie（access + refresh），浏览器 JS 不可读
- 中间件路由保护（本地 JWT 解析，跳过网关 userinfo）
- Zustand auth 状态管理（带 timed single flight 防抖）
- 初次登录引导、个人资料编辑
- PWA 后台恢复 / pageshow / visibilitychange 自动重确认登录态

#### ✅ 通用习惯系统
- 动态创建习惯（名称、分类、目标类型）
- 4 种目标类型：boolean / duration / count / value
- 4 种重复规则：daily / weekdays / weekends / weekly
- 每日待办自动生成（含目标快照）
- 一键完成 / 跳过 / 撤销
- 完成时可选详细记录（实际值、时长、感受 1-5、备注）
- 习惯列表按分类分组，支持排序
- 停用习惯（保留历史记录，停止生成待办）

#### ✅ 今日页
- 日期展示 + 进度条
- 待办习惯列表 + 已完成习惯列表
- 快捷入口：记录睡眠、记录运动、复盘

#### ✅ 睡眠专项
- 入睡/起床日期时间选择（跨天支持）
- 自动计算睡眠时长
- 3 档质量评估
- 睡前活动多选标记
- 备注、数据分析、模式发现、近 7 天趋势

#### ✅ 运动/康复专项
- 运动模板库（可自定义）
- 9 种运动分类
- 时长、距离、强度（轻/中/高）、体感评分
- 康复模式：按组记录、每组次数 + 感受评估
- 月度统计、分类分布、每周趋势、康复进度追踪

#### ✅ 阅读专项
- 添加图书（书名、作者、总页数、来源）
- 阅读记录（时长、页数、笔记摘录）
- 在读状态自动更新页数进度
- 在读/读完/暂停 状态管理
- 月度分析：在读/读完统计、每周阅读趋势
- 微信读书同步入口（服务端代理）

#### ✅ 每日复盘
- 3 档心情评分
- 今天最满意的事 / 最需要改进的
- 明天最重要的一件事
- 自由备注

#### ✅ 周报
- 习惯完成率 + 上周对比
- 完成最多 / 最容易跳过的习惯
- 平均睡眠时长和质量
- 运动次数和总时长
- 阅读时长、心情评分
- 自然语言总结（本地规则生成，预留 AI 接口）

#### ✅ 目标拆解系统（plan 模块）
- 设定目标（分类 + 截止日期）
- 关键结果（KR，可量化目标 + 进度追踪）
- 里程碑（小步骤，勾选完成）
- 目标完成/放弃管理

#### ✅ 实践闭环（practice 模块）
- 议题（topics）→ 方向（directions）→ 方法（methods）→ 实践（practices）→ 轮次（rounds）→ 日志（logs）
- 多轮创建、创建轮次防连点、复盘交互、新一轮弹窗
- 实践详情页、今日安排（daily_arrangements）
- 今日想法捕获（captures）
- AI 推荐（practice/ai-recommendations）+ 每周复盘（weekly-reviews）

#### ✅ 浏览器通知提醒
- Notification API 封装
- 浏览器通知权限请求
- 每分钟检查到点提醒
- 已完成习惯不再重复提醒
- 提醒抽象层，后续可替换为原生推送

#### ✅ AI 接口架构
- 本地规则引擎（无需 API Key）
- 睡眠/习惯模式发现
- 周报自然语言生成（本地版本）
- 下周建议生成
- LLM 模式预留（配置 API Key 后切换）
- 统一接口：configureAI() / detectPatterns() / generateWeeklyNarrative()

### 性能优化（近期）
- JWT 本地验签，跳过网关 userinfo，业务 API 提速 ~40%
- 进程级 uid 缓存，业务 API 鉴权省一次 DB 查询
- signin 老用户走只读（getUserIdByToken 命中缓存 0 次 DB），仅首次登录 ensureAppUser
- practices 合并查询 + refresh 复用 uid 缓存，减少 DB 往返
- 数据库连接池复用时间延长
- 生产性能诊断头（withUser / signin 自定义 timing header）

### 数据库迁移

当前 schema 在 `database/tencentdb/`（按编号顺序执行）：
1. `001_init_rhythm_schema.sql`
2. `002_arrangements.sql`
3. `003_practice_reviews.sql`
4. `004_captures.sql`
5. `005_practice_rounds_active_unique.sql`

> `supabase/migrations/` 为迁移前的历史归档，当前架构已不依赖。

### 已知限制
1. 微信读书 API 接口为代理接入（服务端调用）
2. AI LLM 模式需要用户自行配置 API Key
3. 浏览器通知在后台/锁屏时不可靠
4. iOS 主屏 PWA 数据加载曾卡死（迁移前 Supabase 直连波动所致），迁移 CloudBase 后链路前提已变，**待真机重新验证**

### 待验证场景
1. [ ] 登录 → 引导页 → 跳转今日页
2. [ ] 创建习惯 → 今日页自动生成待办
3. [ ] 完成 / 跳过 / 撤销待办
4. [ ] 记录睡眠 → 查看分析页
5. [ ] 记录运动 → 查看分析页（含康复组记录）
6. [ ] 添加图书 → 记录阅读 → 查看分析
7. [ ] 填写每日复盘
8. [ ] 查看周报
9. [ ] 设定目标 → 添加关键结果 → 添加里程碑
10. [ ] 实践闭环：议题 → 方向 → 方法 → 实践 → 轮次 → 日志
11. [ ] 今日想法捕获
12. [ ] 退出登录
13. [ ] iOS Safari / 主屏 PWA 访问和操作
14. [ ] Android Chrome 访问和操作
15. [ ] 页面在 320px-768px 宽度下可读
