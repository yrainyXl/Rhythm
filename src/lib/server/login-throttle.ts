// 登录失败退避:单实例内存 Map,按 username+IP 记录连续失败并指数退避。
// 这是 nginx limit_req 之后的第二道防线(应用层),单容器假设下足够。
// 多实例横向扩容时需外置(见文档 8.5)。

interface Entry {
  fails: number
  blockedUntil: number
}

const FAIL_WINDOW_MS = 10 * 60 * 1000 // 10 分钟内连续失败累计
const MAX_BLOCK_MS = 30 * 1000 // 最大退避 30s
const THRESHOLD = 5 // 连续失败 >= 5 次开始退避

const map = new Map<string, Entry>()

function now(): number {
  return Date.now()
}

/** 是否被退避;返回 true 时给出建议重试秒数。 */
export function isLoginBlocked(key: string): { blocked: boolean; retryAfterSec: number } {
  const entry = map.get(key)
  if (!entry) return { blocked: false, retryAfterSec: 0 }
  if (entry.blockedUntil > now()) {
    return {
      blocked: true,
      retryAfterSec: Math.ceil((entry.blockedUntil - now()) / 1000),
    }
  }
  return { blocked: false, retryAfterSec: 0 }
}

/** 记录一次失败,累加退避。 */
export function recordLoginFailure(key: string): void {
  const entry = map.get(key) ?? { fails: 0, blockedUntil: 0 }
  if (now() - entry.blockedUntil > FAIL_WINDOW_MS && entry.fails >= THRESHOLD) {
    entry.fails = 0
  }
  entry.fails += 1
  if (entry.fails >= THRESHOLD) {
    const delayMs = Math.min(1000 * 2 ** (entry.fails - THRESHOLD), MAX_BLOCK_MS)
    entry.blockedUntil = now() + delayMs
  }
  map.set(key, entry)
}

/** 登录成功后清空该 key 的失败记录。 */
export function clearLoginFailures(key: string): void {
  map.delete(key)
}

/** 从请求提取客户端 IP(nginx 透传 X-Forwarded-For;开发环境兜底 local)。 */
export function clientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'local'
}
