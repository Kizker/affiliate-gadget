'use client'

import React, { useState } from 'react'
import { CheckCircle, AlertTriangle, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface OrderCompleteModalProps {
  isOpen: boolean
  orderId: string
  orderNumber: string
  onClose: () => void
  onSuccess?: () => void
}

export function OrderCompleteModal({
  isOpen,
  orderId,
  orderNumber,
  onClose,
  onSuccess,
}: OrderCompleteModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleCompleteOrder = async () => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()

      if (res.ok && data.success) {
        toast.success('Pesanan berhasil diselesaikan secara manual!')
        onClose()
        if (onSuccess) {
          onSuccess()
        } else {
          router.refresh()
        }
      } else {
        toast.error(data.error || 'Gagal menyelesaikan pesanan')
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi saat menyelesaikan pesanan')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="backdrop-blur-xs fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 duration-200 animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
          aria-label="Tutup"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-950 dark:text-white">
              Selesaikan Pesanan?
            </h3>
            <p className="font-mono text-xs text-slate-400">#{orderNumber}</p>
          </div>
        </div>

        <div className="my-4 space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-3.5 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="space-y-1">
                <p className="font-bold">Konsekuensi Penyelesaian Manual:</p>
                <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                  Dengan menyelesaikan pesanan ini sekarang, masa garansi toko
                  30 hari akan <strong>otomatis berakhir/hilang</strong> dan
                  dana pembayaran akan langsung dicairkan dari Escrow ke toko.
                </p>
              </div>
            </div>
          </div>

          <p className="text-slate-500 dark:text-slate-400">
            Pastikan unit gadget Anda telah diperiksa dan berfungsi normal
            secara menyeluruh sebelum menyelesaikan pesanan.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:w-auto"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleCompleteOrder}
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 disabled:opacity-50 sm:w-auto"
          >
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle className="h-3.5 w-3.5" />
            )}
            <span>Ya, Selesaikan Pesanan</span>
          </button>
        </div>
      </div>
    </div>
  )
}
