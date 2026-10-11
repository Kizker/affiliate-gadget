'use client'

import React from 'react'
import { CheckCircle2, X, RefreshCw } from 'lucide-react'

interface OrderConfirmReceivedModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isConfirming: boolean
}

export function OrderConfirmReceivedModal({
  isOpen,
  onClose,
  onConfirm,
  isConfirming,
}: OrderConfirmReceivedModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center p-3 pt-4 sm:pt-6">
      {/* Subtle backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-950/25 backdrop-blur-[2px] transition-opacity duration-200 animate-in fade-in"
        onClick={() => !isConfirming && onClose()}
      />

      {/* Sleek, small top notification card */}
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 shadow-2xl shadow-slate-900/15 backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-top-4 dark:border-slate-800 dark:bg-slate-900/95">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Konfirmasi Pesanan Diterima?
              </h4>
              <button
                type="button"
                onClick={() => !isConfirming && onClose()}
                className="rounded p-0.5 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Tutup notifikasi"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-0.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
              Pastikan fisik gadget sesuai. Garansi 30 hari ganti baru akan
              langsung aktif.
            </p>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isConfirming}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 active:scale-95 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isConfirming}
                className="shadow-xs inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
              >
                {isConfirming ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>Ya, Diterima</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
