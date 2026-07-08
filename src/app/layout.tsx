import '@/app/globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProviderClient } from '@/features/auth/components/auth-provider-client'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Rhythm',
  description: '发现你的生活节奏',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} min-h-screen`}>
        <AuthProviderClient>{children}</AuthProviderClient>
      </body>
    </html>
  )
}
