'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { RotateCcw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { usePageGuard } from '@/hooks/use-page-guard'
import { CheckResiModal } from '@/components/shipping/check-resi-modal'
import { ThermalShippingLabel } from '@/components/shipping/thermal-shipping-label'
import type { ShippingBookingRecord } from '@/lib/shipping/biteship-client'

import {
  ReturnRequest,
  ActionModalType,
  ResolutionActionType,
  RepairStage,
  AwbModalData,
  ReturnsHeaderAndMetrics,
  ReturnsToolbar,
  ReturnCard,
  ResolutionActionModal,
  MediaLightboxModal,
  AwbSuccessModal,
} from '@/components/admin/returns'

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
  const [actionModalType, setActionModalType] = useState<ActionModalType>(null)
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
  const [resolutionAction, setResolutionAction] =
    useState<ResolutionActionType>('REPLACEMENT')
  const [courierName, setCourierName] = useState('JNE')
  const [trackingNumberInput, setTrackingNumberInput] = useState('')
  const [repairStage, setRepairStage] = useState<RepairStage>('IN_PROGRESS')
  const [repairEstimatedDays, setRepairEstimatedDays] =
    useState('1 - 2 Hari Kerja')
  const [repairNotes, setRepairNotes] = useState('')

  // Sleek Courier Dropdown & AWB Success Modal
  const [courierDropdownOpen, setCourierDropdownOpen] = useState(false)
  const [awbModalData, setAwbModalData] = useState<AwbModalData | null>(null)

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
  const openActionModal = (item: ReturnRequest, modalType: ActionModalType) => {
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
      {/* 0. Header Title & Context and 1. Unified Bento Metric Grid */}
      <ReturnsHeaderAndMetrics metrics={metrics} />

      {/* 2. Unified Control Panel */}
      <ReturnsToolbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        metrics={metrics}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        selectedStore={selectedStore}
        setSelectedStore={setSelectedStore}
        storeOptions={storeOptions}
        isSuperAdmin={isSuperAdmin}
        isAdminPlatform={isAdminPlatform}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        loading={loading}
        onRefresh={fetchReturns}
      />

      {/* 3. Returns List Content */}
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
          {filteredReturns.map((item) => (
            <ReturnCard
              key={item.id}
              item={item}
              isSuperAdmin={isSuperAdmin}
              isAdminPlatform={isAdminPlatform}
              copiedId={copiedId}
              onCopy={handleCopy}
              onOpenLightbox={handleOpenLightbox}
              onOpenCheckResi={(trackingNumber, courierCode) => {
                setActiveTrackingAwb(trackingNumber)
                setActiveTrackingCourier(courierCode)
                setCheckResiModalOpen(true)
              }}
              onPrintThermalLabel={handlePrintThermalLabel}
              isPrintingThermal={isPrintingThermal}
              onOpenActionModal={(selectedItem, type) => {
                if (type) openActionModal(selectedItem, type)
              }}
              onUpdateStatus={handleUpdateStatus}
            />
          ))}
        </div>
      )}

      {/* 4. Action Dialog (Replacement, Refund, Repair) */}
      <ResolutionActionModal
        isOpen={Boolean(actionModalType && selectedReturn)}
        onClose={() => {
          setActionModalType(null)
          setSelectedReturn(null)
        }}
        selectedReturn={selectedReturn}
        actionModalType={actionModalType}
        resolutionAction={resolutionAction}
        setResolutionAction={setResolutionAction}
        responseText={responseText}
        setResponseText={setResponseText}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        courierName={courierName}
        setCourierName={setCourierName}
        courierDropdownOpen={courierDropdownOpen}
        setCourierDropdownOpen={setCourierDropdownOpen}
        repairStage={repairStage}
        setRepairStage={setRepairStage}
        repairEstimatedDays={repairEstimatedDays}
        setRepairEstimatedDays={setRepairEstimatedDays}
        repairNotes={repairNotes}
        setRepairNotes={setRepairNotes}
        isProcessing={isProcessing}
        onExecuteResolution={handleExecuteResolution}
      />

      {/* 5. Luxury Fullscreen Media Lightbox Portal */}
      <MediaLightboxModal
        isOpen={lightboxOpen}
        images={lightboxImages}
        activeIndex={activeMediaIndex}
        onIndexChange={setActiveMediaIndex}
        onClose={() => setLightboxOpen(false)}
        meta={lightboxMeta}
      />

      {/* 6. Modal Langsung Tampilkan Nomor Resi Baru (AWB) Biteship */}
      <AwbSuccessModal
        awbModalData={awbModalData}
        onClose={() => setAwbModalData(null)}
        onCopy={handleCopy}
        copiedId={copiedId}
        onTrackLive={(trackingNumber, courierCode) => {
          setActiveTrackingAwb(trackingNumber)
          setActiveTrackingCourier(courierCode)
          setCheckResiModalOpen(true)
        }}
        onPrintThermal={(bookingRecord) => {
          if (bookingRecord) {
            setActiveThermalLabel(bookingRecord)
          }
        }}
      />

      {/* 7. Printable Thermal Shipping Label Modal */}
      {activeThermalLabel && (
        <ThermalShippingLabel
          data={activeThermalLabel}
          onClose={() => setActiveThermalLabel(null)}
        />
      )}

      {/* 8. Check Resi Live Tracking Modal */}
      <CheckResiModal
        isOpen={checkResiModalOpen}
        onClose={() => setCheckResiModalOpen(false)}
        initialQuery={activeTrackingAwb}
      />
    </div>
  )
}
