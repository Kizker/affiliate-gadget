'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import { CustomPaymentModal } from '@/components/payment/custom-payment-modal'
import {
  CreditCard,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  Building2,
  Copy,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'

function CheckoutPaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()
  const orderId = searchParams.get('orderId')

  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [customModalOpen, setCustomModalOpen] = useState(false)

  const loadOrder = useCallback(async () => {
    if (!orderId) return
    try {
      const res = await fetch(`/api/orders/${orderId}`)
      if (!res.ok) {
        throw new Error('Gagal memuat rincian pesanan')
      }
      const data = await res.json()
      setOrder(data.order)
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (!orderId) {
      setError('ID Pesanan tidak ditemukan')
      setLoading(false)
      return
    }

    if (status === 'authenticated') {
      loadOrder()
    }
  }, [orderId, status, router, loadOrder])

  const handlePayMidtrans = () => {
    setCustomModalOpen(true)
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Disalin ke clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <div className="shadow-xs max-w-md space-y-4 rounded-3xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <AlertCircle className="mx-auto h-12 w-12 text-rose-500" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Pesanan Tidak Ditemukan
          </h2>
          <p className="text-xs text-slate-500">
            {error || 'Data tidak tersedia'}
          </p>
          <Link
            href="/dashboard/customer/orders"
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-orange-600"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Daftar Pesanan</span>
          </Link>
        </div>
      </div>
    )
  }

  const isAlreadyPaid =
    order.status === 'PAID' ||
    order.status === 'PROCESSING' ||
    order.status === 'SHIPPED' ||
    order.status === 'COMPLETED' ||
    order.payment?.status === 'SUCCESS'

  const isMidtrans = order.payment?.method === 'MIDTRANS'

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar variant="light" />

      <main className="flex flex-1 items-center justify-center px-4 py-28 sm:px-6">
        <div className="w-full max-w-lg space-y-6">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-5 dark:border-slate-800">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Pembayaran Pesanan
                </span>
                <h1 className="font-mono text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                  {order.orderNumber}
                </h1>
              </div>

              <div
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  isAlreadyPaid
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                }`}
              >
                {isAlreadyPaid ? 'Sudah Dibayar' : 'Menunggu Pembayaran'}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Total Tagihan
                </span>
                <span className="text-lg font-bold text-slate-950 dark:text-white">
                  Rp {order.total.toLocaleString('id-ID')}
                </span>
              </div>

              {isAlreadyPaid ? (
                <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/50 p-5 text-center dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-600" />
                  <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                    Pembayaran Berhasil Diverifikasi
                  </h3>
                  <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-300/70">
                    Pesanan Anda sedang diproses oleh toko fisik resmi.
                  </p>
                  <div className="mt-4">
                    <Link
                      href={`/order-confirmation/multiple?orders=${order.id}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                    >
                      Lihat Rincian Pesanan
                    </Link>
                  </div>
                </div>
              ) : isMidtrans ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-xs text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300">
                    <div className="flex items-center gap-2 font-semibold">
                      <ShieldCheck className="h-4 w-4 shrink-0 text-blue-600" />
                      <span>Midtrans Automatic Payment Gateway</span>
                    </div>
                    <p className="mt-1 text-[11px] text-blue-700/80 dark:text-blue-300/80">
                      Mendukung QRIS instan, Virtual Account Bank (BCA, Mandiri,
                      BNI, BRI), dan E-Wallet (GoPay, ShopeePay).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handlePayMidtrans}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3.5 text-sm font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600 active:scale-[0.99]"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Bayar Sekarang via Midtrans</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                    <div className="mb-2 flex items-center gap-2 font-bold text-slate-800 dark:text-white">
                      <Building2 className="h-4 w-4 text-orange-500" />
                      <span>Transfer Bank Manual</span>
                    </div>
                    {(() => {
                      const primaryBank =
                        order.store?.bankAccounts?.find(
                          (b: any) => b.isPrimary
                        ) ||
                        order.store?.bankAccounts?.[0] ||
                        (order.store?.bankAccountNumber
                          ? {
                              bankName: order.store.bankName || 'Bank Mandiri',
                              accountNumber: order.store.bankAccountNumber,
                              accountName:
                                order.store.bankAccountName || order.store.name,
                            }
                          : null)

                      return primaryBank ? (
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Bank:</span>
                            <span className="font-semibold">
                              {primaryBank.bankName}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">
                              Nomor Rekening:
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold">
                                {primaryBank.accountNumber}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopy(primaryBank.accountNumber)
                                }
                                className="rounded p-1 hover:bg-slate-200 dark:hover:bg-slate-700"
                                title="Salin No Rekening"
                              >
                                {copied ? (
                                  <Check className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Atas Nama:</span>
                            <span className="font-semibold">
                              {primaryBank.accountName}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">
                          Silakan hubungi cabang toko resmi untuk detail
                          transfer bank.
                        </p>
                      )
                    })()}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
              <Link
                href={`/order-confirmation/multiple?orders=${order.id}`}
                className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Lihat Ringkasan Pesanan</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* 100% Custom White-Label Payment Modal */}
      {order && (
        <CustomPaymentModal
          isOpen={customModalOpen}
          onClose={() => {
            setCustomModalOpen(false)
            loadOrder()
          }}
          orderId={order.id}
          orderNumber={order.orderNumber}
          totalAmount={order.total}
          onPaymentSuccess={() => {
            loadOrder()
          }}
        />
      )}

      <Footer variant="light" />
    </div>
  )
}

export default function CheckoutPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      }
    >
      <CheckoutPaymentContent />
    </Suspense>
  )
}
