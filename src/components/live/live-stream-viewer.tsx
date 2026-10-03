'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
} from '@livekit/components-react'
import { Track } from 'livekit-client'
import {
  Radio,
  ShoppingBag,
  Store,
  MapPin,
  Volume2,
  VolumeX,
  Maximize2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Zap,
  Heart,
  X,
  Send,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useLiveKitToken } from '@/hooks/use-livekit-token'
import { useLiveChat } from '@/hooks/use-live-chat'
import { LiveStreamStatusBar } from './live-stream-status-bar'
import { LiveChatPanel } from './live-chat-panel'
import { FloatingHeartsOverlay } from './floating-hearts'

interface StoreInfo {
  id: string
  name: string
  companyName: string | null
  slug: string
  logo: string | null
  city: string | null
  whatsapp: string | null
}

interface ProductHighlight {
  id: string
  name: string
  price: number
  originalPrice?: number | null
  images: string[]
  brand: string | null
  stock: number
  rating?: number | null
  warrantyDays?: number | null
}

interface LiveStreamDetail {
  id: string
  title: string
  description: string | null
  coverImage: string | null
  status: 'SCHEDULED' | 'LIVE' | 'ENDED'
  scheduledAt: string | null
  startedAt: string | null
  endedAt: string | null
  viewerCount: number
  store: StoreInfo | null
  featuredProducts?: ProductHighlight[]
}

// Sub-component for rendering video within LiveKit context
function LiveKitSubscriberVideo({
  stream,
  onFullscreen,
  likeCount = 0,
  onSendLike,
  isMirrored = false,
  showControls = true,
}: {
  stream: LiveStreamDetail
  onFullscreen?: () => void
  likeCount?: number
  onSendLike?: () => void
  isMirrored?: boolean
  showControls?: boolean
}) {
  const [isMuted, setIsMuted] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Track camera publications from remote host
  const tracks = useTracks([Track.Source.Camera])
  const hostCameraTrack = tracks.find(
    (t) => t.publication.source === Track.Source.Camera
  )

  useEffect(() => {
    if (!hostCameraTrack?.publication?.track || !videoRef.current) return

    const track = hostCameraTrack.publication.track
    track.attach(videoRef.current)

    return () => {
      if (videoRef.current) {
        track.detach(videoRef.current)
      }
    }
  }, [hostCameraTrack])

  return (
    <div
      onDoubleClick={onSendLike}
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-slate-950"
    >
      {hostCameraTrack ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isMuted}
          className="h-full w-full object-cover transition-transform duration-300"
          style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 p-6 text-center text-slate-400">
          <div className="relative">
            <Radio className="h-14 w-14 animate-pulse text-orange-500" />
            <span className="absolute -right-1 -top-1 h-3 w-3 animate-ping rounded-full bg-orange-400" />
          </div>
          <h4 className="text-base font-bold text-white">
            Menghubungkan ke Host Toko...
          </h4>
          <p className="max-w-xs text-xs text-slate-400">
            Siaran sedang berlangsung. Menunggu sinyal video dari kamera toko
            cabang.
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
            >
              <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
            </button>
          )}

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="cursor-pointer rounded-full border border-white/10 bg-slate-900/80 p-2.5 text-white shadow-lg backdrop-blur-md transition-all hover:bg-slate-800 active:scale-90"
            title={isMuted ? 'Nyalakan Suara' : 'Matikan Suara'}
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
              title="Layar Penuh"
            >
              <Maximize2 className="h-4 w-4 text-white" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function LiveStreamViewer({ streamId }: { streamId: string }) {
  const { data: session } = useSession()
  const [stream, setStream] = useState<LiveStreamDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Mobile IG Live states
  const [mobileInputText, setMobileInputText] = useState('')
  const [isProductDrawerOpen, setIsProductDrawerOpen] = useState(false)
  const mobileChatScrollRef = useRef<HTMLDivElement>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)

  // 1. Fetch Stream Metadata
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
    if (streamId) {
      fetchStreamData()
    }
  }, [streamId])

  // 2. LiveKit Viewer Token
  const isLive = stream?.status === 'LIVE'
  const {
    token: livekitToken,
    wsUrl: livekitWsUrl,
    loading: isTokenLoading,
  } = useLiveKitToken(streamId, 'viewer')

  // 3. WebSocket Real-time Chat, Mirror & Pin Hook
  const {
    messages,
    viewerCount,
    pinnedProduct,
    isConnected: isWsConnected,
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

  // Auto-scroll mobile comments stream to bottom
  useEffect(() => {
    if (mobileChatScrollRef.current) {
      mobileChatScrollRef.current.scrollTop =
        mobileChatScrollRef.current.scrollHeight
    }
  }, [messages])

  // Fullscreen handler for Desktop
  const handleFullscreen = () => {
    if (!playerContainerRef.current) return
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  // Handle Mobile Comment Send
  const handleSendMobileComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = mobileInputText.trim()
    if (!trimmed) return
    sendMessage(trimmed)
    setMobileInputText('')
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
          href="/live"
          className="inline-flex rounded-xl bg-orange-500 px-6 py-2.5 text-xs font-bold text-white transition-all hover:bg-orange-600"
        >
          Lihat Semua Live Streaming
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* =================================================================== */}
      {/* 1. MOBILE VIEW: INSTAGRAM LIVE STYLE (Full-bleed 9:16 Portrait)     */}
      {/* =================================================================== */}
      <div className="relative flex h-[100dvh] w-full select-none flex-col justify-between overflow-hidden bg-black text-white md:hidden">
        {/* Fullscreen Video Stream Background */}
        <div className="absolute inset-0 z-0">
          {isLive ? (
            isTokenLoading || !livekitToken ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-slate-950 text-slate-400">
                <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
                <p className="text-xs">Menyiapkan saluran video live...</p>
              </div>
            ) : (
              <LiveKitRoom
                serverUrl={livekitWsUrl}
                token={livekitToken}
                connect={true}
                video={false}
                audio={false}
                className="h-full w-full"
              >
                <RoomAudioRenderer />
                <LiveKitSubscriberVideo
                  stream={stream}
                  likeCount={likeCount}
                  onSendLike={() => sendLike(1)}
                  isMirrored={isMirrored}
                  showControls={false}
                />
              </LiveKitRoom>
            )
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-slate-950 p-6 text-center text-white">
              <Radio className="mb-3 h-12 w-12 animate-pulse text-slate-500" />
              <h3 className="text-base font-bold">
                {stream.status === 'ENDED'
                  ? 'Siaran Telah Berakhir'
                  : 'Siaran Belum Dimulai'}
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Host toko sedang offline.
              </p>
              <Link
                href="/gadget"
                className="mt-4 rounded-xl bg-orange-500 px-5 py-2 text-xs font-bold text-white"
              >
                Buka Katalog Toko
              </Link>
            </div>
          )}
        </div>

        {/* Top & Bottom Soft Vignette Gradient Overlays */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-32 bg-gradient-to-b from-black/80 via-black/30 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-80 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />

        {/* Floating Hearts Overlay Canvas */}
        <FloatingHeartsOverlay triggerCount={likeCount} />

        {/* Instagram Live Top Floating Header Bar */}
        <div className="pointer-events-auto relative z-30 flex items-center justify-between p-3.5 pt-4">
          <div className="flex items-center gap-2.5">
            {stream.store && (
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-black p-0.5 ring-2 ring-orange-500">
                {stream.store.logo ? (
                  <Image
                    src={stream.store.logo}
                    alt={stream.store.name}
                    fill
                    className="rounded-full object-cover"
                  />
                ) : (
                  <Store className="m-auto h-5 w-5 text-orange-400" />
                )}
              </div>
            )}
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="max-w-[130px] truncate text-xs font-bold text-white drop-shadow-sm">
                  {stream.store?.name || 'Toko Cabang'}
                </span>
                <span className="flex items-center gap-1 rounded-md bg-rose-600 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white shadow-md">
                  <span className="h-1.5 w-1.5 animate-ping rounded-full bg-white" />
                  LIVE
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-medium text-white/80">
                <span className="backdrop-blur-xs flex items-center gap-1 rounded-md bg-black/40 px-1.5 py-0.5">
                  👁 {viewerCount}
                </span>
                <span className="text-white/60">•</span>
                <span className="font-semibold text-emerald-400">
                  Garansi 30 Hari
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/live"
              className="rounded-full border border-white/10 bg-black/50 p-2 text-white/90 backdrop-blur-md transition-all hover:bg-black/70 active:scale-90"
              title="Tutup Siaran"
            >
              <X className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Instagram Live Bottom Section (Comments Stream, Pinned Product, Input Bar) */}
        <div className="pointer-events-none relative z-30 flex flex-col justify-end gap-2.5 p-3 pb-6">
          {/* Floating Comments Stream (scrolling upwards over the video) */}
          <div
            ref={mobileChatScrollRef}
            className="scrollbar-none pointer-events-auto flex max-h-[175px] flex-col gap-1.5 overflow-y-auto pr-14"
            style={{
              maskImage:
                'linear-gradient(to bottom, transparent 0%, black 20%)',
              WebkitMaskImage:
                'linear-gradient(to bottom, transparent 0%, black 20%)',
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
              <div className="backdrop-blur-xs self-start rounded-full bg-black/40 px-3 py-1 text-[11px] italic text-white/70">
                Kirim sapaan pertama ke host siaran...
              </div>
            )}
          </div>

          {/* Pinned Product Floating Card on Mobile (Rekomendasi Barang di Bawah Layar) */}
          {pinnedProduct && (
            <div className="pointer-events-auto relative flex items-center justify-between gap-3 rounded-2xl border border-orange-500/50 bg-slate-950/90 p-2.5 text-white shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-orange-400/40 bg-white">
                  {pinnedProduct.productImage ? (
                    <Image
                      src={pinnedProduct.productImage}
                      alt={pinnedProduct.productTitle || 'Produk'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <ShoppingBag className="m-auto h-5 w-5 text-orange-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-0.5 rounded bg-orange-500 px-1 py-0.5 text-[8px] font-extrabold uppercase text-white">
                    <Zap className="h-2 w-2 fill-white" />
                    Disematkan Host
                  </span>
                  <p className="mt-0.5 line-clamp-1 truncate text-xs font-bold text-white">
                    {pinnedProduct.productTitle}
                  </p>
                  <p className="text-xs font-extrabold text-orange-400">
                    Rp {pinnedProduct.productPrice?.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
              <Link
                href={`/gadget/${pinnedProduct.productId}`}
                target="_blank"
                className="shrink-0 rounded-xl bg-orange-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-md transition-all hover:bg-orange-600 active:scale-95"
              >
                Beli
              </Link>
            </div>
          )}

          {/* Action Bar Paling Bawah (Shopping Bag, Comment Input, Hearts Button) */}
          <div className="pointer-events-auto mt-1 flex items-center gap-2">
            {/* Shopping Bag Button (Buka Bottom Sheet Katalog Toko) */}
            <button
              type="button"
              onClick={() => setIsProductDrawerOpen(true)}
              className="relative shrink-0 rounded-full border border-white/20 bg-black/60 p-2.5 text-white backdrop-blur-md transition-all hover:bg-black/80 active:scale-90"
              title="Lihat Produk Toko"
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
                placeholder="Tambahkan komentar..."
                className="focus:outline-hidden w-full bg-transparent text-xs text-white placeholder-white/60"
              />
              {mobileInputText.trim() && (
                <button
                  type="submit"
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
            >
              <Heart className="h-4 w-4 fill-rose-500" />
            </button>
          </div>
        </div>

        {/* Instagram Shopping Bottom Sheet Drawer (Mobile) */}
        {isProductDrawerOpen && (
          <div className="backdrop-blur-xs fixed inset-0 z-50 flex flex-col justify-end bg-black/60 animate-in fade-in">
            <div
              className="fixed inset-0"
              onClick={() => setIsProductDrawerOpen(false)}
            />
            <div className="relative z-10 flex max-h-[70vh] w-full flex-col rounded-t-3xl border-t border-white/10 bg-slate-900 p-4 text-white shadow-2xl duration-300 animate-in slide-in-from-bottom">
              <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-slate-700" />
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-orange-400" />
                  <h4 className="text-sm font-bold">Produk Siaran Langsung</h4>
                </div>
                <button
                  onClick={() => setIsProductDrawerOpen(false)}
                  className="rounded-full bg-slate-800 p-1.5 text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="scrollbar-thin mt-3 flex-1 space-y-2.5 overflow-y-auto">
                {!stream.featuredProducts ||
                stream.featuredProducts.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Belum ada produk yang disorot pada siaran ini.
                  </div>
                ) : (
                  stream.featuredProducts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-800/60 p-2.5 transition-all"
                    >
                      <div className="flex min-w-0 items-center gap-3 pr-2">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
                          {p.images[0] ? (
                            <Image
                              src={p.images[0]}
                              alt={p.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <ShoppingBag className="m-auto h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-white">
                            {p.name}
                          </p>
                          <p className="text-xs font-bold text-orange-400">
                            Rp {p.price.toLocaleString('id-ID')}
                          </p>
                          <span className="text-[9px] font-medium text-emerald-400">
                            Garansi 30 Hari
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/gadget/${p.id}`}
                        target="_blank"
                        className="shrink-0 rounded-xl bg-orange-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-md active:scale-95"
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

      {/* =================================================================== */}
      {/* 2. DESKTOP VIEW: YOUTUBE LIVE STYLE (Widescreen 16:9 + Chat Sidebar) */}
      {/* =================================================================== */}
      <div className="hidden md:block">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Kolom Kiri: Player 16:9 + Info Toko + Deskripsi + Rekomendasi Produk */}
          <div className="space-y-4 lg:col-span-3">
            {/* 16:9 Cinematic Video Player Box */}
            <div
              ref={playerContainerRef}
              className="relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-black shadow-2xl dark:border-slate-800"
            >
              {/* Top Status Bar Overlay on Player */}
              <div className="pointer-events-auto absolute left-4 right-4 top-4 z-20 flex items-center justify-between gap-2">
                <LiveStreamStatusBar
                  startedAt={stream.startedAt}
                  viewerCount={viewerCount}
                  isLive={isLive}
                  isConnected={isWsConnected}
                />

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

              {/* Video Area (LiveKit Player or Offline Placeholder) */}
              <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
                {isLive ? (
                  isTokenLoading || !livekitToken ? (
                    <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                      <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
                      <p className="text-xs">
                        Menyiapkan saluran video ultra-rendah latensi...
                      </p>
                    </div>
                  ) : (
                    <LiveKitRoom
                      serverUrl={livekitWsUrl}
                      token={livekitToken}
                      connect={true}
                      video={false}
                      audio={false}
                      className="h-full w-full"
                    >
                      <RoomAudioRenderer />
                      <LiveKitSubscriberVideo
                        stream={stream}
                        onFullscreen={handleFullscreen}
                        likeCount={likeCount}
                        onSendLike={() => sendLike(1)}
                        isMirrored={isMirrored}
                        showControls={true}
                      />
                    </LiveKitRoom>
                  )
                ) : (
                  <div className="flex max-w-md flex-col items-center justify-center p-8 text-center text-white">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
                      <Radio className="h-8 w-8 text-slate-500" />
                    </div>
                    <span className="mb-2 rounded-full bg-slate-800 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {stream.status === 'ENDED'
                        ? 'SIARAN TELAH BERAKHIR'
                        : 'SIARAN BELUM DIMULAI'}
                    </span>
                    <h3 className="mb-2 text-lg font-bold text-white">
                      {stream.title}
                    </h3>
                    <p className="mb-6 text-xs text-slate-400">
                      {stream.description ||
                        'Host toko fisik akan kembali menyiarkan produk gadget pilihan segera.'}
                    </p>
                    <Link
                      href="/gadget"
                      className="rounded-xl bg-orange-500 px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-orange-600"
                    >
                      Kunjungi Katalog Gadget Toko
                    </Link>
                  </div>
                )}
              </div>
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
                        <Image
                          src={stream.store.logo}
                          alt={stream.store.name}
                          fill
                          className="object-cover"
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
                        className="shadow-xs rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                      >
                        Kunjungi Toko
                      </Link>
                      {stream.store.whatsapp && (
                        <a
                          href={`https://wa.me/${stream.store.whatsapp.replace(/\D/g, '')}?text=Halo%20Admin%20${encodeURIComponent(stream.store.name)},%20saya%20tertarik%20dengan%20produk%20di%20Live%20Streaming`}
                          target="_blank"
                          rel="noreferrer"
                          className="shadow-xs flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-emerald-700"
                        >
                          Chat WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Stats Pill (YouTube Action Buttons) */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <Radio className="h-3.5 w-3.5 animate-pulse text-rose-500" />
                    <span>{viewerCount} Menonton</span>
                  </div>
                  <button
                    onClick={() => sendLike(1)}
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
                          className="object-cover"
                        />
                      ) : (
                        <ShoppingBag className="m-auto h-6 w-6 text-orange-500" />
                      )}
                    </div>
                    <div>
                      <span className="shadow-2xs inline-flex items-center gap-1 rounded-md bg-orange-500 px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">
                        <Zap className="h-2.5 w-2.5 fill-white" />
                        Rekomendasi Host Sekarang
                      </span>
                      <h4 className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                        {pinnedProduct.productTitle}
                      </h4>
                      <p className="text-base font-extrabold text-orange-600 dark:text-orange-400">
                        Rp {pinnedProduct.productPrice?.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/gadget/${pinnedProduct.productId}`}
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
              {stream.featuredProducts &&
                stream.featuredProducts.length > 0 && (
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
                          className="shadow-2xs flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-3 transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                        >
                          <div className="relative mb-2 aspect-square w-full overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-800">
                            {p.images[0] ? (
                              <Image
                                src={p.images[0]}
                                alt={p.name}
                                fill
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
                            <p className="mt-1 text-sm font-extrabold text-orange-600 dark:text-orange-400">
                              Rp {p.price.toLocaleString('id-ID')}
                            </p>
                          </div>
                          <Link
                            href={`/gadget/${p.id}`}
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
          <div className="lg:col-span-1">
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
    </>
  )
}
