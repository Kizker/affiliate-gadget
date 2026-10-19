'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck,
  MapPin,
  Phone,
  Clock,
  Wrench,
  CheckCircle2,
  Navigation,
  MessageSquare,
  Search,
  Star,
  X,
  AlertCircle,
} from 'lucide-react'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { Navbar, Footer, MobileBottomNav } from '@/components/layouts'
import { MobileTopNav } from '@/components/layouts/mobile-top-nav'
import { MitraData, MitraService } from '@/lib/mitra-service-data'

export type { MitraData, MitraService }

const DEFAULT_BANNER =
  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80'
const NUMBER_EQUIVALENTS: Record<string, string[]> = {
  '1': ['satu', 'one', 'i'],
  '2': ['dua', 'two', 'ii'],
  '3': ['tiga', 'tri', 'three', 'iii'],
  '4': ['empat', 'four', 'iv'],
  '5': ['lima', 'five', 'v'],
  '6': ['enam', 'six', 'vi'],
  '7': ['tujuh', 'seven', 'vii'],
  '8': ['delapan', 'eight', 'viii'],
  '9': ['sembilan', 'nine', 'ix'],
  '10': ['sepuluh', 'ten', 'x'],
  tiga: ['3', 'tri'],
  tri: ['3', 'tiga'],
  dua: ['2'],
  satu: ['1'],
}

function normalizeSearchText(str: string | null | undefined): string {
  if (!str) return ''
  return str
    .toLowerCase()
    .replace(/[-_./,\\#@():;'"+*!?&]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isMitraMatchingQuery(mitra: MitraData, query: string): boolean {
  const trimmed = query.trim()
  if (!trimmed) return true

  const rawQ = trimmed.toLowerCase()
  const normalizedQ = normalizeSearchText(trimmed)
  const tokens = normalizedQ.split(/\s+/).filter(Boolean)

  const rawCorpusParts = [
    mitra.businessName,
    mitra.city,
    mitra.address,
    mitra.province,
    mitra.phone,
    mitra.whatsapp,
    mitra.tagline,
    mitra.description,
    ...(mitra.features || []),
    ...(mitra.services || []).map((s) => `${s?.name || ''} ${s?.price || ''}`),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  const normalizedCorpus = normalizeSearchText(rawCorpusParts)

  // Direct exact phrase match (highest speed path)
  if (rawCorpusParts.includes(rawQ) || normalizedCorpus.includes(normalizedQ)) {
    return true
  }

  // Token-level match (all tokens must match directly or via equivalents)
  if (tokens.length === 0) return true
  return tokens.every((token) => {
    if (rawCorpusParts.includes(token) || normalizedCorpus.includes(token)) {
      return true
    }
    // Check number synonyms (e.g. '3' <-> 'tiga', 'tri')
    const equivalents = NUMBER_EQUIVALENTS[token]
    if (
      equivalents &&
      equivalents.some(
        (eq) => rawCorpusParts.includes(eq) || normalizedCorpus.includes(eq)
      )
    ) {
      return true
    }
    return false
  })
}

function MitraBannerImage({
  src,
  alt,
  priority = false,
  sizes,
  className = 'object-cover transition-transform duration-500 group-hover:scale-105',
}: {
  src?: string | null
  alt: string
  priority?: boolean
  sizes: string
  className?: string
}) {
  const [imgSrc, setImgSrc] = useState(src || DEFAULT_BANNER)

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      sizes={sizes}
      quality={70}
      priority={priority}
      fetchPriority={priority ? 'high' : 'auto'}
      loading={priority ? 'eager' : 'lazy'}
      onError={() => setImgSrc(DEFAULT_BANNER)}
      className={className}
    />
  )
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatReviewCount(count: number): string {
  if (count >= 100) return `${count}+ Ulasan`
  if (count > 0) return `${count} Ulasan`
  return 'Belum ada ulasan'
}

function formatHours(weekday: string | null, weekend: string | null): string {
  if (weekday && weekend) return `${weekday} (Sen-Jum) | ${weekend} (Sab-Min)`
  return weekday || weekend || 'Lihat jadwal'
}

// ─── Skeleton Card ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="h-48 bg-slate-200 dark:bg-slate-800" />
      <div className="space-y-3 p-5">
        <div className="h-5 w-3/4 rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-800" />
        <div className="h-3 w-2/3 rounded bg-slate-100 dark:bg-slate-800" />
        <div className="flex gap-2 pt-2">
          <div className="h-6 w-20 rounded-lg bg-slate-100 dark:bg-slate-800" />
          <div className="h-6 w-20 rounded-lg bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  )
}

// ─── Main Component Props ────────────────────────────────────────────────────
interface IntegratedServiceViewProps {
  initialMitras?: MitraData[]
  initialIsMobile?: boolean
}

// ─── Main Component ─────────────────────────────────────────────────────────
export function IntegratedServiceView({
  initialMitras = [],
  initialIsMobile = false,
}: IntegratedServiceViewProps) {
  const router = useRouter()
  const isMobile = useIsMobile(768, initialIsMobile)
  const [mounted, setMounted] = useState(false)

  const [mitras, setMitras] = useState<MitraData[]>(initialMitras)
  const [loading, setLoading] = useState(initialMitras.length === 0)
  const [error, setError] = useState<string | null>(null)
  const [selectedCity, setSelectedCity] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const mobileSearchRef = useRef<HTMLInputElement | null>(null)
  const desktopSearchRef = useRef<HTMLInputElement | null>(null)

  const handleSearchSubmit = useCallback((e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    if (mobileSearchRef.current) {
      mobileSearchRef.current.blur()
    }
    if (desktopSearchRef.current) {
      desktopSearchRef.current.blur()
    }
    if (
      typeof document !== 'undefined' &&
      document.activeElement instanceof HTMLElement
    ) {
      document.activeElement.blur()
    }
    setTimeout(() => {
      mobileSearchRef.current?.blur()
      desktopSearchRef.current?.blur()
    }, 50)
  }, [])

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
    if (mobileSearchRef.current) {
      mobileSearchRef.current.focus()
    }
    if (desktopSearchRef.current) {
      desktopSearchRef.current.focus()
    }
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  const getChatUrl = (mitra: MitraData) => {
    const greeting = `Halo, saya ingin konsultasi dan booking servis di ${mitra.businessName}`
    return `/dashboard/customer/chat?mitraId=${mitra.id}&mitraName=${encodeURIComponent(mitra.businessName)}&mitraCity=${encodeURIComponent(mitra.city)}&mitraImage=${encodeURIComponent(mitra.banner || '')}&serviceContext=${encodeURIComponent(greeting)}`
  }

  const handleBookingChat = (e: React.MouseEvent, mitra: MitraData) => {
    e.preventDefault()
    const url = getChatUrl(mitra)
    router.push(url)
  }

  // Fetch client-side only if SSR provided empty data
  useEffect(() => {
    if (initialMitras.length > 0) return

    const fetchMitras = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch('/api/mitra/list', { cache: 'no-store' })
        if (!res.ok) throw new Error('Gagal memuat data layanan')
        const data = await res.json()
        setMitras(data.mitras || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      } finally {
        setLoading(false)
      }
    }
    fetchMitras()
  }, [initialMitras.length])

  // Build dynamic city filter from fetched data
  const cityFilters = useMemo(() => {
    const cities = Array.from(new Set(mitras.map((m) => m.city))).sort()
    return [
      { key: 'all', label: 'Semua Daerah' },
      ...cities.map((c) => ({ key: c, label: c })),
    ]
  }, [mitras])

  // Filter mitras based on city and search query with resilient multi-token & number matching
  const filteredMitras = useMemo(() => {
    return mitras.filter((mitra) => {
      // 1. City filter check
      if (
        selectedCity !== 'all' &&
        mitra.city.toLowerCase() !== selectedCity.toLowerCase()
      ) {
        return false
      }
      return isMitraMatchingQuery(mitra, searchQuery)
    })
  }, [mitras, selectedCity, searchQuery])

  // Detect matches in other cities if current city filter has 0 results
  const matchesInOtherCities = useMemo(() => {
    if (selectedCity === 'all' || !searchQuery.trim()) return []
    return mitras.filter((m) => {
      if (m.city.toLowerCase() === selectedCity.toLowerCase()) return false
      return isMitraMatchingQuery(m, searchQuery)
    })
  }, [mitras, selectedCity, searchQuery])

  // Viewport Mount Gating: Mount only the active viewport in the DOM to eliminate 50% DOM size
  const showMobile = !mounted ? initialIsMobile : isMobile
  const showDesktop = !mounted ? !initialIsMobile : !isMobile

  return (
    <>
      {/* 1. Mobile View — Figma Screen 3 / Servis Gadget Konsisten dengan /gadget & /toko */}
      {showMobile && (
        <div className="block md:hidden">
          {/* Header Mobile Konsisten Tanpa Profile Button */}
          <MobileTopNav />

          <main className="mx-auto min-h-screen w-full select-none bg-slate-50 pb-24 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            {/* WCAG 100 Semantic Root Heading */}
            <h1 className="sr-only">
              Pusat Layanan Servis Gadget &amp; Pergantian LCD Kilat 2 Jam di
              Indonesia
            </h1>

            {/* Mobile Search & City Filter */}
            <section className="space-y-2.5 px-4 pt-3">
              {/* Quick Search */}
              <form
                role="search"
                action=""
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSearchSubmit(e)
                }}
                className="relative"
              >
                <button
                  type="submit"
                  aria-label="Cari nama mitra, layanan, atau kota"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-500 focus:outline-none"
                >
                  <Search className="h-4 w-4" />
                </button>
                <input
                  ref={mobileSearchRef}
                  type="search"
                  name="q"
                  inputMode="search"
                  enterKeyHint="search"
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="off"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      e.key === 'Enter' ||
                      e.keyCode === 13 ||
                      e.which === 13
                    ) {
                      e.currentTarget.blur()
                      handleSearchSubmit()
                    }
                  }}
                  placeholder="Cari nama mitra, layanan, atau kota..."
                  aria-label="Cari nama mitra, layanan, atau kota"
                  className="shadow-2xs w-full rounded-2xl border border-slate-200/80 bg-white py-2.5 pl-9 pr-8 text-xs font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-orange-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white [&::-webkit-search-cancel-button]:hidden"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    aria-label="Hapus pencarian"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </form>

              {/* Dynamic City Filter Tabs */}
              <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto py-0.5">
                {cityFilters.map((f) => {
                  const isActive = selectedCity === f.key
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setSelectedCity(f.key)}
                      aria-pressed={isActive}
                      aria-label={`Filter daerah ${f.label}`}
                      className={`shrink-0 whitespace-nowrap rounded-2xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 ${
                        isActive
                          ? 'shadow-xs border border-orange-600 bg-orange-50 font-bold text-orange-700 dark:border-orange-500 dark:bg-orange-950/60 dark:text-orange-300'
                          : 'border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-100/80 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Mobile Mitras List */}
            <div className="px-4 pt-3">
              {/* Loading */}
              {loading && (
                <div className="space-y-4">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              )}

              {/* Error */}
              {error && !loading && (
                <div className="my-8 rounded-3xl border border-dashed border-red-200 bg-white p-8 text-center dark:border-red-800 dark:bg-slate-900/60">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/40">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                    Gagal memuat data
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {error}
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                  >
                    Coba Lagi
                  </button>
                </div>
              )}

              {/* Empty */}
              {!loading && !error && filteredMitras.length === 0 && (
                <div className="my-8 rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900/40">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                    <Wrench className="h-6 w-6" />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                    Tidak ada mitra ditemukan
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {matchesInOtherCities.length > 0 ? (
                      <>
                        Tidak ada mitra di kota{' '}
                        <strong className="text-slate-800 dark:text-slate-200">
                          {selectedCity}
                        </strong>{' '}
                        yang cocok dengan &quot;{searchQuery}&quot;. Ditemukan{' '}
                        {matchesInOtherCities.length} mitra di kota lain.
                      </>
                    ) : searchQuery ? (
                      `Tidak ada mitra yang cocok dengan pencarian "${searchQuery}". Coba gunakan kata kunci lain seperti nama toko, layanan (LCD, baterai), atau nama kota.`
                    ) : (
                      `Belum ada mitra servis untuk filter kota ${selectedCity}.`
                    )}
                  </p>
                  {matchesInOtherCities.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCity('all')
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-orange-500 bg-orange-50 px-3.5 py-1.5 text-xs font-bold text-orange-600 transition-colors hover:bg-orange-100 dark:border-orange-500/40 dark:bg-orange-950/40 dark:text-orange-400"
                    >
                      Lihat di Semua Daerah ({matchesInOtherCities.length}{' '}
                      Mitra)
                    </button>
                  ) : (
                    (searchQuery || selectedCity !== 'all') && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('')
                          setSelectedCity('all')
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-orange-500 bg-orange-50 px-3.5 py-1.5 text-xs font-bold text-orange-600 transition-colors hover:bg-orange-100 dark:border-orange-500/40 dark:bg-orange-950/40 dark:text-orange-400"
                      >
                        Reset Filter
                      </button>
                    )
                  )}
                </div>
              )}

              {/* Mobile Cards List */}
              {!loading && !error && filteredMitras.length > 0 && (
                <div className="space-y-4">
                  {filteredMitras.map((mitra, idx) => {
                    const hours =
                      mitra.weekdayHours || mitra.weekendHours || 'Lihat jadwal'
                    const isFirstCard = idx === 0

                    return (
                      <article
                        key={mitra.id}
                        className="shadow-xs overflow-hidden rounded-2xl border border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900"
                      >
                        {/* Mobile image banner */}
                        <Link
                          href={`/rekomendasi/${mitra.id}`}
                          aria-label={`Lihat detail mitra ${mitra.businessName}`}
                          className="relative block h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800"
                        >
                          {mitra.banner ? (
                            <MitraBannerImage
                              src={mitra.banner}
                              alt={mitra.businessName}
                              priority={isFirstCard}
                              sizes="(max-width: 640px) 384px, (max-width: 768px) 600px, 750px"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Wrench className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

                          {/* Top badges */}
                          <div className="absolute left-3 right-3 top-3 flex items-center justify-between gap-2">
                            <span className="shadow-xs inline-flex items-center gap-1.5 rounded-full bg-emerald-600/90 px-3 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                              Buka Sekarang
                            </span>
                            <span className="shadow-xs inline-flex items-center rounded-full bg-slate-900/70 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-md">
                              {mitra.city}
                            </span>
                          </div>

                          {/* Bottom rating (Dark Glassmorphic Pill for WCAG AAA 10:1 Contrast) */}
                          {mitra.rating > 0 && (
                            <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-slate-900/80 px-2.5 py-1 backdrop-blur-md">
                              <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                              <span className="text-xs font-bold text-amber-300">
                                {mitra.rating.toFixed(1)} (
                                {formatReviewCount(mitra.reviewCount)})
                              </span>
                            </div>
                          )}
                        </Link>

                        {/* Mobile content body */}
                        <div className="space-y-3 p-4">
                          <div>
                            <Link
                              href={`/rekomendasi/${mitra.id}`}
                              aria-label={`Kunjungi profil ${mitra.businessName}`}
                            >
                              <h2 className="text-base font-bold text-slate-950 transition-colors hover:text-orange-600 dark:text-white">
                                {mitra.businessName}
                              </h2>
                            </Link>
                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                              {mitra.tagline ||
                                mitra.description ||
                                'Mitra servis gadget terpercaya.'}
                            </p>
                          </div>

                          {/* Details */}
                          <div className="space-y-1.5 border-t border-slate-100 pt-1 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">
                            <a
                              href={mitra.googleMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="group/addr flex items-start gap-2 transition hover:text-orange-500"
                              title="Buka alamat di Google Maps"
                            >
                              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 group-hover/addr:text-orange-500" />
                              <span className="line-clamp-2 text-[11px] group-hover/addr:underline">
                                {mitra.address}
                              </span>
                            </a>
                            <div className="flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                              <span className="text-[11px]">{hours}</span>
                            </div>
                          </div>

                          {/* Layanan Populer */}
                          {mitra.services.length > 0 && (
                            <div className="border-t border-slate-100 pt-2 dark:border-slate-800">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                Layanan Populer:
                              </p>
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {mitra.services.slice(0, 3).map((service) => (
                                  <span
                                    key={service.name}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-100 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300"
                                  >
                                    <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                                    {service.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action buttons (WCAG AAA High Contrast & Disambiguated Accessible Names) */}
                          <div className="grid grid-cols-2 gap-2.5 pt-2">
                            <a
                              href={mitra.googleMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Petunjuk arah Google Maps menuju ${mitra.businessName}`}
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            >
                              <Navigation className="h-3.5 w-3.5 text-slate-500" />
                              <span>Google Maps</span>
                            </a>
                            <button
                              type="button"
                              onClick={(e) => handleBookingChat(e, mitra)}
                              aria-label={`Booking servis dan konsultasi di ${mitra.businessName}`}
                              title={`Booking Servis di ${mitra.businessName}`}
                              className="shadow-xs inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-orange-700 px-3 py-2 text-center text-xs font-bold text-white transition-all hover:bg-orange-800 active:scale-95 dark:bg-orange-600"
                            >
                              <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                              <span>Booking Servis</span>
                            </button>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </div>
          </main>

          <MobileBottomNav activeTab="servis" />
        </div>
      )}

      {/* 2. Desktop View — Clean Responsive Grid */}
      {showDesktop && (
        <div className="hidden min-h-screen flex-col justify-between bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 md:flex">
          <Navbar variant="light" />

          <main className="flex-1 pb-16 md:pb-24">
            {/* Ambient glow */}
            <div className="pointer-events-none absolute left-0 right-0 top-0 h-[400px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-100/40 via-amber-50/15 to-transparent dark:from-orange-950/20 dark:via-slate-950 dark:to-transparent" />

            {/* WCAG 100 Semantic Root Heading (accessible to screen readers on all viewports) */}
            <h1 className="sr-only">
              Pusat Layanan Servis Gadget &amp; Pergantian LCD Kilat 2 Jam di
              Indonesia
            </h1>

            {/* ── HERO (Desktop only — Sesuai arsitektur UX: di mobile langsung ke bilah pencarian) ── */}
            <section className="relative hidden pb-2 pt-20 md:block md:pb-3 md:pt-24">
              <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                <div className="shadow-2xs inline-flex items-center gap-1.5 rounded-full border border-orange-200/90 bg-white/90 px-3.5 py-1 backdrop-blur-md dark:border-orange-900/60 dark:bg-slate-900/90">
                  <ShieldCheck className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9D4300] dark:text-orange-400 sm:text-[11px]">
                    LAYANAN SERVIS RESMI &amp; TERSTANDARISASI LAB
                  </span>
                </div>
                <p className="mt-2 text-sm font-bold leading-snug tracking-tight text-slate-950 dark:text-white sm:text-base md:text-lg lg:text-xl">
                  Pusat Layanan Servis Gadget Profesional &amp; Terpercaya di
                  Indonesia
                </p>
              </div>
            </section>

            {/* ── SEARCH & FILTER (Langsung tampil di atas pada tampilan mobile) ── */}
            <section className="sm:pt-22 relative mx-auto max-w-7xl px-4 pt-20 sm:px-6 md:mt-5 md:pt-0 lg:px-8">
              <div className="shadow-2xs mb-6 flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:p-3 md:rounded-3xl">
                {/* Search bar */}
                <form
                  role="search"
                  action=""
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSearchSubmit(e)
                  }}
                  className="relative flex-1"
                >
                  <button
                    type="submit"
                    aria-label="Cari nama mitra, layanan, atau kota"
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-500 focus:outline-none"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                  <input
                    ref={desktopSearchRef}
                    type="search"
                    name="q"
                    inputMode="search"
                    enterKeyHint="search"
                    autoCapitalize="none"
                    autoCorrect="off"
                    autoComplete="off"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (
                        e.key === 'Enter' ||
                        e.keyCode === 13 ||
                        e.which === 13
                      ) {
                        e.currentTarget.blur()
                        handleSearchSubmit()
                      }
                    }}
                    placeholder="Cari nama mitra, layanan, atau kota..."
                    aria-label="Cari nama mitra, layanan, atau kota"
                    className="w-full rounded-xl border border-slate-200/70 bg-slate-50/80 py-2.5 pl-10 pr-9 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:text-sm md:rounded-2xl [&::-webkit-search-cancel-button]:hidden"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      aria-label="Hapus pencarian"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </form>

                {/* City filter — dynamic from DB */}
                <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto border-t border-slate-100 pt-2 dark:border-slate-800 sm:border-t-0 sm:pt-0">
                  {cityFilters.map((f) => {
                    const isActive = selectedCity === f.key
                    return (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setSelectedCity(f.key)}
                        aria-pressed={isActive}
                        aria-label={`Filter daerah ${f.label}`}
                        className={`shrink-0 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 sm:px-4 md:rounded-2xl ${
                          isActive
                            ? 'shadow-xs border border-orange-600 bg-orange-50 font-bold text-orange-700 dark:border-orange-500 dark:bg-orange-950/60 dark:text-orange-300'
                            : 'border border-transparent text-slate-600 hover:bg-slate-100/80 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                        }`}
                      >
                        {f.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ── LOADING ── */}
              {loading && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              )}

              {/* ── ERROR ── */}
              {error && !loading && (
                <div className="my-12 rounded-3xl border border-dashed border-red-200 bg-white p-10 text-center dark:border-red-800 dark:bg-slate-900/60">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/40">
                    <AlertCircle className="h-7 w-7" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                    Gagal memuat data
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {error}
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                  >
                    Coba Lagi
                  </button>
                </div>
              )}

              {/* ── EMPTY (no results) ── */}
              {!loading && !error && filteredMitras.length === 0 && (
                <div className="my-12 rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900/40">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                    <Wrench className="h-7 w-7" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                    Tidak ada mitra ditemukan
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {matchesInOtherCities.length > 0 ? (
                      <>
                        Tidak ada mitra di kota{' '}
                        <strong className="text-slate-800 dark:text-slate-200">
                          {selectedCity}
                        </strong>{' '}
                        yang cocok dengan &quot;{searchQuery}&quot;. Ditemukan{' '}
                        {matchesInOtherCities.length} mitra di kota lain.
                      </>
                    ) : searchQuery ? (
                      `Tidak ada mitra yang cocok dengan pencarian "${searchQuery}". Coba gunakan kata kunci lain seperti nama toko, layanan (LCD, baterai), atau nama kota.`
                    ) : (
                      `Belum ada mitra servis untuk filter kota ${selectedCity}.`
                    )}
                  </p>
                  {matchesInOtherCities.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCity('all')
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl border border-orange-500 bg-orange-50 px-4 py-2 text-xs font-bold text-orange-600 transition-colors hover:bg-orange-100 dark:border-orange-500/40 dark:bg-orange-950/40 dark:text-orange-400"
                    >
                      Lihat di Semua Daerah ({matchesInOtherCities.length}{' '}
                      Mitra)
                    </button>
                  ) : (
                    (searchQuery || selectedCity !== 'all') && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('')
                          setSelectedCity('all')
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl border border-orange-500 bg-orange-50 px-4 py-2 text-xs font-bold text-orange-600 transition-colors hover:bg-orange-100 dark:border-orange-500/40 dark:bg-orange-950/40 dark:text-orange-400"
                      >
                        Reset Filter
                      </button>
                    )
                  )}
                </div>
              )}

              {/* ── DESKTOP GRID (≥ md, 3 columns) ── */}
              {!loading && !error && filteredMitras.length > 0 && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredMitras.map((mitra, idx) => {
                    const hours = formatHours(
                      mitra.weekdayHours,
                      mitra.weekendHours
                    )
                    const facilities =
                      mitra.features.length > 0
                        ? mitra.features
                        : mitra.services.slice(0, 3).map((s) => s.name)
                    const specialties = mitra.services
                      .slice(0, 4)
                      .map((s) => s.name)
                    const isFirstCard = idx === 0

                    return (
                      <article
                        key={mitra.id}
                        className="shadow-xs group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                      >
                        {/* Image area */}
                        <div>
                          <Link
                            href={`/rekomendasi/${mitra.id}`}
                            aria-label={`Lihat detail mitra ${mitra.businessName}`}
                            className="relative block h-48 w-full cursor-pointer overflow-hidden bg-slate-100 dark:bg-slate-800"
                          >
                            {mitra.banner ? (
                              <MitraBannerImage
                                src={mitra.banner}
                                alt={mitra.businessName}
                                priority={isFirstCard}
                                sizes="(max-width: 1024px) 50vw, 33vw"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <Wrench className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

                            {/* Status badge */}
                            <div className="absolute left-3.5 top-3.5">
                              <span className="shadow-xs inline-flex items-center gap-1.5 rounded-full bg-emerald-600/90 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                                Buka Sekarang
                              </span>
                            </div>

                            {/* City badge */}
                            <div className="absolute right-3.5 top-3.5">
                              <span className="shadow-xs inline-flex items-center rounded-full bg-slate-900/75 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                                {mitra.city}
                              </span>
                            </div>
                          </Link>

                          {/* Card body */}
                          <div className="space-y-4 p-5">
                            <div>
                              <Link
                                href={`/rekomendasi/${mitra.id}`}
                                aria-label={`Kunjungi profil ${mitra.businessName}`}
                              >
                                <h2 className="text-lg font-bold leading-snug text-slate-950 transition-colors hover:text-orange-600 dark:text-white">
                                  {mitra.businessName}
                                </h2>
                              </Link>
                              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                {mitra.tagline ||
                                  mitra.description ||
                                  'Mitra servis gadget terpercaya.'}
                              </p>
                            </div>

                            {/* Details */}
                            <div className="space-y-2 border-t border-slate-100 pt-1 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">
                              <a
                                href={mitra.googleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="group/addr flex items-start gap-2.5 transition hover:text-orange-500"
                                title="Buka alamat di Google Maps"
                              >
                                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 group-hover/addr:text-orange-500" />
                                <span className="line-clamp-2 text-[11px] group-hover/addr:underline">
                                  {mitra.address}
                                </span>
                              </a>
                              <div className="flex items-center gap-2.5">
                                <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                <span className="text-[11px]">{hours}</span>
                              </div>
                              {mitra.phone && (
                                <div className="flex items-center gap-2.5">
                                  <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                  <span className="text-[11px]">
                                    {mitra.phone}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Specialties */}
                            {specialties.length > 0 && (
                              <div className="space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                  Layanan Tersedia:
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {specialties.map((spec) => (
                                    <span
                                      key={spec}
                                      className="inline-flex items-center gap-1 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300"
                                    >
                                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                      {spec}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Facilities */}
                            {facilities.length > 0 && (
                              <div className="flex flex-wrap gap-1 border-t border-slate-100 pt-2 dark:border-slate-800">
                                {facilities.map((fac) => (
                                  <span
                                    key={fac}
                                    className="rounded-md bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-600 dark:bg-orange-950/40 dark:text-orange-400"
                                  >
                                    {fac}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Rating */}
                            <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                              <div className="flex items-center gap-1.5">
                                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                  {mitra.rating > 0
                                    ? mitra.rating.toFixed(1)
                                    : '5.0'}
                                </span>
                                <span className="text-xs text-slate-500">
                                  ({formatReviewCount(mitra.reviewCount)})
                                </span>
                              </div>
                              <span className="text-[11px] font-medium text-slate-500">
                                Garansi Toko
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons (WCAG AAA High Contrast & Disambiguated Accessible Names) */}
                        <div className="grid grid-cols-2 gap-2.5 p-5 pt-0">
                          <a
                            href={mitra.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Petunjuk arah Google Maps menuju ${mitra.businessName}`}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-800 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                          >
                            <Navigation className="h-3.5 w-3.5 text-slate-500" />
                            <span>Google Maps</span>
                          </a>
                          <button
                            type="button"
                            onClick={(e) => handleBookingChat(e, mitra)}
                            aria-label={`Booking servis dan konsultasi di ${mitra.businessName}`}
                            title={`Booking Servis di ${mitra.businessName}`}
                            className="shadow-xs inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-700 px-3 py-2.5 text-center text-xs font-bold text-white transition-all hover:bg-orange-800 active:scale-95 dark:bg-orange-600 dark:hover:bg-orange-500"
                          >
                            <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                            <span>Booking Servis</span>
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          </main>

          <Footer variant="light" />
        </div>
      )}
    </>
  )
}
