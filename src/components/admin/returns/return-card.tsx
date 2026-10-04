'use client'

import React from 'react'
import {
  Package,
  Building2,
  CreditCard,
  RefreshCw,
  Copy,
  Check,
  Play,
  Eye,
  CheckCircle2,
  Truck,
  ArrowUpRight,
  Printer,
  XCircle,
  Wrench,
  MessageSquare,
} from 'lucide-react'
import { ReturnRequest, statusConfig, formatDate, formatPrice } from './types'

interface ReturnCardProps {
  item: ReturnRequest
  isSuperAdmin: boolean
  isAdminPlatform: boolean
  copiedId: string | null
  onCopy: (text: string, id: string) => void
  onOpenLightbox: (
    images: string[],
    index: number,
    meta?: { title: string; subtitle: string }
  ) => void
  onOpenCheckResi: (trackingNumber: string, courierCode: string) => void
  onPrintThermalLabel: (orderId: string) => void
  isPrintingThermal: boolean
  onOpenActionModal: (
    item: ReturnRequest,
    modalType: 'APPROVE' | 'REJECT' | 'COMPLETE' | 'RESPONSE'
  ) => void
  onUpdateStatus: (
    returnId: string,
    newStatus: string,
    responseMsg?: string
  ) => void
}

export function ReturnCard({
  item,
  isSuperAdmin,
  isAdminPlatform,
  copiedId,
  onCopy,
  onOpenLightbox,
  onOpenCheckResi,
  onPrintThermalLabel,
  isPrintingThermal,
  onOpenActionModal,
  onUpdateStatus,
}: ReturnCardProps) {
  const currentStatus = statusConfig[item.status] || statusConfig.PENDING
  const gadgetProduct = item.order?.items?.[0]?.product

  return (
    <div className="shadow-2xs hover:shadow-xs space-y-5 rounded-3xl border border-slate-200/80 bg-white p-5 transition dark:border-slate-800 dark:bg-slate-900 sm:p-6">
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
                onClick={() => onCopy(item.order?.orderNumber, item.id)}
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
              {item.type === 'REFUND' ? 'Refund 100%' : 'Tukar Unit Pengganti'}
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
                  const isVideo = /\.(mp4|webm|mov|mkv|ogg|3gp)$/i.test(img)
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        onOpenLightbox(item.images, i, {
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
                    {formatPrice(item.refundAmount || item.order?.total)}
                  </span>
                </div>

                <div className="space-y-1.5 rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Bank & No. Rekening:</span>
                    <button
                      onClick={() =>
                        onCopy(item.bankAccountNumber || '', `bank-${item.id}`)
                      }
                      className="inline-flex items-center gap-1 font-mono font-bold text-slate-900 transition hover:text-orange-500 dark:text-white"
                    >
                      <span>
                        {item.bankName} - {item.bankAccountNumber || '-'}
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
                  Toko cabang akan menyiapkan unit second berkualitas pengganti
                  (teruji fungsi 100%) untuk dikirimkan kembali kepada pembeli
                  setelah unit fisik retur tiba dan lolos verifikasi teknisi.
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
                  <Truck className="h-3.5 w-3.5 text-orange-500" /> Resi
                  Pengiriman:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      onOpenCheckResi(
                        item.returnTrackingNumber || '',
                        item.returnCourier || 'JNE'
                      )
                    }
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
                    onClick={() => onPrintThermalLabel(item.orderId)}
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
              onClick={() => onOpenActionModal(item, 'APPROVE')}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-orange-500 px-5 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition hover:bg-orange-600 active:scale-95"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Setujui & Pilih Tindakan</span>
            </button>

            <button
              onClick={() => onOpenActionModal(item, 'REJECT')}
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
              onUpdateStatus(
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
        {(item.status === 'IN_REVIEW' || item.status === 'APPROVED') && (
          <button
            onClick={() => onOpenActionModal(item, 'COMPLETE')}
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
          onClick={() => onOpenActionModal(item, 'RESPONSE')}
          className="shadow-2xs inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
        >
          <MessageSquare className="h-3.5 w-3.5 text-orange-500" />
          <span>Beri Tanggapan</span>
        </button>
      </div>
    </div>
  )
}
