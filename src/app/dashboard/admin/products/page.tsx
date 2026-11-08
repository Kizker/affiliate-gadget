'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { usePageGuard } from '@/hooks/use-page-guard'
import {
  Search,
  Plus,
  Loader2,
  ExternalLink,
  Edit,
  Trash2,
  AlertTriangle,
  X,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  Layers,
  List,
  Check,
  Eye,
  EyeOff,
  MoreVertical,
  CheckSquare,
  Square,
  RotateCcw,
  Sparkles,
  Percent,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { CustomSelect } from '@/components/ui/custom-select'
import { BulkPriceUpdateModal } from '@/components/admin/bulk-price-update-modal'
import { EtalaseFormModal } from '@/components/admin/etalase-form-modal'
import { buildCatalogHierarchy, BrandGroup } from '@/lib/catalog-hierarchy'
import {
  evaluateProduct,
  categorizeProductsByTab,
  formatPriceDisplay,
  EvaluatedProduct,
  ProductIssue,
} from '@/lib/shopee-product-utils'

type ShopeeTab = 'ALL' | 'LIVE' | 'ACTION_REQUIRED' | 'HIDDEN'
type ViewMode = 'list' | 'hierarchy'
type IssueFilter =
  | 'ALL_ISSUES'
  | 'NO_SKU'
  | 'PRICE_BELOW_COST'
  | 'PRICE_RATIO_EXCEEDED'
  | 'OUT_OF_STOCK_ACTIVE'
  | 'SKU_STOCK_DESYNC'

export default function ProductsPage() {
  const router = useRouter()
  const { isLoading: guardLoading, isAllowed } = usePageGuard(
    '/dashboard/admin/products'
  )
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)

  // Data states
  const [rawProducts, setRawProducts] = useState<any[]>([])
  const [etalases, setEtalases] = useState<any[]>([])
  const [catalogSection, setCatalogSection] = useState<'ETALASE' | 'PRODUCTS'>(
    'ETALASE'
  )
  const [expandedEtalaseIds, setExpandedEtalaseIds] = useState<
    Record<string, boolean>
  >({})
  const [isEtalaseModalOpen, setIsEtalaseModalOpen] = useState(false)
  const [editingEtalase, setEditingEtalase] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [stores, setStores] = useState<
    Array<{ id: string; name: string; city?: string }>
  >([])
  const [selectedStoreId, setSelectedStoreId] = useState<string>('ALL')

  // Shopee Navigation & Filters
  const [activeTab, setActiveTab] = useState<ShopeeTab>('ALL')
  const [activeIssueFilter, setActiveIssueFilter] =
    useState<IssueFilter>('ALL_ISSUES')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [search, setSearch] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('ALL')
  const [sortBy, setSortBy] = useState<
    | 'latest'
    | 'price_desc'
    | 'price_asc'
    | 'stock_desc'
    | 'stock_asc'
    | 'name_asc'
  >('latest')

  // Accordion & Multi-select states
  const [expandedProductIds, setExpandedProductIds] = useState<
    Record<string, boolean>
  >({})
  const [showAllVariantsMap, setShowAllVariantsMap] = useState<
    Record<string, boolean>
  >({})
  const [expandedBrands, setExpandedBrands] = useState<Record<string, boolean>>(
    {}
  )
  const [expandedSeries, setExpandedSeries] = useState<Record<string, boolean>>(
    {}
  )
  const [expandedCapacities, setExpandedCapacities] = useState<
    Record<string, boolean>
  >({})

  // Inline edit state for variants/products in list view
  const [editingVariant, setEditingVariant] = useState<
    Record<
      string,
      { price: string; costPrice: string; stock: string; sku: string }
    >
  >({})
  const [savingVariantId, setSavingVariantId] = useState<string | null>(null)

  // Capacity price update in hierarchy mode
  const [capacityPriceInputs, setCapacityPriceInputs] = useState<
    Record<string, string>
  >({})
  const [updatingCapacity, setUpdatingCapacity] = useState<string | null>(null)

  // Multi-select for bulk updates
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<string>>(
    new Set()
  )
  const [bulkNewPrice, setBulkNewPrice] = useState<string>('')
  const [bulkNewStock, setBulkNewStock] = useState<string>('')
  const [bulkUpdating, setBulkUpdating] = useState<boolean>(false)

  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<any | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Action menu popover
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  // Syncing SKU Master state
  const [syncingSku, setSyncingSku] = useState<string | null>(null)

  // Mass Update Modal (Phase 2 integration)
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const isStoreAdmin = session?.user?.role === 'STORE_ADMIN'
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'
  const userStoreId = session?.user?.storeId

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search)
      const sec = sp.get('section')
      if (sec === 'products') setCatalogSection('PRODUCTS')
      else if (sec === 'etalase') setCatalogSection('ETALASE')
    }
  }, [])

  // Load stores list
  useEffect(() => {
    fetch('/api/stores?scoped=true')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setStores(data.data)
          if (isStoreAdmin && userStoreId) {
            setSelectedStoreId(userStoreId)
          }
        }
      })
      .catch((e) => console.error('Failed to load stores:', e))
  }, [isStoreAdmin, userStoreId])

  // Fetch all products (active & inactive)
  const fetchProducts = useCallback(async () => {
    if (status === 'loading') return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', '500')
      params.set('_t', String(Date.now()))

      if (isStoreAdmin && userStoreId) {
        params.set('storeId', userStoreId)
      } else if (selectedStoreId && selectedStoreId !== 'ALL') {
        params.set('storeId', selectedStoreId)
      }

      const [res, etaRes] = await Promise.all([
        fetch(`/api/admin/products?${params.toString()}`, {
          cache: 'no-store',
        }),
        fetch(`/api/admin/etalase?${params.toString()}`, {
          cache: 'no-store',
        }),
      ])
      const data = await res.json()
      const etaData = await etaRes.json().catch(() => ({}))
      if (etaRes.ok && Array.isArray(etaData.etalases)) {
        setEtalases(etaData.etalases)
      }
      if (res.ok && data.products) {
        setRawProducts(data.products)
      } else {
        // Fallback to gadgets API if admin products fails
        const fbRes = await fetch(
          `/api/gadgets?scoped=true&rawProducts=true&${isStoreAdmin && userStoreId ? `storeId=${userStoreId}&` : ''}limit=200`
        )
        const fbData = await fbRes.json()
        if (fbData.success) {
          setRawProducts(fbData.data || [])
        }
      }
    } catch (e) {
      console.error(e)
      toast.error('Gagal memuat katalog gadget')
    } finally {
      setLoading(false)
    }
  }, [selectedStoreId, isStoreAdmin, userStoreId, status])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Evaluated products with unified stats and issue detection
  const evaluatedProducts = useMemo(() => {
    return rawProducts.map((p) => evaluateProduct(p, rawProducts))
  }, [rawProducts])

  // Tab counts
  const tabCounts = useMemo(() => {
    return categorizeProductsByTab(evaluatedProducts)
  }, [evaluatedProducts])

  // Active store display name
  const currentStoreName = useMemo(() => {
    if (isStoreAdmin) {
      const myStore = stores.find((s) => s.id === userStoreId)
      return myStore ? myStore.name : 'Cabang Toko Anda'
    }
    if (selectedStoreId === 'ALL') {
      return 'Semua Cabang Toko (Konsolidasi)'
    }
    const targetStore = stores.find((s) => s.id === selectedStoreId)
    return targetStore ? targetStore.name : 'Semua Cabang'
  }, [isStoreAdmin, userStoreId, selectedStoreId, stores])

  // Filter products by Shopee Tab, Search, Brand, and Issues
  const filteredProducts = useMemo(() => {
    return evaluatedProducts.filter((p) => {
      // 1. Tab filter
      if (activeTab === 'LIVE') {
        if (!p.isActive || p.totalStock <= 0 || p.issues.length > 0)
          return false
      } else if (activeTab === 'ACTION_REQUIRED') {
        if (p.issues.length === 0) return false
        if (activeIssueFilter !== 'ALL_ISSUES') {
          const hasSpecific = p.issues.some((i) => i.type === activeIssueFilter)
          if (!hasSpecific) return false
        }
      } else if (activeTab === 'HIDDEN') {
        if (p.isActive) return false
      }

      // 2. Brand filter
      if (
        selectedBrand !== 'ALL' &&
        p.brand.toLowerCase() !== selectedBrand.toLowerCase()
      ) {
        return false
      }

      // 3. Search query
      if (search.trim()) {
        const q = search.toLowerCase().trim()
        const matchName = p.name.toLowerCase().includes(q)
        const matchBrand = p.brand.toLowerCase().includes(q)
        const matchModel = p.model?.toLowerCase().includes(q) || false
        const matchStore = p.storeName?.toLowerCase().includes(q) || false
        const matchVariant = p.variants.some(
          (v) =>
            v.name?.toLowerCase().includes(q) ||
            v.color?.toLowerCase().includes(q) ||
            v.sku?.toLowerCase().includes(q)
        )
        if (
          !matchName &&
          !matchBrand &&
          !matchModel &&
          !matchStore &&
          !matchVariant
        ) {
          return false
        }
      }

      return true
    })
  }, [evaluatedProducts, activeTab, activeIssueFilter, selectedBrand, search])

  // Sorting
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      if (sortBy === 'price_desc') return b.minPrice - a.minPrice
      if (sortBy === 'price_asc') return a.minPrice - b.minPrice
      if (sortBy === 'stock_desc') return b.totalStock - a.totalStock
      if (sortBy === 'stock_asc') return a.totalStock - b.totalStock
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name)
      // latest
      return (
        new Date(b.raw.createdAt || 0).getTime() -
        new Date(a.raw.createdAt || 0).getTime()
      )
    })
  }, [filteredProducts, sortBy])

  // Hierarchy Tree from filtered products (100% consistent)
  const hierarchyTree = useMemo(() => {
    return buildCatalogHierarchy(filteredProducts.map((p) => p.raw))
  }, [filteredProducts])

  // Auto-expand brands on search
  useEffect(() => {
    if (selectedBrand !== 'ALL') {
      setExpandedBrands((prev) => ({ ...prev, [selectedBrand]: true }))
    }
    if (search.trim()) {
      const allB: Record<string, boolean> = {}
      const allS: Record<string, boolean> = {}
      hierarchyTree.forEach((b) => {
        allB[b.brand] = true
        b.series.forEach((s) => {
          allS[`${b.brand}-${s.seriesName}`] = true
        })
      })
      setExpandedBrands(allB)
      setExpandedSeries(allS)
    }
  }, [selectedBrand, search, hierarchyTree])

  // Toggle Etalase active/hidden
  const handleToggleEtalaseActive = async (
    etalaseId: string,
    currentActive: boolean
  ) => {
    try {
      const res = await fetch(`/api/admin/etalase/${etalaseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      })
      if (!res.ok) throw new Error('Gagal memperbarui status etalase')
      toast.success(
        !currentActive
          ? 'Etalase diaktifkan ke halaman depan!'
          : 'Etalase disembunyikan dari halaman depan.'
      )
      fetchProducts()
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status etalase')
    }
  }

  // 1-Click Jadikan Produk sebagai Cover Etalase
  const handleSetEtalaseCoverProduct = async (
    etalaseId: string,
    productId: string
  ) => {
    try {
      const res = await fetch(`/api/admin/etalase/${etalaseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coverProductId: productId,
          customCoverImage: null,
        }),
      })
      if (!res.ok) throw new Error('Gagal mengatur cover etalase')
      toast.success('Barang berhasil dijadikan Cover Etalase!')
      fetchProducts()
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah cover etalase')
    }
  }

  // Hapus Etalase
  const handleDeleteEtalase = async (eta: any) => {
    try {
      const res = await fetch(`/api/admin/etalase/${eta.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Gagal menghapus etalase')
      toast.success(`Etalase "${eta.name}" berhasil dihapus`)
      fetchProducts()
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus etalase')
    }
  }

  const filteredEtalases = useMemo(() => {
    return etalases.filter((e) => {
      if (activeTab === 'LIVE' && (!e.isActive || e.stock <= 0)) return false
      if (activeTab === 'HIDDEN' && e.isActive) return false
      if (
        selectedBrand !== 'ALL' &&
        e.brand?.toLowerCase() !== selectedBrand.toLowerCase()
      ) {
        return false
      }
      if (search.trim()) {
        const q = search.toLowerCase().trim()
        const matchTitle = e.name?.toLowerCase().includes(q)
        const matchItems =
          Array.isArray(e.etalaseItems) &&
          e.etalaseItems.some(
            (i: any) =>
              i.label?.toLowerCase().includes(q) ||
              i.product?.name?.toLowerCase().includes(q)
          )
        if (!matchTitle && !matchItems) return false
      }
      return true
    })
  }, [etalases, activeTab, selectedBrand, search])

  // Toggle single product active/hidden
  const handleToggleProductActive = async (
    productId: string,
    currentActive: boolean
  ) => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      })
      if (!res.ok) throw new Error('Gagal memperbarui status produk')
      toast.success(
        !currentActive
          ? 'Produk berhasil diaktifkan ke etalase Live!'
          : 'Produk berhasil disembunyikan dari etalase publik.'
      )
      fetchProducts()
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status produk')
    }
  }

  // Toggle single product taxability (PPN)
  const handleToggleProductTaxable = async (
    productId: string,
    currentTaxable: boolean
  ) => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTaxable: !currentTaxable }),
      })
      if (!res.ok) throw new Error('Gagal memperbarui status pajak produk')
      toast.success(
        !currentTaxable
          ? 'PPN 11% berhasil diaktifkan untuk produk ini'
          : 'PPN dinonaktifkan untuk produk ini'
      )
      fetchProducts()
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status PPN')
    }
  }

  // Delete product action
  const confirmDeleteProduct = async () => {
    if (!productToDelete) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/products/${productToDelete.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || 'Gagal menghapus produk')
      }
      toast.success(`Produk "${productToDelete.name}" berhasil dihapus.`)
      setIsDeleteOpen(false)
      setProductToDelete(null)
      fetchProducts()
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus produk')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Inline edit save for variant (List Mode)
  const handleSaveInlineVariant = async (
    productId: string,
    variantId: string
  ) => {
    const editData = editingVariant[variantId]
    if (!editData) return

    setSavingVariantId(variantId)
    try {
      const numPrice = parseFloat(editData.price.replace(/\./g, ''))
      const numCostPrice = editData.costPrice
        ? parseFloat(editData.costPrice.replace(/\./g, ''))
        : null
      const numStock = parseInt(editData.stock) || 0

      // Call bulk color update / single variant update
      const res = await fetch(
        '/api/admin/products/variants/bulk-color-update',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            variantIds: [variantId],
            newPrice: numPrice,
            newStock: numStock,
          }),
        }
      )
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || 'Gagal menyimpan perubahan variasi')
      }

      // Also update SKU and costPrice via product PATCH if supported
      if (editData.sku !== undefined || numCostPrice !== null) {
        const prod = rawProducts.find((p) => p.id === productId)
        if (prod && Array.isArray(prod.variants)) {
          const updatedVars = prod.variants.map((v: any) => {
            if (v.id === variantId) {
              return {
                ...v,
                price: numPrice,
                stock: numStock,
                costPrice: numCostPrice,
                sku: editData.sku?.trim() || null,
              }
            }
            return v
          })

          await fetch(`/api/products/${productId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ variants: updatedVars }),
          })
        }
      }

      toast.success('Variasi berhasil diperbarui')
      // Remove from editing state
      setEditingVariant((prev) => {
        const next = { ...prev }
        delete next[variantId]
        return next
      })
      fetchProducts()
    } catch (err: any) {
      toast.error(err.message || 'Gagal memperbarui variasi')
    } finally {
      setSavingVariantId(null)
    }
  }

  // Apply one price to all color variants in a capacity group (Hierarchy Mode)
  const handleApplyCapacityPrice = async (cap: any, targetPriceStr: string) => {
    if (!targetPriceStr) {
      toast.error('Masukkan nominal harga terlebih dahulu')
      return
    }
    const cleanPrice = parseFloat(targetPriceStr.replace(/\./g, ''))
    if (isNaN(cleanPrice) || cleanPrice <= 0) {
      toast.error('Nominal harga tidak valid')
      return
    }

    setUpdatingCapacity(cap.capacityKey)
    try {
      const varIds = cap.variants.map((v: any) => v.id)
      const res = await fetch(
        '/api/admin/products/variants/bulk-color-update',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            variantIds: varIds,
            newPrice: cleanPrice,
          }),
        }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Gagal menerapkan harga kapasitas')
      }
      toast.success(
        `Harga Rp ${cleanPrice.toLocaleString('id-ID')} diterapkan ke ${varIds.length} variasi warna!`
      )
      fetchProducts()
    } catch (err: any) {
      toast.error(err.message || 'Gagal menerapkan harga')
    } finally {
      setUpdatingCapacity(null)
    }
  }

  // 1-Click Master SKU stock sync
  const handleSyncSkuStock = async (sku: string, targetStock: number) => {
    setSyncingSku(sku)
    try {
      const res = await fetch('/api/admin/products/variants/sync-sku-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku, targetStock }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menyamakan stok SKU')
      toast.success(
        json.message || `Stok seluruh variasi SKU "${sku}" berhasil disamakan!`
      )
      fetchProducts()
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyamakan stok SKU')
    } finally {
      setSyncingSku(null)
    }
  }

  // Multi-select actions
  const toggleSelectAll = () => {
    const allVarIds: string[] = []
    filteredProducts.forEach((p) => {
      if (p.variants.length > 0) {
        p.variants.forEach((v) => {
          if (v.id) allVarIds.push(v.id)
        })
      } else {
        allVarIds.push(`prod-only-${p.id}`)
      }
    })

    if (selectedVariantIds.size >= allVarIds.length && allVarIds.length > 0) {
      setSelectedVariantIds(new Set())
    } else {
      setSelectedVariantIds(new Set(allVarIds))
    }
  }

  const toggleSelectVariant = (id: string) => {
    setSelectedVariantIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBulkUpdateSelected = async () => {
    if (selectedVariantIds.size === 0) return
    const numPrice = bulkNewPrice
      ? parseFloat(bulkNewPrice.replace(/\./g, ''))
      : undefined
    const numStock = bulkNewStock ? parseInt(bulkNewStock) : undefined

    if (numPrice === undefined && numStock === undefined) {
      toast.error('Masukkan harga atau stok baru terlebih dahulu')
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
            newPrice: numPrice,
            newStock: numStock,
          }),
        }
      )
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || 'Gagal memperbarui variasi terpilih')
      }
      toast.success(
        `Berhasil memperbarui ${selectedVariantIds.size} variasi terpilih!`
      )
      setSelectedVariantIds(new Set())
      setBulkNewPrice('')
      setBulkNewStock('')
      fetchProducts()
    } catch (err: any) {
      toast.error(err.message || 'Gagal memperbarui massal')
    } finally {
      setBulkUpdating(false)
    }
  }

  const brandsList = [
    'ALL',
    'Samsung',
    'Apple',
    'Xiaomi',
    'ASUS',
    'Vivo',
    'Oppo',
    'Realme',
  ]

  if (guardLoading || !isAllowed) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-24 text-slate-900 dark:text-slate-100">
      {/* 1. Header Shopee Style: Judul + Nama Cabang + Aksi Utama */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Katalog Gadget
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Mengelola:</span>
            {isSuperAdmin ? (
              <div className="w-56">
                <CustomSelect
                  value={selectedStoreId}
                  onChange={(val) => setSelectedStoreId(val)}
                  options={[
                    { value: 'ALL', label: 'Semua Cabang Toko (Konsolidasi)' },
                    ...stores.map((s) => ({
                      value: s.id,
                      label: `${s.name} ${s.city ? `(${s.city})` : ''}`,
                    })),
                  ]}
                  size="sm"
                />
              </div>
            ) : (
              <span className="font-semibold text-orange-600 dark:text-orange-400">
                {currentStoreName}
              </span>
            )}
            <span>•</span>
            <span>{filteredProducts.length} Produk ditampilkan</span>
          </div>
        </div>

        {/* Action Buttons: Update Massal & Tambah Gadget */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsBulkUpdateOpen(true)}
            className="shadow-xs inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-orange-300 hover:bg-orange-50/30 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <FileSpreadsheet className="h-4 w-4 text-orange-600" />
            <span>Update massal</span>
          </button>

          <Link
            href="/dashboard/admin/products/new"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/20 transition hover:bg-orange-600 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah gadget</span>
          </Link>
        </div>
      </div>

      {/* 2. Shopee Navigation Tabs: Semua, Live, Perlu Tindakan, Disembunyikan */}
      <div className="flex flex-col gap-3 border-b border-slate-200 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="no-scrollbar flex overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('ALL')
              setActiveIssueFilter('ALL_ISSUES')
            }}
            className={`relative min-h-[44px] shrink-0 px-4 py-2.5 text-xs font-bold transition ${
              activeTab === 'ALL'
                ? 'border-b-2 border-orange-500 text-orange-600 dark:text-orange-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <span>Semua</span>
            <span
              className={`ml-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === 'ALL'
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {tabCounts.allCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('LIVE')
              setActiveIssueFilter('ALL_ISSUES')
            }}
            className={`relative min-h-[44px] shrink-0 px-4 py-2.5 text-xs font-bold transition ${
              activeTab === 'LIVE'
                ? 'border-b-2 border-orange-500 text-orange-600 dark:text-orange-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <span>Live</span>
            <span
              className={`ml-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === 'LIVE'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {tabCounts.liveCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ACTION_REQUIRED')}
            className={`relative min-h-[44px] shrink-0 px-4 py-2.5 text-xs font-bold transition ${
              activeTab === 'ACTION_REQUIRED'
                ? 'border-b-2 border-orange-500 text-orange-600 dark:text-orange-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <span>Perlu tindakan</span>
            <span
              className={`ml-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                tabCounts.actionRequiredCount > 0
                  ? 'bg-rose-500 text-white'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {tabCounts.actionRequiredCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('HIDDEN')
              setActiveIssueFilter('ALL_ISSUES')
            }}
            className={`relative min-h-[44px] shrink-0 px-4 py-2.5 text-xs font-bold transition ${
              activeTab === 'HIDDEN'
                ? 'border-b-2 border-orange-500 text-orange-600 dark:text-orange-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <span>Disembunyikan</span>
            <span
              className={`ml-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === 'HIDDEN'
                  ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {tabCounts.hiddenCount}
            </span>
          </button>
        </div>

        {/* View Mode Switcher: Mode Daftar vs Mode Per Merek */}
        <div className="flex items-center gap-1 self-end pb-1.5 sm:self-center sm:pb-0">
          <span className="mr-1 text-[11px] font-semibold text-slate-400">
            Tampilan:
          </span>
          <div className="flex rounded-xl border border-slate-200 bg-slate-100/80 p-0.5 dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                viewMode === 'list'
                  ? 'shadow-xs bg-white text-orange-600 dark:bg-slate-800 dark:text-orange-400'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Mode Daftar</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('hierarchy')}
              className={`flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                viewMode === 'hierarchy'
                  ? 'shadow-xs bg-white text-orange-600 dark:bg-slate-800 dark:text-orange-400'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Mode Per merek</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-filters for "Perlu Tindakan" */}
      {activeTab === 'ACTION_REQUIRED' && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-rose-200/60 bg-rose-50/40 p-2.5 dark:border-rose-950/40 dark:bg-rose-950/10">
          <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400">
            Filter Masalah:
          </span>
          {[
            { key: 'ALL_ISSUES', label: 'Semua Masalah' },
            { key: 'NO_SKU', label: 'Tanpa SKU' },
            { key: 'PRICE_BELOW_COST', label: 'Harga < HPP' },
            { key: 'PRICE_RATIO_EXCEEDED', label: 'Rasio Harga > 7x' },
            { key: 'OUT_OF_STOCK_ACTIVE', label: 'Stok Habis (Live)' },
            { key: 'SKU_STOCK_DESYNC', label: 'Stok SKU Berbeda' },
          ].map((sub) => (
            <button
              key={sub.key}
              type="button"
              onClick={() => setActiveIssueFilter(sub.key as IssueFilter)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                activeIssueFilter === sub.key
                  ? 'shadow-xs bg-rose-600 text-white'
                  : 'bg-white/80 text-rose-800 hover:bg-white dark:bg-slate-900 dark:text-rose-300'
              }`}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}

      {/* 3. Search & Sort Controls Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama produk, SKU, variasi warna..."
            className="focus:outline-hidden min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-9 text-xs font-medium text-slate-900 transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Brand & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Brand Dropdown */}
          <div className="w-36">
            <CustomSelect
              value={selectedBrand}
              onChange={(b) => setSelectedBrand(b)}
              options={brandsList.map((b) => ({
                value: b,
                label: b === 'ALL' ? 'Semua Merek' : b,
              }))}
              size="sm"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="w-44">
            <CustomSelect
              value={sortBy}
              onChange={(s: any) => setSortBy(s)}
              options={[
                { value: 'latest', label: 'Urutan Terbaru' },
                { value: 'price_desc', label: 'Harga Tertinggi' },
                { value: 'price_asc', label: 'Harga Terendah' },
                { value: 'stock_desc', label: 'Stok Terbanyak' },
                { value: 'stock_asc', label: 'Stok Terendah' },
                { value: 'name_asc', label: 'Nama A - Z' },
              ]}
              size="sm"
            />
          </div>

          {/* Refresh button */}
          <button
            type="button"
            onClick={fetchProducts}
            disabled={loading}
            className="flex min-h-[44px] w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
            title="Muat Ulang Katalog"
          >
            <RotateCcw
              className={`h-4 w-4 ${loading ? 'animate-spin text-orange-500' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : sortedProducts.length === 0 ? (
        /* Empty State */
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Tidak ada produk yang sesuai kriteria
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {activeTab === 'ACTION_REQUIRED'
              ? 'Bagus sekali! Tidak ada produk yang memerlukan tindakan atau bermasalah saat ini.'
              : 'Ubah kata kunci pencarian atau ganti filter tab untuk melihat produk lainnya.'}
          </p>
          {activeTab !== 'ALL' && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('ALL')
                setSearch('')
                setSelectedBrand('ALL')
              }}
              className="shadow-xs mt-4 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-orange-600"
            >
              Lihat Semua Produk
            </button>
          )}
        </div>
      ) : viewMode === 'list' ? (
        /* 4. MODE DAFTAR (SHOPEE SELLER CENTRE STYLE) */
        <div className="space-y-3">
          {/* Header Row Desktop */}
          <div className="hidden grid-cols-12 items-center gap-3 rounded-xl bg-slate-100/90 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/80 dark:text-slate-400 md:grid">
            <div className="col-span-5 flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-slate-400 hover:text-slate-700"
                title="Pilih Semua Variasi"
              >
                {selectedVariantIds.size > 0 ? (
                  <CheckSquare className="h-4 w-4 text-orange-600" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </button>
              <span>Nama Produk &amp; Informasi</span>
            </div>
            <div className="col-span-3">Rentang Harga (Rp)</div>
            <div className="col-span-1 text-center">Stok</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-1 text-right">Aksi</div>
          </div>

          {/* Product Items List */}
          {sortedProducts.map((p) => {
            const isExpanded = Boolean(expandedProductIds[p.id])
            const showAllVars = Boolean(showAllVariantsMap[p.id])
            const displayedVariants = showAllVars
              ? p.variants
              : p.variants.slice(0, 3)

            return (
              <div
                key={p.id}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Surface Baris Utama Produk */}
                <div className="p-3.5 sm:p-4">
                  <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-12 md:items-center">
                    {/* Kolom 1: Checkbox, Thumbnail, Nama Produk, SKU Induk */}
                    <div className="col-span-1 flex min-w-0 items-start gap-3 md:col-span-5">
                      <div className="pt-1 md:pt-0">
                        <button
                          type="button"
                          onClick={() => {
                            if (p.variants.length > 0) {
                              p.variants.forEach((v) => {
                                if (v.id) toggleSelectVariant(v.id)
                              })
                            } else {
                              toggleSelectVariant(`prod-only-${p.id}`)
                            }
                          }}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          {p.variants.some(
                            (v) => v.id && selectedVariantIds.has(v.id)
                          ) || selectedVariantIds.has(`prod-only-${p.id}`) ? (
                            <CheckSquare className="h-4 w-4 text-orange-600" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      {/* Thumbnail */}
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                        {p.images?.[0] ? (
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-slate-400">
                            Gadget
                          </div>
                        )}
                      </div>

                      {/* Title & Metadata */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {p.brand}
                          </span>
                          {p.storeName && (
                            <span className="text-[10px] text-slate-400">
                              • {p.storeName}
                            </span>
                          )}
                        </div>

                        <Link
                          href={`/dashboard/admin/products/${p.id}/edit`}
                          className="mt-0.5 block truncate text-xs font-bold text-slate-900 transition hover:text-orange-600 dark:text-white dark:hover:text-orange-400"
                        >
                          {p.name}
                        </Link>

                        {/* Variasi Button Counter Toggle */}
                        <div className="mt-1 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedProductIds((prev) => ({
                                ...prev,
                                [p.id]: !prev[p.id],
                              }))
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 transition hover:underline dark:text-orange-400"
                          >
                            <span>
                              {p.variantCount > 0
                                ? `${p.variantCount} Variasi`
                                : '1 Variasi Standar'}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </button>

                          {/* SKU Induk Preview */}
                          {(p.model || p.raw.sku) && (
                            <span className="font-mono text-[10px] text-slate-400">
                              SKU: {p.model || p.raw.sku}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Kolom 2: Rentang Harga Shopee Style (Warna Oranye) */}
                    <div className="col-span-1 md:col-span-3">
                      <div className="flex items-center justify-between md:block">
                        <span className="text-[11px] font-medium text-slate-400 md:hidden">
                          Harga:
                        </span>
                        <div>
                          <p className="text-xs font-extrabold text-orange-600 dark:text-orange-400">
                            {formatPriceDisplay(p.minPrice, p.maxPrice)}
                          </p>
                          {p.minCostPrice !== null && (
                            <p className="text-[10px] font-medium text-slate-400">
                              HPP: Rp {p.minCostPrice.toLocaleString('id-ID')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Kolom 3: Total Stok Terpadu */}
                    <div className="col-span-1 md:col-span-1 md:text-center">
                      <div className="flex items-center justify-between md:block">
                        <span className="text-[11px] font-medium text-slate-400 md:hidden">
                          Total Stok:
                        </span>
                        <span
                          className={`text-xs font-bold ${
                            p.totalStock <= 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : p.totalStock <= 5
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {p.totalStock}
                        </span>
                      </div>
                    </div>

                    {/* Kolom 4: Indikator Status Tunggal */}
                    <div className="col-span-1 md:col-span-2 md:text-center">
                      <div className="flex items-center justify-between md:block">
                        <span className="text-[11px] font-medium text-slate-400 md:hidden">
                          Status:
                        </span>
                        <div>
                          {!p.isActive ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                              <span>Disembunyikan</span>
                            </span>
                          ) : p.issues.length > 0 ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                                <AlertTriangle className="h-3 w-3 text-rose-600" />
                                <span>Perlu tindakan</span>
                              </span>
                              <span className="mt-0.5 text-[10px] font-medium text-rose-600">
                                {p.issues[0].label}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              <span>Live</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Kolom 5: Aksi (Ubah + Menu ...) */}
                    <div className="col-span-1 flex items-center justify-end gap-1.5 md:col-span-1">
                      <Link
                        href={`/dashboard/admin/products/${p.id}/edit`}
                        className="shadow-2xs inline-flex min-h-[36px] items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 transition hover:border-orange-300 hover:bg-orange-50/50 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        <span>Ubah</span>
                      </Link>

                      {/* Dropdown Menu ... */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMenuId(activeMenuId === p.id ? null : p.id)
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                          title="Menu Tindakan Lainnya"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {activeMenuId === p.id && (
                          <div className="absolute right-0 top-full z-30 mt-1 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                            <Link
                              href={`/gadget/${p.id}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => setActiveMenuId(null)}
                              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                              <span>Lihat di Web Publik</span>
                            </Link>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null)
                                handleToggleProductActive(p.id, p.isActive)
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                              {p.isActive ? (
                                <>
                                  <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                                  <span>Sembunyikan</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="h-3.5 w-3.5 text-emerald-600" />
                                  <span>Tampilkan (Live)</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null)
                                handleToggleProductTaxable(p.id, p.isTaxable)
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                              <Percent className="h-3.5 w-3.5 text-slate-400" />
                              <span>
                                {p.isTaxable
                                  ? 'Matikan PPN 11%'
                                  : 'Aktifkan PPN 11%'}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null)
                                setProductToDelete(p.raw)
                                setIsDeleteOpen(true)
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Hapus Produk</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-baris Variasi (Expandable accordion) */}
                {isExpanded && p.variants.length > 0 && (
                  <div className="border-t border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                    <div className="space-y-2">
                      <div className="hidden grid-cols-12 gap-2 text-[10px] font-bold uppercase text-slate-400 md:grid">
                        <div className="col-span-4">Variasi &amp; Warna</div>
                        <div className="col-span-2">Harga Jual (Rp)</div>
                        <div className="col-span-2">HPP Modal (Rp)</div>
                        <div className="col-span-1">Stok</div>
                        <div className="col-span-2">SKU Variasi</div>
                        <div className="col-span-1 text-right">Aksi</div>
                      </div>

                      {displayedVariants.map((v, vIdx) => {
                        const variantKey = v.id || `v-${p.id}-${vIdx}`
                        const editData = editingVariant[variantKey] || {
                          price: String(v.price || p.price),
                          costPrice: String(v.costPrice || p.costPrice || ''),
                          stock: String(v.stock ?? 0),
                          sku: v.sku || '',
                        }
                        const isEdited = Boolean(editingVariant[variantKey])
                        const isSaving = savingVariantId === variantKey

                        return (
                          <div
                            key={variantKey}
                            className="shadow-2xs grid grid-cols-1 items-center gap-2 rounded-xl border border-slate-200/60 bg-white p-2.5 text-xs dark:border-slate-800 dark:bg-slate-800/60 md:grid-cols-12"
                          >
                            {/* Nama Variasi & Checkbox */}
                            <div className="col-span-1 flex items-center gap-2 md:col-span-4">
                              {v.id && (
                                <button
                                  type="button"
                                  onClick={() => toggleSelectVariant(v.id!)}
                                  className="text-slate-400 hover:text-slate-700"
                                >
                                  {selectedVariantIds.has(v.id!) ? (
                                    <CheckSquare className="h-3.5 w-3.5 text-orange-600" />
                                  ) : (
                                    <Square className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              )}
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {v.name ||
                                  `${v.ram || ''}/${v.storage || ''} ${v.color || ''}`}
                              </span>
                            </div>

                            {/* Input Inline Harga Jual */}
                            <div className="col-span-1 md:col-span-2">
                              <span className="text-[10px] font-medium text-slate-400 md:hidden">
                                Harga Jual:
                              </span>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={editData.price}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '')
                                  setEditingVariant((prev) => ({
                                    ...prev,
                                    [variantKey]: {
                                      ...editData,
                                      price: val,
                                    },
                                  }))
                                }}
                                className="focus:outline-hidden w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-orange-600 focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900"
                              />
                            </div>

                            {/* Input Inline HPP */}
                            <div className="col-span-1 md:col-span-2">
                              <span className="text-[10px] font-medium text-slate-400 md:hidden">
                                HPP:
                              </span>
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="HPP (Rp)"
                                value={editData.costPrice}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '')
                                  setEditingVariant((prev) => ({
                                    ...prev,
                                    [variantKey]: {
                                      ...editData,
                                      costPrice: val,
                                    },
                                  }))
                                }}
                                className="focus:outline-hidden w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                              />
                            </div>

                            {/* Input Inline Stok */}
                            <div className="col-span-1 md:col-span-1">
                              <span className="text-[10px] font-medium text-slate-400 md:hidden">
                                Stok:
                              </span>
                              <input
                                type="number"
                                min={0}
                                value={editData.stock}
                                onChange={(e) => {
                                  setEditingVariant((prev) => ({
                                    ...prev,
                                    [variantKey]: {
                                      ...editData,
                                      stock: e.target.value,
                                    },
                                  }))
                                }}
                                className="focus:outline-hidden w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-center text-xs font-semibold text-slate-900 focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                              />
                            </div>

                            {/* SKU Variasi */}
                            <div className="col-span-1 md:col-span-2">
                              <span className="text-[10px] font-medium text-slate-400 md:hidden">
                                SKU:
                              </span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  placeholder="SKU..."
                                  value={editData.sku}
                                  onChange={(e) => {
                                    setEditingVariant((prev) => ({
                                      ...prev,
                                      [variantKey]: {
                                        ...editData,
                                        sku: e.target.value,
                                      },
                                    }))
                                  }}
                                  className="focus:outline-hidden w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px] text-slate-800 focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                />

                                {/* 1-Click Samakan Stok SKU jika SKU sama tapi stok beda */}
                                {p.hasSkuStockDesync && v.sku && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSyncSkuStock(
                                        v.sku!,
                                        parseInt(editData.stock) || 0
                                      )
                                    }
                                    disabled={syncingSku === v.sku}
                                    title="Samakan stok seluruh variasi ber-SKU ini"
                                    className="shrink-0 rounded-md bg-amber-100 p-1 text-amber-700 hover:bg-amber-200 dark:bg-amber-950/60 dark:text-amber-300"
                                  >
                                    <RotateCcw
                                      className={`h-3 w-3 ${syncingSku === v.sku ? 'animate-spin' : ''}`}
                                    />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Tombol Simpan Baris Inline */}
                            <div className="col-span-1 text-right md:col-span-1">
                              {isEdited ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSaveInlineVariant(p.id, variantKey)
                                  }
                                  disabled={isSaving}
                                  className="shadow-xs rounded-lg bg-orange-500 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-orange-600"
                                >
                                  {isSaving ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    'Simpan'
                                  )}
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-300">
                                  Tersimpan
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}

                      {/* Tautan Lihat Variasi Lainnya jika > 3 */}
                      {p.variants.length > 3 && (
                        <div className="pt-1 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setShowAllVariantsMap((prev) => ({
                                ...prev,
                                [p.id]: !prev[p.id],
                              }))
                            }
                            className="shadow-2xs inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-orange-600 hover:bg-orange-50/50 dark:border-slate-700 dark:bg-slate-800 dark:text-orange-400"
                          >
                            <span>
                              {showAllVars
                                ? 'Tampilkan lebih sedikit'
                                : `Lihat ${p.variants.length - 3} variasi lainnya`}
                            </span>
                            {showAllVars ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        /* 5. MODE PER MEREK (HIERARKI 4-LEVEL BERSTANDAR IDENTIK) */
        <div className="space-y-4">
          {hierarchyTree.map((b) => {
            const isBrandExp = Boolean(expandedBrands[b.brand])
            return (
              <div
                key={b.brand}
                className="shadow-2xs overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Level 1: Header Merek */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedBrands((prev) => ({
                      ...prev,
                      [b.brand]: !prev[b.brand],
                    }))
                  }
                  className="flex w-full items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3 text-left transition hover:bg-slate-100/70 dark:border-slate-800 dark:bg-slate-800/50"
                >
                  <div className="flex items-center gap-2">
                    <span className="shadow-xs rounded-lg bg-orange-500 px-2.5 py-0.5 text-xs font-black uppercase text-white">
                      {b.brand}
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {b.series.length} Model Produk
                    </span>
                    <span className="text-[11px] text-slate-400">
                      • {b.totalStock} Unit Total Stok
                    </span>
                  </div>
                  {isBrandExp ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </button>

                {/* Level 2: Daftar Produk / Seri */}
                {isBrandExp && (
                  <div className="divide-y divide-slate-100 p-3 dark:divide-slate-800">
                    {b.series.map((s) => {
                      const seriesKey = `${b.brand}-${s.seriesName}`
                      const isSeriesExp = Boolean(expandedSeries[seriesKey])

                      return (
                        <div
                          key={seriesKey}
                          className="py-3 first:pt-0 last:pb-0"
                        >
                          {/* Baris Seri / Produk */}
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedSeries((prev) => ({
                                    ...prev,
                                    [seriesKey]: !prev[seriesKey],
                                  }))
                                }
                                className="flex items-center gap-1.5 text-xs font-bold text-slate-900 transition hover:text-orange-600 dark:text-white"
                              >
                                {isSeriesExp ? (
                                  <ChevronUp className="h-4 w-4 text-orange-500" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-orange-500" />
                                )}
                                <span>{s.seriesName}</span>
                              </button>

                              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                {s.capacities.length} Pilihan Kapasitas
                              </span>

                              <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                                {formatPriceDisplay(s.minPrice, s.maxPrice)}
                              </span>
                            </div>

                            {/* Tombol Ubah Produk */}
                            {s.productId && (
                              <Link
                                href={`/dashboard/admin/products/${s.productId}/edit`}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:underline"
                              >
                                <span>Edit Detail Produk →</span>
                              </Link>
                            )}
                          </div>

                          {/* Level 3: Kapasitas & Varian Warna */}
                          {isSeriesExp && (
                            <div className="mt-3 space-y-3 pl-4 sm:pl-6">
                              {s.capacities.map((cap) => {
                                const capKey = `${seriesKey}-${cap.capacityKey}`
                                const isCapExp = Boolean(
                                  expandedCapacities[capKey]
                                )
                                const inputVal =
                                  capacityPriceInputs[cap.capacityKey] ??
                                  (cap.commonPrice
                                    ? String(cap.commonPrice)
                                    : '')

                                return (
                                  <div
                                    key={capKey}
                                    className="rounded-xl border border-slate-200/70 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40"
                                  >
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setExpandedCapacities((prev) => ({
                                              ...prev,
                                              [capKey]: !prev[capKey],
                                            }))
                                          }
                                          className="text-xs font-bold text-slate-800 hover:text-orange-600 dark:text-slate-200"
                                        >
                                          {cap.capacityKey}
                                        </button>
                                        <span className="text-[11px] text-slate-400">
                                          ({cap.variants.length} Warna • Stok:{' '}
                                          {cap.totalStock})
                                        </span>
                                      </div>

                                      {/* Terapkan ke semua warna bar */}
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="text"
                                          inputMode="numeric"
                                          placeholder="Harga kapasitas (Rp)"
                                          value={inputVal}
                                          onChange={(e) => {
                                            const v = e.target.value.replace(
                                              /\D/g,
                                              ''
                                            )
                                            setCapacityPriceInputs((prev) => ({
                                              ...prev,
                                              [cap.capacityKey]: v,
                                            }))
                                          }}
                                          className="focus:outline-hidden w-36 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-orange-600 focus:border-orange-500 dark:border-slate-700 dark:bg-slate-900"
                                        />
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleApplyCapacityPrice(
                                              cap,
                                              inputVal
                                            )
                                          }
                                          disabled={
                                            updatingCapacity === cap.capacityKey
                                          }
                                          className="shadow-xs rounded-lg bg-orange-500 px-3 py-1 text-xs font-bold text-white hover:bg-orange-600 active:scale-95"
                                        >
                                          {updatingCapacity ===
                                          cap.capacityKey ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            'Terapkan ke semua warna'
                                          )}
                                        </button>
                                      </div>
                                    </div>

                                    {/* Level 4: Varian Warna */}
                                    {isCapExp && (
                                      <div className="mt-2.5 divide-y divide-slate-100 rounded-lg border border-slate-200/60 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
                                        {cap.variants.map((v) => (
                                          <div
                                            key={v.id}
                                            className="flex flex-wrap items-center justify-between gap-2 p-2.5 text-xs"
                                          >
                                            <div className="flex items-center gap-2">
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  toggleSelectVariant(v.id)
                                                }
                                                className="text-slate-400 hover:text-slate-700"
                                              >
                                                {selectedVariantIds.has(
                                                  v.id
                                                ) ? (
                                                  <CheckSquare className="h-3.5 w-3.5 text-orange-600" />
                                                ) : (
                                                  <Square className="h-3.5 w-3.5" />
                                                )}
                                              </button>
                                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                {v.color}
                                              </span>
                                              {v.sku && (
                                                <span className="font-mono text-[10px] text-slate-400">
                                                  ({v.sku})
                                                </span>
                                              )}
                                            </div>

                                            <div className="flex items-center gap-3">
                                              <span className="font-bold text-orange-600">
                                                Rp{' '}
                                                {v.price.toLocaleString(
                                                  'id-ID'
                                                )}
                                              </span>
                                              <span className="text-[11px] text-slate-400">
                                                Stok: {v.stock}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
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
      )}

      {/* 6. Sticky Bottom Action Bar saat Multi-Select Terpilih */}
      {selectedVariantIds.size > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-40 mx-auto max-w-4xl px-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/95 p-3.5 text-white shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-orange-500 px-2.5 py-0.5 text-xs font-black">
                {selectedVariantIds.size}
              </span>
              <span className="text-xs font-semibold">
                Variasi terpilih untuk di-update massal
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                placeholder="Harga baru (Rp)"
                value={bulkNewPrice}
                onChange={(e) =>
                  setBulkNewPrice(e.target.value.replace(/\D/g, ''))
                }
                className="focus:outline-hidden w-32 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-orange-400 focus:border-orange-500"
              />

              <input
                type="number"
                min={0}
                placeholder="Stok baru"
                value={bulkNewStock}
                onChange={(e) => setBulkNewStock(e.target.value)}
                className="focus:outline-hidden w-24 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-white focus:border-orange-500"
              />

              <button
                type="button"
                onClick={handleBulkUpdateSelected}
                disabled={bulkUpdating}
                className="rounded-lg bg-orange-500 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-orange-600 active:scale-95"
              >
                {bulkUpdating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  'Terapkan'
                )}
              </button>

              <button
                type="button"
                onClick={() => setSelectedVariantIds(new Set())}
                className="rounded-lg border border-slate-700 bg-transparent px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white p-6 dark:bg-slate-900">
          <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
            Konfirmasi Hapus Produk
          </DialogTitle>
          <DialogDescription className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Apakah Anda yakin ingin menghapus produk{' '}
            <strong className="text-slate-900 dark:text-white">
              {productToDelete?.name}
            </strong>
            ? Tindakan ini akan menghapus seluruh data variasi, stok, dan
            riwayat produk secara permanen.
          </DialogDescription>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsDeleteOpen(false)}
              disabled={deleteLoading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={confirmDeleteProduct}
              disabled={deleteLoading}
              className="shadow-xs rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-700 active:scale-95"
            >
              {deleteLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                'Hapus Permanen'
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Mass Update Excel Shopee (Phase 2 Component) */}
      <BulkPriceUpdateModal
        isOpen={isBulkUpdateOpen}
        onClose={() => setIsBulkUpdateOpen(false)}
        onSuccess={() => {
          fetchProducts()
        }}
        isSuperAdmin={isSuperAdmin}
        userStoreId={userStoreId || undefined}
        stores={stores}
      />

      {/* Modal Buat / Atur Cover Etalase */}
      <EtalaseFormModal
        isOpen={isEtalaseModalOpen}
        onClose={() => {
          setIsEtalaseModalOpen(false)
          setEditingEtalase(null)
        }}
        onSuccess={() => {
          fetchProducts()
        }}
        editingEtalase={editingEtalase}
        availableProducts={rawProducts}
        storeId={isStoreAdmin && userStoreId ? userStoreId : selectedStoreId}
        stores={stores}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  )
}
