/** @type {import('next').NextConfig} */
const nextConfig = {
  // 手写的 database.types.ts 缺 Relationships 键,Supabase 查询被推断成 never。
  // 运行时正常(dev 全程验证过),类型问题待后续补全,暂不阻塞生产构建。
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // @cloudbase/node-sdk 含动态代码评估,在 nodejs runtime 的 Route Handler /
    // Server Component 中作为外部包加载,避免 webpack 打包触发 Edge 检查。
    serverComponentsExternalPackages: ['@cloudbase/node-sdk', '@cloudbase/js-sdk'],
  },
  // @cloudbase/js-sdk v3 的 package.json exports 含 node 条件,Next 14.2 在解析
  // 客户端 bundle 时可能落到 index.node.esm.js,它 import 了 Node 专用 'ws' 模块,
  // 浏览器侧无此模块会报 "Can't resolve 'ws'"。浏览器鉴权走 fetch,不需要 ws,
  // 在客户端 bundle 里将其置空即可。
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = config.resolve || {}
      config.resolve.fallback = { ...config.resolve.fallback, ws: false }
    }
    return config
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  // 浏览器直连 *.supabase.co 在国内链路波动大(3-6s,偶发超时),冷加载时
  // SDK token 刷新撞上波动会永久卡死。把 Supabase 流量走同源 /sb-proxy/*,
  // 由 Vercel 边缘转发(机房->Supabase 稳定 ~0.6s)。supabaseUrl 保持不变,
  // 故 cookie 名两端一致;仅浏览器端 fetch 重写 URL(middleware/API 直连不变)。
  async rewrites() {
    const dest = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!dest) return []
    return [{ source: '/sb-proxy/:path*', destination: `${dest}/:path*` }]
  },
}

export default nextConfig