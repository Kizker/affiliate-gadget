'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Heart,
  Share2,
  Eye,
  MessageCircle,
  ShoppingBag,
  Store,
  CheckCircle2,
  Pin,
  Volume2,
  VolumeX,
  Maximize2,
  Send,
  Radio,
  Clock,
  MapPin,
  Camera,
} from 'lucide-react'
import { useSession } from 'next-auth/react'

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

interface LiveStreamComment {
  id: string
  userName: string
  userAvatar: string | null
  message: string
  isPinned: boolean
  createdAt: string
}

interface LiveStream {
  id: string
  storeId: string | null
  title: string
  description: string | null
  coverImage: string | null
  streamUrl: string
  status: 'SCHEDULED' | 'LIVE' | 'ENDED'
  scheduledAt: string | null
  startedAt: string | null
  endedAt: string | null
  viewerCount: number
  store: StoreInfo | null
  comments: LiveStreamComment[]
  featuredProducts?: ProductHighlight[]
}

interface Props {
  streamId: string
}

export function LiveStreamViewer({ streamId }: Props) {
  const { data: session } = useSession()
  const [stream, setStream] = useState<LiveStream | null>(null)
  const [comments, setComments] = useState<LiveStreamComment[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<ProductHighlight[]>(
    []
  )
  const [viewerCount, setViewerCount] = useState<number>(0)
  const [likeCount, setLikeCount] = useState<number>(1280)
  const [liked, setLiked] = useState<boolean>(false)
  const [chatInput, setChatInput] = useState<string>('')
  const [guestName, setGuestName] = useState<string>('')
  const [sending, setSending] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedProduct, setSelectedProduct] =
    useState<ProductHighlight | null>(null)
  const [showProductModal, setShowProductModal] = useState<boolean>(false)
  const [isMuted, setIsMuted] = useState<boolean>(true)

  // Real Camera Feed state from Admin
  const [cameraFrame, setCameraFrame] = useState<string | null>(null)
  const [hasWebRTC, setHasWebRTC] = useState<boolean>(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const sseRef = useRef<EventSource | null>(null)
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const viewerIdRef = useRef<string>(Math.random().toString(36).substring(2, 9))

  // 1. Fetch Stream Detail
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/live-streams/${streamId}`)
        const data = await res.json()
        if (data.success && data.data) {
          setStream(data.data)
          setComments(data.data.comments || [])
          setViewerCount(data.data.viewerCount || 0)
          setFeaturedProducts(data.data.featuredProducts || [])
          setLikeCount(Math.max(120, (data.data.viewerCount || 5) * 3 + 12))
        }
      } catch (err) {
        console.error('Error loading stream:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [streamId])

  // Helper to scroll only the chat container without affecting window viewport
  const scrollChatToBottom = (smooth = true) => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      })
    }
  }

  // 2. Setup Server-Sent Events (SSE) for Real-Time Chat & Viewers
  useEffect(() => {
    const es = new EventSource(`/api/live-streams/${streamId}/chat`)
    sseRef.current = es

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload.type === 'chat' && payload.data) {
          setComments((prev) => {
            if (prev.some((c) => c.id === payload.data.id)) return prev
            return [...prev, payload.data]
          })
          setTimeout(() => {
            scrollChatToBottom(true)
          }, 80)
        } else if (payload.type === 'viewers') {
          setViewerCount(payload.count)
        }
      } catch {
        /* Ignore malformed events */
      }
    }

    return () => {
      es.close()
    }
  }, [streamId])

  // Auto scroll chat to bottom when comments change
  useEffect(() => {
    scrollChatToBottom(false)
  }, [comments.length])

  // 3. Connect to Real Admin Camera Stream (BroadcastChannel + WebRTC + Frame Relay)
  useEffect(() => {
    if (!stream || stream.status !== 'LIVE') return

    const viewerId = viewerIdRef.current

    // A. Local BroadcastChannel for instant same-browser cross-tab live feed
    try {
      const bc = new BroadcastChannel(`ag-live-stream-${streamId}`)
      broadcastChannelRef.current = bc
      bc.onmessage = (e) => {
        if (e.data?.type === 'frame' && e.data?.frame) {
          setCameraFrame(e.data.frame)
        } else if (e.data?.type === 'ended') {
          setStream((prev) => (prev ? { ...prev, status: 'ENDED' } : prev))
        }
      }
    } catch {
      /* ignore */
    }

    // B. Register viewer with WebRTC signaling
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    })
    peerConnectionRef.current = pc

    pc.ontrack = (event) => {
      if (videoRef.current && event.streams[0]) {
        videoRef.current.srcObject = event.streams[0]
        videoRef.current.play().catch(() => {})
        setHasWebRTC(true)
      }
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        fetch(`/api/live-streams/${streamId}/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'webrtc-candidate',
            viewerId,
            candidate: event.candidate,
          }),
        }).catch(() => {})
      }
    }

    // Send join request to broadcaster
    fetch(`/api/live-streams/${streamId}/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'viewer-join', viewerId }),
    }).catch(() => {})

    // C. Poll WebRTC offer from broadcaster
    let handledOffer = false
    const pollInterval = setInterval(async () => {
      try {
        // 1. Check for WebRTC offer
        if (!handledOffer) {
          const res = await fetch(
            `/api/live-streams/${streamId}/stream?action=signal&viewerId=${viewerId}`
          )
          const data = await res.json()
          if (data.success && data.offer) {
            handledOffer = true
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer))
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)

            await fetch(`/api/live-streams/${streamId}/stream`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'webrtc-answer',
                viewerId,
                answer,
              }),
            })
          }
        }

        // 2. Poll remote camera frame if WebRTC not connected yet
        if (!hasWebRTC) {
          const frameRes = await fetch(
            `/api/live-streams/${streamId}/stream?action=frame`
          )
          const frameData = await frameRes.json()
          if (frameData.success && frameData.frame) {
            setCameraFrame(frameData.frame)
          }
        }
      } catch {
        /* ignore polling error */
      }
    }, 400)

    return () => {
      clearInterval(pollInterval)
      broadcastChannelRef.current?.close()
      pc.close()
    }
  }, [stream, streamId, hasWebRTC])

  // Send message handler
  const sendMessage = useCallback(async () => {
    if (!chatInput.trim() || sending) return
    setSending(true)

    const name = session?.user?.name || guestName.trim() || 'Pembeli Tamu'
    const avatar = (session?.user as any)?.image || null

    try {
      await fetch(`/api/live-streams/${streamId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: name,
          userAvatar: avatar,
          message: chatInput.trim(),
        }),
      })
      setChatInput('')
    } catch (e) {
      console.error('Failed to send comment:', e)
    } finally {
      setSending(false)
    }
  }, [chatInput, guestName, sending, session, streamId])

  const handleLike = () => {
    if (!liked) {
      setLiked(true)
      setLikeCount((c) => c + 1)
    }
  }

  const toggleSound = () => {
    if (videoRef.current) {
      const nextMuted = !videoRef.current.muted
      videoRef.current.muted = nextMuted
      setIsMuted(nextMuted)
    }
  }

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!document.fullscreenElement) {
        videoRef.current.requestFullscreen().catch(() => {})
      } else {
        document.exitFullscreen().catch(() => {})
      }
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="border-3 h-10 w-10 animate-spin rounded-full border-slate-200 border-t-orange-500" />
          <p className="text-sm font-medium text-slate-500">
            Menghubungkan ke siaran toko...
          </p>
        </div>
      </div>
    )
  }

  if (!stream) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Radio className="h-12 w-12 text-slate-300" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Siaran Langsung Tidak Ditemukan
        </h2>
        <p className="max-w-sm text-xs text-slate-500">
          Sesi siaran toko ini tidak tersedia atau belum dimulai oleh admin
          cabang terkait.
        </p>
        <Link
          href="/gadget"
          className="rounded-2xl bg-orange-500 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600"
        >
          Kembali ke Katalog
        </Link>
      </div>
    )
  }

  const isLive = stream.status === 'LIVE'
  const storeName =
    stream.store?.name?.replace('Affiliate Gadget - ', '') ||
    stream.store?.name ||
    'Toko Resmi'

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-6">
      {/* ── Left Column: Video Stage & Product Highlights ────────────── */}
      <div className="flex flex-1 flex-col space-y-4">
        {/* Real Live Camera Player Container */}
        <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-slate-200/90 bg-slate-950 shadow-lg dark:border-slate-800">
          {isLive ? (
            <>
              {/* Native WebRTC Video Player */}
              <video
                ref={videoRef}
                className={`h-full w-full object-cover ${hasWebRTC ? 'block' : 'hidden'}`}
                autoPlay
                playsInline
                muted={isMuted}
              />

              {/* Real-time Camera Frame Relay when WebRTC is establishing */}
              {!hasWebRTC && cameraFrame ? (
                <img
                  src={cameraFrame}
                  alt="Live Kamera Admin Toko"
                  className="h-full w-full object-cover"
                />
              ) : null}

              {/* Waiting for Camera Frame */}
              {!hasWebRTC && !cameraFrame && (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center text-white">
                  <Camera className="h-10 w-10 animate-pulse text-orange-400" />
                  <div>
                    <p className="text-sm font-bold">
                      Menghubungkan ke Kamera Toko...
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Menyambungkan siaran langsung kamera admin toko fisik
                    </p>
                  </div>
                </div>
              )}

              {/* Overlay Top Gradient */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/70 to-transparent" />

              {/* Overlay Bottom Gradient */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              {/* Top Left: LIVE Badges */}
              <div className="absolute left-3.5 top-3.5 z-20 flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-[11px] font-black text-white shadow-lg shadow-red-600/40">
                  <span className="h-2 w-2 animate-ping rounded-full bg-white" />
                  LIVE KAMERA TOKO
                </span>
                <span className="rounded-full border border-white/20 bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                  Kamera Asli Admin
                </span>
              </div>

              {/* Top Right: Viewer Count & Player Controls */}
              <div className="absolute right-3.5 top-3.5 z-20 flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                  <Eye className="h-3.5 w-3.5 text-red-400" />
                  {viewerCount.toLocaleString('id-ID')}
                </div>
                {hasWebRTC && (
                  <button
                    type="button"
                    onClick={toggleSound}
                    aria-label={isMuted ? 'Nyalakan Suara' : 'Matikan Suara'}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md transition hover:bg-black/80"
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4 text-red-400" />
                    ) : (
                      <Volume2 className="h-4 w-4 text-white" />
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  aria-label="Fullscreen"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md transition hover:bg-black/80"
                >
                  <Maximize2 className="h-4 w-4 text-white" />
                </button>
              </div>

              {/* Bottom Overlay: Store Branding & Live Notice */}
              <div className="absolute bottom-3.5 left-4 right-4 z-20 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <div className="relative h-7 w-7 overflow-hidden rounded-full border border-white/30 bg-white/20">
                    {stream.store?.logo ? (
                      <Image
                        src={stream.store.logo}
                        alt={storeName}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <Store className="m-auto h-4 w-4 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight drop-shadow">
                      {storeName}
                    </p>
                    <p className="text-[10px] text-white/80 drop-shadow">
                      Admin Toko Fisik Resmi
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/80 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                    <CheckCircle2 className="h-3 w-3" />
                    Garansi 30 Hari Tukar Baru
                  </span>
                </div>
              </div>
            </>
          ) : (
            /* Offline or Ended State (NO DUMMY VIDEO) */
            <div className="relative flex h-full w-full items-center justify-center bg-slate-900 p-8 text-center text-white">
              <div className="relative z-10 mx-auto max-w-md space-y-3">
                <Radio className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="text-base font-extrabold sm:text-lg">
                  Siaran Toko Telah Berakhir
                </h3>
                <p className="text-xs text-slate-400">
                  Admin cabang {storeName} saat ini tidak sedang menyiarkan
                  siaran kamera langsung.
                </p>
                <div className="pt-2">
                  <Link
                    href="/gadget"
                    className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-2 text-xs font-bold text-white shadow-md transition hover:bg-orange-600"
                  >
                    Kembali ke Katalog Produk
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Title, Actions, & Store Info */}
        <div className="shadow-xs rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700 dark:bg-orange-950/60 dark:text-orange-400">
                  Siaran Langsung Toko Cabang
                </span>
                {stream.store?.city && (
                  <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    {stream.store.city}
                  </span>
                )}
              </div>
              <h1 className="text-lg font-black leading-snug text-slate-900 dark:text-white sm:text-xl">
                {stream.title}
              </h1>
              {stream.description && (
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {stream.description}
                </p>
              )}
            </div>

            {/* Like Counter & Heart Button */}
            <div className="flex shrink-0 items-center gap-2 self-start">
              <button
                type="button"
                onClick={handleLike}
                className={`shadow-xs flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition ${
                  liked
                    ? 'border border-red-200 bg-red-50 text-red-600'
                    : 'border border-slate-200 bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600'
                }`}
              >
                <Heart
                  className={`h-4 w-4 ${liked ? 'fill-red-500 text-red-500' : ''}`}
                />
                <span>{likeCount.toLocaleString('id-ID')}</span>
              </button>
            </div>
          </div>

          {/* Store Profile Strip */}
          {stream.store && (
            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/50 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {stream.store.logo ? (
                    <Image
                      src={stream.store.logo}
                      alt={storeName}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <Store className="m-auto h-5 w-5 text-slate-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {storeName}
                    </p>
                    <span className="py-0.2 rounded bg-blue-100 px-1.5 text-[9px] font-extrabold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                      BADAN HUKUM PT
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {stream.store.companyName || 'PT Pengelola Cabang Resmi'} •{' '}
                    {stream.store.city}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/toko/${stream.store.slug}`}
                  className="shadow-2xs rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Kunjungi Toko
                </Link>
                {stream.store.whatsapp && (
                  <a
                    href={`https://wa.me/${stream.store.whatsapp}?text=Halo%20Admin%20${encodeURIComponent(storeName)},%20saya%20nonton%20siaran%20live%20kamera%20di%20Affiliate%20Gadget`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shadow-2xs flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                  >
                    Chat WA
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pinned Products Carousel Strip */}
        {featuredProducts.length > 0 && (
          <div className="shadow-xs space-y-3 rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400">
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Produk Flash Sale Sedang Ditampilkan Toko
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Harga khusus selama siaran live berlangsung • Wajib Asuransi
                    JNE/Gojek
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-[10px] font-bold text-orange-700">
                {featuredProducts.length} Produk
              </span>
            </div>

            <div className="no-scrollbar grid grid-cols-2 gap-3 pt-1 sm:grid-cols-3 lg:grid-cols-4">
              {featuredProducts.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => {
                    setSelectedProduct(prod)
                    setShowProductModal(true)
                  }}
                  className="dark:bg-slate-850 group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-500 hover:shadow-md dark:border-slate-800"
                >
                  <div className="relative mb-2 aspect-square w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                    <Image
                      src={
                        prod.images?.[0] ||
                        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300'
                      }
                      alt={prod.name}
                      fill
                      unoptimized
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute left-1.5 top-1.5 rounded-md bg-red-600 px-1.5 py-0.5 text-[9px] font-extrabold text-white">
                      LIVE DEAL
                    </div>
                  </div>

                  <h4 className="line-clamp-2 text-xs font-bold text-slate-900 group-hover:text-orange-600 dark:text-white">
                    {prod.name}
                  </h4>

                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-xs font-black text-orange-600">
                      Rp {prod.price.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="shadow-2xs mt-2.5 flex w-full items-center justify-center gap-1 rounded-xl bg-orange-500 py-1.5 text-[11px] font-bold text-white transition hover:bg-orange-600"
                  >
                    <ShoppingBag className="h-3 w-3" />
                    Beli Langsung
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Right Column: Clean E-Commerce Live Chat Panel ───────────── */}
      <div className="w-full shrink-0 lg:w-[380px] xl:w-[410px]">
        <div className="flex h-[560px] flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:h-[650px]">
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/60">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Chat Siaran Toko
                </p>
                <p className="text-[10px] text-slate-500">
                  Tanya admin cabang secara real-time
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              <MessageCircle className="h-3 w-3 text-orange-500" />
              {comments.length}
            </div>
          </div>

          {/* Chat Messages Feed */}
          <div
            ref={chatContainerRef}
            className="flex-1 space-y-2.5 overflow-y-auto bg-slate-50/40 p-4 dark:bg-slate-950/30"
          >
            {comments.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
                <MessageCircle className="mb-2 h-8 w-8 text-slate-300" />
                <p className="text-xs font-medium">Belum ada komentar</p>
                <p className="text-[10px] text-slate-400">
                  Jadilah yang pertama bertanya ke admin toko!
                </p>
              </div>
            ) : (
              comments.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${
                    msg.isPinned
                      ? 'shadow-2xs rounded-2xl border border-orange-200 bg-orange-50/90 p-3'
                      : 'shadow-2xs rounded-2xl border border-slate-200/70 bg-white p-2.5'
                  }`}
                >
                  {/* User Avatar */}
                  <div className="relative flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
                    {msg.userAvatar ? (
                      <Image
                        src={msg.userAvatar}
                        alt={msg.userName}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <span>{msg.userName.charAt(0).toUpperCase()}</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[11px] font-bold text-slate-900 dark:text-white">
                        {msg.userName}
                      </span>
                      {msg.isPinned && (
                        <span className="py-0.2 inline-flex items-center gap-0.5 rounded bg-orange-500 px-1 text-[9px] font-bold text-white">
                          <Pin className="h-2 w-2" />
                          PIN TOKO
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 break-words text-xs leading-relaxed text-slate-700">
                      {msg.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Chat Input Form */}
          <div className="border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            {!session && (
              <div className="mb-2 flex items-center gap-1.5">
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Nama Anda (Guest/Pembeli)..."
                  maxLength={30}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-800 outline-none placeholder:text-slate-400 focus:border-orange-500 focus:bg-white"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && !e.shiftKey && sendMessage()
                }
                placeholder="Tulis komentar atau tanya admin..."
                maxLength={200}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-orange-500 focus:bg-white"
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={!chatInput.trim() || sending}
                className="shadow-xs flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white transition hover:bg-orange-600 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-slate-400">
              Pesan disiarkan langsung ke admin toko & penonton
            </p>
          </div>
        </div>
      </div>

      {/* Product Highlight Detail Modal */}
      {showProductModal && selectedProduct && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
              <Image
                src={
                  selectedProduct.images?.[0] ||
                  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'
                }
                alt={selectedProduct.name}
                fill
                unoptimized
                className="object-cover"
              />
            </div>

            <div className="mt-4 space-y-2">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {selectedProduct.name}
              </h3>

              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-orange-600">
                  Rp {selectedProduct.price.toLocaleString('id-ID')}
                </span>
                {selectedProduct.originalPrice && (
                  <span className="text-xs text-slate-400 line-through">
                    Rp {selectedProduct.originalPrice.toLocaleString('id-ID')}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-2 text-[11px]">
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-700">
                  ✓ Garansi 30 Hari Tukar Baru
                </span>
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 font-bold text-blue-700">
                  ✓ Gratis Paket Bonus 3-in-1
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="flex-1 rounded-2xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
              >
                Tutup
              </button>
              <Link
                href={`/gadget/${selectedProduct.id}`}
                className="flex-1 rounded-2xl bg-orange-500 py-2.5 text-center text-xs font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600"
              >
                Beli Sekarang
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
