'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Heart, ShoppingBag } from 'lucide-react'
import { Navbar } from '@/components/layouts/navbar'
import { MobileTopNav } from '@/components/layouts/mobile-top-nav'
import { MobileBottomNav } from '@/components/layouts/mobile-bottom-nav'
import { CustomerWishlistView } from '@/components/customer/customer-wishlist-view'
import { useWishlistSafe } from '@/lib/store/wishlist-store'

export default function WishlistClient() {
  const { totalCount } = useWishlistSafe()

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 selection:bg-orange-500 selection:text-white dark:bg-slate-950 dark:text-slate-100">
      {/* 1. Mobile Layout */}
      <div className="block md:hidden">
        <MobileTopNav />

        {/* Mobile Page Header Bar */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95">
          <Link
            href="/dashboard/customer/settings"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 transition hover:text-orange-500 active:scale-95 dark:text-slate-300"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Profil</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
            <h1 className="text-xs font-bold text-slate-950 dark:text-white">
              Wishlist Saya
            </h1>
            {totalCount > 0 && (
              <span className="rounded-full bg-rose-100 px-2 py-0.2 text-[10px] font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                {totalCount}
              </span>
            )}
          </div>
          <div className="w-10" />
        </div>

        <main className="p-4">
          <CustomerWishlistView isStandalonePage={true} />
        </main>

        <MobileBottomNav />
      </div>

      {/* 2. Desktop Layout */}
      <div className="hidden min-h-screen md:block">
        <Navbar variant="light" />

        <main className="mx-auto max-w-5xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
          {/* Header Banner */}
          <div className="shadow-2xs mb-6 rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center dark:border-slate-800">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400">
                  <Heart className="h-6 w-6 fill-rose-500" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-950 dark:text-white">
                    Wishlist Produk Impian
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pantau dan amankan gadget bekas bergaransi 30 hari favorit Anda
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard/customer/settings"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Pengaturan Akun</span>
                </Link>
                <Link
                  href="/gadget"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600 active:scale-95"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>Katalog Gadget</span>
                </Link>
              </div>
            </div>

            <div className="pt-5">
              <CustomerWishlistView isStandalonePage={true} />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
