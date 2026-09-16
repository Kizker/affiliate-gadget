'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Palette,
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Sparkles,
  RefreshCw,
  X,
  Layers,
  Smartphone,
  Tag,
  CheckSquare,
  Square,
  ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'
import type {
  BrandGroup,
  SeriesGroup,
  CapacityGroup,
  ColorVariantItem,
} from '@/lib/catalog-hierarchy'

interface BulkColorVariantModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function BulkColorVariantModal({
  isOpen,
  onClose,
  onSuccess,
}: BulkColorVariantModalProps) {
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [hierarchy, setHierarchy] = useState<BrandGroup[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('ALL')

  // Expanded tree states
  const [expandedBrands, setExpandedBrands] = useState<Record<string, boolean>>(
    {}
  )
  const [expandedSeries, setExpandedSeries] = useState<Record<string, boolean>>(
    {}
  )

  // Selected variant IDs
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<string>>(
    new Set()
  )

  // Input states for bulk update
  const [newPrice, setNewPrice] = useState<string>('')
  const [newStock, setNewStock] = useState<string>('')

  // Fetch hierarchy
  const fetchHierarchy = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/products/variants/hierarchy')
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        setHierarchy(json.data)

        // Automatically expand first brand & series for convenient instant view
        if (json.data.length > 0) {
          const firstBrand = json.data[0]
          setExpandedBrands({ [firstBrand.brand]: true })
          if (firstBrand.series.length > 0) {
            setExpandedSeries({
              [`${firstBrand.brand}__${firstBrand.series[0].seriesName}`]: true,
            })
          }
        }
      } else {
        throw new Error(json.error || 'Gagal memuat struktur katalog.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat hierarki varian warna.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchHierarchy()
      setSelectedVariantIds(new Set())
      setNewPrice('')
      setNewStock('')
    }
  }, [isOpen, fetchHierarchy])

  // Filter hierarchy based on brand & search
  const filteredHierarchy = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()

    return hierarchy
      .filter(
        (b) =>
          selectedBrand === 'ALL' ||
          b.brand.toLowerCase() === selectedBrand.toLowerCase()
      )
      .map((b) => {
        if (!q) return b

        const matchedSeries = b.series
          .map((s) => {
            const seriesMatches = s.seriesName.toLowerCase().includes(q)
            if (seriesMatches) return s

            const matchedCapacities = s.capacities
              .map((c) => {
                const capMatches = c.capacityKey.toLowerCase().includes(q)
                if (capMatches) return c

                const matchedVariants = c.variants.filter(
                  (v) =>
                    v.name.toLowerCase().includes(q) ||
                    v.color.toLowerCase().includes(q) ||
                    (v.sku && v.sku.toLowerCase().includes(q))
                )

                if (matchedVariants.length > 0) {
                  return { ...c, variants: matchedVariants }
                }
                return null
              })
              .filter(Boolean) as CapacityGroup[]

            if (matchedCapacities.length > 0) {
              return { ...s, capacities: matchedCapacities }
            }
            return null
          })
          .filter(Boolean) as SeriesGroup[]

        if (matchedSeries.length > 0) {
          return { ...b, series: matchedSeries }
        }
        return null
      })
      .filter(Boolean) as BrandGroup[]
  }, [hierarchy, selectedBrand, searchQuery])

  // Toggle brand accordion
  const toggleBrand = (brand: string) => {
    setExpandedBrands((prev) => ({ ...prev, [brand]: !prev[brand] }))
  }

  // Toggle series accordion
  const toggleSeries = (brand: string, series: string) => {
    const key = `${brand}__${series}`
    setExpandedSeries((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Toggle individual variant selection
  const toggleVariant = (id: string) => {
    setSelectedVariantIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Toggle select all variants in a capacity group
  const toggleCapacityAll = (capacity: CapacityGroup) => {
    const ids = capacity.variants.map((v) => v.id)
    const allSelected = ids.every((id) => selectedVariantIds.has(id))

    setSelectedVariantIds((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        ids.forEach((id) => next.delete(id))
      } else {
        ids.forEach((id) => next.add(id))
      }
      return next
    })

    // If all were same price, prefill the newPrice field
    if (!allSelected && capacity.commonPrice) {
      setNewPrice(capacity.commonPrice.toString())
    }
  }

  // Toggle select all variants in an entire series
  const toggleSeriesAll = (series: SeriesGroup) => {
    const allIds = series.capacities.flatMap((c) => c.variants.map((v) => v.id))
    const allSelected = allIds.every((id) => selectedVariantIds.has(id))

    setSelectedVariantIds((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        allIds.forEach((id) => next.delete(id))
      } else {
        allIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  // Clear all selections
  const clearSelection = () => {
    setSelectedVariantIds(new Set())
  }

  // Submit bulk update
  const handleSubmit = async () => {
    if (selectedVariantIds.size === 0) {
      toast.error('Pilih setidaknya satu varian warna terlebih dahulu.')
      return
    }

    const priceNum = newPrice.trim()
      ? Number(newPrice.replace(/[^0-9]/g, ''))
      : null
    const stockNum = newStock.trim()
      ? Number(newStock.replace(/[^0-9]/g, ''))
      : null

    if (priceNum === null && stockNum === null) {
      toast.error('Masukkan harga baru atau stok baru yang ingin diterapkan.')
      return
    }

    setSubmitting(true)
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

      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menerapkan pembaruan massal.')
      }

      toast.success(json.message || 'Pembaruan varian warna massal berhasil!')
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan sistem.')
    } finally {
      setSubmitting(false)
    }
  }

  // Brand tabs list
  const brandNames = useMemo(() => {
    return ['ALL', ...hierarchy.map((b) => b.brand)]
  }, [hierarchy])

  // Color dot helper
  const getColorDotClass = (colorName: string) => {
    const c = colorName.toLowerCase()
    if (c.includes('white') || c.includes('putih'))
      return 'bg-white border-slate-300'
    if (c.includes('black') || c.includes('hitam'))
      return 'bg-slate-900 border-slate-800'
    if (c.includes('pink') || c.includes('peach') || c.includes('rose'))
      return 'bg-pink-400 border-pink-500'
    if (c.includes('blue') || c.includes('biru') || c.includes('navy'))
      return 'bg-blue-500 border-blue-600'
    if (c.includes('green') || c.includes('hijau') || c.includes('mint'))
      return 'bg-emerald-500 border-emerald-600'
    if (c.includes('yellow') || c.includes('kuning') || c.includes('lemon'))
      return 'bg-amber-400 border-amber-500'
    if (c.includes('violet') || c.includes('purple') || c.includes('lilac'))
      return 'bg-purple-500 border-purple-600'
    if (
      c.includes('gray') ||
      c.includes('grey') ||
      c.includes('silver') ||
      c.includes('titanium')
    )
      return 'bg-slate-400 border-slate-500'
    return 'bg-orange-500 border-orange-600'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl border border-slate-200/80 bg-white/95 p-0 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95">
        {/* Header */}
        <div className="border-b border-slate-100 p-6 pb-4 dark:border-slate-800">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25">
                <Palette className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-950 dark:text-white">
                  Update Massal Varian Warna (Hierarki 4-Tingkat)
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Merek &rarr; Seri &rarr; Kapasitas (RAM/Storage) &rarr; Varian
                  Warna (Ubah harga serempak)
                </DialogDescription>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search & Brand Filter Bar */}
          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari seri gadget, warna, atau kapasitas (misal: S24 FE, 12/512, White)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:border-slate-800 dark:bg-slate-800/40 dark:text-white dark:focus:bg-slate-900"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Brand Chips Bar */}
            <div className="flex max-w-full items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {brandNames.slice(0, 7).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setSelectedBrand(b)}
                  className={`rounded-xl px-3 py-1.5 text-[11px] font-bold transition ${
                    selectedBrand.toLowerCase() === b.toLowerCase()
                      ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Hierarchy Tree Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-3">
          {loading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2.5 text-slate-400">
              <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
              <p className="text-xs font-medium">
                Memuat struktur hierarki katalog...
              </p>
            </div>
          ) : filteredHierarchy.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-slate-400">
              <Smartphone className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tidak ada varian produk yang cocok
              </p>
              <p className="text-[11px] text-slate-400">
                Coba sesuaikan kata kunci pencarian atau filter merek.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHierarchy.map((brandGroup) => {
                const isBrandExpanded =
                  expandedBrands[brandGroup.brand] !== false

                return (
                  <div
                    key={brandGroup.brand}
                    className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/40 dark:border-slate-800 dark:bg-slate-900/40"
                  >
                    {/* Level 1: Brand Header Accordion */}
                    <div
                      onClick={() => toggleBrand(brandGroup.brand)}
                      className="flex cursor-pointer select-none items-center justify-between border-b border-slate-200/60 bg-slate-100/70 px-4 py-3 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:bg-slate-800"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-600/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
                          {isBrandExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {brandGroup.brand}
                        </span>
                        <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          {brandGroup.totalSeries} Seri ·{' '}
                          {brandGroup.totalVariants} Warna
                        </span>
                      </div>
                    </div>

                    {/* Level 2: Series List */}
                    {isBrandExpanded && (
                      <div className="space-y-3 p-3.5">
                        {brandGroup.series.map((series) => {
                          const seriesKey = `${brandGroup.brand}__${series.seriesName}`
                          const isSeriesExpanded =
                            expandedSeries[seriesKey] !== false

                          const allSeriesIds = series.capacities.flatMap((c) =>
                            c.variants.map((v) => v.id)
                          )
                          const selectedInSeries = allSeriesIds.filter((id) =>
                            selectedVariantIds.has(id)
                          ).length
                          const isSeriesAllSelected =
                            allSeriesIds.length > 0 &&
                            selectedInSeries === allSeriesIds.length

                          return (
                            <div
                              key={series.seriesName}
                              className="shadow-xs rounded-2xl border border-slate-200/70 bg-white p-3 dark:border-slate-800 dark:bg-slate-800/50"
                            >
                              {/* Series Header */}
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5 dark:border-slate-800">
                                <div
                                  onClick={() =>
                                    toggleSeries(
                                      brandGroup.brand,
                                      series.seriesName
                                    )
                                  }
                                  className="flex cursor-pointer select-none items-center gap-2 text-xs font-bold text-slate-900 hover:text-orange-600 dark:text-white dark:hover:text-orange-400"
                                >
                                  {isSeriesExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-slate-400" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-slate-400" />
                                  )}
                                  <span>{series.seriesName}</span>
                                  <span className="text-[10px] font-normal text-slate-400">
                                    ({series.capacities.length} spesifikasi
                                    kapasitas)
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => toggleSeriesAll(series)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                  {isSeriesAllSelected ? (
                                    <CheckSquare className="h-3.5 w-3.5 text-orange-600" />
                                  ) : (
                                    <Square className="h-3.5 w-3.5 text-slate-400" />
                                  )}
                                  <span>
                                    {isSeriesAllSelected
                                      ? 'Batalkan Semua'
                                      : 'Pilih Semua Varian Seri Ini'}
                                  </span>
                                </button>
                              </div>

                              {/* Level 3: Capacities (RAM / Storage Tiers) */}
                              {isSeriesExpanded && (
                                <div className="mt-3 space-y-3 pl-2 sm:pl-3">
                                  {series.capacities.map((capacity) => {
                                    const capVariantIds = capacity.variants.map(
                                      (v) => v.id
                                    )
                                    const selectedInCap = capVariantIds.filter(
                                      (id) => selectedVariantIds.has(id)
                                    ).length
                                    const isCapAllSelected =
                                      capVariantIds.length > 0 &&
                                      selectedInCap === capVariantIds.length

                                    return (
                                      <div
                                        key={capacity.capacityKey}
                                        className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800/80 dark:bg-slate-900/40"
                                      >
                                        {/* Capacity Header Banner */}
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                          <div className="flex items-center gap-2">
                                            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                                              <Layers className="h-3 w-3" />
                                            </div>
                                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                                              {series.seriesName}{' '}
                                              {capacity.capacityKey}
                                            </span>

                                            {capacity.isAllSamePrice ? (
                                              <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                                                Rp{' '}
                                                {capacity.commonPrice?.toLocaleString(
                                                  'id-ID'
                                                )}{' '}
                                                (Harga Seragam)
                                              </span>
                                            ) : (
                                              <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                                                Rp{' '}
                                                {capacity.minPrice.toLocaleString(
                                                  'id-ID'
                                                )}{' '}
                                                s/d Rp{' '}
                                                {capacity.maxPrice.toLocaleString(
                                                  'id-ID'
                                                )}
                                              </span>
                                            )}

                                            <span className="text-[10px] text-slate-400">
                                              · Total Stok:{' '}
                                              {capacity.totalStock} unit
                                            </span>
                                          </div>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              toggleCapacityAll(capacity)
                                            }
                                            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                                              isCapAllSelected
                                                ? 'shadow-xs bg-orange-600 text-white'
                                                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                                            }`}
                                          >
                                            {isCapAllSelected ? (
                                              <CheckSquare className="h-3 w-3" />
                                            ) : (
                                              <Square className="h-3 w-3 text-slate-400" />
                                            )}
                                            <span>
                                              {isCapAllSelected
                                                ? 'Semua Warna Terpilih'
                                                : `Pilih Semua Warna (${capacity.variants.length})`}
                                            </span>
                                          </button>
                                        </div>

                                        {/* Level 4: Color Variants Table/Grid */}
                                        <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                          {capacity.variants.map((variant) => {
                                            const isSelected =
                                              selectedVariantIds.has(variant.id)

                                            return (
                                              <div
                                                key={variant.id}
                                                onClick={() =>
                                                  toggleVariant(variant.id)
                                                }
                                                className={`flex cursor-pointer select-none items-center justify-between rounded-xl border p-2.5 transition-all ${
                                                  isSelected
                                                    ? 'shadow-xs border-orange-500/80 bg-orange-50/70 dark:border-orange-500/80 dark:bg-orange-950/30'
                                                    : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/70 dark:hover:border-slate-700'
                                                }`}
                                              >
                                                <div className="flex min-w-0 items-center gap-2.5">
                                                  <div
                                                    className={`shadow-xs h-4 w-4 shrink-0 rounded-full border ${getColorDotClass(
                                                      variant.color
                                                    )}`}
                                                  />
                                                  <div className="min-w-0">
                                                    <span className="block truncate text-xs font-bold text-slate-900 dark:text-white">
                                                      {variant.color}
                                                    </span>
                                                    <span className="block truncate text-[10px] text-slate-400">
                                                      SKU: {variant.sku || '-'}{' '}
                                                      · Stok: {variant.stock}{' '}
                                                      unit
                                                    </span>
                                                  </div>
                                                </div>

                                                <div className="text-right">
                                                  <span className="block text-xs font-extrabold text-orange-600 dark:text-orange-400">
                                                    Rp{' '}
                                                    {variant.price.toLocaleString(
                                                      'id-ID'
                                                    )}
                                                  </span>
                                                  {isSelected ? (
                                                    <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">
                                                      ✓ Dipilih
                                                    </span>
                                                  ) : (
                                                    <span className="text-[10px] text-slate-400">
                                                      Klik pilih
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            )
                                          })}
                                        </div>
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
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="border-t border-slate-200 bg-slate-50/90 p-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Selection indicator */}
            <div className="flex items-center gap-3">
              <div className="shadow-xs flex h-8 w-8 items-center justify-center rounded-xl bg-orange-600 text-xs font-bold text-white">
                {selectedVariantIds.size}
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-900 dark:text-white">
                  {selectedVariantIds.size} Varian Warna Dipilih
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {selectedVariantIds.size === 0
                    ? 'Pilih grup spesifikasi atau klik varian warna di atas'
                    : 'Siap diterapkan harga serempak'}
                </span>
              </div>
              {selectedVariantIds.size > 0 && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="ml-2 text-[11px] font-semibold text-rose-600 hover:underline dark:text-rose-400"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Bulk Inputs & Apply Button */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                  Rp
                </span>
                <input
                  type="text"
                  placeholder="Harga Baru..."
                  value={
                    newPrice
                      ? Number(newPrice.replace(/[^0-9]/g, '')).toLocaleString(
                          'id-ID'
                        )
                      : ''
                  }
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '')
                    setNewPrice(raw)
                  }}
                  disabled={selectedVariantIds.size === 0 || submitting}
                  className="shadow-xs w-36 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-bold text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Stok Baru (Opsi)..."
                  value={newStock}
                  onChange={(e) =>
                    setNewStock(e.target.value.replace(/[^0-9]/g, ''))
                  }
                  disabled={selectedVariantIds.size === 0 || submitting}
                  className="shadow-xs w-32 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  selectedVariantIds.size === 0 ||
                  submitting ||
                  (!newPrice && !newStock)
                }
                className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2 text-xs font-bold text-white shadow-sm shadow-orange-600/25 transition hover:bg-orange-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Terapkan ke {selectedVariantIds.size} Warna</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
