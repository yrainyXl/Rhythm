/** @type {import('next').NextConfig} */
const nextConfig = {
  // TODO(ENG-P0-02): 清理 sleep-store 等历史类型错误后移除
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
    // js-sdk 含动态代码评估,作为外部包加载避免 webpack 打包触发 Edge 检查。
    // node-sdk 已移除(死代码)。
    serverComponentsExternalPackages: ['@cloudbase/js-sdk'],
  },
}

export default nextConfig
