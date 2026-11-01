'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Tag,
  Search,
  Plus,
  Edit,
  Trash2,
  Copy,
  Check,
  Percent,
  Calendar,
  Layers,
  ShoppingBag,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Sparkles,
  Users,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowRight,
  DollarSign,
  Share2,
  Store,
  Ticket,
  Link as LinkIcon,
} from 'lucide-react'
import { toast } from 'sonner'

interface VoucherItem {
  id: string
  code: string
  description: string | null
  discountType?: string // 'PERCENTAGE' | 'FIXED_AMOUNT'
  discountPercent: number
  discountAmount?: number | null
  maxDiscountAmount: number | null
  minimumPurchase: number
  totalQuota: number
  usedCount: number
  remainingQuota: number
  usagePerUser: number
  applicableOrderType: string
  isActive: boolean
  validFrom: string
  validUntil: string
  createdAt: string
  storeId?: string | null
  store?: {
    id: string
    name: string
    slug: string
  } | null
  _count?: {
    usages: number
  }
}

interface VoucherUsageDetail {
  id: string
  discountApplied: number
  usedAt: string
  user: {
    id: string
    name: string | null
    email: string
    phone: string | null
  }
  order: {
    id: string
    orderNumber: string
    total: number
    status: string
    createdAt: string
  }
}

interface VoucherDetailResponse extends VoucherItem {
  usages: VoucherUsageDetail[]
}

export default function VouchersPage() {
  const router = useRouter()
  const { data: session, status: authStatus } = useSession()

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'
  const isStoreAdmin =
    session?.user?.role === 'STORE_ADMIN' ||
    session?.user?.role === 'STORE_SALES'

  const [vouchers, setVouchers] = useState<VoucherItem[]>([])
  const [stores, setStores] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'ACTIVE' | 'INACTIVE'
  >('ALL')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  })
  const [apiStats, setApiStats] = useState<{
    total: number
    active: number
    totalUsages: number
  } | null>(null)

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  const [selectedVoucher, setSelectedVoucher] = useState<VoucherItem | null>(
    null
  )
  const [voucherToShare, setVoucherToShare] = useState<VoucherItem | null>(null)
  const [detailData, setDetailData] = useState<VoucherDetailResponse | null>(
    null
  )
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
    discountPercent: 10,
    discountAmount: '',
    maxDiscountAmount: '',
    minimumPurchase: 0,
    totalQuota: 50,
    usagePerUser: 1,
    validFrom: new Date().toISOString().slice(0, 10),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    isActive: true,
    storeId: 'GLOBAL',
  })

  // Prevent background scroll when any modal is open
  useEffect(() => {
    const isAnyModalOpen =
      showCreateModal ||
      showEditModal ||
      showDetailModal ||
      showDeleteModal ||
      showShareModal

    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [
    showCreateModal,
    showEditModal,
    showDetailModal,
    showDeleteModal,
    showShareModal,
  ])

  // Auth guard: SUPER_ADMIN and STORE_ADMIN allowed
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login')
    } else if (
      authStatus === 'authenticated' &&
      session?.user?.role !== 'SUPER_ADMIN' &&
      session?.user?.role !== 'STORE_ADMIN' &&
      session?.user?.role !== 'STORE_SALES'
    ) {
      toast.error('Akses tidak diizinkan')
      router.push('/dashboard/admin')
    }
  }, [authStatus, session, router])

  // Fetch stores list if Super Admin
  useEffect(() => {
    if (isSuperAdmin) {
      fetch('/api/stores')
        .then((res) => res.json())
        .then((data) => {
          if (data.stores) {
            setStores(data.stores)
          }
        })
        .catch(() => {})
    }
  }, [isSuperAdmin])

  const fetchVouchers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      params.set('page', String(currentPage))
      params.set('limit', '10')

      const res = await fetch(`/api/admin/vouchers?${params}`)
      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error || 'Gagal mengambil data voucher')
      }
      const data = await res.json()
      setVouchers(data.vouchers || [])
      if (data.pagination) setPagination(data.pagination)
      if (data.stats) setApiStats(data.stats)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, statusFilter, currentPage])

  useEffect(() => {
    if (authStatus === 'authenticated') {
      fetchVouchers()
    }
  }, [authStatus, fetchVouchers])

  // Stats calculation (uses server-aggregated stats so total KPI cards stay global across all pages)
  const stats = useMemo(() => {
    if (apiStats) return apiStats
    const total = pagination.total || vouchers.length
    const active = vouchers.filter((v) => v.isActive).length
    const totalUsages = vouchers.reduce((sum, v) => sum + (v.usedCount || 0), 0)
    return { total, active, totalUsages }
  }, [apiStats, pagination.total, vouchers])

  // Handlers
  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success(`Kode "${code}" berhasil disalin!`)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleShareVoucher = (voucher: VoucherItem) => {
    setVoucherToShare(voucher)
    setShowShareModal(true)
  }

  const handleCopyShareLink = (code: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${origin}/voucher/claim?code=${encodeURIComponent(code)}`
    navigator.clipboard.writeText(url)
    setShareCopied(true)
    toast.success(`Tautan voucher ${code} berhasil disalin!`)
    setTimeout(() => setShareCopied(false), 2500)
  }

  const handleToggleActive = async (voucher: VoucherItem) => {
    try {
      const res = await fetch(`/api/admin/vouchers/${voucher.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !voucher.isActive }),
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Gagal mengubah status voucher')
      }
      toast.success(
        `Voucher ${voucher.code} ${!voucher.isActive ? 'diaktifkan' : 'dinonaktifkan'}`
      )
      fetchVouchers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  const openCreateModal = () => {
    setFormData({
      code: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountPercent: 10,
      discountAmount: '',
      maxDiscountAmount: '',
      minimumPurchase: 0,
      totalQuota: 50,
      usagePerUser: 1,
      validFrom: new Date().toISOString().slice(0, 10),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
      isActive: true,
      storeId: 'GLOBAL',
    })
    setShowCreateModal(true)
  }

  const openEditModal = (voucher: VoucherItem) => {
    setSelectedVoucher(voucher)
    setFormData({
      code: voucher.code,
      description: voucher.description || '',
      discountType:
        (voucher.discountType as any) === 'FIXED_AMOUNT'
          ? 'FIXED_AMOUNT'
          : 'PERCENTAGE',
      discountPercent: voucher.discountPercent || 0,
      discountAmount: voucher.discountAmount
        ? String(voucher.discountAmount)
        : '',
      maxDiscountAmount: voucher.maxDiscountAmount
        ? String(voucher.maxDiscountAmount)
        : '',
      minimumPurchase: voucher.minimumPurchase,
      totalQuota: voucher.totalQuota,
      usagePerUser: voucher.usagePerUser,
      validFrom: voucher.validFrom.slice(0, 10),
      validUntil: voucher.validUntil.slice(0, 10),
      isActive: voucher.isActive,
      storeId: voucher.storeId || 'GLOBAL',
    })
    setShowEditModal(true)
  }

  const openDetailModal = async (voucher: VoucherItem) => {
    setSelectedVoucher(voucher)
    setLoadingDetail(true)
    setShowDetailModal(true)
    try {
      const res = await fetch(`/api/admin/vouchers/${voucher.id}`)
      if (!res.ok) throw new Error('Gagal memuat detail voucher')
      const data = await res.json()
      setDetailData(data.voucher)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
      setShowDetailModal(false)
    } finally {
      setLoadingDetail(false)
    }
  }

  const openDeleteModal = (voucher: VoucherItem) => {
    setSelectedVoucher(voucher)
    setShowDeleteModal(true)
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const isFixed = formData.discountType === 'FIXED_AMOUNT'
      const payload: Record<string, any> = {
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim() || undefined,
        discountType: formData.discountType,
        discountPercent: isFixed ? 0 : Number(formData.discountPercent),
        discountAmount: isFixed ? Number(formData.discountAmount) : undefined,
        maxDiscountAmount:
          !isFixed && formData.maxDiscountAmount !== ''
            ? Number(formData.maxDiscountAmount)
            : undefined,
        minimumPurchase: Number(formData.minimumPurchase),
        totalQuota: Number(formData.totalQuota),
        usagePerUser: Number(formData.usagePerUser),
        validFrom: new Date(formData.validFrom).toISOString(),
        validUntil: new Date(
          formData.validUntil + 'T23:59:59.999Z'
        ).toISOString(),
        isActive: formData.isActive,
      }

      if (isSuperAdmin && formData.storeId) {
        payload.storeId =
          formData.storeId === 'GLOBAL' ? null : formData.storeId
      }

      const res = await fetch('/api/admin/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal membuat voucher')

      toast.success(`Voucher "${data.voucher.code}" berhasil diterbitkan!`)
      setShowCreateModal(false)
      fetchVouchers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVoucher) return
    setSubmitting(true)
    try {
      const isFixed = formData.discountType === 'FIXED_AMOUNT'
      const payload: Record<string, any> = {
        description: formData.description.trim() || undefined,
        discountType: formData.discountType,
        discountPercent: isFixed ? 0 : Number(formData.discountPercent),
        discountAmount: isFixed ? Number(formData.discountAmount) : null,
        maxDiscountAmount:
          !isFixed && formData.maxDiscountAmount !== ''
            ? Number(formData.maxDiscountAmount)
            : null,
        minimumPurchase: Number(formData.minimumPurchase),
        totalQuota: Number(formData.totalQuota),
        usagePerUser: Number(formData.usagePerUser),
        validFrom: new Date(formData.validFrom).toISOString(),
        validUntil: new Date(
          formData.validUntil + 'T23:59:59.999Z'
        ).toISOString(),
        isActive: formData.isActive,
      }

      if (isSuperAdmin) {
        payload.storeId =
          formData.storeId === 'GLOBAL' ? null : formData.storeId
      }

      const res = await fetch(`/api/admin/vouchers/${selectedVoucher.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal memperbarui voucher')

      toast.success(`Voucher "${selectedVoucher.code}" berhasil diperbarui!`)
      setShowEditModal(false)
      fetchVouchers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSubmit = async () => {
    if (!selectedVoucher) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/vouchers/${selectedVoucher.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus voucher')

      toast.success(`Voucher "${selectedVoucher.code}" berhasil dihapus`)
      setShowDeleteModal(false)
      fetchVouchers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ─── Header Section ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                {isStoreAdmin
                  ? 'Manajemen Voucher Toko'
                  : 'Manajemen Voucher Promo'}
              </h1>
            </div>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600 active:scale-95 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Buat Voucher Baru</span>
        </button>
      </div>

      {/* ─── Summary KPI Cards (1 Baris Ringkas & Simple) ─── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="shadow-xs rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-4">
          <div className="flex items-center justify-between gap-1">
            <span className="truncate text-[10px] font-semibold text-slate-500 dark:text-slate-400 sm:text-xs">
              Total Terbit
            </span>
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 sm:h-8 sm:w-8 sm:rounded-xl">
              <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-1 text-lg font-black text-slate-900 dark:text-white sm:mt-2 sm:text-2xl">
            {stats.total}
          </div>
        </div>

        <div className="shadow-xs rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-4">
          <div className="flex items-center justify-between gap-1">
            <span className="truncate text-[10px] font-semibold text-slate-500 dark:text-slate-400 sm:text-xs">
              Voucher Aktif
            </span>
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 sm:h-8 sm:w-8 sm:rounded-xl">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-1 text-lg font-black text-emerald-600 dark:text-emerald-400 sm:mt-2 sm:text-2xl">
            {stats.active}
          </div>
        </div>

        <div className="shadow-xs rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-4">
          <div className="flex items-center justify-between gap-1">
            <span className="truncate text-[10px] font-semibold text-slate-500 dark:text-slate-400 sm:text-xs">
              Total Penukaran
            </span>
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 sm:h-8 sm:w-8 sm:rounded-xl">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-1 text-lg font-black text-orange-600 dark:text-orange-400 sm:mt-2 sm:text-2xl">
            {stats.totalUsages}
          </div>
        </div>
      </div>

      {/* ─── Filter & Search Bar ─── */}
      <div className="shadow-xs flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Cari kode promo atau deskripsi voucher..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st)
                setCurrentPage(1)
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {st === 'ALL' ? 'Semua' : st === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Vouchers Table ─── */}
      <div className="shadow-xs overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <p className="mt-3 text-xs font-semibold text-slate-600 dark:text-slate-400">
              Memuat data voucher...
            </p>
          </div>
        ) : vouchers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 dark:bg-orange-950/40">
              <Tag className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
              Belum Ada Voucher
            </h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
              {searchQuery
                ? 'Tidak ada voucher yang cocok dengan kriteria pencarian Anda.'
                : 'Mulai buat kode promo perdana untuk mendorong percepatan transaksi toko Anda.'}
            </p>
            {!searchQuery && (
              <button
                onClick={openCreateModal}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-orange-600 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span>Buat Voucher Sekarang</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                  <th className="px-5 py-3.5">Kode & Deskripsi</th>
                  {!isStoreAdmin && (
                    <th className="px-5 py-3.5">Cakupan Toko</th>
                  )}
                  <th className="px-5 py-3.5">Nilai Diskon</th>
                  <th className="px-5 py-3.5">Min. Belanja</th>
                  <th className="px-5 py-3.5">Kuota / Terpakai</th>
                  <th className="px-5 py-3.5">Masa Berlaku</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {vouchers.map((v) => {
                  const isFixed = v.discountType === 'FIXED_AMOUNT'
                  const isExpired = new Date(v.validUntil) < new Date()
                  return (
                    <tr
                      key={v.id}
                      className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    >
                      {/* Kode Promo */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md border border-dashed border-orange-300 bg-orange-50 px-2.5 py-1 font-mono text-xs font-bold text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300">
                            {v.code}
                          </span>
                          <button
                            onClick={() => handleCopy(v.code)}
                            title="Salin Kode"
                            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                          >
                            {copiedCode === v.code ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                        {v.description && (
                          <p className="mt-1 line-clamp-1 max-w-xs text-[11px] text-slate-500 dark:text-slate-400">
                            {v.description}
                          </p>
                        )}
                      </td>

                      {/* Cakupan Toko (Hanya tampil untuk Superadmin) */}
                      {!isStoreAdmin && (
                        <td className="px-5 py-4">
                          {v.store ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                              <Store className="h-2.5 w-2.5" />
                              {v.store.name}
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                              Platform Global
                            </span>
                          )}
                        </td>
                      )}

                      {/* Nilai Diskon */}
                      <td className="px-5 py-4">
                        {isFixed ? (
                          <div className="font-bold text-slate-900 dark:text-white">
                            Rp {(v.discountAmount || 0).toLocaleString('id-ID')}
                            <span className="ml-1 rounded bg-amber-50 px-1 py-0.5 text-[9px] font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                              Nominal
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {v.discountPercent}%
                            </span>
                            {v.maxDiscountAmount && v.maxDiscountAmount > 0 && (
                              <p className="text-[10px] text-slate-400">
                                Maks Rp{' '}
                                {v.maxDiscountAmount.toLocaleString('id-ID')}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Min Belanja */}
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                        {v.minimumPurchase > 0 ? (
                          `Rp ${v.minimumPurchase.toLocaleString('id-ID')}`
                        ) : (
                          <span className="text-slate-400">Tanpa Minimal</span>
                        )}
                      </td>

                      {/* Kuota / Terpakai */}
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                            <span>{v.usedCount}</span>
                            <span className="text-slate-400">/</span>
                            <span>{v.totalQuota}</span>
                          </div>
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className="h-full rounded-full bg-orange-500"
                              style={{
                                width: `${Math.min(100, (v.usedCount / v.totalQuota) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Masa Berlaku */}
                      <td className="px-5 py-4">
                        <div className="space-y-0.5 text-[11px]">
                          <p className="text-slate-600 dark:text-slate-300">
                            {new Date(v.validFrom).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                            })}{' '}
                            -{' '}
                            {new Date(v.validUntil).toLocaleDateString(
                              'id-ID',
                              {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              }
                            )}
                          </p>
                          {isExpired && (
                            <span className="inline-block text-[10px] font-bold text-red-500">
                              Kadaluarsa
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleToggleActive(v)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold transition ${
                            v.isActive && !isExpired
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              v.isActive && !isExpired
                                ? 'bg-emerald-500'
                                : 'bg-slate-400'
                            }`}
                          />
                          <span>
                            {v.isActive && !isExpired ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </button>
                      </td>

                      {/* Aksi */}
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleShareVoucher(v)}
                            title="Bagikan Voucher"
                            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-slate-800 dark:hover:text-orange-400"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openDetailModal(v)}
                            title="Detail Pemakaian"
                            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(v)}
                            title="Edit Voucher"
                            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(v)}
                            title="Hapus Voucher"
                            className="flex h-8 w-8 items-center justify-center rounded-xl text-red-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── Pagination Controls ─── */}
        {!loading && pagination.total > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900/40 sm:flex-row">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Menampilkan{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>{' '}
              -{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              dari{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {pagination.total}
              </span>{' '}
              voucher
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="shadow-xs flex h-8 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Sebelumnya</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: pagination.totalPages },
                    (_, i) => i + 1
                  ).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold transition ${
                        currentPage === pageNum
                          ? 'shadow-xs bg-orange-500 text-white'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(pagination.totalPages, p + 1)
                    )
                  }
                  disabled={currentPage >= pagination.totalPages}
                  className="shadow-xs flex h-8 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <span className="hidden sm:inline">Selanjutnya</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Create Voucher Modal (Rendered with React Portal to cover header) ─── */}
      {mounted &&
        showCreateModal &&
        createPortal(
          <div className="backdrop-blur-xs fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 p-3 sm:p-4">
            <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:max-h-[88vh]">
              {/* Header (Sticky / Fixed at top) */}
              <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-orange-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white sm:text-base">
                    Buat Voucher Baru
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Content (Scrollable with fixed footer) */}
              <form
                onSubmit={handleCreateSubmit}
                className="flex min-h-0 flex-1 flex-col overflow-hidden"
              >
                <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                  {/* Discount Type Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Jenis Diskon Potongan
                    </label>
                    <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            discountType: 'PERCENTAGE',
                          })
                        }
                        className={`rounded-lg py-1.5 text-xs font-bold transition ${
                          formData.discountType === 'PERCENTAGE'
                            ? 'shadow-xs bg-white text-orange-600 dark:bg-slate-900 dark:text-orange-400'
                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                        }`}
                      >
                        Persentase (%)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            discountType: 'FIXED_AMOUNT',
                          })
                        }
                        className={`rounded-lg py-1.5 text-xs font-bold transition ${
                          formData.discountType === 'FIXED_AMOUNT'
                            ? 'shadow-xs bg-white text-orange-600 dark:bg-slate-900 dark:text-orange-400'
                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                        }`}
                      >
                        Nominal Langsung (Rp)
                      </button>
                    </div>
                  </div>

                  {/* Kode Promo & Nilai Diskon */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Kode Promo *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.code}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            code: e.target.value
                              .toUpperCase()
                              .replace(/\s/g, ''),
                          })
                        }
                        placeholder="Contoh: DISKON50"
                        className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-900 placeholder:font-normal placeholder:normal-case placeholder:tracking-normal focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>

                    {formData.discountType === 'PERCENTAGE' ? (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Diskon (%) *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            required
                            min={1}
                            max={99}
                            value={formData.discountPercent}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                discountPercent: Number(e.target.value),
                              })
                            }
                            className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                          <Percent className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Nominal Potongan (Rp) *
                        </label>
                        <input
                          type="number"
                          required
                          min={1000}
                          step={1000}
                          value={formData.discountAmount}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              discountAmount: e.target.value,
                            })
                          }
                          placeholder="Contoh: 50000"
                          className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    )}
                  </div>

                  {/* Scoping Toko (Super Admin can choose, Store Admin auto) */}
                  {isSuperAdmin && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Cakupan Toko
                      </label>
                      <select
                        value={formData.storeId}
                        onChange={(e) =>
                          setFormData({ ...formData, storeId: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      >
                        <option value="GLOBAL">
                          Platform Global (Berlaku untuk Semua Toko)
                        </option>
                        {stores.map((s) => (
                          <option key={s.id} value={s.id}>
                            Khusus Toko: {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Deskripsi */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Deskripsi Voucher (Opsional)
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Misal: Promo Gajian potongan belanja produk"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  {/* Cap Maksimal & Min Belanja */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {formData.discountType === 'PERCENTAGE' && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Maks Diskon (Rp)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={formData.maxDiscountAmount}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              maxDiscountAmount: e.target.value,
                            })
                          }
                          placeholder="Kosongkan jika tanpa batas"
                          className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Min. Pembelian (Rp)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={formData.minimumPurchase}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            minimumPurchase: Number(e.target.value),
                          })
                        }
                        placeholder="0"
                        className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Kuota Total & Limit per User */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Total Kuota Voucher *
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={formData.totalQuota}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            totalQuota: Number(e.target.value),
                          })
                        }
                        className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Maks Pemakaian / User *
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={formData.usagePerUser}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            usagePerUser: Number(e.target.value),
                          })
                        }
                        className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Periode Berlaku (Responsive 1 col mobile, 2 col sm: to prevent overlap) */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="min-w-0 space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Mulai Berlaku *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.validFrom}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            validFrom: e.target.value,
                          })
                        }
                        className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div className="min-w-0 space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Berakhir Pada *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.validUntil}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            validUntil: e.target.value,
                          })
                        }
                        className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Buttons (Fixed at bottom) */}
                <div className="shrink-0 border-t border-slate-100 bg-slate-50/70 px-5 py-3 dark:border-slate-800 dark:bg-slate-900/70">
                  <div className="flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600 active:scale-95 disabled:opacity-50"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Simpan Voucher'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ─── Edit Voucher Modal (Rendered with React Portal to cover header) ─── */}
      {mounted &&
        showEditModal &&
        selectedVoucher &&
        createPortal(
          <div className="backdrop-blur-xs fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 p-3 sm:p-4">
            <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:max-h-[88vh]">
              {/* Header (Sticky / Fixed at top) */}
              <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Edit className="h-5 w-5 text-orange-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white sm:text-base">
                    Edit Voucher: {selectedVoucher.code}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Content (Scrollable with fixed footer) */}
              <form
                onSubmit={handleEditSubmit}
                className="flex min-h-0 flex-1 flex-col overflow-hidden"
              >
                <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                  {/* Kode Promo (Read Only) & Discount Type */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Kode Promo (Permanen)
                      </label>
                      <input
                        type="text"
                        disabled
                        value={formData.code}
                        className="w-full min-w-0 cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                      />
                    </div>

                    {formData.discountType === 'PERCENTAGE' ? (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Diskon (%) *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            required
                            min={1}
                            max={99}
                            value={formData.discountPercent}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                discountPercent: Number(e.target.value),
                              })
                            }
                            className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                          <Percent className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Nominal Potongan (Rp) *
                        </label>
                        <input
                          type="number"
                          required
                          min={1000}
                          step={1000}
                          value={formData.discountAmount}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              discountAmount: e.target.value,
                            })
                          }
                          className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    )}
                  </div>

                  {/* Deskripsi */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Deskripsi Voucher
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  {/* Cap Maksimal & Min Belanja */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {formData.discountType === 'PERCENTAGE' && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Maks Diskon (Rp)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={formData.maxDiscountAmount}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              maxDiscountAmount: e.target.value,
                            })
                          }
                          placeholder="Kosongkan jika tanpa batas"
                          className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Min. Pembelian (Rp)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={formData.minimumPurchase}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            minimumPurchase: Number(e.target.value),
                          })
                        }
                        className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Kuota Total & Limit per User */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Total Kuota Voucher *
                      </label>
                      <input
                        type="number"
                        required
                        min={selectedVoucher.usedCount}
                        value={formData.totalQuota}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            totalQuota: Number(e.target.value),
                          })
                        }
                        className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Maks Pemakaian / User *
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={formData.usagePerUser}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            usagePerUser: Number(e.target.value),
                          })
                        }
                        className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Periode Berlaku (Responsive 1 col mobile, 2 col sm: to prevent overlap) */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="min-w-0 space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Mulai Berlaku
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.validFrom}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            validFrom: e.target.value,
                          })
                        }
                        className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div className="min-w-0 space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Berakhir Pada
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.validUntil}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            validUntil: e.target.value,
                          })
                        }
                        className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Status Active Checkbox */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="isActiveEdit"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400"
                    />
                    <label
                      htmlFor="isActiveEdit"
                      className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Aktifkan voucher ini
                    </label>
                  </div>
                </div>

                {/* Submit Buttons (Fixed at bottom) */}
                <div className="shrink-0 border-t border-slate-100 bg-slate-50/70 px-5 py-3 dark:border-slate-800 dark:bg-slate-900/70">
                  <div className="flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600 active:scale-95 disabled:opacity-50"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Perbarui Voucher'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ─── Detail Pemakaian Modal (Rendered with React Portal to cover header) ─── */}
      {mounted &&
        showDetailModal &&
        selectedVoucher &&
        createPortal(
          <div className="backdrop-blur-xs fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 p-3 sm:p-4">
            <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:max-h-[88vh]">
              <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-orange-500" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white sm:text-base">
                      Riwayat Penukaran: {selectedVoucher.code}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Total pemakaian: {selectedVoucher.usedCount} dari{' '}
                      {selectedVoucher.totalQuota} kuota
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                {loadingDetail ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                    <p className="mt-2 text-xs text-slate-500">
                      Memuat daftar pemakaian...
                    </p>
                  </div>
                ) : !detailData?.usages || detailData.usages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                    <p className="mt-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                      Belum Ada Penukaran
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Voucher ini belum pernah digunakan oleh pembeli manapun.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-100 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:bg-slate-800">
                        <tr>
                          <th className="px-4 py-2.5">Pengguna</th>
                          <th className="px-4 py-2.5">No. Pesanan</th>
                          <th className="px-4 py-2.5">Potongan</th>
                          <th className="px-4 py-2.5">Waktu Pakai</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {detailData.usages.map((u) => (
                          <tr key={u.id}>
                            <td className="px-4 py-3">
                              <p className="font-bold text-slate-800 dark:text-slate-200">
                                {u.user.name || 'Pengguna'}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {u.user.email}
                              </p>
                            </td>
                            <td className="px-4 py-3 font-mono text-[11px] font-bold text-slate-600 dark:text-slate-400">
                              #{u.order.orderNumber}
                            </td>
                            <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">
                              Rp {u.discountApplied.toLocaleString('id-ID')}
                            </td>
                            <td className="px-4 py-3 text-[11px] text-slate-500">
                              {new Date(u.usedAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Fixed Footer */}
              <div className="shrink-0 border-t border-slate-100 bg-slate-50/70 px-5 py-3 dark:border-slate-800 dark:bg-slate-900/70">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowDetailModal(false)}
                    className="rounded-xl bg-slate-200/80 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ─── Share Voucher Modal ─── */}
      {mounted &&
        showShareModal &&
        voucherToShare &&
        createPortal(
          <div className="backdrop-blur-xs fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 p-3 sm:p-4">
            <div className="relative flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
              {/* Modal Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                    <Share2 className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white sm:text-base">
                    Bagikan Voucher Promo
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Modal Body */}
              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                {/* ─── Visual Voucher Ticket Card ─── */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-5 text-white shadow-lg">
                  {/* Left & Right Notch Cutouts for ticket effect */}
                  <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white shadow-inner dark:bg-slate-900" />
                  <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white shadow-inner dark:bg-slate-900" />

                  {/* Ticket Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-white/20 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="backdrop-blur-xs flex h-7 w-7 items-center justify-center rounded-lg bg-white/20">
                        <Store className="h-4 w-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold leading-tight">
                          {voucherToShare.store?.name ||
                            'Affiliate Gadget Indonesia'}
                        </p>
                        <p className="text-[10px] text-orange-100">
                          Official Store Garansi 30 Hari
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Main Ticket Content */}
                  <div className="my-4 text-center">
                    <div className="inline-flex items-center gap-1.5 text-3xl font-black tracking-tight sm:text-4xl">
                      {voucherToShare.discountType === 'FIXED_AMOUNT' ? (
                        <>
                          <span className="text-xl font-bold sm:text-2xl">
                            Rp
                          </span>
                          <span>
                            {(
                              voucherToShare.discountAmount || 0
                            ).toLocaleString('id-ID')}
                          </span>
                        </>
                      ) : (
                        <>
                          <span>{voucherToShare.discountPercent}%</span>
                          <span className="text-xl font-bold sm:text-2xl">
                            OFF
                          </span>
                        </>
                      )}
                    </div>
                    {voucherToShare.discountType !== 'FIXED_AMOUNT' &&
                    voucherToShare.maxDiscountAmount ? (
                      <p className="mt-1 text-xs text-orange-100">
                        Maks. Potongan Rp{' '}
                        {voucherToShare.maxDiscountAmount.toLocaleString(
                          'id-ID'
                        )}
                      </p>
                    ) : null}

                    {/* Voucher Code Capsule */}
                    <div className="backdrop-blur-xs mt-3 flex items-center justify-between rounded-xl border border-dashed border-white/40 bg-white/15 px-3 py-2">
                      <div className="text-left">
                        <span className="text-[9px] uppercase tracking-wider text-orange-200">
                          Kode Promo
                        </span>
                        <p className="font-mono text-base font-black tracking-widest text-white">
                          {voucherToShare.code}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(voucherToShare.code)}
                        className="shadow-xs flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-orange-600 transition hover:bg-orange-50 active:scale-95"
                      >
                        {copiedCode === voucherToShare.code ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span>Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Ticket Footer Meta */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-white/30 pt-3 text-[11px] text-orange-100">
                    <div className="flex items-center gap-1">
                      <ShoppingBag className="h-3 w-3 shrink-0" />
                      <span>
                        {voucherToShare.minimumPurchase > 0
                          ? `Min. Rp ${voucherToShare.minimumPurchase.toLocaleString('id-ID')}`
                          : 'Tanpa Min. Belanja'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>
                        s/d{' '}
                        {new Date(voucherToShare.validUntil).toLocaleDateString(
                          'id-ID',
                          {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          }
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ─── Tombol Salin Tautan Voucher ─── */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleCopyShareLink(voucherToShare.code)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 py-3 text-xs font-bold text-white shadow-md transition hover:from-orange-600 hover:to-amber-600 active:scale-[0.99]"
                  >
                    {shareCopied ? (
                      <>
                        <Check className="h-4 w-4 text-white" />
                        <span>✓ Tautan Voucher Berhasil Disalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Salin Tautan Voucher</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ─── Delete Confirmation Modal (Rendered with React Portal to cover header) ─── */}
      {mounted &&
        showDeleteModal &&
        selectedVoucher &&
        createPortal(
          <div className="backdrop-blur-xs fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 p-3 sm:p-4">
            <div className="relative flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                <AlertTriangle className="h-6 w-6" />
              </div>

              <div className="mt-4 text-center">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Hapus Voucher {selectedVoucher.code}?
                </h3>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {selectedVoucher.usedCount > 0
                    ? `Voucher ini sudah dipakai sebanyak ${selectedVoucher.usedCount} kali. Voucher yang sudah memiliki riwayat pemakaian tidak dapat dihapus, hanya dapat dinonaktifkan.`
                    : 'Voucher ini akan dihapus permanen dari sistem.'}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                {selectedVoucher.usedCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleToggleActive(selectedVoucher)
                      setShowDeleteModal(false)
                    }}
                    className="rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-amber-700"
                  >
                    Nonaktifkan Voucher
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleDeleteSubmit}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Hapus Permanen'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
