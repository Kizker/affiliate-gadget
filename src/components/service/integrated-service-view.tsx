'use client'

import { useState, useMemo, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
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
  Loader2,
  AlertCircle,
} from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────
interface MitraService {
  id: string
  name: string
  icon?: string | null
  price?: string | null
}

interface MitraData {
  id: string
  businessName: string
  tagline: string | null
  description: string | null
  banner: string | null
  city: string
  province: string
  address: string
  phone: string
  whatsapp: string | null
  rating: number
  totalReview: number
  reviewCount: number
  features: string[]
  services: MitraService[]
  weekdayHours: string | null
  weekendHours: string | null
  latitude: number | null
  longitude: number | null
  googleMapsUrl: string
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

// ─── Main Component ─────────────────────────────────────────────────────────
export function IntegratedServiceView() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [mitras, setMitras] = useState<MitraData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCity, setSelectedCity] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const getChatUrl = (mitra: MitraData) => {
    const greeting = `Halo, saya ingin konsultasi dan booking servis di ${mitra.businessName}`
    return `/dashboard/customer/chat?mitraId=${mitra.id}&mitraName=${encodeURIComponent(mitra.businessName)}&mitraCity=${encodeURIComponent(mitra.city)}&mitraImage=${encodeURIComponent(mitra.banner || '')}&serviceContext=${encodeURIComponent(greeting)}`
  }

  const handleBookingChat = (e: React.MouseEvent, mitra: MitraData) => {
    e.preventDefault()
    const url = getChatUrl(mitra)
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=${encodeURIComponent(url)}`)
      return
    }
    router.push(url)
  }

  // Fetch mitra data from API
  useEffect(() => {
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
  }, [])

  // Build dynamic city filter from fetched data
  const cityFilters = useMemo(() => {
    const cities = Array.from(new Set(mitras.map((m) => m.city))).sort()
    return [
      { key: 'all', label: 'Semua Daerah' },
      ...cities.map((c) => ({ key: c, label: c })),
    ]
  }, [mitras])

  // Filter mitras based on city and search query
  const filteredMitras = useMemo(() => {
    return mitras.filter((mitra) => {
      // City filter
      if (selectedCity !== 'all' && mitra.city !== selectedCity) return false

      // Search filter
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      return (
        mitra.businessName.toLowerCase().includes(q) ||
        mitra.city.toLowerCase().includes(q) ||
        mitra.address.toLowerCase().includes(q) ||
        (mitra.tagline?.toLowerCase().includes(q) ?? false) ||
        (mitra.description?.toLowerCase().includes(q) ?? false) ||
        mitra.services.some((s) => s.name.toLowerCase().includes(q)) ||
        mitra.features.some((f) => f.toLowerCase().includes(q))
      )
    })
  }, [mitras, selectedCity, searchQuery])

  return (
    <div className="relative min-h-screen bg-slate-50 pb-16 text-slate-900 selection:bg-orange-500 selection:text-white dark:bg-slate-950 dark:text-slate-100 md:pb-24">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-[400px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-100/40 via-amber-50/15 to-transparent dark:from-orange-950/20 dark:via-slate-950 dark:to-transparent" />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative pb-2 pt-20 md:pb-3 md:pt-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="shadow-2xs inline-flex items-center gap-1.5 rounded-full border border-orange-200/90 bg-white/90 px-3.5 py-1 backdrop-blur-md dark:border-orange-900/60 dark:bg-slate-900/90">
            <ShieldCheck className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9D4300] dark:text-orange-400 sm:text-[11px]">
              LAYANAN SERVIS RESMI &amp; TERSTANDARISASI LAB
            </span>
          </div>
          <h1 className="mt-2 text-sm font-bold leading-snug tracking-tight text-slate-950 dark:text-white sm:text-base md:text-lg lg:text-xl">
            Pusat Layanan Servis Gadget Profesional &amp; Terpercaya di
            Indonesia
          </h1>
        </div>
      </section>

      {/* ── SEARCH & FILTER ───────────────────────────────────────────────── */}
      <section className="relative mx-auto mt-3 max-w-7xl px-4 sm:px-6 md:mt-5 lg:px-8">
        <div className="shadow-2xs mb-6 flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:p-3 md:rounded-3xl">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama mitra, layanan, atau kota..."
              className="w-full rounded-xl border border-slate-200/70 bg-slate-50/80 py-2.5 pl-10 pr-9 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:text-sm md:rounded-2xl"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* City filter — dynamic from DB */}
          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto border-t border-slate-100 pt-2 dark:border-slate-800 sm:border-t-0 sm:pt-0">
            {cityFilters.map((f) => {
              const isActive = selectedCity === f.key
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setSelectedCity(f.key)}
                  className={`shrink-0 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 sm:px-4 md:rounded-2xl ${
                    isActive
                      ? 'shadow-xs border border-orange-500 bg-orange-50/80 font-bold text-orange-600 dark:border-orange-500 dark:bg-orange-950/40 dark:text-orange-400'
                      : 'border border-transparent text-slate-600 hover:bg-slate-100/80 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
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
          <div>
            <div className="hidden gap-6 md:grid md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
            <div className="block space-y-4 md:hidden">
              {Array.from({ length: 2 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
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
          <div className="my-12 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900/60">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/40">
              {mitras.length === 0 ? (
                <Loader2 className="h-7 w-7 animate-spin" />
              ) : (
                <Search className="h-7 w-7" />
              )}
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
              {mitras.length === 0
                ? 'Belum ada mitra terdaftar'
                : `Tidak ditemukan mitra untuk "${searchQuery || selectedCity}"`}
            </h3>
            <p className="mx-auto mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
              {mitras.length === 0
                ? 'Segera daftarkan bisnis layanan Anda sebagai mitra AffiliateGadget.'
                : 'Silakan reset filter atau periksa ejaan pencarian.'}
            </p>
            {mitras.length > 0 && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCity('all')
                }}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
              >
                Reset Filter
              </button>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* DESKTOP GRID (≥ md, 3 columns)                                   */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {!loading && !error && filteredMitras.length > 0 && (
          <div className="hidden gap-6 md:grid md:grid-cols-2 lg:grid-cols-3">
            {filteredMitras.map((mitra) => {
              const chatUrl = getChatUrl(mitra)
              const hours = formatHours(mitra.weekdayHours, mitra.weekendHours)
              const facilities =
                mitra.features.length > 0
                  ? mitra.features
                  : mitra.services.slice(0, 3).map((s) => s.name)
              const specialties = mitra.services.slice(0, 4).map((s) => s.name)

              return (
                <article
                  key={mitra.id}
                  className="shadow-xs group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  {/* Image area */}
                  <div>
                    <Link
                      href={`/rekomendasi/${mitra.id}`}
                      className="relative block h-48 w-full cursor-pointer overflow-hidden bg-slate-100 dark:bg-slate-800"
                    >
                      {mitra.banner ? (
                        <Image
                          src={mitra.banner}
                          alt={mitra.businessName}
                          fill
                          sizes="(max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
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
                        <Link href={`/rekomendasi/${mitra.id}`}>
                          <h3 className="text-lg font-bold leading-snug text-slate-950 transition-colors hover:text-orange-600 dark:text-white">
                            {mitra.businessName}
                          </h3>
                        </Link>
                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                          {mitra.tagline ||
                            mitra.description ||
                            'Mitra servis gadget terpercaya.'}
                        </p>
                      </div>

                      {/* Details */}
                      <div className="space-y-2 border-t border-slate-100 pt-1 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">
                        <div className="flex items-start gap-2.5">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                          <span className="line-clamp-2 leading-relaxed">
                            {mitra.address}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                          <span className="font-medium text-slate-700 dark:text-slate-200">
                            {mitra.phone}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                          <span>{hours}</span>
                        </div>
                        {mitra.services.length > 0 && (
                          <div className="flex items-center gap-2.5">
                            <Wrench className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                              {mitra.services.length} Jenis Layanan Tersedia
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Facilities */}
                      {facilities.length > 0 && (
                        <div className="border-t border-slate-100 pt-2 dark:border-slate-800">
                          <span className="text-[11px] font-bold text-slate-950 dark:text-white">
                            Fasilitas &amp; Layanan:
                          </span>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {facilities.slice(0, 4).map((fac, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 rounded-md border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                              >
                                <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                {fac}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Specialties */}
                      {specialties.length > 0 && (
                        <div className="border-t border-slate-100 pt-2 dark:border-slate-800">
                          <span className="text-[11px] font-bold text-slate-950 dark:text-white">
                            Spesialisasi:
                          </span>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {specialties.map((sp, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center rounded-md border border-orange-200/60 bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300"
                              >
                                {sp}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Rating */}
                      {(mitra.rating > 0 || mitra.reviewCount > 0) && (
                        <div className="flex items-center gap-1.5 pt-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            {mitra.rating > 0 ? mitra.rating.toFixed(1) : '-'}
                          </span>
                          <span className="text-xs text-slate-400">
                            ({formatReviewCount(mitra.reviewCount)})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-2.5 p-5 pt-0">
                    <a
                      href={mitra.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-800 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      <Navigation className="h-3.5 w-3.5 text-slate-500" />
                      <span>Google Maps</span>
                    </a>
                    <button
                      type="button"
                      onClick={(e) => handleBookingChat(e, mitra)}
                      title={`Booking Servis di ${mitra.businessName}`}
                      className="shadow-xs inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-500 px-3 py-2.5 text-center text-xs font-bold text-white transition-all hover:bg-orange-600 active:scale-95 dark:bg-orange-600 dark:hover:bg-orange-500"
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

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* MOBILE CARDS (< md, stacked)                                     */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {!loading && !error && filteredMitras.length > 0 && (
          <div className="block space-y-4 md:hidden">
            {filteredMitras.map((mitra) => {
              const chatUrl = getChatUrl(mitra)
              const hours =
                mitra.weekdayHours || mitra.weekendHours || 'Lihat jadwal'
              const facilities =
                mitra.features.length > 0
                  ? mitra.features
                  : mitra.services.slice(0, 3).map((s) => s.name)

              return (
                <article
                  key={mitra.id}
                  className="shadow-xs overflow-hidden rounded-2xl border border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900"
                >
                  {/* Mobile image banner */}
                  <Link
                    href={`/rekomendasi/${mitra.id}`}
                    className="relative block h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800"
                  >
                    {mitra.banner ? (
                      <Image
                        src={mitra.banner}
                        alt={mitra.businessName}
                        fill
                        sizes="100vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Wrench className="h-14 w-14 text-slate-300 dark:text-slate-600" />
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

                    {/* Bottom rating */}
                    {mitra.rating > 0 && (
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 drop-shadow-md">
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
                      <Link href={`/rekomendasi/${mitra.id}`}>
                        <h3 className="text-base font-bold leading-snug text-slate-950 transition-colors hover:text-orange-600 dark:text-white">
                          {mitra.businessName}
                        </h3>
                      </Link>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        {mitra.tagline ||
                          mitra.description ||
                          'Mitra servis gadget terpercaya.'}
                      </p>
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5 border-t border-slate-100 pt-2 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="leading-snug">{mitra.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                          {mitra.phone}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span>{hours}</span>
                      </div>
                    </div>

                    {/* Facilities */}
                    {facilities.length > 0 && (
                      <div className="border-t border-slate-100 pt-2 dark:border-slate-800">
                        <div className="flex flex-wrap gap-1.5">
                          {facilities.slice(0, 4).map((fac, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200/60 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                            >
                              <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                              {fac}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-2.5 pt-2">
                      <a
                        href={mitra.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <Navigation className="h-3.5 w-3.5 text-slate-500" />
                        <span>Google Maps</span>
                      </a>
                      <button
                        type="button"
                        onClick={(e) => handleBookingChat(e, mitra)}
                        title={`Booking Servis di ${mitra.businessName}`}
                        className="shadow-xs inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-3 py-2 text-center text-xs font-bold text-white transition-all hover:bg-orange-600 active:scale-95 dark:bg-orange-600"
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
      </section>
    </div>
  )
}
