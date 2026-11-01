'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Ticket,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  Share2,
  Store,
  Clock,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react'
import { toast } from 'sonner'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'

interface VoucherData {
  id: string
  code: string
  description?: string | null
  discountType: string
  discountPercent: number
  discountAmount?: number | null
  maxDiscountAmount?: number | null
  minimumPurchase: number
  validUntil: string
  isActive: boolean
  storeName?: string | null
  isGlobal?: boolean
}

export function VoucherClaimView() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const rawCode = searchParams.get('code')?.trim().toUpperCase() || ''

  const [loading, setLoading] = useState(true)
  const [voucher, setVoucher] = useState<VoucherData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [claimed, setClaimed] = useState(false)

  useEffect(() => {
    if (!rawCode) {
      setError('Kode voucher tidak ditemukan dalam tautan.')
      setLoading(false)
      return
    }

    // Validate and fetch voucher details
    fetch(`/api/vouchers?subtotal=0&orderType=PRODUCT`)
      .then((res) => res.json())
      .then((data) => {
        if (data.vouchers && Array.isArray(data.vouchers)) {
          const found = data.vouchers.find(
            (v: any) => v.code.toUpperCase() === rawCode
          )
          if (found) {
            setVoucher(found)
            setClaimed(true)
            toast.success(`Selamat! Voucher ${found.code} berhasil diklaim!`)
          } else {
            setError(
              `Kode voucher "${rawCode}" tidak ditemukan atau masa berlakunya telah berakhir.`
            )
          }
        } else {
          setError('Gagal memverifikasi voucher.')
        }
      })
      .catch((err) => {
        console.error('Error claiming voucher:', err)
        setError('Terjadi kendala saat memverifikasi voucher.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [rawCode])

  const handleCopyCode = () => {
    if (!voucher?.code) return
    navigator.clipboard
      .writeText(voucher.code)
      .then(() => {
        setCopied(true)
        toast.success(`Kode voucher ${voucher.code} berhasil disalin!`)
        setTimeout(() => setCopied(false), 2500)
      })
      .catch(() => {
        toast.error('Gagal menyalin kode voucher')
      })
  }

  const handleShareWhatsApp = () => {
    if (!voucher?.code) return
    const currentUrl = window.location.href
    const discountText =
      voucher.discountType === 'FIXED_AMOUNT'
        ? `potongan Rp ${(voucher.discountAmount || 0).toLocaleString('id-ID')}`
        : `diskon ${voucher.discountPercent}%`
    const message = encodeURIComponent(
      `Halo! Klaim voucher belanja ${discountText} di Affiliate Gadget dengan kode promo: *${voucher.code}*. Klaim sekarang melalui link berikut: ${currentUrl}`
    )
    window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank')
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-md">
          {loading ? (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <div className="border-3 mx-auto h-12 w-12 animate-spin rounded-full border-orange-500 border-t-transparent" />
              <p className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-200">
                Memverifikasi voucher Anda...
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Mohon tunggu sejenak
              </p>
            </div>
          ) : error || !voucher ? (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-950/40">
                <AlertCircle className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                Voucher Tidak Valid
              </h2>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {error || 'Kode voucher yang Anda akses tidak tersedia.'}
              </p>
              <div className="mt-6 flex flex-col gap-2.5">
                <Link
                  href="/gadget"
                  className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-orange-600"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>Jelajahi Gadget</span>
                </Link>
                <Link
                  href="/"
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Kembali ke Beranda
                </Link>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-3xl border border-orange-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
              {/* Top Banner Gradient */}
              <div className="h-28 bg-gradient-to-br from-orange-500 via-amber-500 to-rose-500 p-6 text-white sm:h-32">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold backdrop-blur-md">
                    <Sparkles className="h-3.5 w-3.5" />
                    Klaim Berhasil
                  </span>
                  {voucher.storeName ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-white/90">
                      <Store className="h-3 w-3" />
                      {voucher.storeName}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-white/90">
                      Voucher Platform Global
                    </span>
                  )}
                </div>
              </div>

              {/* Center Floating Voucher Icon */}
              <div className="relative -mt-9 flex justify-center px-6">
                <div className="h-18 w-18 flex items-center justify-center rounded-2xl border-4 border-white bg-orange-500 text-white shadow-lg dark:border-slate-900">
                  <Ticket className="h-9 w-9" />
                </div>
              </div>

              {/* Voucher Details Body */}
              <div className="p-6 text-center sm:p-7">
                <h1 className="text-xl font-black text-slate-900 dark:text-white sm:text-2xl">
                  {voucher.discountType === 'FIXED_AMOUNT'
                    ? `Potongan Rp ${(voucher.discountAmount || 0).toLocaleString('id-ID')}`
                    : `Diskon ${voucher.discountPercent}%`}
                </h1>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {voucher.description ||
                    'Voucher diskon belanja gadget resmi bergaransi 30 hari'}
                </p>

                {/* Promo Code Box */}
                <div className="mt-5 flex items-center justify-between rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50/70 p-3.5 dark:border-orange-800 dark:bg-orange-950/30">
                  <div className="text-left">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Kode Promo Anda
                    </span>
                    <p className="font-mono text-base font-black text-orange-600 dark:text-orange-400 sm:text-lg">
                      {voucher.code}
                    </p>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="shadow-xs flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-orange-100 hover:text-orange-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Terms Summary */}
                <div className="mt-4 space-y-1.5 rounded-xl bg-slate-50 p-3 text-left text-[11px] text-slate-600 dark:bg-slate-800/60 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Min. Belanja:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Rp {voucher.minimumPurchase.toLocaleString('id-ID')}
                    </span>
                  </div>
                  {voucher.maxDiscountAmount &&
                    voucher.maxDiscountAmount > 0 &&
                    voucher.discountType !== 'FIXED_AMOUNT' && (
                      <div className="flex items-center justify-between">
                        <span>Maks. Potongan:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          Rp {voucher.maxDiscountAmount.toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                  <div className="flex items-center justify-between">
                    <span>Berlaku Hingga:</span>
                    <span className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
                      <Clock className="h-3 w-3 text-orange-500" />
                      {formatDate(voucher.validUntil)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 space-y-2.5">
                  <Link
                    href={`/gadget`}
                    className="active:scale-98 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600"
                  >
                    <span>Gunakan & Belanja Sekarang</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
