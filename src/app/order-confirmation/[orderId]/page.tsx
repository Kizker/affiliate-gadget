'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import {
  CheckCircle2,
  Package,
  Clock,
  ArrowRight,
  Copy,
  Check,
  Loader2,
  ShieldCheck,
  Truck,
  ShoppingBag,
} from 'lucide-react'
import { toast } from 'sonner'

interface OrderData {
  id: string
  orderNumber: string
  total: number
  status: string
  createdAt: string
  notes: string | null
  user: {
    name: string | null
    email: string
    phone: string | null
    address: string | null
  }
  items: Array<{
    id: string
    quantity: number
    price: number
    product: {
      id: string
      name: string
      images: string[]
    }
  }>
}

export default function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const router = useRouter()
  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [orderId, setOrderId] = useState<string>('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    params.then((p) => setOrderId(p.orderId))
  }, [params])

  useEffect(() => {
    if (!orderId) return

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`)
        if (res.ok) {
          const data = await res.json()
          setOrder(data.order)
        } else {
          router.push('/')
        }
      } catch (error) {
        console.error('Error fetching order:', error)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId, router])

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (!order) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar variant="light" />

      <main className="flex min-h-screen flex-col pb-20 pt-28 sm:pb-24 sm:pt-32">
        <div className="mx-auto my-auto w-full max-w-2xl px-4 sm:px-6">
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

          {/* Main Order Card */}
          <div className="shadow-xs overflow-hidden rounded-3xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
            {/* Order Card Header */}
            <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-800/30 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Nomor Pesanan
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-slate-950 dark:text-white sm:text-base">
                    {order.orderNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(order.orderNumber)}
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
                {order.items.map((item) => {
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
                          Rp{' '}
                          {(item.price * item.quantity).toLocaleString('id-ID')}
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
                Rp {order.total.toLocaleString('id-ID')}
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
              href="/dashboard/customer/orders"
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
