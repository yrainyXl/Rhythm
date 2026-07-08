import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: 10,
          paddingBottom: 62,
          background: 'linear-gradient(180deg, #111827 0%, #0B1019 100%)',
        }}
      >
        <div style={{ width: 12, height: 42, borderRadius: 6, background: '#8FB4DC' }} />
        <div style={{ width: 12, height: 78, borderRadius: 6, background: '#8FB4DC' }} />
        <div style={{ width: 12, height: 56, borderRadius: 6, background: '#8FB4DC' }} />
        <div style={{ width: 12, height: 28, borderRadius: 6, background: '#8FB4DC' }} />
      </div>
    ),
    size,
  )
}
