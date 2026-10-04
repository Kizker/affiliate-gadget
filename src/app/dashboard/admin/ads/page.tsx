'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Sparkles, Plus, Clock, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { usePageGuard } from '@/hooks/use-page-guard'
import {
  AdTargetType,
  CurrentStoreInfo,
  InternalAdItem,
  Level1SlotInfo,
  computeTargetUrl,
  getAdTimingInfo,
  AdsLevelTabs,
  AdsToolbar,
  AdList,
  CreateAdModal,
  ChangeMediaModal,
  RejectAdModal,
  CancelAdModal,
  DeleteAdModal,
  ApproveAdModal,
  DeactivateAdModal,
} from '@/components/admin/ads'

export type { AdTargetType, CurrentStoreInfo }

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
  const [level1Slot, setLevel1Slot] = useState<Level1SlotInfo>({
    isOccupied: false,
    activeAd: null,
  })

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
  const [editTitle, setEditTitle] = useState('')
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
  }, [ads, activeTab, searchQuery, level1Slot.activeAd])

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
  }, [ads, activeTab, searchQuery])

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
  }, [sortedLevel1Ads, level1Slot.activeAd])

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
    setNewImageLabel('Media Saat Ini')
    setEditTitle(ad.title || '')
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
          title: editTitle.trim() || undefined,
          targetUrl: editTargetUrl.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(
          isSuperAdmin
            ? 'Media banner & link iklan berhasil diperbarui!'
            : 'Perubahan media iklan berhasil diajukan ke Superadmin untuk persetujuan!'
        )
        setAds((prev) =>
          prev.map((item) =>
            item.id === editingAdForImage.id
              ? {
                  ...item,
                  imageUrl: newImageUrl.trim(),
                  title: editTitle.trim() || item.title,
                  targetUrl: editTargetUrl.trim() || item.targetUrl,
                  status: isSuperAdmin ? item.status : 'PENDING',
                  isActive: isSuperAdmin ? item.isActive : false,
                  rejectionReason: isSuperAdmin ? item.rejectionReason : null,
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

  // Handle select store from CreateAdModal (Superadmin)
  const handleSelectStore = (found: CurrentStoreInfo) => {
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

      {/* 2. TAB SWITCHER UTAMA: Level 1 (Hero Carousel) vs Level 2 (In-Feed Grid) & Real-time Slot Banner */}
      <AdsLevelTabs
        levelFilter={levelFilter}
        onSelectLevel={(lvl) => {
          setLevelFilter(lvl)
          setActiveTab('ALL')
        }}
        allLevel1Count={allLevel1Count}
        allLevel2Count={allLevel2Count}
        pendingLevel1Count={pendingLevel1Count}
        urgentLevel2Count={urgentLevel2Count}
        activeLevel2Count={activeLevel2Count}
        level1Slot={level1Slot}
      />

      {/* 3. Filter & Search Controls */}
      <AdsToolbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        stats={currentLevelStats}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        levelFilter={levelFilter}
      />

      {/* 4. Ads List / Grid Cards */}
      <AdList
        loading={loading}
        currentTabAds={currentTabAds}
        levelFilter={levelFilter}
        isSuperAdmin={isSuperAdmin}
        currentStore={currentStore}
        level1Slot={level1Slot}
        waitingLevel1Ads={waitingLevel1Ads}
        actionLoading={actionLoading}
        onOpenCreateModal={handleOpenCreateModal}
        onOpenChangeImage={handleOpenChangeImage}
        onApprove={handleApprove}
        onReject={(ad) => {
          setShowRejectModal(ad)
          setRejectionReasonInput('')
        }}
        onCancel={handleCancelSubmission}
        onToggleActive={handleToggleActive}
        onDelete={handleDelete}
      />

      {/* 5. MODAL: AJUKAN IKLAN BARU */}
      <CreateAdModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        isSuperAdmin={isSuperAdmin}
        currentStore={currentStore}
        allStores={allStores}
        storeBanner={storeBanner}
        storeProducts={storeProducts}
        loadingProducts={loadingProducts}
        level1Slot={level1Slot}
        formData={formData}
        setFormData={setFormData}
        computedEndDateStr={computedEndDateStr}
        actionLoading={actionLoading}
        photoSourceTab={photoSourceTab}
        setPhotoSourceTab={setPhotoSourceTab}
        uploadingMedia={uploadingMedia}
        setUploadingMedia={setUploadingMedia}
        onSelectStore={handleSelectStore}
        onSubmit={handleCreateSubmit}
      />

      {/* 6. MODAL: TOLAK PENGAJUAN IKLAN (SUPERADMIN) */}
      <RejectAdModal
        ad={showRejectModal}
        rejectionReason={rejectionReasonInput}
        onReasonChange={setRejectionReasonInput}
        onClose={() => {
          setShowRejectModal(null)
          setRejectionReasonInput('')
        }}
        onSubmit={handleRejectSubmit}
        actionLoading={actionLoading}
      />

      {/* 7. MODAL: GANTI FOTO / VIDEO BANNER IKLAN */}
      <ChangeMediaModal
        isOpen={Boolean(editingAdForImage)}
        editingAd={editingAdForImage}
        onClose={() => setEditingAdForImage(null)}
        isSuperAdmin={isSuperAdmin}
        storeBanner={storeBanner}
        storeProducts={storeProducts}
        loadingProducts={loadingProducts}
        newImageUrl={newImageUrl}
        setNewImageUrl={setNewImageUrl}
        newImageLabel={newImageLabel}
        setNewImageLabel={setNewImageLabel}
        editTitle={editTitle}
        setEditTitle={setEditTitle}
        editTargetUrl={editTargetUrl}
        setEditTargetUrl={setEditTargetUrl}
        changeImageTab={changeImageTab}
        setChangeImageTab={setChangeImageTab}
        uploadingMedia={uploadingMedia}
        setUploadingMedia={setUploadingMedia}
        savingImage={savingImage}
        onSave={handleSaveNewImage}
      />

      {/* 8. MODAL: BATALKAN PENGAJUAN IKLAN (STORE ADMIN) */}
      <CancelAdModal
        ad={cancelModalAd}
        onClose={() => setCancelModalAd(null)}
        onConfirm={() =>
          cancelModalAd && executeCancelSubmission(cancelModalAd.id)
        }
        actionLoading={actionLoading}
      />

      {/* 9. MODAL: HAPUS IKLAN / RIWAYAT */}
      <DeleteAdModal
        ad={deleteModalAd}
        onClose={() => setDeleteModalAd(null)}
        onConfirm={() => deleteModalAd && executeDelete(deleteModalAd.id)}
        actionLoading={actionLoading}
      />

      {/* 10. MODAL: SETUJUI PENGAJUAN IKLAN (SUPERADMIN) */}
      <ApproveAdModal
        ad={approveModalAd}
        level1Slot={level1Slot}
        onClose={() => setApproveModalAd(null)}
        onConfirm={() => approveModalAd && executeApprove(approveModalAd.id)}
        actionLoading={actionLoading}
      />

      {/* 11. MODAL: NONAKTIFKAN IKLAN (SUPERADMIN) */}
      <DeactivateAdModal
        ad={deactivateModalAd}
        onClose={() => setDeactivateModalAd(null)}
        onConfirm={() =>
          deactivateModalAd && executeDeactivate(deactivateModalAd.id)
        }
        actionLoading={actionLoading}
      />
    </div>
  )
}
