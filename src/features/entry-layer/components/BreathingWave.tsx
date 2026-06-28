'use client'

import { useMemo } from 'react'
import { useEntryStore } from '@/features/entry-layer/store/entry-store'

interface WaveLayerData {
  id: string
  pathD: string
  baseOpacity: number
  blurAmount: number
  animDuration: number
  animDelay: number
}

export function BreathingWave() {
  const { isPressing, pressProgress, isCompleted } = useEntryStore()

  // Generate organic wave paths — not sine waves, more like a thin silk membrane
  const waveLayers: WaveLayerData[] = useMemo(() => {
    const width = 360
    const height = 140
    const cx = width / 2
    const cy = height / 2

    const generatePath = (amplitude: number, offsetY: number, phaseShift: number): string => {
      const segments = 8
      const segmentWidth = width / segments
      let d = `M 0,${cy + offsetY} `

      for (let i = 0; i < segments; i++) {
        const x0 = i * segmentWidth
        const x2 = x0 + segmentWidth
        const xMid = x0 + segmentWidth / 2

        // Distance from center determines wave height — peaks gently at center, tapers toward edges
        const distFromCenter = Math.abs(xMid - cx) / cx
        const centerFactor = 1 - distFromCenter * 0.7

        const a = amplitude * centerFactor
        const phase = (i + phaseShift) * 0.7
        const y0 = cy + offsetY + Math.sin(phase) * a * (1 - centerFactor * 0.3)
        const y2 = cy + offsetY + Math.sin(phase + 0.7) * a * (1 - centerFactor * 0.3)
        const cpy = cy + offsetY + Math.sin(phase + 0.35) * a * 1.2

        d += `C ${x0 + segmentWidth * 0.35},${cpy} ${xMid + segmentWidth * 0.15},${cpy} ${x2},${y2} `
      }

      return d
    }

    return [
      {
        id: 'wave-deep',
        pathD: generatePath(22, 8, 2.1),
        baseOpacity: 0.35,
        blurAmount: 12,
        animDuration: 7,
        animDelay: 0,
      },
      {
        id: 'wave-mid',
        pathD: generatePath(28, 0, 4.3),
        baseOpacity: 0.5,
        blurAmount: 10,
        animDuration: 6,
        animDelay: 1.2,
      },
      {
        id: 'wave-top',
        pathD: generatePath(18, -6, 1.1),
        baseOpacity: 0.6,
        blurAmount: 8,
        animDuration: 5.5,
        animDelay: 2.8,
      },
      {
        id: 'wave-whisper',
        pathD: generatePath(10, -14, 3.5),
        baseOpacity: 0.28,
        blurAmount: 16,
        animDuration: 8,
        animDelay: 1.8,
      },
    ]
  }, [])

  // Map opacity to a clean percentage keyframe offset so each layer breathes independently
  // Rather than fighting with CSS variables in keyframes, we generate unique keyframe names
  const keyframeStyles = useMemo(() => {
    return waveLayers.map((layer) => {
      const low = layer.baseOpacity
      const high = Math.min(layer.baseOpacity + 0.2, 0.8)
      return `
        @keyframes waveBreathe-${layer.id} {
          0%, 100% { transform: scaleY(1) translateY(0); opacity: ${low}; }
          25% { transform: scaleY(1.08) translateY(-2px); opacity: ${high}; }
          50% { transform: scaleY(1.02) translateY(-1px); opacity: ${(low + high) / 2}; }
          75% { transform: scaleY(0.94) translateY(1px); opacity: ${low - 0.05}; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes waveBreathe-${layer.id} {
            0%, 100% { transform: scaleY(1) translateY(0); opacity: ${low}; }
          }
        }
      `
    }).join('\n')
  }, [waveLayers])

  return (
    <div
      className="relative w-full flex items-center justify-center select-none"
      style={{
        height: '140px',
        transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isPressing
          ? `scaleY(${1 - pressProgress * 0.06})`
          : isCompleted
            ? 'scaleY(0.96)'
            : 'scaleY(1)',
      }}
    >
      <style>{keyframeStyles}</style>

      <svg
        viewBox="0 0 360 140"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
        style={{ maxWidth: '400px' }}
      >
        <defs>
          {waveLayers.map((layer) => (
            <filter key={`f-${layer.id}`} id={`blur-${layer.id}`}>
              <feGaussianBlur in="SourceGraphic" stdDeviation={layer.blurAmount} />
            </filter>
          ))}

          {/* Soft center luminance — no hotspot, no polestar, just a gentle cool glow */}
          <radialGradient id="wave-glow" cx="50%" cy="50%" r="75%">
            <stop offset="0%" stopColor="rgba(160, 195, 220, 0.25)" />
            <stop offset="30%" stopColor="rgba(145, 180, 210, 0.15)" />
            <stop offset="60%" stopColor="rgba(120, 160, 200, 0.05)" />
            <stop offset="100%" stopColor="rgba(100, 140, 180, 0)" />
          </radialGradient>

          {/* Edge darkening — keeps focus on center without creating a visible spotlight border */}
          <linearGradient id="edge-fade" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(11, 16, 25, 0.55)" />
            <stop offset="12%" stopColor="rgba(11, 16, 25, 0)" />
            <stop offset="88%" stopColor="rgba(11, 16, 25, 0)" />
            <stop offset="100%" stopColor="rgba(11, 16, 25, 0.55)" />
          </linearGradient>
        </defs>

        {/* Base glow — subtle, behind all waves */}
        <ellipse
          cx="180"
          cy="70"
          rx="180"
          ry="65"
          fill="url(#wave-glow)"
          style={{
            transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: isPressing ? 0.45 + pressProgress * 0.35 : 0.45,
          }}
        />

        {/* Wave layers — each with its own keyframe animation */}
        {waveLayers.map((layer) => (
          <g key={layer.id}>
            <path
              d={layer.pathD}
              fill="none"
              stroke="rgba(155, 190, 220, 0.5)"
              strokeWidth="1.2"
              style={{
                filter: `url(#blur-${layer.id})`,
                animationName: `waveBreathe-${layer.id}`,
                animationDuration: `${layer.animDuration}s`,
                animationDelay: `${layer.animDelay}s`,
                animationTimingFunction: 'cubic-bezier(0.45, 0, 0.55, 1)',
                animationIterationCount: 'infinite',
                animationFillMode: 'both',
                transformOrigin: 'center center',
              }}
            />
          </g>
        ))}

        {/* Edge vignette overlay */}
        <rect x="0" y="0" width="360" height="140" fill="url(#edge-fade)" />
      </svg>

      {/* Press indicator: a very subtle concentric contraction ring */}
      {isPressing && (
        <svg
          viewBox="0 0 360 140"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
          style={{ maxWidth: '400px', pointerEvents: 'none' }}
        >
          <ellipse
            cx="180"
            cy="70"
            rx={180 * (1 - pressProgress * 0.35)}
            ry={65 * (1 - pressProgress * 0.35)}
            fill="none"
            stroke="rgba(170, 200, 225, 0.15)"
            strokeWidth="0.5"
            style={{
              transition: 'rx 0.15s linear, ry 0.15s linear, opacity 0.3s ease',
              opacity: 0.3 + pressProgress * 0.5,
            }}
          />
        </svg>
      )}
    </div>
  )
}
