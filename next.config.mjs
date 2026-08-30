/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
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
  },
}

export default nextConfig
