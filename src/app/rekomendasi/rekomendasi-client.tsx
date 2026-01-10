'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  Search,
  MapPin,
  Star,
  X,
  Navigation,
  ChevronDown,
  ArrowUpRight,
} from 'lucide-react'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import { motion } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'

interface Mitra {
  id: string
  businessName: string
  tagline: string | null
  description: string | null
  city: string
  address: string
  phone: string
  rating: number
  totalReview: number
  reviewCount: number
  services: Array<{
    id: string
    name: string
    icon: string | null
    price: string | null
  }>
  banner: string | null
  weekdayHours: string | null
  weekendHours: string | null
  latitude?: number | null
  longitude?: number | null
  distance?: number | null
}

interface RekomendasiClientProps {
  initialMitras: Mitra[]
  initialTotal: number
  initialHasMore: boolean
}

const CITIES = [
  'Jakarta Selatan',
  'Jakarta Pusat',
  'Jakarta Barat',
  'Jakarta Utara',
  'Jakarta Timur',
  'Bandung',
  'Surabaya',
  'Yogyakarta',
  'Semarang',
  'Medan',
  'Makassar',
  'Tangerang',
  'Bekasi',
  'Depok',
]

// Format distance for display
function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`
  }
  return `${distance.toFixed(1)}km`
}

// Skeleton Loading Component for Mitra
function MitraSkeleton() {
  return (
    <div className="mb-4 break-inside-avoid">
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="aspect-[4/3] w-full animate-pulse bg-gray-200" />
        <div className="space-y-3 p-4">
          <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
          <div className="flex gap-2 pt-2">
            <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200" />
            <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RekomendasiClientPage({
  initialMitras,
  initialTotal,
  initialHasMore,
}: RekomendasiClientProps) {
  const [mitras, setMitras] = useState<Mitra[]>(initialMitras)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState('all')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [total, setTotal] = useState(initialTotal)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Auth session for login check
  const { data: session } = useSession()
  const { toast } = useToast()

  // Location & sort states
  const [sortBy, setSortBy] = useState<'rating' | 'distance' | 'review'>(
    'rating'
  )
  const [userLocation, setUserLocation] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [gettingLocation, setGettingLocation] = useState(false)

  const loaderRef = useRef<HTMLDivElement>(null)

  // Get user's current location
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) return

    setGettingLocation(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setSortBy('distance')
        setGettingLocation(false)
      },
      () => {
        setGettingLocation(false)
        setSortBy('rating')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }, [])

  // Handle sort change - get location if needed, check login for distance
  const handleSortChange = (value: string) => {
    const newSort = value as 'rating' | 'distance' | 'review'

    // Check login for distance filter
    if (newSort === 'distance' && !session) {
      toast({
        title: 'Login Diperlukan',
        description:
          'Silakan login terlebih dahulu untuk menggunakan fitur Jarak Terdekat',
        variant: 'destructive',
      })
      return
    }

    setSortBy(newSort)
    if (newSort === 'distance' && !userLocation) {
      getUserLocation()
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCity('all')
    setSortBy('rating')
  }

  const hasActiveFilters =
    searchQuery !== '' || selectedCity !== 'all' || sortBy !== 'rating'

  // Fetch mitras logic
  const fetchMitras = useCallback(
    async (pageNum: number, append: boolean = false) => {
      if (append) setLoadingMore(true)
      else setLoading(true)

      try {
        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: '12',
          sortBy,
        })
        if (selectedCity !== 'all') params.append('city', selectedCity)
        if (searchQuery) params.append('search', searchQuery)
        if (userLocation) {
          params.append('lat', userLocation.lat.toString())
          params.append('lng', userLocation.lng.toString())
        }

        const response = await fetch(`/api/mitra/list?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          const newMitras = data.mitras || []
          const totalPages = data.pagination?.totalPages || 1

          if (append) {
            setMitras((prev) => {
              const existingIds = new Set(prev.map((m) => m.id))
              const uniqueNew = newMitras.filter(
                (m: Mitra) => !existingIds.has(m.id)
              )
              return [...prev, ...uniqueNew]
            })
          } else {
            setMitras(newMitras)
          }

          setTotal(data.pagination?.total || newMitras.length)
          setHasMore(pageNum < totalPages)
        }
      } catch (error) {
        console.error('Error fetching mitras:', error)
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [selectedCity, searchQuery, sortBy, userLocation]
  )

  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false)
      return
    }
    setPage(1)
    setMitras([])
    fetchMitras(1, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity, searchQuery, sortBy, userLocation])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          setPage((prev) => prev + 1)
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    )

    if (loaderRef.current) observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [hasMore, loading, loadingMore])

  useEffect(() => {
    if (page > 1) fetchMitras(page, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  return (
    <>
      <Navbar variant="light" />
      <div className="min-h-screen bg-gray-50 pt-[72px]">
        {/* Modern Hero & Search */}
        <div className="relative bg-white pb-6 pt-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] sm:pb-8 sm:pt-8">
          <div className="container mx-auto max-w-7xl px-4">
            <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-center sm:text-3xl md:text-4xl">
              Cari Service Terdekat
            </h1>
            <p className="mb-6 text-sm text-gray-500 sm:text-center sm:text-lg">
              Temukan {total} mitra teknisi terpercaya di sekitarmu
            </p>

            {/* Search Input */}
            <div className="mx-auto max-w-2xl">
              <div className="group relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-blue-500" />
                <input
                  type="text"
                  placeholder="Cari toko, servis laptop, hp..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-12 pr-4 text-sm font-medium text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 sm:text-base"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto max-w-7xl px-4 py-6">
          {/* Mobile Optimized Filters */}
          <div className="-mx-4 mb-6 overflow-x-auto px-4 pb-2 pt-2 sm:mx-0 sm:overflow-visible sm:p-0">
            <div className="flex min-w-max items-center gap-2 sm:flex-wrap">
              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-9 text-sm font-medium text-gray-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                >
                  <option value="rating">⭐ Rating Tertinggi</option>
                  <option value="review">💬 Review Terbanyak</option>
                  <option value="distance">📍 Jarak Terdekat</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              </div>

              {/* City Dropdown */}
              <div className="relative">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-9 text-sm font-medium text-gray-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                >
                  <option value="all">🏙️ Semua Kota</option>
                  {CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              </div>

              {/* Reset Button */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
                >
                  <X className="h-3.5 w-3.5" />
                  Reset
                </button>
              )}
            </div>

            {/* Location Status */}
            {gettingLocation && (
              <div className="mt-2 flex items-center gap-1.5 px-1 text-xs font-medium text-blue-600 fade-in">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-600" />
                Mencari lokasi Anda...
              </div>
            )}
          </div>

          {/* Grid Layout - Optimized Masonry */}
          {loading ? (
            <div className="columns-2 gap-3 space-y-3 sm:columns-3 sm:gap-4 sm:space-y-4 lg:columns-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <MitraSkeleton key={i} />
              ))}
            </div>
          ) : mitras.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100/50">
                <Search className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">
                Tidak ada mitra ditemukan
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Coba sesuaikan filter pencarianmu
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-6 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/20 transition-all hover:translate-y-[-2px] hover:bg-blue-700"
                >
                  Reset Filter
                </button>
              )}
            </div>
          ) : (
            <div className="columns-2 gap-3 space-y-3 sm:columns-3 sm:gap-4 sm:space-y-4 lg:columns-4">
              {mitras.map((mitra, index) => (
                <motion.div
                  key={mitra.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="break-inside-avoid"
                >
                  <Link
                    href={`/rekomendasi/${mitra.id}`}
                    className="group relative block overflow-hidden rounded-2xl bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] ring-1 ring-gray-100 transition-all duration-300 hover:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.12)] hover:ring-blue-100"
                  >
                    {/* Image Section */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                      <img
                        src={
                          mitra.banner ||
                          'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80'
                        }
                        alt={mitra.businessName}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      {/* Badges Overlay */}
                      <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
                        {mitra.distance !== null &&
                          mitra.distance !== undefined && (
                            <div className="flex items-center gap-0.5 rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold text-gray-900 shadow-sm backdrop-blur-sm sm:text-xs">
                              <Navigation className="h-2.5 w-2.5 text-blue-600 sm:h-3 sm:w-3" />
                              {formatDistance(mitra.distance)}
                            </div>
                          )}
                        <div className="flex items-center gap-0.5 rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold text-gray-900 shadow-sm backdrop-blur-sm sm:text-xs">
                          <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400 sm:h-3 sm:w-3" />
                          {mitra.rating.toFixed(1)}
                        </div>
                      </div>
                    </div>

                    {/* Content Section (Below Image) for clarity */}
                    <div className="flex flex-col p-3 sm:p-4">
                      <h3 className="line-clamp-2 text-sm font-bold text-gray-900 sm:text-base">
                        {mitra.businessName}
                      </h3>

                      <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                        {mitra.tagline ||
                          mitra.description ||
                          'Mitra teknisi terpercaya siap membantu perbaikan gadget Anda.'}
                      </p>

                      <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-gray-500">
                        <MapPin className="h-3 w-3 flex-shrink-0 text-gray-400" />
                        <span className="truncate">{mitra.city}</span>
                      </div>

                      {/* Services Chips */}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {mitra.services.slice(0, 2).map((service) => (
                          <span
                            key={service.id}
                            className="inline-block whitespace-nowrap rounded-md bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 ring-1 ring-inset ring-gray-100 sm:px-2 sm:py-1 sm:text-xs"
                          >
                            {service.name}
                          </span>
                        ))}
                        {mitra.services.length > 2 && (
                          <span className="inline-block whitespace-nowrap rounded-md bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 ring-1 ring-inset ring-gray-100 sm:px-2 sm:py-1 sm:text-xs">
                            +{mitra.services.length - 2}
                          </span>
                        )}
                      </div>

                      {/* View Button hint */}
                      <div className="mt-3 flex items-center text-[10px] font-semibold text-blue-600 opacity-0 transition-opacity group-hover:opacity-100 sm:text-xs">
                        Lihat Detail <ArrowUpRight className="ml-0.5 h-3 w-3" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {/* Loading More Loader */}
          <div ref={loaderRef} className="mt-8 flex justify-center py-4">
            {loadingMore && (
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            )}
          </div>
        </div>
      </div>
      <Footer variant="light" />
    </>
  )
}
