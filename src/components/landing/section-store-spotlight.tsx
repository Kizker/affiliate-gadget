'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Store,
  MapPin,
  ArrowRight,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

export function SectionStoreSpotlight() {
  const [stores, setStores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    fetchStores()
  }, [])

  const fetchStores = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/stores')
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setStores(data.data)
      }
    } catch (error) {
      console.error('Error fetching stores for spotlight:', error)
    } finally {
      setLoading(false)
    }
  }

  const visibleStores = stores.slice(0, 3)
  const total = visibleStores.length

  const prev = () => setActiveIndex((i) => (i - 1 + total) % total)
  const next = () => setActiveIndex((i) => (i + 1) % total)

  return (
    <section className="flex h-screen flex-col overflow-hidden border-y border-slate-100 bg-slate-50/50 pt-16 dark:border-slate-800/80 dark:bg-slate-900/30">
      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* Section Header */}
        <div className="mb-6 flex shrink-0 items-center justify-between gap-3.5 sm:mb-8">
          <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            Toko Resmi Terdekat
          </h2>
          <Link
            href="/toko"
            className="group inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-orange-500 px-4 py-1.5 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition-all duration-200 hover:bg-orange-600 active:scale-95"
          >
            <span>Lihat Semua Toko</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Store Content */}
        {loading ? (
          /* Loading skeleton */
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-3xl border border-slate-200/60 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="mb-4 aspect-[16/9] w-full rounded-2xl bg-slate-200 dark:bg-slate-800" />
                <div className="mb-2.5 h-4 w-1/4 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="mb-3 h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-3 w-5/6 rounded bg-slate-100 dark:bg-slate-800/60" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* ── DESKTOP: Grid 3 kolom dengan kartu proper ── */}
            <div className="hidden min-h-0 flex-1 md:grid md:grid-cols-3 md:gap-5">
              {visibleStores.map((store) => {
                const displayImg =
                  store.banner ||
                  store.logo ||
                  store.image ||
                  'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=700&q=80'
                const hoursText =
                  store.schedules && store.schedules.length > 0
                    ? `${store.schedules[0].openTime} - ${store.schedules[0].closeTime}`
                    : store.hours || '10:00 - 21:00'

                return (
                  <div
                    key={store.slug}
                    className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                  >
                    {/* Store Image — fixed height */}
                    <div className="relative h-44 w-full shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-950">
                      <Image
                        src={displayImg}
                        alt={store.name}
                        fill
                        sizes="33vw"
                        unoptimized={displayImg.startsWith('/')}
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="shadow-xs absolute right-2.5 top-2.5 flex items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold text-white">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                        <span>Buka Sekarang</span>
                      </div>
                    </div>

                    {/* Store Info */}
                    <div className="flex flex-1 flex-col p-5">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="inline-block rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                          {store.city || 'Toko Resmi'}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span>{hoursText}</span>
                        </div>
                      </div>

                      <h3 className="mb-1.5 text-base font-bold text-slate-950 transition-colors group-hover:text-orange-500 dark:text-white">
                        {store.name}
                      </h3>

                      <div className="flex flex-1 items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <p className="line-clamp-2 leading-relaxed">
                          {store.address}
                        </p>
                      </div>

                      <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800/80">
                        <Link
                          href={`/toko/${store.slug}`}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-slate-950 py-2 text-xs font-bold text-white transition-all duration-200 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                        >
                          <Store className="h-3.5 w-3.5" />
                          <span>Kunjungi Toko</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ── MOBILE: Carousel satu per satu dengan navigasi ── */}
            <div className="flex min-h-0 flex-1 flex-col md:hidden">
              {/* Carousel viewport */}
              <div className="relative min-h-0 flex-1 overflow-hidden rounded-3xl">
                {visibleStores.map((store, idx) => {
                  const displayImg =
                    store.banner ||
                    store.logo ||
                    store.image ||
                    'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=700&q=80'
                  const hoursText =
                    store.schedules && store.schedules.length > 0
                      ? `${store.schedules[0].openTime} - ${store.schedules[0].closeTime}`
                      : store.hours || '10:00 - 21:00'

                  return (
                    <div
                      key={store.slug}
                      className={`duration-400 absolute inset-0 flex flex-col overflow-hidden rounded-3xl border bg-white transition-all dark:bg-slate-900 ${
                        idx === activeIndex
                          ? 'pointer-events-auto translate-x-0 border-slate-200/80 opacity-100 dark:border-slate-800'
                          : idx < activeIndex
                            ? 'pointer-events-none -translate-x-full border-transparent opacity-0'
                            : 'pointer-events-none translate-x-full border-transparent opacity-0'
                      }`}
                      style={{
                        transition: 'opacity 0.35s ease, transform 0.35s ease',
                      }}
                    >
                      {/* Image */}
                      <div className="relative h-48 w-full shrink-0 bg-slate-100 dark:bg-slate-950">
                        <Image
                          src={displayImg}
                          alt={store.name}
                          fill
                          sizes="100vw"
                          unoptimized={displayImg.startsWith('/')}
                          className="object-cover"
                          loading="lazy"
                        />
                        <div className="shadow-xs absolute right-2.5 top-2.5 flex items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold text-white">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                          <span>Buka Sekarang</span>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex flex-1 flex-col p-5">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="inline-block rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                            {store.city || 'Toko Resmi'}
                          </span>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Clock className="h-3 w-3 shrink-0" />
                            <span>{hoursText}</span>
                          </div>
                        </div>

                        <h3 className="mb-1.5 text-lg font-bold text-slate-950 dark:text-white">
                          {store.name}
                        </h3>

                        <div className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <p className="line-clamp-2 leading-relaxed">
                            {store.address}
                          </p>
                        </div>

                        <div className="mt-auto pt-4">
                          <Link
                            href={`/toko/${store.slug}`}
                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-slate-950 py-2.5 text-xs font-bold text-white transition-all duration-200 hover:bg-slate-800 dark:bg-white dark:text-slate-950"
                          >
                            <Store className="h-3.5 w-3.5" />
                            <span>Kunjungi Toko</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Navigation: prev/next + dots */}
              <div className="flex shrink-0 items-center justify-between pt-4">
                <button
                  onClick={prev}
                  className="shadow-xs flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white transition-all hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800"
                  aria-label="Previous store"
                >
                  <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                </button>

                {/* Dot indicators */}
                <div className="flex items-center gap-2">
                  {visibleStores.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveIndex(idx)}
                      className={`rounded-full transition-all duration-300 ${
                        idx === activeIndex
                          ? 'h-2 w-5 bg-orange-500'
                          : 'h-2 w-2 bg-slate-300 hover:bg-slate-400 dark:bg-slate-600'
                      }`}
                      aria-label={`Go to store ${idx + 1}`}
                    />
                  ))}
                </div>

                <button
                  onClick={next}
                  className="shadow-xs flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white transition-all hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800"
                  aria-label="Next store"
                >
                  <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

export default SectionStoreSpotlight
