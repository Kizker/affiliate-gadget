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
  X,
  Save,
  CheckCircle2,
  AlertTriangle,
  Layers,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

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

  useEffect(() => {
    setMounted(true)
  }, [])

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null)
  const [editLoading, setEditLoading] = useState(false)

  // Delete Modal State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<ProductItem | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const isStoreAdmin = session?.user?.role === 'STORE_ADMIN'
  const userStoreId = session?.user?.storeId

  const brands = ['ALL', 'Apple', 'Samsung', 'Xiaomi', 'ASUS', 'Vivo', 'Oppo']

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      let url = '/api/gadgets?'
      if (selectedBrand !== 'ALL') url += `brand=${encodeURIComponent(selectedBrand)}&`
      if (isStoreAdmin && userStoreId) url += `storeId=${encodeURIComponent(userStoreId)}&`
      
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
  }, [selectedBrand, isStoreAdmin, userStoreId])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const filtered = products.filter((p) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.model && p.model.toLowerCase().includes(q)) ||
      (p.store && p.store.name.toLowerCase().includes(q))
    )
  })

  // Open Edit Modal
  const handleOpenEdit = (product: ProductItem) => {
    setEditingProduct({
      ...product,
      variants: product.variants && product.variants.length > 0
        ? JSON.parse(JSON.stringify(product.variants))
        : [
            {
              name: 'Standar',
              ram: '8GB',
              storage: '128GB',
              color: 'Default',
              price: product.price,
              stock: product.stock,
            },
          ],
    })
    setIsEditOpen(true)
  }

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return

    setEditLoading(true)
    try {
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProduct),
      })

      const result = await res.json()
      if (res.ok && result.success) {
        toast.success('Detail produk berhasil diperbarui!')
        setIsEditOpen(false)
        fetchProducts()
      } else {
        toast.error(result.error || 'Gagal memperbarui produk')
      }
    } catch (error) {
      console.error('Error updating product:', error)
      toast.error('Terjadi kesalahan saat menyimpan')
    } finally {
      setEditLoading(false)
    }
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

  // Variant Helpers
  const addVariant = () => {
    if (!editingProduct) return
    setEditingProduct({
      ...editingProduct,
      variants: [
        ...(editingProduct.variants || []),
        {
          name: 'Varian Baru',
          ram: '8GB',
          storage: '256GB',
          color: 'Hitam',
          price: editingProduct.price,
          stock: 1,
        },
      ],
    })
  }

  const removeVariant = (index: number) => {
    if (!editingProduct || !editingProduct.variants) return
    const updated = editingProduct.variants.filter((_, i) => i !== index)
    setEditingProduct({ ...editingProduct, variants: updated })
  }

  const updateVariant = (index: number, field: string, value: any) => {
    if (!editingProduct || !editingProduct.variants) return
    const updated = [...editingProduct.variants]
    updated[index] = { ...updated[index], [field]: value }
    setEditingProduct({ ...editingProduct, variants: updated })
  }

  if (!mounted || status === 'loading') {
    return (
      <div className="space-y-5 max-w-7xl mx-auto pb-16 animate-pulse">
        <div className="h-14 w-full rounded-3xl border border-slate-200/80 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16">
      {/* 1. Unified Control Panel: Brand Filter, Search, and Add Button */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-2.5 sm:p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        {/* Left: Brand Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100/80 rounded-2xl dark:bg-slate-800/80 no-scrollbar">
          {brands.map((b) => (
            <button
              key={b}
              onClick={() => setSelectedBrand(b)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                selectedBrand === b
                  ? 'bg-white text-slate-950 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {b === 'ALL' ? 'Semua Merek' : b}
            </button>
          ))}
        </div>

        {/* Right: Search & Add Product CTA */}
        <div className="flex items-center gap-2 w-full xl:w-auto">
          <div className="relative flex-1 xl:w-72">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama gadget, varian, atau spesifikasi..."
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

          <Link
            href="/dashboard/admin/products/new"
            className="inline-flex items-center gap-1.5 rounded-2xl bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition-all hover:bg-orange-600 active:scale-95 whitespace-nowrap shrink-0"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Tambah Gadget</span>
          </Link>
        </div>
      </div>

      {/* 2. Product Inventory Table & Details */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-500 mb-2" />
            <p className="text-xs font-medium">Memuat katalog gadget toko...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800">
              <Smartphone className="h-7 w-7 text-slate-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Belum ada produk gadget yang sesuai
              </p>
              <p className="text-xs text-slate-400">
                Silakan ubah kata kunci pencarian atau daftarkan produk baru toko Anda.
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
                  <th className="pb-3 px-3">Unit Gadget</th>
                  <th className="pb-3 px-3">Toko Cabang</th>
                  <th className="pb-3 px-3">Harga Unit</th>
                  <th className="pb-3 px-3 text-center">Stok Unit</th>
                  <th className="pb-3 px-3">Proteksi & Bonus</th>
                  <th className="pb-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                  >
                    <td className="py-4 px-3">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={
                            (item.images && item.images[0]) ||
                            'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=120&q=80'
                          }
                          alt={item.name}
                          className="h-12 w-12 rounded-2xl object-cover border border-slate-100 shadow-2xs dark:border-slate-800 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white line-clamp-1">
                            {item.name}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span className="font-semibold text-slate-600 dark:text-slate-300">
                              {item.brand || 'Gadget'}
                            </span>
                            <span>•</span>
                            <span>{item.condition || 'BARU'}</span>
                            {item.variants && item.variants.length > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-orange-600 dark:text-orange-400 font-medium">
                                  {item.variants.length} Varian
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-3">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {item.store ? item.store.name : 'Affiliate Gadget Pusat'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {item.store ? item.store.city : 'Jakarta Pusat'}
                      </p>
                    </td>
                    <td className="py-4 px-3">
                      <span className="font-black text-slate-950 dark:text-white text-sm">
                        Rp {item.price.toLocaleString('id-ID')}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          item.stock > 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : 'bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400'
                        }`}
                      >
                        {item.stock > 0 ? `${item.stock} Unit` : 'Stok Habis'}
                      </span>
                    </td>
                    <td className="py-4 px-3">
                      <div className="flex flex-col gap-1 text-[11px]">
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="h-3.5 w-3.5" /> Garansi {item.warrantyDays || 30} Hari
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                          <Gift className="h-3 w-3 text-orange-500" /> Free Bonus 3-in-1
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                          <Edit className="h-3 w-3" />
                          <span>Edit</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleOpenDelete(item)}
                          className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50/60 p-1.5 text-rose-600 shadow-2xs transition hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400"
                          title="Hapus Produk"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>

                        {/* View in Public Store */}
                        <Link
                          href={`/gadget/${item.id}`}
                          target="_blank"
                          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-1.5 text-slate-500 shadow-2xs transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
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
      </div>

      {/* ========================================================================= */}
      {/* 3. EDIT PRODUCT MODAL (1.2.3.2 Edit detail produk)                        */}
      {/* ========================================================================= */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
          {editingProduct && (
            <form onSubmit={handleSaveEdit} className="space-y-6">
              <DialogHeader>
                <div className="flex items-center gap-2 text-xs font-bold text-orange-600 dark:text-orange-400">
                  <Smartphone className="h-4 w-4" />
                  <span>Edit Detail Produk Toko</span>
                </div>
                <DialogTitle className="text-xl font-black text-slate-950 dark:text-white">
                  {editingProduct.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Perbarui informasi harga, stok fisik, varian RAM/Storage, dan paket bonus 3-in-1.
                </DialogDescription>
              </DialogHeader>

              {/* Form Grid */}
              <div className="space-y-4 text-xs">
                {/* Name & Brand */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Produk Gadget *
                    </label>
                    <input
                      type="text"
                      value={editingProduct.name}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, name: e.target.value })
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-medium outline-none focus:border-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Merek / Brand *
                    </label>
                    <select
                      value={editingProduct.brand || 'Apple'}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, brand: e.target.value })
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-medium outline-none focus:border-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="Apple">Apple</option>
                      <option value="Samsung">Samsung</option>
                      <option value="Xiaomi">Xiaomi</option>
                      <option value="ASUS">ASUS</option>
                      <option value="Vivo">Vivo</option>
                      <option value="Oppo">Oppo</option>
                    </select>
                  </div>
                </div>

                {/* Price & Stock */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Harga Dasar (Rp) *
                    </label>
                    <input
                      type="number"
                      value={editingProduct.price}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-medium outline-none focus:border-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Stok Unit Fisik *
                    </label>
                    <input
                      type="number"
                      value={editingProduct.stock}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          stock: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-medium outline-none focus:border-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Kondisi Unit
                    </label>
                    <select
                      value={editingProduct.condition}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, condition: e.target.value })
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-medium outline-none focus:border-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="LIKE_NEW">Second Like New (Mulus 99%)</option>
                      <option value="SECOND_MULUS">Second Mulus (95% - 98%)</option>
                      <option value="GRADE_A">Second Grade A (Normal 100%)</option>
                    </select>
                  </div>
                </div>

                {/* Variants Section */}
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                      <Layers className="h-4 w-4 text-orange-500" />
                      <span>Daftar Varian RAM & Storage ({editingProduct.variants?.length || 0})</span>
                    </div>
                    <button
                      type="button"
                      onClick={addVariant}
                      className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1 text-[11px] font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Tambah Varian</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {editingProduct.variants?.map((v, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-12 gap-2 items-center rounded-xl bg-white p-2.5 border border-slate-200/80 dark:bg-slate-900 dark:border-slate-700"
                      >
                        <div className="col-span-4">
                          <input
                            type="text"
                            placeholder="Nama Varian (misal: 256GB Titanium)"
                            value={v.name}
                            onChange={(e) => updateVariant(idx, 'name', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="number"
                            placeholder="Harga (Rp)"
                            value={v.price}
                            onChange={(e) => updateVariant(idx, 'price', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            placeholder="Stok"
                            value={v.stock}
                            onChange={(e) => updateVariant(idx, 'stock', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="text"
                            placeholder="Warna"
                            value={v.color}
                            onChange={(e) => updateVariant(idx, 'color', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                        </div>
                        <div className="col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => removeVariant(idx)}
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bonus 3-in-1 and Warranty Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2 dark:border-slate-800 dark:bg-slate-800/40">
                    <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Gift className="h-3.5 w-3.5 text-orange-500" />
                      <span>Paket Bonus 3-in-1 Gratis:</span>
                    </p>
                    <label className="flex items-center gap-2 font-medium text-slate-600 dark:text-slate-400">
                      <input
                        type="checkbox"
                        checked={editingProduct.includesCharger}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            includesCharger: e.target.checked,
                          })
                        }
                        className="rounded accent-orange-500"
                      />
                      <span>Kepala Charger & Kabel Fast Charging</span>
                    </label>
                    <label className="flex items-center gap-2 font-medium text-slate-600 dark:text-slate-400">
                      <input
                        type="checkbox"
                        checked={editingProduct.includesScreenProtector}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            includesScreenProtector: e.target.checked,
                          })
                        }
                        className="rounded accent-orange-500"
                      />
                      <span>Tempered Glass Terpasang Rapi</span>
                    </label>
                    <label className="flex items-center gap-2 font-medium text-slate-600 dark:text-slate-400">
                      <input
                        type="checkbox"
                        checked={editingProduct.includesCase}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            includesCase: e.target.checked,
                          })
                        }
                        className="rounded accent-orange-500"
                      />
                      <span>Silicone Shockproof Case</span>
                    </label>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-3 dark:border-slate-800 dark:bg-slate-800/40">
                    <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Garansi Toko Cabang:</span>
                    </p>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">
                        Durasi Garansi Tukar Unit (Hari):
                      </label>
                      <input
                        type="number"
                        value={editingProduct.warrantyDays}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            warrantyDays: parseInt(e.target.value) || 30,
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="rounded-2xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-6 py-2.5 text-xs font-bold text-white shadow-sm shadow-orange-500/25 hover:bg-orange-600 disabled:opacity-50"
                >
                  {editLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>Simpan Perubahan</span>
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 4. DELETE PRODUCT CONFIRMATION MODAL (1.2.3.3 Hapus produk)                */}
      {/* ========================================================================= */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <DialogTitle className="text-lg font-black text-slate-950 dark:text-white">
                Hapus Unit Produk?
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Apakah Anda yakin ingin menghapus{' '}
                <strong className="text-slate-900 dark:text-white font-bold">
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
    </div>
  )
}
