'use client'

import React, { useState } from 'react'
import {
  X,
  Ticket,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Sparkles,
  ArrowRight,
  Store,
} from 'lucide-react'

export interface AvailableVoucher {
  id: string
  code: string
  description?: string | null
  discountPercent: number
  maxDiscountAmount?: number | null
  minimumPurchase: number
  totalQuota: number
  usedCount: number
  usagePerUser: number
  userUsageCount: number
  remainingUserQuota: number
  validFrom: string
  validUntil: string
  isValid: boolean
  reason: string | null
  potentialDiscount: number
}

interface VoucherPickerModalProps {
  isOpen: boolean
  onClose: () => void
  vouchers: AvailableVoucher[]
  loading: boolean
  targetStoreName?: string
  subtotal: number
  appliedCodes: string[]
  onSelectVoucher: (code: string) => void
}

export function VoucherPickerModal({
  isOpen,
  onClose,
  vouchers,
  loading,
  targetStoreName,
  subtotal,
  appliedCodes,
  onSelectVoucher,
}: VoucherPickerModalProps) {
  const [search, setSearch] = useState('')

  if (!isOpen) return null

  const filteredVouchers = vouchers.filter((v) => {
    if (!search.trim()) return true
    const q = search.trim().toLowerCase()
    return (
      v.code.toLowerCase().includes(q) ||
      (v.description && v.description.toLowerCase().includes(q))
    )
  })

  const validVouchers = filteredVouchers.filter((v) => v.isValid)
  const invalidVouchers = filteredVouchers.filter((v) => !v.isValid)

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="voucher-picker-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
    >
      {/* Backdrop */}
      <div
        className="backdrop-blur-xs fixed inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800 sm:p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="voucher-picker-title"
                className="text-sm font-bold text-slate-950 dark:text-white sm:text-base"
              >
                Pilih Voucher Promo
              </h2>
              <p className="text-[11px] text-slate-400">
                {targetStoreName ? (
                  <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
                    <Store className="h-3 w-3 text-orange-500" />
                    Untuk {targetStoreName} (Subtotal: Rp{' '}
                    {subtotal.toLocaleString('id-ID')})
                  </span>
                ) : (
                  'Pilih kupon diskon terbaik untuk pesanan Anda'
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Tutup modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="border-b border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800/80 dark:bg-slate-900/40 sm:px-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari voucher berdasarkan kode atau promo..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        {/* Voucher List Scroll Area */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
              <p className="mt-3 text-xs font-semibold text-slate-600 dark:text-slate-400">
                Memeriksa voucher yang berlaku...
              </p>
            </div>
          ) : filteredVouchers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Ticket className="mb-3 h-10 w-10 text-slate-200 dark:text-slate-700" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tidak ada voucher yang ditemukan
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                {search
                  ? `Tidak ada hasil pencarian untuk "${search}".`
                  : 'Saat ini belum ada voucher promo yang tersedia.'}
              </p>
            </div>
          ) : (
            <>
              {/* Section 1: Valid & Applicable Vouchers */}
              {validVouchers.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      <Sparkles className="h-3.5 w-3.5" />
                      Voucher Siap Digunakan ({validVouchers.length})
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Klik untuk gunakan
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {validVouchers.map((v) => {
                      const isAlreadyApplied = appliedCodes.includes(v.code)
                      return (
                        <div
                          key={v.id}
                          className={`relative overflow-hidden rounded-2xl border transition-all ${
                            isAlreadyApplied
                              ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-800/80 dark:bg-emerald-950/20'
                              : 'hover:shadow-xs border-orange-200/90 bg-white hover:border-orange-400 dark:border-slate-700 dark:bg-slate-800/80 dark:hover:border-orange-500'
                          }`}
                        >
                          <div className="flex flex-col justify-between gap-3 p-3.5 sm:flex-row sm:items-center">
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-md border border-dashed border-orange-300 bg-orange-50 px-2 py-0.5 font-mono text-xs font-extrabold text-orange-700 dark:border-orange-700 dark:bg-orange-950/60 dark:text-orange-300">
                                  {v.code}
                                </span>
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                  Hemat Rp{' '}
                                  {v.potentialDiscount.toLocaleString('id-ID')}
                                </span>
                                {v.discountPercent > 0 && (
                                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                    Diskon {v.discountPercent}%
                                  </span>
                                )}
                              </div>

                              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                                {v.description ||
                                  `Diskon belanja gadget hingga ${v.discountPercent}%`}
                              </p>

                              <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
                                <span>
                                  Min. Belanja: Rp{' '}
                                  {v.minimumPurchase.toLocaleString('id-ID')}
                                </span>
                                {v.maxDiscountAmount &&
                                  v.maxDiscountAmount > 0 && (
                                    <>
                                      <span>•</span>
                                      <span>
                                        Maks. Rp{' '}
                                        {v.maxDiscountAmount.toLocaleString(
                                          'id-ID'
                                        )}
                                      </span>
                                    </>
                                  )}
                                <span>•</span>
                                <span className="flex items-center gap-0.5">
                                  <Clock className="h-2.5 w-2.5" />
                                  s/d {formatDate(v.validUntil)}
                                </span>
                              </div>
                            </div>

                            <div className="shrink-0 pt-1 sm:pt-0">
                              {isAlreadyApplied ? (
                                <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Terpasang
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSelectVoucher(v.code)
                                    onClose()
                                  }}
                                  className="shadow-xs inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-orange-600 active:scale-95 sm:w-auto"
                                >
                                  <span>Gunakan</span>
                                  <ArrowRight className="h-3 w-3 stroke-[2.5]" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Section 2: Ineligible / Condition not met Vouchers */}
              {invalidVouchers.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Voucher Belum Memenuhi Syarat ({invalidVouchers.length})
                  </span>

                  <div className="space-y-2">
                    {invalidVouchers.map((v) => (
                      <div
                        key={v.id}
                        className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-3 opacity-75 dark:border-slate-800 dark:bg-slate-800/40"
                      >
                        <div className="flex flex-col justify-between gap-2.5 sm:flex-row sm:items-center">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                                {v.code}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-400">
                                Diskon {v.discountPercent}%
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {v.description || 'Voucher promo belanja'}
                            </p>
                            <p className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                              <AlertCircle className="h-3 w-3 shrink-0" />
                              {v.reason || 'Syarat belum terpenuhi'}
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled
                            className="cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-center text-xs font-bold text-slate-400 dark:border-slate-700 dark:bg-slate-800"
                          >
                            Belum Memenuhi Syarat
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-3 text-center text-[11px] text-slate-400 dark:border-slate-800 dark:bg-slate-900/60">
          Kupon diskon akan otomatis memotong total tagihan pesanan toko yang
          dipilih
        </div>
      </div>
    </div>
  )
}
