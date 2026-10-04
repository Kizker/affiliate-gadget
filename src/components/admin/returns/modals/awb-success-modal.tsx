'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  Zap,
  X,
  Truck,
  Check,
  Copy,
  RefreshCw,
  Search,
  Printer,
} from 'lucide-react'
import { AwbModalData } from '../types'

interface AwbSuccessModalProps {
  awbModalData: AwbModalData | null
  onClose: () => void
  onCopy: (text: string, id: string) => void
  copiedId: string | null
  onTrackLive: (awb: string, courier: string) => void
  onPrintThermal: (bookingRecord: any) => void
}

export function AwbSuccessModal({
  awbModalData,
  onClose,
  onCopy,
  copiedId,
  onTrackLive,
  onPrintThermal,
}: AwbSuccessModalProps) {
  return (
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
                onClick={onClose}
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
                    onCopy(awbModalData.trackingNumber, 'modal-awb')
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
                  Status pesanan #{awbModalData.orderNumber} otomatis kembali ke{' '}
                  <strong>Sedang Dikirim (SHIPPED)</strong>. Pembeli dapat
                  melacak pengiriman secara real-time, mengonfirmasi penerimaan
                  saat tiba, dan garansi 30 hari aktif kembali. Alur klaim ini
                  berulang sampai pelanggan puas tanpa komplain.
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-full px-5 py-2.5 text-center text-xs font-bold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Tutup & Selesai
              </button>

              <button
                type="button"
                onClick={() =>
                  onTrackLive(
                    awbModalData.trackingNumber,
                    awbModalData.courierCode
                  )
                }
                className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Lacak Live</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (awbModalData.bookingRecord) {
                    onPrintThermal(awbModalData.bookingRecord)
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
  )
}
