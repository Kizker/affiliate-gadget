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
  ShoppingBag,
  Globe,
  ShieldCheck,
  Link2,
  Play,
  Video,
  LayoutGrid,
  Timer,
} from 'lucide-react'
import { toast } from 'sonner'
import { CustomSelect } from '@/components/ui/custom-select'
import { usePageGuard } from '@/hooks/use-page-guard'
import { isVideoMedia } from '@/types/ads'

export type AdTargetType =
  | 'STORE'
  | 'STORE_CATALOG'
  | 'PRODUCT'
  | 'ALL_CATALOG'
  | 'SERVICE_LCD'
  | 'WARRANTY'
  | 'CUSTOM'

export interface CurrentStoreInfo {
  id: string
  name: string
  slug: string
  city?: string
  banner?: string | null
}

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
  const { isLoading: guardLoading, isAllowed } = usePageGuard(
    '/dashboard/admin/ads'
  )
  const router = useRouter()
  const { data: session, status: authStatus } = useSession()

  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'
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

  // Real-time Level 1 Exclusive Slot Info
  const [level1Slot, setLevel1Slot] = useState<{
    isOccupied: boolean
    activeAd: {
      id: string
      title: string
      subtitle?: string | null
      startDate: string
      endDate: string | null
      remainingText: string
      remainingDays: number
      store?: {
        id: string
        name: string
        city?: string | null
        slug: string
      } | null
    } | null
  }>({ isOccupied: false, activeAd: null })

  // 2 Tab Utama: Level 1 (Hero Carousel) & Level 2 (In-Feed Grid)
  const [levelFilter, setLevelFilter] = useState<'LEVEL_1' | 'LEVEL_2'>(
    'LEVEL_1'
  )

  // Filters Status (Di dalam Tab yang aktif)
  const [activeTab, setActiveTab] = useState<
    'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'
  >('ALL')
  const [placementFilter, setPlacementFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Helper compute timing & remaining days/hours
  const getAdTimingInfo = useCallback((ad: InternalAdItem) => {
    const now = Date.now()
    const isApproved = ad.status === 'APPROVED'
    const isPending = ad.status === 'PENDING'
    const isRejected = ad.status === 'REJECTED'

    let isExpired = false
    let remainingMs = 0
    let days = 0
    let hours = 0
    let isUrgent = false // < 3 hari
    let remainingText = ''

    if (ad.endDate) {
      const end = new Date(ad.endDate).getTime()
      remainingMs = end - now
      if (remainingMs <= 0) {
        isExpired = true
        remainingText = 'Masa Tayang Habis'
      } else {
        days = Math.floor(remainingMs / (1000 * 60 * 60 * 24))
        hours = Math.floor(
          (remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        )
        isUrgent = days < 3
        if (days > 0) {
          remainingText = `${days} hari ${hours} jam lagi`
        } else if (hours > 0) {
          remainingText = `${hours} jam lagi`
        } else {
          const mins = Math.max(1, Math.floor(remainingMs / (1000 * 60)))
          remainingText = `${mins} menit lagi`
        }
      }
    } else {
      remainingText = 'Aktif Tanpa Batas Waktu'
    }

    const isCurrentlyActive = isApproved && ad.isActive && !isExpired

    return {
      isApproved,
      isPending,
      isRejected,
      isExpired,
      isCurrentlyActive,
      remainingMs,
      days,
      hours,
      isUrgent,
      remainingText,
    }
  }, [])

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState<InternalAdItem | null>(
    null
  )
  const [rejectionReasonInput, setRejectionReasonInput] = useState('')
  const [approveModalAd, setApproveModalAd] = useState<InternalAdItem | null>(
    null
  )
  const [deactivateModalAd, setDeactivateModalAd] =
    useState<InternalAdItem | null>(null)
  const [cancelModalAd, setCancelModalAd] = useState<InternalAdItem | null>(
    null
  )
  const [deleteModalAd, setDeleteModalAd] = useState<InternalAdItem | null>(
    null
  )

  // Modal Ganti Gambar
  const [editingAdForImage, setEditingAdForImage] =
    useState<InternalAdItem | null>(null)
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newImageLabel, setNewImageLabel] = useState('')
  const [editTargetUrl, setEditTargetUrl] = useState('')
  const [changeImageTab, setChangeImageTab] = useState<
    'STORE_BANNER' | 'PRODUCTS' | 'PRESETS' | 'UPLOAD' | 'URL'
  >('PRESETS')
  const [savingImage, setSavingImage] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)

  // Store profile & catalog photos for banner selector
  const [currentStore, setCurrentStore] = useState<CurrentStoreInfo | null>(
    null
  )
  const [allStores, setAllStores] = useState<CurrentStoreInfo[]>([])
  const [storeBanner, setStoreBanner] = useState<string | null>(null)
  const [storeProducts, setStoreProducts] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [photoSourceTab, setPhotoSourceTab] = useState<
    'STORE_BANNER' | 'PRODUCTS' | 'PRESETS' | 'UPLOAD' | 'URL'
  >('PRESETS')

  // Helper compute target URL
  const computeTargetUrl = useCallback(
    (
      type: AdTargetType,
      store?: CurrentStoreInfo | null,
      productId?: string,
      customUrl?: string
    ): string => {
      switch (type) {
        case 'STORE':
          return store?.slug ? `/toko/${store.slug}` : '/toko'
        case 'STORE_CATALOG':
          return store?.id ? `/gadget?store=${store.id}` : '/gadget'
        case 'PRODUCT':
          return productId ? `/gadget/${productId}` : '/gadget'
        case 'ALL_CATALOG':
          return '/gadget'
        case 'SERVICE_LCD':
          return '/servis-lcd'
        case 'WARRANTY':
          return '/garansi'
        case 'CUSTOM':
          return customUrl || ''
        default:
          return store?.slug ? `/toko/${store.slug}` : '/gadget'
      }
    },
    []
  )

  // Form State for New Ad
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    placement: 'HOMEPAGE_HERO' as 'HOMEPAGE_HERO' | 'PROMOTED_LIST',
    imageUrl: '',
    targetType: 'STORE' as AdTargetType,
    targetUrl: '',
    productId: '',
    storeId: '',
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
      const res = await fetch(`/api/admin/ads?placement=ALL`)
      const data = await res.json()

      if (data.success) {
        setAds(data.data || [])
        if (data.stats) setStats(data.stats)
        if (data.level1Slot) setLevel1Slot(data.level1Slot)
      } else {
        toast.error(data.message || 'Gagal mengambil data iklan')
      }
    } catch {
      toast.error('Terjadi kesalahan saat memuat data iklan')
    } finally {
      setLoading(false)
    }
  }, [])

  // 1. Sorted Level 1 Ads (Hero Carousel Antrean: Sedang Tayang di Atas, selanjutnya antrean berikutnya)
  const sortedLevel1Ads = useMemo(() => {
    const rawLevel1 = ads.filter((a) => a.placement === 'HOMEPAGE_HERO')

    const filtered = rawLevel1.filter((ad) => {
      if (activeTab !== 'ALL' && ad.status !== activeTab) return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        ad.title.toLowerCase().includes(q) ||
        (ad.store?.name && ad.store.name.toLowerCase().includes(q))
      )
    })

    return [...filtered].sort((a, b) => {
      const aTiming = getAdTimingInfo(a)
      const bTiming = getAdTimingInfo(b)

      const isAActiveSlot =
        (a as any).isExclusiveLevel1Active ||
        level1Slot.activeAd?.id === a.id ||
        (a.status === 'APPROVED' && a.isActive && !aTiming.isExpired)

      const isBActiveSlot =
        (b as any).isExclusiveLevel1Active ||
        level1Slot.activeAd?.id === b.id ||
        (b.status === 'APPROVED' && b.isActive && !bTiming.isExpired)

      // 1. Iklan video yang SEDANG TAYANG selalu paling atas (#1)
      if (isAActiveSlot && !isBActiveSlot) return -1
      if (!isAActiveSlot && isBActiveSlot) return 1

      // 2. Iklan antrean berikutnya yang akan ditayangkan (Approved tapi menunggu slot)
      const isAApprovedWaiting =
        aTiming.isApproved && !aTiming.isExpired && !isAActiveSlot
      const isBApprovedWaiting =
        bTiming.isApproved && !bTiming.isExpired && !isBActiveSlot
      if (isAApprovedWaiting && !isBApprovedWaiting) return -1
      if (!isAApprovedWaiting && isBApprovedWaiting) return 1
      if (isAApprovedWaiting && isBApprovedWaiting) {
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      }

      // 3. Menunggu Review (PENDING) (antrean moderasi)
      if (aTiming.isPending && !bTiming.isPending) return -1
      if (!aTiming.isPending && bTiming.isPending) return 1
      if (aTiming.isPending && bTiming.isPending) {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }

      // 4. Selesai / Expired / Non-Aktif / Ditolak
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [ads, activeTab, searchQuery, level1Slot.activeAd, getAdTimingInfo])

  // 2. Sorted Level 2 Ads (In-Feed Grid: Mana yang sebentar lagi habis waktu penayangannya di paling atas)
  const sortedLevel2Ads = useMemo(() => {
    const rawLevel2 = ads.filter((a) => a.placement === 'PROMOTED_LIST')

    const filtered = rawLevel2.filter((ad) => {
      if (activeTab !== 'ALL' && ad.status !== activeTab) return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        ad.title.toLowerCase().includes(q) ||
        (ad.store?.name && ad.store.name.toLowerCase().includes(q))
      )
    })

    return [...filtered].sort((a, b) => {
      const aTiming = getAdTimingInfo(a)
      const bTiming = getAdTimingInfo(b)

      // 1. Iklan Aktif: Diurutkan berdasarkan yang sebentar lagi habis (remainingMs terkecil paling atas)
      if (aTiming.isCurrentlyActive && !bTiming.isCurrentlyActive) return -1
      if (!aTiming.isCurrentlyActive && bTiming.isCurrentlyActive) return 1

      if (aTiming.isCurrentlyActive && bTiming.isCurrentlyActive) {
        const aRemaining = a.endDate
          ? aTiming.remainingMs
          : Number.MAX_SAFE_INTEGER
        const bRemaining = b.endDate
          ? bTiming.remainingMs
          : Number.MAX_SAFE_INTEGER
        return aRemaining - bRemaining // ASCENDING: soonest to expire first!
      }

      // 2. Menunggu Review (PENDING)
      if (aTiming.isPending && !bTiming.isPending) return -1
      if (!aTiming.isPending && bTiming.isPending) return 1
      if (aTiming.isPending && bTiming.isPending) {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }

      // 3. Expired / Inactive / Ditolak
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [ads, activeTab, searchQuery, getAdTimingInfo])

  // Pre-calculate Level 1 queue indexes for waiting ads
  const waitingLevel1Ads = useMemo(() => {
    return sortedLevel1Ads.filter((a) => {
      const timing = getAdTimingInfo(a)
      const isActiveSlot =
        (a as any).isExclusiveLevel1Active ||
        level1Slot.activeAd?.id === a.id ||
        (a.status === 'APPROVED' && a.isActive && !timing.isExpired)
      return (
        !isActiveSlot &&
        (a.status === 'APPROVED' || a.status === 'PENDING') &&
        !timing.isExpired
      )
    })
  }, [sortedLevel1Ads, level1Slot.activeAd, getAdTimingInfo])

  // List iklan tab aktif
  const currentTabAds =
    levelFilter === 'LEVEL_1' ? sortedLevel1Ads : sortedLevel2Ads

  // Counter data per tab
  const allLevel1Count = useMemo(
    () => ads.filter((a) => a.placement === 'HOMEPAGE_HERO').length,
    [ads]
  )
  const allLevel2Count = useMemo(
    () => ads.filter((a) => a.placement === 'PROMOTED_LIST').length,
    [ads]
  )
  const pendingLevel1Count = useMemo(
    () =>
      ads.filter(
        (a) => a.placement === 'HOMEPAGE_HERO' && a.status === 'PENDING'
      ).length,
    [ads]
  )
  const urgentLevel2Count = useMemo(() => {
    const now = Date.now()
    return ads.filter((a) => {
      if (
        a.placement !== 'PROMOTED_LIST' ||
        a.status !== 'APPROVED' ||
        !a.isActive
      )
        return false
      if (!a.endDate) return false
      const diff = new Date(a.endDate).getTime() - now
      return diff > 0 && diff < 3 * 86400000 // < 3 hari
    }).length
  }, [ads])
  const activeLevel2Count = useMemo(() => {
    const now = Date.now()
    return ads.filter((a) => {
      if (
        a.placement !== 'PROMOTED_LIST' ||
        a.status !== 'APPROVED' ||
        !a.isActive
      )
        return false
      return !a.endDate || new Date(a.endDate).getTime() > now
    }).length
  }, [ads])

  // Stats status filter khusus di dalam tab aktif
  const currentLevelStats = useMemo(() => {
    const targetPlacement =
      levelFilter === 'LEVEL_1' ? 'HOMEPAGE_HERO' : 'PROMOTED_LIST'
    const targetAds = ads.filter((a) => a.placement === targetPlacement)
    return {
      total: targetAds.length,
      pending: targetAds.filter((a) => a.status === 'PENDING').length,
      approved: targetAds.filter((a) => a.status === 'APPROVED').length,
      rejected: targetAds.filter((a) => a.status === 'REJECTED').length,
    }
  }, [ads, levelFilter])

  // Load products helper
  const loadProductsForStore = useCallback(async (targetStoreId?: string) => {
    try {
      setLoadingProducts(true)
      const url = targetStoreId
        ? `/api/admin/products?limit=24&storeId=${targetStoreId}`
        : `/api/admin/products?limit=24`
      const res = await fetch(url)
      const data = await res.json()
      if (data?.products) {
        setStoreProducts(data.products)
      }
    } catch (err) {
      console.error('Error fetching products:', err)
    } finally {
      setLoadingProducts(false)
    }
  }, [])

  // Load store profile & products for banner selection
  useEffect(() => {
    async function loadStoreAssets() {
      try {
        const profileRes = await fetch('/api/admin/profile')
        const profileData = await profileRes.json()
        let storeObj: CurrentStoreInfo | null = null

        if (profileData?.store) {
          const s = profileData.store
          storeObj = {
            id: s.id,
            name: s.name,
            slug: s.slug,
            city: s.city,
            banner: s.banner,
          }
          setCurrentStore(storeObj)
          if (s.banner) {
            setStoreBanner(s.banner)
            setPhotoSourceTab('STORE_BANNER')
          }
        }

        if (isSuperAdmin) {
          const storesRes = await fetch('/api/stores')
          const storesData = await storesRes.json()
          if (storesData?.success && Array.isArray(storesData.data)) {
            const list: CurrentStoreInfo[] = storesData.data.map((st: any) => ({
              id: st.id,
              name: st.name,
              slug: st.slug,
              city: st.city,
              banner: st.banner,
            }))
            setAllStores(list)
            if (!storeObj && list.length > 0) {
              const defaultStore = list[0]
              setCurrentStore(defaultStore)
              if (defaultStore.banner) setStoreBanner(defaultStore.banner)
              loadProductsForStore(defaultStore.id)
            } else {
              loadProductsForStore(storeObj?.id)
            }
          }
        } else {
          loadProductsForStore(storeObj?.id)
        }
      } catch (err) {
        console.error('Error fetching assets:', err)
      }
    }

    if (authStatus === 'authenticated') {
      fetchAds()
      loadStoreAssets()
    }
  }, [authStatus, fetchAds, isSuperAdmin, loadProductsForStore])

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

  // Handle Approve Modal & Execution (Superadmin)
  const handleApprove = (ad: InternalAdItem) => {
    setApproveModalAd(ad)
  }

  const executeApprove = async (adId: string) => {
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
        setApproveModalAd(null)
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

  // Handle Toggle Active/Inactive (Superadmin)
  const handleToggleActive = async (ad: InternalAdItem) => {
    if (ad.isActive) {
      setDeactivateModalAd(ad)
      return
    }
    try {
      setActionLoading(ad.id)
      const res = await fetch(`/api/admin/ads/${ad.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Iklan diaktifkan kembali')
        fetchAds()
      } else {
        toast.error(data.message || 'Gagal mengaktifkan status iklan')
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi')
    } finally {
      setActionLoading(null)
    }
  }

  const executeDeactivate = async (adId: string) => {
    try {
      setActionLoading(adId)
      const res = await fetch(`/api/admin/ads/${adId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Iklan dinonaktifkan')
        setDeactivateModalAd(null)
        fetchAds()
      } else {
        toast.error(data.message || 'Gagal menonaktifkan iklan')
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi')
    } finally {
      setActionLoading(null)
    }
  }

  // Handle Delete Modal & Execution
  const handleDelete = (ad: InternalAdItem) => {
    setDeleteModalAd(ad)
  }

  const executeDelete = async (adId: string) => {
    try {
      setActionLoading(adId)
      const res = await fetch(`/api/admin/ads/${adId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Iklan berhasil dihapus')
        setDeleteModalAd(null)
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

  // Handle Cancel Submission Modal & Execution (Store Admin)
  const handleCancelSubmission = (ad: InternalAdItem) => {
    setCancelModalAd(ad)
  }

  const executeCancelSubmission = async (adId: string) => {
    try {
      setActionLoading(adId)
      const res = await fetch(`/api/admin/ads/${adId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'Pengajuan iklan berhasil dibatalkan')
        setCancelModalAd(null)
        fetchAds()
      } else {
        toast.error(data.message || 'Gagal membatalkan pengajuan iklan')
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
    setEditTargetUrl(
      ad.targetUrl || (ad.store?.slug ? `/toko/${ad.store.slug}` : '/gadget')
    )
    if (storeBanner) {
      setChangeImageTab('STORE_BANNER')
    } else if (storeProducts.length > 0) {
      setChangeImageTab('PRODUCTS')
    } else {
      setChangeImageTab('PRESETS')
    }
  }

  // Save Changed Image & Target URL
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
          targetUrl: editTargetUrl.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Foto banner & link iklan berhasil diperbarui!')
        setAds((prev) =>
          prev.map((item) =>
            item.id === editingAdForImage.id
              ? {
                  ...item,
                  imageUrl: newImageUrl.trim(),
                  targetUrl: editTargetUrl.trim() || item.targetUrl,
                }
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

  // Open Create Modal cleanly with smart initial target link
  const handleOpenCreateModal = () => {
    const initType: AdTargetType = currentStore ? 'STORE' : 'ALL_CATALOG'
    const initUrl = computeTargetUrl(initType, currentStore, '', '')
    setFormData({
      title: '',
      subtitle: '',
      placement: levelFilter === 'LEVEL_1' ? 'HOMEPAGE_HERO' : 'PROMOTED_LIST',
      imageUrl: storeBanner || '',
      targetType: initType,
      targetUrl: initUrl,
      productId: '',
      storeId: currentStore?.id || '',
      priority: 0,
      startDate: new Date().toISOString().split('T')[0],
      durationDays: 7,
      targetImpressions: 1000,
      selectedPhotoLabel: storeBanner ? 'Banner Profil Toko' : '',
    })
    setShowCreateModal(true)
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
          subtitle: formData.subtitle,
          placement: formData.placement,
          imageUrl: formData.imageUrl,
          targetUrl: formData.targetUrl,
          productId: formData.productId || undefined,
          storeId: formData.storeId || currentStore?.id || undefined,
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
        const initType: AdTargetType = currentStore ? 'STORE' : 'ALL_CATALOG'
        setFormData({
          title: '',
          subtitle: '',
          placement: 'HOMEPAGE_HERO',
          imageUrl: '',
          targetType: initType,
          targetUrl: computeTargetUrl(initType, currentStore, '', ''),
          productId: '',
          storeId: currentStore?.id || '',
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
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/20 transition hover:bg-orange-600 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>
              {isSuperAdmin ? 'Buat Iklan Baru' : 'Ajukan Iklan Baru'}
            </span>
          </button>
        </div>
      </div>

      {/* Toko Callout Info Banner */}
      {!isSuperAdmin && (
        <div className="flex items-start gap-3 rounded-2xl border border-blue-200/80 bg-blue-50/70 p-3.5 text-xs text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <div className="space-y-0.5">
            <p className="font-bold">Ketentuan Pengajuan Iklan Cabang Toko</p>
            <p className="text-[11px] leading-relaxed text-blue-800/90 dark:text-blue-300/90">
              Admin toko dapat mengajukan banner promosi dan membatalkan
              pengajuan selama status masih <strong>Menunggu</strong>.
              Persetujuan dan pengaktifan iklan dilakukan secara eksklusif oleh{' '}
              <strong>Super Admin</strong>.
            </p>
          </div>
        </div>
      )}

      {/* 2.2 TAB SWITCHER UTAMA: Level 1 (Hero Carousel) vs Level 2 (In-Feed Grid) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Tab 1: Level 1 (Hero Carousel) */}
        <button
          type="button"
          onClick={() => {
            setLevelFilter('LEVEL_1')
            setActiveTab('ALL')
          }}
          className={`flex cursor-pointer items-start gap-3.5 rounded-3xl border-2 p-4 text-left transition-all duration-200 ${
            levelFilter === 'LEVEL_1'
              ? 'border-blue-500 bg-blue-50/50 shadow-md shadow-blue-500/10 dark:border-blue-500 dark:bg-blue-950/20'
              : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
          }`}
        >
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
              levelFilter === 'LEVEL_1'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            <Video className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-black text-slate-950 dark:text-white sm:text-base">
                Tab Level 1: Hero Carousel
              </h3>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                  levelFilter === 'LEVEL_1'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {allLevel1Count} Iklan
              </span>
            </div>
            <p className="mt-1 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
              Slot eksklusif teratas • Video aktif tayang di atas &amp; antrean
              tayang berikutnya
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {level1Slot.isOccupied ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
                  1 Video Sedang Tayang
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  Slot Tersedia
                </span>
              )}
              {pendingLevel1Count > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                  {pendingLevel1Count} Menunggu Antrean
                </span>
              )}
            </div>
          </div>
        </button>

        {/* Tab 2: Level 2 (In-Feed Grid) */}
        <button
          type="button"
          onClick={() => {
            setLevelFilter('LEVEL_2')
            setActiveTab('ALL')
          }}
          className={`flex cursor-pointer items-start gap-3.5 rounded-3xl border-2 p-4 text-left transition-all duration-200 ${
            levelFilter === 'LEVEL_2'
              ? 'border-orange-500 bg-orange-50/50 shadow-md shadow-orange-500/10 dark:border-orange-500 dark:bg-orange-950/20'
              : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
          }`}
        >
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
              levelFilter === 'LEVEL_2'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            <LayoutGrid className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-black text-slate-950 dark:text-white sm:text-base">
                Tab Level 2: In-Feed Grid Produk
              </h3>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                  levelFilter === 'LEVEL_2'
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {allLevel2Count} Iklan
              </span>
            </div>
            <p className="mt-1 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
              Diselipkan di antara katalog • Diurutkan mana yang sebentar lagi
              habis waktu
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {urgentLevel2Count > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
                  <AlertTriangle className="h-3 w-3" />
                  {urgentLevel2Count} Segera Berakhir (&lt; 3 Hari)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                  {activeLevel2Count} Iklan Aktif
                </span>
              )}
            </div>
          </div>
        </button>
      </div>

      {/* 2.5 Real-Time Exclusive Level 1 Slot Banner OR Level 2 Overview Banner */}
      {levelFilter === 'LEVEL_1' ? (
        level1Slot.isOccupied && level1Slot.activeAd ? (
          <div className="shadow-2xs rounded-2xl border border-blue-200/90 bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-white p-4 dark:border-blue-900/60 dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-900">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <div className="shadow-xs flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-blue-800 dark:text-blue-300">
                      Slot Eksklusif Level 1 (Hero Carousel)
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-extrabold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-600" />
                      Sedang Terisi (Maksimal 1 Toko)
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    Iklan Aktif:{' '}
                    <strong className="text-slate-900 dark:text-white">
                      &ldquo;{level1Slot.activeAd.title}&rdquo;
                    </strong>
                    {level1Slot.activeAd.store?.name && (
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {' '}
                        • {level1Slot.activeAd.store.name}
                      </span>
                    )}{' '}
                    • Sisa Masa Tayang:{' '}
                    <span className="font-bold text-blue-700 dark:text-blue-400">
                      {level1Slot.activeAd.remainingText}
                    </span>
                    {level1Slot.activeAd.endDate && (
                      <span>
                        {' '}
                        (Berakhir{' '}
                        {new Date(
                          level1Slot.activeAd.endDate
                        ).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                        )
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="shrink-0 sm:max-w-xs sm:text-right">
                <span className="shadow-2xs inline-block rounded-xl border border-blue-200 bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-blue-700 dark:border-blue-900 dark:bg-slate-800 dark:text-blue-300">
                  ⏳ Iklan toko lain masuk antrean &amp; tayang setelah slot ini
                  expired
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="shadow-2xs rounded-2xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50/90 via-teal-50/40 to-white p-4 dark:border-emerald-900/60 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="shadow-xs flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                      Slot Eksklusif Level 1 (Hero Carousel)
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                      Tersedia / Kosong
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                    Belum ada iklan Level 1 yang aktif. Pengajuan baru dapat
                    langsung tayang eksklusif setelah disetujui.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="shadow-2xs rounded-2xl border border-orange-200/90 bg-gradient-to-r from-orange-50/90 via-amber-50/40 to-white p-4 dark:border-orange-900/60 dark:from-orange-950/40 dark:via-slate-900 dark:to-slate-900">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <div className="shadow-xs flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white">
                <LayoutGrid className="h-5 w-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-orange-900 dark:text-orange-300">
                    Monitoring Masa Tayang Level 2 (In-Feed Grid Produk)
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-extrabold text-orange-700 dark:bg-orange-900/60 dark:text-orange-300">
                    Diurutkan Sisa Masa Tayang Terdekat
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  Iklan yang masa penayangannya sebentar lagi habis ditampilkan
                  di posisi paling atas untuk memudahkan perpanjangan kuota
                  promosi toko cabang.
                </p>
              </div>
            </div>
            {urgentLevel2Count > 0 && (
              <div className="shrink-0 sm:text-right">
                <span className="shadow-2xs inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                  {urgentLevel2Count} Iklan Segera Berakhir (&lt; 3 Hari)
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Filter & Search Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              {
                key: 'ALL',
                label: 'Semua Iklan',
                count: currentLevelStats.total,
              },
              {
                key: 'PENDING',
                label: 'Menunggu',
                count: currentLevelStats.pending,
              },
              {
                key: 'APPROVED',
                label: 'Disetujui',
                count: currentLevelStats.approved,
              },
              {
                key: 'REJECTED',
                label: 'Ditolak',
                count: currentLevelStats.rejected,
              },
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
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={
                levelFilter === 'LEVEL_1'
                  ? 'Cari iklan carousel / nama toko...'
                  : 'Cari iklan in-feed / nama toko...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
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
      ) : currentTabAds.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 p-6 text-center dark:border-slate-800 dark:bg-slate-950/40">
          <Sparkles className="h-8 w-8 text-slate-300 dark:text-slate-700" />
          <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
            Belum Ada Iklan di{' '}
            {levelFilter === 'LEVEL_1'
              ? 'Level 1 (Carousel)'
              : 'Level 2 (In-Feed Grid)'}
          </h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
            {isSuperAdmin
              ? `Belum ada iklan ${levelFilter === 'LEVEL_1' ? 'Hero Carousel' : 'In-Feed Grid'} pada filter status ini.`
              : `Ajukan banner promosi ${levelFilter === 'LEVEL_1' ? 'Hero Carousel' : 'In-Feed Grid'} sekarang untuk cabang toko Anda.`}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-orange-600"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>
              Ajukan Iklan {levelFilter === 'LEVEL_1' ? 'Level 1' : 'Level 2'}
            </span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {currentTabAds.map((ad) => {
            const isPending = ad.status === 'PENDING'
            const isApproved = ad.status === 'APPROVED'
            const isRejected = ad.status === 'REJECTED'
            const timing = getAdTimingInfo(ad)

            const isStreamingNow =
              ad.placement === 'HOMEPAGE_HERO' &&
              ((ad as any).isExclusiveLevel1Active ||
                level1Slot.activeAd?.id === ad.id ||
                (isApproved && ad.isActive && !timing.isExpired))

            const queueIndex =
              ad.placement === 'HOMEPAGE_HERO' &&
              !isStreamingNow &&
              (isApproved || isPending) &&
              !timing.isExpired
                ? waitingLevel1Ads.findIndex((w) => w.id === ad.id) + 1
                : 0

            const isVideo = Boolean(
              ad.imageUrl &&
              (ad.imageUrl.toLowerCase().endsWith('.mp4') ||
                ad.imageUrl.toLowerCase().endsWith('.webm') ||
                ad.imageUrl.toLowerCase().includes('/video/'))
            )

            // Dynamic card border styling based on status / queue
            const cardBorderClass = isStreamingNow
              ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
              : timing.isUrgent && timing.isCurrentlyActive
                ? 'border-amber-400 dark:border-amber-600 ring-2 ring-amber-500/20 shadow-sm'
                : 'border-slate-200/80 dark:border-slate-800'

            return (
              <div
                key={ad.id}
                className={`group flex flex-col justify-between overflow-hidden rounded-3xl border bg-white p-4 shadow-sm transition hover:shadow-md dark:bg-slate-900 ${cardBorderClass}`}
              >
                <div>
                  {/* Antrean / Sisa Waktu Strip */}
                  {levelFilter === 'LEVEL_1' ? (
                    isStreamingNow ? (
                      <div className="mb-3 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/90 px-3 py-1.5 text-xs dark:border-blue-900/60 dark:bg-blue-950/40">
                        <div className="flex items-center gap-1.5">
                          <span className="flex h-2 w-2 animate-pulse rounded-full bg-blue-600" />
                          <span className="text-[11px] font-black text-blue-900 dark:text-blue-300">
                            #1 SEDANG DITAYANGKAN DI PALING ATAS
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400">
                          Sisa: {timing.remainingText}
                        </span>
                      </div>
                    ) : queueIndex > 0 ? (
                      <div className="mb-3 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-1.5 text-xs dark:border-amber-900/60 dark:bg-amber-950/40">
                        <div className="flex items-center gap-1.5">
                          <Timer className="h-3.5 w-3.5 text-amber-600" />
                          <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300">
                            ANTREAN KE-{queueIndex}: AKAN TAYANG BERIKUTNYA
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                          {isPending
                            ? 'Menunggu Review'
                            : 'Siap Tayang Setelah Slot Expired'}
                        </span>
                      </div>
                    ) : (
                      <div className="mb-3 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                        <span>
                          {isRejected
                            ? 'Pengajuan Ditolak'
                            : 'Masa Tayang Selesai / Non-Aktif'}
                        </span>
                      </div>
                    )
                  ) : timing.isCurrentlyActive ? (
                    timing.isUrgent ? (
                      <div className="mb-3 flex items-center justify-between rounded-xl border border-rose-300 bg-rose-50/90 px-3 py-1.5 text-xs dark:border-rose-900/60 dark:bg-rose-950/40">
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 animate-bounce text-rose-600" />
                          <span className="text-[11px] font-black text-rose-900 dark:text-rose-200">
                            SEBENTAR LAGI HABIS: Sisa {timing.remainingText}
                          </span>
                        </div>
                        <span className="text-[10px] font-extrabold uppercase text-rose-700 dark:text-rose-400">
                          Prioritas Perpanjangan
                        </span>
                      </div>
                    ) : (
                      <div className="mb-3 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-xs dark:border-emerald-900/60 dark:bg-emerald-950/40">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300">
                            Aktif Tayang: Sisa {timing.remainingText}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                          {ad.endDate
                            ? `Berakhir ${new Date(ad.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`
                            : ''}
                        </span>
                      </div>
                    )
                  ) : isPending ? (
                    <div className="mb-3 flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs dark:border-amber-900/60 dark:bg-amber-950/40">
                      <Clock className="h-3.5 w-3.5 text-amber-600" />
                      <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                        Menunggu Review Moderasi Superadmin
                      </span>
                    </div>
                  ) : (
                    <div className="mb-3 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                      <span>
                        {isRejected
                          ? 'Pengajuan Ditolak'
                          : 'Masa Tayang Habis / Non-Aktif'}
                      </span>
                    </div>
                  )}

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
                        ? 'Level 1: Hero Carousel Mobile & Desktop'
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
                        ? ad.placement === 'HOMEPAGE_HERO'
                          ? 'Disetujui & Aktif (Eksklusif)'
                          : 'Disetujui & Aktif'
                        : isApproved && !ad.isActive
                          ? 'Non-Aktif'
                          : isPending
                            ? ad.placement === 'HOMEPAGE_HERO' &&
                              level1Slot.isOccupied &&
                              level1Slot.activeAd?.id !== ad.id
                              ? 'Antrean Slot (Menunggu Expired)'
                              : 'Menunggu Review'
                            : 'Ditolak'}
                    </span>
                  </div>

                  {/* Banner Image / Video Visual Preview */}
                  <div
                    onClick={() => handleOpenChangeImage(ad)}
                    className="group/banner relative mb-3 aspect-[21/9] w-full cursor-pointer overflow-hidden rounded-2xl border border-slate-100 bg-slate-950 dark:border-slate-800"
                    title="Klik untuk mengganti foto atau video banner"
                  >
                    {isVideo ? (
                      <video
                        src={ad.imageUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover transition duration-300 group-hover/banner:scale-105"
                      />
                    ) : (
                      <img
                        src={
                          ad.imageUrl ||
                          ad.store?.banner ||
                          '/images/banners/samsung-campaign-banner.jpg'
                        }
                        alt={ad.title}
                        className="h-full w-full object-cover transition duration-300 group-hover/banner:scale-105"
                      />
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Video Promo Badge */}
                    {isVideo && (
                      <div className="backdrop-blur-xs shadow-xs absolute left-2.5 top-2.5 z-10 flex items-center gap-1 rounded-md bg-orange-600/90 px-2 py-0.5 text-[9px] font-black text-white">
                        <Play className="h-2.5 w-2.5 fill-white text-white" />
                        <span>VIDEO PROMO</span>
                      </div>
                    )}

                    {/* Hover Overlay Button to Change Image */}
                    <div className="backdrop-blur-2xs absolute inset-0 flex items-center justify-center gap-1.5 bg-black/55 text-xs font-bold text-white opacity-0 transition duration-200 group-hover/banner:opacity-100">
                      <ImageIcon className="h-4 w-4 text-orange-400" />
                      <span>Klik untuk Ganti Foto / Video Banner</span>
                    </div>

                    <div className="pointer-events-none absolute bottom-2.5 left-3 right-3 text-white">
                      <p className="text-xs font-bold leading-tight drop-shadow-md">
                        {ad.title}
                      </p>
                      <p className="drop-shadow-xs text-[10px] font-medium text-white/80">
                        {ad.subtitle
                          ? ad.subtitle
                          : `${ad.store?.name || 'Platform Sponsor'} • ${ad.store?.city || 'Indonesia'}`}
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

                    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                      <span className="truncate">
                        Target Link:{' '}
                        <code className="text-slate-600 dark:text-slate-300">
                          {ad.targetUrl ||
                            (ad.store?.slug
                              ? `/toko/${ad.store.slug}`
                              : '/gadget')}
                        </code>
                      </span>
                      <a
                        href={
                          ad.targetUrl ||
                          (ad.store?.slug
                            ? `/toko/${ad.store.slug}`
                            : '/gadget')
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Kunjungi</span>
                      </a>
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

                    {(isSuperAdmin || isPending) && (
                      <button
                        type="button"
                        onClick={() => handleOpenChangeImage(ad)}
                        className="shadow-2xs inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-orange-300 hover:bg-orange-50/60 hover:text-orange-600 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-orange-400"
                        title="Ganti foto banner iklan ini"
                      >
                        <ImageIcon className="h-3.5 w-3.5 text-orange-500" />
                        <span>Ganti Gambar</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Super Admin Approval Actions */}
                    {isSuperAdmin && isPending && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleApprove(ad)}
                          disabled={actionLoading === ad.id}
                          className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
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

                    {/* Store Admin Cancel Submission Action */}
                    {!isSuperAdmin && isPending && (
                      <button
                        type="button"
                        onClick={() => handleCancelSubmission(ad)}
                        disabled={actionLoading === ad.id}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 active:scale-95 disabled:opacity-50 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Batalkan Pengajuan</span>
                      </button>
                    )}

                    {/* Toggle Active for Approved (Super Admin Only) */}
                    {isSuperAdmin && isApproved && (
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

                    {/* Delete action (Superadmin always, or Store Admin for rejected history) */}
                    {(isSuperAdmin || (!isSuperAdmin && isRejected)) && (
                      <button
                        onClick={() => handleDelete(ad)}
                        disabled={actionLoading === ad.id}
                        className="rounded-xl border border-slate-200 p-1.5 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-800 dark:hover:border-rose-900 dark:hover:bg-rose-950/40"
                        title={
                          isSuperAdmin
                            ? 'Hapus Iklan'
                            : 'Hapus Riwayat Pengajuan'
                        }
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
              {/* KHUSUS SUPERADMIN: PILIH TOKO PEMILIK IKLAN */}
              {isSuperAdmin && allStores.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <Store className="h-4 w-4 text-orange-500" />
                      <span>Pilih Toko Cabang Pemilik Iklan:</span>
                    </label>
                    {currentStore?.city && (
                      <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">
                        Cabang {currentStore.city}
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <CustomSelect
                      value={currentStore?.id || ''}
                      onChange={(val: string) => {
                        const found = allStores.find((s) => s.id === val)
                        if (found) {
                          setCurrentStore(found)
                          if (found.banner) setStoreBanner(found.banner)
                          loadProductsForStore(found.id)
                          setFormData((p) => {
                            const newUrl = computeTargetUrl(
                              p.targetType,
                              found,
                              p.productId,
                              p.targetUrl
                            )
                            return {
                              ...p,
                              storeId: found.id,
                              targetUrl: newUrl,
                            }
                          })
                        }
                      }}
                      options={allStores.map((st) => ({
                        value: st.id,
                        label: `${st.name}${st.city ? ` (${st.city})` : ''}`,
                      }))}
                      placeholder="Pilih Toko Cabang..."
                    />
                  </div>
                </div>
              )}

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

                  {/* Keterangan Eksklusivitas Slot Level 1 */}
                  {level1Slot.isOccupied && level1Slot.activeAd ? (
                    <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/90 p-2.5 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
                      <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                      <div>
                        <p className="text-[11px] font-bold">
                          Slot Level 1 Sedang Digunakan (Eksklusif 1 Toko)
                        </p>
                        <p className="mt-0.5 text-[10px] leading-relaxed">
                          Saat ini slot sedang digunakan oleh{' '}
                          <strong>
                            {level1Slot.activeAd.store?.name || 'Toko Lain'}
                          </strong>{' '}
                          hingga{' '}
                          {level1Slot.activeAd.endDate
                            ? new Date(
                                level1Slot.activeAd.endDate
                              ).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'selesai'}{' '}
                          ({level1Slot.activeAd.remainingText}). Pengajuan Anda
                          akan masuk ke antrean prioritas dan dijadwalkan tayang
                          setelah slot aktif kedaluwarsa.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/90 p-2.5 text-xs text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <div>
                        <p className="text-[11px] font-bold">
                          Slot Level 1 Tersedia / Kosong
                        </p>
                        <p className="mt-0.5 text-[10px] leading-relaxed">
                          Belum ada iklan Level 1 aktif. Iklan Anda siap
                          langsung tayang eksklusif di carousel teratas beranda
                          mobile setelah disetujui.
                        </p>
                      </div>
                    </div>
                  )}

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
                        onClick={() => {
                          const nextType: AdTargetType = 'STORE'
                          setFormData((p) => ({
                            ...p,
                            imageUrl: storeBanner,
                            selectedPhotoLabel: 'Foto Banner Toko',
                            targetType: nextType,
                            targetUrl: computeTargetUrl(
                              nextType,
                              currentStore,
                              p.productId,
                              p.targetUrl
                            ),
                          }))
                        }}
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
                                onClick={() => {
                                  const nextType: AdTargetType = 'PRODUCT'
                                  setFormData((p) => ({
                                    ...p,
                                    imageUrl: img,
                                    selectedPhotoLabel: `Produk: ${prod.name}`,
                                    productId: prod.id,
                                    targetType: nextType,
                                    targetUrl: computeTargetUrl(
                                      nextType,
                                      currentStore,
                                      prod.id,
                                      p.targetUrl
                                    ),
                                    title: p.title.trim()
                                      ? p.title
                                      : `Promo Spesial ${prod.name}`,
                                  }))
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
                              onClick={() => {
                                let nextType: AdTargetType = 'ALL_CATALOG'
                                let presetUrl = '/gadget'
                                if (preset.label.includes('Garansi')) {
                                  nextType = 'WARRANTY'
                                  presetUrl = '/garansi'
                                } else if (
                                  preset.label.includes('QC') ||
                                  preset.label.includes('LCD') ||
                                  preset.label.includes('Teknisi')
                                ) {
                                  nextType = 'ALL_CATALOG'
                                  presetUrl = '/gadget'
                                } else if (preset.label.includes('Samsung')) {
                                  nextType = 'ALL_CATALOG'
                                  presetUrl = '/gadget?brand=Samsung'
                                }
                                setFormData((p) => ({
                                  ...p,
                                  imageUrl: preset.url,
                                  selectedPhotoLabel: preset.label,
                                  targetType: nextType,
                                  targetUrl: presetUrl,
                                }))
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
                    </div>
                  )}

                  {/* TAB 4: UPLOAD DARI KOMPUTER (FOTO / VIDEO) */}
                  {photoSourceTab === 'UPLOAD' && (
                    <div className="space-y-2">
                      <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6 text-center hover:border-orange-400 hover:bg-orange-50/20 dark:border-slate-800 dark:bg-slate-900">
                        {uploadingMedia ? (
                          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                        ) : (
                          <Upload className="h-6 w-6 text-orange-500" />
                        )}
                        <span className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                          {uploadingMedia
                            ? 'Mengunggah Media ke Server...'
                            : 'Pilih File Foto atau Video Banner dari Komputer'}
                        </span>
                        <span className="mt-0.5 text-[10px] text-slate-400">
                          Format Foto (PNG, JPG, WebP - maks 15MB) atau Video
                          (MP4, WebM, MOV - maks 60MB)
                        </span>
                        <input
                          type="file"
                          accept="image/*,video/mp4,video/webm,video/ogg,video/quicktime"
                          disabled={uploadingMedia}
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              const isVid =
                                file.type.startsWith('video/') ||
                                file.name.endsWith('.mp4') ||
                                file.name.endsWith('.webm')
                              const maxLimit = isVid
                                ? 60 * 1024 * 1024
                                : 15 * 1024 * 1024
                              if (file.size > maxLimit) {
                                return toast.error(
                                  isVid
                                    ? 'Ukuran video maksimal 60MB'
                                    : 'Ukuran foto maksimal 15MB'
                                )
                              }
                              try {
                                setUploadingMedia(true)
                                const fd = new FormData()
                                fd.append('file', file)
                                fd.append('folder', 'ads')
                                const res = await fetch('/api/upload', {
                                  method: 'POST',
                                  body: fd,
                                })
                                const data = await res.json()
                                if (data.success && data.url) {
                                  setFormData((p) => ({
                                    ...p,
                                    imageUrl: data.url,
                                    selectedPhotoLabel: `${isVid ? 'Video' : 'Upload'}: ${file.name}`,
                                  }))
                                  toast.success(
                                    `${isVid ? 'Video' : 'Foto'} ${file.name} berhasil diunggah`
                                  )
                                } else {
                                  throw new Error(
                                    data.error || 'Gagal upload media'
                                  )
                                }
                              } catch (err: any) {
                                const reader = new FileReader()
                                reader.onload = () => {
                                  setFormData((p) => ({
                                    ...p,
                                    imageUrl: reader.result as string,
                                    selectedPhotoLabel: `Upload: ${file.name}`,
                                  }))
                                  toast.success(
                                    `Media ${file.name} siap digunakan`
                                  )
                                }
                                reader.readAsDataURL(file)
                              } finally {
                                setUploadingMedia(false)
                              }
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
                        placeholder="https://... URL gambar atau video banner (.mp4, .webm, dsb)"
                        value={formData.imageUrl}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            imageUrl: e.target.value,
                            selectedPhotoLabel: isVideoMedia(e.target.value)
                              ? 'URL Video Kustom'
                              : 'URL Kustom',
                          }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                      />
                    </div>
                  )}
                </div>

                {/* PRATINJAU MEDIA BANNER TERPILIH */}
                {formData.imageUrl && (
                  <div className="mt-3.5 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                      <span className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300">
                        Media Banner Terpilih:{' '}
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
                      {isVideoMedia(formData.imageUrl) ? (
                        <video
                          src={formData.imageUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <img
                          src={formData.imageUrl}
                          alt="Banner Preview"
                          className="h-full w-full object-cover"
                        />
                      )}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {isVideoMedia(formData.imageUrl) && (
                        <div className="backdrop-blur-xs shadow-xs absolute left-2.5 top-2.5 z-10 flex items-center gap-1 rounded-md bg-orange-600/90 px-2 py-0.5 text-[9px] font-black text-white">
                          <Play className="h-2.5 w-2.5 fill-white text-white" />
                          <span>VIDEO PROMO</span>
                        </div>
                      )}

                      <div className="pointer-events-none absolute bottom-2 left-3 right-3 text-white">
                        <p className="text-xs font-bold leading-tight drop-shadow-md">
                          {formData.title || 'Judul Promosi Iklan'}
                        </p>
                        <p className="text-[10px] text-white/80">
                          {formData.subtitle ||
                            (formData.placement === 'HOMEPAGE_HERO'
                              ? `Durasi: ${formData.durationDays} Hari`
                              : `Target: ${Number(formData.targetImpressions).toLocaleString('id-ID')}x Muncul`)}
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
                  placeholder="Contoh: Flash Sale Spesial Diskon 30%"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, title: e.target.value }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {/* Subjudul Promo (Opsional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Subjudul / Keterangan Promo (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Garansi 30 hari tukar unit"
                  value={formData.subtitle}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, subtitle: e.target.value }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {/* Pilihan Tujuan Navigasi (Target Link) */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Pilihan Tujuan Navigasi (Target Link){' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-medium text-slate-400">
                    Pilih kemana pembeli diarahkan saat banner diklik
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {/* 1. Profil Toko */}
                  <button
                    type="button"
                    onClick={() => {
                      const nextType: AdTargetType = 'STORE'
                      setFormData((p) => ({
                        ...p,
                        targetType: nextType,
                        targetUrl: computeTargetUrl(
                          nextType,
                          currentStore,
                          p.productId,
                          p.targetUrl
                        ),
                      }))
                    }}
                    className={`flex flex-col items-start rounded-2xl border p-2.5 text-left transition ${
                      formData.targetType === 'STORE'
                        ? 'border-orange-500 bg-orange-50/70 ring-2 ring-orange-500/20 dark:border-orange-500 dark:bg-orange-950/30'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <Store
                        className={`h-4 w-4 ${
                          formData.targetType === 'STORE'
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-slate-500'
                        }`}
                      />
                      {formData.targetType === 'STORE' && (
                        <span className="h-2 w-2 rounded-full bg-orange-500" />
                      )}
                    </div>
                    <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
                      Profil Toko
                    </p>
                    <p className="line-clamp-1 text-[10px] text-slate-500 dark:text-slate-400">
                      /toko/{currentStore?.slug || '[slug]'}
                    </p>
                  </button>

                  {/* 2. Katalog Toko */}
                  <button
                    type="button"
                    onClick={() => {
                      const nextType: AdTargetType = 'STORE_CATALOG'
                      setFormData((p) => ({
                        ...p,
                        targetType: nextType,
                        targetUrl: computeTargetUrl(
                          nextType,
                          currentStore,
                          p.productId,
                          p.targetUrl
                        ),
                      }))
                    }}
                    className={`flex flex-col items-start rounded-2xl border p-2.5 text-left transition ${
                      formData.targetType === 'STORE_CATALOG'
                        ? 'border-orange-500 bg-orange-50/70 ring-2 ring-orange-500/20 dark:border-orange-500 dark:bg-orange-950/30'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <ShoppingBag
                        className={`h-4 w-4 ${
                          formData.targetType === 'STORE_CATALOG'
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-slate-500'
                        }`}
                      />
                      {formData.targetType === 'STORE_CATALOG' && (
                        <span className="h-2 w-2 rounded-full bg-orange-500" />
                      )}
                    </div>
                    <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
                      Katalog Toko
                    </p>
                    <p className="line-clamp-1 text-[10px] text-slate-500 dark:text-slate-400">
                      /gadget?store=...
                    </p>
                  </button>

                  {/* 3. Detail Produk */}
                  <button
                    type="button"
                    onClick={() => {
                      const nextType: AdTargetType = 'PRODUCT'
                      const pid =
                        formData.productId || storeProducts[0]?.id || ''
                      setFormData((p) => ({
                        ...p,
                        targetType: nextType,
                        productId: pid,
                        targetUrl: computeTargetUrl(
                          nextType,
                          currentStore,
                          pid,
                          p.targetUrl
                        ),
                      }))
                    }}
                    className={`flex flex-col items-start rounded-2xl border p-2.5 text-left transition ${
                      formData.targetType === 'PRODUCT'
                        ? 'border-orange-500 bg-orange-50/70 ring-2 ring-orange-500/20 dark:border-orange-500 dark:bg-orange-950/30'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <Package
                        className={`h-4 w-4 ${
                          formData.targetType === 'PRODUCT'
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-slate-500'
                        }`}
                      />
                      {formData.targetType === 'PRODUCT' && (
                        <span className="h-2 w-2 rounded-full bg-orange-500" />
                      )}
                    </div>
                    <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
                      Detail Produk
                    </p>
                    <p className="line-clamp-1 text-[10px] text-slate-500 dark:text-slate-400">
                      /gadget/[id]
                    </p>
                  </button>

                  {/* 4. Semua Katalog */}
                  <button
                    type="button"
                    onClick={() => {
                      const nextType: AdTargetType = 'ALL_CATALOG'
                      setFormData((p) => ({
                        ...p,
                        targetType: nextType,
                        targetUrl: computeTargetUrl(
                          nextType,
                          currentStore,
                          p.productId,
                          p.targetUrl
                        ),
                      }))
                    }}
                    className={`flex flex-col items-start rounded-2xl border p-2.5 text-left transition ${
                      formData.targetType === 'ALL_CATALOG'
                        ? 'border-orange-500 bg-orange-50/70 ring-2 ring-orange-500/20 dark:border-orange-500 dark:bg-orange-950/30'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <Globe
                        className={`h-4 w-4 ${
                          formData.targetType === 'ALL_CATALOG'
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-slate-500'
                        }`}
                      />
                      {formData.targetType === 'ALL_CATALOG' && (
                        <span className="h-2 w-2 rounded-full bg-orange-500" />
                      )}
                    </div>
                    <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
                      Semua Katalog
                    </p>
                    <p className="line-clamp-1 text-[10px] text-slate-500 dark:text-slate-400">
                      /gadget
                    </p>
                  </button>
                </div>

                {/* Sub-selector jika memilih Detail Produk */}
                {formData.targetType === 'PRODUCT' &&
                  storeProducts.length > 0 && (
                    <div className="mt-2.5 rounded-2xl border border-orange-200/80 bg-orange-50/50 p-3 dark:border-orange-900/40 dark:bg-orange-950/20">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Pilih Produk Toko yang Dituju:
                      </label>
                      <div className="mt-1.5">
                        <CustomSelect
                          value={
                            formData.productId || storeProducts[0]?.id || ''
                          }
                          onChange={(val: string) => {
                            const chosen = storeProducts.find(
                              (p) => p.id === val
                            )
                            setFormData((prev) => ({
                              ...prev,
                              productId: val,
                              targetUrl: `/gadget/${val}`,
                              title: prev.title.trim()
                                ? prev.title
                                : chosen
                                  ? `Flash Sale ${chosen.name}`
                                  : prev.title,
                              selectedPhotoLabel: chosen
                                ? `Produk: ${chosen.name}`
                                : prev.selectedPhotoLabel,
                            }))
                          }}
                          options={storeProducts.map((p) => ({
                            value: p.id,
                            label: `${p.name} - Rp ${Number(p.price || 0).toLocaleString('id-ID')}`,
                          }))}
                          placeholder="Pilih Produk..."
                        />
                      </div>
                    </div>
                  )}

                {/* Live Card Pratinjau Link Terbentuk */}
                <div className="mt-2.5 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-[11px] font-bold text-white">
                      🔗
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        Link Tujuan Navigasi Terbentuk:
                      </p>
                      <code className="block truncate text-xs font-black text-slate-900 dark:text-white">
                        {formData.targetUrl || '/gadget'}
                      </code>
                    </div>
                  </div>
                  {formData.targetUrl && (
                    <a
                      href={formData.targetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="shadow-2xs inline-flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      <ExternalLink className="h-3 w-3 text-orange-500" />
                      <span>Cek Link</span>
                    </a>
                  )}
                </div>
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
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 duration-200 animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <XCircle className="h-6 w-6" />
            </div>

            <div className="mt-4 text-center">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Tolak Pengajuan Iklan?
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Materi iklan{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  &ldquo;{showRejectModal.title}&rdquo;
                </span>
                {showRejectModal.store?.name && (
                  <>
                    {' '}
                    dari{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {showRejectModal.store.name}
                    </span>
                  </>
                )}{' '}
                akan ditolak. Berikan catatan alasan penolakan untuk toko.
              </p>
            </div>

            <div className="mt-4 text-left">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Alasan Penolakan:
              </label>
              <textarea
                rows={3}
                placeholder="Contoh: Resolusi banner terlalu pecah atau materi promosi melanggar pedoman toko resmi."
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-900 focus:border-rose-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(null)
                  setRejectionReasonInput('')
                }}
                disabled={actionLoading === showRejectModal.id}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                disabled={actionLoading === showRejectModal.id}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-rose-700 active:scale-95 disabled:opacity-50"
              >
                {actionLoading === showRejectModal.id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Menolak...</span>
                  </>
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
                    Ganti Media Banner / Video Iklan
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
              {/* Tab Pilihan Sumber Foto/Video Baru */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Pilih Foto atau Video Pengganti Baru:
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
                    <span>Upload File (Foto/Video)</span>
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
                    <span>Input URL Media</span>
                  </button>
                </div>
              </div>

              {/* Konten Pilihan Media Pengganti */}
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

                {/* 4. Upload File Komputer (Foto atau Video) */}
                {changeImageTab === 'UPLOAD' && (
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-orange-400 hover:bg-orange-50/20 dark:border-slate-800 dark:bg-slate-950">
                    {uploadingMedia ? (
                      <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                    ) : (
                      <Upload className="h-6 w-6 text-orange-500" />
                    )}
                    <span className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                      {uploadingMedia
                        ? 'Mengunggah Media ke Server...'
                        : 'Pilih File Foto atau Video Baru dari Komputer'}
                    </span>
                    <span className="mt-0.5 text-[10px] text-slate-400">
                      Format Foto (PNG, JPG, WebP - maks 15MB) atau Video (MP4,
                      WebM, MOV - maks 60MB)
                    </span>
                    <input
                      type="file"
                      accept="image/*,video/mp4,video/webm,video/ogg,video/quicktime"
                      disabled={uploadingMedia}
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const isVid =
                            file.type.startsWith('video/') ||
                            file.name.endsWith('.mp4') ||
                            file.name.endsWith('.webm')
                          const maxLimit = isVid
                            ? 60 * 1024 * 1024
                            : 15 * 1024 * 1024
                          if (file.size > maxLimit) {
                            return toast.error(
                              isVid
                                ? 'Ukuran video maksimal 60MB'
                                : 'Ukuran foto maksimal 15MB'
                            )
                          }
                          try {
                            setUploadingMedia(true)
                            const fd = new FormData()
                            fd.append('file', file)
                            fd.append('folder', 'ads')
                            const res = await fetch('/api/upload', {
                              method: 'POST',
                              body: fd,
                            })
                            const data = await res.json()
                            if (data.success && data.url) {
                              setNewImageUrl(data.url)
                              setNewImageLabel(
                                `${isVid ? 'Video' : 'Upload'}: ${file.name}`
                              )
                              toast.success(
                                `${isVid ? 'Video' : 'Foto'} ${file.name} berhasil diunggah`
                              )
                            } else {
                              throw new Error(data.error || 'Gagal upload file')
                            }
                          } catch (err: any) {
                            const reader = new FileReader()
                            reader.onload = () => {
                              setNewImageUrl(reader.result as string)
                              setNewImageLabel(`Upload: ${file.name}`)
                              toast.success(`Media ${file.name} siap digunakan`)
                            }
                            reader.readAsDataURL(file)
                          } finally {
                            setUploadingMedia(false)
                          }
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
                      placeholder="https://... Masukkan URL foto atau video banner baru (.mp4, .webm, dsb)"
                      value={newImageUrl}
                      onChange={(e) => {
                        setNewImageUrl(e.target.value)
                        setNewImageLabel(
                          isVideoMedia(e.target.value)
                            ? 'URL Video Kustom'
                            : 'URL Kustom'
                        )
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                )}
              </div>

              {/* Pratinjau Media Banner Baru yang Dipilih */}
              {newImageUrl && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex items-center justify-between pb-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    <span>
                      Pratinjau Media Baru:{' '}
                      <strong className="text-orange-600 dark:text-orange-400">
                        {newImageLabel ||
                          (isVideoMedia(newImageUrl)
                            ? 'Video Pengganti'
                            : 'Foto Pengganti')}
                      </strong>
                    </span>
                  </div>
                  <div className="relative aspect-[21/9] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-950 dark:border-slate-800">
                    {isVideoMedia(newImageUrl) ? (
                      <video
                        src={newImageUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <img
                        src={newImageUrl}
                        alt="New Preview"
                        className="h-full w-full object-cover"
                      />
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {isVideoMedia(newImageUrl) && (
                      <div className="backdrop-blur-xs shadow-xs absolute left-2.5 top-2.5 z-10 flex items-center gap-1 rounded-md bg-orange-600/90 px-2 py-0.5 text-[9px] font-black text-white">
                        <Play className="h-2.5 w-2.5 fill-white text-white" />
                        <span>VIDEO PROMO</span>
                      </div>
                    )}

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

              {/* Target Link Editing */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Link2 className="h-4 w-4 text-orange-500" />
                    <span>Target Link Navigasi (URL Tujuan):</span>
                  </label>
                  {editTargetUrl && (
                    <a
                      href={editTargetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:underline dark:text-orange-400"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Cek Link</span>
                    </a>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="/toko/... atau /gadget/... atau https://..."
                  value={editTargetUrl}
                  onChange={(e) => setEditTargetUrl(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

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
                      <span>Menyimpan Media...</span>
                    </>
                  ) : (
                    <span>Simpan Media Banner</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: BATALKAN PENGAJUAN IKLAN (STORE ADMIN) */}
      {cancelModalAd && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 duration-200 animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="mt-4 text-center">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Batalkan Pengajuan Iklan?
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Pengajuan iklan{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  &ldquo;{cancelModalAd.title}&rdquo;
                </span>{' '}
                akan ditarik dari antrean verifikasi dan dihapus. Anda dapat
                mengajukan iklan baru kapan saja.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setCancelModalAd(null)}
                disabled={actionLoading === cancelModalAd.id}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Kembali
              </button>
              <button
                type="button"
                disabled={actionLoading === cancelModalAd.id}
                onClick={() => executeCancelSubmission(cancelModalAd.id)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-rose-700 active:scale-95 disabled:opacity-50"
              >
                {actionLoading === cancelModalAd.id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Membatalkan...</span>
                  </>
                ) : (
                  <span>Ya, Batalkan</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. MODAL: HAPUS IKLAN / RIWAYAT */}
      {deleteModalAd && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 duration-200 animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <Trash2 className="h-6 w-6" />
            </div>

            <div className="mt-4 text-center">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {isSuperAdmin ? 'Hapus Iklan?' : 'Hapus Riwayat Pengajuan?'}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Iklan{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  &ldquo;{deleteModalAd.title}&rdquo;
                </span>{' '}
                akan dihapus permanen dari sistem. Tindakan ini tidak dapat
                dibatalkan.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalAd(null)}
                disabled={actionLoading === deleteModalAd.id}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={actionLoading === deleteModalAd.id}
                onClick={() => executeDelete(deleteModalAd.id)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-rose-700 active:scale-95 disabled:opacity-50"
              >
                {actionLoading === deleteModalAd.id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <span>Ya, Hapus</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. MODAL: SETUJUI PENGAJUAN IKLAN (SUPERADMIN) */}
      {approveModalAd && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 duration-200 animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>

            <div className="mt-4 text-center">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Setujui Pengajuan Iklan?
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Iklan{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  &ldquo;{approveModalAd.title}&rdquo;
                </span>
                {approveModalAd.store?.name && (
                  <>
                    {' '}
                    dari{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {approveModalAd.store.name}
                    </span>
                  </>
                )}{' '}
                akan disetujui dan langsung tayang aktif pada platform
                marketplace.
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-950/40">
              <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                <span>Penempatan:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {approveModalAd.placement === 'HOMEPAGE_HERO'
                    ? 'Level 1: Hero Carousel Mobile (Eksklusif)'
                    : 'Level 2: In-Feed Grid Produk'}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200/60 py-1 text-slate-600 dark:border-slate-800 dark:text-slate-400">
                <span>Durasi Aktif:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {calculateDurationText(
                    approveModalAd.startDate,
                    approveModalAd.endDate,
                    approveModalAd.placement === 'HOMEPAGE_HERO'
                      ? 'LEVEL_1'
                      : 'LEVEL_2'
                  )}
                </span>
              </div>
            </div>

            {/* Warning if Level 1 slot is currently occupied by another ad */}
            {approveModalAd.placement === 'HOMEPAGE_HERO' &&
              level1Slot.isOccupied &&
              level1Slot.activeAd &&
              level1Slot.activeAd.id !== approveModalAd.id && (
                <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                  <div>
                    <p className="font-bold">Slot Level 1 Sedang Digunakan!</p>
                    <p className="mt-1 text-[11px] leading-relaxed">
                      Slot Level 1 bersifat{' '}
                      <strong>
                        eksklusif (hanya 1 iklan yang boleh aktif pada satu
                        waktu)
                      </strong>
                      . Saat ini slot sedang aktif oleh iklan{' '}
                      <strong>&ldquo;{level1Slot.activeAd.title}&rdquo;</strong>{' '}
                      ({level1Slot.activeAd.store?.name || 'Toko Lain'}) hingga{' '}
                      {level1Slot.activeAd.endDate
                        ? new Date(
                            level1Slot.activeAd.endDate
                          ).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'selesai'}{' '}
                      ({level1Slot.activeAd.remainingText}).
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                      Anda tidak dapat mengaktifkan 2 iklan Level 1 sekaligus.
                      Nonaktifkan iklan lama terlebih dahulu atau tunggu hingga
                      masa aktifnya berakhir.
                    </p>
                  </div>
                </div>
              )}

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setApproveModalAd(null)}
                disabled={actionLoading === approveModalAd.id}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={
                  actionLoading === approveModalAd.id ||
                  (approveModalAd.placement === 'HOMEPAGE_HERO' &&
                    level1Slot.isOccupied &&
                    level1Slot.activeAd !== null &&
                    level1Slot.activeAd.id !== approveModalAd.id)
                }
                onClick={() => executeApprove(approveModalAd.id)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
              >
                {actionLoading === approveModalAd.id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Menyetujui...</span>
                  </>
                ) : approveModalAd.placement === 'HOMEPAGE_HERO' &&
                  level1Slot.isOccupied &&
                  level1Slot.activeAd !== null &&
                  level1Slot.activeAd.id !== approveModalAd.id ? (
                  <span>Slot Sedang Terisi</span>
                ) : (
                  <span>Ya, Setujui &amp; Tayangkan</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. MODAL: NONAKTIFKAN IKLAN (SUPERADMIN) */}
      {deactivateModalAd && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 duration-200 animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="mt-4 text-center">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Nonaktifkan Penayangan Iklan?
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Iklan{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  &ldquo;{deactivateModalAd.title}&rdquo;
                </span>{' '}
                akan disembunyikan sementara dari marketplace publik. Anda dapat
                mengaktifkannya kembali sewaktu-waktu.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeactivateModalAd(null)}
                disabled={actionLoading === deactivateModalAd.id}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={actionLoading === deactivateModalAd.id}
                onClick={() => executeDeactivate(deactivateModalAd.id)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-amber-700 active:scale-95 disabled:opacity-50"
              >
                {actionLoading === deactivateModalAd.id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Menonaktifkan...</span>
                  </>
                ) : (
                  <span>Ya, Nonaktifkan</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
