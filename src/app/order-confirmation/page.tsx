'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Navbar,
  Footer,
  MobileTopNav,
  MobileBottomNav,
} from '@/components/layouts'
import { Loader2, Package } from 'lucide-react'

function OrderConfirmationIndexContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ordersParam = searchParams.get('orders')
    const orderIdParam = searchParams.get('orderId') || searchParams.get('id')

    if (ordersParam) {
      router.replace(`/order-confirmation/multiple?${searchParams.toString()}`)
      return
    }

    if (orderIdParam) {
      router.replace(`/order-confirmation/${orderIdParam}`)
      return
    }

    if (status === 'unauthenticated') {
      router.replace('/login?redirect=/order-confirmation')
      return
    }

    if (status === 'authenticated') {
      fetch('/api/orders')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.orders && data.orders.length > 0) {
            router.replace(
              `/order-confirmation/multiple?orders=${data.orders[0].id}`
            )
          } else {
            setLoading(false)
          }
        })
        .catch(() => {
          setLoading(false)
        })
    }
  }, [router, searchParams, status])

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="block md:hidden">
          <MobileTopNav showBack backHref="/" title="Konfirmasi Pesanan" />
        </div>
        <div className="hidden md:block">
          <Navbar variant="light" />
        </div>

        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>

        <div className="block md:hidden">
          <MobileBottomNav />
        </div>
        <div className="hidden md:block">
          <Footer variant="light" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="block md:hidden">
        <MobileTopNav showBack backHref="/" title="Konfirmasi Pesanan" />
      </div>
      <div className="hidden md:block">
        <Navbar variant="light" />
      </div>

      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-24 pt-4 md:pb-24 md:pt-28">
        <div className="shadow-xs max-w-md space-y-4 rounded-3xl border border-slate-200/80 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
            <Package className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">
            Belum Ada Pesanan Aktif
          </h2>
          <p className="text-xs text-slate-500">
            Anda belum memiliki riwayat pesanan baru untuk ditampilkan.
          </p>
          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-center">
            <Link
              href="/gadget"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition hover:bg-orange-600"
            >
              Belanja Gadget
            </Link>
            <Link
              href="/dashboard/customer/orders"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200/80 bg-white px-6 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              Riwayat Pesanan
            </Link>
          </div>
        </div>
      </main>

      <div className="block md:hidden">
        <MobileBottomNav />
      </div>
      <div className="hidden md:block">
        <Footer variant="light" />
      </div>
    </div>
  )
}

export default function OrderConfirmationIndexPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
          <div className="block md:hidden">
            <MobileTopNav showBack backHref="/" title="Konfirmasi Pesanan" />
          </div>
          <div className="hidden md:block">
            <Navbar variant="light" />
          </div>
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
          <div className="block md:hidden">
            <MobileBottomNav />
          </div>
          <div className="hidden md:block">
            <Footer variant="light" />
          </div>
        </div>
      }
    >
      <OrderConfirmationIndexContent />
    </Suspense>
  )
}
