'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import {
  Store,
  MapPin,
  Clock,
  ArrowRight,
  Search,
  MessageSquare,
  ShieldCheck,
  X,
} from 'lucide-react'

export default function TokoDirectoryPage() {
  const [stores, setStores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCity, setSelectedCity] = useState('ALL')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchStores()
  }, [])

  const fetchStores = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stores')
      const data = await res.json()
      if (data.success) {
        setStores(data.data || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const cities = useMemo(() => {
    const unique = Array.from(
      new Set(stores.map((s) => s.city).filter(Boolean))
    )
    return ['ALL', ...unique]
  }, [stores])

  const filtered = useMemo(() => {
    return stores.filter((s) => {
      const matchesCity = selectedCity === 'ALL' || s.city === selectedCity
      const matchesSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.city.toLowerCase().includes(search.toLowerCase()) ||
        (s.address && s.address.toLowerCase().includes(search.toLowerCase()))

      return matchesCity && matchesSearch
    })
  }, [stores, selectedCity, search])

  return (
    <div className="flex min-h-screen flex-col justify-between bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar variant="light" />

      <main className="pb-20 pt-24 sm:pt-28">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          {/* Unified Filter & Search Control Panel */}
          <div className="shadow-2xs mb-6 flex flex-col items-stretch justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:p-3">
            {/* City Tabs Segment */}
            <div className="no-scrollbar flex items-center gap-1 overflow-x-auto py-0.5">
              {cities.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCity(c)}
                  className={`whitespace-nowrap rounded-2xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 sm:px-4 ${
                    selectedCity === c
                      ? 'shadow-2xs bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`}
                >
                  {c === 'ALL' ? 'Semua Kota' : c}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative shrink-0 border-t border-slate-100 pt-2 dark:border-slate-800 sm:w-80 sm:border-t-0 sm:pt-0">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama toko atau jalan..."
                className="w-full rounded-2xl border border-slate-200/70 bg-slate-50/80 py-2 pl-9 pr-8 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Store List View with Banner Cover Gradient & Square Profile */}
          {loading ? (
            <div className="py-24 text-center text-slate-400">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-orange-500" />
              <p className="text-xs font-medium">Memuat data toko resmi...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="shadow-xs space-y-3 rounded-3xl border border-slate-200/80 bg-white p-10 py-20 text-center dark:border-slate-800 dark:bg-slate-900">
              <Store className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Tidak ada toko yang cocok
              </h3>
              <p className="text-xs text-slate-500">
                Coba gunakan kata kunci lain atau pilih filter Semua Kota.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((store) => (
                <div
                  key={store.id}
                  className="shadow-xs group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white transition-all duration-300 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  {/* Background Cover Image with Striking White Radiant Gradient Overlay */}
                  <div className="absolute inset-0 z-0">
                    <Image
                      src={
                        store.banner ||
                        'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1200&q=80'
                      }
                      alt={store.name}
                      fill
                      sizes="(max-width: 1280px) 100vw, 1200px"
                      className="sm:object-right-center object-cover object-right opacity-75 transition-transform duration-700 group-hover:scale-105 dark:opacity-40"
                    />
                    {/* Directional White Radiant Gradient: Solid white on the left (text protection) fading to translucent on the right */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/20 dark:from-slate-950 dark:via-slate-950/85 dark:to-slate-950/20" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-white/30 dark:from-slate-950/60 dark:to-transparent" />
                  </div>

                  {/* Foreground Content */}
                  <div className="relative z-10 flex flex-col gap-4 p-4 sm:gap-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                    {/* Left Section: Square Profile Image & Info */}
                    <div className="flex min-w-0 flex-1 items-start gap-3.5 sm:gap-5">
                      {/* Square Profile Photo */}
                      <div className="shadow-2xs relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-700 dark:bg-slate-800 sm:h-20 sm:w-20">
                        <Image
                          src={
                            store.logo ||
                            'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80'
                          }
                          alt={store.name}
                          fill
                          sizes="80px"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>

                      <div className="min-w-0 flex-1 space-y-1.5 sm:space-y-2">
                        {/* Store Name & City Badge */}
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <h2 className="text-sm font-bold text-slate-950 transition-colors group-hover:text-orange-600 dark:text-white sm:text-lg">
                            {store.name}
                          </h2>
                          <span className="shadow-2xs backdrop-blur-xs rounded-full border border-slate-200/80 bg-white/90 px-2 py-0.5 text-[9.5px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-300 sm:px-2.5 sm:text-[10px]">
                            {store.city}
                          </span>
                        </div>

                        {/* Full Address */}
                        <div className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <p className="line-clamp-2 text-[11px] leading-relaxed sm:line-clamp-none sm:text-xs">
                            {store.address}
                          </p>
                        </div>

                        {/* Operational Hours & Guarantee Badges */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 text-xs text-slate-500 sm:gap-x-4 sm:pt-1">
                          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px]">
                            <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span>Buka 09:00 - 21:00 WIB</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 sm:text-[11px]">
                            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                            <span>Garansi 30 Hari & Servis Kilat</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Action CTAs */}
                    <div className="grid shrink-0 grid-cols-2 justify-between gap-2 border-t border-slate-200/60 pt-3 dark:border-slate-800 sm:flex sm:flex-row sm:items-end sm:gap-2.5 lg:flex-col lg:justify-center lg:border-t-0 lg:pt-0">
                      <Link
                        href={`/toko/${store.slug}`}
                        className="shadow-2xs inline-flex w-full items-center justify-center gap-1 rounded-2xl bg-slate-950 px-3 py-2.5 text-center text-xs font-bold text-white transition hover:bg-slate-800 active:scale-[0.99] dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 sm:w-auto sm:gap-1.5 sm:px-5"
                      >
                        <span className="truncate">Lihat Stok</span>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                      </Link>

                      <Link
                        href={`/dashboard/customer/chat?storeId=${store.id}`}
                        className="backdrop-blur-xs shadow-2xs inline-flex w-full items-center justify-center gap-1 rounded-2xl border border-slate-200/80 bg-white/90 px-3 py-2.5 text-center text-xs font-semibold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-300 dark:hover:bg-orange-950/40 dark:hover:text-orange-300 sm:w-auto sm:gap-1.5 sm:px-4"
                      >
                        <MessageSquare className="h-3.5 w-3.5 shrink-0 text-orange-500" />
                        <span className="truncate">Chat Toko</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer variant="light" />
    </div>
  )
}
