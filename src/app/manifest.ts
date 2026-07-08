import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Rhythm 生活节奏',
    short_name: 'Rhythm',
    description: '发现你的生活节奏',
    start_url: '/today',
    display: 'standalone',
    background_color: '#0B1019',
    theme_color: '#0B1019',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
