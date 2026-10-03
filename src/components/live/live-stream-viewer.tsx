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
  Sparkles,
  Zap,
  Heart,
  MessageSquare,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useLiveKitToken } from '@/hooks/use-livekit-token'
import { useLiveChat } from '@/hooks/use-live-chat'
import { LiveStreamStatusBar } from './live-stream-status-bar'
import { LiveChatPanel } from './live-chat-panel'
import { LiveProductPin } from './live-product-pin'
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
}: {
  stream: LiveStreamDetail
  onFullscreen: () => void
  likeCount?: number
  onSendLike?: () => void
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
          className="h-full w-full object-cover"
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

      {/* Video Overlay Action Controls */}
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

        <button
          onClick={onFullscreen}
          className="cursor-pointer rounded-full border border-white/10 bg-slate-900/80 p-2.5 text-white shadow-lg backdrop-blur-md transition-all hover:bg-slate-800 active:scale-90"
          title="Layar Penuh"
        >
          <Maximize2 className="h-4 w-4 text-white" />
        </button>
      </div>
    </div>
  )
}

export function LiveStreamViewer({ streamId }: { streamId: string }) {
  const { data: session } = useSession()
  const [stream, setStream] = useState<LiveStreamDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mobileTab, setMobileTab] = useState<'chat' | 'catalog'>('chat')
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

  // 3. WebSocket Real-time Chat & Pin Hook
  const {
    messages,
    viewerCount,
    pinnedProduct,
    isConnected: isWsConnected,
    likeCount,
    sendMessage,
    sendLike,
  } = useLiveChat({
    streamId,
    userName: session?.user?.name || undefined,
    userAvatar: session?.user?.image || undefined,
    initialViewerCount: stream?.viewerCount || 0,
    isBroadcaster: false,
  })

  // Fullscreen handler
  const handleFullscreen = () => {
    if (!playerContainerRef.current) return
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
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
          href="/live"
          className="inline-flex rounded-xl bg-orange-500 px-6 py-2.5 text-xs font-bold text-white transition-all hover:bg-orange-600"
        >
          Lihat Semua Live Streaming
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      {/* Main Stream & Chat Grid */}
      <div className="flex flex-col gap-4 lg:grid lg:h-[calc(100vh-160px)] lg:min-h-[640px] lg:grid-cols-3 lg:gap-6">
        {/* Kolom Kiri & Tengah: Video Player */}
        <div
          ref={playerContainerRef}
          className="relative flex h-[54vh] max-h-[580px] min-h-[360px] flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-950 shadow-md dark:border-slate-800 sm:h-[62vh] lg:col-span-2 lg:h-full lg:max-h-none"
        >
          {/* Top Status Bar Overlay */}
          <div className="pointer-events-auto absolute left-2.5 right-2.5 top-2.5 z-20 flex items-center justify-between gap-1.5 sm:left-4 sm:right-4 sm:top-4 sm:gap-2">
            <LiveStreamStatusBar
              startedAt={stream.startedAt}
              viewerCount={viewerCount}
              isLive={isLive}
              isConnected={isWsConnected}
            />

            {/* Store Profile Quick Pill */}
            {stream.store && (
              <Link
                href={`/toko/${stream.store.slug}`}
                target="_blank"
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/80 px-2.5 py-1 text-xs text-white shadow-md backdrop-blur-md transition-all hover:bg-slate-800 sm:px-3.5 sm:py-1.5"
              >
                <Store className="h-3.5 w-3.5 text-orange-400" />
                <span className="max-w-[100px] truncate font-medium sm:max-w-[120px]">
                  {stream.store.name}
                </span>
              </Link>
            )}
          </div>

          {/* Video Area (LiveKit Player or Offline Placeholder) */}
          <div className="relative flex h-full w-full flex-1 items-center justify-center overflow-hidden">
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
                  />
                </LiveKitRoom>
              )
            ) : (
              /* Offline / Ended Placeholder */
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

            {/* Floating Hearts Animation Overlay on Viewer Video Canvas */}
            <FloatingHeartsOverlay triggerCount={likeCount} />

            {/* Pinned Product Floating Card (Kiri Bawah Mengambang) */}
            {pinnedProduct && (
              <div className="pointer-events-auto absolute bottom-16 left-2.5 right-2.5 z-30 max-w-[calc(100%-20px)] sm:bottom-16 sm:left-4 sm:right-auto sm:max-w-sm">
                <LiveProductPin product={pinnedProduct} isBroadcaster={false} />
              </div>
            )}
          </div>
        </div>

        {/* Mobile Tab Switcher (Chat vs Katalog Produk) */}
        <div className="shadow-2xs flex rounded-2xl border border-slate-200/80 bg-white p-1 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileTab('chat')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
              mobileTab === 'chat'
                ? 'shadow-xs bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Live Chat ({messages.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('catalog')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
              mobileTab === 'catalog'
                ? 'shadow-xs bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <ShoppingBag className="h-4 w-4 text-orange-500" />
            <span>Produk ({stream.featuredProducts?.length || 0})</span>
          </button>
        </div>

        {/* Kolom Kanan: Live Chat & Featured Products Showcase */}
        <div className="flex flex-col gap-4 overflow-hidden lg:h-full">
          {/* Real-time Live Chat Panel */}
          <div
            className={`h-[440px] sm:h-[480px] lg:h-3/5 lg:min-h-[300px] lg:flex-1 ${
              mobileTab === 'chat' ? 'block' : 'hidden lg:block'
            }`}
          >
            <LiveChatPanel
              messages={messages}
              onSendMessage={sendMessage}
              onSendLike={sendLike}
              likeCount={likeCount}
              isBroadcaster={false}
              currentUserName={session?.user?.name || undefined}
              isConnected={isWsConnected}
            />
          </div>

          {/* Featured Products Mini Catalog - Clean White Theme */}
          <div
            className={`h-[440px] flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:h-[480px] lg:h-2/5 lg:min-h-[220px] ${
              mobileTab === 'catalog' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <ShoppingBag className="h-4 w-4 text-orange-500" />
                <span>
                  Produk Ditampilkan ({stream.featuredProducts?.length || 0})
                </span>
              </div>
              <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">
                GARANSI 30 HARI
              </span>
            </div>

            <div className="scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 mt-2 flex-1 space-y-2 overflow-y-auto">
              {!stream.featuredProducts ||
              stream.featuredProducts.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  Belum ada produk yang disorot pada siaran ini.
                </div>
              ) : (
                stream.featuredProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50/80 p-2.5 text-xs transition-all hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-800/40"
                  >
                    <div className="flex min-w-0 items-center gap-2.5 pr-2">
                      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:border-slate-700 dark:bg-slate-700">
                        {p.images[0] ? (
                          <Image
                            src={p.images[0]}
                            alt={p.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <ShoppingBag className="m-auto h-4 w-4 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="max-w-[130px] truncate font-semibold text-slate-800 dark:text-slate-100">
                          {p.name}
                        </p>
                        <p className="text-[11px] font-bold text-orange-600 dark:text-orange-400">
                          Rp {p.price.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/gadget/${p.id}`}
                      target="_blank"
                      className="shadow-xs shrink-0 rounded-xl bg-orange-500 px-3 py-1.5 text-[11px] font-bold text-white transition-all hover:bg-orange-600 active:scale-95"
                    >
                      Beli
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Store Profile Bar Below Player - Clean White Theme */}
      {stream.store && (
        <div className="p-4.5 flex flex-col items-start justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              {stream.store.logo ? (
                <Image
                  src={stream.store.logo}
                  alt={stream.store.name}
                  width={48}
                  height={48}
                  className="object-cover"
                />
              ) : (
                <Store className="h-6 w-6 text-orange-500" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {stream.store.name}
                </h3>
                <span className="flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                  <ShieldCheck className="h-3 w-3" />
                  PT Terverifikasi
                </span>
              </div>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                <MapPin className="h-3 w-3 text-slate-500" />
                <span>{stream.store.city || 'Indonesia'}</span>
                {stream.store.companyName && (
                  <span className="font-mono text-slate-500">
                    ({stream.store.companyName})
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/toko/${stream.store.slug}`}
              className="rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-white/20"
            >
              Kunjungi Toko
            </Link>
            {stream.store.whatsapp && (
              <a
                href={`https://wa.me/${stream.store.whatsapp.replace(/\D/g, '')}?text=Halo%20Admin%20${encodeURIComponent(stream.store.name)},%20saya%20tertarik%20dengan%20produk%20di%20Live%20Streaming`}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition-all hover:bg-emerald-700"
              >
                Chat WhatsApp
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
