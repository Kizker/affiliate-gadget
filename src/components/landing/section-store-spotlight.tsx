'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Store, MapPin, Building2, ArrowRight, ShieldCheck, Clock } from 'lucide-react'

export function SectionStoreSpotlight() {
  const [stores, setStores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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

  return (
    <section className="py-16 sm:py-20 bg-slate-50/50 dark:bg-slate-900/30 border-y border-slate-100 dark:border-slate-800/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Streamlined Section Header & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 mb-8 sm:mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              Toko Resmi Terdekat
            </h2>
          </div>

          <Link
            href="/toko"
            className="group shrink-0 inline-flex items-center gap-1.5 rounded-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white px-4 py-1.5 text-xs font-bold shadow-sm shadow-orange-500/25 transition-all duration-200 cursor-pointer w-fit"
          >
            <span>Lihat Semua Toko</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Store Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-3xl border border-slate-200/60 p-5 dark:border-slate-800">
                <div className="aspect-[16/10] w-full rounded-2xl bg-slate-200 dark:bg-slate-800 mb-4" />
                <div className="h-4 w-1/4 rounded-full bg-slate-200 dark:bg-slate-800 mb-2.5" />
                <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-800 mb-3" />
                <div className="h-3 w-5/6 rounded bg-slate-100 dark:bg-slate-800/60" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {stores.slice(0, 3).map((store) => {
              const displayImg = store.banner || store.logo || store.image || 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=700&q=80'
              const hoursText = store.schedules && store.schedules.length > 0
                ? `Buka ${store.schedules[0].openTime} - ${store.schedules[0].closeTime}`
                : store.hours || 'Buka Setiap Hari (10:00 - 21:00)'

              return (
                <div
                  key={store.slug}
                  className="group flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-5.5 transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                >
                  <div className="space-y-3.5">
                    {/* 1. Store Image Stage */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80">
                      <Image
                        src={displayImg}
                        alt={store.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        <span>Buka Sekarang</span>
                      </div>
                    </div>

                    {/* 2. Store Details & Typography */}
                    <div className="space-y-2 px-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-block rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold tracking-wide uppercase text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                          {store.city || 'Toko Resmi'}
                        </span>

                        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span>{hoursText}</span>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-slate-950 dark:text-white group-hover:text-orange-500 transition-colors">
                        {store.name}
                      </h3>

                      <div className="flex items-start gap-1.5 pt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400 mt-0.5" />
                        <p className="line-clamp-2 leading-relaxed">
                          {store.address}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 3. Primary Store Action CTA */}
                  <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
                    <Link
                      href={`/toko/${store.slug}`}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-slate-950 hover:bg-slate-800 active:scale-98 text-white py-2.5 text-xs font-bold transition-all duration-200 shadow-xs dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 cursor-pointer"
                    >
                      <Store className="h-3.5 w-3.5" />
                      <span>Kunjungi Toko</span>
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </section>
  )
}

export default SectionStoreSpotlight
