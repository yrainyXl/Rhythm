'use client'

import { AuthGuard } from '@/features/app/components/auth-guard'
import { EntranceSurface } from '@/features/entry-layer'
import Link from 'next/link'

export default function HomePage() {
  return (
    <AuthGuard>
      <div className="h-dvh w-full flex flex-col relative">
        <EntranceSurface />

        {/* Swipe-down hint + link to enter skeleton layer */}
        <Link
          href="/today"
          className="absolute bottom-6 left-0 right-0 z-20 text-center text-[0.7rem] tracking-[0.06em] py-6 transition-opacity duration-700"
          style={{
            color: 'rgba(210, 215, 222, 0.18)',
            fontFamily: '"Noto Serif SC", "STSong", "PingFang SC", "Microsoft YaHei", serif',
            opacity: 0.4,
          }}
          onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = '0.85' }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = '0.4' }}
        >
          下滑进入今天
        </Link>
      </div>
    </AuthGuard>
  )
}
