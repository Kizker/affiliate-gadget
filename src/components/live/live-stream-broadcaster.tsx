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
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useLiveKitToken } from '@/hooks/use-livekit-token'
import { useLiveChat } from '@/hooks/use-live-chat'
import { LiveStreamStatusBar } from './live-stream-status-bar'
import { LiveChatPanel } from './live-chat-panel'
import { LiveProductPin } from './live-product-pin'

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
    <div className="grid h-[calc(100vh-140px)] min-h-[640px] grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Kolom Kiri & Tengah: Kamera Live View & Kontrol */}
      <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl lg:col-span-2">
        {/* Top Status Bar Floating Overlay */}
        <div className="pointer-events-auto absolute left-4 right-4 top-4 z-20 flex items-center justify-between">
          <LiveStreamStatusBar
            startedAt={stream.startedAt || new Date()}
            viewerCount={viewerCount}
            isLive={stream.status === 'LIVE'}
            isConnected={isWsConnected}
          />

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/80 px-3 py-1.5 text-xs text-white shadow-md backdrop-blur-md transition-all hover:bg-slate-800"
            >
              {copied ? (
                <>
                  <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Tersalin!</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5 text-slate-300" />
                  <span>Bagikan</span>
                </>
              )}
            </button>

            <button
              onClick={handleEnd}
              className="flex cursor-pointer items-center gap-1.5 rounded-full bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md transition-all hover:bg-rose-700 active:scale-95"
            >
              <StopCircle className="h-4 w-4" />
              <span>Akhiri Siaran</span>
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
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
              <CameraOff className="h-16 w-16 stroke-1 text-slate-600" />
              <p className="text-sm font-medium">Kamera Dimatikan</p>
            </div>
          )}

          {/* Floating Pinned Product Card on Video */}
          {pinnedProduct && (
            <div className="absolute bottom-20 left-4 z-20">
              <LiveProductPin
                product={pinnedProduct}
                isBroadcaster={true}
                onUnpin={unpinProduct}
              />
            </div>
          )}
        </div>

        {/* Bottom Hardware Controls Bar */}
        <div className="pointer-events-auto absolute bottom-4 left-4 right-4 z-20 flex items-center justify-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/90 px-4 py-2 shadow-xl backdrop-blur-md">
            {/* Camera Toggle */}
            <button
              onClick={toggleCamera}
              className={`cursor-pointer rounded-full p-2.5 transition-all ${
                cameraActive
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
              }`}
              title={cameraActive ? 'Matikan Kamera' : 'Nyalakan Kamera'}
            >
              {cameraActive ? (
                <Camera className="h-5 w-5" />
              ) : (
                <CameraOff className="h-5 w-5" />
              )}
            </button>

            {/* Microphone Toggle */}
            <button
              onClick={toggleMic}
              className={`cursor-pointer rounded-full p-2.5 transition-all ${
                micActive
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
              }`}
              title={micActive ? 'Matikan Suara' : 'Nyalakan Suara'}
            >
              {micActive ? (
                <Mic className="h-5 w-5" />
              ) : (
                <MicOff className="h-5 w-5" />
              )}
            </button>

            {/* Switch Camera */}
            <button
              onClick={flipCamera}
              className="cursor-pointer rounded-full bg-white/10 p-2.5 text-white transition-all hover:bg-white/20"
              title="Ganti Kamera Depan/Belakang"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Kolom Kanan: Live Chat & Daftar Produk untuk Disematkan */}
      <div className="flex h-full flex-col gap-4 overflow-hidden">
        {/* Tab Chat */}
        <div className="h-3/5 min-h-[300px] flex-1">
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

        {/* Tab Featured Products (Pin Management) */}
        <div className="flex h-2/5 min-h-[220px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 p-4 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
              <ShoppingBag className="h-4 w-4 text-orange-400" />
              <span>Sematan Produk ({products.length})</span>
            </div>
            {pinnedProduct && (
              <button
                onClick={unpinProduct}
                className="cursor-pointer text-[11px] text-rose-400 hover:underline"
              >
                Lepas Sematan
              </button>
            )}
          </div>

          <div className="scrollbar-thin scrollbar-thumb-slate-700 mt-2 flex-1 space-y-2 overflow-y-auto">
            {products.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                Tidak ada produk yang dipilih untuk siaran ini.
              </div>
            ) : (
              products.map((p) => {
                const isPinned = pinnedProduct?.productId === p.id
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between rounded-xl border p-2 text-xs transition-all ${
                      isPinned
                        ? 'border-orange-500/40 bg-orange-500/10 text-orange-200'
                        : 'border-white/5 bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2 pr-2">
                      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-slate-800">
                        {p.images[0] ? (
                          <Image
                            src={p.images[0]}
                            alt={p.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <ShoppingBag className="m-auto h-4 w-4 text-slate-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="max-w-[130px] truncate font-medium">
                          {p.name}
                        </p>
                        <p className="text-[11px] font-bold text-orange-400">
                          Rp {p.price.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handlePinProduct(p)}
                      disabled={isPinned}
                      className={`flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
                        isPinned
                          ? 'cursor-default bg-orange-500 text-white'
                          : 'bg-white/10 text-slate-300 hover:bg-orange-500 hover:text-white'
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
        <div className="flex min-h-[500px] flex-col items-center justify-center text-white">
          <RefreshCw className="mb-4 h-10 w-10 animate-spin text-orange-500" />
          <h3 className="text-lg font-bold">Mempersiapkan Studio LiveKit...</h3>
          <p className="text-sm text-slate-400">
            Menghubungkan kamera & mikrofon
          </p>
        </div>
      )
    }

    if (tokenError || !livekitToken) {
      return (
        <div className="mx-auto my-12 max-w-lg rounded-3xl border border-rose-500/30 bg-slate-900 p-8 text-center text-white">
          <p className="mb-2 font-bold text-rose-400">
            Gagal Menghubungkan ke LiveKit
          </p>
          <p className="mb-6 text-sm text-slate-300">
            {tokenError || 'Kredensial token tidak valid'}
          </p>
          <button
            onClick={() => setStep('idle')}
            className="cursor-pointer rounded-xl bg-slate-800 px-6 py-2.5 text-sm font-semibold hover:bg-slate-700"
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
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-slate-900/90 p-6 text-white shadow-2xl sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-6 w-6 animate-pulse text-orange-500" />
            <h2 className="text-xl font-bold">
              Persiapan Siaran Langsung Baru
            </h2>
          </div>
          <button
            onClick={() => setStep('idle')}
            className="text-xs text-slate-400 hover:text-white"
          >
            Batal
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/20 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleCreateStream} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-300">
              Judul Siaran Langsung *
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Contoh: Flash Sale iPhone 15 Pro Max & Promo Garansi 30 Hari!"
              className="focus:outline-hidden w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-300">
              Deskripsi Singkat (Opsional)
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Tuliskan info promo, unit yang akan di-review, atau diskon khusus penonton..."
              className="focus:outline-hidden w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-orange-500"
            />
          </div>

          {/* Select Featured Products */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Pilih Produk yang Akan Dijual (Maks. 5)
              </label>
              <span className="text-[11px] text-orange-400">
                {featuredProductIds.length} / 5 dipilih
              </span>
            </div>

            <div className="scrollbar-thin scrollbar-thumb-slate-700 max-h-56 space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/40 p-2">
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
                    className={`flex cursor-pointer items-center justify-between rounded-xl p-2 transition-all ${
                      isSelected
                        ? 'border border-orange-500/50 bg-orange-500/20 text-white'
                        : 'border border-transparent bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5 pr-2">
                      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-slate-800">
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
                        <p className="truncate text-xs font-medium">{p.name}</p>
                        <p className="text-[11px] font-bold text-orange-400">
                          Rp {p.price.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${
                        isSelected
                          ? 'border-orange-500 bg-orange-500 font-bold text-white'
                          : 'border-slate-500'
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
              className="active:scale-98 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 py-3.5 text-sm font-bold text-white shadow-xl transition-all hover:from-orange-600 hover:to-amber-600 disabled:opacity-50"
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
    <div className="space-y-6 text-white">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 shadow-xl sm:p-8">
        <div className="relative z-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2.5 w-2.5 animate-ping rounded-full bg-orange-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                Live Streaming Hub (LiveKit SFU)
              </span>
            </div>
            <h1 className="text-2xl font-black">Studio Siaran Langsung Toko</h1>
            <p className="mt-1 max-w-xl text-sm text-slate-300">
              Siarkan produk gadget langsung dari toko fisik Anda dengan latensi
              rendah, interaksi chat WebSocket real-time, dan sematan produk
              langsung ke keranjang pembeli.
            </p>
          </div>

          <button
            onClick={() => setStep('setup')}
            className="flex shrink-0 cursor-pointer items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-sm font-bold text-white shadow-xl transition-all hover:from-orange-600 hover:to-amber-600 active:scale-95"
          >
            <Radio className="h-4 w-4" />
            <span>Mulai Siaran Baru</span>
          </button>
        </div>
      </div>

      {/* Streams Grid */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <span>Daftar Siaran Toko</span>
          <span className="text-xs font-normal text-slate-400">
            ({streams.length})
          </span>
        </h2>

        {streams.length === 0 ? (
          <div className="rounded-3xl border border-white/5 bg-slate-900/50 py-16 text-center">
            <Radio className="mx-auto mb-3 h-12 w-12 text-slate-600" />
            <h3 className="text-base font-bold text-slate-300">
              Belum Ada Sesi Siaran
            </h3>
            <p className="mx-auto mb-6 mt-1 max-w-md text-xs text-slate-500">
              Mulai live streaming pertama Anda untuk meningkatkan penjualan
              produk gadget cabang toko fisik Anda.
            </p>
            <button
              onClick={() => setStep('setup')}
              className="cursor-pointer rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-semibold text-white transition-all hover:bg-orange-600"
            >
              Buat Siaran Sekarang
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {streams.map((s) => {
              const isLive = s.status === 'LIVE'
              return (
                <div
                  key={s.id}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-slate-900 p-4 shadow-lg transition-all hover:border-white/20"
                >
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isLive
                            ? 'animate-pulse bg-rose-500/20 text-rose-400'
                            : s.status === 'ENDED'
                              ? 'bg-slate-800 text-slate-400'
                              : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {s.status}
                      </span>
                      <span className="font-mono text-xs text-slate-400">
                        {s.viewerCount} penonton
                      </span>
                    </div>
                    <h3 className="line-clamp-2 text-sm font-bold text-white">
                      {s.title}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-2">
                    <Link
                      href={`/live/${s.id}`}
                      target="_blank"
                      className="flex items-center gap-1 text-xs text-slate-400 transition-colors hover:text-white"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Lihat Publik</span>
                    </Link>

                    {s.status !== 'ENDED' ? (
                      <button
                        onClick={() => handleEnterStudio(s)}
                        className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-orange-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-md transition-all hover:bg-orange-600 active:scale-95"
                      >
                        <Play className="h-3.5 w-3.5 fill-white" />
                        <span>Buka Studio</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500">
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
