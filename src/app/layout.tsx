import '@/app/globals.css'
import type { Metadata, Viewport } from 'next'
import { AuthProvider } from '@/features/auth/components/auth-provider'

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
  themeColor: '#F2F2F7',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('rhythm-theme')==='dark'?'dark':'light';var r=document.documentElement;r.classList.remove('dark','light');r.classList.add(t);var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',t==='dark'?'#000000':'#F2F2F7');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
