'use client'

import React, { useState, useEffect, useCallback, memo } from 'react'
import { Heart } from 'lucide-react'

export interface HeartItem {
  id: number
  left: number // Percentage 10% - 90%
  color: string // Tailwind or hex color
  size: number // px 22 - 38
  scale: number
  rotation: number // -25 to 25 deg
  duration: number // animation duration in seconds
}

const HEART_COLORS = [
  '#F43F5E', // Rose 500
  '#EF4444', // Red 500
  '#EC4899', // Pink 500
  '#F97316', // Orange 500
  '#8B5CF6', // Purple 500
  '#E11D48', // Rose 600
  '#FB7185', // Rose 400
]

interface FloatingHeartsOverlayProps {
  /**
   * Changing this key triggers new floating hearts (e.g. likeCount from WebSocket)
   */
  triggerCount?: number
  className?: string
  /**
   * Allows local click on the video container to spawn a heart
   */
  onHeartClick?: () => void
}

export const FloatingHeartsOverlay = memo(function FloatingHeartsOverlay({
  triggerCount = 0,
  className = '',
  onHeartClick,
}: FloatingHeartsOverlayProps) {
  const [hearts, setHearts] = useState<HeartItem[]>([])
  const prevCountRef = React.useRef(triggerCount)

  const spawnHearts = useCallback((burstCount: number = 2) => {
    const newItems: HeartItem[] = []
    const now = Date.now()

    for (let i = 0; i < burstCount; i++) {
      const color =
        HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)]
      const left = Math.floor(Math.random() * 50) + 40 // Grouped near bottom-right (40% - 90%)
      const size = Math.floor(Math.random() * 16) + 22 // 22px to 38px
      const rotation = Math.floor(Math.random() * 50) - 25 // -25deg to 25deg
      const duration = 1.6 + Math.random() * 0.8 // 1.6s to 2.4s

      newItems.push({
        id: now + i + Math.random(),
        left,
        color,
        size,
        scale: 1,
        rotation,
        duration,
      })
    }

    setHearts((prev) => [...prev.slice(-25), ...newItems])

    // Clean up hearts after animation duration
    setTimeout(() => {
      const idsToRemove = new Set(newItems.map((h) => h.id))
      setHearts((prev) => prev.filter((h) => !idsToRemove.has(h.id)))
    }, 2500)
  }, [])

  // Listen to external triggerCount changes (from WebSocket / other viewers)
  useEffect(() => {
    if (triggerCount > prevCountRef.current) {
      const delta = Math.min(triggerCount - prevCountRef.current, 5)
      spawnHearts(Math.max(1, delta))
      prevCountRef.current = triggerCount
    } else if (triggerCount !== prevCountRef.current) {
      prevCountRef.current = triggerCount
    }
  }, [triggerCount, spawnHearts])

  return (
    <div
      onClick={onHeartClick}
      className={`pointer-events-none absolute inset-0 z-30 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {hearts.map((h) => (
        <div
          key={h.id}
          style={{
            left: `${h.left}%`,
            animationDuration: `${h.duration}s`,
            transform: `rotate(${h.rotation}deg)`,
          }}
          className="animate-float-heart absolute bottom-6"
        >
          <Heart
            style={{
              width: `${h.size}px`,
              height: `${h.size}px`,
              fill: h.color,
              color: h.color,
              filter: `drop-shadow(0 2px 8px ${h.color}88)`,
            }}
            className="transition-transform"
          />
        </div>
      ))}
    </div>
  )
})
