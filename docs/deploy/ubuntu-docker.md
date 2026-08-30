# Ubuntu + Docker 部署指南

> 自托管部署：Next.js standalone 镜像 + 宿主机 nginx 反代 + TencentDB PostgreSQL。
> 前置：已在 TencentDB 上执行 `database/tencentdb/` 下 001~006 迁移，并用 `scripts/create-user.mjs` 创建了账号。

## 1. 安装 Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # 重新登录后生效
```

## 2. 准备环境变量

```bash
cp .env.example .env
# 编辑 .env 填入 TENCENTDB_*、AUTH_COOKIE_SECURE 等
chmod 600 .env
```

## 3. 构建并启动

```bash
docker compose build
docker compose up -d
# 验证健康检查
docker compose exec app wget -qO- http://127.0.0.1:3000/api/db-ping
# 期望: {"success":true,"latencyMs":...}
```

## 4. nginx + certbot（宿主机）

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo cp deploy/nginx/rhythm.conf /etc/nginx/sites-available/rhythm
sudo ln -s /etc/nginx/sites-available/rhythm /etc/nginx/sites-enabled/rhythm

# 将 server_name 替换为你的域名后 reload
sudo nginx -t && sudo systemctl reload nginx

# 签发证书并自动注入 443
sudo certbot --nginx -d your.domain.com --redirect

# 验证自动续期
sudo certbot renew --dry-run
```

> 登录限流：把 `limit_req_zone` 加到 `/etc/nginx/nginx.conf` 的 `http {}` 内（见 `deploy/nginx/rhythm.conf` 顶部注释）。

## 5. 防火墙

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

应用容器只绑定 `127.0.0.1:3000`，不对外暴露。

## 6. TencentDB 网络与 TLS

1. 将 Ubuntu 出口公网 IP 加入 TencentDB 白名单；同 VPC 则走内网地址。
2. **证书校验开启**（默认 `TENCENTDB_SSL=true` + `rejectUnauthorized: true`）时，需下载腾讯云 PostgreSQL 的 CA 证书：
   - 在腾讯云控制台「SSL 证书」或数据库实例详情获取 CA 文件，保存到宿主机（如 `/etc/ssl/tencentdb-ca.pem`）。
   - 若应用容器需要读取该文件，将其挂载进容器并在 `.env` 里设 `TENCENTDB_CA` 为容器内路径；或将 CA 内容合并进系统信任后留空 `TENCENTDB_CA`。
   - 若仅通过内网专线访问且确需关闭校验，才设 `TENCENTDB_SSL=false`（不推荐）。

## 7. AUTH_COOKIE_SECURE 与 HTTPS

- **有域名（VPS，走 nginx + certbot）**：`AUTH_COOKIE_SECURE=true`。
- **无域名（内网/Tailscale，走 HTTP）**：必须 `AUTH_COOKIE_SECURE=false`，否则 Secure cookie 写不进浏览器，表现为「登录成功但立即掉线」。

## 8. 升级与回滚

```bash
docker compose build && docker compose up -d
# 回滚: 用带 tag 的旧镜像
docker compose build --tag rhythm-app:rollback && docker compose up -d
```

## 9. 备份

```bash
# 每日备份(pg_dump,时间戳+压缩),见 scripts/backup-db.mjs(迁移 P2 落地)
pg_dump "$TENCENTDB_CONNSTR" | gzip > "rhythm-$(date +%F).sql.gz"
```

## 10. 常见问题

- **登录后立即掉线**：`AUTH_COOKIE_SECURE=true` 但实际走 HTTP → 设 `false`。
- **数据库连接失败**：白名单未放行 / `TENCENTDB_CA` 配置与腾讯云不匹配 / SSL 开关与实际不符。
- **首次登录提示「未初始化口令」**：该账号尚未跑 `scripts/create-user.mjs` 设置口令。
