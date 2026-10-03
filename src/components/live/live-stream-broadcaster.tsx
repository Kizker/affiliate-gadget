'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
} from '@livekit/components-react'
import {
  Radio,
  StopCircle,
  ShoppingBag,
  Copy,
  CheckCheck,
  Camera,
  CameraOff,
  Mic,
  MicOff,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Pin,
  Play,
  Share2,
  FlipHorizontal,
  MessageSquare,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useLiveKitToken } from '@/hooks/use-livekit-token'
import { useLiveChat } from '@/hooks/use-live-chat'
import { LiveStreamStatusBar } from './live-stream-status-bar'
import { LiveChatPanel } from './live-chat-panel'
import { LiveProductPin } from './live-product-pin'
import { FloatingHeartsOverlay } from './floating-hearts'

interface StoreProduct {
  id: string
  name: string
  price: number
  images: string[]
  brand: string | null
  stock: number
  rating: number
}

interface LiveStreamData {
  id: string
  title: string
  status: string
  viewerCount: number
  startedAt: string | null
  featuredProductIds: string[]
  livekitRoomName?: string
}

// Inner Studio Component inside LiveKitRoom context
function LiveKitStudioControls({
  stream,
  products,
  onEndStream,
}: {
  stream: LiveStreamData
  products: StoreProduct[]
  onEndStream: () => void
}) {
  const { localParticipant } = useLocalParticipant()
  const [cameraActive, setCameraActive] = useState(true)
  const [micActive, setMicActive] = useState(true)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [isMirrored, setIsMirrored] = useState(true)
  const [mobileTab, setMobileTab] = useState<'chat' | 'products'>('chat')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  )
  const [copied, setCopied] = useState(false)

  const videoElementRef = useRef<HTMLVideoElement>(null)

  // Attach local video track to DOM element
  useEffect(() => {
    if (!localParticipant || !videoElementRef.current) return

    const publication = localParticipant.getTrackPublication('camera' as any)
    if (publication && publication.track) {
      publication.track.attach(videoElementRef.current)
    }

    return () => {
      if (publication && publication.track && videoElementRef.current) {
        publication.track.detach(videoElementRef.current)
      }
    }
  }, [localParticipant, cameraActive, facingMode])

  // WebSocket Chat & Interactions Hook for Host
  const {
    messages,
    viewerCount,
    pinnedProduct,
    isConnected: isWsConnected,
    likeCount,
    sendMessage,
    sendLike,
    pinProduct,
    unpinProduct,
    endStream: wsEndStream,
  } = useLiveChat({
    streamId: stream.id,
    userName: 'Host Toko',
    isBroadcaster: true,
  })

  // Toggle Camera
  const toggleCamera = async () => {
    if (!localParticipant) return
    const nextState = !cameraActive
    await localParticipant.setCameraEnabled(nextState)
    setCameraActive(nextState)
  }

  // Toggle Microphone
  const toggleMic = async () => {
    if (!localParticipant) return
    const nextState = !micActive
    await localParticipant.setMicrophoneEnabled(nextState)
    setMicActive(nextState)
  }

  // Flip Camera (Front / Back)
  const flipCamera = async () => {
    if (!localParticipant) return
    const nextMode = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(nextMode)
    // Front camera is mirrored by default, rear camera is normal
    setIsMirrored(nextMode === 'user')
    try {
      await localParticipant.setCameraEnabled(false)
      await localParticipant.setCameraEnabled(true, {
        facingMode: nextMode,
      })
    } catch {
      // Ignore if device has only one camera
    }
  }

  // Handle Pin Product
  const handlePinProduct = (prod: StoreProduct) => {
    pinProduct({
      productId: prod.id,
      productTitle: prod.name,
      productPrice: prod.price,
      productImage: prod.images[0] || '',
      productSlug: prod.id,
    })
    setSelectedProductId(prod.id)
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/live/${stream.id}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleEnd = () => {
    if (confirm('Apakah Anda yakin ingin mengakhiri siaran langsung ini?')) {
      wsEndStream()
      onEndStream()
    }
  }

  return (
    <div className="flex flex-col gap-4 lg:grid lg:h-[calc(100vh-140px)] lg:min-h-[640px] lg:grid-cols-3 lg:gap-6">
      {/* Kolom Kiri & Tengah: Kamera Live View & Kontrol */}
      <div className="relative flex h-[54vh] max-h-[580px] min-h-[380px] flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-950 shadow-md dark:border-slate-800 sm:h-[62vh] lg:col-span-2 lg:h-full lg:max-h-none">
        {/* Top Status Bar Floating Overlay */}
        <div className="pointer-events-auto absolute left-2.5 right-2.5 top-2.5 z-20 flex items-center justify-between gap-1.5 sm:left-4 sm:right-4 sm:top-4 sm:gap-2">
          <LiveStreamStatusBar
            startedAt={stream.startedAt || new Date()}
            viewerCount={viewerCount}
            isLive={stream.status === 'LIVE'}
            isConnected={isWsConnected}
          />

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleCopyLink}
              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/80 p-2 text-xs text-white shadow-md backdrop-blur-md transition-all hover:bg-slate-800 sm:px-3.5 sm:py-1.5"
              title="Bagikan Tautan Siaran"
            >
              {copied ? (
                <>
                  <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="hidden text-emerald-400 sm:inline">
                    Tersalin!
                  </span>
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5 text-slate-300" />
                  <span className="hidden sm:inline">Bagikan</span>
                </>
              )}
            </button>

            <button
              onClick={handleEnd}
              className="flex cursor-pointer items-center gap-1 rounded-full bg-rose-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-md transition-all hover:bg-rose-700 active:scale-95 sm:px-3.5 sm:py-1.5"
            >
              <StopCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="text-[11px] sm:text-xs">Akhiri</span>
            </button>
          </div>
        </div>

        {/* Video Canvas / Video Track View */}
        <div className="relative flex h-full w-full flex-1 items-center justify-center overflow-hidden bg-slate-950">
          {cameraActive ? (
            <video
              ref={videoElementRef}
              autoPlay
              playsInline
              muted
              style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }}
              className="h-full w-full object-cover transition-transform duration-300"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
              <CameraOff className="h-16 w-16 stroke-1 text-slate-600" />
              <p className="text-sm font-medium">Kamera Dimatikan</p>
            </div>
          )}

          {/* Floating Hearts Animation Overlay on Video Canvas */}
          <FloatingHeartsOverlay triggerCount={likeCount} />

          {/* Floating Pinned Product Card on Video (Kiri Bawah Mengambang) */}
          {pinnedProduct && (
            <div className="pointer-events-auto absolute bottom-16 left-2.5 right-2.5 z-30 max-w-[calc(100%-20px)] sm:bottom-20 sm:left-4 sm:right-auto sm:max-w-sm">
              <LiveProductPin
                product={pinnedProduct}
                isBroadcaster={true}
                onUnpin={unpinProduct}
              />
            </div>
          )}
        </div>

        {/* Bottom Hardware Controls Bar */}
        <div className="pointer-events-auto absolute bottom-3 left-2.5 right-2.5 z-20 flex items-center justify-center sm:bottom-4 sm:left-4 sm:right-4">
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/90 px-3 py-1.5 shadow-xl backdrop-blur-md sm:gap-2 sm:px-4 sm:py-2">
            {/* Camera Toggle */}
            <button
              onClick={toggleCamera}
              className={`cursor-pointer rounded-full p-2 transition-all sm:p-2.5 ${
                cameraActive
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
              }`}
              title={cameraActive ? 'Matikan Kamera' : 'Nyalakan Kamera'}
            >
              {cameraActive ? (
                <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <CameraOff className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </button>

            {/* Microphone Toggle */}
            <button
              onClick={toggleMic}
              className={`cursor-pointer rounded-full p-2 transition-all sm:p-2.5 ${
                micActive
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
              }`}
              title={micActive ? 'Matikan Suara' : 'Nyalakan Suara'}
            >
              {micActive ? (
                <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <MicOff className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </button>

            {/* Switch Camera */}
            <button
              onClick={flipCamera}
              className="cursor-pointer rounded-full bg-white/10 p-2 text-white transition-all hover:bg-white/20 sm:p-2.5"
              title="Ganti Kamera Depan/Belakang"
            >
              <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            {/* Mirror View Toggle (Instagram Style) */}
            <button
              onClick={() => setIsMirrored(!isMirrored)}
              className={`cursor-pointer rounded-full p-2 transition-all sm:p-2.5 ${
                isMirrored
                  ? 'bg-orange-500/30 text-orange-300 ring-2 ring-orange-400/50 hover:bg-orange-500/40'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
              }`}
              title={
                isMirrored
                  ? 'Cermin Aktif (Mode Selfie/Instagram - Klik untuk Normal)'
                  : 'Cermin Nonaktif (Klik untuk Mirror View)'
              }
            >
              <FlipHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Tab Switcher: Chat vs Sematan Produk */}
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
          onClick={() => setMobileTab('products')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
            mobileTab === 'products'
              ? 'shadow-xs bg-slate-900 text-white dark:bg-white dark:text-slate-950'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <ShoppingBag className="h-4 w-4 text-orange-500" />
          <span>Sematan Produk ({products.length})</span>
        </button>
      </div>

      {/* Kolom Kanan: Live Chat & Daftar Produk untuk Disematkan */}
      <div className="flex flex-col gap-4 overflow-hidden lg:h-full">
        {/* Tab Chat */}
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
            isBroadcaster={true}
            currentUserName="Host Toko"
            isConnected={isWsConnected}
          />
        </div>

        {/* Tab Featured Products (Pin Management) - Clean White Theme */}
        <div
          className={`h-[440px] flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:h-[480px] lg:h-2/5 lg:min-h-[220px] ${
            mobileTab === 'products' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <ShoppingBag className="h-4 w-4 text-orange-500" />
              <span>Sematan Produk ({products.length})</span>
            </div>
            {pinnedProduct && (
              <button
                onClick={unpinProduct}
                className="cursor-pointer text-[11px] font-semibold text-rose-500 hover:underline"
              >
                Lepas Sematan
              </button>
            )}
          </div>

          <div className="scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 mt-2 flex-1 space-y-2 overflow-y-auto">
            {products.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Tidak ada produk yang dipilih untuk siaran ini.
              </div>
            ) : (
              products.map((p) => {
                const isPinned = pinnedProduct?.productId === p.id
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between rounded-2xl border p-2.5 text-xs transition-all ${
                      isPinned
                        ? 'shadow-xs border-orange-400 bg-orange-50/70 dark:border-orange-500/40 dark:bg-orange-950/20'
                        : 'border-slate-200/70 bg-slate-50/80 hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-800/40'
                    }`}
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
                        <p className="text-[11px] font-bold text-orange-600 dark:text-orange-500">
                          Rp {p.price.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handlePinProduct(p)}
                      disabled={isPinned}
                      className={`flex cursor-pointer items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition-all ${
                        isPinned
                          ? 'shadow-xs cursor-default bg-orange-500 text-white'
                          : 'shadow-2xs border border-slate-200 bg-white text-slate-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <Pin className="h-3 w-3" />
                      {isPinned ? 'Tersemat' : 'Sematkan'}
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Main Broadcaster Studio Container
export function LiveStreamBroadcaster() {
  const { data: session } = useSession()
  const [step, setStep] = useState<'idle' | 'setup' | 'live'>('idle')
  const [streams, setStreams] = useState<LiveStreamData[]>([])
  const [activeStream, setActiveStream] = useState<LiveStreamData | null>(null)
  const [products, setProducts] = useState<StoreProduct[]>([])
  const [featuredProductIds, setFeaturedProductIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form setup
  const [form, setForm] = useState({
    title: '',
    description: '',
  })

  // Load existing streams for the current store
  const loadStreams = async () => {
    try {
      const res = await fetch('/api/live-streams?limit=20')
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        setStreams(json.data)
      }
    } catch {
      // Ignore
    }
  }

  // Load store products
  const loadProducts = async () => {
    try {
      const res = await fetch('/api/gadgets?limit=50')
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        setProducts(json.data)
      }
    } catch {
      // Ignore
    }
  }

  useEffect(() => {
    loadStreams()
    loadProducts()
  }, [])

  // Create stream session in DB
  const handleCreateStream = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('Judul siaran wajib diisi')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/live-streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal membuat sesi live')
      }

      // Update featured products if selected
      if (featuredProductIds.length > 0) {
        await fetch(`/api/live-streams/${json.data.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ featuredProductIds }),
        })
      }

      // Activate stream to LIVE status
      await fetch(`/api/live-streams/${json.data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'LIVE' }),
      })

      setActiveStream({ ...json.data, status: 'LIVE', featuredProductIds })
      setStep('live')
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  // Resume or enter studio for an existing stream
  const handleEnterStudio = async (stream: LiveStreamData) => {
    try {
      if (stream.status !== 'LIVE') {
        await fetch(`/api/live-streams/${stream.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'LIVE' }),
        })
      }
      setActiveStream({ ...stream, status: 'LIVE' })
      setStep('live')
    } catch {
      setError('Gagal masuk ke studio')
    }
  }

  // End active stream
  const handleEndActiveStream = async () => {
    if (!activeStream) return
    try {
      await fetch(`/api/live-streams/${activeStream.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ENDED' }),
      })
      setActiveStream(null)
      setStep('idle')
      loadStreams()
    } catch {
      // Ignore
    }
  }

  // Fetch LiveKit Token for broadcaster when in live step
  const {
    token: livekitToken,
    wsUrl: livekitWsUrl,
    loading: isTokenLoading,
    error: tokenError,
  } = useLiveKitToken(activeStream?.id || '', 'broadcaster')

  // Filter products selected for this stream
  const activeProducts = products.filter((p) =>
    (activeStream?.featuredProductIds || featuredProductIds).includes(p.id)
  )

  // 1. STEP: LIVE (ON-AIR STUDIO VIA LIVEKIT)
  if (step === 'live' && activeStream) {
    if (isTokenLoading) {
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center text-slate-800 dark:text-slate-200">
          <RefreshCw className="mb-4 h-8 w-8 animate-spin text-slate-600 dark:text-slate-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Mempersiapkan Studio LiveKit...
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Menghubungkan kamera & mikrofon perangkat
          </p>
        </div>
      )
    }

    if (tokenError || !livekitToken) {
      return (
        <div className="shadow-2xs mx-auto my-12 max-w-lg rounded-3xl border border-rose-200 bg-white p-8 text-center text-slate-900 dark:border-rose-900/50 dark:bg-slate-900 dark:text-white">
          <p className="mb-2 text-sm font-bold text-rose-600 dark:text-rose-400">
            Gagal Menghubungkan ke LiveKit
          </p>
          <p className="mb-6 text-xs text-slate-500 dark:text-slate-400">
            {tokenError ||
              'Kredensial token tidak valid atau sesi siaran telah berakhir'}
          </p>
          <button
            onClick={() => setStep('idle')}
            className="shadow-2xs active:scale-98 cursor-pointer rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-950"
          >
            Kembali ke Beranda Live
          </button>
        </div>
      )
    }

    return (
      <LiveKitRoom
        serverUrl={livekitWsUrl}
        token={livekitToken}
        connect={true}
        video={true}
        audio={true}
        className="w-full"
      >
        <RoomAudioRenderer />
        <LiveKitStudioControls
          stream={activeStream}
          products={
            activeProducts.length > 0 ? activeProducts : products.slice(0, 5)
          }
          onEndStream={handleEndActiveStream}
        />
      </LiveKitRoom>
    )
  }

  // 2. STEP: SETUP STREAM FORM
  if (step === 'setup') {
    return (
      <div className="shadow-2xs mx-auto max-w-2xl rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Radio className="h-4.5 w-4.5 text-slate-800 dark:text-slate-200" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                Persiapan Siaran Langsung Baru
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lengkapi rincian siaran dan sematkan produk katalog toko Anda
              </p>
            </div>
          </div>
          <button
            onClick={() => setStep('idle')}
            className="dark:hover:bg-slate-750 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            Batal
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleCreateStream} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Judul Siaran Langsung <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Contoh: Flash Sale iPhone 15 Pro Max & Promo Garansi 30 Hari!"
              className="focus:outline-hidden w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:focus:border-slate-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Deskripsi Singkat (Opsional)
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Tuliskan info promo, unit yang akan di-review, atau diskon khusus penonton..."
              className="focus:outline-hidden w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:focus:border-slate-500"
            />
          </div>

          {/* Select Featured Products */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Pilih Produk yang Akan Dijual (Maks. 5)
              </label>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {featuredProductIds.length} / 5 dipilih
              </span>
            </div>

            <div className="max-h-60 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/60 p-2.5 dark:border-slate-800 dark:bg-slate-950/40">
              {products.slice(0, 15).map((p) => {
                const isSelected = featuredProductIds.includes(p.id)
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (isSelected) {
                        setFeaturedProductIds(
                          featuredProductIds.filter((id) => id !== p.id)
                        )
                      } else if (featuredProductIds.length < 5) {
                        setFeaturedProductIds([...featuredProductIds, p.id])
                      }
                    }}
                    className={`flex cursor-pointer items-center justify-between rounded-xl p-2.5 transition-all ${
                      isSelected
                        ? 'shadow-2xs border border-slate-900 bg-white text-slate-900 dark:border-white dark:bg-slate-800 dark:text-white'
                        : 'border border-transparent bg-white/70 text-slate-700 hover:bg-white dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3 pr-2">
                      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                        {p.images[0] && (
                          <Image
                            src={p.images[0]}
                            alt={p.name}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                          {p.name}
                        </p>
                        <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          Rp {p.price.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-md border text-xs transition-colors ${
                        isSelected
                          ? 'border-slate-900 bg-slate-900 font-bold text-white dark:border-white dark:bg-white dark:text-slate-950'
                          : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800'
                      }`}
                    >
                      {isSelected ? '✓' : ''}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="shadow-2xs active:scale-98 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-xs font-semibold text-white transition-all hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
            >
              <Radio className="h-4 w-4" />
              <span>
                {loading
                  ? 'Menyiapkan Studio...'
                  : 'Mulai On-Air Siaran Sekarang'}
              </span>
            </button>
          </div>
        </form>
      </div>
    )
  }

  // 3. STEP: IDLE (DAFTAR SIARAN & TOMBOL MULAI)
  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      {/* Header Banner */}
      <div className="shadow-2xs rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100/80 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Live Shopping Studio</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              Studio Siaran Langsung Toko
            </h1>
            <p className="max-w-xl text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
              Siarkan produk gadget langsung dari toko fisik Anda dengan latensi
              rendah, interaksi chat pelanggan real-time, dan sematkan produk
              langsung ke keranjang belanja.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/live"
              target="_blank"
              className="shadow-2xs active:scale-98 dark:hover:bg-slate-750 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
              <span>Halaman Live Publik</span>
            </Link>
            <button
              onClick={() => setStep('setup')}
              className="shadow-2xs active:scale-98 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
            >
              <Radio className="h-3.5 w-3.5" />
              <span>Mulai Siaran Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Studio Info Bento Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="shadow-2xs rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Infrastruktur Siaran
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              <Radio className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
            LiveKit SFU Cloud
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            Ultra-low latency streaming
          </p>
        </div>

        <div className="shadow-2xs rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Katalog Toko
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              <ShoppingBag className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
            {products.length} Unit Siap Semat
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            Langsung checkout dari live chat
          </p>
        </div>

        <div className="shadow-2xs rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Riwayat Siaran
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              <Play className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
            {streams.length} Total Sesi
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            {streams.filter((s) => s.status === 'LIVE').length} sedang mengudara
          </p>
        </div>
      </div>

      {/* Streams Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              Daftar Sesi Siaran Toko
            </h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {streams.length}
            </span>
          </div>
        </div>

        {streams.length === 0 ? (
          <div className="shadow-2xs rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900/60">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <Radio className="stroke-1.5 h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Belum Ada Sesi Siaran
            </h3>
            <p className="mx-auto mb-5 mt-1 max-w-sm text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Mulai live streaming pertama toko cabang Anda untuk mempromosikan
              katalog gadget dengan interaksi real-time kepada pembeli.
            </p>
            <button
              onClick={() => setStep('setup')}
              className="shadow-2xs active:scale-98 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
            >
              <Radio className="h-3.5 w-3.5" />
              <span>Buat Sesi Siaran Sekarang</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {streams.map((s) => {
              const isLive = s.status === 'LIVE'
              return (
                <div
                  key={s.id}
                  className="shadow-2xs flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div>
                    <div className="mb-2.5 flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isLive
                            ? 'animate-pulse border border-rose-200/80 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300'
                            : s.status === 'ENDED'
                              ? 'border border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                              : 'border border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300'
                        }`}
                      >
                        {isLive && (
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                        )}
                        {s.status}
                      </span>
                      <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
                        {s.viewerCount} penonton
                      </span>
                    </div>
                    <h3 className="line-clamp-2 text-sm font-bold text-slate-900 dark:text-white">
                      {s.title}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <Link
                      href={`/live/${s.id}`}
                      target="_blank"
                      className="flex items-center gap-1 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Lihat Publik</span>
                    </Link>

                    {s.status !== 'ENDED' ? (
                      <button
                        onClick={() => handleEnterStudio(s)}
                        className="shadow-2xs active:scale-98 flex cursor-pointer items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>Buka Studio</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        Siaran Selesai
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
