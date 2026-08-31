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
      product?: { id: string; name: string; brand?: string | null; images?: string[] } | null
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
  const { data: session } = useSession()
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'
  const isAdminPlatform = session?.user?.role === 'ADMIN'

  const [returns, setReturns] = useState<ReturnRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'COMPLETED' | 'REJECTED'>('ALL')
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'REFUND' | 'REPLACEMENT'>('ALL')
  const [selectedStore, setSelectedStore] = useState<string>('ALL')

  // Action Dialogs
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null)
  const [actionModalType, setActionModalType] = useState<'APPROVE' | 'REJECT' | 'RESPONSE' | 'COMPLETE' | null>(null)
  const [responseText, setResponseText] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Lightbox Media Viewer
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [activeMediaIndex, setActiveMediaIndex] = useState(0)
  const [lightboxMeta, setLightboxMeta] = useState<{ title: string; subtitle: string } | null>(null)

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
      .filter((r) => r.type === 'REFUND' && (r.status === 'APPROVED' || r.status === 'COMPLETED'))
      .reduce((sum, r) => sum + (r.refundAmount || r.order.total || 0), 0)

    return { total, pending, inReview, approved, completed, rejected, totalRefundAmount }
  }, [returns])

  // Filtered Returns
  const filteredReturns = useMemo(() => {
    return returns.filter((r) => {
      // Tab Status Filter
      if (activeTab !== 'ALL' && r.status !== activeTab) return false

      // Solution Type Filter
      if (typeFilter !== 'ALL' && r.type !== typeFilter) return false

      // Store Filter
      if (selectedStore !== 'ALL' && r.order?.store?.id !== selectedStore) return false

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchOrder = r.order?.orderNumber?.toLowerCase().includes(q)
        const matchUser = r.user?.name?.toLowerCase().includes(q) || r.user?.email?.toLowerCase().includes(q)
        const matchReason = r.reasonLabel?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q)
        const matchBank = r.bankName?.toLowerCase().includes(q) || r.bankAccountNumber?.toLowerCase().includes(q)
        const matchTracking = r.returnTrackingNumber?.toLowerCase().includes(q)

        if (!matchOrder && !matchUser && !matchReason && !matchBank && !matchTracking) {
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
  const handleOpenLightbox = (images: string[], index: number, meta?: { title: string; subtitle: string }) => {
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
        setActiveMediaIndex((prev) => (prev > 0 ? prev - 1 : lightboxImages.length - 1))
      }
      if (e.key === 'ArrowRight') {
        setActiveMediaIndex((prev) => (prev < lightboxImages.length - 1 ? prev + 1 : 0))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxOpen, lightboxImages])

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">

      {/* 1. Unified Luxury Bento Metric Grid (Neutral Harmony) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Card: Total Pengajuan */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Pengajuan</span>
              <RotateCcw className="h-4 w-4" />
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white font-mono tracking-tight">
                {metrics.total}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Klaim terdaftar</span>
            </div>
          </div>

          {/* Card: Perlu Verifikasi */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Perlu Verifikasi</span>
              <div className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white font-mono tracking-tight flex items-baseline gap-2">
                <span>{metrics.pending}</span>
                {metrics.pending > 0 && (
                  <span className="text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full">
                    Antrean Baru
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Menunggu toko</span>
            </div>
          </div>

          {/* Card: Sedang Diperiksa */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Sedang Diperiksa</span>
              <RefreshCw className="h-4 w-4" />
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white font-mono tracking-tight">
                {metrics.inReview}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Uji fisik teknisi</span>
            </div>
          </div>

          {/* Card: Total Refund Diselesaikan */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Nilai Refund</span>
              <CreditCard className="h-4 w-4 text-orange-500" />
            </div>
            <div className="mt-3">
              <div className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white font-mono tracking-tight truncate">
                {formatPrice(metrics.totalRefundAmount)}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {metrics.approved + metrics.completed} retur diselesaikan
              </span>
            </div>
          </div>
        </div>

      {/* 2. Unified Control Panel (Identik dengan Katalog Gadget & Pesanan) */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-2.5 sm:p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        
        {/* Left: Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100/80 rounded-2xl dark:bg-slate-800/80 no-scrollbar">
          {[
            { id: 'ALL', label: 'Semua Status', count: metrics.total },
            { id: 'PENDING', label: 'Perlu Verifikasi', count: metrics.pending },
            { id: 'IN_REVIEW', label: 'Sedang Diperiksa', count: metrics.inReview },
            { id: 'APPROVED', label: 'Disetujui', count: metrics.approved },
            { id: 'COMPLETED', label: 'Selesai', count: metrics.completed },
            { id: 'REJECTED', label: 'Ditolak', count: metrics.rejected },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-slate-950 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`ml-1.5 rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                  activeTab === tab.id
                    ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-200'
                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Right: Solution Filter, Store Selector, Search, & Refresh */}
        <div className="flex items-center gap-2 w-full xl:w-auto flex-wrap sm:flex-nowrap">
          
          {/* Solution Selector Dropdown */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 shrink-0">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="ALL">Semua Solusi</option>
              <option value="REFUND">Refund Dana</option>
              <option value="REPLACEMENT">Tukar Unit</option>
            </select>
          </div>

          {/* Store Filter (for Superadmin & Admin Platform) */}
          {(isSuperAdmin || isAdminPlatform) && storeOptions.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 shrink-0">
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer max-w-[140px] truncate"
              >
                <option value="ALL">Semua Toko</option>
                {storeOptions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
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
            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition shrink-0 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

      </div>

        {/* 4. Returns List Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500 mb-3" />
            <p className="text-xs font-semibold text-slate-500">Memuat data pengajuan pengembalian...</p>
          </div>
        ) : filteredReturns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 text-center px-4 shadow-2xs">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 text-slate-400 dark:bg-slate-800 mb-4">
              <RotateCcw className="h-7 w-7" />
            </div>
            <h3 className="text-base font-black text-slate-950 dark:text-white mb-1">
              Tidak Ada Pengajuan Pengembalian
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
              {searchQuery || activeTab !== 'ALL' || typeFilter !== 'ALL'
                ? 'Tidak ditemukan pengajuan retur yang sesuai dengan kriteria filter saat ini.'
                : 'Belum ada pengajuan pengembalian barang dari pembeli.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReturns.map((item) => {
              const currentStatus = statusConfig[item.status] || statusConfig.PENDING
              const gadgetProduct = item.order?.items?.[0]?.product

              return (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs hover:shadow-xs transition dark:border-slate-800 dark:bg-slate-900 space-y-5"
                >
                  {/* Top Bar: Customer Identity, Order Number, Store, & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-800">
                    
                    {/* Customer Anchor */}
                    <div className="flex items-center gap-3">
                      {/* Avatar Monogram Squircle */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 font-black text-sm shadow-2xs">
                        {item.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-slate-950 dark:text-white text-sm">
                            {item.user?.name || 'Customer'}
                          </h3>
                          <button
                            onClick={() => handleCopy(item.order?.orderNumber, item.id)}
                            className="inline-flex items-center gap-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-2.5 py-0.5 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 transition"
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

                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 flex-wrap">
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
                    <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                      {/* Store Badge (for Superadmin / Admin Platform) */}
                      {(isSuperAdmin || isAdminPlatform) && item.order?.store && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          <Building2 className="h-3 w-3 text-orange-500" />
                          <span>{item.order.store.name}</span>
                        </span>
                      )}

                      {/* Solution Type Pill */}
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold ${
                        item.type === 'REFUND'
                          ? 'bg-orange-50 text-orange-700 border border-orange-200/80 dark:bg-orange-950/40 dark:text-orange-300'
                          : 'bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300'
                      }`}>
                        {item.type === 'REFUND' ? <CreditCard className="h-3 w-3" /> : <RefreshCw className="h-3 w-3" />}
                        <span>{item.type === 'REFUND' ? 'Refund 100%' : 'Tukar Unit Pengganti'}</span>
                      </span>

                      {/* Status Badge */}
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold ${currentStatus.badgeClass}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${currentStatus.dotClass}`} />
                        <span>{currentStatus.label}</span>
                      </span>
                    </div>

                  </div>

                  {/* Main Content: 2-Column Balanced Architecture */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
                    
                    {/* Column 1: Gadget Unit & Issue Details */}
                    <div className="rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 p-4 border border-slate-100 dark:border-slate-800 flex flex-col justify-between space-y-3.5">
                      <div className="space-y-3">
                        {/* Gadget Card Strip */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-700/60">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative h-14 w-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] rounded-2xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shrink-0">
                              {gadgetProduct?.images?.[0] ? (
                                <img src={gadgetProduct.images[0]} alt="Gadget" className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-slate-400">
                                  <Package className="h-5 w-5" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-slate-950 dark:text-white text-xs sm:text-sm truncate">
                                {gadgetProduct?.name || 'Unit Gadget Pesanan'}
                              </h4>
                              <span className="text-[11px] text-slate-400 block mt-0.5">
                                {gadgetProduct?.brand || 'Smartphone'}
                              </span>
                            </div>
                          </div>

                          <div className="text-right pl-3 shrink-0">
                            <span className="text-[10px] text-slate-400 block">Total Transaksi</span>
                            <span className="font-mono font-black text-xs sm:text-sm text-slate-950 dark:text-white">
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
                            <span className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 px-2.5 py-0.5 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                              {item.reasonLabel || item.reason}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white/70 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {/* Bukti Unboxing Media Gallery */}
                      {item.images && item.images.length > 0 && (
                        <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                          <span className="text-[10px] font-bold text-slate-400 block mb-2">
                            Bukti Unboxing ({item.images.length} Lampiran)
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {item.images.map((img, i) => {
                              const isVideo = /\.(mp4|webm|mov|mkv|ogg|3gp)$/i.test(img)
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => handleOpenLightbox(item.images, i, {
                                    title: `Bukti Unboxing #${item.order?.orderNumber}`,
                                    subtitle: item.user?.name,
                                  })}
                                  className="relative h-12 w-12 min-w-[48px] min-h-[48px] max-w-[48px] max-h-[48px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:scale-105 transition cursor-pointer group shrink-0"
                                >
                                  {isVideo ? (
                                    <div className="flex h-full w-full items-center justify-center bg-slate-900 text-white">
                                      <Play className="h-4 w-4 text-orange-400" />
                                    </div>
                                  ) : (
                                    <img src={img} alt="Bukti" className="h-full w-full object-cover" />
                                  )}
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
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
                    <div className="rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 p-4 border border-slate-100 dark:border-slate-800 flex flex-col justify-between space-y-3.5">
                      
                      <div className="space-y-3">
                        {item.type === 'REFUND' ? (
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-950 dark:text-white">
                                <CreditCard className="h-3.5 w-3.5 text-orange-500" />
                                <span>Rekening Pengembalian Dana</span>
                              </div>
                              <span className="font-mono font-black text-xs sm:text-sm text-orange-600 dark:text-orange-400">
                                {formatPrice(item.refundAmount || item.order?.total)}
                              </span>
                            </div>

                            <div className="rounded-xl bg-white dark:bg-slate-800 p-3 border border-slate-200/80 dark:border-slate-700 space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400">Bank & No. Rekening:</span>
                                <button
                                  onClick={() => handleCopy(item.bankAccountNumber || '', `bank-${item.id}`)}
                                  className="inline-flex items-center gap-1 font-mono font-bold text-slate-900 dark:text-white hover:text-orange-500 transition"
                                >
                                  <span>{item.bankName} - {item.bankAccountNumber || '-'}</span>
                                  {copiedId === `bank-${item.id}` ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-slate-400" />}
                                </button>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400">Atas Nama:</span>
                                <span className="font-bold text-slate-900 dark:text-white">{item.bankAccountName || '-'}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-950 dark:text-white">
                                <RefreshCw className="h-3.5 w-3.5 text-blue-500" />
                                <span>Solusi Penukaran Unit</span>
                              </div>
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 px-2 py-0.5 rounded-full">
                                Unit Pengganti Teruji
                              </span>
                            </div>

                            <div className="rounded-xl bg-white dark:bg-slate-800 p-3 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                              Toko cabang akan menyiapkan unit second berkualitas pengganti (teruji fungsi 100%) untuk dikirimkan kembali kepada pembeli setelah unit fisik retur tiba dan lolos verifikasi teknisi.
                            </div>
                          </div>
                        )}

                        {/* Tanggapan Toko / Store Response */}
                        {item.storeResponse && (
                          <div className="rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50 p-3 space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Tanggapan Resmi Toko:</span>
                            </div>
                            <p className="text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed">
                              {item.storeResponse}
                            </p>
                          </div>
                        )}

                        {/* Resi Kirim Balik dari Pembeli */}
                        {item.returnTrackingNumber && (
                          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                              <Truck className="h-3.5 w-3.5 text-orange-500" /> Resi Kirim Balik:
                            </span>
                            <span className="font-mono font-bold text-xs text-slate-950 dark:text-white">
                              {item.returnCourier} - {item.returnTrackingNumber}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* ID Pengajuan Info */}
                      <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span>ID Tiket Pengajuan:</span>
                        <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{item.id.slice(0, 10)}</span>
                      </div>

                    </div>

                  </div>

                  {/* Action Bar (Operational Controls with High Contrast Action Orange Pill) */}
                  <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3.5 border-t border-slate-100 dark:border-slate-800">
                    
                    {/* Setujui & Tolak for PENDING */}
                    {item.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedReturn(item)
                            setActionModalType('APPROVE')
                            setResponseText('Pengajuan disetujui. Silakan kirimkan unit lengkap beserta kotak kemasan dan aksesoris bonus ke alamat toko.')
                          }}
                          className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white px-5 py-2 text-xs font-bold shadow-sm shadow-orange-500/25 transition cursor-pointer"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Setujui Pengajuan</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedReturn(item)
                            setActionModalType('REJECT')
                          }}
                          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 px-4 py-2 text-xs font-bold transition active:scale-95 cursor-pointer"
                        >
                          <XCircle className="h-3.5 w-3.5 text-rose-500" />
                          <span>Tolak</span>
                        </button>
                      </>
                    )}

                    {/* Mulai Periksa Fisik */}
                    {item.status === 'APPROVED' && (
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'IN_REVIEW', 'Unit telah tiba di toko dan sedang dalam proses pengujian fisik teknisi.')}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-950 hover:bg-slate-800 dark:bg-white dark:text-slate-950 text-white px-5 py-2 text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Mulai Pemeriksaan Unit</span>
                      </button>
                    )}

                    {/* Selesaikan Pengembalian */}
                    {(item.status === 'IN_REVIEW' || item.status === 'APPROVED') && (
                      <button
                        onClick={() => {
                          setSelectedReturn(item)
                          setActionModalType('COMPLETE')
                          setResponseText(item.type === 'REFUND'
                            ? `Pengembalian dana sebesar ${formatPrice(item.refundAmount || item.order.total)} telah berhasil ditransfer ke rekening ${item.bankName} ${item.bankAccountNumber}.`
                            : 'Unit pengganti teruji telah dikirimkan ke alamat Anda. Terima kasih telah berbelanja di Affiliate Gadget.')
                        }}
                        className="inline-flex items-center gap-2 rounded-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white px-5 py-2 text-xs font-bold shadow-sm shadow-orange-500/25 transition cursor-pointer"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>{item.type === 'REFUND' ? 'Konfirmasi Refund Selesai' : 'Konfirmasi Unit Terkirim'}</span>
                      </button>
                    )}

                    {/* Beri Tanggapan */}
                    <button
                      onClick={() => {
                        setSelectedReturn(item)
                        setActionModalType('RESPONSE')
                        setResponseText(item.storeResponse || '')
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 text-xs font-bold shadow-2xs transition active:scale-95 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                    actionModalType === 'REJECT'
                      ? 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                      : 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400'
                  }`}>
                    {actionModalType === 'REJECT' ? <XCircle className="h-5 w-5" /> : <RotateCcw className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-950 dark:text-white">
                      {actionModalType === 'APPROVE' && 'Setujui Pengajuan Pengembalian'}
                      {actionModalType === 'REJECT' && 'Tolak Pengajuan Pengembalian'}
                      {actionModalType === 'COMPLETE' && (selectedReturn.type === 'REFUND' ? 'Konfirmasi Refund Selesai' : 'Konfirmasi Penggantian Unit Selesai')}
                      {actionModalType === 'RESPONSE' && 'Tanggapan & Instruksi Toko'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Pesanan #{selectedReturn.order?.orderNumber} • {selectedReturn.user?.name}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActionModalType(null)
                    setSelectedReturn(null)
                  }}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 transition cursor-pointer"
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
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setActionModalType(null)
                    setSelectedReturn(null)
                  }}
                  className="rounded-full px-5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => {
                    if (actionModalType === 'APPROVE') {
                      handleUpdateStatus(selectedReturn.id, 'APPROVED', responseText)
                    } else if (actionModalType === 'REJECT') {
                      if (!rejectionReason.trim()) {
                        toast.error('Harap isi alasan penolakan')
                        return
                      }
                      handleUpdateStatus(selectedReturn.id, 'REJECTED', rejectionReason)
                    } else if (actionModalType === 'COMPLETE') {
                      handleUpdateStatus(selectedReturn.id, 'COMPLETED', responseText)
                    } else if (actionModalType === 'RESPONSE') {
                      handleUpdateStatus(selectedReturn.id, selectedReturn.status, responseText)
                    }
                  }}
                  className={`inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50 ${
                    actionModalType === 'REJECT' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/25'
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
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/45 backdrop-blur-xl animate-in fade-in duration-300"
            onClick={() => setLightboxOpen(false)}
          >
            {/* Top Bar: Monogram & Meta */}
            <div
              className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 bg-white/80 border border-slate-200/80 backdrop-blur-xl px-4 py-2 rounded-full shadow-lg z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white font-bold text-[10px]">
                <RotateCcw className="h-3.5 w-3.5" />
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <span>{lightboxMeta?.title || 'Bukti Unboxing'}</span>
                {lightboxMeta?.subtitle && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500">{lightboxMeta.subtitle}</span>
                  </>
                )}
              </div>
            </div>

            {/* Main Stage */}
            <div
              className="relative max-w-4xl max-h-[75vh] w-full mx-6 flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/\.(mp4|webm|mov|mkv|ogg|3gp)$/i.test(lightboxImages[activeMediaIndex]) ? (
                <video
                  src={lightboxImages[activeMediaIndex]}
                  controls
                  autoPlay
                  className="max-h-[72vh] max-w-full rounded-3xl shadow-2xl border border-white/60 bg-black"
                />
              ) : (
                <img
                  src={lightboxImages[activeMediaIndex]}
                  alt="Bukti Unboxing"
                  className="max-h-[72vh] max-w-full rounded-3xl shadow-2xl object-contain border border-white/60 bg-white"
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
                    className="absolute -left-14 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/80 hover:bg-black text-white shadow-xl transition active:scale-90 cursor-pointer"
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
                    className="absolute -right-14 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/80 hover:bg-black text-white shadow-xl transition active:scale-90 cursor-pointer"
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
                className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/80 border border-slate-200/80 backdrop-blur-xl p-2 rounded-2xl shadow-xl z-20"
                onClick={(e) => e.stopPropagation()}
              >
                {lightboxImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveMediaIndex(i)}
                    className={`relative h-12 w-12 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                      activeMediaIndex === i ? 'border-orange-500 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    {/\.(mp4|webm|mov|mkv|ogg|3gp)$/i.test(img) ? (
                      <div className="flex h-full w-full items-center justify-center bg-slate-900 text-white">
                        <Play className="h-4 w-4 text-orange-400" />
                      </div>
                    ) : (
                      <img src={img} alt="Thumbnail" className="h-full w-full object-cover" />
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
