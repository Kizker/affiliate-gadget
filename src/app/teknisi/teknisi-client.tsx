'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import { SearchBar } from '@/components/catalog/search-bar'
import { FilterSidebar } from '@/components/catalog/filter-sidebar'
import { ProductCard } from '@/components/catalog/product-card'
import { SlidersHorizontal, X, Shield } from 'lucide-react'
import Image from 'next/image'
import Masonry from 'react-masonry-css'

interface TechnicianData {
  id: string
  bio: string | null
  experience: number
  specialties: string[]
  rating: number
  totalReview: number
  isAvailable: boolean
  user: {
    id: string
    name: string | null
    image: string | null
    phone: string | null
  }
  services: Array<{
    id: string
    name: string
    category: string
    price: number
  }>
}

interface TeknisiClientPageProps {
  initialData: {
    technicians: TechnicianData[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

const filterGroups = [
  {
    title: 'Spesialisasi',
    type: 'checkbox' as const,
    options: [
      { value: 'LCD', label: 'LCD' },
      { value: 'Mesin', label: 'Mesin' },
      { value: 'Software', label: 'Software' },
      { value: 'Motherboard', label: 'Motherboard' },
      { value: 'Baterai', label: 'Baterai' },
    ],
  },
  {
    title: 'Rating',
    type: 'radio' as const,
    options: [
      { value: '4.5', label: '4.5+ ⭐' },
      { value: '4.0', label: '4.0+ ⭐' },
      { value: '3.5', label: '3.5+ ⭐' },
    ],
  },
  {
    title: 'Ketersediaan',
    type: 'radio' as const,
    options: [
      { value: 'available', label: 'Online Sekarang' },
      { value: 'all', label: 'Semua' },
    ],
  },
]

// Skeleton Loading Component for Technician
function TechnicianSkeleton({
  imageAspect = 'aspect-[3/4]',
}: {
  imageAspect?: string
}) {
  return (
    <div className="mb-4 break-inside-avoid">
      <div className="relative animate-pulse overflow-hidden rounded-xl bg-gray-200">
        <div className={`${imageAspect} w-full`} />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-gray-300 to-transparent p-4">
          <div className="mb-2 h-4 w-2/3 rounded bg-gray-400/50" />
          <div className="mb-2 h-3 w-1/2 rounded bg-gray-400/40" />
          <div className="mb-2 flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-gray-400/50" />
            <div className="h-3 w-12 rounded bg-gray-400/40" />
          </div>
          <div className="h-4 w-3/4 rounded bg-gray-400/50" />
        </div>
      </div>
    </div>
  )
}

export default function TeknisiClientPage({
  initialData,
}: TeknisiClientPageProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  // Start with initial data from server - NO LOADING STATE on first render!
  const [technicians, setTechnicians] = useState<TechnicianData[]>(
    initialData.technicians
  )
  const [loading, setLoading] = useState(false) // Start false since we have initial data
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState('')
  const [sortBy, setSortBy] = useState('rating')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(
    initialData.pagination.page < initialData.pagination.totalPages
  )
  const [total, setTotal] = useState(initialData.pagination.total)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  const loaderRef = useRef<HTMLDivElement>(null)

  const fetchTechnicians = useCallback(
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
          sortBy,
        })

        if (searchQuery) params.append('search', searchQuery)
        if (selectedSpecialty) params.append('specialty', selectedSpecialty)

        const res = await fetch(`/api/technicians?${params}`)
        if (!res.ok) throw new Error('Failed to fetch')

        const data = await res.json()
        const newTechnicians = data.technicians || []
        const totalPages = data.pagination?.totalPages || 1

        if (append) {
          setTechnicians((prev) => {
            const existingIds = new Set(prev.map((t) => t.id))
            const uniqueNew = newTechnicians.filter(
              (t: TechnicianData) => !existingIds.has(t.id)
            )
            return [...prev, ...uniqueNew]
          })
        } else {
          setTechnicians(newTechnicians)
        }

        setTotal(data.pagination?.total || newTechnicians.length)
        setHasMore(pageNum < totalPages)
      } catch (error) {
        console.error('Error fetching technicians:', error)
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [searchQuery, selectedSpecialty, sortBy]
  )

  // Only fetch on filter/search changes, not on initial load
  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false)
      return
    }
    setPage(1)
    setTechnicians([])
    fetchTechnicians(1, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedSpecialty, sortBy])

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
      fetchTechnicians(page, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleSort = (value: string) => {
    setSortBy(value)
  }

  const handleFilterChange = (filters: Record<string, string[]>) => {
    const specialty = Object.values(filters)
      .flat()
      .find((f: string) => filterGroups[0].options.some((o) => o.value === f))
    if (specialty) {
      setSelectedSpecialty(specialty)
    } else {
      setSelectedSpecialty('')
    }
  }

  const handleClearFilters = () => {
    setSelectedSpecialty('')
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Image with Gradient Overlay */}
      <div className="fixed inset-0 -z-10">
        <Image
          src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&q=80"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-blue-50/90 to-white/95"></div>
      </div>

      <Navbar variant="light" />

      <main className="mx-auto max-w-7xl px-4 pb-8 pt-24 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="mb-3 text-4xl font-bold text-gray-900">
            Katalog Teknisi
          </h1>
          <p className="text-lg text-gray-600">
            Temukan teknisi terbaik untuk servis gadget Anda
          </p>
        </div>

        {/* Search Bar */}
        <SearchBar
          placeholder="Cari teknisi berdasarkan nama atau spesialisasi..."
          sortOptions={[
            { value: 'rating', label: 'Rating Tertinggi' },
            { value: 'experience', label: 'Pengalaman' },
            { value: 'reviews', label: 'Paling Banyak Review' },
          ]}
          onSearch={handleSearch}
          onSortChange={handleSort}
        />

        {/* Mobile Filter Toggle */}
        <div className="mb-4 lg:hidden">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 transition-colors hover:bg-gray-50"
            aria-label="Toggle filters"
            aria-expanded={isFilterOpen}
          >
            <SlidersHorizontal className="h-5 w-5" />
            <span className="font-medium">Filter</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Sidebar Filter - Desktop */}
          <aside className="hidden lg:col-span-1 lg:block">
            <FilterSidebar
              filters={filterGroups}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />
          </aside>

          {/* Mobile Filter Overlay */}
          {isFilterOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => setIsFilterOpen(false)}
                role="button"
                aria-label="Close filters"
              ></div>
              <div
                className="absolute inset-y-0 left-0 w-80 max-w-[85vw] overflow-y-auto bg-white shadow-xl"
                role="dialog"
                aria-modal="true"
                aria-label="Filter options"
              >
                <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
                  <h3 className="text-lg font-bold text-gray-900">Filter</h3>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="rounded-lg p-2 transition-colors hover:bg-gray-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-6">
                  <FilterSidebar
                    filters={filterGroups}
                    onFilterChange={(filters) => {
                      handleFilterChange(filters)
                      setIsFilterOpen(false)
                    }}
                    onClearFilters={handleClearFilters}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Technicians Grid */}
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Menampilkan{' '}
                <span className="font-semibold">{technicians.length}</span> dari{' '}
                <span className="font-semibold">{total}</span> teknisi
              </p>
            </div>

            {/* Initial Loading State with Skeletons */}
            {loading ? (
              <Masonry
                breakpointCols={{ default: 4, 1280: 4, 1024: 3, 640: 2, 0: 2 }}
                className="-ml-4 flex w-auto"
                columnClassName="pl-4 bg-clip-padding"
              >
                {Array.from({ length: 12 }).map((_, i) => {
                  const aspects = [
                    'aspect-[3/4]',
                    'aspect-[4/5]',
                    'aspect-[3/5]',
                  ]
                  const aspectClass = aspects[i % aspects.length]
                  return (
                    <TechnicianSkeleton key={i} imageAspect={aspectClass} />
                  )
                })}
              </Masonry>
            ) : technicians.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Shield className="h-16 w-16 text-gray-300" />
                <h3 className="mt-4 text-xl font-semibold text-gray-900">
                  Tidak ada teknisi ditemukan
                </h3>
                <p className="mt-2 text-gray-500">
                  Coba ubah filter atau kata kunci pencarian
                </p>
              </div>
            ) : (
              <>
                {/* Masonry Layout - All Screen Sizes */}
                <Masonry
                  breakpointCols={{
                    default: 4,
                    1280: 4,
                    1024: 3,
                    640: 2,
                    0: 2,
                  }}
                  className="-ml-4 flex w-auto"
                  columnClassName="pl-4 bg-clip-padding"
                >
                  {technicians.map((tech, index) => {
                    const prices = tech.services.map((s) => s.price)
                    const minPrice = prices.length > 0 ? Math.min(...prices) : 0
                    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0

                    // Create masonry effect with deterministic varied aspect ratios
                    const aspects = [
                      'aspect-[3/4]',
                      'aspect-[4/5]',
                      'aspect-[3/5]',
                    ]
                    const aspectClass = aspects[index % aspects.length]

                    return (
                      <div key={tech.id} className="mb-4">
                        <ProductCard
                          id={tech.id}
                          title={tech.user.name || 'Teknisi'}
                          image={
                            tech.user.image ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(tech.user.name || 'T')}&background=3b82f6&color=fff&size=400`
                          }
                          description={tech.specialties.join(', ')}
                          rating={tech.rating}
                          reviewCount={tech.totalReview}
                          priceRange={
                            prices.length > 0
                              ? { min: minPrice, max: maxPrice }
                              : undefined
                          }
                          badge={tech.isAvailable ? 'Online' : 'Offline'}
                          badgeColor={tech.isAvailable ? 'green' : 'red'}
                          href={`/teknisi/${tech.id}`}
                          imageAspect={aspectClass}
                          priority={index < 4} // Prioritize first 4 images for LCP
                        />
                      </div>
                    )
                  })}

                  {/* Loading More Skeletons */}
                  {loadingMore &&
                    Array.from({ length: 4 }).map((_, i) => (
                      <TechnicianSkeleton key={`loading-${i}`} />
                    ))}
                </Masonry>

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
                  {!hasMore && technicians.length > 0 && (
                    <p className="text-sm text-gray-500">
                      Semua teknisi sudah ditampilkan
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer variant="light" />
    </div>
  )
}
