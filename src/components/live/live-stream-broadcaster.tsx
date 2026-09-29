'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Radio,
  StopCircle,
  Plus,
  Trash2,
  ShoppingBag,
  Copy,
  CheckCheck,
  Eye,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Package,
  Star,
  X,
} from 'lucide-react'
import { useSession } from 'next-auth/react'

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
  streamUrl: string
}

export function LiveStreamBroadcaster() {
  const { data: session } = useSession()
  const [step, setStep] = useState<'idle' | 'setup' | 'live'>('idle')
  const [streams, setStreams] = useState<LiveStreamData[]>([])
  const [activeStream, setActiveStream] = useState<LiveStreamData | null>(null)
  const [products, setProducts] = useState<StoreProduct[]>([])
  const [highlightedProductIds, setHighlightedProductIds] = useState<string[]>(
    []
  )
  const [loading, setLoading] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [viewerCount, setViewerCount] = useState(0)
  const sseRef = useRef<EventSource | null>(null)

  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    streamUrl: '',
    coverImage: '',
  })

  // Load existing streams for this store
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/live-streams?limit=5')
        const data = await res.json()
        if (data.success) {
          const myStreams = data.data.filter(
            (s: any) => s.status === 'LIVE' || s.status === 'SCHEDULED'
          )
          setStreams(myStreams)

          // Auto-resume if there's already a LIVE stream
          const live = data.data.find((s: any) => s.status === 'LIVE')
          if (live) {
            setActiveStream(live)
            setHighlightedProductIds(live.featuredProductIds || [])
            setViewerCount(live.viewerCount || 0)
            setStep('live')
            connectSSE(live.id)
          }
        }
      } catch (e) {
        console.error(e)
      }
    }
    load()
    return () => {
      sseRef.current?.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load store products for highlighting
  useEffect(() => {
    async function loadProducts() {
      setLoadingProducts(true)
      try {
        const res = await fetch('/api/admin/products?limit=50&page=1')
        const data = await res.json()
        if (data.success && data.data) {
          setProducts(data.data.products || data.data || [])
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingProducts(false)
      }
    }
    loadProducts()
  }, [])

  const connectSSE = useCallback((streamId: string) => {
    if (sseRef.current) sseRef.current.close()
    const es = new EventSource(`/api/live-streams/${streamId}/chat`)
    sseRef.current = es
    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data)
        if (payload.type === 'viewers') setViewerCount(payload.count || 0)
      } catch {
        /* ignore */
      }
    }
  }, [])

  const handleCreateAndGoLive = async () => {
    if (!form.title.trim()) {
      setError('Judul live harus diisi')
      return
    }
    if (!form.streamUrl.trim()) {
      setError('URL stream harus diisi (YouTube Live / Mux / HLS URL)')
      return
    }
    setLoading(true)
    setError('')
    try {
      // 1. Create stream
      const createRes = await fetch('/api/live-streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          coverImage: form.coverImage || null,
        }),
      })
      const createData = await createRes.json()
      if (!createData.success) throw new Error(createData.error)

      const streamId = createData.data.id

      // 2. Set streamUrl & go LIVE immediately
      const liveRes = await fetch(`/api/live-streams/${streamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'LIVE',
          streamUrl: form.streamUrl,
          featuredProductIds: highlightedProductIds,
        }),
      })
      const liveData = await liveRes.json()
      if (!liveData.success) throw new Error(liveData.error)

      setActiveStream({ ...createData.data, ...liveData.data })
      setStep('live')
      connectSSE(streamId)
    } catch (e: any) {
      setError(e.message || 'Gagal memulai live')
    } finally {
      setLoading(false)
    }
  }

  const handleStopLive = async () => {
    if (!activeStream) return
    if (!confirm('Yakin ingin mengakhiri siaran live?')) return
    setLoading(true)
    try {
      await fetch(`/api/live-streams/${activeStream.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ENDED' }),
      })
      sseRef.current?.close()
      setActiveStream(null)
      setStep('idle')
      setHighlightedProductIds([])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateHighlights = async (productIds: string[]) => {
    if (!activeStream) return
    try {
      await fetch(`/api/live-streams/${activeStream.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featuredProductIds: productIds }),
      })
      setHighlightedProductIds(productIds)
    } catch (e) {
      console.error(e)
    }
  }

  const toggleProduct = (productId: string) => {
    const isSelected = highlightedProductIds.includes(productId)
    const next = isSelected
      ? highlightedProductIds.filter((id) => id !== productId)
      : [...highlightedProductIds, productId].slice(0, 5) // Max 5 highlighted
    handleUpdateHighlights(next)
  }

  const copyLiveLink = () => {
    if (!activeStream) return
    const url = `${window.location.origin}/live/${activeStream.id}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ────────────────────────────────────────────────────────────
  // IDLE STATE
  // ────────────────────────────────────────────────────────────
  if (step === 'idle') {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900 p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
              <Radio className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Live Shopping Toko Anda
              </h2>
              <p className="text-xs text-slate-400">
                Mulai siaran dan tampilkan produk ke pembeli
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep('setup')}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/30 transition hover:bg-red-700"
          >
            <Radio className="h-4 w-4" />
            Mulai Live Sekarang
          </button>
        </div>

        {/* Existing streams */}
        {streams.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400">
              Live Terjadwal / Aktif
            </p>
            {streams.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-slate-700/60 bg-slate-900 p-3"
              >
                <div>
                  <p className="text-xs font-bold text-white">{s.title}</p>
                  <p className="text-[10px] text-slate-500">{s.status}</p>
                </div>
                <Link
                  href={`/live/${s.id}`}
                  className="flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-[11px] font-bold text-slate-300 hover:bg-slate-700"
                  target="_blank"
                >
                  <ExternalLink className="h-3 w-3" />
                  Lihat
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ────────────────────────────────────────────────────────────
  // SETUP STATE
  // ────────────────────────────────────────────────────────────
  if (step === 'setup') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Setup Live Streaming</h2>
          <button
            type="button"
            onClick={() => setStep('idle')}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-700/60 bg-slate-900 p-5">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-300">
              Judul Live <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="Contoh: Flash Sale iPhone 15 Pro Max — Diskon Hari Ini!"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-orange-500"
            />
          </div>

          {/* Stream URL */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-300">
              URL Stream <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.streamUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, streamUrl: e.target.value }))
              }
              placeholder="https://www.youtube.com/watch?v=... atau HLS URL"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-orange-500"
            />
            <p className="mt-1.5 text-[10px] text-slate-500">
              Gunakan YouTube Live embed URL, Mux Playback URL, atau link HLS
              (.m3u8)
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-300">
              Deskripsi (Opsional)
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Ceritakan tentang live ini..."
              rows={2}
              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-orange-500"
            />
          </div>

          {/* Cover Image */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-300">
              Cover Image URL (Opsional)
            </label>
            <input
              type="text"
              value={form.coverImage}
              onChange={(e) =>
                setForm((f) => ({ ...f, coverImage: e.target.value }))
              }
              placeholder="https://..."
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-orange-500"
            />
          </div>

          {/* Pre-select products to highlight */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">
                Produk yang Akan Ditampilkan (maks. 5)
              </label>
              <span className="text-[10px] text-slate-500">
                {highlightedProductIds.length}/5 dipilih
              </span>
            </div>
            {loadingProducts ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
              </div>
            ) : (
              <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-xl border border-slate-700/60 bg-slate-800/50 p-2">
                {products.slice(0, 20).map((product) => {
                  const isSelected = highlightedProductIds.includes(product.id)
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => toggleProduct(product.id)}
                      disabled={
                        !isSelected && highlightedProductIds.length >= 5
                      }
                      className={`flex w-full items-center gap-2.5 rounded-xl p-2 text-left transition ${
                        isSelected
                          ? 'border border-orange-500/30 bg-orange-500/15'
                          : 'border border-transparent hover:bg-slate-700'
                      } disabled:opacity-40`}
                    >
                      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-slate-700">
                        <Image
                          src={
                            product.images?.[0] ||
                            '/images/banners/samsung-mobile-hero.jpg'
                          }
                          alt={product.name}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-white">
                          {product.name}
                        </p>
                        <p className="text-[10px] text-orange-400">
                          Rp {product.price.toLocaleString('id-ID')}
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCheck className="h-4 w-4 shrink-0 text-orange-400" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleCreateAndGoLive}
            disabled={loading || !form.title.trim() || !form.streamUrl.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/30 transition hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Radio className="h-4 w-4" />
            )}
            {loading ? 'Memulai...' : '🔴 Go Live Sekarang!'}
          </button>
        </div>
      </div>
    )
  }

  // ────────────────────────────────────────────────────────────
  // LIVE STATE
  // ────────────────────────────────────────────────────────────
  if (step === 'live' && activeStream) {
    const liveUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/live/${activeStream.id}`

    return (
      <div className="space-y-4">
        {/* Live Status Bar */}
        <div className="flex items-center justify-between rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
            <span className="text-sm font-black text-red-400">SEDANG LIVE</span>
            <span className="flex items-center gap-1 rounded-full bg-black/30 px-2 py-0.5 text-[11px] text-white">
              <Eye className="h-3 w-3" />
              {viewerCount} penonton
            </span>
          </div>
          <button
            type="button"
            onClick={handleStopLive}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl bg-red-700 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-800 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <StopCircle className="h-3.5 w-3.5" />
            )}
            Akhiri Live
          </button>
        </div>

        {/* Stream Title */}
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900 p-4">
          <p className="text-xs text-slate-400">Judul Live</p>
          <p className="mt-0.5 text-sm font-bold text-white">
            {activeStream.title}
          </p>
        </div>

        {/* Share Live Link */}
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900 p-4">
          <p className="mb-2 text-xs font-bold text-slate-300">
            Link Live untuk Pelanggan
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={liveUrl}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-300 outline-none"
            />
            <button
              type="button"
              onClick={copyLiveLink}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition ${
                copied
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {copied ? (
                <CheckCheck className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
            <Link
              href={liveUrl}
              target="_blank"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-700 text-slate-300 transition hover:bg-slate-600"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Product Highlight Manager */}
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-orange-400" />
              <p className="text-xs font-bold text-white">
                Highlight Produk Live
              </p>
            </div>
            <span className="text-[10px] text-slate-500">
              {highlightedProductIds.length}/5 produk
            </span>
          </div>

          <p className="mb-3 text-[10px] text-slate-500">
            Produk yang dipilih akan muncul di bawah layar saat pelanggan
            menonton live.
          </p>

          <div className="max-h-72 space-y-1.5 overflow-y-auto rounded-xl border border-slate-700/60 bg-slate-800/40 p-2">
            {products.slice(0, 30).map((product) => {
              const isSelected = highlightedProductIds.includes(product.id)
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => toggleProduct(product.id)}
                  disabled={!isSelected && highlightedProductIds.length >= 5}
                  className={`flex w-full items-center gap-2.5 rounded-xl p-2 text-left transition ${
                    isSelected
                      ? 'border border-orange-500/40 bg-orange-500/15'
                      : 'border border-transparent hover:bg-slate-700/80'
                  } disabled:opacity-40`}
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-700">
                    <Image
                      src={
                        product.images?.[0] ||
                        '/images/banners/samsung-mobile-hero.jpg'
                      }
                      alt={product.name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-white">
                      {product.name}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="text-orange-400">
                        Rp {product.price.toLocaleString('id-ID')}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                        {product.rating.toFixed(1)}
                      </span>
                      <span>Stok: {product.stock}</span>
                    </div>
                  </div>
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500'
                        : 'border-slate-600'
                    }`}
                  >
                    {isSelected && (
                      <CheckCheck className="h-3 w-3 text-white" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {highlightedProductIds.length > 0 && (
            <button
              type="button"
              onClick={() => handleUpdateHighlights([])}
              className="mt-2 flex items-center gap-1 text-[10px] text-slate-500 transition hover:text-red-400"
            >
              <Trash2 className="h-3 w-3" />
              Hapus semua highlight
            </button>
          )}
        </div>
      </div>
    )
  }

  return null
}
