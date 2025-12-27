'use client'

import { useState, useEffect, useCallback } from 'react'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import { SearchBar } from '@/components/catalog/search-bar'
import { FilterSidebar } from '@/components/catalog/filter-sidebar'
import { ProductCard } from '@/components/catalog/product-card'
import { SlidersHorizontal, X, Loader2 } from 'lucide-react'

interface RentalItem {
  id: string
  name: string
  description: string | null
  pricePerDay: number
  stock: number
  images: string[]
  isActive: boolean
}

export default function SewaAlatPage() {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [rentalItems, setRentalItems] = useState<RentalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [availability, setAvailability] = useState('all')
  const [priceRange, setPriceRange] = useState('')
  const [sortBy, setSortBy] = useState('popular')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState({ total: 0, available: 0, unavailable: 0 })

  // Fetch rental items from API
  const fetchRentalItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
      })

      if (searchQuery) params.set('search', searchQuery)
      if (availability !== 'all') params.set('availability', availability)

      // Add sorting
      if (sortBy) {
        switch (sortBy) {
          case 'price-low':
            params.set('sortBy', 'pricePerDay')
            params.set('sortOrder', 'asc')
            break
          case 'price-high':
            params.set('sortBy', 'pricePerDay')
            params.set('sortOrder', 'desc')
            break
          case 'rating':
            params.set('sortBy', 'rating')
            params.set('sortOrder', 'desc')
            break
          default:
            // popular - default sorting
            break
        }
      }

      // Add price range filter
      if (priceRange) {
        switch (priceRange) {
          case 'under-50k':
            params.set('maxPrice', '50000')
            break
          case '50k-100k':
            params.set('minPrice', '50000')
            params.set('maxPrice', '100000')
            break
          case '100k-200k':
            params.set('minPrice', '100000')
            params.set('maxPrice', '200000')
            break
          case 'above-200k':
            params.set('minPrice', '200000')
            break
        }
      }

      const res = await fetch(`/api/rental-items?${params}`)
      if (!res.ok) throw new Error('Failed to fetch rental items')

      const data = await res.json()
      setRentalItems(data.rentalItems || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotal(data.pagination?.total || 0)
      setStats(data.stats || { total: 0, available: 0, unavailable: 0 })
    } catch (error) {
      console.error('Error fetching rental items:', error)
    } finally {
      setLoading(false)
    }
  }, [page, searchQuery, availability, priceRange, sortBy])

  useEffect(() => {
    fetchRentalItems()
  }, [fetchRentalItems])

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setPage(1)
  }

  const handleSort = (value: string) => {
    setSortBy(value)
    setPage(1)
  }

  const handleFilterChange = (filters: Record<string, string[]>) => {
    const ketersediaan = filters['Ketersediaan']?.[0] || 'all'
    const harga = filters['Harga']?.[0] || ''

    setAvailability(ketersediaan)
    setPriceRange(harga)
    setPage(1)
  }

  const handleClearFilters = () => {
    setAvailability('all')
    setPriceRange('')
    setPage(1)
  }

  const filterGroups = [
    {
      title: 'Ketersediaan',
      type: 'radio' as const,
      options: [
        { value: 'all', label: 'Semua', count: stats.total },
        {
          value: 'available',
          label: 'Tersedia Sekarang',
          count: stats.available,
        },
      ],
    },
    {
      title: 'Harga',
      type: 'radio' as const,
      options: [
        { value: 'under-50k', label: 'Di bawah 50rb/hari' },
        { value: '50k-100k', label: '50rb - 100rb/hari' },
        { value: '100k-200k', label: '100rb - 200rb/hari' },
        { value: 'above-200k', label: 'Di atas 200rb/hari' },
      ],
    },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Image with Gradient Overlay */}
      <div className="fixed inset-0 -z-10">
        <img
          src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&q=80"
          alt="Background"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-blue-50/90 to-white/95"></div>
      </div>

      <Navbar variant="light" />

      <main className="mx-auto max-w-7xl px-4 pb-8 pt-24 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="mb-3 text-4xl font-bold text-gray-900">
            Sewa Alat & Gadget
          </h1>
          <p className="text-lg text-gray-600">
            Sewa perangkat berkualitas untuk kebutuhan Anda
          </p>
        </div>

        {/* Stats Cards - Hidden on mobile */}
        <div className="mb-8 hidden grid-cols-1 gap-4 sm:grid sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Total Alat</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">
              {stats.total}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Tersedia</p>
            <p className="mt-1 text-3xl font-bold text-green-600">
              {stats.available}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Tidak Tersedia</p>
            <p className="mt-1 text-3xl font-bold text-red-600">
              {stats.unavailable}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <SearchBar
          placeholder="Cari alat sewa..."
          onSearch={handleSearch}
          onSortChange={handleSort}
          sortOptions={[
            { value: 'popular', label: 'Paling Populer' },
            { value: 'price-low', label: 'Harga Terendah' },
            { value: 'price-high', label: 'Harga Tertinggi' },
            { value: 'rating', label: 'Rating Tertinggi' },
          ]}
        />

        {/* Mobile Filter Button */}
        <div className="mb-4 lg:hidden">
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 transition-colors hover:bg-gray-50"
          >
            <SlidersHorizontal className="h-5 w-5" />
            <span className="font-medium">Filter</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:col-span-1 lg:block">
            <FilterSidebar
              filters={filterGroups}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />
          </aside>

          {/* Mobile Filter Drawer */}
          {isFilterOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => setIsFilterOpen(false)}
              ></div>

              {/* Drawer */}
              <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] overflow-y-auto bg-white shadow-xl">
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
                    onFilterChange={handleFilterChange}
                    onClearFilters={handleClearFilters}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Rental Items Grid */}
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Menampilkan <span className="font-semibold">{total}</span> alat
              </p>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : rentalItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-gray-500">Tidak ada alat sewa ditemukan</p>
              </div>
            ) : (
              <>
                {/* Mobile: Masonry 2 columns */}
                <div className="columns-2 gap-6 space-y-6 md:hidden">
                  {rentalItems.map((item) => (
                    <div key={item.id} className="mb-6 break-inside-avoid">
                      <ProductCard
                        id={item.id}
                        title={item.name}
                        image={item.images[0] || '/placeholder.png'}
                        description={
                          item.description || 'Alat sewa berkualitas'
                        }
                        price={item.pricePerDay}
                        priceLabel="/ hari"
                        badge={item.stock > 0 ? 'Tersedia' : 'Tidak Tersedia'}
                        badgeColor={item.stock > 0 ? 'green' : 'red'}
                        href={`/sewa-alat/${item.id}`}
                        actionLabel="Sewa Sekarang"
                      />
                    </div>
                  ))}
                </div>

                {/* Desktop: Regular grid 3 columns */}
                <div className="hidden gap-6 md:grid md:grid-cols-2 xl:grid-cols-3">
                  {rentalItems.map((item) => (
                    <ProductCard
                      key={item.id}
                      id={item.id}
                      title={item.name}
                      image={item.images[0] || '/placeholder.png'}
                      description={item.description || 'Alat sewa berkualitas'}
                      price={item.pricePerDay}
                      priceLabel="/ hari"
                      badge={item.stock > 0 ? 'Tersedia' : 'Tidak Tersedia'}
                      badgeColor={item.stock > 0 ? 'green' : 'red'}
                      href={`/sewa-alat/${item.id}`}
                      actionLabel="Sewa Sekarang"
                    />
                  ))}
                </div>
              </>
            )}

            {/* Pagination */}
            {totalPages > 1 && !loading && (
              <div className="mt-8 flex justify-center">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1
                    return (
                      <button
                        type="button"
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`rounded-lg px-4 py-2 ${
                          page === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 transition-colors hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer variant="light" />
    </div>
  )
}
