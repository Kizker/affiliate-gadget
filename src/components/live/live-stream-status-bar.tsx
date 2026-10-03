'use client'

import { useEffect, useState } from 'react'
import { Eye, Radio, Clock, Wifi } from 'lucide-react'

interface LiveStreamStatusBarProps {
  startedAt?: string | Date | null
  viewerCount: number
  isLive: boolean
  isConnected?: boolean
}

export function LiveStreamStatusBar({
  startedAt,
  viewerCount,
  isLive,
  isConnected = true,
}: LiveStreamStatusBarProps) {
  const [elapsed, setElapsed] = useState('00:00:00')

  useEffect(() => {
    if (!isLive || !startedAt) {
      setElapsed('00:00:00')
      return
    }

    const startMs = new Date(startedAt).getTime()
    const updateTimer = () => {
      const now = Date.now()
      const diffSec = Math.max(0, Math.floor((now - startMs) / 1000))
      const h = Math.floor(diffSec / 3600)
      const m = Math.floor((diffSec % 3600) / 60)
      const s = diffSec % 60
      setElapsed(
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      )
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [isLive, startedAt])

  return (
    <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/80 px-2.5 py-1 text-[11px] text-white shadow-lg backdrop-blur-md sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs">
      {/* Live Badge */}
      {isLive ? (
        <span className="flex animate-pulse items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 font-bold uppercase tracking-wider text-rose-400 sm:gap-1.5 sm:px-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] sm:h-2 sm:w-2" />
          <Radio className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          LIVE
        </span>
      ) : (
        <span className="flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 font-semibold text-slate-400">
          OFFLINE
        </span>
      )}

      {/* Online Viewers */}
      <span className="flex items-center gap-1 rounded-full bg-white/5 px-1.5 py-0.5 font-medium sm:gap-1.5 sm:px-2">
        <Eye className="h-3 w-3 text-blue-400 sm:h-3.5 sm:w-3.5" />
        <span className="font-mono font-bold text-white">
          {viewerCount.toLocaleString()}
        </span>
        <span className="hidden text-slate-400 sm:inline">penonton</span>
      </span>

      {/* Duration Timer (Desktop & Tablet) */}
      {isLive && (
        <span className="hidden items-center gap-1.5 rounded-full bg-white/5 px-2 py-0.5 font-medium sm:flex">
          <Clock className="h-3.5 w-3.5 text-amber-400" />
          <span className="font-mono text-slate-200">{elapsed}</span>
        </span>
      )}

      {/* Socket Status indicator */}
      <span
        title={
          isConnected ? 'Koneksi real-time stabil' : 'Menghubungkan ulang...'
        }
        className="flex items-center pl-0.5"
      >
        <Wifi
          className={`h-3 w-3 transition-colors sm:h-3.5 sm:w-3.5 ${
            isConnected ? 'text-emerald-400' : 'animate-pulse text-amber-500'
          }`}
        />
      </span>
    </div>
  )
}
