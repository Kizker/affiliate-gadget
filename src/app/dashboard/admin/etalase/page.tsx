'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { usePageGuard } from '@/hooks/use-page-guard'
import {
  Search,
  Plus,
  Loader2,
  ExternalLink,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  RotateCcw,
  Sparkles,
  Layers,
} from 'lucide-react'
import { toast } from 'sonner'
import { CustomSelect } from '@/components/ui/custom-select'
import { EtalaseFormModal } from '@/components/admin/etalase-form-modal'

type EtalaseTab = 'ALL' | 'LIVE' | 'HIDDEN'

export default function AdminEtalasePage() {
  const { isLoading: guardLoading, isAllowed } = usePageGuard(
    '/dashboard/admin/etalase'
  )
  const { data: session, status } = useSession()

  const [etalases, setEtalases] = useState<any[]>([])
  const [rawProducts, setRawProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stores, setStores] = useState<
    Array<{ id: string; name: string; city?: string }>
  >([])
  const [selectedStoreId, setSelectedStoreId] = useState<string>('ALL')

  const [activeTab, setActiveTab] = useState<EtalaseTab>('ALL')
  const [search, setSearch] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('ALL')
  const [sortBy, setSortBy] = useState<
    'latest' | 'price_desc' | 'price_asc' | 'stock_desc'
  >('latest')

  const [expandedEtalaseIds, setExpandedEtalaseIds] = useState<
    Record<string, boolean>
  >({})
  const [isEtalaseModalOpen, setIsEtalaseModalOpen] = useState(false)
  const [editingEtalase, setEditingEtalase] = useState<any | null>(null)

  const isStoreAdmin = session?.user?.role === 'STORE_ADMIN'
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'
  const userStoreId = session?.user?.storeId

  useEffect(() => {
    fetch('/api/stores?scoped=true')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setStores(data.data)
          if (isStoreAdmin && userStoreId) {
            setSelectedStoreId(userStoreId)
          }
        }
      })
      .catch((e) => console.error('Failed to load stores:', e))
  }, [isStoreAdmin, userStoreId])

  const fetchData = useCallback(async () => {
    if (status === 'loading') return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', '500')
      params.set('_t', String(Date.now()))

      if (isStoreAdmin && userStoreId) {
        params.set('storeId', userStoreId)
      } else if (selectedStoreId && selectedStoreId !== 'ALL') {
        params.set('storeId', selectedStoreId)
      }

      const [etaRes, prodRes] = await Promise.all([
        fetch(`/api/admin/etalase?${params.toString()}`, {
          cache: 'no-store',
        }),
        fetch(`/api/admin/products?${params.toString()}`, {
          cache: 'no-store',
        }),
      ])

      const etaData = await etaRes.json().catch(() => ({}))
      const prodData = await prodRes.json().catch(() => ({}))

      if (etaRes.ok && Array.isArray(etaData.etalases)) {
        setEtalases(etaData.etalases)
      }
      if (prodRes.ok && Array.isArray(prodData.products)) {
        setRawProducts(prodData.products)
      }
    } catch (e) {
      console.error(e)
      toast.error('Gagal memuat daftar etalase toko')
    } finally {
      setLoading(false)
    }
  }, [selectedStoreId, isStoreAdmin, userStoreId, status])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const currentStoreName = useMemo(() => {
    if (isStoreAdmin) {
      const myStore = stores.find((s) => s.id === userStoreId)
      return myStore ? myStore.name : 'Cabang Toko Anda'
    }
    if (selectedStoreId === 'ALL') {
      return 'Semua Cabang Toko (Konsolidasi)'
    }
    const targetStore = stores.find((s) => s.id === selectedStoreId)
    return targetStore ? targetStore.name : 'Semua Cabang'
  }, [isStoreAdmin, userStoreId, selectedStoreId, stores])

  const tabCounts = useMemo(() => {
    const allCount = etalases.length
    const liveCount = etalases.filter((e) => e.isActive && e.stock > 0).length
    const hiddenCount = etalases.filter(
      (e) => !e.isActive || e.stock <= 0
    ).length
    return { allCount, liveCount, hiddenCount }
  }, [etalases])

  const filteredEtalases = useMemo(() => {
    const filtered = etalases.filter((e) => {
      if (activeTab === 'LIVE' && (!e.isActive || e.stock <= 0)) return false
      if (activeTab === 'HIDDEN' && e.isActive && e.stock > 0) return false
      if (
        selectedBrand !== 'ALL' &&
        e.brand?.toLowerCase() !== selectedBrand.toLowerCase()
      ) {
        return false
      }
      if (search.trim()) {
        const q = search.toLowerCase().trim()
        const matchTitle = e.name?.toLowerCase().includes(q)
        const matchItems =
          Array.isArray(e.etalaseItems) &&
          e.etalaseItems.some(
            (i: any) =>
              i.label?.toLowerCase().includes(q) ||
              i.product?.name?.toLowerCase().includes(q)
          )
        if (!matchTitle && !matchItems) return false
      }
      return true
    })

    return [...filtered].sort((a, b) => {
      if (sortBy === 'price_desc') return (b.price || 0) - (a.price || 0)
      if (sortBy === 'price_asc') return (a.price || 0) - (b.price || 0)
      if (sortBy === 'stock_desc') return (b.stock || 0) - (a.stock || 0)
      return (
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
      )
    })
  }, [etalases, activeTab, selectedBrand, search, sortBy])

  const handleToggleEtalaseActive = async (
    etalaseId: string,
    currentActive: boolean
  ) => {
    try {
      const res = await fetch(`/api/admin/etalase/${etalaseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      })
      if (!res.ok) throw new Error('Gagal memperbarui status etalase')
      toast.success(
        !currentActive
          ? 'Etalase diaktifkan ke halaman depan!'
          : 'Etalase disembunyikan dari halaman depan.'
      )
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status etalase')
    }
  }

  const handleSetEtalaseCoverProduct = async (
    etalaseId: string,
    productId: string
  ) => {
    try {
      const res = await fetch(`/api/admin/etalase/${etalaseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coverProductId: productId,
          customCoverImage: null,
        }),
      })
      if (!res.ok) throw new Error('Gagal mengatur cover etalase')
      toast.success('Barang berhasil dijadikan Cover Etalase!')
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah cover etalase')
    }
  }

  const handleDeleteEtalase = async (eta: any) => {
    try {
      const res = await fetch(`/api/admin/etalase/${eta.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Gagal menghapus etalase')
      toast.success(`Etalase "${eta.name}" berhasil dihapus`)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus etalase')
    }
  }

  const brandsList = [
    'ALL',
    'Samsung',
    'Apple',
    'Xiaomi',
    'ASUS',
    'Vivo',
    'Oppo',
    'Realme',
  ]

  if (guardLoading || !isAllowed) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-24 text-slate-900 dark:text-slate-100">
      {/* 1. Header: Judul Etalase Toko + Nama Cabang + Tombol Buat Etalase */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Etalase Toko
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Mengelola:</span>
            {isSuperAdmin ? (
              <div className="w-56">
                <CustomSelect
                  value={selectedStoreId}
                  onChange={(val) => setSelectedStoreId(val)}
                  options={[
                    { value: 'ALL', label: 'Semua Cabang Toko (Konsolidasi)' },
                    ...stores.map((s) => ({
                      value: s.id,
                      label: `${s.name} ${s.city ? `(${s.city})` : ''}`,
                    })),
                  ]}
                  size="sm"
                />
              </div>
            ) : (
              <span className="font-semibold text-orange-600 dark:text-orange-400">
                {currentStoreName}
              </span>
            )}
            <span>•</span>
            <span>
              {filteredEtalases.length} Etalase ditampilkan di halaman depan
            </span>
          </div>
        </div>

        {/* Tombol Utama: Buat Etalase Baru */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingEtalase(null)
              setIsEtalaseModalOpen(true)
            }}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/20 transition hover:bg-orange-600 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Buat Etalase Baru</span>
          </button>
        </div>
      </div>

      {/* 2. Tab Navigasi Etalase: Semua, Live, Disembunyikan */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={`relative min-h-[44px] shrink-0 px-4 py-2.5 text-xs font-bold transition ${
            activeTab === 'ALL'
              ? 'border-b-2 border-orange-500 text-orange-600 dark:text-orange-400'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <span>Semua Etalase</span>
          <span
            className={`ml-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              activeTab === 'ALL'
                ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {tabCounts.allCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('LIVE')}
          className={`relative min-h-[44px] shrink-0 px-4 py-2.5 text-xs font-bold transition ${
            activeTab === 'LIVE'
              ? 'border-b-2 border-orange-500 text-orange-600 dark:text-orange-400'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <span>Live di Depan</span>
          <span
            className={`ml-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              activeTab === 'LIVE'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {tabCounts.liveCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('HIDDEN')}
          className={`relative min-h-[44px] shrink-0 px-4 py-2.5 text-xs font-bold transition ${
            activeTab === 'HIDDEN'
              ? 'border-b-2 border-orange-500 text-orange-600 dark:text-orange-400'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <span>Disembunyikan / Habis</span>
          <span
            className={`ml-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              activeTab === 'HIDDEN'
                ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {tabCounts.hiddenCount}
          </span>
        </button>
      </div>

      {/* 3. Search & Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari judul etalase atau nama barang di dalamnya..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="focus:outline-hidden w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-9 text-xs font-medium text-slate-900 transition focus:border-orange-500 focus:bg-white dark:border-slate-800 dark:bg-slate-800/50 dark:text-white"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="w-36">
            <CustomSelect
              value={selectedBrand}
              onChange={(val) => setSelectedBrand(val)}
              options={brandsList.map((b) => ({
                value: b,
                label: b === 'ALL' ? 'Semua Merek' : b,
              }))}
              size="sm"
            />
          </div>

          <div className="w-44">
            <CustomSelect
              value={sortBy}
              onChange={(val) => setSortBy(val as any)}
              options={[
                { value: 'latest', label: 'Urutan Terbaru' },
                { value: 'price_asc', label: 'Harga Terendah' },
                { value: 'price_desc', label: 'Harga Tertinggi' },
                { value: 'stock_desc', label: 'Stok Terbanyak' },
              ]}
              size="sm"
            />
          </div>

          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="flex min-h-[40px] w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
            title="Muat Ulang Etalase"
          >
            <RotateCcw
              className={`h-4 w-4 ${loading ? 'animate-spin text-orange-500' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* 4. Daftar Etalase Toko */}
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : filteredEtalases.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Belum ada Etalase yang sesuai filter
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Buat Etalase baru untuk menggabungkan beberapa barang sebagai media
            pancingan &amp; promosi di halaman depan.
          </p>
          <button
            type="button"
            onClick={() => {
              setEditingEtalase(null)
              setIsEtalaseModalOpen(true)
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-orange-600"
          >
            <Plus className="h-4 w-4" />
            <span>Buat Etalase Baru</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Header Row Etalase Desktop */}
          <div className="hidden grid-cols-12 items-center gap-3 rounded-xl bg-slate-100/90 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/80 dark:text-slate-400 md:grid">
            <div className="col-span-5">Cover &amp; Judul Etalase Depan</div>
            <div className="col-span-3">Harga Tampilan &amp; Mode</div>
            <div className="col-span-1 text-center">Isi &amp; Stok</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-2 text-right">Aksi Etalase</div>
          </div>

          {filteredEtalases.map((eta) => {
            const isExp = Boolean(expandedEtalaseIds[eta.id])
            const coverImg =
              eta.images?.[0] ||
              'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80'

            return (
              <div
                key={eta.id}
                className="shadow-2xs overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Baris Utama Etalase */}
                <div className="grid grid-cols-1 items-center gap-3 p-4 md:grid-cols-12">
                  {/* Kolom 1: Cover Image + Judul Etalase */}
                  <div className="col-span-1 flex items-start gap-3 md:col-span-5">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700">
                      <img
                        src={coverImg}
                        alt={eta.name}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute inset-x-0 bottom-0 bg-black/65 py-0.5 text-center text-[8.5px] font-bold text-white">
                        {eta.customCoverImage ? 'Cover Kustom' : 'Cover Produk'}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-md bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600 dark:bg-orange-950/40 dark:text-orange-300">
                          {eta.productCount} Barang di Etalase
                        </span>
                        {eta.store?.name && (
                          <span className="truncate text-[10px] text-slate-400">
                            • {eta.store.name}
                          </span>
                        )}
                      </div>

                      <p className="line-clamp-2 text-xs font-bold leading-snug text-slate-900 dark:text-white sm:text-sm">
                        {eta.name}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedEtalaseIds((prev) => ({
                            ...prev,
                            [eta.id]: !prev[eta.id],
                          }))
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:underline dark:text-orange-400"
                      >
                        <span>
                          {isExp
                            ? 'Tutup Daftar Barang'
                            : `Lihat & Pilih Cover dari ${eta.productCount} Barang`}
                        </span>
                        {isExp ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Kolom 2: Harga Tampilan & Mode */}
                  <div className="col-span-1 md:col-span-3">
                    <div className="text-sm font-black text-orange-600 dark:text-orange-400">
                      Rp {(eta.price || 0).toLocaleString('id-ID')}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {eta.priceMode === 'CUSTOM'
                          ? 'Harga Sendiri (Kustom)'
                          : eta.priceMode === 'COVER_PRODUCT'
                            ? 'Ikut Barang Cover'
                            : 'Otomatis Termurah'}
                      </span>
                      {eta.minPrice !== eta.maxPrice && (
                        <span>
                          (Rentang: Rp {eta.minPrice.toLocaleString('id-ID')} -{' '}
                          {eta.maxPrice.toLocaleString('id-ID')})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Kolom 3: Total Stok */}
                  <div className="col-span-1 text-left md:col-span-1 md:text-center">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {eta.stock} Unit
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      Terjual {eta.soldCount || 0}
                    </span>
                  </div>

                  {/* Kolom 4: Status Live / Hidden */}
                  <div className="col-span-1 md:col-span-1 md:text-center">
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleEtalaseActive(eta.id, eta.isActive)
                      }
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold transition ${
                        eta.isActive
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {eta.isActive ? (
                        <>
                          <Eye className="h-3 w-3" />
                          <span>Live</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3" />
                          <span>Nonaktif</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Kolom 5: Aksi Etalase */}
                  <div className="col-span-1 flex items-center justify-end gap-1.5 md:col-span-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEtalase(eta)
                        setIsEtalaseModalOpen(true)
                      }}
                      className="rounded-xl border border-orange-200 bg-orange-50/70 px-3 py-1.5 text-xs font-bold text-orange-700 transition hover:bg-orange-100 dark:border-orange-900/50 dark:bg-orange-950/40 dark:text-orange-300"
                    >
                      Atur Cover &amp; Isi
                    </button>

                    <Link
                      href={`/gadget/${eta.id}`}
                      target="_blank"
                      className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:hover:bg-slate-800"
                      title="Lihat Etalase di Web Publik"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDeleteEtalase(eta)}
                      className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700"
                      title="Hapus Etalase"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Accordion: Daftar Produk di Dalam Etalase & Pilih Cover 1-Klik */}
                {isExp && Array.isArray(eta.etalaseItems) && (
                  <div className="border-t border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                    <div className="mb-2.5 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        Daftar Barang di Dalam Etalase (
                        {eta.etalaseItems.length} Tipe)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingEtalase(eta)
                          setIsEtalaseModalOpen(true)
                        }}
                        className="font-bold text-orange-600 hover:underline"
                      >
                        + Tambah / Kurangi Barang di Etalase Ini
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {eta.etalaseItems.map((item: any) => {
                        const isCover = eta.coverProductId === item.productId
                        const pImg =
                          item.product?.images?.[0] ||
                          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&q=80'

                        return (
                          <div
                            key={item.id || item.productId}
                            className={`flex items-center justify-between gap-2.5 rounded-xl border bg-white p-2.5 text-xs dark:bg-slate-900 ${
                              isCover
                                ? 'border-orange-500 ring-1 ring-orange-500/30'
                                : 'border-slate-200/80 dark:border-slate-800'
                            }`}
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-2.5">
                              <img
                                src={pImg}
                                alt={item.label}
                                className="h-10 w-10 shrink-0 rounded-lg border border-slate-100 object-cover"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-bold text-slate-900 dark:text-white">
                                  {item.label}
                                </p>
                                <p className="truncate text-[10px] text-slate-500">
                                  Rp{' '}
                                  {(item.minPrice || 0).toLocaleString('id-ID')}{' '}
                                  • Stok: {item.totalStock}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                handleSetEtalaseCoverProduct(
                                  eta.id,
                                  item.productId
                                )
                              }
                              className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
                                isCover
                                  ? 'bg-orange-500 text-white'
                                  : 'border border-slate-200 bg-slate-50 text-slate-700 hover:border-orange-400 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {isCover ? '★ Cover Aktif' : 'Jadikan Cover'}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Buat / Atur Cover Etalase */}
      <EtalaseFormModal
        isOpen={isEtalaseModalOpen}
        onClose={() => {
          setIsEtalaseModalOpen(false)
          setEditingEtalase(null)
        }}
        onSuccess={() => {
          fetchData()
        }}
        editingEtalase={editingEtalase}
        availableProducts={rawProducts}
        storeId={isStoreAdmin && userStoreId ? userStoreId : selectedStoreId}
        stores={stores}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  )
}
