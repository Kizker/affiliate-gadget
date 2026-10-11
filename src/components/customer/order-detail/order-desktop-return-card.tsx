'use client'

import React from 'react'
import {
  Wrench,
  CreditCard,
  RotateCcw,
  Check,
  X,
  Play,
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  Truck,
  Package,
} from 'lucide-react'
import {
  OrderData,
  OrderReturnRequest,
  formatPrice,
} from './order-detail-types'

interface OrderDesktopReturnCardProps {
  order: OrderData
  latestReturnRequest: OrderReturnRequest
  returnTrackingNumber: string
  setReturnTrackingNumber: (val: string) => void
  handleSaveReturnTracking: () => void
  isSavingReturnTracking: boolean
  onOpenResiModal: (waybill: string, courier: string) => void
}

export function OrderDesktopReturnCard({
  order,
  latestReturnRequest,
  returnTrackingNumber,
  setReturnTrackingNumber,
  handleSaveReturnTracking,
  isSavingReturnTracking,
  onOpenResiModal,
}: OrderDesktopReturnCardProps) {
  const isRepair = Boolean(
    latestReturnRequest.storeResponse?.includes('[SEDANG_DIPERBAIKI]') ||
    latestReturnRequest.storeResponse?.includes('[PERBAIKAN_SELESAI]')
  )
  const isRefund = latestReturnRequest.type === 'REFUND'

  return (
    <div className="shadow-2xs mb-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
      {/* Header: Title, Date & Single Clean Status Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/80 dark:bg-slate-800/30 sm:p-5">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
              latestReturnRequest.status === 'APPROVED' ||
              latestReturnRequest.status === 'COMPLETED'
                ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                : latestReturnRequest.status === 'REJECTED'
                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                  : latestReturnRequest.status === 'IN_REVIEW'
                    ? isRepair
                      ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {isRepair ? (
              <Wrench className="h-5 w-5" />
            ) : isRefund ? (
              <CreditCard className="h-5 w-5" />
            ) : (
              <RotateCcw className="h-5 w-5" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-950 dark:text-white sm:text-base">
              {isRepair
                ? 'Servis & Perbaikan Unit (Garansi)'
                : isRefund
                  ? 'Pengembalian Dana (Refund Midtrans)'
                  : 'Penggantian Unit Baru'}
            </h3>
            <p className="text-[11px] text-slate-400">
              Diajukan pada{' '}
              {new Date(latestReturnRequest.createdAt).toLocaleDateString(
                'id-ID',
                {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }
              )}
            </p>
          </div>
        </div>

        {/* Status Pill Badge */}
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
            latestReturnRequest.status === 'APPROVED' ||
            latestReturnRequest.status === 'COMPLETED'
              ? 'border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
              : latestReturnRequest.status === 'REJECTED'
                ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300'
                : latestReturnRequest.status === 'IN_REVIEW' && isRepair
                  ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200'
                  : 'border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              latestReturnRequest.status === 'APPROVED' ||
              latestReturnRequest.status === 'COMPLETED'
                ? 'bg-slate-700 dark:bg-slate-300'
                : latestReturnRequest.status === 'REJECTED'
                  ? 'bg-rose-500'
                  : 'bg-amber-500'
            }`}
          />
          {latestReturnRequest.status === 'APPROVED'
            ? 'Pengajuan Disetujui'
            : latestReturnRequest.status === 'COMPLETED'
              ? isRefund
                ? 'Refund Berhasil'
                : isRepair
                  ? 'Perbaikan Selesai & Dikirim'
                  : 'Unit Baru Dikirim'
              : latestReturnRequest.status === 'REJECTED'
                ? 'Pengajuan Ditolak'
                : latestReturnRequest.status === 'IN_REVIEW'
                  ? isRepair
                    ? 'Sedang Diperbaiki Teknisi'
                    : 'Sedang Ditinjau'
                  : 'Menunggu Verifikasi Toko'}
        </span>
      </div>

      {/* Body Content: Stepper & Flat Information Rows */}
      <div className="space-y-4 p-4 sm:p-6">
        {/* 3-Step Visual Progress Stepper */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="relative flex items-center justify-between">
            <div className="absolute left-8 right-8 top-3 h-0.5 bg-slate-200 dark:bg-slate-700" />
            <div
              className="absolute left-8 top-3 h-0.5 bg-slate-800 transition-all duration-500 dark:bg-slate-200"
              style={{
                width:
                  latestReturnRequest.status === 'COMPLETED'
                    ? 'calc(100% - 4rem)'
                    : latestReturnRequest.status === 'APPROVED'
                      ? '50%'
                      : '0%',
              }}
            />

            {/* Step 1: Diajukan */}
            <div className="relative z-10 flex flex-col items-center gap-1">
              <div className="shadow-xs flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900">
                <Check className="h-3 w-3 stroke-[3]" />
              </div>
              <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">
                Diajukan
              </span>
            </div>

            {/* Step 2: Verifikasi / Pengerjaan Toko */}
            <div className="relative z-10 flex flex-col items-center gap-1">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  latestReturnRequest.status === 'APPROVED' ||
                  latestReturnRequest.status === 'COMPLETED'
                    ? 'shadow-xs bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                    : latestReturnRequest.status === 'REJECTED'
                      ? 'shadow-xs bg-rose-500 text-white'
                      : 'animate-pulse border-2 border-slate-800 bg-white text-slate-800 dark:border-slate-200 dark:bg-slate-900 dark:text-white'
                }`}
              >
                {latestReturnRequest.status === 'APPROVED' ||
                latestReturnRequest.status === 'COMPLETED' ? (
                  <Check className="h-3 w-3 stroke-[3]" />
                ) : latestReturnRequest.status === 'REJECTED' ? (
                  <X className="h-3 w-3 stroke-[3]" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-800 dark:bg-slate-200" />
                )}
              </div>
              <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">
                {latestReturnRequest.status === 'REJECTED'
                  ? 'Ditolak'
                  : isRepair
                    ? latestReturnRequest.status === 'IN_REVIEW'
                      ? 'Sedang Diservis'
                      : 'Perbaikan'
                    : 'Verifikasi'}
              </span>
            </div>

            {/* Step 3: Selesai */}
            <div className="relative z-10 flex flex-col items-center gap-1">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  latestReturnRequest.status === 'COMPLETED'
                    ? 'shadow-xs bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                    : 'border-2 border-slate-200 bg-white text-slate-300 dark:border-slate-700 dark:bg-slate-900'
                }`}
              >
                {latestReturnRequest.status === 'COMPLETED' ? (
                  <Check className="h-3 w-3 stroke-[3]" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                )}
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                {isRefund
                  ? 'Refund Cair'
                  : isRepair
                    ? 'Unit Dikirim'
                    : 'Unit Baru Dikirim'}
              </span>
            </div>
          </div>
        </div>

        {/* Flat Information Breakdown (Clean & Simple) */}
        <div className="space-y-2.5 text-xs">
          {/* Kendala */}
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2.5 dark:border-slate-800">
            <span className="shrink-0 text-slate-400">Kendala:</span>
            <div className="text-right">
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                {latestReturnRequest.reasonLabel || latestReturnRequest.reason}
              </span>
              {latestReturnRequest.description && (
                <p className="ml-auto mt-1 max-w-sm text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  &ldquo;{latestReturnRequest.description}&rdquo;
                </p>
              )}
            </div>
          </div>

          {/* Rekening Refund (if REFUND) */}
          {latestReturnRequest.type === 'REFUND' && (
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2.5 dark:border-slate-800">
              <span className="shrink-0 text-slate-400">Rekening Refund:</span>
              <div className="text-right">
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {latestReturnRequest.bankName} •{' '}
                  {latestReturnRequest.bankAccountNumber}
                </span>
                <p className="text-[11px] text-slate-400">
                  a.n. {latestReturnRequest.bankAccountName}
                </p>
              </div>
            </div>
          )}

          {/* Total Nilai Refund */}
          {latestReturnRequest.refundAmount && (
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2.5 dark:border-slate-800">
              <span className="shrink-0 font-semibold text-slate-600 dark:text-slate-300">
                Total Refund:
              </span>
              <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                {formatPrice(latestReturnRequest.refundAmount)}
              </span>
            </div>
          )}

          {/* Bukti Unboxing (Thumbnails) */}
          {latestReturnRequest.images &&
            latestReturnRequest.images.length > 0 && (
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2.5 dark:border-slate-800">
                <span className="shrink-0 text-slate-400">
                  Bukti ({latestReturnRequest.images.length}):
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                  {latestReturnRequest.images.map((img, i) => {
                    const isVideo = /\.(mp4|webm|mov)$/i.test(img)
                    return (
                      <a
                        key={i}
                        href={img}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-500"
                      >
                        {isVideo ? (
                          <Play className="h-4 w-4 text-slate-500" />
                        ) : (
                          <img
                            src={img}
                            alt="Bukti"
                            className="h-full w-full object-cover"
                          />
                        )}
                      </a>
                    )
                  })}
                </div>
              </div>
            )}
        </div>

        {/* Contextual Status Info Banner */}
        {latestReturnRequest.status === 'PENDING' && (
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
            <Clock className="h-4 w-4 shrink-0 text-slate-500" />
            <p className="leading-snug">
              Pengajuan sedang dalam antrean verifikasi toko cabang (estimasi
              1x24 jam kerja).
            </p>
          </div>
        )}

        {latestReturnRequest.status === 'IN_REVIEW' &&
          (isRepair ? (
            <div className="space-y-2 rounded-xl border border-amber-200/80 bg-amber-50/70 p-3.5 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
              <div className="flex items-center gap-2 font-bold text-amber-950 dark:text-amber-100">
                <Wrench className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Tahap 1: Unit Sedang Diperbaiki oleh Teknisi Toko</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-300/90">
                {latestReturnRequest.storeResponse?.replace(
                  /\[SEDANG_DIPERBAIKI\]\s*/g,
                  ''
                ) ||
                  'Unit Anda telah diterima di service center toko cabang dan saat ini sedang ditangani oleh teknisi spesialis. Setelah perbaikan selesai, unit akan segera dikirimkan kembali ke alamat Anda dilengkapi nomor resi pelacakan live.'}
              </p>
              <div className="flex items-center gap-1.5 pt-1 text-[10.5px] font-semibold text-amber-700 dark:text-amber-400">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  Status Live: Dalam antrean / pengerjaan servis teknisi
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
              <Search className="h-4 w-4 shrink-0 text-slate-500" />
              <p className="leading-snug">
                Tim toko cabang sedang memeriksa foto/video unboxing dan detail
                kendala Anda.
              </p>
            </div>
          ))}

        {latestReturnRequest.status === 'APPROVED' && (
          <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-200">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <CheckCircle2 className="h-4 w-4 text-slate-700 dark:text-slate-300" />
              <span>Pengajuan Disetujui — Silakan Kirim Unit</span>
            </div>
            {latestReturnRequest.storeResponse && (
              <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                {latestReturnRequest.storeResponse}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60 pt-2 dark:border-slate-700/60">
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Resi Pengiriman Balik:
              </span>
              {latestReturnRequest.returnTrackingNumber ? (
                <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                  {latestReturnRequest.returnCourier || 'JNE'} —{' '}
                  {latestReturnRequest.returnTrackingNumber}
                </span>
              ) : (
                <div className="flex w-full items-center gap-1.5 sm:w-auto">
                  <input
                    type="text"
                    placeholder="Nomor resi balik..."
                    value={returnTrackingNumber}
                    onChange={(e) => setReturnTrackingNumber(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono text-xs text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-400"
                  />
                  <button
                    onClick={handleSaveReturnTracking}
                    disabled={isSavingReturnTracking}
                    className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-950"
                  >
                    {isSavingReturnTracking ? '...' : 'Simpan'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {latestReturnRequest.status === 'REJECTED' && (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-200/60 bg-rose-50/70 p-3 text-xs text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <div>
              <span className="font-bold">Pengajuan Ditolak:</span>
              <p className="mt-0.5 leading-snug">
                {latestReturnRequest.storeResponse ||
                  'Pengajuan pengembalian belum memenuhi syarat verifikasi toko.'}
              </p>
            </div>
          </div>
        )}

        {latestReturnRequest.status === 'COMPLETED' &&
          (isRefund ? (
            <div className="space-y-2 rounded-xl border border-emerald-200/80 bg-emerald-50/80 p-3.5 text-xs text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
              <div className="flex items-center gap-2 font-bold text-emerald-950 dark:text-emerald-100">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>Pengembalian Dana Selesai (Midtrans Escrow)</span>
              </div>
              <p className="text-[11px] leading-relaxed text-emerald-800/90 dark:text-emerald-300/90">
                Dana tertahan sebesar{' '}
                <strong className="font-semibold text-emerald-950 dark:text-emerald-100">
                  {formatPrice(latestReturnRequest.refundAmount || order.total)}
                </strong>{' '}
                telah dikembalikan via Midtrans ke rekening tujuan (
                {latestReturnRequest.bankName
                  ? `${latestReturnRequest.bankName} - ${latestReturnRequest.bankAccountNumber}`
                  : 'rekening terdaftar'}
                ).
              </p>
              {latestReturnRequest.storeResponse && (
                <p className="text-[10.5px] italic text-emerald-700/80 dark:text-emerald-400/80">
                  &ldquo;
                  {latestReturnRequest.storeResponse.replace(
                    /\[REFUND_DANA\]\s*/g,
                    ''
                  )}
                  &rdquo;
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3 rounded-xl border border-blue-200/80 bg-blue-50/70 p-3.5 text-xs text-blue-950 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-bold text-blue-950 dark:text-blue-100">
                  {isRepair ? (
                    <Wrench className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Package className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                  )}
                  <span>
                    {isRepair
                      ? 'Perbaikan Selesai — Unit Sedang Dikirim ke Anda'
                      : 'Ganti Unit Baru — Sedang Dikirim ke Anda'}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                  <Truck className="h-3 w-3" />
                  {order.courierCode || 'JNE'} Live
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-blue-800/90 dark:text-blue-300/90">
                {latestReturnRequest.storeResponse
                  ? latestReturnRequest.storeResponse
                      .replace(/\[PERBAIKAN_SELESAI\]\s*/g, '')
                      .replace(/\[PENGGANTIAN_UNIT\]\s*/g, '')
                  : isRepair
                    ? 'Perbaikan teknisi telah selesai 100%. Gadget telah dikemas aman dan diserahkan ke kurir untuk pengiriman balik.'
                    : 'Unit baru pengganti telah disiapkan dan diserahkan ke kurir untuk pengiriman langsung ke alamat Anda.'}
              </p>

              {/* Resi Box & Live Tracking Button */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-200/90 bg-white p-2.5 dark:border-blue-800/80 dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400">
                      Nomor Resi Pengiriman:
                    </p>
                    <p className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      {order.trackingNumber ||
                        latestReturnRequest.returnTrackingNumber ||
                        'Sedang memuat resi...'}
                    </p>
                  </div>
                </div>
                {(order.trackingNumber ||
                  latestReturnRequest.returnTrackingNumber) && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenResiModal(
                        order.trackingNumber ||
                          latestReturnRequest.returnTrackingNumber ||
                          '',
                        order.courierCode ||
                          latestReturnRequest.returnCourier ||
                          'JNE'
                      )
                    }}
                    className="shadow-2xs inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700 active:scale-95 dark:bg-blue-500 dark:hover:bg-blue-600"
                  >
                    <Search className="h-3.5 w-3.5" />
                    <span>Lacak Pengiriman Unit (Live)</span>
                  </button>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
