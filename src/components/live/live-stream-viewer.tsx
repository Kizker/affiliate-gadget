'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Radio,
  Users,
  Send,
  Heart,
  ShoppingBag,
  X,
  Store,
  MapPin,
  ChevronRight,
  Wifi,
  Shield,
  Gift,
  Eye,
} from 'lucide-react'
import { useSession } from 'next-auth/react'

interface Product {
  id: string
  name: string
  price: number
  originalPrice: number | null
  images: string[]
  brand: string | null
  stock: number
  rating: number
  warrantyDays: number
}

interface ChatMessage {
  id: string
  userName: string
  userAvatar: string | null
  message: string
  isPinned: boolean
  createdAt: string
}

interface LiveStream {
  id: string
  title: string
  description: string | null
  coverImage: string | null
  streamUrl: string
  status: string
  viewerCount: number
  startedAt: string | null
  featuredProductIds: string[]
  featuredProducts: Product[]
  store: {
    id: string
    name: string
    companyName: string
    slug: string
    logo: string | null
    city: string
    whatsapp: string | null
  } | null
  host: { id: string; name: string | null; image: string | null } | null
  comments: ChatMessage[]
}

interface LiveStreamViewerProps {
  streamId: string
}

export function LiveStreamViewer({ streamId }: LiveStreamViewerProps) {
  const { data: session } = useSession()
  const [stream, setStream] = useState<LiveStream | null>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [sending, setSending] = useState(false)
  const [viewerCount, setViewerCount] = useState(0)
  const [likeCount, setLikeCount] = useState(0)
  const [liked, setLiked] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const chatBottomRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const sseRef = useRef<EventSource | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Load stream data
  useEffect(() => {
    async function loadStream() {
      try {
        const res = await fetch(`/api/live-streams/${streamId}`)
        const data = await res.json()
        if (data.success) {
          setStream(data.data)
          setMessages(data.data.comments || [])
          setViewerCount(data.data.viewerCount || 1)
          setLikeCount(Math.floor(Math.random() * 2400 + 300))
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadStream()
  }, [streamId])

  // SSE real-time chat
  useEffect(() => {
    const es = new EventSource(`/api/live-streams/${streamId}/chat`)
    sseRef.current = es

    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data)
        if (payload.type === 'chat') {
          setMessages((prev) => [...prev.slice(-199), payload.data])
        } else if (payload.type === 'viewers') {
          setViewerCount(payload.count || 1)
        } else if (payload.type === 'product_highlight') {
          // Re-fetch stream to get updated featured products
          fetch(`/api/live-streams/${streamId}`)
            .then((r) => r.json())
            .then((d) => {
              if (d.success) {
                setStream((prev) =>
                  prev
                    ? { ...prev, featuredProducts: d.data.featuredProducts }
                    : prev
                )
              }
            })
        }
      } catch {
        /* ignore parse errors */
      }
    }

    return () => {
      es.close()
      sseRef.current = null
    }
  }, [streamId])

  // Auto-scroll chat
  useEffect(() => {
    const el = chatBottomRef.current
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Poll viewer count every 15s
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`/api/live-streams/${streamId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success) {
            setViewerCount(Math.max(d.data.viewerCount || 1, viewerCount))
          }
        })
        .catch(() => {})
    }, 15000)
    return () => clearInterval(interval)
  }, [streamId, viewerCount])

  const sendMessage = useCallback(async () => {
    if (!chatInput.trim() || sending) return
    setSending(true)
    const name = session?.user?.name || 'Penonton'
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
      console.error(e)
    } finally {
      setSending(false)
    }
  }, [chatInput, sending, session, streamId])

  const handleLike = () => {
    if (!liked) {
      setLiked(true)
      setLikeCount((c) => c + 1)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-red-500" />
          <p className="text-sm text-slate-400">Memuat live stream...</p>
        </div>
      </div>
    )
  }

  if (!stream) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <Radio className="h-12 w-12 text-slate-600" />
        <p className="text-slate-400">Live stream tidak ditemukan</p>
        <Link
          href="/live"
          className="rounded-xl bg-orange-500 px-5 py-2 text-sm font-bold text-white hover:bg-orange-600"
        >
          Lihat Live Lainnya
        </Link>
      </div>
    )
  }

  const isLive = stream.status === 'LIVE'
  const storeName =
    stream.store?.name?.replace('Affiliate Gadget - ', '') || 'Affiliate Gadget'

  // Detect if streamUrl is YouTube/iframe or direct HLS
  const isYoutube =
    stream.streamUrl?.includes('youtube.com') ||
    stream.streamUrl?.includes('youtu.be')
  const isTwitch = stream.streamUrl?.includes('twitch.tv')
  const hasEmbedUrl =
    isYoutube || isTwitch || stream.streamUrl?.includes('iframe')

  const getEmbedUrl = () => {
    if (!stream.streamUrl) return ''
    if (isYoutube) {
      const match =
        stream.streamUrl.match(/[?&]v=([^&]+)/) ||
        stream.streamUrl.match(/youtu\.be\/([^?]+)/)
      const vid = match?.[1]
      return vid
        ? `https://www.youtube.com/embed/${vid}?autoplay=1&mute=0&rel=0`
        : stream.streamUrl
    }
    return stream.streamUrl
  }

  return (
    <div className="flex h-full w-full flex-col lg:flex-row lg:gap-4">
      {/* ── Left: Video Player ─────────────────────── */}
      <div className="flex flex-1 flex-col">
        {/* Video Area */}
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl">
          {isLive && stream.streamUrl && hasEmbedUrl ? (
            <iframe
              ref={iframeRef}
              src={getEmbedUrl()}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : isLive && stream.streamUrl && !hasEmbedUrl ? (
            /* Native HLS via video tag */
            <video
              className="h-full w-full object-cover"
              autoPlay
              playsInline
              controls
              src={stream.streamUrl}
            />
          ) : (
            /* Offline / Scheduled placeholder */
            <div className="flex h-full w-full flex-col items-center justify-center gap-4">
              <Image
                src={
                  stream.coverImage ||
                  stream.store?.logo ||
                  '/images/banners/samsung-campaign-banner.jpg'
                }
                alt={stream.title}
                fill
                unoptimized
                className="object-cover opacity-30"
              />
              <div className="relative z-10 flex flex-col items-center gap-3 text-center">
                <div className="rounded-2xl bg-black/60 px-6 py-4 backdrop-blur-md">
                  <Radio className="mx-auto mb-2 h-10 w-10 text-red-400" />
                  <p className="text-sm font-bold text-white">
                    {stream.status === 'SCHEDULED'
                      ? 'Segera Tayang'
                      : 'Siaran Telah Berakhir'}
                  </p>
                  <p className="mt-1 text-xs text-slate-300">{stream.title}</p>
                </div>
              </div>
            </div>
          )}

          {/* Live Badge */}
          {isLive && (
            <div className="absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              LIVE
            </div>
          )}

          {/* Viewer Count */}
          <div className="absolute right-3 top-3 z-20 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
            <Eye className="h-3 w-3" />
            {viewerCount.toLocaleString('id-ID')}
          </div>
        </div>

        {/* Stream Meta */}
        <div className="mt-3 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-base font-bold text-white sm:text-lg">
                {stream.title}
              </h1>
              {stream.description && (
                <p className="mt-0.5 text-xs text-slate-400">
                  {stream.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleLike}
              className={`flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition ${
                liked
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-slate-800 text-slate-300 hover:bg-red-500/20 hover:text-red-400'
              }`}
            >
              <Heart
                className={`h-4 w-4 ${liked ? 'fill-red-400 text-red-400' : ''}`}
              />
              {likeCount.toLocaleString('id-ID')}
            </button>
          </div>

          {/* Store info */}
          {stream.store && (
            <Link
              href={`/toko/${stream.store.slug}`}
              className="flex items-center gap-3 rounded-xl border border-slate-700/60 bg-slate-800/60 p-3 transition hover:border-slate-600 hover:bg-slate-800"
            >
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-slate-700 bg-slate-700">
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
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">
                  {storeName}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <MapPin className="h-2.5 w-2.5" />
                  {stream.store.city}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />
            </Link>
          )}
        </div>

        {/* Featured Products (Pinned Items visible below video) */}
        {stream.featuredProducts && stream.featuredProducts.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 flex items-center gap-1.5">
              <ShoppingBag className="h-4 w-4 text-orange-400" />
              <span className="text-xs font-bold text-orange-400">
                Produk yang Ditawarkan
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {stream.featuredProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => {
                    setSelectedProduct(product)
                    setShowProductModal(true)
                  }}
                  className="group relative flex w-32 shrink-0 flex-col overflow-hidden rounded-2xl border-2 border-orange-500/30 bg-slate-800 transition hover:border-orange-500"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-slate-700">
                    <Image
                      src={
                        product.images?.[0] ||
                        '/images/banners/samsung-mobile-hero.jpg'
                      }
                      alt={product.name}
                      fill
                      unoptimized
                      className="object-cover transition group-hover:scale-105"
                    />
                  </div>
                  <div className="p-1.5">
                    <p className="line-clamp-2 text-[10px] font-semibold leading-tight text-white">
                      {product.name}
                    </p>
                    <p className="mt-0.5 text-[10px] font-black text-orange-400">
                      Rp {product.price.toLocaleString('id-ID')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Right: Chat Panel ─────────────────────── */}
      <div className="flex h-[480px] w-full flex-col overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900 lg:h-auto lg:w-80 xl:w-96">
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-slate-700/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-green-400" />
            <span className="text-sm font-bold text-white">Live Chat</span>
            <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
              {viewerCount} penonton
            </span>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={chatContainerRef}
          className="flex-1 space-y-1.5 overflow-y-auto p-3 text-sm"
        >
          {/* System welcome message */}
          <div className="flex justify-center py-1">
            <span className="rounded-full bg-slate-800 px-3 py-0.5 text-[10px] text-slate-400">
              Selamat datang di live chat!
            </span>
          </div>

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-1.5 ${msg.isPinned ? 'rounded-xl bg-orange-500/10 p-2' : ''}`}
            >
              {/* Avatar */}
              <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-slate-700">
                {msg.userAvatar ? (
                  <Image
                    src={msg.userAvatar}
                    alt={msg.userName}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[9px] font-bold text-slate-300">
                    {msg.userName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-orange-400">
                  {msg.userName}
                </span>
                {msg.isPinned && (
                  <span className="ml-1 rounded-full bg-orange-500/20 px-1.5 text-[9px] font-bold text-orange-400">
                    📌 Pin
                  </span>
                )}
                <p className="mt-0.5 break-words text-[11px] text-slate-200">
                  {msg.message}
                </p>
              </div>
            </div>
          ))}
          <div ref={chatBottomRef} />
        </div>

        {/* Chat Input */}
        <div className="border-t border-slate-700/60 p-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' && !e.shiftKey && sendMessage()
              }
              placeholder="Tulis komentar..."
              maxLength={200}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-500 focus:border-orange-500"
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={!chatInput.trim() || sending}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white transition hover:bg-orange-600 disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
          {!session && (
            <p className="mt-1.5 text-center text-[10px] text-slate-500">
              <Link href="/login" className="text-orange-400 hover:underline">
                Login
              </Link>{' '}
              untuk bergabung dalam chat
            </p>
          )}
        </div>
      </div>

      {/* Product Detail Modal */}
      {showProductModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowProductModal(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-3xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowProductModal(false)}
              className="absolute right-4 top-4 z-20 rounded-full bg-slate-800/80 p-1 text-slate-300 backdrop-blur-sm transition hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-2xl bg-slate-800">
              <Image
                src={
                  selectedProduct.images?.[0] ||
                  '/images/banners/samsung-mobile-hero.jpg'
                }
                alt={selectedProduct.name}
                fill
                unoptimized
                className="object-cover"
              />
            </div>

            <h3 className="text-sm font-bold text-white">
              {selectedProduct.name}
            </h3>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-lg font-black text-white">
                Rp {selectedProduct.price.toLocaleString('id-ID')}
              </span>
              {selectedProduct.originalPrice &&
                selectedProduct.originalPrice > selectedProduct.price && (
                  <span className="text-xs text-slate-500 line-through">
                    Rp {selectedProduct.originalPrice.toLocaleString('id-ID')}
                  </span>
                )}
            </div>

            <div className="mt-2 flex gap-2 text-[10px]">
              <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-green-400">
                <Shield className="h-3 w-3" />
                Garansi {selectedProduct.warrantyDays} Hari
              </span>
              <span className="flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-blue-400">
                <Gift className="h-3 w-3" />
                Bonus 3-in-1
              </span>
            </div>

            <Link
              href={`/gadget/${selectedProduct.id}`}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-xl shadow-orange-500/30 hover:bg-orange-600"
            >
              <ShoppingBag className="h-4 w-4" />
              Beli Sekarang
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
