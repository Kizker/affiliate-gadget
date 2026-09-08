'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import {
  CheckCircle2,
  Package,
  Clock,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Loader2,
  ShieldCheck,
  Truck,
  Sparkles,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'

interface OrderItem {
  id: string
  type: string
  quantity: number
  rentalDays?: number
  price: number
  subtotal: number
  product?: {
    id: string
    name: string
    images: string[]
    price: number
  }
}

interface Order {
  id: string
  orderNumber: string
  total: number
  subtotal: number
  status: string
  createdAt: string
  items: OrderItem[]
  store?: {
    name: string
    city: string
  }
}

function MultipleOrderConfirmationContent() {
  const { status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<Order[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const fetchOrders = useCallback(async () => {
    const rawIds =
      searchParams
        .get('orders')
        ?.split(',')
        .map((id) => id.trim())
        .filter(Boolean) || []

    // Cap at maximum 10 orders to prevent abuse / resource exhaustion
    const orderIds = rawIds.slice(0, 10)
    if (orderIds.length === 0) {
      setLoading(false)
      return
    }

    try {
      const results = await Promise.allSettled(
        orderIds.map(async (orderId) => {
          const res = await fetch(`/api/orders/${orderId}`)
          if (!res.ok) return null
          const data = await res.json()
          return (data.order as Order) || null
        })
      )

      const fetchedOrders: Order[] = []
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          fetchedOrders.push(result.value)
        }
      }

      setOrders(fetchedOrders)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchOrders()
    }
  }, [status, router, fetchOrders])

  const currentOrder = orders[currentIndex]

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Nomor pesanan berhasil disalin')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Gagal menyalin nomor pesanan')
    }
  }

  const goToNext = () => {
    if (currentIndex < orders.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <div className="shadow-xs max-w-md space-y-4 rounded-3xl border border-slate-200/80 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
            <Package className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">
            Pesanan Tidak Ditemukan
          </h2>
          <p className="text-xs text-slate-500">
            Kami tidak dapat menemukan rincian pesanan yang Anda tuju.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition hover:bg-orange-600"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col justify-between bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar variant="light" />

      <main className="pb-20 pt-28">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          {/* Success Header */}
          <div className="mb-8 space-y-3 text-center">
            <div className="shadow-xs mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-950/50">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                Pesanan Berhasil Dibuat
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                Terima kasih! Pesanan Anda segera diverifikasi dan diproses oleh
                toko resmi.
              </p>
            </div>
          </div>

          {/* Multi-Order Navigation (If > 1 store orders) */}
          {orders.length > 1 && (
            <div className="shadow-2xs mb-4 flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                onClick={goToPrev}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Sebelumnya</span>
              </button>

              <div className="flex items-center gap-1.5">
                {orders.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentIndex
                        ? 'w-6 bg-slate-950 dark:bg-orange-500'
                        : 'w-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700'
                    }`}
                    aria-label={`Lihat pesanan ${idx + 1}`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={goToNext}
                disabled={currentIndex === orders.length - 1}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <span>Berikutnya</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Main Order Card */}
          <div className="shadow-xs overflow-hidden rounded-3xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
            {/* Order Card Header */}
            <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-800/30 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Nomor Pesanan{' '}
                  {orders.length > 1
                    ? `(${currentIndex + 1}/${orders.length})`
                    : ''}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-slate-950 dark:text-white sm:text-base">
                    {currentOrder.orderNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(currentOrder.orderNumber)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200/80 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    title="Salin Nomor Pesanan"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span>Disalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 self-start rounded-full border border-amber-200/50 bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 sm:self-auto">
                <Clock className="h-3 w-3" />
                <span>Menunggu Konfirmasi</span>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-4 p-5 sm:p-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Rincian Produk
              </h2>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentOrder.items.map((item) => {
                  const name = item.product?.name || 'Gadget Smartphone'
                  const image = item.product?.images?.[0]

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0"
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 dark:border-slate-800">
                        {image ? (
                          <Image
                            src={image}
                            alt={name}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-400">
                            <Package className="h-6 w-6" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-1 text-xs font-bold text-slate-900 dark:text-white">
                          {name}
                        </h3>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {item.quantity} unit × Rp{' '}
                          {item.price.toLocaleString('id-ID')}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="text-xs font-bold tabular-nums text-slate-950 dark:text-white">
                          Rp {item.subtotal.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Total Amount */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-800/30 sm:p-6">
              <div>
                <span className="block text-xs font-bold text-slate-900 dark:text-white">
                  Total Pembayaran
                </span>
                <span className="block text-[10px] text-slate-400">
                  Termasuk PPN, Kurir & Asuransi
                </span>
              </div>
              <span className="text-base font-bold tabular-nums text-slate-950 dark:text-white sm:text-lg">
                Rp {currentOrder.total.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Guarantees Box */}
            <div className="border-t border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                  <div>
                    <span className="block text-xs font-bold text-slate-900 dark:text-white">
                      Garansi 30 Hari Aktif
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      Jaminan tukar unit second resmi
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                  <Truck className="h-4 w-4 shrink-0 text-blue-600" />
                  <div>
                    <span className="block text-xs font-bold text-slate-900 dark:text-white">
                      Asuransi Kurir 100%
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      Proteksi hilang & kerusakan jalan
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
            <Link
              href="/gadget"
              className="shadow-2xs flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white py-3.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Belanja Gadget Lainnya</span>
            </Link>

            <Link
              href="/garansi"
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3.5 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition hover:bg-orange-600 active:scale-[0.99]"
            >
              <span>Cek Status & Klaim Garansi</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>

      <Footer variant="light" />
    </div>
  )
}

export default function MultipleOrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      }
    >
      <MultipleOrderConfirmationContent />
    </Suspense>
  )
}
