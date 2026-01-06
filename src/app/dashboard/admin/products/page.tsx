'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  ShoppingBag,
  Wrench,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import ProductFormModal from '@/components/admin/product-form-modal'
import RentalItemFormModal from '@/components/admin/rental-item-form-modal'
import StockBadge from '@/components/shared/stock-badge'

interface Product {
  id: string
  name: string
  description: string | null
  category: string
  brand: string | null
  model: string | null
  price: number
  stock: number
  images: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface RentalItem {
  id: string
  name: string
  description: string | null
  pricePerDay: number
  depositAmount: number | null
  terms: string[]
  stock: number
  images: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ProductStats {
  total: number
  lowStock: number
  outOfStock: number
  byCategory: Record<string, number>
}

interface RentalStats {
  total: number
  available: number
  unavailable: number
}

export default function ProductsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'sparepart' | 'rental'>(
    'sparepart'
  )

  // Products state
  const [products, setProducts] = useState<Product[]>([])
  const [productStats, setProductStats] = useState<ProductStats>({
    total: 0,
    lowStock: 0,
    outOfStock: 0,
    byCategory: {},
  })
  const [productsLoading, setProductsLoading] = useState(true)

  // Rental items state
  const [rentalItems, setRentalItems] = useState<RentalItem[]>([])
  const [rentalStats, setRentalStats] = useState<RentalStats>({
    total: 0,
    available: 0,
    unavailable: 0,
  })
  const [rentalsLoading, setRentalsLoading] = useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [stockStatusFilter, setStockStatusFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Modals
  const [showProductModal, setShowProductModal] = useState(false)
  const [showRentalModal, setShowRentalModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingRental, setEditingRental] = useState<RentalItem | null>(null)

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setProductsLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search: searchQuery,
        category: categoryFilter,
        stockStatus: stockStatusFilter,
      })

      const res = await fetch(`/api/admin/products?${params}`)

      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Unauthorized. Please login as admin.')
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch products')
      }

      const data = await res.json()
      setProducts(data.products || [])
      setProductStats(
        data.stats || { total: 0, lowStock: 0, outOfStock: 0, byCategory: {} }
      )
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to load products')
    } finally {
      setProductsLoading(false)
    }
  }, [page, searchQuery, categoryFilter, stockStatusFilter, router])

  // Fetch rental items
  const fetchRentalItems = useCallback(async () => {
    setRentalsLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search: searchQuery,
        stockStatus: stockStatusFilter,
      })

      const res = await fetch(`/api/admin/rental-items?${params}`)

      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Unauthorized. Please login as admin.')
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch rental items')
      }

      const data = await res.json()
      setRentalItems(data.rentalItems || [])
      setRentalStats(data.stats || { total: 0, available: 0, unavailable: 0 })
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Error fetching rental items:', error)
      toast.error('Failed to load rental items')
    } finally {
      setRentalsLoading(false)
    }
  }, [page, searchQuery, stockStatusFilter, router])

  useEffect(() => {
    if (activeTab === 'sparepart') {
      fetchProducts()
    } else {
      fetchRentalItems()
    }
  }, [
    page,
    searchQuery,
    categoryFilter,
    stockStatusFilter,
    activeTab,
    fetchProducts,
    fetchRentalItems,
  ])

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete product')

      toast.success('Product deleted successfully')
      fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Failed to delete product')
    }
  }

  // Delete rental item
  const handleDeleteRental = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rental item?')) return

    try {
      const res = await fetch(`/api/admin/rental-items/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete rental item')

      toast.success('Rental item deleted successfully')
      fetchRentalItems()
    } catch (error) {
      console.error('Error deleting rental item:', error)
      toast.error('Failed to delete rental item')
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const categories = Object.keys(productStats.byCategory || {})

  return (
    <div className="overflow-x-hidden">
      {/* Header Banner */}
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 p-8 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">📦 Kelola Produk</h1>
            <p className="mt-2 text-blue-100">
              Manage sparepart and rental items inventory
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 px-4 py-2 backdrop-blur-sm">
              <p className="text-sm font-medium">Total Products</p>
              <p className="text-2xl font-bold">
                {productStats.total + rentalStats.total}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {/* Total Sparepart Card */}
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500 to-green-700 p-4 shadow-lg transition-all hover:shadow-xl lg:rounded-2xl lg:p-6">
          <div className="absolute right-0 top-0 h-20 w-20 -translate-y-6 translate-x-6 rounded-full bg-white/10 lg:h-32 lg:w-32 lg:-translate-y-8 lg:translate-x-8"></div>
          <div className="relative">
            <div className="mb-2 inline-flex rounded-lg bg-white/20 p-2 backdrop-blur-sm lg:mb-4 lg:rounded-xl lg:p-3">
              <Package className="h-4 w-4 text-white lg:h-6 lg:w-6" />
            </div>
            <p className="text-xs font-medium text-green-100 lg:text-sm">
              Sparepart
            </p>
            <p className="mt-1 text-xl font-bold text-white lg:mt-2 lg:text-3xl">
              {productStats.total}
            </p>
          </div>
        </div>

        {/* Total Alat Sewa Card */}
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 p-4 shadow-lg transition-all hover:shadow-xl lg:rounded-2xl lg:p-6">
          <div className="absolute right-0 top-0 h-20 w-20 -translate-y-6 translate-x-6 rounded-full bg-white/10 lg:h-32 lg:w-32 lg:-translate-y-8 lg:translate-x-8"></div>
          <div className="relative">
            <div className="mb-2 inline-flex rounded-lg bg-white/20 p-2 backdrop-blur-sm lg:mb-4 lg:rounded-xl lg:p-3">
              <Wrench className="h-4 w-4 text-white lg:h-6 lg:w-6" />
            </div>
            <p className="text-xs font-medium text-purple-100 lg:text-sm">
              Alat Sewa
            </p>
            <p className="mt-1 text-xl font-bold text-white lg:mt-2 lg:text-3xl">
              {rentalStats.total}
            </p>
          </div>
        </div>

        {/* Low Stock Alert Card */}
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-700 p-4 shadow-lg transition-all hover:shadow-xl lg:rounded-2xl lg:p-6">
          <div className="absolute right-0 top-0 h-20 w-20 -translate-y-6 translate-x-6 rounded-full bg-white/10 lg:h-32 lg:w-32 lg:-translate-y-8 lg:translate-x-8"></div>
          <div className="relative">
            <div className="mb-2 inline-flex rounded-lg bg-white/20 p-2 backdrop-blur-sm lg:mb-4 lg:rounded-xl lg:p-3">
              <AlertTriangle className="h-4 w-4 text-white lg:h-6 lg:w-6" />
            </div>
            <p className="text-xs font-medium text-yellow-100 lg:text-sm">
              Low Stock
            </p>
            <p className="mt-1 text-xl font-bold text-white lg:mt-2 lg:text-3xl">
              {productStats.lowStock}
            </p>
          </div>
        </div>

        {/* Out of Stock Card */}
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-red-500 to-red-700 p-4 shadow-lg transition-all hover:shadow-xl lg:rounded-2xl lg:p-6">
          <div className="absolute right-0 top-0 h-20 w-20 -translate-y-6 translate-x-6 rounded-full bg-white/10 lg:h-32 lg:w-32 lg:-translate-y-8 lg:translate-x-8"></div>
          <div className="relative">
            <div className="mb-2 inline-flex rounded-lg bg-white/20 p-2 backdrop-blur-sm lg:mb-4 lg:rounded-xl lg:p-3">
              <ShoppingBag className="h-4 w-4 text-white lg:h-6 lg:w-6" />
            </div>
            <p className="text-xs font-medium text-red-100 lg:text-sm">
              Out of Stock
            </p>
            <p className="mt-1 text-xl font-bold text-white lg:mt-2 lg:text-3xl">
              {productStats.outOfStock}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => {
              setActiveTab('sparepart')
              setPage(1)
              setCategoryFilter('ALL')
              setStockStatusFilter('ALL')
              setSearchQuery('')
            }}
            className={`px-4 pb-4 font-medium transition-colors ${
              activeTab === 'sparepart'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Sparepart
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab('rental')
              setPage(1)
              setCategoryFilter('ALL')
              setStockStatusFilter('ALL')
              setSearchQuery('')
            }}
            className={`px-4 pb-4 font-medium transition-colors ${
              activeTab === 'rental'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Alat Sewa
            </div>
          </button>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap gap-4">
          {/* Category Filter (only for sparepart) */}
          {activeTab === 'sparepart' && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none sm:w-auto"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}

          {/* Stock Status Filter */}
          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none sm:w-auto"
          >
            <option value="ALL">All Stock Status</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          {/* Search */}
          <div className="relative w-full flex-1 sm:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex w-full gap-2 sm:w-auto">
          <button
            onClick={() => {
              if (activeTab === 'sparepart') {
                setEditingProduct(null)
                setShowProductModal(true)
              } else {
                setEditingRental(null)
                setShowRentalModal(true)
              }
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 font-medium text-white transition-all hover:shadow-lg sm:flex-initial"
          >
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline">
              Add {activeTab === 'sparepart' ? 'Sparepart' : 'Rental Item'}
            </span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Products/Rentals Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {(activeTab === 'sparepart' ? productsLoading : rentalsLoading) ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : activeTab === 'sparepart' ? (
          products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-500">No products found</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block lg:hidden">
                <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {product.images[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate font-semibold text-gray-900">
                              {product.name}
                            </h3>
                            {product.brand && (
                              <p className="truncate text-sm text-gray-600">
                                {product.brand}
                              </p>
                            )}
                          </div>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            product.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                            {product.category}
                          </span>
                          <span className="font-semibold text-gray-900">
                            {formatPrice(product.price)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Stock:</span>
                          <StockBadge stock={product.stock} />
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => {
                            setEditingProduct(product)
                            setShowProductModal(true)
                          }}
                          className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 text-sm font-medium text-white hover:shadow-lg"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {product.images[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="h-12 w-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200">
                                <Package className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">
                                {product.name}
                              </div>
                              {product.brand && (
                                <div className="text-sm text-gray-500">
                                  {product.brand}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {formatPrice(product.price)}
                        </td>
                        <td className="px-6 py-4">
                          <StockBadge stock={product.stock} />
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-2 py-1 text-xs ${
                              product.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {product.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingProduct(product)
                                setShowProductModal(true)
                              }}
                              className="rounded-lg bg-blue-100 p-2 text-blue-600 hover:bg-blue-200"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="rounded-lg bg-red-100 p-2 text-red-600 hover:bg-red-200"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )
        ) : rentalItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Wrench className="h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-500">No rental items found</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block lg:hidden">
              <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
                {rentalItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {item.images[0] ? (
                          <img
                            src={item.images[0]}
                            alt={item.name}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200">
                            <Wrench className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-semibold text-gray-900">
                            {item.name}
                          </h3>
                          {item.description && (
                            <p className="line-clamp-1 truncate text-sm text-gray-600">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          item.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Price/Day:
                        </span>
                        <span className="font-semibold text-gray-900">
                          {formatPrice(item.pricePerDay)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Available:</span>
                        <StockBadge stock={item.stock} />
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => {
                          setEditingRental(item)
                          setShowRentalModal(true)
                        }}
                        className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 text-sm font-medium text-white hover:shadow-lg"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRental(item.id)}
                        className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Price/Day
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Available
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {rentalItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {item.images[0] ? (
                            <img
                              src={item.images[0]}
                              alt={item.name}
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200">
                              <Wrench className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900">
                              {item.name}
                            </div>
                            {item.description && (
                              <div className="line-clamp-1 text-sm text-gray-500">
                                {item.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatPrice(item.pricePerDay)}
                      </td>
                      <td className="px-6 py-4">
                        <StockBadge stock={item.stock} />
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            item.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingRental(item)
                              setShowRentalModal(true)
                            }}
                            className="rounded-lg bg-blue-100 p-2 text-blue-600 hover:bg-blue-200"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRental(item.id)}
                            className="rounded-lg bg-red-100 p-2 text-red-600 hover:bg-red-200"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-700">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Modals */}
      <ProductFormModal
        isOpen={showProductModal}
        product={editingProduct}
        onClose={() => {
          setShowProductModal(false)
          setEditingProduct(null)
        }}
        onSuccess={fetchProducts}
      />
      <RentalItemFormModal
        isOpen={showRentalModal}
        rentalItem={editingRental}
        onClose={() => {
          setShowRentalModal(false)
          setEditingRental(null)
        }}
        onSuccess={fetchRentalItems}
      />
    </div>
  )
}
