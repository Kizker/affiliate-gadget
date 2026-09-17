'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  Search,
  Store,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Package,
  Smartphone,
  ArrowLeftRight,
  X,
} from 'lucide-react'
import { useCartStore } from '@/lib/store/cart-store'
import { MobileTopNav } from '@/components/layouts/mobile-top-nav'

interface MobileStoreDirectoryViewProps {
  stores: any[]
  loading: boolean
  selectedCity: string
  setSelectedCity: (c: string) => void
  cities: string[]
  search: string
  setSearch: (s: string) => void
  session: any
  status: string
}

export function MobileStoreDirectoryView({
  stores,
  loading,
  selectedCity,
  setSelectedCity,
  cities,
  search,
  setSearch,
  session,
  status,
}: MobileStoreDirectoryViewProps) {
  const { items } = useCartStore()

  const cartCount =
    status === 'authenticated'
      ? items.reduce((sum, item) => sum + item.quantity, 0)
      : 0

  const accountHref =
    status === 'authenticated'
      ? session?.user?.role === 'SUPER_ADMIN' ||
        session?.user?.role === 'ADMIN' ||
        session?.user?.role === 'STORE_ADMIN'
        ? '/dashboard/admin'
        : '/dashboard/customer'
      : '/login?callbackUrl=/dashboard/customer'

  const getStoreImage = (store: any, index: number) => {
    if (store.banner && !store.banner.includes('placeholder')) {
      return store.banner
    }
    const defaultImages = [
      'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=900&q=80',
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=900&q=80',
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=900&q=80',
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&q=80',
    ]
    return defaultImages[index % defaultImages.length]
  }

  const getServicePerk = (store: any, index: number) => {
    const sName = (store.name || '').toLowerCase()
    if (sName.includes('roxy') || sName.includes('jakarta')) {
      return {
        icon: Smartphone,
        label: 'Koleksi Gadget',
        val: 'iPhone, Galaxy, iPad',
      }
    }
    if (sName.includes('surabaya') || sName.includes('wtc')) {
      return {
        icon: CheckCircle2,
        label: 'Status Servis',
        val: 'Bisa Cek & Tukar',
      }
    }
    if (sName.includes('bandung') || sName.includes('bec')) {
      return {
        icon: ArrowLeftRight,
        label: 'Layanan',
        val: 'Trade-in & Cek IMEI',
      }
    }
    if (sName.includes('medan')) {
      return {
        icon: Package,
        label: 'Kondisi Unit',
        val: 'Grade A Like New',
      }
    }
    return {
      icon: ShieldCheck,
      label: 'Layanan',
      val: 'Cek Fisik & Garansi',
    }
  }

  const getCleanName = (name: string) => {
    return (name || '')
      .replace('Affiliate Gadget - ', 'AffiliateGadget Store – ')
      .replace('AffiliateGadget Store - ', 'AffiliateGadget Store – ')
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-md select-none bg-white pb-24 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* 1. TOP HEADER (Komponen Terpisah Reusable) */}
      <MobileTopNav />

      {/* 2. SEARCH & CITY FILTER SECTION */}
      <section className="space-y-2 px-4 pt-3">
        {/* Quick Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari cabang toko atau mall..."
            className="shadow-2xs w-full rounded-2xl border border-slate-200/80 bg-slate-50/90 py-2.5 pl-9 pr-8 text-xs font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-orange-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-900"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* City Filter Pills */}
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto py-1">
          {cities.map((c) => {
            const isSelected = selectedCity === c
            return (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCity(c)}
                className={`shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                  isSelected
                    ? 'shadow-xs bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                    : 'border border-slate-200/70 bg-slate-50 text-slate-600 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {c === 'ALL' ? `Semua Kota (${stores.length})` : c}
              </button>
            )
          })}
        </div>
      </section>

      {/* 4. STORE LIST CARDS (Vertical Stack matching Figma Screen 4) */}
      <section className="mt-3 space-y-4 px-4">
        {loading ? (
          <div className="py-24 text-center text-slate-400">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-orange-500" />
            <p className="text-xs font-medium">Memuat data toko resmi...</p>
          </div>
        ) : stores.length === 0 ? (
          <div className="space-y-3 rounded-3xl border border-slate-200/80 bg-white p-8 py-16 text-center dark:border-slate-800 dark:bg-slate-900">
            <Store className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Tidak ada toko yang cocok
            </h3>
            <p className="text-xs text-slate-500">
              Coba gunakan kata kunci lain atau pilih Semua Kota.
            </p>
          </div>
        ) : (
          stores.map((store, idx) => {
            const isFlagship =
              store.isOwnerStore ||
              (store.city || '').toLowerCase().includes('jakarta')
            const readyStock =
              20 +
              ((idx * 7) % 29) +
              (store._count?.products ? store._count.products * 5 : 8)
            const ratingScore = (store.rating || 4.9).toFixed(1)
            const reviewCount = store.totalReview
              ? `${store.totalReview} ulasan`
              : idx === 0
                ? '2.1k ulasan'
                : idx === 1
                  ? '1.4k ulasan'
                  : idx === 2
                    ? '980 ulasan'
                    : '730 ulasan'
            const service = getServicePerk(store, idx)
            const ServiceIcon = service.icon
            const imageSrc = getStoreImage(store, idx)
            const cleanTitle = getCleanName(store.name)

            return (
              <article
                key={store.id}
                className="shadow-xs overflow-hidden rounded-3xl border border-slate-100 bg-white transition-all hover:border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              >
                <Link href={`/toko/${store.slug}`} className="block">
                  {/* Hero Cover Image Box */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <Image
                      src={imageSrc}
                      alt={store.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 400px"
                      className="object-cover transition-transform duration-500 hover:scale-105"
                    />

                    {/* Top Left Badge: Flagship vs Official */}
                    <div className="absolute left-2.5 top-2.5 z-10">
                      <span className="backdrop-blur-xs shadow-2xs flex items-center gap-1.5 rounded-xl border border-emerald-200/70 bg-white/95 px-2.5 py-1 text-[10px] font-bold text-emerald-800 dark:border-emerald-700/60 dark:bg-slate-900/95 dark:text-emerald-400">
                        <Store className="h-3 w-3 text-emerald-600" />
                        <span>
                          {isFlagship ? 'Official Flagship' : 'Official Store'}
                        </span>
                      </span>
                    </div>

                    {/* Bottom Left Badge: Ready Stock */}
                    <div className="absolute bottom-2.5 left-2.5 z-10">
                      <span className="shadow-xs rounded-xl bg-orange-500 px-3 py-1 text-[11px] font-extrabold text-white">
                        {readyStock} Unit Ready Stock
                      </span>
                    </div>

                    {/* Bottom Right Pill: Rating & Reviews */}
                    <div className="absolute bottom-2.5 right-2.5 z-10">
                      <span className="shadow-xs backdrop-blur-xs flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10.5px] font-bold text-slate-900 dark:bg-slate-900/95 dark:text-white">
                        <span className="text-amber-500">★</span>
                        <span>{ratingScore}</span>
                        <span className="font-normal text-slate-400">
                          ({reviewCount})
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="px-3.5 pb-3 pt-3">
                    {/* Store Title */}
                    <h2 className="text-[15px] font-black leading-snug text-slate-950 transition-colors hover:text-orange-500 dark:text-white">
                      {cleanTitle}
                    </h2>

                    {/* Address */}
                    <div className="mt-1 flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-500" />
                      <p className="line-clamp-2 text-[11px] leading-relaxed">
                        {store.address}, {store.city}
                      </p>
                    </div>

                    {/* Info Strip (2 Columns) */}
                    <div className="mt-2.5 grid grid-cols-2 gap-2 rounded-2xl border border-blue-50 bg-[#F0F7FF] p-2.5 text-xs dark:border-slate-800 dark:bg-slate-800/60">
                      {/* Column 1: Jam Operasional */}
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100/60 text-blue-600 dark:bg-blue-950/50">
                          <Clock className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="block text-[9.5px] leading-none text-slate-400">
                            Jam Operasional
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] font-bold text-slate-900 dark:text-white">
                            10:00 – 20:30 WIB
                          </span>
                        </div>
                      </div>

                      {/* Column 2: Service Perk */}
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100/60 text-emerald-600 dark:bg-emerald-950/50">
                          <ServiceIcon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="block text-[9.5px] leading-none text-slate-400">
                            {service.label}
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] font-bold text-slate-900 dark:text-white">
                            {service.val}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </article>
            )
          })
        )}
      </section>
    </div>
  )
}
