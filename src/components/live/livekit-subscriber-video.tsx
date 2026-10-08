'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionState,
  useTracks,
} from '@livekit/components-react'
import { Track, ConnectionState } from 'livekit-client'
import {
  Radio,
  ShoppingBag,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Heart,
} from 'lucide-react'
import { VIEWER_ROOM_OPTIONS } from '@/lib/livekit-options'
import { FloatingHeartsOverlay } from './floating-hearts'

// Hook to detect mobile viewport
function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean>(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return isMobile
}

interface LiveKitSubscriberVideoProps {
  videoRefExternal?: React.RefObject<HTMLVideoElement | null>
  onOrientationChange?: (isVertical: boolean) => void
  onFullscreen?: () => void
  likeCount?: number
  onSendLike?: () => void
  isMirrored?: boolean
  showControls?: boolean
  isStreamEnded?: boolean
  isFullscreen?: boolean
}

function LiveKitSubscriberVideo({
  videoRefExternal,
  onOrientationChange,
  onFullscreen,
  likeCount = 0,
  onSendLike,
  isMirrored = false,
  showControls = true,
  isStreamEnded = false,
  isFullscreen = false,
}: LiveKitSubscriberVideoProps) {
  const isMobile = useIsMobile()
  const [isMuted, setIsMuted] = useState(false)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const videoRef = videoRefExternal || localVideoRef
  const ambientVideoRef = useRef<HTMLVideoElement>(null)
  const [isVertical, setIsVertical] = useState(false)

  // Track camera publications from remote host
  const connectionState = useConnectionState()
  const tracks = useTracks([Track.Source.Camera])
  const hostCameraTrack = tracks.find(
    (t) => t.publication.source === Track.Source.Camera && !!t.publication.track
  )
  const activeTrack = hostCameraTrack?.publication?.track

  useEffect(() => {
    const el = videoRef.current
    const ambientEl = ambientVideoRef.current
    if (!activeTrack || !el) return

    activeTrack.attach(el)
    if (ambientEl) {
      activeTrack.attach(ambientEl)
    }

    const checkOrientation = () => {
      if (el.videoWidth > 0 && el.videoHeight > 0) {
        const vertical = el.videoHeight > el.videoWidth
        setIsVertical(vertical)
        onOrientationChange?.(vertical)
      }
    }

    el.addEventListener('loadedmetadata', checkOrientation)
    el.addEventListener('resize', checkOrientation)
    checkOrientation()

    // Ensure playback starts smoothly; fallback to muted if mobile autoplay policy blocks unmuted audio
    el.play().catch(() => {
      el.muted = true
      setIsMuted(true)
      el.play().catch(() => {})
    })

    return () => {
      activeTrack.detach(el)
      if (ambientEl) activeTrack.detach(ambientEl)
      el.removeEventListener('loadedmetadata', checkOrientation)
      el.removeEventListener('resize', checkOrientation)
    }
  }, [activeTrack, onOrientationChange, videoRef])

  const statusTitle =
    connectionState === ConnectionState.Connected
      ? 'Menunggu video dari Host...'
      : connectionState === ConnectionState.Reconnecting
        ? 'Koneksi tidak stabil, menyambungkan ulang...'
        : connectionState === ConnectionState.Disconnected
          ? 'Koneksi terputus, mencoba lagi...'
          : 'Menghubungkan ke Host Toko...'

  // Pada desktop: jika host live stream vertikal, gunakan object-contain dengan ambient blurred background
  // Pada mobile smartphone: video selalu memenuhi layar penuh (object-cover)
  const isContainMode = !isMobile && isVertical

  // Jika siaran telah diakhiri oleh host
  if (isStreamEnded) {
    return (
      <div
        role="region"
        aria-label="Status siaran langsung telah berakhir"
        className="relative flex h-full w-full select-none flex-col items-center justify-center bg-slate-950 p-6 text-center text-white"
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-500 shadow-xl shadow-orange-500/10">
          <Radio className="h-8 w-8 text-orange-500 opacity-60" />
        </div>
        <h4 className="text-lg font-bold text-white sm:text-xl">
          Siaran Langsung Telah Berakhir
        </h4>
        <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-slate-400">
          Host toko cabang telah menyelesaikan sesi siaran langsung ini. Terima
          kasih telah menonton dan berbelanja!
        </p>
        <Link
          href="/gadget"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-600 active:scale-95"
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Jelajahi Katalog Gadget Toko</span>
        </Link>
      </div>
    )
  }

  return (
    <div
      role="region"
      aria-label="Pemutar video siaran langsung"
      onDoubleClick={onSendLike}
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-slate-950"
    >
      {activeTrack ? (
        <>
          {/* Ambient blurred backdrop for vertical streams on widescreen displays */}
          {isContainMode && (
            <video
              ref={ambientVideoRef}
              autoPlay
              playsInline
              muted
              aria-hidden="true"
              tabIndex={-1}
              className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-35 blur-2xl transition-all duration-500"
              style={{
                transform: isMirrored ? 'scaleX(-1) scale(1.1)' : 'scale(1.1)',
              }}
            />
          )}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isMuted}
            aria-label="Siaran langsung video host toko"
            className={`relative z-10 transition-transform duration-300 ${
              isContainMode
                ? 'mx-auto h-full w-auto max-w-full object-contain'
                : 'h-full w-full object-cover'
            }`}
            style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }}
          >
            <track
              kind="captions"
              src="/captions/live-empty.vtt"
              srcLang="id"
              label="Bahasa Indonesia"
              default
            />
          </video>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 p-6 text-center text-slate-400">
          <div className="relative">
            <Radio className="h-14 w-14 animate-pulse text-orange-500" />
            <span className="absolute -right-1 -top-1 h-3 w-3 animate-ping rounded-full bg-orange-400" />
          </div>
          <h4 className="text-base font-bold text-white">{statusTitle}</h4>
          <p className="max-w-xs text-xs text-slate-400">
            Kualitas video menyesuaikan jaringan Anda secara otomatis.
          </p>
        </div>
      )}

      {/* Floating Hearts Animation on Video Canvas */}
      <FloatingHeartsOverlay
        triggerCount={likeCount}
        onHeartClick={onSendLike}
      />

      {/* Video Overlay Action Controls (Desktop/Default) */}
      {showControls && (
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
          {onSendLike && (
            <button
              onClick={onSendLike}
              className="cursor-pointer rounded-full border border-rose-500/40 bg-rose-500/20 p-2.5 text-rose-400 shadow-lg backdrop-blur-md transition-all hover:bg-rose-500/30 active:scale-75"
              title="Kirim Suka (Double Tap Video)"
              aria-label="Kirim suka ke siaran"
            >
              <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
            </button>
          )}

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="cursor-pointer rounded-full border border-white/10 bg-slate-900/80 p-2.5 text-white shadow-lg backdrop-blur-md transition-all hover:bg-slate-800 active:scale-90"
            title={isMuted ? 'Nyalakan Suara' : 'Matikan Suara'}
            aria-label={
              isMuted ? 'Nyalakan suara siaran' : 'Matikan suara siaran'
            }
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4 text-rose-400" />
            ) : (
              <Volume2 className="h-4 w-4 text-white" />
            )}
          </button>

          {onFullscreen && (
            <button
              onClick={onFullscreen}
              className="cursor-pointer rounded-full border border-white/10 bg-slate-900/80 p-2.5 text-white shadow-lg backdrop-blur-md transition-all hover:bg-slate-800 active:scale-90"
              title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
              aria-label={isFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4 text-white" />
              ) : (
                <Maximize2 className="h-4 w-4 text-white" />
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export interface LiveKitStreamPlayerProps {
  serverUrl: string
  token: string
  videoRefExternal?: React.RefObject<HTMLVideoElement | null>
  onOrientationChange?: (isVertical: boolean) => void
  onFullscreen?: () => void
  likeCount?: number
  onSendLike?: () => void
  isMirrored?: boolean
  showControls?: boolean
  isStreamEnded?: boolean
  isFullscreen?: boolean
}

export function LiveKitStreamPlayer({
  serverUrl,
  token,
  videoRefExternal,
  onOrientationChange,
  onFullscreen,
  likeCount = 0,
  onSendLike,
  isMirrored = false,
  showControls = true,
  isStreamEnded = false,
  isFullscreen = false,
}: LiveKitStreamPlayerProps) {
  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token}
      connect={true}
      video={false}
      audio={false}
      options={VIEWER_ROOM_OPTIONS}
      className="h-full w-full"
    >
      <RoomAudioRenderer />
      <LiveKitSubscriberVideo
        videoRefExternal={videoRefExternal}
        onOrientationChange={onOrientationChange}
        onFullscreen={onFullscreen}
        likeCount={likeCount}
        onSendLike={onSendLike}
        isMirrored={isMirrored}
        showControls={showControls}
        isStreamEnded={isStreamEnded}
        isFullscreen={isFullscreen}
      />
    </LiveKitRoom>
  )
}

export default LiveKitStreamPlayer
