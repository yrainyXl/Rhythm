# Rhythm 全自托管迁移实施文档

> 目标：移除 **Vercel** 与 **CloudBase** 运行时依赖，保留 **TencentDB PostgreSQL**，最终以 **Docker + 宿主机 nginx** 部署到 Ubuntu。
>
> 鉴权方案：**数据库 Session Cookie**（替代 CloudBase 网关鉴权）。
> 状态：方案已定稿，代码未改动。执行时按 P0 → P1 → P2 顺序推进，每个阶段独立可验收、可回滚。

---

## 1. 目标架构

```
Ubuntu 主机
├── nginx（宿主机 apt，TLS 终止 / 反代，certbot 自动续期）
│     0.0.0.0:80/443  →  127.0.0.1:3000
├── Docker（compose 管理，仅绑定 127.0.0.1）
│      └── rhythm-app（Next.js standalone，nodejs runtime）
│            ├── 本地鉴权：scrypt 口令哈希 + 数据库 Session（httpOnly cookie）
│            └── pg Pool 直连 TencentDB PostgreSQL（连接逻辑不变）
└── cron：pg_dump 每日备份 + 过期 session 清理
```

对外只暴露 nginx 的 80/443；应用容器不直接暴露到公网。

---

## 2. 现状盘点（迁移前的事实）

### 2.1 CloudBase 运行时触点（全部在 `src/lib/cloudbase/`）

| 文件 | 触点的 CloudBase 能力 |
|---|---|
| `server.ts` | `signinWithPassword` / `refreshTokens` / `fetchUserInfoRaw` → 调用 `*.api.tcloudbasegateway.com`；`ensureAppUser`；进程级 uid 缓存 |
| `jwt.ts` | JWKS 公钥拉取（`/auth/v1/certs`）+ RS256 验签 |
| `client.ts` | 浏览器侧 `@cloudbase/js-sdk`（已无实际鉴权用途，纯遗留） |
| `env.ts` | `CLOUDBASE_SECRET_ID/KEY`、`NEXT_PUBLIC_CLOUDBASE_ENV_ID` |

### 2.2 Vercel 依赖现状

- 无 `vercel.json`、无 Cron、无 `@vercel/*` 依赖。
- 通知为浏览器端实现；周报 / AI 推荐均为请求内生成，无调度器依赖。
- `middleware.ts` 为空放行（Edge 跑不了 pg），页面鉴权由 Server Component / Route Handler 承担。
- 结论：Vercel 没有实质运行时依赖，只有「进程级缓存」「跨地域 DB 往返」等注释措辞是 Vercel 化产物。

### 2.3 文档漂移（需在 P2 修复）

- `README.md`、`SETUP.md`、`SETUP_AUTH.md` 仍是 Supabase 旧版描述。
- `supabase/migrations/` 为历史归档，当前 schema 在 `database/tencentdb/`（001~005）。
- `PROGRESS.md` 有一句架构变更说明是准确的，可作为参照。

### 2.4 关键架构事实（决定鉴权方案）

`withUser()`（`src/lib/cloudbase/db.ts`）在鉴权之后**无条件 `pool.connect()`** 拿连接执行 handler。即**每个业务 API 请求本来就会碰一次数据库**，因此「无状态 JWT 省 DB 查询」的优势在本项目不存在——这也是选定数据库 Session 方案的核心论据。

> 补充：现状是**鉴权一次连接 + handler 一次连接（两条连接）**。迁移后让 `withUser` 先取连接、在同一连接上做 session 校验并跑 handler，省掉一条连接（见 4.2）。`max: 5` 的池在并发下会更从容。

---

## 3. 鉴权方案定稿：数据库 Session Cookie

> 三方案（自研 JWT + Refresh / 数据库 Session Cookie / Auth.js·Better Auth）对比结论：**选数据库 Session Cookie**。理由：请求必查库（性能论据失效）、迁移即简化（删掉 JWKS/refresh 续期/uid 缓存）、撤销即时生效（logout/改密 = DELETE 一行）、零新依赖、无框架风险。Auth.js v5 的 Credentials 提供商不支持数据库会话策略，会倒退回 JWT；Better Auth 需重写全部 handler + 前端 store，对 2~5 人单实例应用不划算。

### 3.1 凭证与过期模型

- **凭证**：cookie 存 256-bit 随机 token（`crypto.randomBytes(32)`，base64url，约 43 字符）；数据库只存其 SHA-256 哈希（64 字符 hex）。DB 泄露无法劫持会话。
- **Cookie 名**：`rhythm_session`，属性 `httpOnly` / `SameSite=Lax` / `path=/` / `secure=由 env 控制`。
- **过期（双层）**：
  - `expires_at`：空闲过期 30 天，配合**滑动续期**——仅当剩余寿命 < 15 天时 `UPDATE expires_at = now() + 30天`（每个会话每 15 天最多一次写）。
  - `absolute_expires_at = created_at + 90天`：**硬上限**，到点强制重新登录，避免滑动续期让会话无限期存活（会话最长寿命被硬性封顶为 90 天）。
  - 无 refresh token 概念。
- **撤销**：logout / 改密 / 踢下线 = 删除 `sessions` 行，即时生效。

### 3.2 口令哈希

- 用 Node 内置 `crypto.scrypt`（零新依赖，Docker slim 镜像无需原生编译）。
- 参数：`N=2^17`（131072）、`r=8`、`p=1`，达到 OWASP 对 scrypt 的推荐强度。注意：Node 默认 `maxmem` 为 32MB，`N=131072` 约需 128MB，**必须显式传 `maxmem`（如 192MB）否则抛错**。
- 存储格式（自描述，便于未来升级参数）：
  ```
  scrypt$131072$8$1$<salt base64>$<hash base64>
  ```
- 比较用 `crypto.timingSafeEqual`（防时序侧信道）；**先校验 salt/hash 长度一致再比较**，长度不等直接返回 false（`timingSafeEqual` 对长度不等的输入会抛异常）。

---

## 4. P0：鉴权自托管（替换 CloudBase 网关）

### 4.1 数据库迁移（新增 `database/tencentdb/006_local_auth.sql`）

```sql
begin;

-- 1) app_users：加口令哈希（cloudbase_uid 的删除放到 P2/007，P0 不动以利回滚）
alter table public.app_users
  add column password_hash text;

-- 存量行先置 null（口令由 create-user.mjs 补齐），随后收 NOT NULL（见 6.2）

-- 2) 会话表
create table public.sessions (
  token_hash text primary key,          -- sha256(cookie token)
  user_id uuid not null references public.app_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  expires_at timestamptz not null,      -- 空闲过期（滑动续期作用于它）
  absolute_expires_at timestamptz not null  -- 硬上限 = created_at + 90天
);

create index sessions_user_idx on public.sessions(user_id);
create index sessions_expires_idx on public.sessions(expires_at);

commit;
```

> **`password_hash` 可空的过渡期行为**：signin 遇到 `password_hash IS NULL` 的行一律拒绝并提示「请联系管理员初始化口令」，不得放行、也不得报 500。存量补齐后可执行
> `alter table public.app_users alter column password_hash set not null;`（见 6.2）。

### 4.2 代码改动（P0 阶段保持文件在 `src/lib/cloudbase/` 原位改内容，重命名放到 P2）

| 文件 | 改动 |
|---|---|
| `src/lib/cloudbase/env.ts` | 删除 `CLOUDBASE_SECRET_ID/KEY`、`NEXT_PUBLIC_CLOUDBASE_ENV_ID`；新增 `SESSION_TTL_DAYS`（默认 30）、`AUTH_COOKIE_SECURE`（默认 `NODE_ENV==='production'`）、`TENCENTDB_CA`（可选，证书校验用的 CA 文件路径）。**不需要 AUTH_SECRET**（无签名密钥可泄露） |
| `src/lib/cloudbase/jwt.ts` | **整个删除**（JWKS、RS256 验签全部废弃） |
| `src/lib/cloudbase/client.ts` | **整个删除**（浏览器 SDK 遗留） |
| `src/lib/cloudbase/server.ts` | 删除 `signinWithPassword` / `refreshTokens` / `fetchUserInfoRaw` / `fetchCloudbaseUserInfo` / `ensureAppUser` 及 uid 缓存；保留 pg Pool 单例（**ssl 改为 `{ rejectUnauthorized: true }`，CA 走 `TENCENTDB_CA`**）；新增 `createSession` / `verifySession` / `deleteSession` / `deleteAllUserSessions` / `getSessionUserId` |
| `src/lib/cloudbase/auth-cookie.ts` | 单 cookie `rhythm_session`；`secure` 由 `AUTH_COOKIE_SECURE` 控制；新增 `getSessionToken` / `setSessionCookie` / `clearSessionCookie`；**移除 `Authorization: Bearer` 兜底**，仅接受 cookie；新增 `clearLegacyCloudbaseCookies`（清 `cb_access_token`/`cb_refresh_token` 旧 cookie，signin/signout 调用） |
| `src/lib/cloudbase/route-handler.ts` | **删除**，其功能并入 `auth/me`（直接调 `getSessionUserId`） |
| `src/lib/cloudbase/db.ts` | `withUser` 改为「**先 `pool.connect` → 同一连接上 `verifySession` → 直接跑 handler → 释放**」，消除现状双连接；鉴权入口统一为 `getSessionUserId(token, client?)` |

#### 核心函数签名（伪码约定）

```ts
// src/lib/cloudbase/password.ts（新增）
hashPassword(plain: string): string            // scrypt$131072$8$1$salt$hash，需显式 maxmem
verifyPassword(plain: string, stored: string): Promise<boolean>  // 长度先校验，再 timingSafeEqual

// src/lib/cloudbase/session.ts（新增，或并入 server.ts）
createSession(userId: string): Promise<string>          // 返回原始 token（写入 cookie），写入 absolute_expires_at
verifySession(token: string, client?: PoolClient): Promise<string | null>
    // 校验+过期处理+滑动续期，返回 user_id；传 client 时复用连接（withUser 用），不传自取连接（auth/me 用）
getSessionUserId(token: string, client?: PoolClient): Promise<string | null>  // cookie token → 哈希 → verifySession
deleteSession(token: string): Promise<void>
deleteAllUserSessions(userId: string): Promise<void>    // 改密/踢人用
```

`verifySession` 流程：哈希 token → 索引查询 → 无行返回 null → **`absolute_expires_at` 或 `expires_at` 过期则 DELETE 后返回 null** → 剩余 < 15 天则滑动续期 `expires_at`（`absolute_expires_at` 永不刷新）→ 返回 user_id。

#### 过期 session 清理

- 惰性清理：`verifySession` 命中过期行时顺手 DELETE。
- 周期性兜底：signin 成功时执行一次 `DELETE FROM sessions WHERE absolute_expires_at < now() OR expires_at < now()`（表极小，可忽略成本）。可选：Ubuntu cron 每日跑（见 P1）。

### 4.3 鉴权路由（对外 API 形状冻结，前端不改）

| 文件 | 改动 |
|---|---|
| `src/app/api/auth/signin/route.ts` | 查 `password_hash`（NULL 则拒绝并提示联系管理员）→ `verifyPassword` → `createSession` → set cookie → 返回 `{ user: profile }`（结构不变）；**加内存级失败退避**（同 username+IP 连续失败按指数退避延迟响应，单实例内存 Map 即可） |
| `src/app/api/auth/refresh/route.ts` | 退化为「会话恢复」：`verifySession` → 返回 `{ user: profile }`；不再签发任何新凭证。路由名保留（前端已依赖） |
| `src/app/api/auth/signout/route.ts` | `deleteSession` + 清 `rhythm_session` + 清旧 `cb_*` cookie |
| `src/app/api/auth/me/route.ts` | 直接调 `getSessionUserId`（取代原 `getCloudbaseAppUserId`） |
| `src/features/auth/store/auth-store.ts` | 仅文案：`signUp` 错误提示去掉「CloudBase 控制台」，改为「账号由管理员创建」 |

> **约束**：`/api/auth/refresh` 返回形状必须保持 `{ user: Profile | null }`；`signin` 保持 `{ user: Profile }`；否则前端 store 全部掉登录态。

### 4.4 用户迁移与自助建号脚本（新增）

| 文件 | 说明 |
|---|---|
| `scripts/create-user.mjs` | `node scripts/create-user.mjs <email>`（**口令经 stdin 或交互式输入，绝不走 argv**，避免进 shell history / `ps`）→ scrypt 哈希 → upsert `app_users`（按 email）并确保 `profiles` 行存在 |

> **存量用户（当前仅 1 人）的简化迁移，不做通用多用户迁移体系**：
> 1. **cutover 前**：在 CloudBase 控制台确认该用户实际的登录标识（`username`/`email`）。注意历史代码在 email 缺失时会落成 `${uid}@cloudbase` 合成值，需确认真实标识，避免错绑历史数据。
> 2. **切换后**：管理员跑 `create-user.mjs <该 email>` 为该用户设置新口令。若 `app_users` 已存在该 email 则 upsert 直接绑定既有数据；若标识与历史行不一致，手工 `UPDATE` 该行 email 一次即可。
> 3. **一次性成本**：CloudBase 口令无法导出，唯一存量用户需管理员重置一次口令（唯一不可平滑点）。

### 4.5 P0 风险与验证

**风险**
1. `server.ts` 是 40+ 个 Route Handler 的共用鉴权入口，改错会全线 401/500。
2. `cloudbase_uid` 是 NOT NULL UNIQUE，P0 若不删列，用户创建只能走 `create-user.mjs`（不再有 `ensureAppUser` 自动建号）——需确认无残留引用。
3. 切换瞬间所有旧 cookie 失效（旧 CloudBase 签发 token 无法通过 session 校验），用户需重新登录一次（预期内）。
4. scrypt `N=131072` 未传 `maxmem` 会在运行期抛错（Node 默认 32MB 上限）。

**验证**
- 单测：`hashPassword/verifyPassword`（含长度不一致的输入）、`createSession/verifySession/deleteSession`、空闲过期、硬上限过期、滑动续期、撤销。
- `npm run typecheck`、`npm test` 通过（先修 `tests/cloudbase-env.test.ts` 等仍引用 CloudBase 的用例）。
- 手动清单：登录 → 刷新页面恢复 → 退出 → 复用旧 cookie 返回 401 → 改密后旧会话立即失效 → 连续错误口令被退避限流 → `/api/db-ping` 正常。
- 完成标志：`grep -rn "tcloudbasegateway" src/` 为空；`grep -rn "cloudbase" src/` 仅剩目录名/变量名等非运行时残留。

---

## 5. P1：Docker + nginx 部署（移除 Vercel）

### 5.1 构建产物调整

| 文件 | 改动 |
|---|---|
| `next.config.mjs` | 加 `output: 'standalone'`；删 `experimental.serverComponentsExternalPackages: ['@cloudbase/js-sdk']`（P0 已删该 SDK） |
| `package.json` | 移除 `@cloudbase/js-sdk`、`@cloudbase/node-sdk`（node-sdk 已是死代码）；移除 `jsonwebtoken` 与 `@types/jsonwebtoken`（P0 删除 `jwt.ts` 后已无 JWT 使用，改用内置 crypto） |

### 5.2 .dockerignore（新增，必须先于 Dockerfile）

`COPY . .` 之前**必须**存在 `.dockerignore`，否则 `.env`（含 TENCENTDB 密码）会被复制进 build 上下文、永久留在镜像层里。

```dockerignore
.git
.gitignore
.env
.env.*
node_modules
.next
docs
*.md
docker-compose.yml
Dockerfile
supabase
```

### 5.3 Dockerfile（新增）

```dockerfile
# ---- build ----
FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- runtime ----
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    TZ=Asia/Shanghai \
    PORT=3000
RUN groupadd -r nodejs && useradd -r -g nodejs nodejs

COPY --from=build --chown=nodejs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nodejs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nodejs:nodejs /app/public ./public

USER nodejs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/db-ping').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
```

### 5.4 docker-compose.yml（新增）

```yaml
services:
  app:
    build: .
    image: rhythm-app:latest
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:3000"   # 仅本机，nginx 反代；不暴露公网
    env_file: .env
    # 健康检查已在镜像内定义
```

> `.env` 由宿主机管理，不进镜像、不进 git。

### 5.5 nginx（宿主机 apt + certbot）

**安装**
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

**站点配置 `deploy/nginx/rhythm.conf`（新增）**

> 限流区 `limit_req_zone` 需放在 `http` 层（`/etc/nginx/nginx.conf` 内），`location` 引用它；`zone` 名、`rate` 可按需调。这里对登录接口做每 IP 每分钟 5 次的硬限流，作为暴力破解的第一道防线（应用层退避是第二道，见 4.3）。

```nginx
# http 层：
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;

# server 块：
server {
    listen 80;
    server_name your.domain.com;
    # certbot 会在此块注入 443 配置；亦可手工迁移到 443 块

    # 登录接口单独限流
    location = /api/auth/signin {
        limit_req zone=auth_limit burst=3 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 2m;   # 与 next serverActions bodySizeLimit 对齐
    }
}
```

**证书签发与自动续期**
```bash
sudo certbot --nginx -d your.domain.com --redirect
# systemd timer 自动续期；续期后 reload nginx：
# certbot 默认 --deploy-hook 或手动加 post-hook "systemctl reload nginx"
```

**安全头（加进 443 server 块）**
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options nosniff always;
add_header X-Frame-Options DENY always;
add_header Referrer-Policy strict-origin-when-cross-origin always;
```

**两种场景**
- 有域名（VPS）：上述 certbot 流程，`.env` 设 `AUTH_COOKIE_SECURE=true`。
- 无域名（内网/无公网）：走 Tailscale/VPN，HTTP 访问，`.env` 设 `AUTH_COOKIE_SECURE=false`；或用自签证书（每设备装一次根证书，不推荐长期）。

### 5.6 环境变量模板（重写 `.env.example`）

```bash
# TencentDB PostgreSQL（必填）
TENCENTDB_HOST=
TENCENTDB_PORT=5432
TENCENTDB_DATABASE=rhythm
TENCENTDB_USER=rhythm
TENCENTDB_PASSWORD=
TENCENTDB_SSL=true
# TENCENTDB_CA=/path/to/tencentdb-ca.pem   # 证书校验开启时腾讯云 CA 文件；留空用系统 CA

# 会话鉴权
SESSION_TTL_DAYS=30
AUTH_COOKIE_SECURE=true   # nginx TLS 时为 true；纯内网 HTTP 时为 false

# 微信读书同步（可选，服务端使用）
WEREAD_API_KEY=
```

> 移除全部 `NEXT_PUBLIC_*`（`NEXT_PUBLIC_APP_URL` 已确认无引用；`NEXT_PUBLIC_CLOUDBASE_ENV_ID` 随 P0 删除）。无 AUTH_SECRET。
>
> ⚠️ **`AUTH_COOKIE_SECURE` 是内网/无域名场景的头号排障项**：无 TLS 时若仍为 `true`，Secure cookie 写不进浏览器，表现为「登录成功但立即掉线」。必须显式设 `false`（详见 5.5 两种场景）。

### 5.7 删除中间件

- 删除 `src/middleware.ts`（空放行，页面鉴权已由 Server Component / API 承担）。

### 5.8 部署文档（新增 `docs/deploy/ubuntu-docker.md`）

覆盖：安装 docker/docker-compose、ufw 放行 80/443、TencentDB 白名单放行 Ubuntu 出口 IP 或走内网/专线、**获取并配置腾讯云 PostgreSQL CA 证书**（`TENCENTDB_CA`，证书校验开启时必需）、SSL 开关说明、`docker compose up -d`、`/api/db-ping` 健康检查、升级流程（`docker compose build && up -d`）、回滚（镜像 tag）。

### 5.9 P1 风险与验证

**风险**
1. standalone 模式与 middleware/静态资源路径兼容（Next 14.2 成熟，风险低；且 P1 已删 middleware）。
2. 环境变量注入时机：`NEXT_PUBLIC_*` 需 build 期存在——迁移后已无敏感公开变量，秘密一律运行期 `env_file`，严禁用 ARG 烘焙；`.dockerignore` 必须已排除 `.env`（见 5.2）。
3. TencentDB 白名单未放行会导致容器内连接超时（`connectionTimeoutMillis` 已设 5s，会快速失败而非挂起）。
4. 证书校验开启（`rejectUnauthorized: true`）后，若 `TENCENTDB_CA` 未配或 CA 与腾讯云服务端不匹配，连接会直接失败——部署文档必须给出准确的 CA 获取路径。
5. `AUTH_COOKIE_SECURE=true` 而实际走 HTTP 时，cookie 写不进浏览器 → 无法登录（5.6 已加粗提示）。

**验证**
- `npm run build` 后 `node .next/standalone/server.js` 能起服务。
- `docker build` 成功且镜像层内**不含** `.env`（`docker history` 或解包确认，防 S1 回归）。
- Ubuntu 上 `docker compose up -d`；`docker compose exec app wget -qO- http://127.0.0.1:3000/api/db-ping` 返回 success。
- 经域名 HTTPS 走通完整登录 → 业务接口链路；`limit_req` 生效（连续请求 `/api/auth/signin` 被 503 限流）。
- `docker compose build` 在干净机器可复现。

---

## 6. P2：清理与加固

### 6.1 目录重命名（去 CloudBase 名）

建议最终布局：
```
src/lib/
  api-client.ts        # 原 cloudbase/api-client.ts（纯浏览器 fetch 包装）
  server/
    env.ts             # 原 cloudbase/env.ts
    pg.ts              # pg Pool 单例（原 cloudbase/server.ts 的连接部分）
    password.ts        # scrypt
    session.ts         # session 增删查
    cookies.ts         # 原 cloudbase/auth-cookie.ts
    with-user.ts       # 原 cloudbase/db.ts
```

- 删除 `cloudbase/client.ts`、`cloudbase/jwt.ts`、`cloudbase/route-handler.ts`（内联）。
- 机械更新所有 import（约 57 处，见 `grep -rn "@/lib/cloudbase" src`）。
- 更新测试：`tests/cloudbase-env.test.ts`（重写为 env 校验）、`db-pool-config.test.ts`、`server-timing.test.ts`、`tencentdb-schema.test.ts`（`cloudbase_uid` 断言改为 `password_hash`/`sessions`）。

### 6.2 数据模型收尾

- `database/tencentdb/007_drop_cloudbase_uid.sql`：`alter table public.app_users drop column cloudbase_uid;`
- 确认 `password_hash` 已为 NOT NULL（存量补齐后）。
- 清理 `server.ts` / `db.ts` 中 Vercel / CloudBase 措辞注释。

### 6.3 文档对齐

- 重写 `README.md`、`SETUP.md`、`SETUP_AUTH.md`（现在是 Supabase 旧版）。
- 删除或归档 `supabase/migrations/`（标注为历史）。
- `PROGRESS.md` 追加自托管迁移记录。

### 6.4 自助改密（可选，推荐）

- 新增「修改密码」页 + `PUT /api/auth/password`：校验旧口令 → 更新 hash → `deleteAllUserSessions`（撤销所有会话）。
- 修复 `auth-store.signUp` 文案。

### 6.5 备份与运维

- `scripts/backup-db.mjs`：`pg_dump` 封装（含时间戳、压缩、保留策略）。
- Ubuntu cron：每日备份 + 过期 session 清理 SQL + 日志轮转说明。

### 6.6 安全加固（可选）

- 会话列表 / 踢掉其他设备 UI（sessions 表已天然支持）。
- 登录失败/成功审计日志（nginx access log + 应用层可选）。
- nginx 安全头（P1 已含）。
- （登录限流已在 P0 应用层退避 + P1 nginx `limit_req` 落地，无需在此重复。）

---

## 7. 迁移执行顺序与回滚

1. **P0**：**cutover 前从 CloudBase 控制台确认唯一存量用户的登录标识（email）** → 006 迁移 → `create-user.mjs` 为存量用户设口令 → 改代码 → 单测/typecheck → 本地 `npm run dev` 全流程 → 部署验证 → 用户重登一次。
2. **P1**：standalone 构建 → Dockerfile/compose/nginx → Ubuntu 部署 → HTTPS 全链路验证。
3. **P2**：重命名 → 文档 → 007 删列 → 改密/备份/加固。

**回滚**：P0 保留 `cloudbase_uid` 列、保留原 `server.ts` 的 git 历史；006 迁移用 `begin/commit` 事务，失败可整体回滚。P1 用镜像 tag + compose 版本回退。P2 删列（007）为不可逆步骤，须在 P0/P1 稳定运行后单独执行。

---

## 8. 全局风险清单

1. **用户口令无法导出**：切换当天唯一存量用户需管理员重置一次口令（唯一不可平滑点）。
2. **切换瞬间全端退出登录**：旧 CloudBase cookie 失效，预期内的一次性行为。
3. **TencentDB 网络与 TLS**：确认 Ubuntu 出口 IP 加入白名单或走内网/专线；证书校验开启（`rejectUnauthorized: true`）后需正确配置 `TENCENTDB_CA`，否则连接失败。
4. **HTTPS 前置**：`AUTH_COOKIE_SECURE=true` 依赖 nginx 终止 TLS；纯 HTTP 需显式关闭，否则 cookie 写不进浏览器。
5. **单实例假设**：进程级缓存/内存限流假设单容器；未来横向扩容需外置会话缓存（当前 2~5 人规模无需处理，session 已存 DB，天然支持多实例）。
6. **对外 API 形状冻结**：前端 store 只依赖同源 API 与 `{ user: profile }` 结构，迁移期间接口路径与返回形状不能变。

---

## 9. 验收清单（全量）

- [ ] `grep -rn "tcloudbasegateway\|@cloudbase\|CLOUDBASE" src/` 为空
- [ ] `npm run typecheck`、`npm test` 通过
- [ ] 登录 → 刷新恢复 → 退出 → 复用旧 cookie 返回 401
- [ ] 改密后旧会话立即失效
- [ ] 连续错误口令被限流（应用层退避 + nginx `limit_req` 均生效）
- [ ] 所有业务模块（习惯/睡眠/运动/阅读/复盘/目标/实践/今日）走通
- [ ] `/api/db-ping` 返回 success
- [ ] DB 连接证书校验开启且连接正常（非 `rejectUnauthorized: false`）
- [ ] Docker 镜像在干净 Ubuntu 可复现构建，且镜像层内不含 `.env`
- [ ] nginx + certbot 自动续期可用（`certbot renew --dry-run`）
- [ ] `pg_dump` 备份可恢复到空库
- [ ] PWA 主屏访问正常
