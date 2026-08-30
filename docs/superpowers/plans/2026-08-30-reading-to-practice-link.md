# 阅读词条 → 实践链路打通 + 阅读界面修复 实施方案

日期：2026-08-30
状态：待实施

## 背景与目标

用户核心使用链路：**导入阅读词条 → 浏览词条 → 从词条发起实践 → 实践执行 → 复盘沉淀**。

当前断点（已确认）：
- 词条与 practice 在数据模型层面零关联（`practices` 无来源字段），阅读页「发起实践」按钮是占位。
- 书籍详情页 `/reading/[bookId]` 只显示书籍信息卡 + 「阅读记录和划线笔记下阶段接入」占位文本。
- 阅读首页排序不符合预期：
  - 「在读」书架按 `created_at DESC`（创建时间）排序，而非**最后阅读/活动时间**。
  - 「词条 · 按书」按 `book_id ASC` 排序（Map 插入序），而非**最新词条时间**。

本方案覆盖三件事：
1. **P1 词条 → 实践桥接**：词条可一键发起实践，实践可追溯来源词条。
2. **P2 阅读首页排序修复**：在读书籍按最后活动时间、词条按书按最新词条时间。
3. **P3 书籍详情页实现**：阅读记录 + 划线笔记 + 记录阅读入口。

---

## P1 词条 → 实践桥接

### 数据模型

新增迁移 `database/tencentdb/008_practice_source_highlight.sql`：

```sql
-- 008_practice_source_highlight.sql
-- 实践可溯源到发起它的阅读词条。
-- 前置:已执行 001~007。

begin;

alter table public.practices
  add column if not exists source_highlight_id uuid
  references public.reading_highlights(id) on delete set null;

create index if not exists practices_source_highlight_idx
  on public.practices(source_highlight_id);

commit;
```

（事务包裹对齐 006/007 迁移风格，失败可整体回滚。）

设计说明：
- 挂在 `practices` 上而非 `topics`：实践是执行单元，词条是最小灵感来源，1 条词条 → 0..n 个实践。
- `on delete set null`：词条删除不影响已有实践。

### API

`POST /api/practice/practices`（`src/app/api/practice/practices/route.ts`）：
- `CreatePracticeBody` 增加可选 `sourceHighlightId?: string | null`。
- INSERT practices 时带上该列；首轮 `practice_rounds.assumption` 逻辑不变。

`GET /api/practice/practices`：SELECT 增加 `source_highlight_id`，`Practice` 类型同步加字段（实践详情后续可展示「来源词条」——本期只存不展示）。

### Store

`src/features/practice/store/practice-store.ts`：
- `Practice` 接口加 `source_highlight_id: string | null`。
- `createPractice` input 加可选 `sourceHighlightId?: string | null`，POST body 透传。

### UI

`PracticeFormSheet`（`src/features/practice/components/practice-form-sheet.tsx`）增加可选 props：

```ts
{
  open: boolean
  onClose: () => void
  initialTitle?: string        // 预填实践名
  initialAssumption?: string   // 预填假设（词条内容）
  sourceHighlightId?: string   // 来源词条 id
  sourceLabel?: string         // 如「来自《深度工作》的划线」，表单顶部展示
}
```

- `open` 变化时用 initial 值初始化 state（现有重置逻辑扩展）。
- 提交时把 `sourceHighlightId` 传给 `createPractice`。
- 有 `sourceLabel` 时表单顶部显示一行来源说明。

**词条侧入口**（两个，均在 P3 落地页内）：
1. 书籍详情页词条列表：每条词条卡片上加「发起实践」小按钮 → 打开 PracticeFormSheet，`initialAssumption = mark_text(+ thought)`，`sourceHighlightId = highlight.id`，`sourceLabel = 来自《书名》的划线`。
2. 阅读首页随机词条 hero（`random-highlight-hero.tsx`）：展开全文的浮层里加「发起实践」按钮，同上预填。

复用点：`PracticeFormSheet` 已用于 plan 页「发起新实践」，加 props 后旧调用方不受影响（全可选）。

---

## P2 阅读首页排序修复

### 2.1 在读书籍按「最后活动时间」排序

`GET /api/reading/books`（`src/app/api/reading/books/route.ts`）改为按最近活动排序：

```sql
SELECT b.*,
       GREATEST(
         COALESCE((SELECT max(h.highlighted_at) FROM public.reading_highlights h
                   WHERE h.book_id = b.id AND h.user_id = $1), '-infinity'::timestamptz),
         COALESCE((SELECT max(s.read_date::timestamptz) FROM public.reading_sessions s
                   WHERE s.book_id = b.id AND s.user_id = $1), '-infinity'::timestamptz),
         b.updated_at
       ) AS last_activity_at
FROM public.reading_books b
WHERE b.user_id = $1
ORDER BY last_activity_at DESC
```

- 「最后活动时间」= max(最新词条时间, 最近阅读会话日期, 书籍更新时间)。
- 无需改前端：`bookshelf-row.tsx` / `done-books-list.tsx` 的 `filter(...).slice(0, n)` 自动继承新顺序。
- 注意 pg 已配置 timestamptz 返回原始字符串，`last_activity_at` 仅用于排序，前端不读。

### 2.2 「词条 · 按书」按最新词条时间排序

前端修复即可，不动后端：
- `highlights-stream.tsx`：`groupHighlightsByBook` 后，对 `Array.from(grouped.entries())` 按**每组内 `max(highlighted_at)` 降序**排序，再 `slice(0, 5)`。
- `src/app/reading/highlights/page.tsx`（全部词条页）：同样的分组排序逻辑统一应用。

后端 `?recentBooks=5` 模式选书逻辑（`max(highlighted_at) DESC LIMIT 5`）本来就对，无需改。

---

## P3 书籍详情页实现

### API

- `GET /api/reading/sessions`：增加可选 `book_id` 查询参数；带时按 `book_id` 过滤（保持 `ORDER BY read_date DESC`）。**注意现有默认 `LIMIT 10`**：带 `book_id` 时取消 limit（单书记录量级小），仍可用 `?limit=N` 显式覆盖；不带 `book_id` 时保持现有默认 10 不变。
- `GET /api/reading/highlights`：增加可选 `book_id` 查询参数；带时只返回该书词条（`ORDER BY chapter_uid ASC NULLS FIRST, highlighted_at ASC NULLS FIRST`），与 `recentBooks` 参数互斥。

### Store

`reading-store.ts` 增加：

```ts
bookHighlights: HighlightWithBook[]
bookSessions: ReadingSession[]
isLoadingBookDetail: boolean
loadBookDetail: (bookId: string) => Promise<void>  // 并行拉 sessions?book_id= + highlights?book_id=
```

### UI（`src/app/reading/[bookId]/page.tsx` 重写占位区）

结构：
1. 书籍信息卡（保留现有）。
2. 操作行：
   - 「记录阅读」按钮 → 弹窗（时长分钟 + 页数 + 备注）→ 调现有 `recordSession`，成功后 `loadBookDetail` 刷新 + `loadBooks` 刷新进度。
   - 状态切换（在读/暂停/读完/放弃）→ 现有 `updateBookStatus`。
3. 划线笔记区：
   - 按章节分组（`chapter_title`）或直接按 `highlighted_at` 时间倒序列出。
   - 每条显示 `mark_text`（划线）/ `thought`（想法，💭 前缀）/ 章节名 / 时间。
   - 每条右侧「发起实践」按钮（P1 入口 1）。
4. 阅读记录区：
   - 日期、时长、页数、备注列表（无数据时显示空态文案）。

记录阅读弹窗：新组件 `src/features/reading/components/record-session-sheet.tsx`（样式参照 `PracticeFormSheet` 的底部弹层模式）。

---

## 任务拆解

| # | 任务 | 文件 |
|---|------|------|
| 1 | 迁移 008：practices.source_highlight_id | `database/tencentdb/008_practice_source_highlight.sql`（新建） |
| 2 | practices POST/GET 支持 sourceHighlightId | `src/app/api/practice/practices/route.ts` |
| 3 | practice-store 类型 + createPractice 透传 | `src/features/practice/store/practice-store.ts` |
| 4 | PracticeFormSheet 支持预填 + 来源展示 | `src/features/practice/components/practice-form-sheet.tsx` |
| 5 | books API 按最后活动时间排序 | `src/app/api/reading/books/route.ts` |
| 6 | 词条分组按最新词条时间排序 | `highlights-stream.tsx`、`app/reading/highlights/page.tsx` |
| 7 | sessions/highlights API 支持 book_id 过滤 | 两个 route.ts |
| 8 | reading-store 加 loadBookDetail | `src/features/records/store/reading-store.ts` |
| 9 | 记录阅读弹窗组件 | `src/features/reading/components/record-session-sheet.tsx`（新建） |
| 10 | 书籍详情页重写（词条 + 阅读记录 + 发起实践入口） | `src/app/reading/[bookId]/page.tsx` |
| 11 | hero 浮层加「发起实践」入口 | `random-highlight-hero.tsx` |

实施顺序：1→4（桥接核心）→ 5→6（排序）→ 7→11（详情页）。

## 验证

- `npm run typecheck` + `npm run lint` 通过。
- 手动链路验证：
  1. 微信读书同步 → 阅读首页在读书籍按最近活动排序、词条按书按最新词条排序。
  2. 进入某本书 → 看到词条列表和阅读记录 → 记录一次阅读 → 进度更新。
  3. 词条上点「发起实践」→ 表单预填假设 → 提交 → 计划页出现该实践 → DB 中 `practices.source_highlight_id` 有值。
- 部署前在 TencentDB 执行 `008` 迁移。

## 注意

- 迁移 008 需在部署/本地验证前执行；`if not exists` 保证可重入。
- 本期「来源词条」只存不展示；实践详情页展示来源词条属后续迭代。
- AI 跨书主题 / AI 推荐实践（`themes-row.tsx` / `try-recommendation.tsx` 占位）不在本期范围，待接 LLM 后另行实施。
