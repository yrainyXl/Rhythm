/** @type {import('next').NextConfig} */
const nextConfig = {
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
}

export default nextConfig
