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
    const unique = Array.from(new Set(stores.map((s) => s.city).filter(Boolean)))
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
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col justify-between">
      <Navbar variant="light" />

      <main className="pt-28 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          

          {/* Unified Filter & Search Control Panel */}
          <div className="mb-6 rounded-3xl border border-slate-200/80 bg-white p-2.5 sm:p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* City Tabs Segment */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              {cities.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCity(c)}
                  className={`rounded-2xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                    selectedCity === c
                      ? 'bg-slate-950 text-white shadow-2xs dark:bg-white dark:text-slate-950'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
                  }`}
                >
                  {c === 'ALL' ? 'Semua Kota' : c}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative sm:w-80 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama toko atau jalan..."
                className="w-full rounded-2xl bg-slate-50/80 border border-slate-200/70 py-2 pl-9 pr-8 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-orange-500 mb-3" />
              <p className="text-xs font-medium">Memuat data toko resmi...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center rounded-3xl border border-slate-200/80 bg-white p-10 dark:border-slate-800 dark:bg-slate-900 space-y-3 shadow-xs">
              <Store className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tidak ada toko yang cocok</h3>
              <p className="text-xs text-slate-500">Coba gunakan kata kunci lain atau pilih filter Semua Kota.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((store) => (
                <div
                  key={store.id}
                  className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-300 dark:border-slate-800 dark:bg-slate-900"
                >
                  
                  {/* Background Cover Image with Striking White Radiant Gradient Overlay */}
                  <div className="absolute inset-0 z-0">
                    <Image
                      src={store.banner || 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1200&q=80'}
                      alt={store.name}
                      fill
                      sizes="(max-width: 1280px) 100vw, 1200px"
                      className="object-cover object-right sm:object-right-center opacity-75 dark:opacity-40 transition-transform duration-700 group-hover:scale-105"
                    />
                    {/* Directional White Radiant Gradient: Solid white on the left (text protection) fading to translucent on the right */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/20 dark:from-slate-950 dark:via-slate-950/85 dark:to-slate-950/20" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-white/30 dark:from-slate-950/60 dark:to-transparent" />
                  </div>

                  {/* Foreground Content */}
                  <div className="relative z-10 p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                    
                    {/* Left Section: Square Profile Image & Info */}
                    <div className="flex items-start gap-4 sm:gap-5 flex-1 min-w-0">
                      
                      {/* Square Profile Photo */}
                      <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs dark:border-slate-700 dark:bg-slate-800">
                        <Image
                          src={store.logo || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80'}
                          alt={store.name}
                          fill
                          sizes="80px"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>

                      <div className="space-y-2 flex-1 min-w-0">
                        {/* Store Name & City Badge */}
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white group-hover:text-orange-600 transition-colors">
                            {store.name}
                          </h2>
                          <span className="rounded-full bg-white/90 border border-slate-200/80 px-2.5 py-0.5 text-[10px] font-semibold text-slate-700 shadow-2xs backdrop-blur-xs dark:bg-slate-800/90 dark:border-slate-700 dark:text-slate-300">
                            {store.city}
                          </span>
                        </div>

                        {/* Full Address */}
                        <div className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <p className="leading-relaxed">
                            {store.address}
                          </p>
                        </div>

                        {/* Operational Hours & Guarantee Badges */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            <span>Buka 09:00 - 21:00 WIB</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span>Klaim Garansi 30 Hari & Servis Kilat</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Action CTAs */}
                    <div className="flex flex-row lg:flex-col sm:items-end justify-between lg:justify-center gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-200/60 dark:border-slate-800 shrink-0">
                      <Link
                        href={`/toko/${store.slug}`}
                        className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-slate-950 px-5 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-slate-800 active:scale-[0.99] transition dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 w-full sm:w-auto"
                      >
                        <span>Lihat Stok & Profil</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>

                      <Link
                        href={`/dashboard/customer/chat?storeId=${store.id}`}
                        className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-xs px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-300 dark:hover:bg-orange-950/40 dark:hover:text-orange-300 transition w-full sm:w-auto shadow-2xs"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-orange-500" />
                        <span>Chat Toko</span>
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
