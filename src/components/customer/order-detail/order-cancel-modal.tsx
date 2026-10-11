'use client'

import React from 'react'
import { Ban, XCircle } from 'lucide-react'
import { CustomSelect } from '@/components/ui/custom-select'

interface OrderCancelModalProps {
  isOpen: boolean
  onClose: () => void
  orderNumber: string
  cancelReason: string
  onReasonChange: (reason: string) => void
  onConfirmCancel: () => void
  isCancelling: boolean
}

export function OrderCancelModal({
  isOpen,
  onClose,
  orderNumber,
  cancelReason,
  onReasonChange,
  onConfirmCancel,
  isCancelling,
}: OrderCancelModalProps) {
  if (!isOpen) return null

  return (
    <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl duration-150 animate-in fade-in zoom-in-95 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/50">
              <Ban className="h-4 w-4" />
            </div>
            <h3 className="text-base font-black text-slate-950 dark:text-white">
              Batalkan Pesanan
            </h3>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          Apakah Anda yakin ingin membatalkan pesanan{' '}
          <span className="font-mono font-bold text-slate-950 dark:text-white">
            #{orderNumber}
          </span>
          ? Pembatalan hanya dapat dilakukan sebelum barang diserahkan ke kurir
          pengiriman.
        </p>

        <div className="mb-5">
          <label className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300">
            Alasan Pembatalan:
          </label>
          <CustomSelect
            value={cancelReason}
            onChange={(val) => onReasonChange(val)}
            options={[
              {
                value: 'Ingin mengubah alamat pengiriman / varian',
                label: 'Ingin mengubah alamat pengiriman / varian',
              },
              {
                value: 'Ingin mengganti metode pembayaran',
                label: 'Ingin mengganti metode pembayaran',
              },
              {
                value: 'Menemukan harga lebih hemat di toko lain',
                label: 'Menemukan promo di toko lain',
              },
              {
                value: 'Lainnya / berubah pikiran',
                label: 'Lainnya / berubah pikiran',
              },
            ]}
          />
        </div>

        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
          >
            Kembali
          </button>
          <button
            type="button"
            onClick={onConfirmCancel}
            disabled={isCancelling}
            className="shadow-xs cursor-pointer rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-700 disabled:opacity-50"
          >
            {isCancelling ? 'Membatalkan...' : 'Ya, Batalkan Pesanan'}
          </button>
        </div>
      </div>
    </div>
  )
}
