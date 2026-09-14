'use client'

import { useState, useEffect, useCallback } from 'react'
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
  ArrowUpDown,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { BulkPriceUpdateModal } from '@/components/admin/bulk-price-update-modal'

interface ProductVariant {
  id?: string
  name: string
  ram: string
  storage: string
  color: string
  price: number | string
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
  originalPrice: number | null
  stock: number
  weightGram?: number
  description: string | null
  images: string[]
  specs?: any
  warrantyDays: number
  includesCharger: boolean
  includesScreenProtector: boolean
  includesCase: boolean
  isActive: boolean
  createdAt?: string | Date
  storeId?: string | null
  store?: {
    id: string
    name: string
    city: string
    companyName?: string
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
      a.download = `katalog_gadget_template_${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Data katalog Excel berhasil diekspor!')
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengekspor file Excel.')
    } finally {
      setIsExporting(false)
    }
  }

  const brands = ['ALL', 'Apple', 'Samsung', 'Xiaomi', 'ASUS', 'Vivo', 'Oppo']

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

  const filtered = products.filter((p) => {
    if (statusFilter === 'AKTIF' && !p.isActive) return false
    if (statusFilter === 'NONAKTIF' && p.isActive) return false

    if (!search) return true
    const q = search.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.model && p.model.toLowerCase().includes(q)) ||
      (p.store && p.store.name.toLowerCase().includes(q))
    )
  })

  const sortedProducts = [...filtered].sort((a, b) => {
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

  // Pagination computations
  const totalItems = sortedProducts.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
  const paginatedProducts = sortedProducts.slice(startIndex, endIndex)

  // Reset page to 1 when filters or sort change
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

  // Open Delete Modal
  const handleOpenDelete = (product: ProductItem) => {
    setProductToDelete(product)
    setIsDeleteOpen(true)
  }

  // Confirm Delete
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

  if (!mounted || status === 'loading') {
    return (
      <div className="mx-auto max-w-7xl animate-pulse space-y-5 pb-16">
        <div className="shadow-2xs h-14 w-full rounded-3xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="shadow-xs h-64 rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-16">
      {/* 1. Unified Control Panel: Brand Filter, Status Filter, Search, Sort, and Actions */}
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
        </div>

        {/* Right: Search, Sort, Export, & Add CTA */}
        <div className="flex w-full flex-wrap items-center gap-2 xl:w-auto">
          {/* Search Input */}
          <div className="relative min-w-[200px] flex-1 xl:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama gadget, varian..."
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

          {/* Sort Dropdown */}
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
                <span className="hidden sm:inline">Update Massal</span>
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

      {/* 2. Product Inventory Table & Details */}
      <div className="shadow-xs rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-orange-500" />
            <p className="text-xs font-medium">Memuat katalog gadget toko...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="space-y-4 py-16 text-center text-slate-500">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800">
              <Smartphone className="h-7 w-7 text-slate-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Belum ada produk gadget yang sesuai
              </p>
              <p className="text-xs text-slate-400">
                Silakan ubah kata kunci pencarian atau daftarkan produk baru
                toko Anda.
              </p>
            </div>
            <Link
              href="/dashboard/admin/products/new"
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Gadget Sekarang</span>
            </Link>
          </div>
        ) : (
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
                      </div>
                    </td>
                    <td className="px-3 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Edit Button */}
                        <Link
                          href={`/dashboard/admin/products/${item.id}/edit`}
                          className="shadow-2xs inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                          <Edit className="h-3 w-3" />
                          <span>Edit</span>
                        </Link>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleOpenDelete(item)}
                          className="shadow-2xs inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50/60 p-1.5 text-rose-600 transition hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400"
                          title="Hapus Produk"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>

                        {/* View in Public Store */}
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
        )}

        {/* Pagination Footer */}
        {!loading && sortedProducts.length > 0 && (
          <div className="mt-5 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-5 dark:border-slate-800 sm:flex-row">
            {/* Left: Item Counter Info */}
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

            {/* Right: Controls & Page Buttons */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Items Per Page Select */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="hidden sm:inline">Per halaman:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              {/* Previous Page Button */}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="shadow-2xs inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sebelumnya</span>
              </button>

              {/* Page Number Pills */}
              <div className="flex items-center gap-1">
                {getPageNumbers().map((p, idx) => {
                  if (p === '...') {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-2 py-1 text-xs font-bold text-slate-400"
                      >
                        ...
                      </span>
                    )
                  }
                  const pageNum = Number(p)
                  const isActive = pageNum === safeCurrentPage
                  return (
                    <button
                      key={`page-${pageNum}`}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`h-8 min-w-8 rounded-xl px-2.5 text-xs font-bold transition-all ${
                        isActive
                          ? 'shadow-xs bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>

              {/* Next Page Button */}
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={safeCurrentPage === totalPages}
                className="shadow-2xs inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                title="Halaman Selanjutnya"
              >
                <span className="hidden sm:inline">Selanjutnya</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. DELETE PRODUCT CONFIRMATION MODAL (1.2.3.3 Hapus produk)                */}
      {/* ========================================================================= */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <DialogTitle className="text-lg font-black text-slate-950 dark:text-white">
                Hapus Unit Produk?
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Apakah Anda yakin ingin menghapus{' '}
                <strong className="font-bold text-slate-900 dark:text-white">
                  {productToDelete?.name}
                </strong>
                ? Unit gadget ini tidak akan ditampilkan lagi di katalog toko.
              </DialogDescription>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="rounded-2xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-rose-600/25 hover:bg-rose-700 disabled:opacity-50"
              >
                {deleteLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span>Ya, Hapus Produk</span>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Superadmin Bulk Price Update Excel Modal */}
      {isSuperAdmin && (
        <BulkPriceUpdateModal
          isOpen={isBulkUpdateOpen}
          onClose={() => setIsBulkUpdateOpen(false)}
          onSuccess={() => {
            fetchProducts()
          }}
        />
      )}
    </div>
  )
}
