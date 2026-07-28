# 鉴权链路 JWT 验签优化

## 背景
当前每个业务 API 请求都串行做两步鉴权:
1. 调网关 `GET /auth/v1/user/me` 用 access_token 换 cloudbase uid(网络往返,~150ms)
2. 查 DB `app_users` 拿 app_users.id

今天页首屏 5 个业务接口并发,每个都重复第 1 步网关往返,纯鉴权开销 ~800ms+。
实测:refresh 435ms,业务接口 160-210ms(大头是网关 userinfo)。

## 目标
服务端本地验签 access_token(RS256 JWT)拿 uid,跳过网关 userinfo 往返。
每个业务 API 鉴权从「网关往返 + DB 查询」降为「纯本地验签 + DB 查询」,省 ~150ms/请求。
首屏预计省 700ms+。

## JWT 信息(已实测确认)
- 算法:RS256
- JWKS:`https://<envId>.api.tcloudbasegateway.com/auth/v1/certs`(2 个 RSA 公钥)
- issuer:`https://<envId>.api.tcloudbasegateway.com`
- audience:`<envId>`
- payload.sub = cloudbase uid(用作 app_users.cloudbase_uid)
- header.kid 匹配 JWKS

## 方案

### 1. 新增 JWT 验签模块 `src/lib/cloudbase/jwt.ts`
- `getJwks()`:拉取 JWKS,进程级缓存(1 小时 TTL),失败回退 null
- `verifyAccessToken(token)`:用 Node `crypto.createPublicKey({key:jwk,format:'jwk'})` 转 PEM,
  `jsonwebtoken.verify` 验签(校验 RS256 + iss + aud + exp),返回 `{uid, email} | null`
- 验签失败/kid 无匹配返回 null(调用方 fallback 网关)

### 2. 改 `server.ts` 的 `fetchCloudbaseUserInfo`
- 优先 JWT 验签拿 uid(本地,无往返)
- 验签失败才 fallback 网关 userinfo(兼容旧 token / 公钥未刷新等)
- 这样 `getUserIdFromCloudbase` / `ensureAppUser` 链路不变,内部优化

### 3. 兼容性
- access_token 失效(过期)走原有 refresh_token 续期逻辑
- 验签失败不直接 401,先 fallback 网关确认,避免公钥刷新期误判

## 不改的部分
- 前端无改动(token 仍 httpOnly cookie)
- 业务 API 路由无改动(都走 withUser)
- DB 查询不变(仍需 app_users.id)

## 风险与兜底
- 公钥轮换:JWKS 缓存 1h,验签失败时强制刷新一次 JWKS 重试,再不行 fallback 网关
- 不校验签名直接读 payload 是禁止的(伪造 token 越权),必须用 JWKS 公钥验签

## 验证
- 本地登录后测各接口耗时对比(应明显下降)
- 首屏 today 页 5 接口总耗时对比
- 登录/刷新/登出闭环回归
- typecheck
