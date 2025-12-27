'use client'

import { useState, useEffect, useCallback } from 'react'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import { SearchBar } from '@/components/catalog/search-bar'
import { FilterSidebar } from '@/components/catalog/filter-sidebar'
import { ProductCard } from '@/components/catalog/product-card'
import { SlidersHorizontal, X, Loader2 } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string | null
  category: string
  brand: string | null
  price: number
  stock: number
  images: string[]
  isActive: boolean
}

interface FilterOption {
  value: string
  label: string
  count?: number
}

export default function SparepartPage() {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [priceRange, setPriceRange] = useState('')
  const [sortBy, setSortBy] = useState('popular')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [categoryOptions, setCategoryOptions] = useState<FilterOption[]>([])
  const [brandOptions, setBrandOptions] = useState<FilterOption[]>([])

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
      })

      if (searchQuery) params.set('search', searchQuery)
      if (categoryFilter) params.set('category', categoryFilter)
      if (brandFilter) params.set('brand', brandFilter)

      // Add sorting
      if (sortBy) {
        switch (sortBy) {
          case 'price-low':
            params.set('sortBy', 'price')
            params.set('sortOrder', 'asc')
            break
          case 'price-high':
            params.set('sortBy', 'price')
            params.set('sortOrder', 'desc')
            break
          case 'rating':
            params.set('sortBy', 'rating')
            params.set('sortOrder', 'desc')
            break
          case 'sold':
            params.set('sortBy', 'sold')
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
          case 'under-500k':
            params.set('maxPrice', '500000')
            break
          case '500k-1m':
            params.set('minPrice', '500000')
            params.set('maxPrice', '1000000')
            break
          case '1m-2m':
            params.set('minPrice', '1000000')
            params.set('maxPrice', '2000000')
            break
          case 'above-2m':
            params.set('minPrice', '2000000')
            break
        }
      }

      const res = await fetch(`/api/products?${params}`)
      if (!res.ok) throw new Error('Failed to fetch products')

      const data = await res.json()
      setProducts(data.products || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotal(data.pagination?.total || 0)

      // Set filter options from API
      if (data.filters) {
        setCategoryOptions(data.filters.categories || [])
        setBrandOptions(data.filters.brands || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }, [page, searchQuery, categoryFilter, brandFilter, priceRange, sortBy])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

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
    // Update filters based on FilterSidebar callback
    const kategori = filters['Kategori']?.[0] || ''
    const brand = filters['Brand']?.[0] || ''
    const harga = filters['Harga']?.[0] || ''

    setCategoryFilter(kategori)
    setBrandFilter(brand)
    setPriceRange(harga)
    setPage(1)
  }

  const handleClearFilters = () => {
    setCategoryFilter('')
    setBrandFilter('')
    setPriceRange('')
    setPage(1)
  }

  const filterGroups = [
    {
      title: 'Kategori',
      type: 'checkbox' as const,
      options: categoryOptions,
    },
    {
      title: 'Brand',
      type: 'checkbox' as const,
      options: brandOptions,
    },
    {
      title: 'Harga',
      type: 'radio' as const,
      options: [
        { value: 'under-500k', label: 'Di bawah 500rb' },
        { value: '500k-1m', label: '500rb - 1jt' },
        { value: '1m-2m', label: '1jt - 2jt' },
        { value: 'above-2m', label: 'Di atas 2jt' },
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
            Katalog Sparepart
          </h1>
          <p className="text-lg text-gray-600">
            Temukan sparepart berkualitas untuk gadget Anda
          </p>
        </div>

        {/* Search Bar */}
        <SearchBar
          placeholder="Cari sparepart berdasarkan nama atau brand..."
          onSearch={handleSearch}
          onSortChange={handleSort}
          sortOptions={[
            { value: 'popular', label: 'Paling Populer' },
            { value: 'price-low', label: 'Harga Terendah' },
            { value: 'price-high', label: 'Harga Tertinggi' },
            { value: 'rating', label: 'Rating Tertinggi' },
            { value: 'sold', label: 'Paling Laris' },
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

          {/* Product Grid */}
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Menampilkan <span className="font-semibold">{total}</span>{' '}
                produk
              </p>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-gray-500">Tidak ada produk ditemukan</p>
              </div>
            ) : (
              <>
                {/* Mobile: Masonry 2 columns */}
                <div className="columns-2 gap-6 space-y-6 md:hidden">
                  {products.map((item) => (
                    <div key={item.id} className="mb-6 break-inside-avoid">
                      <ProductCard
                        id={item.id}
                        title={item.name}
                        image={item.images[0] || '/placeholder.png'}
                        description={`${item.brand || 'No Brand'} • ${item.category}`}
                        price={item.price}
                        badge={item.stock > 0 ? `Stok: ${item.stock}` : 'Habis'}
                        badgeColor={item.stock > 0 ? 'green' : 'red'}
                        href={`/sparepart/${item.id}`}
                        actionLabel="Lihat Detail"
                      />
                    </div>
                  ))}
                </div>

                {/* Desktop: Regular grid 3 columns */}
                <div className="hidden gap-6 md:grid md:grid-cols-2 xl:grid-cols-3">
                  {products.map((item) => (
                    <ProductCard
                      key={item.id}
                      id={item.id}
                      title={item.name}
                      image={item.images[0] || '/placeholder.png'}
                      description={`${item.brand || 'No Brand'} • ${item.category}`}
                      price={item.price}
                      badge={item.stock > 0 ? `Stok: ${item.stock}` : 'Habis'}
                      badgeColor={item.stock > 0 ? 'green' : 'red'}
                      href={`/sparepart/${item.id}`}
                      actionLabel="Lihat Detail"
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
