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
  Wrench,
  Printer,
  Zap,
  ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { CustomSelect } from '@/components/ui/custom-select'
import { usePageGuard } from '@/hooks/use-page-guard'
import { CheckResiModal } from '@/components/shipping/check-resi-modal'
import { ThermalShippingLabel } from '@/components/shipping/thermal-shipping-label'
import type { ShippingBookingRecord } from '@/lib/shipping/biteship-client'

const BITESHIP_COURIERS = [
  {
    id: 'JNE',
    name: 'JNE Express',
    service: 'Reguler (Biteship)',
    badge: '2 - 3 Hari',
    badgeColor:
      'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    description:
      'Layanan kurir reguler nasional terpercaya dengan asuransi wajib penuh',
    courierCode: 'JNE',
  },
  {
    id: 'JNE_YES',
    name: 'JNE Express',
    service: 'YES Esok Sampai (Biteship)',
    badge: 'Esok Tiba (24 Jam)',
    badgeColor:
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    description:
      'Layanan prioritas esok hari kerja dengan jaminan tiba tepat waktu',
    courierCode: 'JNE',
  },
  {
    id: 'GOJEK',
    name: 'Gojek Instant',
    service: 'Kilat 1-2 Jam (Biteship)',
    badge: 'Kilat 1-2 Jam',
    badgeColor:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    description:
      'Kurir motor instan tiba dalam 1-2 jam langsung dari toko cabang',
    courierCode: 'GOJEK',
  },
]

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
    trackingNumber?: string | null
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

  // Check Resi Modal
  const [checkResiModalOpen, setCheckResiModalOpen] = useState(false)
  const [activeTrackingAwb, setActiveTrackingAwb] = useState('')
  const [activeTrackingCourier, setActiveTrackingCourier] = useState('JNE')

  // Thermal Shipping Label Modal
  const [activeThermalLabel, setActiveThermalLabel] =
    useState<ShippingBookingRecord | null>(null)
  const [isPrintingThermal, setIsPrintingThermal] = useState(false)

  const handlePrintThermalLabel = async (orderId: string) => {
    try {
      setIsPrintingThermal(true)
      const res = await fetch(`/api/shipping/tracking/${orderId}`)
      if (res.ok) {
        const json = await res.json()
        if (json.data) {
          setActiveThermalLabel(json.data)
          return
        }
      }
      toast.info('Menyiapkan label thermal Biteship...')
    } catch {
      toast.error('Gagal memuat label thermal Biteship')
    } finally {
      setIsPrintingThermal(false)
    }
  }

  // Functional 3 Resolution Actions State
  const [resolutionAction, setResolutionAction] = useState<
    'REPLACEMENT' | 'REFUND' | 'REPAIR'
  >('REPLACEMENT')
  const [courierName, setCourierName] = useState('JNE')
  const [trackingNumberInput, setTrackingNumberInput] = useState('')
  const [repairStage, setRepairStage] = useState<'IN_PROGRESS' | 'COMPLETED'>(
    'IN_PROGRESS'
  )
  const [repairEstimatedDays, setRepairEstimatedDays] =
    useState('1 - 2 Hari Kerja')
  const [repairNotes, setRepairNotes] = useState('')

  // Sleek Courier Dropdown & AWB Success Modal
  const [courierDropdownOpen, setCourierDropdownOpen] = useState(false)
  const [awbModalData, setAwbModalData] = useState<{
    trackingNumber: string
    courierCode: string
    courierService: string
    orderNumber: string
    customerName: string
    actionType: 'REPLACEMENT' | 'REPAIR'
    bookingRecord?: any
  } | null>(null)

  const renderCourierDropdown = (theme: 'blue' | 'emerald') => {
    const selectedObj =
      BITESHIP_COURIERS.find((c) => c.id === courierName) ||
      BITESHIP_COURIERS[0]

    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setCourierDropdownOpen((prev) => !prev)}
          className={`shadow-2xs flex w-full cursor-pointer items-center justify-between rounded-2xl border bg-white p-3 text-left transition dark:bg-slate-800 ${
            courierDropdownOpen
              ? theme === 'blue'
                ? 'border-blue-500 ring-2 ring-blue-500/20'
                : 'border-emerald-500 ring-2 ring-emerald-500/20'
              : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
          }`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                selectedObj.courierCode === 'GOJEK'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
              }`}
            >
              <Truck className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {selectedObj.name}
                </span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  • {selectedObj.service}
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${selectedObj.badgeColor}`}
                >
                  {selectedObj.badge}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[11px] text-slate-400">
                {selectedObj.description}
              </p>
            </div>
          </div>

          <ChevronDown
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
              courierDropdownOpen
                ? 'rotate-180 text-slate-700 dark:text-white'
                : ''
            }`}
          />
        </button>

        {courierDropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setCourierDropdownOpen(false)}
            />
            <div className="absolute left-0 right-0 top-full z-50 mt-1.5 space-y-1.5 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl duration-150 animate-in fade-in zoom-in-95 dark:border-slate-700 dark:bg-slate-800">
              {BITESHIP_COURIERS.map((c) => {
                const isSelected = courierName === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setCourierName(c.id)
                      setCourierDropdownOpen(false)
                    }}
                    className={`flex w-full cursor-pointer items-start justify-between rounded-xl p-2.5 text-left transition ${
                      isSelected
                        ? theme === 'blue'
                          ? 'bg-blue-50/90 text-blue-950 ring-1 ring-blue-500/30 dark:bg-blue-950/60 dark:text-blue-100'
                          : 'bg-emerald-50/90 text-emerald-950 ring-1 ring-emerald-500/30 dark:bg-emerald-950/60 dark:text-emerald-100'
                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <div className="flex min-w-0 items-start gap-2.5">
                      <div
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                          c.courierCode === 'GOJEK'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        <Truck className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {c.name}
                          </span>
                          <span className="text-xs text-slate-600 dark:text-slate-400">
                            - {c.service}
                          </span>
                          <span
                            className={`py-0.2 rounded-full border px-1.5 text-[9px] font-bold ${c.badgeColor}`}
                          >
                            {c.badge}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[10.5px] leading-tight text-slate-400">
                          {c.description}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <Check
                        className={`ml-2 mt-1 h-4 w-4 shrink-0 ${
                          theme === 'blue'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    )
  }

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

  // Open action modal with smart default resolution mode
  const openActionModal = (
    item: ReturnRequest,
    modalType: 'APPROVE' | 'REJECT' | 'COMPLETE' | 'RESPONSE'
  ) => {
    setSelectedReturn(item)
    setActionModalType(modalType)
    setRejectionReason('')
    setResponseText(item.storeResponse || '')
    setTrackingNumberInput(
      item.returnTrackingNumber || item.order?.trackingNumber || ''
    )
    setCourierName(item.returnCourier || item.order?.courierCode || 'JNE')

    if (item.storeResponse?.includes('[SEDANG_DIPERBAIKI]')) {
      setResolutionAction('REPAIR')
      setRepairStage('COMPLETED')
    } else if (item.type === 'REFUND') {
      setResolutionAction('REFUND')
    } else {
      setResolutionAction('REPLACEMENT')
    }
  }

  // Execute functional resolution action
  const handleExecuteResolution = async () => {
    if (!selectedReturn) return
    setIsProcessing(true)
    try {
      if (actionModalType === 'REJECT') {
        if (!rejectionReason.trim()) {
          toast.error('Harap isi alasan penolakan pengajuan')
          setIsProcessing(false)
          return
        }
        await handleUpdateStatus(selectedReturn.id, 'REJECTED', rejectionReason)
        return
      }

      if (actionModalType === 'RESPONSE') {
        await handleUpdateStatus(
          selectedReturn.id,
          selectedReturn.status,
          responseText
        )
        return
      }

      // Functional 3 Options execution
      let actionType:
        | 'REPLACEMENT'
        | 'REFUND'
        | 'REPAIR_IN_PROGRESS'
        | 'REPAIR_COMPLETED' = 'REPLACEMENT'

      if (resolutionAction === 'REPLACEMENT') {
        actionType = 'REPLACEMENT'
      } else if (resolutionAction === 'REFUND') {
        actionType = 'REFUND'
      } else if (resolutionAction === 'REPAIR') {
        if (repairStage === 'COMPLETED') {
          actionType = 'REPAIR_COMPLETED'
        } else {
          actionType = 'REPAIR_IN_PROGRESS'
        }
      }

      const res = await fetch(`/api/returns/${selectedReturn.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolutionAction: actionType,
          replacementCourier: courierName,
          replacementTrackingNumber: trackingNumberInput.trim() || 'AUTO',
          estimatedRepairDays: repairEstimatedDays,
          repairNotes: repairNotes,
          storeResponse: responseText,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(
          data.message || 'Tindakan pengembalian berhasil diproses!'
        )
        const currentItem = selectedReturn
        setActionModalType(null)
        setSelectedReturn(null)
        setResponseText('')
        setRejectionReason('')
        setTrackingNumberInput('')
        fetchReturns()

        // Jika penggantian unit baru atau perbaikan selesai: langsung tampilkan modal AWB!
        if (actionType === 'REPLACEMENT' || actionType === 'REPAIR_COMPLETED') {
          const generatedAwb =
            data.booking?.trackingNumber ||
            data.booking?.waybillId ||
            data.data?.returnTrackingNumber ||
            'JNE0192838192'

          setAwbModalData({
            trackingNumber: generatedAwb,
            courierCode: courierName.startsWith('GOJEK') ? 'GOJEK' : 'JNE',
            courierService:
              courierName === 'JNE_YES'
                ? 'YES'
                : courierName.startsWith('GOJEK')
                  ? 'INSTANT'
                  : 'REG',
            orderNumber: currentItem.order?.orderNumber || '',
            customerName: currentItem.user?.name || 'Customer',
            actionType:
              actionType === 'REPAIR_COMPLETED' ? 'REPAIR' : 'REPLACEMENT',
            bookingRecord: data.booking,
          })
        }
      } else {
        toast.error(data.error || 'Gagal memproses tindakan')
      }
    } catch (err) {
      console.error('Error executing resolution:', err)
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
      {/* 0. Header Title & Context */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl">
              Pengembalian & Klaim Garansi
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-orange-200/80 bg-orange-50 px-2.5 py-0.5 text-[11px] font-bold text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300">
              Garansi 30 Hari
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Pusat pengelolaan retur unit bermasalah, klaim garansi ganti unit
            baru, pengembalian dana (refund), dan perbaikan servis teknisi
          </p>
        </div>
      </div>

      {/* 1. Unified Luxury Bento Metric Grid (Neutral Harmony) */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {/* Card: Total Pengajuan & Klaim */}
        <div className="shadow-2xs flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Total Pengajuan & Klaim
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

                      {/* Resi Kirim Balik / Pengiriman */}
                      {item.returnTrackingNumber && (
                        <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-800">
                          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                            <Truck className="h-3.5 w-3.5 text-orange-500" />{' '}
                            Resi Pengiriman:
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTrackingAwb(
                                  item.returnTrackingNumber || ''
                                )
                                setActiveTrackingCourier(
                                  item.returnCourier || 'JNE'
                                )
                                setCheckResiModalOpen(true)
                              }}
                              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs font-bold text-slate-900 transition hover:border-orange-500 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                              title="Lacak Paket Real-Time via Biteship"
                            >
                              <span>
                                {item.returnCourier || 'JNE'} -{' '}
                                {item.returnTrackingNumber}
                              </span>
                              <ArrowUpRight className="h-3 w-3 text-slate-400" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handlePrintThermalLabel(item.orderId)
                              }
                              disabled={isPrintingThermal}
                              className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300"
                              title="Cetak Label Thermal Biteship"
                            >
                              <Printer className="h-3 w-3" />
                              <span>Label Thermal</span>
                            </button>
                          </div>
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
                        onClick={() => openActionModal(item, 'APPROVE')}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-orange-500 px-5 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition hover:bg-orange-600 active:scale-95"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Setujui & Pilih Tindakan</span>
                      </button>

                      <button
                        onClick={() => openActionModal(item, 'REJECT')}
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

                  {/* Tindakan Resolusi Toko / Selesaikan Pengembalian */}
                  {(item.status === 'IN_REVIEW' ||
                    item.status === 'APPROVED') && (
                    <button
                      onClick={() => openActionModal(item, 'COMPLETE')}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-orange-500 px-5 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition hover:bg-orange-600 active:scale-95"
                    >
                      {item.storeResponse?.includes('[SEDANG_DIPERBAIKI]') ? (
                        <>
                          <Wrench className="h-3.5 w-3.5" />
                          <span>Selesaikan Servis & Kirim Balik</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Tindakan Resolusi Toko</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Beri Tanggapan */}
                  <button
                    onClick={() => openActionModal(item, 'RESPONSE')}
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

      {/* Action Dialog (Functional Operational Workflows: Replacement, Refund, Repair) */}
      <AnimatePresence>
        {actionModalType && selectedReturn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-h-[92vh] w-full max-w-xl space-y-5 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-7"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                      actionModalType === 'REJECT'
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                        : resolutionAction === 'REPLACEMENT'
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                          : resolutionAction === 'REFUND'
                            ? 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400'
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                    }`}
                  >
                    {actionModalType === 'REJECT' ? (
                      <XCircle className="h-5 w-5" />
                    ) : resolutionAction === 'REPLACEMENT' ? (
                      <RefreshCw className="h-5 w-5" />
                    ) : resolutionAction === 'REFUND' ? (
                      <CreditCard className="h-5 w-5" />
                    ) : (
                      <Wrench className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-950 dark:text-white">
                      {actionModalType === 'REJECT'
                        ? 'Tolak Pengajuan Pengembalian'
                        : actionModalType === 'RESPONSE'
                          ? 'Tanggapan & Instruksi Toko'
                          : 'Keputusan Tindakan Toko (Garansi 30 Hari)'}
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
              <div className="space-y-4 text-xs">
                {actionModalType === 'REJECT' ? (
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-900 dark:text-white">
                      Alasan Penolakan Pengajuan:
                    </label>
                    <textarea
                      rows={4}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Contoh: Unit mengalami kerusakan fisik akibat kelalaian pemakaian setelah masa unboxing, segel garansi rusak..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 text-xs leading-relaxed outline-none transition focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      required
                    />
                  </div>
                ) : actionModalType === 'RESPONSE' ? (
                  <div className="space-y-2">
                    <label className="font-bold text-slate-900 dark:text-white">
                      Pesan Tanggapan Toko untuk Pembeli:
                    </label>
                    <textarea
                      rows={4}
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Tuliskan pesan instruksi pengiriman unit atau verifikasi..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 text-xs leading-relaxed outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* 3 Interactive Operational Mode Selectors */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-900 dark:text-white">
                          Pilih Tindakan Toko:
                        </label>
                        <span className="text-[10px] text-slate-400">
                          Pilih alur operasional yang akan dieksekusi
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {/* Option 1: Ganti Unit Baru */}
                        <button
                          type="button"
                          onClick={() => {
                            setResolutionAction('REPLACEMENT')
                            if (
                              !responseText ||
                              responseText.includes('[REFUND_MIDTRANS]') ||
                              responseText.includes('[SEDANG_DIPERBAIKI]') ||
                              responseText.includes('[PERBAIKAN_SELESAI]')
                            ) {
                              setResponseText(
                                'Unit baru pengganti telah disiapkan dan dikirimkan dengan nomor resi terlampir. Garansi 30 hari aktif kembali untuk unit ini.'
                              )
                            }
                          }}
                          className={`flex cursor-pointer flex-col gap-1 rounded-2xl border p-3 text-left transition ${
                            resolutionAction === 'REPLACEMENT'
                              ? 'shadow-xs border-blue-500 bg-blue-50/80 ring-2 ring-blue-500/20 dark:border-blue-500 dark:bg-blue-950/40'
                              : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`flex h-7 w-7 items-center justify-center rounded-xl ${
                                resolutionAction === 'REPLACEMENT'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </span>
                            {resolutionAction === 'REPLACEMENT' && (
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                                Dipilih
                              </span>
                            )}
                          </div>
                          <span className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
                            1. Ganti Unit Baru
                          </span>
                          <span className="text-[10px] leading-tight text-slate-500 dark:text-slate-400">
                            Kirim unit baru & lacak resi live
                          </span>
                        </button>

                        {/* Option 2: Kembalikan Duit */}
                        <button
                          type="button"
                          onClick={() => {
                            setResolutionAction('REFUND')
                            if (
                              !responseText ||
                              responseText.includes('[GANTI_UNIT_BARU]') ||
                              responseText.includes('[SEDANG_DIPERBAIKI]') ||
                              responseText.includes('[PERBAIKAN_SELESAI]')
                            ) {
                              setResponseText(
                                `Pengembalian dana sebesar ${formatPrice(
                                  selectedReturn.refundAmount ||
                                    selectedReturn.order?.total
                                )} diproses otomatis dari saldo tertahan Midtrans ke rekening ${
                                  selectedReturn.bankName || 'pembeli'
                                }.`
                              )
                            }
                          }}
                          className={`flex cursor-pointer flex-col gap-1 rounded-2xl border p-3 text-left transition ${
                            resolutionAction === 'REFUND'
                              ? 'shadow-xs border-orange-500 bg-orange-50/80 ring-2 ring-orange-500/20 dark:border-orange-500 dark:bg-orange-950/40'
                              : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`flex h-7 w-7 items-center justify-center rounded-xl ${
                                resolutionAction === 'REFUND'
                                  ? 'bg-orange-600 text-white'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                            </span>
                            {resolutionAction === 'REFUND' && (
                              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[9px] font-bold text-orange-700 dark:bg-orange-900/60 dark:text-orange-300">
                                Dipilih
                              </span>
                            )}
                          </div>
                          <span className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
                            2. Kembalikan Duit
                          </span>
                          <span className="text-[10px] leading-tight text-slate-500 dark:text-slate-400">
                            Refund dana tertahan Midtrans
                          </span>
                        </button>

                        {/* Option 3: Perbaiki Barang */}
                        <button
                          type="button"
                          onClick={() => {
                            setResolutionAction('REPAIR')
                            if (
                              !responseText ||
                              responseText.includes('[GANTI_UNIT_BARU]') ||
                              responseText.includes('[REFUND_MIDTRANS]')
                            ) {
                              setResponseText(
                                'Unit disetujui untuk perbaikan teknisi resmi kami hingga normal kembali dan diuji fungsi 100%.'
                              )
                            }
                          }}
                          className={`flex cursor-pointer flex-col gap-1 rounded-2xl border p-3 text-left transition ${
                            resolutionAction === 'REPAIR'
                              ? 'shadow-xs border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20 dark:border-emerald-500 dark:bg-emerald-950/40'
                              : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`flex h-7 w-7 items-center justify-center rounded-xl ${
                                resolutionAction === 'REPAIR'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <Wrench className="h-3.5 w-3.5" />
                            </span>
                            {resolutionAction === 'REPAIR' && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                                Dipilih
                              </span>
                            )}
                          </div>
                          <span className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
                            3. Perbaiki Barang
                          </span>
                          <span className="text-[10px] leading-tight text-slate-500 dark:text-slate-400">
                            Tunggu servis lalu kirim balik
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Operational Workflow Form Details */}
                    {resolutionAction === 'REPLACEMENT' && (
                      <div className="space-y-3 rounded-2xl border border-blue-200/80 bg-blue-50/40 p-4 dark:border-blue-900/60 dark:bg-blue-950/30">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="font-bold text-slate-900 dark:text-white">
                            Alur 1: Ganti Unit Baru & Pengiriman Langsung
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                          Unit baru pengganti akan mulai dikirimkan kepada
                          pembeli. Sistem akan membuat pengiriman baru dengan
                          nomor resi terlampir yang dapat dilacak oleh pembeli
                          secara real-time seperti pembelian biasa.
                        </p>

                        {/* Sleek Custom Courier Dropdown */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                              Kurir Pengiriman Baru (Biteship Official):
                            </label>
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                              <Zap className="h-3 w-3" /> Resi Otomatis Terbit
                            </span>
                          </div>

                          {renderCourierDropdown('blue')}

                          <div className="flex items-center gap-2 rounded-xl border border-blue-200/60 bg-blue-50/70 p-2.5 text-[11px] text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
                            <Zap className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                            <span>
                              Nomor resi resmi (AWB) Biteship akan langsung
                              diterbitkan otomatis dan ditampilkan seketika
                              setelah tombol kirim ditekan.
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            Catatan Pengiriman Unit Baru:
                          </label>
                          <textarea
                            rows={2}
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            placeholder="Unit baru pengganti telah disiapkan dan dikirimkan..."
                            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                        </div>
                      </div>
                    )}

                    {resolutionAction === 'REFUND' && (
                      <div className="space-y-3 rounded-2xl border border-orange-200/80 bg-orange-50/40 p-4 dark:border-orange-900/60 dark:bg-orange-950/30">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          <span className="font-bold text-slate-900 dark:text-white">
                            Alur 2: Pengembalian Dana Otomatis via Midtrans
                          </span>
                        </div>

                        <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 p-2.5 text-[11px] leading-relaxed text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                          <strong>Keterangan Dana Tertahan:</strong> Karena
                          pembeli belum mengonfirmasi pesanan selesai, dana
                          pesanan sebesar{' '}
                          <strong>
                            {formatPrice(
                              selectedReturn.refundAmount ||
                                selectedReturn.order?.total
                            )}
                          </strong>{' '}
                          masih <strong>tertahan di escrow Midtrans</strong>.
                          Sistem akan otomatis membatalkan/mentransfer balik
                          dana tertahan ke rekening pembeli.
                        </div>

                        <div className="space-y-1.5 rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">
                              Nominal Refund:
                            </span>
                            <span className="font-mono text-sm font-black text-orange-600 dark:text-orange-400">
                              {formatPrice(
                                selectedReturn.refundAmount ||
                                  selectedReturn.order?.total
                              )}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">
                              Rekening Tujuan:
                            </span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {selectedReturn.bankName || 'Bank'} •{' '}
                              {selectedReturn.bankAccountNumber || '-'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Atas Nama:</span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {selectedReturn.bankAccountName ||
                                selectedReturn.user?.name ||
                                '-'}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            Catatan Konfirmasi Refund:
                          </label>
                          <textarea
                            rows={2}
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            placeholder="Dana tertahan telah berhasil dikembalikan balik via Midtrans..."
                            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                        </div>
                      </div>
                    )}

                    {resolutionAction === 'REPAIR' && (
                      <div className="space-y-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Wrench className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="font-bold text-slate-900 dark:text-white">
                              Alur 3: Perbaiki Barang (Servis Garansi 30 Hari)
                            </span>
                          </div>
                        </div>

                        {/* Stage Selector (Tahap 1 vs Tahap 2) */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setRepairStage('IN_PROGRESS')}
                            className={`rounded-xl border p-2 text-center text-xs font-bold transition ${
                              repairStage === 'IN_PROGRESS'
                                ? 'shadow-xs border-emerald-600 bg-emerald-600 text-white'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                            }`}
                          >
                            Tahap 1: Sedang Diperbaiki
                          </button>
                          <button
                            type="button"
                            onClick={() => setRepairStage('COMPLETED')}
                            className={`rounded-xl border p-2 text-center text-xs font-bold transition ${
                              repairStage === 'COMPLETED'
                                ? 'shadow-xs border-emerald-600 bg-emerald-600 text-white'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                            }`}
                          >
                            Tahap 2: Selesai & Kirim Balik
                          </button>
                        </div>

                        {repairStage === 'IN_PROGRESS' ? (
                          <div className="space-y-2.5">
                            <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                              Unit masuk ke tahap servis teknisi resmi. Pembeli
                              akan melihat notifikasi dan status bahwa unit
                              sedang menunggu perbaikan sebelum dikirimkan
                              kembali.
                            </p>

                            <div>
                              <label className="mb-1 block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                Estimasi Waktu Pengerjaan Teknisi:
                              </label>
                              <div className="flex flex-wrap gap-1.5">
                                {[
                                  '1 - 2 Hari Kerja',
                                  '3 - 5 Hari Kerja',
                                  'Kilat (Hari Ini)',
                                ].map((preset) => (
                                  <button
                                    key={preset}
                                    type="button"
                                    onClick={() =>
                                      setRepairEstimatedDays(preset)
                                    }
                                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                                      repairEstimatedDays === preset
                                        ? 'border-emerald-600 bg-emerald-100 font-bold text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-200'
                                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                    }`}
                                  >
                                    {preset}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label className="mb-1 block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                Rencana & Catatan Servis Teknisi:
                              </label>
                              <textarea
                                rows={2}
                                value={repairNotes}
                                onChange={(e) => setRepairNotes(e.target.value)}
                                placeholder="Contoh: Penggantian modul display LCD original, pengetesan daya tahan baterai, dan kalibrasi..."
                                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                              Perbaikan unit telah selesai 100%. Masukkan kurir
                              dan nomor resi pengiriman untuk mengirimkan unit
                              kembali ke alamat pembeli agar bisa dilacak
                              seperti pembelian biasa.
                            </p>

                            {/* Sleek Custom Courier Dropdown */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                                  Kurir Pengiriman Balik (Biteship Official):
                                </label>
                                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  <Zap className="h-3 w-3" /> Resi Otomatis
                                  Terbit
                                </span>
                              </div>

                              {renderCourierDropdown('emerald')}

                              <div className="flex items-center gap-2 rounded-xl border border-emerald-200/60 bg-emerald-50/70 p-2.5 text-[11px] text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                                <Zap className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                <span>
                                  Nomor resi resmi (AWB) Biteship akan langsung
                                  diterbitkan otomatis dan ditampilkan seketika
                                  setelah tombol kirim ditekan.
                                </span>
                              </div>
                            </div>

                            <div>
                              <label className="mb-1 block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                Catatan Hasil Servis untuk Pembeli:
                              </label>
                              <textarea
                                rows={2}
                                value={responseText}
                                onChange={(e) =>
                                  setResponseText(e.target.value)
                                }
                                placeholder="Perbaikan unit telah selesai 100% dan lulus uji QC teknisi..."
                                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-3 dark:border-slate-800">
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
                  onClick={handleExecuteResolution}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-6 py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-50 ${
                    actionModalType === 'REJECT'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : resolutionAction === 'REPLACEMENT'
                        ? 'bg-blue-600 shadow-blue-500/25 hover:bg-blue-700'
                        : resolutionAction === 'REFUND'
                          ? 'bg-orange-500 shadow-orange-500/25 hover:bg-orange-600'
                          : 'bg-emerald-600 shadow-emerald-500/25 hover:bg-emerald-700'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : actionModalType === 'REJECT' ? (
                    <span>Konfirmasi Tolak</span>
                  ) : actionModalType === 'RESPONSE' ? (
                    <span>Simpan Tanggapan</span>
                  ) : resolutionAction === 'REPLACEMENT' ? (
                    <>
                      <Truck className="h-3.5 w-3.5" />
                      <span>Kirim Unit Baru & Mulai Pelacakan</span>
                    </>
                  ) : resolutionAction === 'REFUND' ? (
                    <>
                      <CreditCard className="h-3.5 w-3.5" />
                      <span>Proses Refund Dana via Midtrans</span>
                    </>
                  ) : repairStage === 'IN_PROGRESS' ? (
                    <>
                      <Wrench className="h-3.5 w-3.5" />
                      <span>Simpan: Sedang Diperbaiki Teknisi</span>
                    </>
                  ) : (
                    <>
                      <Truck className="h-3.5 w-3.5" />
                      <span>Kirim Unit Servis & Berikan Resi</span>
                    </>
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
      {/* Modal Langsung Tampilkan Nomor Resi Baru (AWB) Biteship */}
      <AnimatePresence>
        {awbModalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 15 }}
              className="relative w-full max-w-lg space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-7"
            >
              {/* Header with success badge */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-sm dark:bg-emerald-950 dark:text-emerald-400">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        <Zap className="h-2.5 w-2.5" /> Auto Biteship
                      </span>
                    </div>
                    <h3 className="mt-1 text-base font-black text-slate-950 dark:text-white sm:text-lg">
                      {awbModalData.actionType === 'REPAIR'
                        ? 'Unit Hasil Servis Telah Dikirim Balik!'
                        : 'Unit Baru Pengganti Telah Dikirim!'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Pesanan #{awbModalData.orderNumber} •{' '}
                      {awbModalData.customerName}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAwbModalData(null)}
                  className="cursor-pointer rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Prominent AWB Showcase Card */}
              <div className="space-y-3 rounded-2xl border border-blue-200/80 bg-gradient-to-b from-blue-50/70 to-blue-50/30 p-4 dark:border-blue-900/60 dark:from-blue-950/40 dark:to-blue-950/20">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
                    Nomor Resi Baru (AWB Resmi):
                  </span>
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                    {awbModalData.courierCode} {awbModalData.courierService}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-white p-3 dark:border-blue-800 dark:bg-slate-900">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Truck className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                    <span className="truncate font-mono text-xl font-black tracking-wider text-blue-600 dark:text-blue-400 sm:text-2xl">
                      {awbModalData.trackingNumber}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(awbModalData.trackingNumber, 'modal-awb')
                    }
                    className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
                  >
                    {copiedId === 'modal-awb' ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Salin Resi</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-start gap-2 pt-1 text-[11px] leading-relaxed text-blue-950/80 dark:text-blue-200/90">
                  <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                  <span>
                    <strong>
                      Siklus Transaksi Dimulai Ulang dari Pengiriman:
                    </strong>{' '}
                    Status pesanan #{awbModalData.orderNumber} otomatis kembali
                    ke <strong>Sedang Dikirim (SHIPPED)</strong>. Pembeli dapat
                    melacak pengiriman secara real-time, mengonfirmasi
                    penerimaan saat tiba, dan garansi 30 hari aktif kembali.
                    Alur klaim ini berulang sampai pelanggan puas tanpa
                    komplain.
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => setAwbModalData(null)}
                  className="cursor-pointer rounded-full px-5 py-2.5 text-center text-xs font-bold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Tutup & Selesai
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTrackingAwb(awbModalData.trackingNumber)
                    setActiveTrackingCourier(awbModalData.courierCode)
                    setCheckResiModalOpen(true)
                  }}
                  className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>Lacak Live</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (awbModalData.bookingRecord) {
                      setActiveThermalLabel(awbModalData.bookingRecord)
                    }
                  }}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-blue-500/25 transition hover:bg-blue-700 active:scale-95"
                >
                  <Printer className="h-4 w-4" />
                  <span>Cetak Label Thermal</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Printable Thermal Shipping Label Modal */}
      {activeThermalLabel && (
        <ThermalShippingLabel
          data={activeThermalLabel}
          onClose={() => setActiveThermalLabel(null)}
        />
      )}

      {/* Check Resi Live Tracking Modal */}
      <CheckResiModal
        isOpen={checkResiModalOpen}
        onClose={() => setCheckResiModalOpen(false)}
        initialQuery={activeTrackingAwb}
      />
    </div>
  )
}
