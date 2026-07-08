import '@/app/globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { AuthProviderClient } from '@/features/auth/components/auth-provider-client'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Rhythm',
  description: '发现你的生活节奏',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Rhythm',
    statusBarStyle: 'black-translucent',
  },
}

export const viewport: Viewport = {
  themeColor: '#0B1019',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('rhythm-theme')==='light'?'light':'dark';var r=document.documentElement;r.classList.remove('dark','light');r.classList.add(t);}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${inter.className} min-h-screen`}>
        <AuthProviderClient>{children}</AuthProviderClient>
      </body>
    </html>
  )
}
