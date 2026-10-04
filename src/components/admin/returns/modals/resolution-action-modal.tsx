'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  XCircle,
  RefreshCw,
  CreditCard,
  Wrench,
  Truck,
  Check,
  Zap,
  ChevronDown,
  Loader2,
} from 'lucide-react'
import {
  ReturnRequest,
  ActionModalType,
  ResolutionActionType,
  RepairStage,
  BITESHIP_COURIERS,
  formatPrice,
} from '../types'

interface ResolutionActionModalProps {
  isOpen: boolean
  onClose: () => void
  selectedReturn: ReturnRequest | null
  actionModalType: ActionModalType
  resolutionAction: ResolutionActionType
  setResolutionAction: (action: ResolutionActionType) => void
  responseText: string
  setResponseText: (text: string) => void
  rejectionReason: string
  setRejectionReason: (reason: string) => void
  courierName: string
  setCourierName: (courier: string) => void
  courierDropdownOpen: boolean
  setCourierDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>
  repairStage: RepairStage
  setRepairStage: (stage: RepairStage) => void
  repairEstimatedDays: string
  setRepairEstimatedDays: (days: string) => void
  repairNotes: string
  setRepairNotes: (notes: string) => void
  isProcessing: boolean
  onExecuteResolution: () => Promise<void>
}

export function ResolutionActionModal({
  isOpen,
  onClose,
  selectedReturn,
  actionModalType,
  resolutionAction,
  setResolutionAction,
  responseText,
  setResponseText,
  rejectionReason,
  setRejectionReason,
  courierName,
  setCourierName,
  courierDropdownOpen,
  setCourierDropdownOpen,
  repairStage,
  setRepairStage,
  repairEstimatedDays,
  setRepairEstimatedDays,
  repairNotes,
  setRepairNotes,
  isProcessing,
  onExecuteResolution,
}: ResolutionActionModalProps) {
  if (!isOpen || !selectedReturn || !actionModalType) return null

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

  return (
    <AnimatePresence>
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
              onClick={onClose}
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
                      Unit baru pengganti akan mulai dikirimkan kepada pembeli.
                      Sistem akan membuat pengiriman baru dengan nomor resi
                      terlampir yang dapat dilacak oleh pembeli secara real-time
                      seperti pembelian biasa.
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
                          diterbitkan otomatis dan ditampilkan seketika setelah
                          tombol kirim ditekan.
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
                      <strong>Keterangan Dana Tertahan:</strong> Karena pembeli
                      belum mengonfirmasi pesanan selesai, dana pesanan sebesar{' '}
                      <strong>
                        {formatPrice(
                          selectedReturn.refundAmount ||
                            selectedReturn.order?.total
                        )}
                      </strong>{' '}
                      masih <strong>tertahan di escrow Midtrans</strong>. Sistem
                      akan otomatis membatalkan/mentransfer balik dana tertahan
                      ke rekening pembeli.
                    </div>

                    <div className="space-y-1.5 rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Nominal Refund:</span>
                        <span className="font-mono text-sm font-black text-orange-600 dark:text-orange-400">
                          {formatPrice(
                            selectedReturn.refundAmount ||
                              selectedReturn.order?.total
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Rekening Tujuan:</span>
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
                          Unit masuk ke tahap servis teknisi resmi. Pembeli akan
                          melihat notifikasi dan status bahwa unit sedang
                          menunggu perbaikan sebelum dikirimkan kembali.
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
                                onClick={() => setRepairEstimatedDays(preset)}
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
                          Perbaikan unit telah selesai 100%. Masukkan kurir dan
                          nomor resi pengiriman untuk mengirimkan unit kembali
                          ke alamat pembeli agar bisa dilacak seperti pembelian
                          biasa.
                        </p>

                        {/* Sleek Custom Courier Dropdown */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                              Kurir Pengiriman Balik (Biteship Official):
                            </label>
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              <Zap className="h-3 w-3" /> Resi Otomatis Terbit
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
                            onChange={(e) => setResponseText(e.target.value)}
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
              onClick={onClose}
              className="cursor-pointer rounded-full px-5 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Batal
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={onExecuteResolution}
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
    </AnimatePresence>
  )
}
