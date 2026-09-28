'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useSession } from 'next-auth/react'
import {
  RotateCcw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  RefreshCw,
  Building2,
  Package,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Play,
  X,
  Loader2,
  MessageSquare,
  Truck,
  Eye,
  ArrowUpRight,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { CustomSelect } from '@/components/ui/custom-select'
import { usePageGuard } from '@/hooks/use-page-guard'

interface ReturnRequest {
  id: string
  orderId: string
  userId: string
  storeId?: string | null
  type: 'REFUND' | 'REPLACEMENT'
  reason: string
  reasonLabel?: string | null
  description: string
  images: string[]
  videoUrl?: string | null
  bankName?: string | null
  bankAccountNumber?: string | null
  bankAccountName?: string | null
  refundAmount?: number | null
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
  storeResponse?: string | null
  returnCourier?: string | null
  returnTrackingNumber?: string | null
  createdAt: string
  resolvedAt?: string | null
  order: {
    orderNumber: string
    status: string
    total: number
    courierCode?: string | null
    courierService?: string | null
    items: Array<{
      product?: {
        id: string
        name: string
        brand?: string | null
        images?: string[]
      } | null
      service?: { id: string; name: string } | null
    }>
    store?: {
      id: string
      name: string
      companyName?: string | null
      city: string
      phone?: string | null
    } | null
  }
  user: {
    id: string
    name: string
    email: string
    phone?: string | null
  }
}

const statusConfig: Record<
  string,
  { label: string; badgeClass: string; dotClass: string }
> = {
  PENDING: {
    label: 'Perlu Verifikasi',
    badgeClass:
      'bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/80',
    dotClass: 'bg-amber-500 animate-pulse',
  },
  IN_REVIEW: {
    label: 'Sedang Diperiksa',
    badgeClass:
      'bg-blue-50 text-blue-800 border border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/80',
    dotClass: 'bg-blue-500',
  },
  APPROVED: {
    label: 'Pengajuan Disetujui',
    badgeClass:
      'bg-emerald-50 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/80',
    dotClass: 'bg-emerald-500',
  },
  COMPLETED: {
    label: 'Pengembalian Selesai',
    badgeClass:
      'bg-emerald-50 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/80',
    dotClass: 'bg-emerald-500',
  },
  REJECTED: {
    label: 'Pengajuan Ditolak',
    badgeClass:
      'bg-rose-50 text-rose-800 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/80',
    dotClass: 'bg-rose-500',
  },
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

function formatPrice(price?: number | null) {
  if (typeof price !== 'number' || isNaN(price)) return 'Rp 0'
  return `Rp ${price.toLocaleString('id-ID')}`
}

export default function AdminReturnsPage() {
  const { isLoading: guardLoading, isAllowed } = usePageGuard(
    '/dashboard/admin/returns'
  )
  const { data: session } = useSession()
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'
  const isAdminPlatform = session?.user?.role === 'ADMIN'

  const [returns, setReturns] = useState<ReturnRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<
    'ALL' | 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'COMPLETED' | 'REJECTED'
  >('ALL')
  const [typeFilter, setTypeFilter] = useState<
    'ALL' | 'REFUND' | 'REPLACEMENT'
  >('ALL')
  const [selectedStore, setSelectedStore] = useState<string>('ALL')

  // Action Dialogs
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(
    null
  )
  const [actionModalType, setActionModalType] = useState<
    'APPROVE' | 'REJECT' | 'RESPONSE' | 'COMPLETE' | null
  >(null)
  const [responseText, setResponseText] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Lightbox Media Viewer
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [activeMediaIndex, setActiveMediaIndex] = useState(0)
  const [lightboxMeta, setLightboxMeta] = useState<{
    title: string
    subtitle: string
  } | null>(null)

  // Fetch Returns
  const fetchReturns = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/returns')
      const data = await res.json()
      if (res.ok && data.success) {
        setReturns(data.data || [])
      } else {
        toast.error(data.error || 'Gagal memuat daftar pengajuan pengembalian')
      }
    } catch (err) {
      console.error('Error fetching returns:', err)
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReturns()
  }, [fetchReturns])

  // Extract unique stores for filtering
  const storeOptions = useMemo(() => {
    const map = new Map<string, string>()
    returns.forEach((r) => {
      if (r.order?.store?.id && r.order?.store?.name) {
        map.set(r.order.store.id, r.order.store.name)
      }
    })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [returns])

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = returns.length
    const pending = returns.filter((r) => r.status === 'PENDING').length
    const inReview = returns.filter((r) => r.status === 'IN_REVIEW').length
    const approved = returns.filter((r) => r.status === 'APPROVED').length
    const completed = returns.filter((r) => r.status === 'COMPLETED').length
    const rejected = returns.filter((r) => r.status === 'REJECTED').length
    const totalRefundAmount = returns
      .filter(
        (r) =>
          r.type === 'REFUND' &&
          (r.status === 'APPROVED' || r.status === 'COMPLETED')
      )
      .reduce((sum, r) => sum + (r.refundAmount || r.order.total || 0), 0)

    return {
      total,
      pending,
      inReview,
      approved,
      completed,
      rejected,
      totalRefundAmount,
    }
  }, [returns])

  // Filtered Returns
  const filteredReturns = useMemo(() => {
    return returns.filter((r) => {
      // Tab Status Filter
      if (activeTab !== 'ALL' && r.status !== activeTab) return false

      // Solution Type Filter
      if (typeFilter !== 'ALL' && r.type !== typeFilter) return false

      // Store Filter
      if (selectedStore !== 'ALL' && r.order?.store?.id !== selectedStore)
        return false

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchOrder = r.order?.orderNumber?.toLowerCase().includes(q)
        const matchUser =
          r.user?.name?.toLowerCase().includes(q) ||
          r.user?.email?.toLowerCase().includes(q)
        const matchReason =
          r.reasonLabel?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q)
        const matchBank =
          r.bankName?.toLowerCase().includes(q) ||
          r.bankAccountNumber?.toLowerCase().includes(q)
        const matchTracking = r.returnTrackingNumber?.toLowerCase().includes(q)

        if (
          !matchOrder &&
          !matchUser &&
          !matchReason &&
          !matchBank &&
          !matchTracking
        ) {
          return false
        }
      }

      return true
    })
  }, [returns, activeTab, typeFilter, selectedStore, searchQuery])

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success('Disalin ke clipboard')
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Handle status update
  const handleUpdateStatus = async (
    returnId: string,
    newStatus: string,
    responseMsg?: string
  ) => {
    setIsProcessing(true)
    try {
      const res = await fetch(`/api/returns/${returnId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          storeResponse: responseMsg,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message || 'Status pengembalian berhasil diperbarui')
        setActionModalType(null)
        setSelectedReturn(null)
        setResponseText('')
        setRejectionReason('')
        fetchReturns()
      } else {
        toast.error(data.error || 'Gagal memperbarui status')
      }
    } catch (err) {
      console.error('Error updating status:', err)
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setIsProcessing(false)
    }
  }

  // Open Lightbox
  const handleOpenLightbox = (
    images: string[],
    index: number,
    meta?: { title: string; subtitle: string }
  ) => {
    setLightboxImages(images)
    setActiveMediaIndex(index)
    setLightboxMeta(meta || null)
    setLightboxOpen(true)
  }

  // Lightbox keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false)
      if (e.key === 'ArrowLeft') {
        setActiveMediaIndex((prev) =>
          prev > 0 ? prev - 1 : lightboxImages.length - 1
        )
      }
      if (e.key === 'ArrowRight') {
        setActiveMediaIndex((prev) =>
          prev < lightboxImages.length - 1 ? prev + 1 : 0
        )
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxOpen, lightboxImages])

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16">
      {/* 1. Unified Luxury Bento Metric Grid (Neutral Harmony) */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {/* Card: Total Pengajuan */}
        <div className="shadow-2xs flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Total Pengajuan
            </span>
            <RotateCcw className="h-4 w-4" />
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              {metrics.total}
            </div>
            <span className="mt-0.5 block text-[11px] text-slate-400">
              Klaim terdaftar
            </span>
          </div>
        </div>

        {/* Card: Perlu Verifikasi */}
        <div className="shadow-2xs flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Perlu Verifikasi
            </span>
            <div className="flex h-2 w-2 animate-pulse rounded-full bg-amber-500" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2 font-mono text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              <span>{metrics.pending}</span>
              {metrics.pending > 0 && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:bg-amber-950/50">
                  Antrean Baru
                </span>
              )}
            </div>
            <span className="mt-0.5 block text-[11px] text-slate-400">
              Menunggu toko
            </span>
          </div>
        </div>

        {/* Card: Sedang Diperiksa */}
        <div className="shadow-2xs flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Sedang Diperiksa
            </span>
            <RefreshCw className="h-4 w-4" />
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              {metrics.inReview}
            </div>
            <span className="mt-0.5 block text-[11px] text-slate-400">
              Uji fisik teknisi
            </span>
          </div>
        </div>

        {/* Card: Total Refund Diselesaikan */}
        <div className="shadow-2xs flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Total Nilai Refund
            </span>
            <CreditCard className="h-4 w-4 text-orange-500" />
          </div>
          <div className="mt-3">
            <div className="truncate font-mono text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl">
              {formatPrice(metrics.totalRefundAmount)}
            </div>
            <span className="mt-0.5 block text-[11px] text-slate-400">
              {metrics.approved + metrics.completed} retur diselesaikan
            </span>
          </div>
        </div>
      </div>

      {/* 2. Unified Control Panel (Identik dengan Katalog Gadget & Pesanan) */}
      <div className="shadow-2xs flex flex-col items-stretch justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900 sm:p-3 xl:flex-row xl:items-center">
        {/* Left: Status Filter Pills */}
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto rounded-2xl bg-slate-100/80 p-1 dark:bg-slate-800/80">
          {[
            { id: 'ALL', label: 'Semua Status', count: metrics.total },
            {
              id: 'PENDING',
              label: 'Perlu Verifikasi',
              count: metrics.pending,
            },
            {
              id: 'IN_REVIEW',
              label: 'Sedang Diperiksa',
              count: metrics.inReview,
            },
            { id: 'APPROVED', label: 'Disetujui', count: metrics.approved },
            { id: 'COMPLETED', label: 'Selesai', count: metrics.completed },
            { id: 'REJECTED', label: 'Ditolak', count: metrics.rejected },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`cursor-pointer whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'shadow-xs bg-white text-slate-950 dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`py-0.2 ml-1.5 rounded-full px-1.5 font-mono text-[10px] ${
                    activeTab === tab.id
                      ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-200'
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Right: Solution Filter, Store Selector, Search, & Refresh */}
        <div className="flex w-full flex-wrap items-center gap-2 sm:flex-nowrap xl:w-auto">
          {/* Solution Selector Dropdown */}
          <CustomSelect
            value={typeFilter}
            onChange={(val) => setTypeFilter(val as any)}
            size="sm"
            options={[
              { value: 'ALL', label: 'Semua Solusi' },
              { value: 'REFUND', label: 'Refund Dana' },
              { value: 'REPLACEMENT', label: 'Tukar Unit' },
            ]}
          />

          {/* Store Filter (for Superadmin & Admin Platform) */}
          {(isSuperAdmin || isAdminPlatform) && storeOptions.length > 0 && (
            <CustomSelect
              value={selectedStore}
              onChange={(val) => setSelectedStore(val)}
              size="sm"
              options={[
                { value: 'ALL', label: 'Semua Toko' },
                ...storeOptions.map((s) => ({ value: s.id, label: s.name })),
              ]}
            />
          )}

          {/* Search Bar */}
          <div className="relative flex-1 xl:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nomor pesanan, nama pembeli..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-xs font-medium outline-none transition focus:border-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchReturns}
            title="Refresh Data"
            disabled={loading}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* 4. Returns List Content */}
      {loading ? (
        <div className="shadow-2xs flex flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white py-20 dark:border-slate-800 dark:bg-slate-900">
          <Loader2 className="mb-3 h-8 w-8 animate-spin text-orange-500" />
          <p className="text-xs font-semibold text-slate-500">
            Memuat data pengajuan pengembalian...
          </p>
        </div>
      ) : filteredReturns.length === 0 ? (
        <div className="shadow-2xs flex flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white px-4 py-20 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 text-slate-400 dark:bg-slate-800">
            <RotateCcw className="h-7 w-7" />
          </div>
          <h3 className="mb-1 text-base font-black text-slate-950 dark:text-white">
            Tidak Ada Pengajuan Pengembalian
          </h3>
          <p className="max-w-sm text-xs text-slate-500 dark:text-slate-400">
            {searchQuery || activeTab !== 'ALL' || typeFilter !== 'ALL'
              ? 'Tidak ditemukan pengajuan retur yang sesuai dengan kriteria filter saat ini.'
              : 'Belum ada pengajuan pengembalian barang dari pembeli.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReturns.map((item) => {
            const currentStatus =
              statusConfig[item.status] || statusConfig.PENDING
            const gadgetProduct = item.order?.items?.[0]?.product

            return (
              <div
                key={item.id}
                className="shadow-2xs hover:shadow-xs space-y-5 rounded-3xl border border-slate-200/80 bg-white p-5 transition dark:border-slate-800 dark:bg-slate-900 sm:p-6"
              >
                {/* Top Bar: Customer Identity, Order Number, Store, & Status */}
                <div className="flex flex-col justify-between gap-3.5 border-b border-slate-100 pb-4 dark:border-slate-800 sm:flex-row sm:items-center">
                  {/* Customer Anchor */}
                  <div className="flex items-center gap-3">
                    {/* Avatar Monogram Squircle */}
                    <div className="shadow-2xs flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-sm font-black text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                      {item.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-black text-slate-950 dark:text-white">
                          {item.user?.name || 'Customer'}
                        </h3>
                        <button
                          onClick={() =>
                            handleCopy(item.order?.orderNumber, item.id)
                          }
                          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-[11px] font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                          title="Salin Nomor Pesanan"
                        >
                          <span>#{item.order?.orderNumber}</span>
                          {copiedId === item.id ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3 text-slate-400" />
                          )}
                        </button>
                      </div>

                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                        <span>{item.user?.email}</span>
                        {item.user?.phone && (
                          <>
                            <span>•</span>
                            <span>{item.user.phone}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Store Pill & Semantic Badges */}
                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    {/* Store Badge (for Superadmin / Admin Platform) */}
                    {(isSuperAdmin || isAdminPlatform) && item.order?.store && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <Building2 className="h-3 w-3 text-orange-500" />
                        <span>{item.order.store.name}</span>
                      </span>
                    )}

                    {/* Solution Type Pill */}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold ${
                        item.type === 'REFUND'
                          ? 'border border-orange-200/80 bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300'
                          : 'border border-blue-200/80 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                      }`}
                    >
                      {item.type === 'REFUND' ? (
                        <CreditCard className="h-3 w-3" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}
                      <span>
                        {item.type === 'REFUND'
                          ? 'Refund 100%'
                          : 'Tukar Unit Pengganti'}
                      </span>
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold ${currentStatus.badgeClass}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${currentStatus.dotClass}`}
                      />
                      <span>{currentStatus.label}</span>
                    </span>
                  </div>
                </div>

                {/* Main Content: 2-Column Balanced Architecture */}
                <div className="grid grid-cols-1 gap-5 text-xs lg:grid-cols-2">
                  {/* Column 1: Gadget Unit & Issue Details */}
                  <div className="flex flex-col justify-between space-y-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                    <div className="space-y-3">
                      {/* Gadget Card Strip */}
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-3 dark:border-slate-700/60">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="relative h-14 max-h-[56px] min-h-[56px] w-14 min-w-[56px] max-w-[56px] shrink-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-700 dark:bg-slate-800">
                            {gadgetProduct?.images?.[0] ? (
                              <img
                                src={gadgetProduct.images[0]}
                                alt="Gadget"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-400">
                                <Package className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="truncate text-xs font-bold text-slate-950 dark:text-white sm:text-sm">
                              {gadgetProduct?.name || 'Unit Gadget Pesanan'}
                            </h4>
                            <span className="mt-0.5 block text-[11px] text-slate-400">
                              {gadgetProduct?.brand || 'Smartphone'}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 pl-3 text-right">
                          <span className="block text-[10px] text-slate-400">
                            Total Transaksi
                          </span>
                          <span className="font-mono text-xs font-black text-slate-950 dark:text-white sm:text-sm">
                            {formatPrice(item.order?.total)}
                          </span>
                        </div>
                      </div>

                      {/* Issue Details & Customer Note */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Kendala:
                          </span>
                          <span className="rounded-lg border border-slate-200/80 bg-white px-2.5 py-0.5 text-[11px] font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            {item.reasonLabel || item.reason}
                          </span>
                        </div>
                        <p className="rounded-xl border border-slate-200/60 bg-white/70 p-3 text-xs leading-relaxed text-slate-700 dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-300">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Bukti Unboxing Media Gallery */}
                    {item.images && item.images.length > 0 && (
                      <div className="border-t border-slate-200/60 pt-3 dark:border-slate-700/60">
                        <span className="mb-2 block text-[10px] font-bold text-slate-400">
                          Bukti Unboxing ({item.images.length} Lampiran)
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {item.images.map((img, i) => {
                            const isVideo =
                              /\.(mp4|webm|mov|mkv|ogg|3gp)$/i.test(img)
                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() =>
                                  handleOpenLightbox(item.images, i, {
                                    title: `Bukti Unboxing #${item.order?.orderNumber}`,
                                    subtitle: item.user?.name,
                                  })
                                }
                                className="group relative h-12 max-h-[48px] min-h-[48px] w-12 min-w-[48px] max-w-[48px] shrink-0 cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:scale-105 dark:border-slate-700 dark:bg-slate-800"
                              >
                                {isVideo ? (
                                  <div className="flex h-full w-full items-center justify-center bg-slate-900 text-white">
                                    <Play className="h-4 w-4 text-orange-400" />
                                  </div>
                                ) : (
                                  <img
                                    src={img}
                                    alt="Bukti"
                                    className="h-full w-full object-cover"
                                  />
                                )}
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100">
                                  <Eye className="h-3.5 w-3.5 text-white" />
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Column 2: Solution Resolution, Bank / Exchange Details & Store Response */}
                  <div className="flex flex-col justify-between space-y-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                    <div className="space-y-3">
                      {item.type === 'REFUND' ? (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 dark:border-slate-700/60">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-950 dark:text-white">
                              <CreditCard className="h-3.5 w-3.5 text-orange-500" />
                              <span>Rekening Pengembalian Dana</span>
                            </div>
                            <span className="font-mono text-xs font-black text-orange-600 dark:text-orange-400 sm:text-sm">
                              {formatPrice(
                                item.refundAmount || item.order?.total
                              )}
                            </span>
                          </div>

                          <div className="space-y-1.5 rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400">
                                Bank & No. Rekening:
                              </span>
                              <button
                                onClick={() =>
                                  handleCopy(
                                    item.bankAccountNumber || '',
                                    `bank-${item.id}`
                                  )
                                }
                                className="inline-flex items-center gap-1 font-mono font-bold text-slate-900 transition hover:text-orange-500 dark:text-white"
                              >
                                <span>
                                  {item.bankName} -{' '}
                                  {item.bankAccountNumber || '-'}
                                </span>
                                {copiedId === `bank-${item.id}` ? (
                                  <Check className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3 w-3 text-slate-400" />
                                )}
                              </button>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400">Atas Nama:</span>
                              <span className="font-bold text-slate-900 dark:text-white">
                                {item.bankAccountName || '-'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 dark:border-slate-700/60">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-950 dark:text-white">
                              <RefreshCw className="h-3.5 w-3.5 text-blue-500" />
                              <span>Solusi Penukaran Unit</span>
                            </div>
                            <span className="rounded-full border border-blue-200/60 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/50">
                              Unit Pengganti Teruji
                            </span>
                          </div>

                          <div className="rounded-xl border border-slate-200/80 bg-white p-3 text-xs leading-relaxed text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            Toko cabang akan menyiapkan unit second berkualitas
                            pengganti (teruji fungsi 100%) untuk dikirimkan
                            kembali kepada pembeli setelah unit fisik retur tiba
                            dan lolos verifikasi teknisi.
                          </div>
                        </div>
                      )}

                      {/* Tanggapan Toko / Store Response */}
                      {item.storeResponse && (
                        <div className="space-y-1 rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Tanggapan Resmi Toko:</span>
                          </div>
                          <p className="text-xs leading-relaxed text-emerald-950 dark:text-emerald-200">
                            {item.storeResponse}
                          </p>
                        </div>
                      )}

                      {/* Resi Kirim Balik dari Pembeli */}
                      {item.returnTrackingNumber && (
                        <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-800">
                          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                            <Truck className="h-3.5 w-3.5 text-orange-500" />{' '}
                            Resi Kirim Balik:
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-950 dark:text-white">
                            {item.returnCourier} - {item.returnTrackingNumber}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* ID Pengajuan Info */}
                    <div className="flex items-center justify-between border-t border-slate-200/60 pt-2.5 text-[11px] text-slate-400 dark:border-slate-700/60">
                      <span>ID Tiket Pengajuan:</span>
                      <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                        {item.id.slice(0, 10)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Bar (Operational Controls with High Contrast Action Orange Pill) */}
                <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-slate-100 pt-3.5 dark:border-slate-800">
                  {/* Setujui & Tolak for PENDING */}
                  {item.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedReturn(item)
                          setActionModalType('APPROVE')
                          setResponseText(
                            'Pengajuan disetujui. Silakan kirimkan unit lengkap beserta kotak kemasan dan aksesoris bonus ke alamat toko.'
                          )
                        }}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-orange-500 px-5 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition hover:bg-orange-600 active:scale-95"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Setujui Pengajuan</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedReturn(item)
                          setActionModalType('REJECT')
                        }}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 active:scale-95 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <XCircle className="h-3.5 w-3.5 text-rose-500" />
                        <span>Tolak</span>
                      </button>
                    </>
                  )}

                  {/* Mulai Periksa Fisik */}
                  {item.status === 'APPROVED' && (
                    <button
                      onClick={() =>
                        handleUpdateStatus(
                          item.id,
                          'IN_REVIEW',
                          'Unit telah tiba di toko dan sedang dalam proses pengujian fisik teknisi.'
                        )
                      }
                      className="shadow-xs inline-flex cursor-pointer items-center gap-2 rounded-full bg-slate-950 px-5 py-2 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95 dark:bg-white dark:text-slate-950"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Mulai Pemeriksaan Unit</span>
                    </button>
                  )}

                  {/* Selesaikan Pengembalian */}
                  {(item.status === 'IN_REVIEW' ||
                    item.status === 'APPROVED') && (
                    <button
                      onClick={() => {
                        setSelectedReturn(item)
                        setActionModalType('COMPLETE')
                        setResponseText(
                          item.type === 'REFUND'
                            ? `Pengembalian dana sebesar ${formatPrice(item.refundAmount || item.order.total)} telah berhasil ditransfer ke rekening ${item.bankName} ${item.bankAccountNumber}.`
                            : 'Unit pengganti teruji telah dikirimkan ke alamat Anda. Terima kasih telah berbelanja di Affiliate Gadget.'
                        )
                      }}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-orange-500 px-5 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition hover:bg-orange-600 active:scale-95"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>
                        {item.type === 'REFUND'
                          ? 'Konfirmasi Refund Selesai'
                          : 'Konfirmasi Unit Terkirim'}
                      </span>
                    </button>
                  )}

                  {/* Beri Tanggapan */}
                  <button
                    onClick={() => {
                      setSelectedReturn(item)
                      setActionModalType('RESPONSE')
                      setResponseText(item.storeResponse || '')
                    }}
                    className="shadow-2xs inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-orange-500" />
                    <span>Beri Tanggapan</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Action Dialog (Approve / Reject / Response / Complete) */}
      <AnimatePresence>
        {actionModalType && selectedReturn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-7"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                      actionModalType === 'REJECT'
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                        : 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400'
                    }`}
                  >
                    {actionModalType === 'REJECT' ? (
                      <XCircle className="h-5 w-5" />
                    ) : (
                      <RotateCcw className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-950 dark:text-white">
                      {actionModalType === 'APPROVE' &&
                        'Setujui Pengajuan Pengembalian'}
                      {actionModalType === 'REJECT' &&
                        'Tolak Pengajuan Pengembalian'}
                      {actionModalType === 'COMPLETE' &&
                        (selectedReturn.type === 'REFUND'
                          ? 'Konfirmasi Refund Selesai'
                          : 'Konfirmasi Penggantian Unit Selesai')}
                      {actionModalType === 'RESPONSE' &&
                        'Tanggapan & Instruksi Toko'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Pesanan #{selectedReturn.order?.orderNumber} •{' '}
                      {selectedReturn.user?.name}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActionModalType(null)
                    setSelectedReturn(null)
                  }}
                  className="cursor-pointer rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form Content */}
              <div className="space-y-3.5 text-xs">
                {actionModalType === 'REJECT' ? (
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-900 dark:text-white">
                      Alasan Penolakan Pengajuan:
                    </label>
                    <textarea
                      rows={3}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Contoh: Unit mengalami kerusakan fisik akibat kelalaian pemakaian setelah masa unboxing, segel garansi rusak..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 text-xs leading-relaxed outline-none transition focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-900 dark:text-white">
                      Instruksi / Catatan untuk Pembeli:
                    </label>
                    <textarea
                      rows={3}
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Tuliskan instruksi pengiriman balik atau konfirmasi pengembalian dana..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 text-xs leading-relaxed outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-2 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setActionModalType(null)
                    setSelectedReturn(null)
                  }}
                  className="cursor-pointer rounded-full px-5 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Batal
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => {
                    if (actionModalType === 'APPROVE') {
                      handleUpdateStatus(
                        selectedReturn.id,
                        'APPROVED',
                        responseText
                      )
                    } else if (actionModalType === 'REJECT') {
                      if (!rejectionReason.trim()) {
                        toast.error('Harap isi alasan penolakan')
                        return
                      }
                      handleUpdateStatus(
                        selectedReturn.id,
                        'REJECTED',
                        rejectionReason
                      )
                    } else if (actionModalType === 'COMPLETE') {
                      handleUpdateStatus(
                        selectedReturn.id,
                        'COMPLETED',
                        responseText
                      )
                    } else if (actionModalType === 'RESPONSE') {
                      handleUpdateStatus(
                        selectedReturn.id,
                        selectedReturn.status,
                        responseText
                      )
                    }
                  }}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-6 py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-50 ${
                    actionModalType === 'REJECT'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-orange-500 shadow-orange-500/25 hover:bg-orange-600'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>Konfirmasi</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Luxury Fullscreen Media Lightbox Portal */}
      {lightboxOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/45 backdrop-blur-xl duration-300 animate-in fade-in"
            onClick={() => setLightboxOpen(false)}
          >
            {/* Top Bar: Monogram & Meta */}
            <div
              className="absolute left-1/2 top-6 z-20 flex -translate-x-1/2 items-center gap-2.5 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 shadow-lg backdrop-blur-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                <RotateCcw className="h-3.5 w-3.5" />
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <span>{lightboxMeta?.title || 'Bukti Unboxing'}</span>
                {lightboxMeta?.subtitle && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500">
                      {lightboxMeta.subtitle}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Main Stage */}
            <div
              className="relative mx-6 flex max-h-[75vh] w-full max-w-4xl items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/\.(mp4|webm|mov|mkv|ogg|3gp)$/i.test(
                lightboxImages[activeMediaIndex]
              ) ? (
                <video
                  src={lightboxImages[activeMediaIndex]}
                  controls
                  autoPlay
                  className="max-h-[72vh] max-w-full rounded-3xl border border-white/60 bg-black shadow-2xl"
                />
              ) : (
                <img
                  src={lightboxImages[activeMediaIndex]}
                  alt="Bukti Unboxing"
                  className="max-h-[72vh] max-w-full rounded-3xl border border-white/60 bg-white object-contain shadow-2xl"
                />
              )}

              {/* Navigation Arrows */}
              {lightboxImages.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setActiveMediaIndex((prev) =>
                        prev > 0 ? prev - 1 : lightboxImages.length - 1
                      )
                    }
                    className="absolute -left-14 top-1/2 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/80 text-white shadow-xl transition hover:bg-black active:scale-90"
                    title="Sebelumnya (Panah Kiri)"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() =>
                      setActiveMediaIndex((prev) =>
                        prev < lightboxImages.length - 1 ? prev + 1 : 0
                      )
                    }
                    className="absolute -right-14 top-1/2 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/80 text-white shadow-xl transition hover:bg-black active:scale-90"
                    title="Berikutnya (Panah Kanan)"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {/* Bottom Filmstrip Thumbnail */}
            {lightboxImages.length > 1 && (
              <div
                className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 p-2 shadow-xl backdrop-blur-xl"
                onClick={(e) => e.stopPropagation()}
              >
                {lightboxImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveMediaIndex(i)}
                    className={`relative h-12 w-12 cursor-pointer overflow-hidden rounded-xl border-2 transition ${
                      activeMediaIndex === i
                        ? 'scale-105 border-orange-500 shadow-md'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    {/\.(mp4|webm|mov|mkv|ogg|3gp)$/i.test(img) ? (
                      <div className="flex h-full w-full items-center justify-center bg-slate-900 text-white">
                        <Play className="h-4 w-4 text-orange-400" />
                      </div>
                    ) : (
                      <img
                        src={img}
                        alt="Thumbnail"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  )
}
