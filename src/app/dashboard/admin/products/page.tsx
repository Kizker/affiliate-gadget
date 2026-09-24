'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  Smartphone,
  Search,
  Plus,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Gift,
  Edit,
  Trash2,
  AlertTriangle,
  X,
  Download,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowUpDown,
  Layers,
  Table as TableIcon,
  CheckSquare,
  Square,
  Sparkles,
  Check,
  RotateCcw,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { BulkPriceUpdateModal } from '@/components/admin/bulk-price-update-modal'
import {
  buildCatalogHierarchy,
  BrandGroup,
  SeriesGroup,
  CapacityGroup,
  ColorVariantItem,
} from '@/lib/catalog-hierarchy'

interface ProductVariant {
  id?: string
  name: string
  ram: string
  storage: string
  color: string
  price: number | string
  costPrice?: number | string | null
  stock: number | string
  sku?: string | null
}

interface ProductItem {
  id: string
  name: string
  brand: string | null
  model: string | null
  category: string
  condition: string
  price: number
  costPrice?: number | null
  originalPrice: number | null
  stock: number
  weightGram?: number
  pricePerKg?: number
  description: string | null
  images: string[]
  specs?: any
  warrantyDays: number
  includesCharger: boolean
  includesScreenProtector: boolean
  includesCase: boolean
  isActive: boolean
  isTaxable?: boolean
  createdAt?: string | Date
  storeId?: string | null
  store?: {
    id: string
    name: string
    city: string
    companyName?: string
    isPkp?: boolean
    vatRate?: number
  } | null
  variants?: ProductVariant[]
}

export default function ProductsPage() {
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  const [products, setProducts] = useState<ProductItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'AKTIF' | 'NONAKTIF'
  >('ALL')
  const [sortBy, setSortBy] = useState<
    | 'latest'
    | 'oldest'
    | 'price_desc'
    | 'price_asc'
    | 'stock_desc'
    | 'stock_asc'
    | 'name_asc'
  >('latest')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // View Mode: 'hierarchy' (Nested Dropdown: Merek -> Seri -> RAM -> Warna) vs 'flat' (Table)
  const [viewMode, setViewMode] = useState<'hierarchy' | 'flat'>('hierarchy')

  // Accordion state for Hierarchy View
  const [expandedBrands, setExpandedBrands] = useState<Record<string, boolean>>(
    {}
  )
  const [expandedSeries, setExpandedSeries] = useState<Record<string, boolean>>(
    {}
  )
  const [expandedCapacities, setExpandedCapacities] = useState<
    Record<string, boolean>
  >({})

  // Inline Bulk Price Updates for capacity tiers
  const [capacityPriceInputs, setCapacityPriceInputs] = useState<
    Record<string, string>
  >({})
  const [updatingCapacity, setUpdatingCapacity] = useState<string | null>(null)

  // Multi-variant checkbox selection
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<string>>(
    new Set()
  )
  const [bulkNewPrice, setBulkNewPrice] = useState<string>('')
  const [bulkNewStock, setBulkNewStock] = useState<string>('')
  const [bulkUpdating, setBulkUpdating] = useState<boolean>(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Delete Modal State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<ProductItem | null>(
    null
  )
  const [deleteLoading, setDeleteLoading] = useState(false)

  const isStoreAdmin = session?.user?.role === 'STORE_ADMIN'
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'
  const userStoreId = session?.user?.storeId

  // Bulk Excel Update Modal State (Superadmin only)
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      const res = await fetch('/api/admin/products/export-excel')
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Gagal mengunduh file katalog Excel.')
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const nowStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      a.download = `mass_update_sales_info_${nowStr}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Data katalog format Shopee berhasil diekspor!')
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengekspor file Excel.')
    } finally {
      setIsExporting(false)
    }
  }

  const brands = ['ALL', 'Samsung', 'Apple', 'Xiaomi', 'ASUS', 'Vivo', 'Oppo']

  const fetchProducts = useCallback(async () => {
    if (status === 'loading') return
    setLoading(true)
    try {
      let url = '/api/gadgets?scoped=true&'
      if (selectedBrand !== 'ALL')
        url += `brand=${encodeURIComponent(selectedBrand)}&`
      if (isStoreAdmin && userStoreId)
        url += `storeId=${encodeURIComponent(userStoreId)}&`

      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setProducts(data.data || [])
      }
    } catch (e) {
      console.error(e)
      toast.error('Gagal memuat inventori produk')
    } finally {
      setLoading(false)
    }
  }, [selectedBrand, isStoreAdmin, userStoreId, status])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Filter products by search and status
  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (statusFilter === 'AKTIF' && !p.isActive) return false
      if (statusFilter === 'NONAKTIF' && p.isActive) return false

      if (!search) return true
      const q = search.toLowerCase()
      return (
        p.name.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.model && p.model.toLowerCase().includes(q)) ||
        (p.store && p.store.name.toLowerCase().includes(q)) ||
        (p.variants &&
          p.variants.some(
            (v) =>
              v.name.toLowerCase().includes(q) ||
              v.color?.toLowerCase().includes(q) ||
              v.sku?.toLowerCase().includes(q)
          ))
      )
    })
  }, [products, statusFilter, search])

  // Build 4-Level Hierarchy Tree (Brand -> Series -> Capacity -> Color Variants)
  const hierarchy = useMemo(() => {
    return buildCatalogHierarchy(filtered)
  }, [filtered])

  // Automatically expand brand when brand filter is chosen or when searching
  useEffect(() => {
    if (selectedBrand !== 'ALL') {
      setExpandedBrands((prev) => ({ ...prev, [selectedBrand]: true }))
    }
    if (search.trim()) {
      // Expand all brands and series during active search
      const allB: Record<string, boolean> = {}
      const allS: Record<string, boolean> = {}
      hierarchy.forEach((b) => {
        allB[b.brand] = true
        b.series.forEach((s) => {
          allS[`${b.brand}-${s.seriesName}`] = true
        })
      })
      setExpandedBrands(allB)
      setExpandedSeries(allS)
    }
  }, [selectedBrand, search, hierarchy])

  // Flat table sorting & pagination
  const sortedProducts = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === 'latest') {
        return (
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
        )
      }
      if (sortBy === 'oldest') {
        return (
          new Date(a.createdAt || 0).getTime() -
          new Date(b.createdAt || 0).getTime()
        )
      }
      if (sortBy === 'price_desc') {
        return (Number(b.price) || 0) - (Number(a.price) || 0)
      }
      if (sortBy === 'price_asc') {
        return (Number(a.price) || 0) - (Number(b.price) || 0)
      }
      if (sortBy === 'stock_desc') {
        return (Number(b.stock) || 0) - (Number(a.stock) || 0)
      }
      if (sortBy === 'stock_asc') {
        return (Number(a.stock) || 0) - (Number(b.stock) || 0)
      }
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name)
      }
      return 0
    })
  }, [filtered, sortBy])

  const totalItems = sortedProducts.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
  const paginatedProducts = sortedProducts.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, selectedBrand, statusFilter, sortBy, itemsPerPage])

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    if (safeCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages]
    }
    if (safeCurrentPage >= totalPages - 3) {
      return [
        1,
        '...',
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ]
    }
    return [
      1,
      '...',
      safeCurrentPage - 1,
      safeCurrentPage,
      safeCurrentPage + 1,
      '...',
      totalPages,
    ]
  }

  // Toggle Accordions
  const toggleBrand = (brandName: string) => {
    setExpandedBrands((prev) => ({
      ...prev,
      [brandName]: !prev[brandName],
    }))
  }

  const toggleSeries = (key: string) => {
    setExpandedSeries((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const toggleCapacity = (key: string) => {
    setExpandedCapacities((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  // Multi-variant checkbox toggling
  const toggleVariantSelection = (variantId: string) => {
    setSelectedVariantIds((prev) => {
      const next = new Set(prev)
      if (next.has(variantId)) {
        next.delete(variantId)
      } else {
        next.add(variantId)
      }
      return next
    })
  }

  const selectAllCapacityVariants = (capacity: CapacityGroup) => {
    const allSelected = capacity.variants.every((v) =>
      selectedVariantIds.has(v.id)
    )
    setSelectedVariantIds((prev) => {
      const next = new Set(prev)
      capacity.variants.forEach((v) => {
        if (allSelected) {
          next.delete(v.id)
        } else {
          next.add(v.id)
        }
      })
      return next
    })
  }

  // Direct Inline Bulk Update for an entire Capacity Group (All Colors)
  const handleUpdateCapacityColors = async (
    capacityKeyIdentifier: string,
    capacity: CapacityGroup
  ) => {
    const inputVal = capacityPriceInputs[capacityKeyIdentifier]
    const priceNum = inputVal
      ? Number(inputVal)
      : capacity.commonPrice || capacity.minPrice

    if (!priceNum || isNaN(priceNum) || priceNum <= 0) {
      toast.error('Masukkan nominal harga baru yang valid (> Rp 0)')
      return
    }

    const variantIds = capacity.variants.map((v) => v.id)
    setUpdatingCapacity(capacityKeyIdentifier)

    try {
      const res = await fetch(
        '/api/admin/products/variants/bulk-color-update',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            variantIds,
            newPrice: priceNum,
          }),
        }
      )

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memperbarui harga varian warna.')
      }

      toast.success(
        `Berhasil! ${data.updatedCount} varian warna kapasitas "${capacity.capacityKey}" diubah menjadi Rp ${priceNum.toLocaleString('id-ID')}`
      )
      await fetchProducts()
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat update harga.')
    } finally {
      setUpdatingCapacity(null)
    }
  }

  // Multi-variant bulk update (from floating action bar)
  const handleApplySelectedBulkUpdate = async () => {
    if (selectedVariantIds.size === 0) return

    const priceNum = bulkNewPrice ? Number(bulkNewPrice) : null
    const stockNum = bulkNewStock ? Number(bulkNewStock) : null

    if (!priceNum && stockNum === null) {
      toast.error('Masukkan setidaknya harga baru atau stok baru.')
      return
    }

    setBulkUpdating(true)
    try {
      const res = await fetch(
        '/api/admin/products/variants/bulk-color-update',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            variantIds: Array.from(selectedVariantIds),
            newPrice: priceNum,
            newStock: stockNum,
          }),
        }
      )

      const data = await res.json()
      if (!res.ok) {
        throw new Error(
          data.error || 'Gagal memperbarui varian warna terpilih.'
        )
      }

      toast.success(
        `Sukses! ${data.updatedCount} varian warna terpilih berhasil diperbarui massal.`
      )
      setSelectedVariantIds(new Set())
      setBulkNewPrice('')
      setBulkNewStock('')
      await fetchProducts()
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat pembaruan massal.')
    } finally {
      setBulkUpdating(false)
    }
  }

  // Delete Handlers
  const handleOpenDelete = (product: ProductItem) => {
    setProductToDelete(product)
    setIsDeleteOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!productToDelete) return

    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/products/${productToDelete.id}`, {
        method: 'DELETE',
      })

      const result = await res.json()
      if (res.ok && result.success) {
        toast.success(`Produk "${productToDelete.name}" berhasil dihapus!`)
        setIsDeleteOpen(false)
        setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id))
      } else {
        toast.error(result.error || 'Gagal menghapus produk')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Terjadi kesalahan saat menghapus')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Toggle product taxable status directly from catalog table/hierarchy
  const [updatingTaxId, setUpdatingTaxId] = useState<string | null>(null)

  const handleToggleProductTaxable = async (
    productId: string,
    currentIsTaxable: boolean,
    productName?: string
  ) => {
    setUpdatingTaxId(productId)
    try {
      const nextIsTaxable = !currentIsTaxable
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTaxable: nextIsTaxable }),
      })
      const data = await res.json()
      if (!res.ok || (data.success === false && data.error)) {
        throw new Error(data.error || 'Gagal memperbarui status PPN')
      }

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, isTaxable: nextIsTaxable } : p
        )
      )

      toast.success(
        nextIsTaxable
          ? `${productName || 'Gadget'} sekarang DIKENAKAN PPN (Inklusif)`
          : `${productName || 'Gadget'} sekarang BEBAS PPN (PPN Rp 0)`
      )
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status PPN produk')
    } finally {
      setUpdatingTaxId(null)
    }
  }

  if (!mounted || status === 'loading') {
    return (
      <div className="mx-auto max-w-7xl animate-pulse space-y-5 pb-16">
        <div className="shadow-2xs h-14 w-full rounded-3xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="shadow-xs h-24 rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-24">
      {/* 1. Unified Control Panel: Brand Filter, Status Filter, View Toggle, Search & Actions */}
      <div className="shadow-2xs flex flex-col items-stretch justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900 sm:p-3 xl:flex-row xl:items-center">
        {/* Left: Brand Pills & Status Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Brand Pills */}
          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto rounded-2xl bg-slate-100/80 p-1 dark:bg-slate-800/80">
            {brands.map((b) => (
              <button
                key={b}
                onClick={() => setSelectedBrand(b)}
                className={`whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
                  selectedBrand === b
                    ? 'shadow-xs bg-white text-slate-950 dark:bg-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {b === 'ALL' ? 'Semua Merek' : b}
              </button>
            ))}
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1 rounded-2xl bg-slate-100/80 p-1 dark:bg-slate-800/80">
            {(['ALL', 'AKTIF', 'NONAKTIF'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`whitespace-nowrap rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all duration-200 ${
                  statusFilter === st
                    ? 'shadow-xs bg-white text-slate-950 dark:bg-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {st === 'ALL'
                  ? 'Semua Status'
                  : st === 'AKTIF'
                    ? 'Aktif'
                    : 'Nonaktif'}
              </button>
            ))}
          </div>

          {/* View Mode Toggle: Mode Hirarki vs Mode Tabel Datar */}
          <div className="flex items-center gap-1 rounded-2xl border border-slate-200/90 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
            <button
              onClick={() => setViewMode('hierarchy')}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                viewMode === 'hierarchy'
                  ? 'shadow-xs bg-orange-500 text-white'
                  : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="Tampilan Hirarki: Merek -> Seri -> RAM/Storage -> Varian Warna"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Hirarki Dropdown</span>
            </button>
            <button
              onClick={() => setViewMode('flat')}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                viewMode === 'flat'
                  ? 'shadow-xs bg-orange-500 text-white'
                  : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="Tampilan Tabel Tradisional Datar"
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tabel Datar</span>
            </button>
          </div>
        </div>

        {/* Right: Search, Sort, Export, & Add CTA */}
        <div className="flex w-full flex-wrap items-center gap-2 xl:w-auto">
          {/* Search Input */}
          <div className="relative min-w-[200px] flex-1 xl:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari merek, seri, kapasitas, warna..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-xs font-medium outline-none transition focus:border-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Sort Dropdown (for flat view) */}
          {viewMode === 'flat' && (
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-9 cursor-pointer appearance-none rounded-2xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-7 text-xs font-bold text-slate-700 outline-none transition hover:bg-white focus:border-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                title="Urutan Tampilan Katalog"
              >
                <option value="latest">Terbaru (Default)</option>
                <option value="oldest">Terlama</option>
                <option value="price_desc">Harga: Tertinggi</option>
                <option value="price_asc">Harga: Terendah</option>
                <option value="stock_desc">Stok: Terbanyak</option>
                <option value="stock_asc">Stok: Tersedikit</option>
                <option value="name_asc">Nama (A - Z)</option>
              </select>
              <ArrowUpDown className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            </div>
          )}

          {/* Superadmin Bulk Excel Actions */}
          {isSuperAdmin && (
            <>
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={isExporting}
                className="shadow-2xs inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-2xl border border-slate-200/90 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                title="Unduh seluruh data katalog dan SKU ke format Excel (.xlsx)"
              >
                {isExporting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                ) : (
                  <Download className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                )}
                <span className="hidden sm:inline">Export Excel</span>
              </button>

              <button
                type="button"
                onClick={() => setIsBulkUpdateOpen(true)}
                className="shadow-2xs inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-2xl border border-emerald-200/90 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition-all hover:bg-emerald-100 active:scale-95 dark:border-emerald-800/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
                title="Perbarui harga & stok massal berdasarkan SKU melalui upload Excel"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Update Massal (Excel)</span>
              </button>
            </>
          )}

          <Link
            href="/dashboard/admin/products/new"
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-2xl bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition-all hover:bg-orange-600 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Tambah Gadget</span>
          </Link>
        </div>
      </div>

      {/* 2. Main Body: Mode Hirarki Dropdown vs Mode Tabel Datar */}
      {loading ? (
        <div className="rounded-3xl border border-slate-200/80 bg-white py-24 text-center text-slate-400 dark:border-slate-800 dark:bg-slate-900">
          <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-orange-500" />
          <p className="text-xs font-medium">
            Memuat katalog gadget bertingkat...
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/80 bg-white py-20 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800">
            <Smartphone className="h-7 w-7 text-slate-400" />
          </div>
          <div className="mt-3 space-y-1">
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              Belum ada produk gadget yang sesuai
            </p>
            <p className="text-xs text-slate-400">
              Silakan ubah kata kunci pencarian atau daftarkan produk baru toko
              Anda.
            </p>
          </div>
          <Link
            href="/dashboard/admin/products/new"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Gadget Sekarang</span>
          </Link>
        </div>
      ) : viewMode === 'hierarchy' ? (
        /* ========================================================================= */
        /* MODE HIRARKI: Merek -> Seri -> Varian RAM/Storage -> Varian Warna         */
        /* ========================================================================= */
        <div className="space-y-4">
          {hierarchy.map((brandGroup) => {
            const isBrandOpen =
              expandedBrands[brandGroup.brand] ??
              (selectedBrand === brandGroup.brand || hierarchy.length === 1)

            return (
              <div
                key={brandGroup.brand}
                className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                {/* 1. Level 1: Merek Accordion Header */}
                <div
                  onClick={() => toggleBrand(brandGroup.brand)}
                  className="flex cursor-pointer select-none items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-4 transition hover:bg-slate-100/70 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800/70"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500 font-black text-white shadow-sm shadow-orange-500/20">
                      {brandGroup.brand.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-black text-slate-900 dark:text-white">
                          {brandGroup.brand}
                        </h2>
                        <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-[10px] font-bold text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-400">
                          {brandGroup.totalSeries} Seri Gadget
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {brandGroup.totalVariants} varian warna • Total stok:{' '}
                        <strong className="font-semibold text-slate-700 dark:text-slate-300">
                          {brandGroup.totalStock} unit
                        </strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400">
                      {isBrandOpen ? 'Tutup Merek' : 'Buka Seri'}
                    </span>
                    <div className="rounded-full bg-slate-200/60 p-1.5 text-slate-600 transition dark:bg-slate-700 dark:text-slate-200">
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                          isBrandOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Level 2: List of Series under this Brand */}
                {isBrandOpen && (
                  <div className="divide-y divide-slate-100 p-4 dark:divide-slate-800/60 sm:p-5">
                    {brandGroup.series.map((series) => {
                      const seriesKey = `${brandGroup.brand}-${series.seriesName}`
                      const isSeriesOpen =
                        expandedSeries[seriesKey] ??
                        (search.trim().length > 0 ||
                          brandGroup.series.length === 1)

                      return (
                        <div
                          key={seriesKey}
                          className="py-3 first:pt-0 last:pb-0"
                        >
                          {/* 2. Level 2: Seri Accordion Header */}
                          <div className="shadow-2xs flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white p-3.5 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/80">
                            <div
                              onClick={() => toggleSeries(seriesKey)}
                              className="flex flex-1 cursor-pointer items-center gap-3"
                            >
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                <Smartphone className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                    {series.seriesName}
                                  </h3>
                                  <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                    {series.capacities.length} Kapasitas
                                  </span>
                                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-400">
                                    {series.totalVariants} Varian Warna
                                  </span>
                                </div>
                                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                                    Mulai Rp{' '}
                                    {series.minPrice.toLocaleString('id-ID')}
                                  </span>
                                  <span>•</span>
                                  <span>
                                    {series.storeName ||
                                      'Affiliate Gadget Pusat'}
                                  </span>
                                  <span>•</span>
                                  <span>{series.condition || 'BARU'}</span>
                                  <span>•</span>
                                  <span
                                    className={`font-bold ${
                                      series.totalStock > 0
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-rose-500'
                                    }`}
                                  >
                                    Stok: {series.totalStock} unit
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Series Action Buttons & Expand Toggle */}
                            <div className="flex items-center gap-2">
                              {series.productId && (
                                <>
                                  {/* Direct PPN Checkbox Toggle */}
                                  <button
                                    type="button"
                                    disabled={
                                      updatingTaxId === series.productId
                                    }
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleToggleProductTaxable(
                                        series.productId!,
                                        series.isTaxable !== false,
                                        series.seriesName
                                      )
                                    }}
                                    className={`shadow-2xs inline-flex select-none items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold transition ${
                                      series.isTaxable !== false
                                        ? 'border-blue-200 bg-blue-50/90 text-blue-700 hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300'
                                        : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400'
                                    } ${updatingTaxId === series.productId ? 'cursor-wait opacity-60' : 'cursor-pointer'}`}
                                    title={
                                      series.isTaxable !== false
                                        ? `Dikenakan PPN (Inklusif ${series.storeVatRate ?? 11}% jika PKP). Klik untuk ubah jadi Bebas PPN.`
                                        : 'Bebas PPN (PPN Rp 0). Klik untuk ubah jadi Dikenakan PPN.'
                                    }
                                  >
                                    {updatingTaxId === series.productId ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : series.isTaxable !== false ? (
                                      <CheckSquare className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                    ) : (
                                      <Square className="h-3.5 w-3.5 text-slate-400" />
                                    )}
                                    <span>
                                      {series.isTaxable !== false
                                        ? series.storeIsPkp
                                          ? `PPN ${series.storeVatRate ?? 11}%`
                                          : 'PPN Aktif'
                                        : 'Bebas PPN'}
                                    </span>
                                  </button>

                                  <Link
                                    href={`/dashboard/admin/products/${series.productId}/edit`}
                                    className="shadow-2xs inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                    title="Edit Detail Produk"
                                  >
                                    <Edit className="h-3 w-3" />
                                    <span>Edit</span>
                                  </Link>

                                  <Link
                                    href={`/gadget/${series.productId}`}
                                    target="_blank"
                                    className="shadow-2xs inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                    title="Buka Halaman Publik"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </Link>
                                </>
                              )}

                              <button
                                onClick={() => toggleSeries(seriesKey)}
                                className="rounded-xl border border-slate-200 bg-slate-100/80 p-1.5 text-slate-600 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                title="Buka / Tutup Varian RAM"
                              >
                                <ChevronDown
                                  className={`h-4 w-4 transition-transform duration-200 ${
                                    isSeriesOpen ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>
                            </div>
                          </div>

                          {/* Level 3: Capacities under this Series */}
                          {isSeriesOpen && (
                            <div className="ml-2 mt-3 space-y-3 border-l-2 border-orange-200 pl-3 dark:border-orange-950 sm:ml-4 sm:pl-4">
                              {series.capacities.map((cap) => {
                                const capKeyIdentifier = `${seriesKey}-${cap.capacityKey}`
                                const isCapOpen =
                                  expandedCapacities[capKeyIdentifier] ?? true

                                return (
                                  <div
                                    key={capKeyIdentifier}
                                    className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/30"
                                  >
                                    {/* 3. Level 3: Varian RAM/Storage Accordion Header + Inline Bulk Price Updater */}
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                      {/* Left: Capacity Title, Price Consistency Status, & Select All */}
                                      <div className="flex flex-wrap items-center gap-2.5">
                                        <button
                                          onClick={() =>
                                            selectAllCapacityVariants(cap)
                                          }
                                          className="text-slate-400 hover:text-orange-600"
                                          title="Pilih / Batalkan semua warna di kapasitas ini"
                                        >
                                          {cap.variants.every((v) =>
                                            selectedVariantIds.has(v.id)
                                          ) ? (
                                            <CheckSquare className="h-4 w-4 text-orange-600" />
                                          ) : (
                                            <Square className="h-4 w-4" />
                                          )}
                                        </button>

                                        <div
                                          onClick={() =>
                                            toggleCapacity(capKeyIdentifier)
                                          }
                                          className="flex cursor-pointer items-center gap-2"
                                        >
                                          <span className="shadow-2xs rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-xs font-black text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                                            {cap.capacityKey}
                                          </span>

                                          {/* Status Harga Konsisten (Semua warna sama atau beda) */}
                                          {cap.isAllSamePrice ? (
                                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-400">
                                              <Check className="h-3 w-3 stroke-[2.5]" />
                                              Harga Seragam: Rp{' '}
                                              {cap.commonPrice?.toLocaleString(
                                                'id-ID'
                                              )}
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-400">
                                              <AlertTriangle className="h-3 w-3" />
                                              Harga Bervariasi (Rp{' '}
                                              {cap.minPrice.toLocaleString(
                                                'id-ID'
                                              )}{' '}
                                              - Rp{' '}
                                              {cap.maxPrice.toLocaleString(
                                                'id-ID'
                                              )}
                                              )
                                            </span>
                                          )}

                                          <span className="text-[11px] text-slate-400">
                                            {cap.variants.length} warna • Stok:{' '}
                                            {cap.totalStock} unit
                                          </span>
                                        </div>
                                      </div>

                                      {/* Right: Direct 1-Click Inline Bulk Price Updater */}
                                      <div className="flex flex-wrap items-center gap-2">
                                        <div className="relative">
                                          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                            Rp
                                          </span>
                                          <input
                                            type="number"
                                            placeholder={
                                              cap.commonPrice
                                                ? String(cap.commonPrice)
                                                : 'Ubah harga...'
                                            }
                                            value={
                                              capacityPriceInputs[
                                                capKeyIdentifier
                                              ] || ''
                                            }
                                            onChange={(e) =>
                                              setCapacityPriceInputs(
                                                (prev) => ({
                                                  ...prev,
                                                  [capKeyIdentifier]:
                                                    e.target.value,
                                                })
                                              )
                                            }
                                            className="h-8 w-36 rounded-xl border border-slate-300 bg-white py-1 pl-8 pr-2 text-xs font-bold text-slate-900 outline-none transition focus:border-orange-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                          />
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleUpdateCapacityColors(
                                              capKeyIdentifier,
                                              cap
                                            )
                                          }
                                          disabled={
                                            updatingCapacity ===
                                            capKeyIdentifier
                                          }
                                          className="shadow-2xs inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-xl bg-orange-500 px-3 text-xs font-bold text-white transition hover:bg-orange-600 active:scale-95 disabled:opacity-50"
                                          title="Update serempak harga untuk semua varian warna di kapasitas ini"
                                        >
                                          {updatingCapacity ===
                                          capKeyIdentifier ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                          ) : (
                                            <Sparkles className="h-3.5 w-3.5" />
                                          )}
                                          <span>Ubah Harga Semua Warna</span>
                                        </button>

                                        <button
                                          onClick={() =>
                                            toggleCapacity(capKeyIdentifier)
                                          }
                                          className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                          title="Buka / Tutup Tabel Warna"
                                        >
                                          <ChevronDown
                                            className={`h-4 w-4 transition-transform duration-200 ${
                                              isCapOpen ? 'rotate-180' : ''
                                            }`}
                                          />
                                        </button>
                                      </div>
                                    </div>

                                    {/* 4. Level 4: Varian Warna Table under this Capacity */}
                                    {isCapOpen && (
                                      <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200/90 bg-white dark:border-slate-700/80 dark:bg-slate-900">
                                        <table className="w-full text-left text-xs">
                                          <thead>
                                            <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/40">
                                              <th className="w-10 px-3 py-2 text-center">
                                                Pilih
                                              </th>
                                              <th className="px-3 py-2">
                                                Varian Warna
                                              </th>
                                              <th className="px-3 py-2">SKU</th>
                                              <th className="px-3 py-2">
                                                Harga Satuan
                                              </th>
                                              <th className="px-3 py-2 text-center">
                                                Stok
                                              </th>
                                              <th className="px-3 py-2">
                                                Status
                                              </th>
                                              <th className="px-3 py-2 text-right">
                                                Aksi
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {cap.variants.map((v) => {
                                              const isSelected =
                                                selectedVariantIds.has(v.id)

                                              return (
                                                <tr
                                                  key={v.id}
                                                  className={`transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/50 ${
                                                    isSelected
                                                      ? 'bg-orange-50/40 dark:bg-orange-950/20'
                                                      : ''
                                                  }`}
                                                >
                                                  <td className="px-3 py-2 text-center">
                                                    <button
                                                      onClick={() =>
                                                        toggleVariantSelection(
                                                          v.id
                                                        )
                                                      }
                                                      className="text-slate-400 hover:text-orange-600"
                                                    >
                                                      {isSelected ? (
                                                        <CheckSquare className="h-4 w-4 text-orange-600" />
                                                      ) : (
                                                        <Square className="h-4 w-4" />
                                                      )}
                                                    </button>
                                                  </td>
                                                  <td className="px-3 py-2">
                                                    <div className="flex items-center gap-2">
                                                      <span className="shadow-2xs h-3 w-3 rounded-full border border-slate-300 bg-gradient-to-tr from-slate-200 to-slate-400" />
                                                      <span className="font-bold text-slate-900 dark:text-white">
                                                        {v.color}
                                                      </span>
                                                      <span className="text-[10px] text-slate-400">
                                                        ({v.name})
                                                      </span>
                                                    </div>
                                                  </td>
                                                  <td className="px-3 py-2">
                                                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                      {v.sku || '-'}
                                                    </span>
                                                  </td>
                                                  <td className="px-3 py-2">
                                                    <span className="font-black text-slate-950 dark:text-white">
                                                      Rp{' '}
                                                      {v.price.toLocaleString(
                                                        'id-ID'
                                                      )}
                                                    </span>
                                                    {Boolean(
                                                      v.costPrice &&
                                                      v.costPrice > 0
                                                    ) && (
                                                      <div className="text-[10px] font-medium text-slate-400">
                                                        HPP:{' '}
                                                        <span className="font-mono text-slate-600 dark:text-slate-300">
                                                          Rp{' '}
                                                          {Number(
                                                            v.costPrice
                                                          ).toLocaleString(
                                                            'id-ID'
                                                          )}
                                                        </span>
                                                        <span className="ml-1 font-bold text-emerald-600 dark:text-emerald-400">
                                                          (+
                                                          {Math.round(
                                                            ((v.price -
                                                              Number(
                                                                v.costPrice
                                                              )) /
                                                              v.price) *
                                                              100
                                                          )}
                                                          %)
                                                        </span>
                                                      </div>
                                                    )}
                                                  </td>
                                                  <td className="px-3 py-2 text-center">
                                                    <span
                                                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                        v.stock > 0
                                                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                                                      }`}
                                                    >
                                                      {v.stock > 0
                                                        ? `${v.stock} unit`
                                                        : 'Habis'}
                                                    </span>
                                                  </td>
                                                  <td className="px-3 py-2">
                                                    <div className="flex flex-col gap-1">
                                                      <span
                                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                          v.productActive
                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                        }`}
                                                      >
                                                        <span
                                                          className={`h-1.5 w-1.5 rounded-full ${
                                                            v.productActive
                                                              ? 'bg-emerald-500'
                                                              : 'bg-slate-400'
                                                          }`}
                                                        />
                                                        {v.productActive
                                                          ? 'Aktif'
                                                          : 'Nonaktif'}
                                                      </span>
                                                      <span
                                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                                          v.isTaxable !==
                                                            false &&
                                                          v.storeIsPkp
                                                            ? 'border border-blue-200/80 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300'
                                                            : 'border border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400'
                                                        }`}
                                                      >
                                                        {v.isTaxable !== false
                                                          ? `PPN ${v.storeVatRate ?? 11}%`
                                                          : 'Bebas PPN'}
                                                      </span>
                                                    </div>
                                                  </td>
                                                  <td className="px-3 py-2 text-right">
                                                    <Link
                                                      href={`/dashboard/admin/products/${v.productId}/edit`}
                                                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
                                                    >
                                                      <Edit className="h-3 w-3" />
                                                      <span>Edit</span>
                                                    </Link>
                                                  </td>
                                                </tr>
                                              )
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        /* ========================================================================= */
        /* MODE TABEL DATAR (TRADISIONAL)                                            */
        /* ========================================================================= */
        <div className="shadow-xs rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800">
                  <th className="px-3 pb-3">Unit Gadget</th>
                  <th className="px-3 pb-3">Toko Cabang</th>
                  <th className="px-3 pb-3">Harga Unit</th>
                  <th className="px-3 pb-3 text-center">Stok Unit</th>
                  <th className="px-3 pb-3">Status & Garansi</th>
                  <th className="px-3 pb-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {paginatedProducts.map((item) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={
                            (item.images && item.images[0]) ||
                            'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=120&q=80'
                          }
                          alt={item.name}
                          className="shadow-2xs h-12 w-12 shrink-0 rounded-2xl border border-slate-100 object-cover dark:border-slate-800"
                        />
                        <div className="min-w-0">
                          <p className="line-clamp-1 font-bold text-slate-900 dark:text-white">
                            {item.name}
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                            <span className="font-semibold text-slate-600 dark:text-slate-300">
                              {item.brand || 'Gadget'}
                            </span>
                            <span>•</span>
                            <span>{item.condition || 'BARU'}</span>
                            {item.variants && item.variants.length > 0 && (
                              <>
                                <span>•</span>
                                <span className="font-medium text-orange-600 dark:text-orange-400">
                                  {item.variants.length} Varian
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {item.store
                          ? item.store.name
                          : 'Affiliate Gadget Pusat'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {item.store ? item.store.city : 'Jakarta Pusat'}
                      </p>
                    </td>
                    <td className="px-3 py-4">
                      <span className="text-sm font-black text-slate-950 dark:text-white">
                        Rp {item.price.toLocaleString('id-ID')}
                      </span>
                      {Boolean(
                        item.costPrice && Number(item.costPrice) > 0
                      ) && (
                        <div className="mt-0.5 text-[11px] font-medium text-slate-400">
                          HPP:{' '}
                          <span className="font-mono text-slate-600 dark:text-slate-300">
                            Rp {Number(item.costPrice).toLocaleString('id-ID')}
                          </span>
                          <span className="ml-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            (+
                            {Math.round(
                              ((item.price - Number(item.costPrice)) /
                                item.price) *
                                100
                            )}
                            %)
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-4 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          item.stock > 0
                            ? 'border border-emerald-200/60 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : 'border border-rose-200/60 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                        }`}
                      >
                        {item.stock > 0 ? `${item.stock} Unit` : 'Stok Habis'}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex flex-col gap-1 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              item.isActive
                                ? 'border border-emerald-200/60 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : 'border border-slate-200 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                item.isActive
                                  ? 'bg-emerald-500'
                                  : 'bg-slate-400'
                              }`}
                            />
                            {item.isActive ? 'Aktif di Web' : 'Nonaktif'}
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="h-3.5 w-3.5" /> Garansi{' '}
                          {item.warrantyDays || 30} Hari
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                          <Gift className="h-3 w-3 text-orange-500" /> Free
                          Bonus 3-in-1
                        </span>
                        {/* PPN Badge & Interactive Toggle (Internal Admin View) */}
                        <div className="mt-1 flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={updatingTaxId === item.id}
                            onClick={() =>
                              handleToggleProductTaxable(
                                item.id,
                                item.isTaxable !== false,
                                item.name
                              )
                            }
                            className={`inline-flex select-none items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[10px] font-bold transition ${
                              item.isTaxable !== false
                                ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400'
                                : 'border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400'
                            } ${updatingTaxId === item.id ? 'cursor-wait opacity-50' : 'cursor-pointer'}`}
                            title="Klik untuk mengubah status PPN produk ini"
                          >
                            {updatingTaxId === item.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : item.isTaxable !== false ? (
                              <CheckSquare className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <Square className="h-3 w-3 text-slate-400" />
                            )}
                            <span>
                              {item.isTaxable !== false
                                ? item.store?.isPkp
                                  ? `PPN: Inklusif ${item.store?.vatRate ?? 11}%`
                                  : 'PPN Aktif'
                                : 'Bebas PPN (Rp 0)'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          href={`/dashboard/admin/products/${item.id}/edit`}
                          className="shadow-2xs inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                          <Edit className="h-3 w-3" />
                          <span>Edit</span>
                        </Link>

                        <button
                          onClick={() => handleOpenDelete(item)}
                          className="shadow-2xs inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50/60 p-1.5 text-rose-600 transition hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400"
                          title="Hapus Produk"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>

                        <Link
                          href={`/gadget/${item.id}`}
                          target="_blank"
                          className="shadow-2xs inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          title="Buka Halaman Publik"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer (Flat Table) */}
          <div className="mt-5 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-5 dark:border-slate-800 sm:flex-row">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>
                Menampilkan{' '}
                <strong className="font-bold text-slate-900 dark:text-white">
                  {totalItems === 0 ? 0 : startIndex + 1} - {endIndex}
                </strong>{' '}
                dari{' '}
                <strong className="font-bold text-slate-900 dark:text-white">
                  {totalItems}
                </strong>{' '}
                unit gadget
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="hidden sm:inline">Per halaman:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage <= 1}
                  className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {getPageNumbers().map((page, idx) =>
                  typeof page === 'number' ? (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(page)}
                      className={`h-8 w-8 rounded-xl text-xs font-bold transition-all ${
                        safeCurrentPage === page
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      {page}
                    </button>
                  ) : (
                    <span
                      key={idx}
                      className="px-1 text-xs text-slate-400 dark:text-slate-600"
                    >
                      {page}
                    </span>
                  )
                )}

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={safeCurrentPage >= totalPages}
                  className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Bar for Multi-Selected Color Variants */}
      {selectedVariantIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-wrap items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/95 px-5 py-3 text-white shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-black text-white">
              {selectedVariantIds.size}
            </span>
            <span className="text-xs font-bold text-slate-200">
              Varian Warna Terpilih
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          {/* New Price Input */}
          <div className="relative">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
              Rp
            </span>
            <input
              type="number"
              placeholder="Harga baru..."
              value={bulkNewPrice}
              onChange={(e) => setBulkNewPrice(e.target.value)}
              className="h-8 w-32 rounded-xl border border-slate-700 bg-slate-900 py-1 pl-8 pr-2 text-xs font-bold text-white outline-none focus:border-orange-500"
            />
          </div>

          {/* New Stock Input (Optional) */}
          <input
            type="number"
            placeholder="Stok (opsional)..."
            value={bulkNewStock}
            onChange={(e) => setBulkNewStock(e.target.value)}
            className="h-8 w-28 rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-bold text-white outline-none focus:border-orange-500"
          />

          {/* Apply Bulk Update */}
          <button
            onClick={handleApplySelectedBulkUpdate}
            disabled={bulkUpdating}
            className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-xl bg-orange-500 px-4 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600 active:scale-95 disabled:opacity-50"
          >
            {bulkUpdating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            <span>Terapkan ke Pilihan</span>
          </button>

          {/* Clear / Reset Selection */}
          <button
            onClick={() => setSelectedVariantIds(new Set())}
            className="inline-flex h-8 items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 text-xs font-semibold text-slate-300 transition hover:bg-slate-700"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Batal</span>
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md rounded-3xl border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
              <AlertTriangle className="h-7 w-7" />
            </div>

            <DialogTitle className="text-base font-black text-slate-900 dark:text-white">
              Hapus Produk Gadget?
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Tindakan ini permanen. Produk{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                "{productToDelete?.name}"
              </strong>{' '}
              dan semua variannya akan dihapus dari katalog.
            </DialogDescription>

            <div className="mt-6 flex w-full gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="flex-1 rounded-xl bg-rose-600 py-2 text-xs font-bold text-white shadow-md shadow-rose-600/20 hover:bg-rose-700 disabled:opacity-50"
              >
                {deleteLoading ? (
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                ) : (
                  'Ya, Hapus'
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Excel Bulk Update Modal */}
      {isSuperAdmin && (
        <BulkPriceUpdateModal
          isOpen={isBulkUpdateOpen}
          onClose={() => setIsBulkUpdateOpen(false)}
          onSuccess={() => fetchProducts()}
        />
      )}
    </div>
  )
}
