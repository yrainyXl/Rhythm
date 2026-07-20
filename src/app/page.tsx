'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 入口层(呼吸波沉浸页面)暂时隐藏,根路径直接跳 today。
// 未来若要恢复入口层,把之前的 EntranceSurface 版本还原即可。
export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/today')
  }, [router])

  return null
}
