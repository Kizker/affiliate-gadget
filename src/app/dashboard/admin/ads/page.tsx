'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Sparkles,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Trash2,
  Edit,
  Store,
  Layers,
  Smartphone,
  Tag,
  AlertTriangle,
  Loader2,
  ArrowUpRight,
  Filter,
  RefreshCw,
  Sliders,
  Check,
  X,
  Calendar,
  Target,
  Upload,
  ImageIcon,
  Package,
} from 'lucide-react'
import { toast } from 'sonner'
import { CustomSelect } from '@/components/ui/custom-select'

interface AdStore {
  id: string
  name: string
  slug: string
  city?: string
  logo?: string
  banner?: string
  companyName?: string
}

interface InternalAdItem {
  id: string
  title: string
  subtitle?: string
  placement:
    | 'HOMEPAGE_HERO'
    | 'PROMOTED_LIST'
    | 'BANNER_SPONSOR'
    | 'SIDEBAR_BANNER'
  imageUrl: string
  targetUrl?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejectionReason?: string | null
  priority: number
  isActive: boolean
  clicks: number
  impressions: number
  startDate: string
  endDate?: string | null
  createdAt: string
  store?: AdStore | null
}

const PRESET_BANNERS = [
  {
    label: 'Samsung Flagship Campaign',
    url: '/images/banners/samsung-campaign-banner.jpg',
    category: 'Platform Resmi',
  },
  {
    label: 'Mobile Hero Banner Special',
    url: '/images/banners/samsung-mobile-hero.jpg',
    category: 'Mobile Promo',
  },
  {
    label: 'Vision AI Super Flagship',
    url: '/images/banners/samsung-vision-ai.jpg',
    category: 'Teknologi AI',
  },
  {
    label: 'Garansi Toko 30 Hari Ganti Unit',
    url: '/images/hero-slide-1.jpg',
    category: 'Garansi Resmi',
  },
  {
    label: 'QC Teknisi & Layanan Toko Cabang',
    url: '/images/hero-slide-2.jpg',
    category: 'Mitra PT',
  },
]

function calculateDurationText(
  startDateStr: string,
  endDateStr?: string | null,
  level?: 'LEVEL_1' | 'LEVEL_2'
): string {
  if (!endDateStr) {
    return level === 'LEVEL_1' ? 'Durasi: 7 Hari' : 'Target Kemunculan Grid'
  }
  const start = new Date(startDateStr)
  const end = new Date(endDateStr)
  const diffDays = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  )
  if (level === 'LEVEL_1') {
    return `Berdasarkan Hari: ${diffDays} Hari`
  }
  return `Target Grid • ${diffDays} Hari`
}

export default function AdsManagementPage() {
  const router = useRouter()
  const { data: session, status: authStatus } = useSession()

  const isSuperAdmin =
    session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'ADMIN'
  const isStoreAdmin = session?.user?.role === 'STORE_ADMIN'

  const [ads, setAds] = useState<InternalAdItem[]>([])
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Filters
  const [activeTab, setActiveTab] = useState<
    'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'
  >('ALL')
  const [placementFilter, setPlacementFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState<InternalAdItem | null>(
    null
  )
  const [rejectionReasonInput, setRejectionReasonInput] = useState('')

  // Modal Ganti Gambar
  const [editingAdForImage, setEditingAdForImage] =
    useState<InternalAdItem | null>(null)
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newImageLabel, setNewImageLabel] = useState('')
  const [changeImageTab, setChangeImageTab] = useState<
    'STORE_BANNER' | 'PRODUCTS' | 'PRESETS' | 'UPLOAD' | 'URL'
  >('PRESETS')
  const [savingImage, setSavingImage] = useState(false)

  // Store profile & catalog photos for banner selector
  const [storeBanner, setStoreBanner] = useState<string | null>(null)
  const [storeProducts, setStoreProducts] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [photoSourceTab, setPhotoSourceTab] = useState<
    'STORE_BANNER' | 'PRODUCTS' | 'PRESETS' | 'UPLOAD' | 'URL'
  >('PRESETS')

  // Form State for New Ad
  const [formData, setFormData] = useState({
    title: '',
    placement: 'HOMEPAGE_HERO' as 'HOMEPAGE_HERO' | 'PROMOTED_LIST',
    imageUrl: '',
    targetUrl: '',
    priority: 0,
    startDate: new Date().toISOString().split('T')[0],
    durationDays: 7,
    targetImpressions: 1000,
    selectedPhotoLabel: '',
  })

  // Load Ads List
  const fetchAds = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (activeTab !== 'ALL') params.set('status', activeTab)
      if (placementFilter !== 'ALL') params.set('placement', placementFilter)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())

      const res = await fetch(`/api/admin/ads?${params.toString()}`)
      const data = await res.json()

      if (data.success) {
        setAds(data.data || [])
        if (data.stats) setStats(data.stats)
      } else {
        toast.error(data.message || 'Gagal mengambil data iklan')
      }
    } catch {
      toast.error('Terjadi kesalahan saat memuat data iklan')
    } finally {
      setLoading(false)
    }
  }, [activeTab, placementFilter, searchQuery])

  // Load store profile & products for banner selection
  useEffect(() => {
    async function loadStoreAssets() {
      try {
        const profileRes = await fetch('/api/admin/profile')
        const profileData = await profileRes.json()
        if (profileData?.store?.banner) {
          setStoreBanner(profileData.store.banner)
          setPhotoSourceTab('STORE_BANNER')
        }

        setLoadingProducts(true)
        const productsRes = await fetch('/api/admin/products?limit=16')
        const productsData = await productsRes.json()
        if (productsData?.products) {
          setStoreProducts(productsData.products)
        }
      } catch (err) {
        console.error('Error fetching assets:', err)
      } finally {
        setLoadingProducts(false)
      }
    }

    if (authStatus === 'authenticated') {
      fetchAds()
      loadStoreAssets()
    }
  }, [authStatus, fetchAds])

  // Compute calculated end date for display
  const computedEndDateStr = useMemo(() => {
    if (!formData.startDate) return ''
    const start = new Date(formData.startDate)
    const end = new Date(
      start.getTime() + (formData.durationDays || 7) * 86400000
    )
    return end.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }, [formData.startDate, formData.durationDays])

  // Handle Approve (Superadmin)
  const handleApprove = async (adId: string) => {
    try {
      setActionLoading(adId)
      const res = await fetch(`/api/admin/ads/${adId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Pengajuan iklan disetujui dan aktif!')
        fetchAds()
      } else {
        toast.error(data.message || 'Gagal menyetujui iklan')
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi')
    } finally {
      setActionLoading(null)
    }
  }

  // Handle Reject (Superadmin)
  const handleRejectSubmit = async () => {
    if (!showRejectModal) return
    try {
      setActionLoading(showRejectModal.id)
      const res = await fetch(`/api/admin/ads/${showRejectModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'REJECTED',
          rejectionReason:
            rejectionReasonInput.trim() ||
            'Tidak memenuhi kualifikasi banner platform',
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Pengajuan iklan telah ditolak')
        setShowRejectModal(null)
        setRejectionReasonInput('')
        fetchAds()
      } else {
        toast.error(data.message || 'Gagal menolak iklan')
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi')
    } finally {
      setActionLoading(null)
    }
  }

  // Handle Toggle Active/Inactive
  const handleToggleActive = async (ad: InternalAdItem) => {
    try {
      setActionLoading(ad.id)
      const res = await fetch(`/api/admin/ads/${ad.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !ad.isActive }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(
          ad.isActive ? 'Iklan dinonaktifkan' : 'Iklan diaktifkan kembali'
        )
        fetchAds()
      } else {
        toast.error(data.message || 'Gagal mengubah status aktif iklan')
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi')
    } finally {
      setActionLoading(null)
    }
  }

  // Handle Delete
  const handleDelete = async (adId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus iklan ini?')) return
    try {
      setActionLoading(adId)
      const res = await fetch(`/api/admin/ads/${adId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Iklan berhasil dihapus')
        fetchAds()
      } else {
        toast.error(data.message || 'Gagal menghapus iklan')
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi')
    } finally {
      setActionLoading(null)
    }
  }

  // Open Change Image Modal
  const handleOpenChangeImage = (ad: InternalAdItem) => {
    setEditingAdForImage(ad)
    setNewImageUrl(ad.imageUrl || ad.store?.banner || '')
    setNewImageLabel('Foto Saat Ini')
    if (storeBanner) {
      setChangeImageTab('STORE_BANNER')
    } else if (storeProducts.length > 0) {
      setChangeImageTab('PRODUCTS')
    } else {
      setChangeImageTab('PRESETS')
    }
  }

  // Save Changed Image
  const handleSaveNewImage = async () => {
    if (!editingAdForImage) return
    if (!newImageUrl.trim()) {
      return toast.error('Pilih foto pengganti terlebih dahulu')
    }

    try {
      setSavingImage(true)
      const res = await fetch(`/api/admin/ads/${editingAdForImage.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: newImageUrl.trim(),
          bannerUrl: newImageUrl.trim(),
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Foto banner iklan berhasil diperbarui!')
        setAds((prev) =>
          prev.map((item) =>
            item.id === editingAdForImage.id
              ? { ...item, imageUrl: newImageUrl.trim() }
              : item
          )
        )
        setEditingAdForImage(null)
        fetchAds()
      } else {
        toast.error(data.message || 'Gagal memperbarui foto iklan')
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi saat menyimpan foto baru')
    } finally {
      setSavingImage(false)
    }
  }

  // Submit New Ad
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      return toast.error('Harap masukkan judul promosi iklan')
    }
    if (!formData.imageUrl.trim()) {
      return toast.error(
        'Harap pilih foto yang ingin ditampilkan sebagai banner'
      )
    }

    try {
      setActionLoading('create')
      const res = await fetch('/api/admin/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          placement: formData.placement,
          imageUrl: formData.imageUrl,
          targetUrl: formData.targetUrl,
          priority: formData.priority,
          startDate: formData.startDate,
          durationDays: formData.durationDays,
          targetImpressions:
            formData.placement === 'PROMOTED_LIST'
              ? formData.targetImpressions
              : undefined,
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(
          isSuperAdmin
            ? 'Iklan berhasil dibuat dan langsung aktif!'
            : 'Pengajuan iklan berhasil dikirim ke Superadmin!'
        )
        setShowCreateModal(false)
        setFormData({
          title: '',
          placement: 'HOMEPAGE_HERO',
          imageUrl: '',
          targetUrl: '',
          priority: 0,
          startDate: new Date().toISOString().split('T')[0],
          durationDays: 7,
          targetImpressions: 1000,
          selectedPhotoLabel: '',
        })
        fetchAds()
      } else {
        toast.error(data.message || 'Gagal membuat iklan')
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi saat mengirim data')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
              <Sparkles className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl">
              {isSuperAdmin
                ? 'Manajemen & Moderasi Iklan Toko'
                : 'Pengajuan & Manajemen Iklan Toko'}
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            {isSuperAdmin
              ? 'Tinjau, setujui, dan kelola slot tayang banner promosi toko cabang di Beranda Mobile & Grid Produk.'
              : 'Ajukan banner promosi toko Anda untuk tampil di carousel teratas mobile (berdasarkan hari) atau diselipkan di antara katalog gadget (berdasarkan kemunculan & hari).'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchAds()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
            />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => {
              if (storeBanner && !formData.imageUrl) {
                setFormData((p) => ({
                  ...p,
                  imageUrl: storeBanner,
                  selectedPhotoLabel: 'Banner Profil Toko',
                }))
              }
              setShowCreateModal(true)
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/20 transition hover:bg-orange-600 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>
              {isSuperAdmin ? 'Buat Iklan Baru' : 'Ajukan Iklan Baru'}
            </span>
          </button>
        </div>
      </div>

      {/* 2. KPI Metrics Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Total Iklan</span>
            <Layers className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {stats.total}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Semua riwayat pengajuan
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
            <span className="text-xs font-semibold">Menunggu Review</span>
            <Clock className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-700 dark:text-amber-300">
            {stats.pending}
          </p>
          <p className="mt-0.5 text-[11px] text-amber-600/80 dark:text-amber-400/70">
            Perlu moderasi Superadmin
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
            <span className="text-xs font-semibold">Disetujui / Aktif</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-700 dark:text-emerald-300">
            {stats.approved}
          </p>
          <p className="mt-0.5 text-[11px] text-emerald-600/80 dark:text-emerald-400/70">
            Tayang di platform publik
          </p>
        </div>

        <div className="rounded-2xl border border-rose-200/80 bg-rose-50/50 p-4 shadow-sm dark:border-rose-900/40 dark:bg-rose-950/20">
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-400">
            <span className="text-xs font-semibold">Ditolak</span>
            <XCircle className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-black text-rose-700 dark:text-rose-300">
            {stats.rejected}
          </p>
          <p className="mt-0.5 text-[11px] text-rose-600/80 dark:text-rose-400/70">
            Memerlukan perbaikan
          </p>
        </div>
      </div>

      {/* 3. Filter & Search Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { key: 'ALL', label: 'Semua Iklan', count: stats.total },
              { key: 'PENDING', label: 'Menunggu', count: stats.pending },
              { key: 'APPROVED', label: 'Disetujui', count: stats.approved },
              { key: 'REJECTED', label: 'Ditolak', count: stats.rejected },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                activeTab === t.key
                  ? 'shadow-xs bg-slate-900 text-white dark:bg-white dark:text-black'
                  : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <span>{t.label}</span>
              <span
                className={`py-0.2 rounded-full px-1.5 text-[10px] ${
                  activeTab === t.key
                    ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari judul atau nama toko..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="w-44 shrink-0">
            <CustomSelect
              value={placementFilter}
              onChange={(val: string) => setPlacementFilter(val)}
              options={[
                { value: 'ALL', label: 'Semua Penempatan' },
                { value: 'HOMEPAGE_HERO', label: 'Level 1: Hero Carousel' },
                { value: 'PROMOTED_LIST', label: 'Level 2: In-Feed Grid' },
              ]}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* 4. Ads List / Grid Cards */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            <span className="text-xs">Memuat daftar iklan...</span>
          </div>
        </div>
      ) : ads.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 p-6 text-center dark:border-slate-800 dark:bg-slate-950/40">
          <Sparkles className="h-8 w-8 text-slate-300 dark:text-slate-700" />
          <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
            Belum Ada Iklan Ditampilkan
          </h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
            {isSuperAdmin
              ? 'Belum ada pengajuan banner promosi dari cabang toko fisik PT.'
              : 'Ajukan banner promosi toko cabang Anda sekarang untuk meningkatkan eksposur penjualan.'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-orange-600"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Ajukan Iklan Pertama</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {ads.map((ad) => {
            const isPending = ad.status === 'PENDING'
            const isApproved = ad.status === 'APPROVED'
            const isRejected = ad.status === 'REJECTED'

            return (
              <div
                key={ad.id}
                className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  {/* Top Placement & Status Badge */}
                  <div className="mb-3 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        ad.placement === 'HOMEPAGE_HERO'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                          : 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400'
                      }`}
                    >
                      <Sparkles className="h-2.5 w-2.5" />
                      {ad.placement === 'HOMEPAGE_HERO'
                        ? 'Level 1: Hero Carousel Mobile'
                        : 'Level 2: In-Feed Grid Produk'}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                        isApproved && ad.isActive
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : isApproved && !ad.isActive
                            ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            : isPending
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                      }`}
                    >
                      {isApproved && ad.isActive
                        ? 'Disetujui & Aktif'
                        : isApproved && !ad.isActive
                          ? 'Non-Aktif'
                          : isPending
                            ? 'Menunggu Review'
                            : 'Ditolak'}
                    </span>
                  </div>

                  {/* Banner Image Visual Preview (Clickable to Change Image) */}
                  <div
                    onClick={() => handleOpenChangeImage(ad)}
                    className="group/banner relative mb-3 aspect-[21/9] w-full cursor-pointer overflow-hidden rounded-2xl border border-slate-100 bg-slate-950 dark:border-slate-800"
                    title="Klik untuk mengganti foto banner"
                  >
                    <img
                      src={
                        ad.imageUrl ||
                        ad.store?.banner ||
                        '/images/banners/samsung-campaign-banner.jpg'
                      }
                      alt={ad.title}
                      className="h-full w-full object-cover transition duration-300 group-hover/banner:scale-105"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Hover Overlay Button to Change Image */}
                    <div className="backdrop-blur-2xs absolute inset-0 flex items-center justify-center gap-1.5 bg-black/55 text-xs font-bold text-white opacity-0 transition duration-200 group-hover/banner:opacity-100">
                      <ImageIcon className="h-4 w-4 text-orange-400" />
                      <span>Klik untuk Ganti Foto Banner</span>
                    </div>

                    <div className="pointer-events-none absolute bottom-2.5 left-3 right-3 text-white">
                      <p className="text-xs font-bold leading-tight drop-shadow-md">
                        {ad.title}
                      </p>
                      <p className="drop-shadow-xs text-[10px] font-medium text-white/80">
                        {ad.store?.name || 'Platform Sponsor'} •{' '}
                        {ad.store?.city || 'Indonesia'}
                      </p>
                    </div>

                    {isSuperAdmin && (
                      <div className="backdrop-blur-xs absolute right-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        Prioritas: {ad.priority}
                      </div>
                    )}
                  </div>

                  {/* Store & Metadata info */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5 truncate">
                        <Store className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="truncate font-semibold text-slate-900 dark:text-white">
                          {ad.store?.name || 'Semua Toko'}
                        </span>
                        {ad.store?.city && (
                          <span className="text-[11px] text-slate-400">
                            ({ad.store.city})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                        <span>{ad.impressions} Views</span>
                        <span>•</span>
                        <span>{ad.clicks} Clicks</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="truncate">
                        Target Link:{' '}
                        <code className="text-slate-600 dark:text-slate-300">
                          {ad.targetUrl ||
                            (ad.store?.slug
                              ? `/toko/${ad.store.slug}`
                              : '/gadget')}
                        </code>
                      </span>
                    </div>

                    {/* Rejection Alert Box */}
                    {isRejected && ad.rejectionReason && (
                      <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50/80 p-2.5 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                        <div>
                          <p className="text-[11px] font-bold">
                            Catatan Penolakan Superadmin:
                          </p>
                          <p className="mt-0.5 text-[11px]">
                            {ad.rejectionReason}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Footer (Clean & Practical: Duration/Target Badges + Controls) */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800/80">
                  <div className="flex items-center gap-2">
                    {ad.placement === 'HOMEPAGE_HERO' ? (
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200/80 bg-blue-50/80 px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {ad.subtitle?.includes('Durasi')
                            ? ad.subtitle
                            : calculateDurationText(
                                ad.startDate,
                                ad.endDate,
                                'LEVEL_1'
                              )}
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200/80 bg-orange-50/80 px-2.5 py-1 text-[11px] font-bold text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300">
                        <Target className="h-3 w-3" />
                        <span>
                          {ad.subtitle?.includes('Target')
                            ? ad.subtitle
                            : calculateDurationText(
                                ad.startDate,
                                ad.endDate,
                                'LEVEL_2'
                              )}
                        </span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenChangeImage(ad)}
                      className="shadow-2xs inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-orange-300 hover:bg-orange-50/60 hover:text-orange-600 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-orange-400"
                      title="Ganti foto banner iklan ini"
                    >
                      <ImageIcon className="h-3.5 w-3.5 text-orange-500" />
                      <span>Ganti Gambar</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Super Admin Approval Actions */}
                    {isSuperAdmin && isPending && (
                      <>
                        <button
                          onClick={() => handleApprove(ad.id)}
                          disabled={actionLoading === ad.id}
                          className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Setujui</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowRejectModal(ad)
                            setRejectionReasonInput('')
                          }}
                          disabled={actionLoading === ad.id}
                          className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Tolak</span>
                        </button>
                      </>
                    )}

                    {/* Toggle Active for Approved */}
                    {isApproved && (
                      <button
                        onClick={() => handleToggleActive(ad)}
                        disabled={actionLoading === ad.id}
                        className={`rounded-xl px-2.5 py-1 text-[11px] font-semibold transition ${
                          ad.isActive
                            ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {ad.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    )}

                    {/* Delete action (Superadmin or Store Admin for pending/rejected) */}
                    {(isSuperAdmin || isPending || isRejected) && (
                      <button
                        onClick={() => handleDelete(ad.id)}
                        disabled={actionLoading === ad.id}
                        className="rounded-xl border border-slate-200 p-1.5 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-800 dark:hover:border-rose-900 dark:hover:bg-rose-950/40"
                        title="Hapus Iklan"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 5. MODAL: AJUKAN IKLAN BARU (DENGAN PEMILIHAN FOTO & OPSI TAYANG LEVEL 1/2) */}
      {showCreateModal && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl [scrollbar-width:thin] dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600">
                  <Sparkles className="h-4 w-4" />
                </span>
                <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
                  {isSuperAdmin
                    ? 'Buat Iklan Promosi'
                    : 'Ajukan Iklan Promosi Toko'}
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-5">
              {/* BAGIAN 1: PEMILIHAN TINGKAT PENEMPATAN */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Pilih Tingkat Penempatan Iklan:
                </label>
                <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <div
                    onClick={() =>
                      setFormData((p) => ({ ...p, placement: 'HOMEPAGE_HERO' }))
                    }
                    className={`cursor-pointer rounded-2xl border p-3.5 transition ${
                      formData.placement === 'HOMEPAGE_HERO'
                        ? 'shadow-xs border-blue-500 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-950/30'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-blue-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                        LEVEL 1 • HEADER
                      </span>
                      <Smartphone className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="mt-2 text-xs font-bold text-slate-900 dark:text-white">
                      Mobile Header Hero Carousel
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                      Tampil di slider banner paling atas beranda mobile.
                      <strong className="mt-1 block text-blue-600 dark:text-blue-400">
                        Pilihan Berdasarkan HARI
                      </strong>
                    </p>
                  </div>

                  <div
                    onClick={() =>
                      setFormData((p) => ({ ...p, placement: 'PROMOTED_LIST' }))
                    }
                    className={`cursor-pointer rounded-2xl border p-3.5 transition ${
                      formData.placement === 'PROMOTED_LIST'
                        ? 'shadow-xs border-orange-500 bg-orange-50/50 dark:border-orange-500 dark:bg-orange-950/30'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-orange-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                        LEVEL 2 • IN-FEED
                      </span>
                      <Layers className="h-4 w-4 text-orange-600" />
                    </div>
                    <p className="mt-2 text-xs font-bold text-slate-900 dark:text-white">
                      In-Feed Grid Produk (Katalog)
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                      Diselipkan di antara etalase kartu produk toko.
                      <strong className="mt-1 block text-orange-600 dark:text-orange-400">
                        Berdasarkan BERAPA BANYAK MUNCUL & HARI
                      </strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* BAGIAN 2: ATURAN PENAYANGAN BERDASARKAN LEVEL */}
              {formData.placement === 'HOMEPAGE_HERO' ? (
                /* LEVEL 1: BERDASARKAN HARI */
                <div className="rounded-2xl border border-blue-200/80 bg-blue-50/50 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800 dark:text-blue-300">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Konfigurasi Level 1: Pilih Durasi Berdasarkan Hari
                    </span>
                  </div>

                  {/* Pilihan Cepat Hari */}
                  <div className="mt-3">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      Pilih Berapa Hari Ingin Tayang:
                    </label>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {[3, 7, 14, 30].map((days) => (
                        <button
                          key={days}
                          type="button"
                          onClick={() =>
                            setFormData((p) => ({ ...p, durationDays: days }))
                          }
                          className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                            formData.durationDays === days
                              ? 'shadow-xs bg-blue-600 text-white'
                              : 'border border-blue-200 bg-white text-blue-700 hover:bg-blue-100/60 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-300'
                          }`}
                        >
                          {days === 7
                            ? '7 Hari (1 Minggu)'
                            : days === 14
                              ? '14 Hari (2 Minggu)'
                              : days === 30
                                ? '30 Hari (1 Bulan)'
                                : `${days} Hari`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Input Jumlah Hari Kustom & Tanggal Mulai */}
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        Atau Masukkan Jumlah Hari Kustom:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={formData.durationDays}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            durationDays: parseInt(e.target.value, 10) || 1,
                          }))
                        }
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        Mulai Tanggal:
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            startDate: e.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Ringkasan Durasi Level 1 */}
                  <div className="mt-3 rounded-xl bg-blue-100/70 p-2.5 text-xs text-blue-900 dark:bg-blue-900/40 dark:text-blue-200">
                    <p className="font-bold">
                      📅 Durasi Penayangan: {formData.durationDays} Hari
                    </p>
                    <p className="mt-0.5 text-[11px] opacity-90">
                      Aktif mulai{' '}
                      <strong>
                        {new Date(formData.startDate).toLocaleDateString(
                          'id-ID',
                          {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          }
                        )}
                      </strong>{' '}
                      hingga <strong>{computedEndDateStr}</strong> di carousel
                      teratas mobile.
                    </p>
                  </div>
                </div>
              ) : (
                /* LEVEL 2: BERDASARKAN BERAPA BANYAK INGIN MUNCUL & BERDASARKAN HARI */
                <div className="rounded-2xl border border-orange-200/80 bg-orange-50/50 p-4 dark:border-orange-900/60 dark:bg-orange-950/20">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-orange-800 dark:text-orange-300">
                    <Target className="h-4 w-4" />
                    <span>
                      Konfigurasi Level 2: Berapa Banyak Ingin Muncul &
                      Berdasarkan Hari
                    </span>
                  </div>

                  {/* Parameter 1: Berapa Banyak Ingin Muncul */}
                  <div className="mt-3">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      1. Berapa kali iklan ingin muncul di sela-sela katalog
                      produk? (Target Tayang):
                    </label>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {[500, 1000, 2500, 5000, 10000].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() =>
                            setFormData((p) => ({
                              ...p,
                              targetImpressions: count,
                            }))
                          }
                          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                            formData.targetImpressions === count
                              ? 'shadow-xs bg-orange-500 text-white'
                              : 'border border-orange-200 bg-white text-orange-700 hover:bg-orange-100/60 dark:border-orange-800 dark:bg-slate-900 dark:text-orange-300'
                          }`}
                        >
                          {Number(count).toLocaleString('id-ID')}x Muncul
                        </button>
                      ))}
                    </div>
                    <div className="mt-2">
                      <input
                        type="number"
                        min="100"
                        step="100"
                        placeholder="Atau ketik target kemunculan kustom..."
                        value={formData.targetImpressions}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            targetImpressions:
                              parseInt(e.target.value, 10) || 500,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white sm:w-64"
                      />
                    </div>
                  </div>

                  {/* Parameter 2: Berdasarkan Hari Juga */}
                  <div className="mt-4 border-t border-orange-200/60 pt-3 dark:border-orange-900/40">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      2. Batas durasi penayangan (Berdasarkan Hari):
                    </label>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {[3, 7, 14, 30].map((days) => (
                        <button
                          key={days}
                          type="button"
                          onClick={() =>
                            setFormData((p) => ({ ...p, durationDays: days }))
                          }
                          className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                            formData.durationDays === days
                              ? 'shadow-xs bg-orange-600 text-white'
                              : 'border border-orange-200 bg-white text-orange-700 hover:bg-orange-100/60 dark:border-orange-800 dark:bg-slate-900 dark:text-orange-300'
                          }`}
                        >
                          {days} Hari
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ringkasan Level 2 */}
                  <div className="mt-3.5 rounded-xl bg-orange-100/70 p-2.5 text-xs text-orange-950 dark:bg-orange-900/40 dark:text-orange-200">
                    <p className="font-bold">
                      🎯 Target:{' '}
                      {Number(formData.targetImpressions).toLocaleString(
                        'id-ID'
                      )}
                      x Kemunculan • 📅 Batas: {formData.durationDays} Hari
                    </p>
                    <p className="mt-0.5 text-[11px] opacity-90">
                      Iklan akan diselipkan di antara grid produk hingga
                      mencapai target{' '}
                      <strong>
                        {Number(formData.targetImpressions).toLocaleString(
                          'id-ID'
                        )}{' '}
                        tayangan
                      </strong>{' '}
                      atau batas waktu <strong>{computedEndDateStr}</strong>{' '}
                      tercapai (mana yang lebih dulu terpenuhi).
                    </p>
                  </div>
                </div>
              )}

              {/* BAGIAN 3: PILIH FOTO APA YANG INGIN DITAMPILKAN SEBAGAI BANNER */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Pilih Foto yang Ingin Ditampilkan Sebagai Banner:{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  {formData.selectedPhotoLabel && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      ✓ Foto Terpilih
                    </span>
                  )}
                </div>

                {/* Tab Pilihan Sumber Foto */}
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2.5 dark:border-slate-800">
                  {storeBanner && (
                    <button
                      type="button"
                      onClick={() => setPhotoSourceTab('STORE_BANNER')}
                      className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition ${
                        photoSourceTab === 'STORE_BANNER'
                          ? 'shadow-xs bg-orange-500 text-white'
                          : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400'
                      }`}
                    >
                      <Store className="h-3 w-3" />
                      <span>Banner Toko</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setPhotoSourceTab('PRODUCTS')}
                    className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition ${
                      photoSourceTab === 'PRODUCTS'
                        ? 'shadow-xs bg-orange-500 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400'
                    }`}
                  >
                    <Package className="h-3 w-3" />
                    <span>Katalog Produk ({storeProducts.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPhotoSourceTab('PRESETS')}
                    className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition ${
                      photoSourceTab === 'PRESETS'
                        ? 'shadow-xs bg-orange-500 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400'
                    }`}
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Preset Banner Promo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPhotoSourceTab('UPLOAD')}
                    className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition ${
                      photoSourceTab === 'UPLOAD'
                        ? 'shadow-xs bg-orange-500 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400'
                    }`}
                  >
                    <Upload className="h-3 w-3" />
                    <span>Upload File</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPhotoSourceTab('URL')}
                    className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition ${
                      photoSourceTab === 'URL'
                        ? 'shadow-xs bg-orange-500 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400'
                    }`}
                  >
                    <ImageIcon className="h-3 w-3" />
                    <span>Input URL</span>
                  </button>
                </div>

                {/* Konten Tab Sumber Foto */}
                <div className="mt-3">
                  {/* TAB 1: BANNER TOKO */}
                  {photoSourceTab === 'STORE_BANNER' && storeBanner && (
                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-500">
                        Pilih foto banner profil toko cabang Anda:
                      </p>
                      <div
                        onClick={() =>
                          setFormData((p) => ({
                            ...p,
                            imageUrl: storeBanner,
                            selectedPhotoLabel: 'Foto Banner Toko',
                          }))
                        }
                        className={`group relative aspect-[21/9] w-full cursor-pointer overflow-hidden rounded-2xl border-2 transition ${
                          formData.imageUrl === storeBanner
                            ? 'border-orange-500 ring-4 ring-orange-500/20'
                            : 'border-slate-200 hover:border-slate-300 dark:border-slate-800'
                        }`}
                      >
                        <img
                          src={storeBanner}
                          alt="Banner Toko"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <span className="rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-slate-900 shadow-md">
                            {formData.imageUrl === storeBanner
                              ? '✓ Banner Toko Terpilih'
                              : 'Klik untuk Memakai Banner Toko'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: DARI KATALOG PRODUK */}
                  {photoSourceTab === 'PRODUCTS' && (
                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-500">
                        Klik salah satu foto produk toko untuk dijadikan banner
                        promosi:
                      </p>
                      {loadingProducts ? (
                        <div className="flex h-24 items-center justify-center">
                          <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                        </div>
                      ) : storeProducts.length === 0 ? (
                        <p className="py-3 text-center text-xs text-slate-400">
                          Belum ada produk dengan foto di katalog toko ini.
                        </p>
                      ) : (
                        <div className="grid max-h-48 grid-cols-3 gap-2 overflow-y-auto pr-1 [scrollbar-width:thin] sm:grid-cols-4">
                          {storeProducts.map((prod) => {
                            const img =
                              prod.images?.[0] ||
                              prod.thumbnail ||
                              '/images/banners/samsung-mobile-hero.jpg'
                            const isSelected = formData.imageUrl === img

                            return (
                              <div
                                key={prod.id}
                                onClick={() =>
                                  setFormData((p) => ({
                                    ...p,
                                    imageUrl: img,
                                    selectedPhotoLabel: `Produk: ${prod.name}`,
                                    targetUrl:
                                      p.targetUrl || `/gadget/${prod.id}`,
                                  }))
                                }
                                className={`cursor-pointer overflow-hidden rounded-xl border p-1.5 transition ${
                                  isSelected
                                    ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500/20 dark:bg-orange-950/30'
                                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                                }`}
                              >
                                <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                                  <img
                                    src={img}
                                    alt={prod.name}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <p className="mt-1 line-clamp-1 text-[10px] font-bold text-slate-900 dark:text-white">
                                  {prod.name}
                                </p>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: PRESET BANNER PROMO */}
                  {photoSourceTab === 'PRESETS' && (
                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-500">
                        Pilih dari koleksi poster promosi gadget resmi:
                      </p>
                      <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto pr-1 [scrollbar-width:thin] sm:grid-cols-3">
                        {PRESET_BANNERS.map((preset, idx) => {
                          const isSelected = formData.imageUrl === preset.url
                          return (
                            <div
                              key={idx}
                              onClick={() =>
                                setFormData((p) => ({
                                  ...p,
                                  imageUrl: preset.url,
                                  selectedPhotoLabel: preset.label,
                                }))
                              }
                              className={`cursor-pointer overflow-hidden rounded-xl border p-1.5 transition ${
                                isSelected
                                  ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500/20 dark:bg-orange-950/30'
                                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                              }`}
                            >
                              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-slate-950">
                                <img
                                  src={preset.url}
                                  alt={preset.label}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <p className="mt-1 line-clamp-1 text-[10px] font-bold text-slate-900 dark:text-white">
                                {preset.label}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: UPLOAD DARI KOMPUTER */}
                  {photoSourceTab === 'UPLOAD' && (
                    <div className="space-y-2">
                      <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6 text-center hover:border-orange-400 hover:bg-orange-50/20 dark:border-slate-800 dark:bg-slate-900">
                        <Upload className="h-6 w-6 text-orange-500" />
                        <span className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                          Pilih Foto Banner dari Komputer
                        </span>
                        <span className="mt-0.5 text-[10px] text-slate-400">
                          Format PNG, JPG, WebP (Maksimal 5MB)
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                return toast.error('Ukuran file maksimal 5MB')
                              }
                              const reader = new FileReader()
                              reader.onload = () => {
                                setFormData((p) => ({
                                  ...p,
                                  imageUrl: reader.result as string,
                                  selectedPhotoLabel: `Upload: ${file.name}`,
                                }))
                                toast.success(
                                  `Foto ${file.name} berhasil dipilih`
                                )
                              }
                              reader.readAsDataURL(file)
                            }
                          }}
                        />
                      </label>
                    </div>
                  )}

                  {/* TAB 5: INPUT URL KUSTOM */}
                  {photoSourceTab === 'URL' && (
                    <div>
                      <input
                        type="text"
                        placeholder="https://... URL gambar banner"
                        value={formData.imageUrl}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            imageUrl: e.target.value,
                            selectedPhotoLabel: 'URL Kustom',
                          }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                      />
                    </div>
                  )}
                </div>

                {/* PRATINJAU FOTO TERPILIH */}
                {formData.imageUrl && (
                  <div className="mt-3.5 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                      <span className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300">
                        Foto Banner Terpilih:{' '}
                        <strong className="text-orange-600 dark:text-orange-400">
                          {formData.selectedPhotoLabel || 'Kustom'}
                        </strong>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((p) => ({
                            ...p,
                            imageUrl: '',
                            selectedPhotoLabel: '',
                          }))
                        }
                        className="text-[10px] text-rose-500 hover:underline"
                      >
                        Hapus Pilihan
                      </button>
                    </div>
                    <div className="relative mt-2 aspect-[21/9] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-950 dark:border-slate-800">
                      <img
                        src={formData.imageUrl}
                        alt="Banner Preview"
                        className="h-full w-full object-cover"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="pointer-events-none absolute bottom-2 left-3 right-3 text-white">
                        <p className="text-xs font-bold leading-tight drop-shadow-md">
                          {formData.title || 'Judul Promosi Iklan'}
                        </p>
                        <p className="text-[10px] text-white/80">
                          {formData.placement === 'HOMEPAGE_HERO'
                            ? `Level 1: Durasi ${formData.durationDays} Hari`
                            : `Level 2: Target ${Number(formData.targetImpressions).toLocaleString('id-ID')}x Muncul • ${formData.durationDays} Hari`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* BAGIAN 4: DETAIL INFORMASI IKLAN */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Judul Promo / Pesan Banner{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Flash Sale Spesial Toko Kami Diskon Hingga 30%"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, title: e.target.value }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {/* Target URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Target Link Navigasi (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Default otomatis ke halaman profil cabang toko (/toko/[slug])"
                  value={formData.targetUrl}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, targetUrl: e.target.value }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {/* Priority (Superadmin only) */}
              {isSuperAdmin && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Prioritas Urutan Tayang (Superadmin: Angka lebih tinggi =
                    lebih awal)
                  </label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        priority: parseInt(e.target.value, 10) || 0,
                      }))
                    }
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              )}

              {/* Tombol Simpan / Kirim */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'create'}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-5 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/20 hover:bg-orange-600 active:scale-95 disabled:opacity-50"
                >
                  {actionLoading === 'create' ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Mengirim...</span>
                    </>
                  ) : (
                    <span>
                      {isSuperAdmin
                        ? 'Terbitkan Iklan'
                        : 'Kirim Pengajuan Iklan'}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: TOLAK PENGAJUAN IKLAN (SUPERADMIN) */}
      {showRejectModal && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-sm font-extrabold text-slate-950 dark:text-white">
                Tolak Pengajuan Iklan
              </h3>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Berikan alasan penolakan agar admin toko dapat memperbaiki materi
              promosi mereka.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Alasan Penolakan:
              </label>
              <textarea
                rows={3}
                placeholder="Contoh: Resolusi banner terlalu pecah atau teks promosi melanggar pedoman toko resmi."
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:border-rose-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowRejectModal(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                disabled={actionLoading === showRejectModal.id}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {actionLoading === showRejectModal.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span>Tolak Pengajuan</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: GANTI FOTO BANNER IKLAN */}
      {editingAdForImage && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl [scrollbar-width:thin] dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600">
                  <ImageIcon className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
                    Ganti Foto Banner Iklan
                  </h3>
                  <p className="line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                    {editingAdForImage.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingAdForImage(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Tab Pilihan Sumber Foto Baru */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Pilih Foto Pengganti Baru:
                </label>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2.5 dark:border-slate-800">
                  {storeBanner && (
                    <button
                      type="button"
                      onClick={() => setChangeImageTab('STORE_BANNER')}
                      className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition ${
                        changeImageTab === 'STORE_BANNER'
                          ? 'shadow-xs bg-orange-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      <Store className="h-3 w-3" />
                      <span>Banner Toko</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setChangeImageTab('PRODUCTS')}
                    className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition ${
                      changeImageTab === 'PRODUCTS'
                        ? 'shadow-xs bg-orange-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    <Package className="h-3 w-3" />
                    <span>Foto Produk Toko ({storeProducts.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChangeImageTab('PRESETS')}
                    className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition ${
                      changeImageTab === 'PRESETS'
                        ? 'shadow-xs bg-orange-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Preset Promo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChangeImageTab('UPLOAD')}
                    className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition ${
                      changeImageTab === 'UPLOAD'
                        ? 'shadow-xs bg-orange-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    <Upload className="h-3 w-3" />
                    <span>Upload File</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChangeImageTab('URL')}
                    className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition ${
                      changeImageTab === 'URL'
                        ? 'shadow-xs bg-orange-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    <ImageIcon className="h-3 w-3" />
                    <span>Input URL</span>
                  </button>
                </div>
              </div>

              {/* Konten Pilihan Foto Pengganti */}
              <div>
                {/* 1. Banner Toko */}
                {changeImageTab === 'STORE_BANNER' && storeBanner && (
                  <div
                    onClick={() => {
                      setNewImageUrl(storeBanner)
                      setNewImageLabel('Banner Profil Toko')
                    }}
                    className={`relative aspect-[21/9] w-full cursor-pointer overflow-hidden rounded-2xl border-2 transition ${
                      newImageUrl === storeBanner
                        ? 'border-orange-500 ring-4 ring-orange-500/20'
                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-800'
                    }`}
                  >
                    <img
                      src={storeBanner}
                      alt="Banner Toko"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <span className="rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-slate-900 shadow-md">
                        {newImageUrl === storeBanner
                          ? '✓ Banner Toko Terpilih'
                          : 'Klik untuk Memakai Banner Toko'}
                      </span>
                    </div>
                  </div>
                )}

                {/* 2. Foto Produk Toko */}
                {changeImageTab === 'PRODUCTS' && (
                  <div>
                    {loadingProducts ? (
                      <div className="flex h-24 items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                      </div>
                    ) : storeProducts.length === 0 ? (
                      <p className="py-3 text-center text-xs text-slate-400">
                        Belum ada foto produk di katalog toko ini.
                      </p>
                    ) : (
                      <div className="grid max-h-48 grid-cols-3 gap-2 overflow-y-auto pr-1 [scrollbar-width:thin] sm:grid-cols-4">
                        {storeProducts.map((prod) => {
                          const img =
                            prod.images?.[0] ||
                            prod.thumbnail ||
                            '/images/banners/samsung-mobile-hero.jpg'
                          const isSelected = newImageUrl === img
                          return (
                            <div
                              key={prod.id}
                              onClick={() => {
                                setNewImageUrl(img)
                                setNewImageLabel(`Produk: ${prod.name}`)
                              }}
                              className={`cursor-pointer overflow-hidden rounded-xl border p-1.5 transition ${
                                isSelected
                                  ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500/20 dark:bg-orange-950/30'
                                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                              }`}
                            >
                              <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                                <img
                                  src={img}
                                  alt={prod.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <p className="mt-1 line-clamp-1 text-[10px] font-bold text-slate-900 dark:text-white">
                                {prod.name}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Preset Platform */}
                {changeImageTab === 'PRESETS' && (
                  <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto pr-1 [scrollbar-width:thin] sm:grid-cols-3">
                    {PRESET_BANNERS.map((preset, idx) => {
                      const isSelected = newImageUrl === preset.url
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setNewImageUrl(preset.url)
                            setNewImageLabel(preset.label)
                          }}
                          className={`cursor-pointer overflow-hidden rounded-xl border p-1.5 transition ${
                            isSelected
                              ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500/20 dark:bg-orange-950/30'
                              : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                          }`}
                        >
                          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-slate-950">
                            <img
                              src={preset.url}
                              alt={preset.label}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <p className="mt-1 line-clamp-1 text-[10px] font-bold text-slate-900 dark:text-white">
                            {preset.label}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* 4. Upload File Komputer */}
                {changeImageTab === 'UPLOAD' && (
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-orange-400 hover:bg-orange-50/20 dark:border-slate-800 dark:bg-slate-950">
                    <Upload className="h-6 w-6 text-orange-500" />
                    <span className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                      Pilih File Foto Baru dari Komputer
                    </span>
                    <span className="mt-0.5 text-[10px] text-slate-400">
                      Format PNG, JPG, WebP (Maksimal 5MB)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            return toast.error('Ukuran file maksimal 5MB')
                          }
                          const reader = new FileReader()
                          reader.onload = () => {
                            setNewImageUrl(reader.result as string)
                            setNewImageLabel(`Upload: ${file.name}`)
                            toast.success(`Foto ${file.name} siap digunakan`)
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                    />
                  </label>
                )}

                {/* 5. Input URL Kustom */}
                {changeImageTab === 'URL' && (
                  <div>
                    <input
                      type="text"
                      placeholder="https://... Masukkan URL gambar banner baru"
                      value={newImageUrl}
                      onChange={(e) => {
                        setNewImageUrl(e.target.value)
                        setNewImageLabel('URL Kustom')
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                )}
              </div>

              {/* Pratinjau Foto Baru yang Dipilih */}
              {newImageUrl && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex items-center justify-between pb-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    <span>
                      Pratinjau Foto Baru:{' '}
                      <strong className="text-orange-600 dark:text-orange-400">
                        {newImageLabel || 'Foto Pengganti'}
                      </strong>
                    </span>
                  </div>
                  <div className="relative aspect-[21/9] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-950 dark:border-slate-800">
                    <img
                      src={newImageUrl}
                      alt="New Preview"
                      className="h-full w-full object-cover"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="pointer-events-none absolute bottom-2 left-3 right-3 text-white">
                      <p className="text-xs font-bold leading-tight drop-shadow-md">
                        {editingAdForImage.title}
                      </p>
                      <p className="text-[10px] text-white/80">
                        {editingAdForImage.store?.name || 'Toko Resmi PT'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingAdForImage(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveNewImage}
                  disabled={savingImage || !newImageUrl.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-5 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/20 hover:bg-orange-600 active:scale-95 disabled:opacity-50"
                >
                  {savingImage ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Menyimpan Foto...</span>
                    </>
                  ) : (
                    <span>Simpan Foto Baru</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
