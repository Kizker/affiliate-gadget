'use client'

import { useState, useRef } from 'react'
import { Play, Pause, Maximize2 } from 'lucide-react'

interface ChatVideoPlayerProps {
  src: string
  onOpenFullscreen?: () => void
  className?: string
}

export function ChatVideoPlayer({
  src,
  onOpenFullscreen,
  className = '',
}: ChatVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      video.play().catch(() => {})
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Jeda pemutaran video di bubble saat membuka fullscreen
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause()
      setIsPlaying(false)
    }
    if (onOpenFullscreen) {
      onOpenFullscreen()
    } else if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen().catch(() => {})
      }
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Video tanpa controls bawaan browser agar pratinjau chat bersih */}
      <video
        ref={videoRef}
        src={src}
        playsInline
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onClick={togglePlay}
        className="block max-h-[160px] w-full max-w-[200px] cursor-pointer rounded-2xl bg-black object-cover sm:max-h-[220px] sm:max-w-[240px]"
      />

      {/* Tombol Play / Pause di tengah */}
      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? 'Jeda video' : 'Putar video'}
        title={isPlaying ? 'Jeda' : 'Putar'}
        className="absolute inset-0 z-10 m-auto flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white shadow-md backdrop-blur-md transition-all hover:scale-110 hover:bg-black/85 active:scale-95"
      >
        {isPlaying ? (
          <Pause className="h-4 w-4 fill-white text-white" />
        ) : (
          <Play className="ml-0.5 h-4 w-4 fill-white text-white" />
        )}
      </button>

      {/* Tombol Layar Penuh (Fullscreen) di pojok kanan atas */}
      <button
        type="button"
        onClick={handleFullscreen}
        aria-label="Perbesar layar penuh"
        title="Layar Penuh"
        className="h-7.5 w-7.5 absolute right-2 top-2 z-10 flex cursor-pointer items-center justify-center rounded-full bg-black/65 text-white shadow-sm backdrop-blur-md transition-all hover:scale-110 hover:bg-black/90 active:scale-95"
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
