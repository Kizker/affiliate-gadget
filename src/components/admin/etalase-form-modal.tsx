'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Search,
  Check,
  Plus,
  Trash2,
  Sparkles,
  Image as ImageIcon,
  Upload,
  Loader2,
  Star,
  Package,
  Tag,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  EtalasePriceMode,
  generateShortProductLabel,
  getProductEffectiveMinPrice,
  getProductEffectiveStock,
} from '@/lib/etalase-utils'
import { processMediaUploadFile } from '@/lib/media-upload-client'

interface EtalaseFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editingEtalase?: any | null
  availableProducts: any[]
  storeId: string
  stores?: Array<{ id: string; name: string; city?: string }>
  isSuperAdmin?: boolean
}

export function EtalaseFormModal({
  isOpen,
  onClose,
  onSuccess,
  editingEtalase,
  availableProducts,
  storeId,
  stores = [],
  isSuperAdmin = false,
}: EtalaseFormModalProps) {
  const [targetStoreId, setTargetStoreId] = useState<string>(
    storeId !== 'ALL' ? storeId : stores[0]?.id || ''
  )
  const [customTitle, setCustomTitle] = useState('')
  const [description, setDescription] = useState('')
  const [coverMode, setCoverMode] = useState<'PRODUCT' | 'CUSTOM_IMAGE'>(
    'PRODUCT'
  )
  const [coverProductId, setCoverProductId] = useState<string>('')
  const [customCoverImage, setCustomCoverImage] = useState<string>('')
  const [priceMode, setPriceMode] = useState<EtalasePriceMode>('LOWEST')
  const [customPriceStr, setCustomPriceStr] = useState<string>('')
  const [customOriginalPriceStr, setCustomOriginalPriceStr] =
    useState<string>('')
  const [isActive, setIsActive] = useState<boolean>(true)

  const [selectedItems, setSelectedItems] = useState<
    Array<{ productId: string; label: string; sortOrder: number }>
  >([])
  const [productSearch, setProductSearch] = useState('')
  const [uploadingCover, setUploadingCover] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!isOpen) return
    if (editingEtalase) {
      setTargetStoreId(editingEtalase.storeId || storeId)
      setCustomTitle(editingEtalase.customTitle || editingEtalase.name || '')
      setDescription(editingEtalase.description || '')
      setCoverMode(editingEtalase.customCoverImage ? 'CUSTOM_IMAGE' : 'PRODUCT')
      setCoverProductId(editingEtalase.coverProductId || '')
      setCustomCoverImage(editingEtalase.customCoverImage || '')
      setPriceMode(editingEtalase.priceMode || 'LOWEST')
      setCustomPriceStr(
        editingEtalase.customPrice
          ? Number(editingEtalase.customPrice).toLocaleString('id-ID')
          : ''
      )
      setCustomOriginalPriceStr(
        editingEtalase.customOriginalPrice
          ? Number(editingEtalase.customOriginalPrice).toLocaleString('id-ID')
          : ''
      )
      setIsActive(editingEtalase.isActive ?? true)
      if (Array.isArray(editingEtalase.etalaseItems)) {
        setSelectedItems(
          editingEtalase.etalaseItems.map((item: any, idx: number) => ({
            productId: item.productId,
            label: item.label || generateShortProductLabel(item.product),
            sortOrder: idx,
          }))
        )
      } else {
        setSelectedItems([])
      }
    } else {
      const defaultStore =
        storeId && storeId !== 'ALL' ? storeId : stores[0]?.id || ''
      setTargetStoreId(defaultStore)
      setCustomTitle('')
      setDescription('')
      setCoverMode('PRODUCT')
      setCoverProductId('')
      setCustomCoverImage('')
      setPriceMode('LOWEST')
      setCustomPriceStr('')
      setCustomOriginalPriceStr('')
      setIsActive(true)
      setSelectedItems([])
    }
    setProductSearch('')
  }, [isOpen, editingEtalase, storeId, stores])

  // Produk milik cabang toko terpilih
  const storeScopedProducts = useMemo(() => {
    if (!targetStoreId || targetStoreId === 'ALL') return availableProducts
    return availableProducts.filter((p) => p.storeId === targetStoreId)
  }, [availableProducts, targetStoreId])

  const filteredCandidateProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim()
    if (!q) return storeScopedProducts
    return storeScopedProducts.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.model?.toLowerCase().includes(q)
    )
  }, [storeScopedProducts, productSearch])

  const productsById = useMemo(() => {
    const map = new Map<string, any>()
    availableProducts.forEach((p) => map.set(p.id, p))
    if (Array.isArray(editingEtalase?.etalaseItems)) {
      editingEtalase.etalaseItems.forEach((i: any) => {
        if (i.product && !map.has(i.product.id)) {
          map.set(i.product.id, i.product)
        }
      })
    }
    return map
  }, [availableProducts, editingEtalase])

  const toggleProductInEtalase = (prod: any) => {
    const exists = selectedItems.some((i) => i.productId === prod.id)
    if (exists) {
      const next = selectedItems.filter((i) => i.productId !== prod.id)
      setSelectedItems(next)
      if (coverProductId === prod.id) {
        setCoverProductId(next[0]?.productId || '')
      }
    } else {
      const nextItem = {
        productId: prod.id,
        label: generateShortProductLabel(prod),
        sortOrder: selectedItems.length,
      }
      const next = [...selectedItems, nextItem]
      setSelectedItems(next)
      if (!coverProductId) {
        setCoverProductId(prod.id)
      }
      if (!customTitle.trim() && next.length === 1) {
        setCustomTitle(prod.name)
      }
    }
  }

  const formatRupiahInput = (raw: string) => {
    const digits = raw.replace(/\D/g, '')
    if (!digits) return ''
    return Number(digits).toLocaleString('id-ID')
  }

  const handleUploadCoverImage = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    try {
      const processedFile = await processMediaUploadFile(file)
      const formData = new FormData()
      formData.append('file', processedFile)
      formData.append('folder', 'products')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (!res.ok || !json.url) {
        throw new Error(json.error || 'Gagal mengunggah gambar cover')
      }
      setCustomCoverImage(json.url)
      setCoverMode('CUSTOM_IMAGE')
      toast.success('Gambar cover etalase berhasil diunggah')
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengunggah gambar cover')
    } finally {
      setUploadingCover(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Live preview perhitungan harga & cover
  const previewStats = useMemo(() => {
    const selectedProds = selectedItems
      .map((i) => productsById.get(i.productId))
      .filter(Boolean)
    const coverProd =
      productsById.get(coverProductId) || selectedProds[0] || null
    const prices = selectedProds
      .map((p) => getProductEffectiveMinPrice(p))
      .filter((n) => n > 0)
    const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0
    const coverProdPrice = coverProd
      ? getProductEffectiveMinPrice(coverProd)
      : lowestPrice
    const customNum = Number(customPriceStr.replace(/\D/g, '')) || 0

    let finalPrice = lowestPrice
    if (priceMode === 'COVER_PRODUCT' && coverProdPrice > 0) {
      finalPrice = coverProdPrice
    } else if (priceMode === 'CUSTOM' && customNum > 0) {
      finalPrice = customNum
    }

    const totalStock = selectedProds.reduce(
      (sum, p) => sum + getProductEffectiveStock(p),
      0
    )
    const previewImg =
      coverMode === 'CUSTOM_IMAGE' && customCoverImage
        ? customCoverImage
        : coverProd?.images?.[0] ||
          selectedProds[0]?.images?.[0] ||
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80'

    const previewTitle =
      customTitle.trim() ||
      coverProd?.name ||
      'Judul Etalase Pancingan / Promosi'

    return {
      lowestPrice,
      coverProdPrice,
      finalPrice,
      totalStock,
      previewImg,
      previewTitle,
      coverProd,
    }
  }, [
    selectedItems,
    productsById,
    coverProductId,
    priceMode,
    customPriceStr,
    coverMode,
    customCoverImage,
    customTitle,
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedItems.length === 0) {
      toast.error('Pilih minimal 1 produk untuk dimasukkan ke dalam Etalase')
      return
    }

    const cleanCustomPrice = customPriceStr
      ? Number(customPriceStr.replace(/\D/g, ''))
      : null
    const cleanOrigPrice = customOriginalPriceStr
      ? Number(customOriginalPriceStr.replace(/\D/g, ''))
      : null

    if (
      priceMode === 'CUSTOM' &&
      (!cleanCustomPrice || cleanCustomPrice <= 0)
    ) {
      toast.error('Masukkan nominal Harga Sendiri (Kustom) terlebih dahulu')
      return
    }

    setSaving(true)
    try {
      const payload = {
        storeId: targetStoreId,
        name: previewStats.previewTitle,
        customTitle: customTitle.trim() || previewStats.previewTitle,
        description: description.trim() || null,
        coverProductId: coverProductId || selectedItems[0]?.productId || null,
        customCoverImage:
          coverMode === 'CUSTOM_IMAGE' && customCoverImage.trim()
            ? customCoverImage.trim()
            : null,
        priceMode,
        customPrice: priceMode === 'CUSTOM' ? cleanCustomPrice : null,
        customOriginalPrice: cleanOrigPrice,
        isActive,
        items: selectedItems.map((item, idx) => ({
          productId: item.productId,
          label: item.label.trim() || 'Unit Pilihan',
          sortOrder: idx,
        })),
      }

      const url = editingEtalase
        ? `/api/admin/etalase/${editingEtalase.id}`
        : '/api/admin/etalase'
      const method = editingEtalase ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Gagal menyimpan etalase')
      }

      toast.success(
        editingEtalase
          ? 'Etalase berhasil diperbarui!'
          : 'Etalase baru berhasil dibuat!'
      )
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan etalase')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] w-[calc(100%-2rem)] max-w-5xl overflow-y-auto rounded-3xl bg-white p-0 dark:bg-slate-900 sm:w-full">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
          <div>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
              {editingEtalase
                ? 'Atur Cover & Isi Etalase'
                : 'Buat Etalase Toko Baru (Ala Shopee)'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Gabungkan beberapa produk ke dalam 1 etalase pancingan, pilih
              barang cover atau atur gambar, judul &amp; harga sendiri.
            </DialogDescription>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Kolom Kiri (7 cols): Pengaturan Cover, Judul, Harga & Daftar Barang Terpilih */}
            <div className="space-y-5 lg:col-span-7">
              {/* Pilihan Cabang Toko (Khusus Superadmin) */}
              {isSuperAdmin && stores.length > 0 && !editingEtalase && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Cabang Toko Pemilik Etalase
                  </label>
                  <select
                    value={targetStoreId}
                    onChange={(e) => {
                      setTargetStoreId(e.target.value)
                      setSelectedItems([])
                      setCoverProductId('')
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.city ? `(${s.city})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 1. Judul Cover Etalase */}
              <div className="space-y-1.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 dark:text-white">
                    1. Judul Etalase di Halaman Depan
                  </label>
                  {previewStats.coverProd && (
                    <button
                      type="button"
                      onClick={() =>
                        setCustomTitle(previewStats.coverProd.name)
                      }
                      className="text-[11px] font-semibold text-orange-600 hover:underline"
                    >
                      Gunakan Nama Barang Cover
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Contoh: SAMSUNG GALAXY Z FOLD & FLIP 5 | 4 | 3 5G SEIN Second Original"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              {/* 2. Pengaturan Gambar Cover */}
              <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <label className="block text-xs font-bold text-slate-900 dark:text-white">
                  2. Sumber Gambar Cover Etalase
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCoverMode('PRODUCT')}
                    className={`rounded-xl border px-3 py-2 text-left text-xs transition ${
                      coverMode === 'PRODUCT'
                        ? 'border-2 border-orange-500 bg-orange-50/20 font-bold text-orange-700 dark:text-orange-300'
                        : 'border-slate-200 bg-white font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900'
                    }`}
                  >
                    Ikut Foto Barang Cover
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverMode('CUSTOM_IMAGE')}
                    className={`rounded-xl border px-3 py-2 text-left text-xs transition ${
                      coverMode === 'CUSTOM_IMAGE'
                        ? 'border-2 border-orange-500 bg-orange-50/20 font-bold text-orange-700 dark:text-orange-300'
                        : 'border-slate-200 bg-white font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900'
                    }`}
                  >
                    Upload Gambar Cover Sendiri
                  </button>
                </div>

                {coverMode === 'CUSTOM_IMAGE' && (
                  <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleUploadCoverImage}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingCover}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                    >
                      {uploadingCover ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      <span>Upload Foto Cover</span>
                    </button>
                    <input
                      type="text"
                      value={customCoverImage}
                      onChange={(e) => setCustomCoverImage(e.target.value)}
                      placeholder="Atau tempel URL gambar cover..."
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    />
                  </div>
                )}
              </div>

              {/* 3. Pengaturan Harga Tampilan Depan (3 Mode) */}
              <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <label className="block text-xs font-bold text-slate-900 dark:text-white">
                  3. Pengaturan Harga di Kartu Depan Etalase
                </label>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setPriceMode('LOWEST')}
                    className={`rounded-xl border p-2.5 text-left text-xs transition ${
                      priceMode === 'LOWEST'
                        ? 'border-2 border-orange-500 bg-orange-50/20 font-bold text-orange-700 dark:text-orange-300'
                        : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900'
                    }`}
                  >
                    <div className="font-bold">Otomatis Termurah</div>
                    <div className="mt-0.5 text-[10px] text-slate-500">
                      Rp {previewStats.lowestPrice.toLocaleString('id-ID')}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPriceMode('COVER_PRODUCT')}
                    className={`rounded-xl border p-2.5 text-left text-xs transition ${
                      priceMode === 'COVER_PRODUCT'
                        ? 'border-2 border-orange-500 bg-orange-50/20 font-bold text-orange-700 dark:text-orange-300'
                        : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900'
                    }`}
                  >
                    <div className="font-bold">Ikut Barang Cover</div>
                    <div className="mt-0.5 text-[10px] text-slate-500">
                      Rp {previewStats.coverProdPrice.toLocaleString('id-ID')}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPriceMode('CUSTOM')}
                    className={`rounded-xl border p-2.5 text-left text-xs transition ${
                      priceMode === 'CUSTOM'
                        ? 'border-2 border-orange-500 bg-orange-50/20 font-bold text-orange-700 dark:text-orange-300'
                        : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900'
                    }`}
                  >
                    <div className="font-bold">Harga Sendiri</div>
                    <div className="mt-0.5 text-[10px] text-slate-500">
                      Input nominal bebas
                    </div>
                  </button>
                </div>

                {priceMode === 'CUSTOM' && (
                  <div className="grid grid-cols-1 gap-2.5 pt-1 sm:grid-cols-2">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-600">
                        Harga Tampilan Etalase (Rp) *
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={customPriceStr}
                        onChange={(e) =>
                          setCustomPriceStr(formatRupiahInput(e.target.value))
                        }
                        placeholder="Contoh: 3.924.000"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-orange-600 focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-600">
                        Harga Coret / Normal (Opsional)
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={customOriginalPriceStr}
                        onChange={(e) =>
                          setCustomOriginalPriceStr(
                            formatRupiahInput(e.target.value)
                          )
                        }
                        placeholder="Contoh: 4.500.000"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Daftar Barang di Dalam Etalase & Pilih Barang Cover */}
              <div className="space-y-2.5 rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    4. Barang di Dalam Etalase ({selectedItems.length} Produk)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Klik &ldquo;Jadikan Cover&rdquo; untuk memilih barang utama
                  </span>
                </div>

                {selectedItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400">
                    Belum ada produk dipilih. Centang produk di kolom kanan
                    untuk memasukkannya ke etalase ini.
                  </div>
                ) : (
                  <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                    {selectedItems.map((item, idx) => {
                      const prod = productsById.get(item.productId)
                      if (!prod) return null
                      const isCover =
                        coverProductId === item.productId ||
                        (!coverProductId && idx === 0)
                      const minP = getProductEffectiveMinPrice(prod)
                      const stk = getProductEffectiveStock(prod)

                      return (
                        <div
                          key={item.productId}
                          className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border p-2.5 text-xs ${
                            isCover
                              ? 'border-orange-400 bg-orange-50/25 dark:border-orange-500/60 dark:bg-orange-950/20'
                              : 'border-slate-200/80 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-2.5">
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
                              <Image
                                src={
                                  prod.images?.[0] ||
                                  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&q=80'
                                }
                                alt={prod.name}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-bold text-slate-900 dark:text-white">
                                {prod.name}
                              </p>
                              <div className="mt-1 flex items-center gap-2">
                                <span className="text-[10px] text-slate-400">
                                  Label Tombol:
                                </span>
                                <input
                                  type="text"
                                  value={item.label}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    setSelectedItems((prev) =>
                                      prev.map((x) =>
                                        x.productId === item.productId
                                          ? { ...x, label: val }
                                          : x
                                      )
                                    )
                                  }}
                                  placeholder="Contoh: Fold 5 12/512GB"
                                  className="w-40 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="font-bold text-orange-600">
                                Rp {minP.toLocaleString('id-ID')}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Stok: {stk}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setCoverProductId(item.productId)}
                              className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
                                isCover
                                  ? 'bg-orange-500 text-white'
                                  : 'border border-slate-200 bg-white text-slate-600 hover:border-orange-400 hover:text-orange-600'
                              }`}
                            >
                              {isCover ? '★ Cover' : 'Jadikan Cover'}
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleProductInEtalase(prod)}
                              className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                              title="Keluarkan dari etalase"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Kolom Kanan (5 cols): Pratinjau Kartu Depan & Pemilih Produk Toko */}
            <div className="space-y-5 lg:col-span-5">
              {/* Pratinjau Kartu Depan Etalase */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <span className="mb-2.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Pratinjau Tampilan Depan (/gadget)
                </span>
                <div className="mx-auto max-w-[230px] rounded-2xl border-2 border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="relative mb-2.5 aspect-square w-full overflow-hidden rounded-xl bg-slate-100">
                    <Image
                      src={previewStats.previewImg}
                      alt={previewStats.previewTitle}
                      fill
                      sizes="230px"
                      className="object-cover"
                    />
                    <div className="shadow-xs absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-slate-900">
                      <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                      <span>5.0</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="truncate">Toko Resmi</span>
                      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-700">
                        {previewStats.totalStock} Unit
                      </span>
                    </div>
                    <h4 className="line-clamp-2 text-xs font-bold leading-snug text-slate-900 dark:text-white">
                      {previewStats.previewTitle}
                    </h4>
                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-sm font-black text-slate-950 dark:text-white">
                        Rp {previewStats.finalPrice.toLocaleString('id-ID')}
                      </span>
                      <span className="rounded bg-orange-50 px-1.5 py-0.5 text-[9px] font-bold text-orange-600">
                        {selectedItems.length} Tipe
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pilih Produk dari Gudang Toko */}
              <div className="space-y-2.5 rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 dark:text-white">
                    Pilih Produk ke Dalam Etalase
                  </label>
                  <span className="text-[10px] text-slate-400">
                    1 produk bisa masuk banyak etalase
                  </span>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Cari nama HP / produk toko..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs text-slate-800 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
                  {filteredCandidateProducts.map((prod) => {
                    const isChecked = selectedItems.some(
                      (i) => i.productId === prod.id
                    )
                    const minP = getProductEffectiveMinPrice(prod)
                    const stk = getProductEffectiveStock(prod)

                    return (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => toggleProductInEtalase(prod)}
                        className={`flex w-full items-center justify-between gap-2 rounded-xl border p-2 text-left text-xs transition ${
                          isChecked
                            ? 'border-orange-500 bg-orange-50/20 dark:bg-orange-950/20'
                            : 'border-slate-100 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900'
                        }`}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <div
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                              isChecked
                                ? 'border-orange-500 bg-orange-500 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isChecked && <Check className="h-3 w-3" />}
                          </div>
                          <span className="truncate font-semibold text-slate-800 dark:text-slate-200">
                            {prod.name}
                          </span>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="block font-bold text-orange-600">
                            Rp {minP.toLocaleString('id-ID')}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Stok: {stk}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>
                {editingEtalase
                  ? 'Simpan Perubahan Etalase'
                  : 'Terbitkan Etalase'}
              </span>
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
