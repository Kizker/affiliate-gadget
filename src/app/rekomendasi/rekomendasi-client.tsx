'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Search, MapPin, Star, Clock, Filter, ChevronDown } from 'lucide-react'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'

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
}

interface RekomendasiClientProps {
  initialMitras: Mitra[]
  initialTotal: number
  initialHasMore: boolean
}

const CITIES = [
  'all',
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
const SERVICE_TYPES = [
  'all',
  'Servis Laptop',
  'Servis PC',
  'Servis iPhone',
  'Servis Android',
  'Upgrade Hardware',
]

// Skeleton Loading Component for Mitra
function MitraSkeleton() {
  return (
    <div className="mb-4 break-inside-avoid">
      <div className="relative animate-pulse overflow-hidden rounded-xl bg-gray-200">
        <div className="aspect-[4/5] w-full" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-gray-300 to-transparent p-4">
          <div className="mb-2 h-5 w-3/4 rounded bg-gray-400/50" />
          <div className="mb-2 h-3 w-full rounded bg-gray-400/40" />
          <div className="mb-2 flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-gray-400/50" />
            <div className="h-3 w-20 rounded bg-gray-400/40" />
          </div>
          <div className="flex gap-1">
            <div className="h-5 w-16 rounded-full bg-gray-400/40" />
            <div className="h-5 w-16 rounded-full bg-gray-400/40" />
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
  const [selectedService, setSelectedService] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [total, setTotal] = useState(initialTotal)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  const loaderRef = useRef<HTMLDivElement>(null)

  // Fetch mitras from API (only when filters change or loading more)
  const fetchMitras = useCallback(
    async (pageNum: number, append: boolean = false) => {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }

      try {
        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: '12',
        })
        if (selectedCity !== 'all') params.append('city', selectedCity)
        if (searchQuery) params.append('search', searchQuery)
        if (selectedService !== 'all') params.append('service', selectedService)

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
    [selectedCity, searchQuery, selectedService]
  )

  // Only fetch when filters change (not on initial load)
  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false)
      return
    }
    setPage(1)
    setMitras([])
    fetchMitras(1, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity, searchQuery, selectedService])

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          setPage((prev) => prev + 1)
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loading, loadingMore])

  // Load more when page changes
  useEffect(() => {
    if (page > 1) {
      fetchMitras(page, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  return (
    <>
      <Navbar variant="light" />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 pt-20">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 px-4 py-12 text-white sm:py-16">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzR2LTRoLTJ2NGgtNHYyaDR2NGgydi00aDR2LTJoLTR6bTAtMzBWMGgtMnY0aC00djJoNHY0aDJWNmg0VjRoLTR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0ySDZ6TTYgNFYwSDR2NEgwdjJoNHY0aDJWNmg0VjRINnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10"></div>

          <div className="relative mx-auto max-w-7xl">
            <h1 className="mb-3 text-center text-3xl font-bold sm:text-4xl md:text-5xl">
              Temukan Mitra Terpercaya
            </h1>
            <p className="mb-6 text-center text-base text-blue-100 sm:mb-8 sm:text-lg md:text-xl">
              Rekomendasi toko servis gadget dan komputer terbaik di Indonesia
            </p>

            {/* Search Bar */}
            <div className="mx-auto max-w-3xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari nama toko atau layanan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border-0 py-3 pl-12 pr-4 text-sm text-gray-900 shadow-2xl focus:outline-none focus:ring-2 focus:ring-white sm:py-4 sm:text-base"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content with Background */}
        <div className="relative">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&q=80"
              alt="Background"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-blue-50/90 to-white/95"></div>
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-4 py-8">
            {/* Filters */}
            <div className="mb-6 flex flex-wrap items-center gap-2 sm:gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:gap-2 sm:px-4 sm:text-base"
              >
                <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Filter</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
                />
              </button>

              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:flex-none sm:px-4 sm:text-base"
              >
                <option value="all">Semua Kota</option>
                {CITIES.filter((c) => c !== 'all').map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>

              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:flex-none sm:px-4 sm:text-base"
              >
                <option value="all">Semua Layanan</option>
                {SERVICE_TYPES.filter((s) => s !== 'all').map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>

              <div className="w-full text-center text-sm text-gray-600 sm:ml-auto sm:w-auto sm:text-left">
                Menampilkan{' '}
                <span className="font-semibold">{mitras.length}</span> dari{' '}
                <span className="font-semibold">{total}</span> mitra
              </div>
            </div>

            {/* Loading State with Skeletons */}
            {loading ? (
              <div className="columns-2 gap-4 space-y-4 sm:columns-3 lg:columns-3 xl:columns-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <MitraSkeleton key={i} />
                ))}
              </div>
            ) : mitras.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  Tidak ada mitra ditemukan
                </h3>
                <p className="text-gray-600">
                  Coba ubah filter atau kata kunci pencarian Anda
                </p>
              </div>
            ) : (
              <>
                {/* Masonry Layout - All Screen Sizes */}
                <div className="columns-2 gap-4 space-y-4 sm:columns-3 lg:columns-3 xl:columns-4">
                  {mitras.map((mitra) => (
                    <div key={mitra.id} className="mb-4 break-inside-avoid">
                      <Link
                        href={`/rekomendasi/${mitra.id}`}
                        className="group relative block overflow-hidden rounded-xl shadow-md transition-all hover:shadow-xl"
                      >
                        <img
                          src={
                            mitra.banner ||
                            'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80'
                          }
                          alt={mitra.businessName}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />

                        {/* Rating Badge */}
                        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 shadow-lg backdrop-blur-sm">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-semibold text-gray-900">
                            {mitra.rating.toFixed(1)}
                          </span>
                        </div>

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                        {/* Content overlay */}
                        <div className="absolute inset-x-0 bottom-0 p-4">
                          <h3 className="mb-1 line-clamp-2 text-base font-bold text-white">
                            {mitra.businessName}
                          </h3>

                          <p className="mb-2 line-clamp-2 text-xs text-gray-200">
                            {mitra.tagline ||
                              mitra.description ||
                              'Mitra terpercaya'}
                          </p>

                          <div className="mb-2 flex items-center gap-1 text-xs text-gray-300">
                            <MapPin className="h-3 w-3" />
                            <span>{mitra.city}</span>
                          </div>

                          <div className="mb-2 flex items-center gap-1 text-xs text-gray-300">
                            <Clock className="h-3 w-3" />
                            <span>{mitra.weekdayHours || 'Lihat jam'}</span>
                          </div>

                          {/* Services Tags */}
                          <div className="flex flex-wrap gap-1">
                            {mitra.services.slice(0, 2).map((service) => (
                              <span
                                key={service.id}
                                className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm"
                              >
                                {service.name}
                              </span>
                            ))}
                            {mitra.services.length > 2 && (
                              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-gray-300">
                                +{mitra.services.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}

                  {/* Loading More Skeletons */}
                  {loadingMore && (
                    <>
                      {Array.from({ length: 4 }).map((_, i) => (
                        <MitraSkeleton key={`loading-${i}`} />
                      ))}
                    </>
                  )}
                </div>

                {/* Infinite Scroll Trigger */}
                <div
                  ref={loaderRef}
                  className="mt-8 flex h-10 items-center justify-center"
                >
                  {loadingMore && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                      <span>Memuat lebih banyak...</span>
                    </div>
                  )}
                  {!hasMore && mitras.length > 0 && (
                    <p className="text-sm text-gray-500">
                      Semua mitra sudah ditampilkan
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer variant="light" />
    </>
  )
}
