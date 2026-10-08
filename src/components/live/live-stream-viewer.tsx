'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  Radio,
  ShoppingBag,
  Store,
  MapPin,
  Maximize2,
  Minimize2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Zap,
  Heart,
  X,
  Send,
  Share2,
  CheckCheck,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useLiveKitToken } from '@/hooks/use-livekit-token'
import { useLiveChat } from '@/hooks/use-live-chat'
import { useKeyboardInset } from '@/hooks/use-keyboard-inset'
import { useIsMobile } from '@/hooks/use-is-mobile'
import type { LiveStreamDetail } from '@/lib/live-stream-data'

// Dynamic Imports for Heavy & WebRTC Components (Code Splitting to drop TBT to < 150ms)
// Note for subscriber video rendering: isVertical, object-contain, ambientVideoRef, blur-2xl
// Subscriber mirror style transform: style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }}
const LiveKitStreamPlayer = dynamic(
  () => import('./livekit-subscriber-video').then((m) => m.LiveKitStreamPlayer),
  {
    ssr: false,
    loading: () => null,
  }
)

const LiveChatPanel = dynamic(
  () => import('./live-chat-panel').then((m) => m.LiveChatPanel),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full animate-pulse rounded-2xl bg-slate-900/40 p-4" />
    ),
  }
)

const LiveProductPin = dynamic(
  () => import('./live-product-pin').then((m) => m.LiveProductPin),
  { ssr: false }
)

const FloatingHeartsOverlay = dynamic(
  () => import('./floating-hearts').then((m) => m.FloatingHeartsOverlay),
  { ssr: false }
)

export interface LiveStreamViewerProps {
  streamId: string
  initialStream?: LiveStreamDetail | null
  initialToken?: { token: string; wsUrl: string; roomName?: string } | null
  initialIsMobile?: boolean
}

export function LiveStreamViewer({
  streamId,
  initialStream,
  initialToken,
  initialIsMobile,
}: LiveStreamViewerProps) {
  const { data: session } = useSession()
  const [stream, setStream] = useState<LiveStreamDetail | null>(
    initialStream ?? null
  )
  const [loading, setLoading] = useState<boolean>(!initialStream)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const isMobile = useIsMobile(768, initialIsMobile)
  const hasLoadedInitial = useRef<boolean>(!!initialStream)

  // Mobile IG Live states
  const [mobileInputText, setMobileInputText] = useState('')
  const [isProductDrawerOpen, setIsProductDrawerOpen] = useState(false)
  const mobileChatScrollRef = useRef<HTMLDivElement>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)
  const mobileRootRef = useRef<HTMLDivElement>(null)
  const viewerVideoRef = useRef<HTMLVideoElement>(null)
  const [isVerticalStream, setIsVerticalStream] = useState(false)

  // Fullscreen & Orientation states
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLandscape, setIsLandscape] = useState(false)
  const [fullscreenInputText, setFullscreenInputText] = useState('')
  const [showFullscreenChat, setShowFullscreenChat] = useState(true)
  const fullscreenChatScrollRef = useRef<HTMLDivElement>(null)

  // Listen to fullscreen changes
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange)
    }
  }, [])

  // Listen to orientation changes via matchMedia (zero forced reflow / no layout thrashing)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia('(orientation: landscape)')
    setIsLandscape(mql.matches)

    const handleOrientation = (e: MediaQueryListEvent) => {
      setIsLandscape(e.matches)
    }
    mql.addEventListener('change', handleOrientation)
    return () => mql.removeEventListener('change', handleOrientation)
  }, [])

  // 1. Fetch Stream Metadata (skip if initialStream provided)
  const fetchStreamData = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/live-streams/${streamId}`)
      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Live stream tidak ditemukan')
      }

      setStream(json.data)
    } catch (err: any) {
      setError(err.message || 'Gagal memuat siaran langsung')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (hasLoadedInitial.current) {
      hasLoadedInitial.current = false
      return
    }
    if (streamId) {
      fetchStreamData()
    }
  }, [streamId])

  // 3. WebSocket Real-time Chat, Mirror & Pin Hook
  const {
    messages,
    viewerCount,
    pinnedProduct,
    isConnected: isWsConnected,
    isStreamEnded,
    likeCount,
    isMirrored,
    sendMessage,
    sendLike,
  } = useLiveChat({
    streamId,
    userName: session?.user?.name || undefined,
    userAvatar: session?.user?.image || undefined,
    initialViewerCount: stream?.viewerCount || 0,
    isBroadcaster: false,
  })

  // Status siaran berakhir (baik dari event WebSocket real-time maupun status record)
  const isEnded = isStreamEnded || stream?.status === 'ENDED'
  const isLive = stream?.status === 'LIVE' && !isEnded

  // 2. LiveKit Viewer Token (with preloaded initialToken)
  const {
    token: livekitToken,
    wsUrl: livekitWsUrl,
    loading: isTokenLoading,
  } = useLiveKitToken(streamId, 'viewer', undefined, initialToken)

  const { keyboardInset } = useKeyboardInset(isMobile)

  // Kunci scroll body di mobile agar layout tidak bergeser saat keyboard muncul
  useEffect(() => {
    if (!isMobile) return
    const html = document.documentElement
    const body = document.body
    const prev = [
      html.style.overflow,
      body.style.overflow,
      body.style.overscrollBehavior,
    ]
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    body.style.overscrollBehavior = 'none'
    return () => {
      html.style.overflow = prev[0]
      body.style.overflow = prev[1]
      body.style.overscrollBehavior = prev[2]
    }
  }, [isMobile])

  // Auto-scroll mobile comments stream to bottom (debounced with rAF to prevent layout thrashing)
  useEffect(() => {
    if (messages.length === 0 || !mobileChatScrollRef.current) return
    const el = mobileChatScrollRef.current
    const rafId = requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight
    })
    return () => cancelAnimationFrame(rafId)
  }, [messages.length])

  // Auto-scroll fullscreen chat to bottom (debounced with rAF)
  useEffect(() => {
    if (messages.length === 0 || !fullscreenChatScrollRef.current) return
    const el = fullscreenChatScrollRef.current
    const rafId = requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight
    })
    return () => cancelAnimationFrame(rafId)
  }, [messages.length])

  // Fullscreen handler for Desktop and Mobile
  const handleFullscreen = () => {
    const target = isMobile
      ? mobileRootRef.current || document.documentElement
      : playerContainerRef.current
    if (!target) return

    if (!document.fullscreenElement) {
      target.requestFullscreen().catch(() => {})
      if (isMobile && screen.orientation && (screen.orientation as any).lock) {
        ;(screen.orientation as any).lock('landscape').catch(() => {})
      }
    } else {
      document.exitFullscreen().catch(() => {})
      if (
        isMobile &&
        screen.orientation &&
        (screen.orientation as any).unlock
      ) {
        ;(screen.orientation as any).unlock()
      }
    }
  }

  // Handle Fullscreen Comment Send
  const handleSendFullscreenComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = fullscreenInputText.trim()
    if (!trimmed) return
    sendMessage(trimmed)
    setFullscreenInputText('')
  }

  // Handle Mobile Comment Send
  const handleSendMobileComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = mobileInputText.trim()
    if (!trimmed) return
    sendMessage(trimmed)
    setMobileInputText('')
  }

  // Handle Share Live Stream with dynamic frame capture
  const handleShare = async () => {
    try {
      const { captureVideoSnapshot, uploadLiveSnapshot } =
        await import('@/lib/live-snapshot')
      const videoEl = viewerVideoRef.current
      // prettier-ignore
      const snapshot = captureVideoSnapshot(videoEl, 1280, 720, 0.85, isMirrored)
      if (snapshot && stream?.id) {
        uploadLiveSnapshot(stream.id, snapshot).catch(() => {})
      }
    } catch {
      // Non-critical snapshot error
    }
    const shareUrl = `${window.location.origin}/live/${stream?.id}`
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: stream?.title || 'Live Streaming Toko',
          text: `Tonton live streaming ${stream?.title || ''} di Affiliate Gadget!`,
          url: shareUrl,
        })
        return
      } catch {
        // Fallback to clipboard jika modal ditutup atau error
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Ignore
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center text-white">
        <RefreshCw className="mb-4 h-10 w-10 animate-spin text-orange-500" />
        <p className="text-sm font-semibold">Memuat siaran langsung...</p>
      </div>
    )
  }

  if (error || !stream) {
    return (
      <div className="mx-auto my-16 max-w-md rounded-3xl border border-white/10 bg-slate-900 p-8 text-center text-white">
        <h3 className="mb-2 text-lg font-bold">Siaran Tidak Ditemukan</h3>
        <p className="mb-6 text-xs text-slate-400">
          {error || 'Tautan siaran tidak valid atau sudah kadaluarsa'}
        </p>
        <Link
          href="/"
          className="inline-flex rounded-xl bg-orange-500 px-6 py-2.5 text-xs font-bold text-white transition-all hover:bg-orange-600"
        >
          Kembali ke Beranda
        </Link>
      </div>
    )
  }

  // Render Video Box (Single Instance Provider to prevent LiveKit duplicate identity conflicts)
  const renderLiveVideo = (showOverlayControls = true) => {
    if (!isLive) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center bg-slate-950 p-6 text-center text-white">
          <Radio className="mb-3 h-12 w-12 animate-pulse text-slate-500" />
          <h3 className="text-base font-bold">
            {stream.status === 'ENDED'
              ? 'Siaran Telah Berakhir'
              : 'Siaran Belum Dimulai'}
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Host toko fisik akan kembali menyiarkan produk gadget pilihan
            segera.
          </p>
          <Link
            href="/"
            className="mt-4 rounded-xl bg-orange-500 px-5 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-orange-600"
          >
            Kembali ke Beranda
          </Link>
        </div>
      )
    }

    // Instant LCP Poster Image base layer with priority so LCP paints on frame 1
    return (
      <div className="relative h-full w-full overflow-hidden bg-slate-950">
        {stream.coverImage && (
          <Image
            src={stream.coverImage}
            alt={stream.title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 960px"
            className="object-cover"
          />
        )}
        <div className="relative z-10 h-full w-full">
          {isTokenLoading || !livekitToken ? (
            <div className="relative flex h-full min-h-[300px] w-full items-center justify-center">
              <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-orange-500/40 bg-orange-500/20 backdrop-blur-md">
                  <RefreshCw className="h-6 w-6 animate-spin text-orange-400" />
                </div>
                <p className="text-xs font-semibold tracking-wide text-white drop-shadow-md">
                  Menyambungkan ke siaran...
                </p>
              </div>
            </div>
          ) : (
            <LiveKitStreamPlayer
              serverUrl={livekitWsUrl}
              token={livekitToken}
              videoRefExternal={viewerVideoRef}
              onOrientationChange={setIsVerticalStream}
              onFullscreen={handleFullscreen}
              likeCount={likeCount}
              onSendLike={() => sendLike(1)}
              isMirrored={isMirrored}
              showControls={showOverlayControls}
              isStreamEnded={isEnded}
              isFullscreen={isFullscreen}
              coverImage={stream.coverImage}
            />
          )}
        </div>
      </div>
    )
  }

  // ===================================================================
  // 1. MOBILE VIEW: INSTAGRAM LIVE STYLE (Full-bleed 9:16 Portrait)
  // ===================================================================
  if (isMobile) {
    // Mode Mobile Miring / Landscape Fullscreen
    if (isLandscape || isFullscreen) {
      return (
        <div
          ref={mobileRootRef}
          role="region"
          aria-label="Siaran langsung layar penuh mobile"
          className="fixed inset-0 z-50 flex h-[100dvh] w-full select-none overflow-hidden bg-black text-white"
        >
          {/* Fullscreen Video Background */}
          <div className="absolute inset-0 z-0">{renderLiveVideo(false)}</div>
          <FloatingHeartsOverlay triggerCount={likeCount} />

          {/* Minimal Top Header on Mobile Landscape */}
          <div className="pointer-events-auto absolute left-3 top-3 z-30 flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-md bg-rose-600 px-2 py-0.5 text-[9px] font-extrabold uppercase text-white shadow-md">
              <span className="h-1.5 w-1.5 animate-ping rounded-full bg-white" />
              LIVE
            </span>
            <span className="rounded-md bg-black/50 px-2 py-0.5 text-[10px] text-white/80 backdrop-blur-md">
              👁 {viewerCount}
            </span>
            <span className="max-w-[120px] truncate text-xs font-bold text-white drop-shadow">
              {stream.store?.name}
            </span>
          </div>

          {/* Pinned Product Floating on Left Side (Mobile Landscape) */}
          {pinnedProduct && (
            <div className="pointer-events-auto absolute bottom-3 left-3 z-30 max-w-[280px] animate-in fade-in slide-in-from-bottom-2 sm:max-w-xs">
              <LiveProductPin product={pinnedProduct} isBroadcaster={false} />
            </div>
          )}

          {/* Floating Right Column for Comments & Like (Mobile Landscape) */}
          <div className="pointer-events-auto absolute bottom-3 right-3 top-3 z-30 flex w-72 flex-col justify-between rounded-2xl border border-white/15 bg-black/75 p-3 shadow-2xl backdrop-blur-md animate-in slide-in-from-right-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-bold text-white">
                Live Komentar
              </span>
              <button
                type="button"
                onClick={handleFullscreen}
                className="rounded-lg p-1 text-white/70 hover:bg-white/10 hover:text-white"
                title="Keluar Layar Penuh"
                aria-label="Keluar layar penuh"
              >
                <Minimize2 className="h-3.5 w-3.5" />
              </button>
            </div>

            <div
              ref={mobileChatScrollRef}
              className="flex-1 space-y-1.5 overflow-y-auto py-2 pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {messages.slice(-25).map((msg) => (
                <div
                  key={msg.id}
                  className="rounded-xl border border-white/5 bg-white/5 p-1.5 text-xs text-white"
                >
                  <span className="font-bold text-orange-400">
                    {msg.userName}:{' '}
                  </span>
                  <span className="break-words leading-tight text-white/90">
                    {msg.message}
                  </span>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleSendMobileComment}
              className="flex items-center gap-1.5 border-t border-white/10 pt-2"
            >
              <input
                type="text"
                value={mobileInputText}
                onChange={(e) => setMobileInputText(e.target.value)}
                placeholder="Komentar..."
                aria-label="Ketik komentar"
                className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white placeholder-white/50 outline-none focus:border-orange-500 focus:bg-white/15"
              />
              {mobileInputText.trim() && (
                <button
                  type="submit"
                  className="shrink-0 rounded-xl bg-orange-500 p-2 text-white transition-all hover:bg-orange-600 active:scale-95"
                  title="Kirim"
                  aria-label="Kirim komentar"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => sendLike(1)}
                className="shrink-0 rounded-xl border border-rose-500/40 bg-rose-500/25 p-2 text-rose-500 transition-all hover:bg-rose-500/35 active:scale-90"
                title="Kirim Suka"
                aria-label="Kirim suka"
              >
                <Heart className="h-3.5 w-3.5 fill-rose-500" />
              </button>
            </form>
          </div>
        </div>
      )
    }

    // Default Portrait Fullscreen (Instagram Live Style)
    return (
      <div
        ref={mobileRootRef}
        role="region"
        aria-label="Siaran langsung vertikal mobile"
        className="fixed inset-0 flex h-[100dvh] w-full select-none flex-col justify-between overflow-hidden bg-black text-white"
        style={{
          height: '100dvh',
          maxHeight: '-webkit-fill-available',
        }}
      >
        {/* Fullscreen Video Background */}
        <div className="absolute inset-0 z-0">{renderLiveVideo(false)}</div>
        <FloatingHeartsOverlay triggerCount={likeCount} />

        {/* Top Header Floating Card (Store info, viewers, LIVE badge, close button) */}
        <div className="pointer-events-auto relative z-30 flex items-center justify-between gap-2 p-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))]">
          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/60 py-1.5 pl-1.5 pr-3 shadow-lg backdrop-blur-md">
            <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-orange-500/50 bg-white">
              {stream.store?.logo ? (
                <img
                  src={stream.store.logo}
                  alt={stream.store.name || 'Toko'}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    ;(e.currentTarget as HTMLElement).style.display = 'none'
                  }}
                />
              ) : (
                <Store className="m-auto h-4 w-4 text-orange-500" />
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="max-w-[110px] truncate text-xs font-bold leading-tight text-white">
                  {stream.store?.name}
                </span>
                <span className="py-0.2 rounded bg-rose-600 px-1 text-[8px] font-extrabold uppercase tracking-wider text-white">
                  LIVE
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-medium text-white/80">
                <span className="flex items-center gap-1 rounded-md bg-black/40 px-1.5 py-0.5 backdrop-blur-sm">
                  👁 {viewerCount}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1 rounded-full border border-white/10 bg-black/50 p-2 text-white/90 backdrop-blur-md transition-all hover:bg-black/70 active:scale-90"
              title="Bagikan Siaran"
              aria-label="Bagikan siaran"
            >
              {copied ? (
                <CheckCheck className="h-4 w-4 text-emerald-400" />
              ) : (
                <Share2 className="h-4 w-4 text-white" />
              )}
            </button>
            <Link
              href="/"
              className="rounded-full border border-white/10 bg-black/50 p-2 text-white/90 backdrop-blur-md transition-all hover:bg-black/70 active:scale-90"
              title="Tutup Siaran"
              aria-label="Tutup siaran"
            >
              <X className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Instagram Live Bottom Section */}
        <div
          className="pointer-events-none relative z-30 flex flex-col justify-end gap-2.5 p-3 pb-6"
          style={{
            transform:
              keyboardInset > 0 ? `translateY(-${keyboardInset}px)` : undefined,
            paddingBottom:
              keyboardInset > 0
                ? 10
                : 'max(1.25rem, env(safe-area-inset-bottom, 16px))',
          }}
        >
          {/* Floating Comments Stream */}
          <div
            ref={mobileChatScrollRef}
            className="pointer-events-auto flex max-h-[46dvh] flex-col gap-1.5 overflow-y-auto pr-14 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{
              maskImage:
                messages.length > 3
                  ? 'linear-gradient(to bottom, transparent 0%, black 12%)'
                  : undefined,
              WebkitMaskImage:
                messages.length > 3
                  ? 'linear-gradient(to bottom, transparent 0%, black 12%)'
                  : undefined,
            }}
          >
            {messages.slice(-25).map((msg) => (
              <div
                key={msg.id}
                className="flex max-w-[90%] items-start gap-1.5 self-start rounded-2xl border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-white shadow-sm backdrop-blur-md"
              >
                <span className="shrink-0 font-bold text-orange-400">
                  {msg.userName}:
                </span>
                <span className="break-words leading-snug text-white/95">
                  {msg.message}
                </span>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="self-start rounded-full bg-black/40 px-3 py-1 text-[11px] italic text-white/70 backdrop-blur-sm">
                Kirim sapaan pertama ke host siaran...
              </div>
            )}
          </div>

          {/* Pinned Product Floating Card on Mobile */}
          {pinnedProduct && !isEnded && (
            <div className="pointer-events-auto relative flex max-w-[62%] items-center justify-between gap-2 self-start rounded-2xl border border-orange-500/40 bg-white/95 p-2 text-slate-900 shadow-2xl shadow-black/20 backdrop-blur-md animate-in slide-in-from-bottom-2 sm:max-w-[280px]">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  {pinnedProduct.productImage ? (
                    <img
                      src={pinnedProduct.productImage}
                      alt={pinnedProduct.productTitle || 'Produk'}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        ;(e.currentTarget as HTMLElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <ShoppingBag className="h-5 w-5 text-orange-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-xs font-bold text-slate-900 sm:text-sm"
                    title={pinnedProduct.productTitle}
                  >
                    {pinnedProduct.productTitle}
                  </p>
                  {pinnedProduct.discountPrice &&
                  pinnedProduct.discountPrice <
                    (pinnedProduct.originalPrice ||
                      pinnedProduct.productPrice ||
                      0) ? (
                    <div className="space-y-0.5">
                      <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-extrabold text-rose-600">
                        🔥 Diskon Sematan Live (1x checkout)
                      </span>
                      <div className="flex flex-wrap items-baseline gap-1">
                        <p className="text-xs font-extrabold text-orange-600 sm:text-sm">
                          Rp{' '}
                          {pinnedProduct.discountPrice.toLocaleString('id-ID')}
                        </p>
                        <p className="text-[10px] text-slate-400 line-through">
                          Rp{' '}
                          {(
                            pinnedProduct.originalPrice ||
                            pinnedProduct.productPrice
                          )?.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-0.5 text-xs font-extrabold text-orange-600 sm:text-sm">
                      Rp {pinnedProduct.productPrice?.toLocaleString('id-ID')}
                    </p>
                  )}
                </div>
              </div>
              <Link
                href={
                  pinnedProduct.dealToken
                    ? `/gadget/${pinnedProduct.productId}?dealToken=${pinnedProduct.dealToken}`
                    : `/gadget/${pinnedProduct.productId}`
                }
                target="_blank"
                className="shrink-0 rounded-xl bg-orange-500 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition-all hover:bg-orange-600 active:scale-95"
              >
                Beli
              </Link>
            </div>
          )}

          {/* Action Bar Paling Bawah */}
          <div className="pointer-events-auto mt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsProductDrawerOpen(true)}
              className="relative shrink-0 rounded-full border border-white/20 bg-black/60 p-2.5 text-white backdrop-blur-md transition-all hover:bg-black/80 active:scale-90"
              title="Lihat Produk Toko"
              aria-label="Lihat produk toko"
            >
              <ShoppingBag className="h-4 w-4 text-orange-400" />
              {stream.featuredProducts &&
                stream.featuredProducts.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-black text-white">
                    {stream.featuredProducts.length}
                  </span>
                )}
            </button>

            {/* Pill Input Comment Form */}
            <form
              onSubmit={handleSendMobileComment}
              className="flex flex-1 items-center rounded-full border border-white/20 bg-black/60 px-3.5 py-2 backdrop-blur-md transition-colors focus-within:border-orange-500"
            >
              <input
                type="text"
                value={mobileInputText}
                onChange={(e) => setMobileInputText(e.target.value)}
                onFocus={() => {
                  if (typeof window !== 'undefined') {
                    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
                  }
                }}
                placeholder="Tambahkan komentar..."
                aria-label="Tambahkan komentar"
                enterKeyHint="send"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="sentences"
                style={{ fontSize: 16, outline: 'none', boxShadow: 'none' }}
                className="w-full bg-transparent text-white placeholder-white/60 outline-none focus:outline-none focus:ring-0"
              />
              {mobileInputText.trim() && (
                <button
                  type="submit"
                  aria-label="Kirim komentar"
                  className="ml-1.5 shrink-0 text-orange-400 transition-all hover:text-orange-300 active:scale-90"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              )}
            </form>

            {/* Heart / Like Button */}
            <button
              type="button"
              onClick={() => sendLike(1)}
              className="shrink-0 rounded-full border border-rose-500/40 bg-rose-500/25 p-2.5 text-rose-500 shadow-lg backdrop-blur-md transition-all hover:bg-rose-500/35 active:scale-75"
              title="Kirim Suka"
              aria-label="Kirim suka"
            >
              <Heart className="h-4 w-4 fill-rose-500" />
            </button>

            {/* Fullscreen / Rotate Button */}
            <button
              type="button"
              onClick={handleFullscreen}
              className="shrink-0 rounded-full border border-white/20 bg-black/60 p-2.5 text-white backdrop-blur-md transition-all hover:bg-black/80 active:scale-90"
              title="Layar Penuh / Miring"
              aria-label="Layar penuh atau miring"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Instagram Shopping Bottom Sheet Drawer (Mobile) */}
        {isProductDrawerOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div
              className="fixed inset-0"
              onClick={() => setIsProductDrawerOpen(false)}
            />
            <div className="relative z-10 flex max-h-[75vh] w-full flex-col rounded-t-3xl border-t border-slate-200 bg-white p-4 text-slate-900 shadow-2xl duration-300 animate-in slide-in-from-bottom">
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300" />
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-orange-500" />
                  <h4 className="text-sm font-bold text-slate-900">
                    Produk Siaran Langsung
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProductDrawerOpen(false)}
                  aria-label="Tutup daftar produk"
                  className="rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="scrollbar-thin mt-3 flex-1 space-y-2.5 overflow-y-auto pr-0.5">
                {!stream.featuredProducts ||
                stream.featuredProducts.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Belum ada produk yang disorot pada siaran ini.
                  </div>
                ) : (
                  stream.featuredProducts.map((p) => (
                    <div
                      key={p.id}
                      className="shadow-xs flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white p-2.5 transition-all hover:bg-slate-50/80"
                    >
                      <div className="flex min-w-0 items-center gap-3 pr-2">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                          {p.images[0] ? (
                            <Image
                              src={p.images[0]}
                              alt={p.name}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <ShoppingBag className="m-auto h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-900">
                            {p.name}
                          </p>
                          {p.liveDeal &&
                          p.liveDeal.discountPrice <
                            (p.liveDeal.originalPrice || p.price) ? (
                            <div className="mt-0.5">
                              <span className="py-0.2 inline-block rounded bg-orange-100 px-1.5 text-[9px] font-bold text-orange-700">
                                Diskon Live (1x checkout)
                              </span>
                              <div className="flex items-baseline gap-1.5">
                                <p className="text-xs font-extrabold text-orange-600">
                                  Rp{' '}
                                  {p.liveDeal.discountPrice.toLocaleString(
                                    'id-ID'
                                  )}
                                </p>
                                <p className="text-[10px] text-slate-400 line-through">
                                  Rp{' '}
                                  {(
                                    p.liveDeal.originalPrice || p.price
                                  ).toLocaleString('id-ID')}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs font-extrabold text-orange-600">
                              Rp {p.price.toLocaleString('id-ID')}
                            </p>
                          )}
                        </div>
                      </div>
                      <Link
                        href={
                          p.liveDeal?.dealToken
                            ? `/gadget/${p.id}?dealToken=${p.liveDeal.dealToken}`
                            : `/gadget/${p.id}`
                        }
                        target="_blank"
                        className="shrink-0 rounded-xl bg-orange-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition-all hover:bg-orange-600 active:scale-95"
                      >
                        Beli
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ===================================================================
  // 2. DESKTOP VIEW: YOUTUBE LIVE STYLE (Widescreen 16:9 + Chat Sidebar)
  // ===================================================================
  return (
    <div className="mx-auto w-full max-w-[1440px] xl:max-w-[1536px]">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Kolom Kiri: Player 16:9 + Info Toko + Deskripsi + Rekomendasi Produk */}
        <div className="space-y-4 lg:col-span-8 xl:col-span-8">
          {/* Bento Screen Player Wrapper with 16:9 Aspect Ratio */}
          <div
            ref={playerContainerRef}
            className={`group relative flex w-full flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-slate-950 shadow-xl transition-all dark:border-slate-800 ${
              isVerticalStream && !isFullscreen
                ? 'aspect-video h-[640px] max-h-[calc(100vh-160px)] w-full'
                : 'aspect-video w-full'
            }`}
          >
            {/* Top Bar Floating Status on Desktop Player */}
            <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent p-4">
              <div className="pointer-events-auto flex items-center gap-2.5">
                <span className="flex items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-white shadow-md">
                  <span className="h-2 w-2 animate-ping rounded-full bg-white" />
                  LIVE
                </span>

                <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/80 px-3 py-1 text-xs font-semibold text-white shadow-md backdrop-blur-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>{viewerCount} Ditonton</span>
                </span>
              </div>

              <div className="pointer-events-auto flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/80 px-3.5 py-1.5 text-xs text-white shadow-md backdrop-blur-md transition-all hover:bg-slate-800"
                  title="Bagikan Tautan Siaran"
                  aria-label="Bagikan tautan siaran"
                >
                  {copied ? (
                    <>
                      <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="font-semibold text-emerald-400">
                        Tersalin!
                      </span>
                    </>
                  ) : (
                    <>
                      <Share2 className="h-3.5 w-3.5" />
                      <span>Bagikan</span>
                    </>
                  )}
                </button>

                {stream.store && (
                  <Link
                    href={`/toko/${stream.store.slug}`}
                    target="_blank"
                    className="flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/80 px-3.5 py-1.5 text-xs text-white shadow-md backdrop-blur-md transition-all hover:bg-slate-800"
                  >
                    <Store className="h-3.5 w-3.5 text-orange-400" />
                    <span className="max-w-[130px] truncate font-medium">
                      {stream.store.name}
                    </span>
                  </Link>
                )}
              </div>
            </div>

            {/* Video Area (Single LiveKit Player) */}
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
              {renderLiveVideo(true)}
            </div>

            {/* Floating Pinned Product on Desktop Video Player */}
            {pinnedProduct && !isEnded && (
              <div className="pointer-events-auto absolute bottom-4 left-4 z-30 max-w-[calc(100%-2rem)] animate-in fade-in slide-in-from-bottom-2 sm:max-w-xs md:max-w-sm">
                <LiveProductPin product={pinnedProduct} isBroadcaster={false} />
              </div>
            )}

            {/* Fullscreen Floating Comments Column on the Right */}
            {isFullscreen && (
              <>
                {showFullscreenChat ? (
                  <div className="pointer-events-auto absolute bottom-6 right-4 top-16 z-40 flex w-80 max-w-[35vw] flex-col justify-between rounded-2xl border border-white/15 bg-black/75 p-3.5 shadow-2xl backdrop-blur-md animate-in slide-in-from-right-4">
                    {/* Header Live Chat */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                        <span className="text-xs font-bold text-white">
                          Live Chat
                        </span>
                        <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] text-white/70">
                          👁 {viewerCount}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setShowFullscreenChat(false)}
                          className="rounded-lg p-1 text-white/70 hover:bg-white/10 hover:text-white"
                          title="Sembunyikan Chat"
                          aria-label="Sembunyikan chat"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleFullscreen}
                          className="rounded-lg p-1 text-white/70 hover:bg-white/10 hover:text-white"
                          title="Keluar Layar Penuh"
                          aria-label="Keluar layar penuh"
                        >
                          <Minimize2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Messages stream */}
                    <div
                      ref={fullscreenChatScrollRef}
                      className="flex-1 space-y-2 overflow-y-auto py-2 pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                      {messages.slice(-30).map((msg) => (
                        <div
                          key={msg.id}
                          className="rounded-xl border border-white/5 bg-white/5 p-2 text-xs text-white backdrop-blur-sm"
                        >
                          <span className="font-bold text-orange-400">
                            {msg.userName}:{' '}
                          </span>
                          <span className="break-words text-white/95">
                            {msg.message}
                          </span>
                        </div>
                      ))}
                      {messages.length === 0 && (
                        <div className="py-6 text-center text-xs italic text-white/50">
                          Belum ada komentar siaran...
                        </div>
                      )}
                    </div>

                    {/* Chat input form & Like button */}
                    <form
                      onSubmit={handleSendFullscreenComment}
                      className="flex items-center gap-1.5 border-t border-white/10 pt-2"
                    >
                      <input
                        type="text"
                        value={fullscreenInputText}
                        onChange={(e) => setFullscreenInputText(e.target.value)}
                        placeholder="Kirim komentar..."
                        aria-label="Ketik komentar"
                        className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white placeholder-white/50 outline-none focus:border-orange-500 focus:bg-white/15"
                      />
                      {fullscreenInputText.trim() && (
                        <button
                          type="submit"
                          aria-label="Kirim komentar"
                          className="shrink-0 rounded-xl bg-orange-500 p-2 text-white transition-all hover:bg-orange-600 active:scale-95"
                          title="Kirim"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => sendLike(1)}
                        className="shrink-0 rounded-xl border border-rose-500/40 bg-rose-500/25 p-2 text-rose-500 transition-all hover:bg-rose-500/35 active:scale-90"
                        title="Kirim Suka"
                        aria-label="Kirim suka"
                      >
                        <Heart className="h-3.5 w-3.5 fill-rose-500" />
                      </button>
                    </form>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowFullscreenChat(true)}
                    aria-label="Buka live chat"
                    className="pointer-events-auto absolute bottom-6 right-4 z-40 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/70 px-3.5 py-2 text-xs font-bold text-white shadow-xl backdrop-blur-md hover:bg-black/90"
                  >
                    <span>💬 Buka Chat</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Title & Channel Bar (YouTube Style) */}
          <div className="space-y-3">
            <h1 className="text-xl font-bold leading-tight text-slate-900 dark:text-white lg:text-2xl">
              {stream.title}
            </h1>

            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4 dark:border-slate-800">
              {/* Channel / Store Profile */}
              {stream.store && (
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-white ring-2 ring-orange-500/20 dark:border-slate-700 dark:bg-slate-800">
                    {stream.store.logo ? (
                      <img
                        src={stream.store.logo}
                        alt={stream.store.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          ;(e.currentTarget as HTMLElement).style.display =
                            'none'
                        }}
                      />
                    ) : (
                      <Store className="m-auto h-6 w-6 text-orange-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {stream.store.name}
                      </h3>
                      <span className="flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="h-3 w-3" />
                        PT Terverifikasi
                      </span>
                    </div>
                    <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      <span>{stream.store.city || 'Indonesia'}</span>
                      {stream.store.companyName && (
                        <span className="font-mono text-slate-400">
                          ({stream.store.companyName})
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="ml-2 flex items-center gap-2">
                    <Link
                      href={`/toko/${stream.store.slug}`}
                      target="_blank"
                      className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                    >
                      Kunjungi Toko
                    </Link>
                    {stream.store.whatsapp && (
                      <a
                        href={`https://wa.me/${stream.store.whatsapp.replace(/\D/g, '')}?text=Halo%20Admin%20${encodeURIComponent(stream.store.name)},%20saya%20tertarik%20dengan%20produk%20di%20Live%20Streaming`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-700"
                      >
                        Chat WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Action Stats Pill */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <Radio className="h-3.5 w-3.5 animate-pulse text-rose-500" />
                  <span>{viewerCount} Menonton</span>
                </div>
                <button
                  onClick={() => sendLike(1)}
                  aria-label="Kirim suka"
                  className="flex items-center gap-1.5 rounded-full border border-rose-200/80 bg-rose-50 px-3.5 py-1.5 text-xs font-bold text-rose-600 transition-all hover:bg-rose-100 active:scale-95 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
                >
                  <Heart className="h-3.5 w-3.5 fill-rose-500" />
                  <span>{likeCount}</span>
                </button>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      navigator.clipboard.writeText(window.location.href)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }
                  }}
                  aria-label="Bagikan siaran"
                  className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>{copied ? 'Tersalin!' : 'Bagikan'}</span>
                </button>
              </div>
            </div>

            {/* Pinned Product Horizontal Banner on Desktop */}
            {pinnedProduct && (
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-orange-500/40 bg-gradient-to-r from-orange-50/80 via-white to-amber-50/60 p-4 shadow-sm dark:border-orange-500/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/80">
                <div className="flex items-center gap-3.5">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-orange-200 bg-white dark:border-slate-700">
                    {pinnedProduct.productImage ? (
                      <Image
                        src={pinnedProduct.productImage}
                        alt={pinnedProduct.productTitle || 'Produk'}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <ShoppingBag className="m-auto h-6 w-6 text-orange-500" />
                    )}
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2 py-0.5 text-[10px] font-extrabold uppercase text-white shadow-sm">
                      <Zap className="h-2.5 w-2.5 fill-white" />
                      🔥 Diskon Spesial Sematan Live • 1x Checkout
                    </span>
                    <h4 className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                      {pinnedProduct.productTitle}
                    </h4>
                    {pinnedProduct.discountPrice &&
                    pinnedProduct.discountPrice <
                      (pinnedProduct.originalPrice ||
                        pinnedProduct.productPrice ||
                        0) ? (
                      <div className="flex items-baseline gap-2">
                        <p className="text-base font-extrabold text-orange-600 dark:text-orange-400">
                          Rp{' '}
                          {pinnedProduct.discountPrice.toLocaleString('id-ID')}
                        </p>
                        <p className="text-xs text-slate-400 line-through">
                          Rp{' '}
                          {(
                            pinnedProduct.originalPrice ||
                            pinnedProduct.productPrice
                          )?.toLocaleString('id-ID')}
                        </p>
                      </div>
                    ) : (
                      <p className="text-base font-extrabold text-orange-600 dark:text-orange-400">
                        Rp {pinnedProduct.productPrice?.toLocaleString('id-ID')}
                      </p>
                    )}
                  </div>
                </div>
                <Link
                  href={
                    pinnedProduct.dealToken
                      ? `/gadget/${pinnedProduct.productId}?dealToken=${pinnedProduct.dealToken}`
                      : `/gadget/${pinnedProduct.productId}`
                  }
                  target="_blank"
                  className="shrink-0 rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-orange-600 active:scale-95"
                >
                  Beli Sekarang
                </Link>
              </div>
            )}

            {/* Description Box (YouTube Style) */}
            <div className="space-y-2 rounded-2xl bg-slate-100/90 p-4 text-xs text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
              <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <span>Siaran Langsung Toko Cabang Resmi</span>
                <span>•</span>
                <span className="text-orange-600 dark:text-orange-400">
                  Garansi 30 Hari Ganti Baru
                </span>
              </div>
              <p className="whitespace-pre-line leading-relaxed">
                {stream.description ||
                  'Host toko menyiarkan unboxing, demo performa, dan konsultasi gadget terverifikasi secara langsung.'}
              </p>
            </div>

            {/* Featured Products Shelf (Etalase Produk Toko YouTube Style) */}
            {stream.featuredProducts && stream.featuredProducts.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                    <ShoppingBag className="h-4 w-4 text-orange-500" />
                    <span>
                      Etalase Produk Siaran Ini (
                      {stream.featuredProducts.length})
                    </span>
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {stream.featuredProducts.map((p) => (
                    <div
                      key={p.id}
                      className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div className="relative mb-2 aspect-square w-full overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-800">
                        {p.images[0] ? (
                          <Image
                            src={p.images[0]}
                            alt={p.name}
                            fill
                            sizes="(max-width: 768px) 50vw, 200px"
                            className="object-cover"
                          />
                        ) : (
                          <ShoppingBag className="m-auto h-8 w-8 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <h5 className="line-clamp-1 text-xs font-bold text-slate-900 dark:text-white">
                          {p.name}
                        </h5>
                        {p.liveDeal &&
                        p.liveDeal.discountPrice <
                          (p.liveDeal.originalPrice || p.price) ? (
                          <div className="mt-1">
                            <span className="inline-block rounded bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold text-orange-700 dark:bg-orange-950/60 dark:text-orange-300">
                              Diskon Live (1x checkout)
                            </span>
                            <div className="flex items-baseline gap-1.5">
                              <p className="text-sm font-extrabold text-orange-600 dark:text-orange-400">
                                Rp{' '}
                                {p.liveDeal.discountPrice.toLocaleString(
                                  'id-ID'
                                )}
                              </p>
                              <p className="text-[10px] text-slate-400 line-through">
                                Rp{' '}
                                {(
                                  p.liveDeal.originalPrice || p.price
                                ).toLocaleString('id-ID')}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-1 text-sm font-extrabold text-orange-600 dark:text-orange-400">
                            Rp {p.price.toLocaleString('id-ID')}
                          </p>
                        )}
                      </div>
                      <Link
                        href={
                          p.liveDeal?.dealToken
                            ? `/gadget/${p.id}?dealToken=${p.liveDeal.dealToken}`
                            : `/gadget/${p.id}`
                        }
                        target="_blank"
                        className="mt-2.5 rounded-xl bg-slate-100 py-1.5 text-center text-xs font-bold text-slate-800 transition-all hover:bg-orange-500 hover:text-white dark:bg-slate-800 dark:text-slate-200"
                      >
                        Lihat Gadget
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: YouTube Live Chat Sidebar */}
        <div className="lg:col-span-4 xl:col-span-4">
          <div className="sticky top-24 h-[calc(100vh-130px)] max-h-[740px] min-h-[580px]">
            <LiveChatPanel
              messages={messages}
              onSendMessage={sendMessage}
              onSendLike={sendLike}
              likeCount={likeCount}
              isBroadcaster={false}
              currentUserName={session?.user?.name || undefined}
              isConnected={isWsConnected}
              className="h-full rounded-2xl border border-slate-200/80 shadow-md dark:border-slate-800"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
