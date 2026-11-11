'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Upload, X, Video, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatRupiahInput, parseRupiahInput } from '@/lib/utils'
import {
  validateAndCompressImage,
  validateVideo,
} from '@/lib/media-upload-client'
import { ProductNewMobileView } from '@/components/admin/products/product-new-mobile-view'

const BRAND_OPTIONS = [
  'Apple',
  'Samsung',
  'Xiaomi',
  'ASUS ROG',
  'Vivo',
  'Oppo',
  'Google Pixel',
  'Realme',
  'Infinix',
  'Sony',
  'Huawei',
  'Nothing',
]

const CONDITION_OPTIONS = [
  { value: 'LIKE_NEW', label: 'Second Like New (Mulus 99%)' },
  { value: 'SECOND_MULUS', label: 'Second Mulus (95% - 98%)' },
  { value: 'GRADE_A', label: 'Second Grade A (Normal 100%)' },
  { value: 'BARU', label: 'Baru BNIB (Segel Pabrik)' },
]

const RAM_OPTIONS = ['4GB', '6GB', '8GB', '12GB', '16GB', '18GB', '24GB']
const STORAGE_OPTIONS = ['64GB', '128GB', '256GB', '512GB', '1TB', '2TB']
const COLOR_OPTIONS = [
  'Black Titanium',
  'Natural Titanium',
  'White Titanium',
  'Blue Titanium',
  'Desert Titanium',
  'Midnight',
  'Starlight',
  'Space Gray',
  'Silver',
  'Gold',
  'Graphite',
  'Phantom Black',
  'Titanium Gray',
  'Titanium Violet',
  'Titanium Yellow',
  'Deep Purple',
  'Hitam',
  'Putih',
]

interface StoreApplicant {
  id: string
  name: string
  city?: string
}

export default function NewGadgetProductPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const isStoreAdmin = session?.user?.role === 'STORE_ADMIN'
  const userStoreId = session?.user?.storeId

  const [loading, setLoading] = useState(false)
  const [stores, setStores] = useState<StoreApplicant[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Uploaded image URLs (from VPS)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  // Preview blobs for display before URL is confirmed
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  const [form, setForm] = useState({
    name: '',
    brand: 'Apple',
    category: 'Smartphone',
    model: '',
    sku: '',
    condition: 'LIKE_NEW',
    price: '',
    costPrice: '',
    originalPrice: '',
    stock: '5',
    weightGram: '500',
    pricePerKg: '20000',
    storeId: '',
    description: '',
    warrantyDays: '30',
    includesCharger: true,
    includesScreenProtector: true,
    includesCase: true,
    isTaxable: true,
    specs: {
      Chipset: 'Apple A17 Pro / Snapdragon 8 Gen 3',
      Layar: '6.7 inch OLED 120Hz ProMotion',
      Kamera: '48MP Main + 12MP Ultra-wide + 12MP Telephoto',
      Baterai: '4.422 mAh Fast Charging 20W',
    },
  })

  const [variants, setVariants] = useState([
    {
      name: '128GB - Black Titanium',
      ram: '8GB',
      storage: '128GB',
      color: 'Black Titanium',
      image: '',
      price: '',
      costPrice: '',
      stock: '3',
      sku: '',
    },
    {
      name: '256GB - Natural Titanium',
      ram: '8GB',
      storage: '256GB',
      color: 'Natural Titanium',
      image: '',
      price: '',
      costPrice: '',
      stock: '2',
      sku: '',
    },
  ])

  const fetchStores = useCallback(async () => {
    try {
      const res = await fetch('/api/stores?scoped=true')
      const data = await res.json()
      if (data.success && data.data) {
        let storeList = data.data
        if (isStoreAdmin && userStoreId) {
          const matched = storeList.filter(
            (s: StoreApplicant) => s.id === userStoreId
          )
          if (matched.length > 0) {
            storeList = matched
          }
        }
        setStores(storeList)
        if (isStoreAdmin && userStoreId) {
          setForm((prev) => ({ ...prev, storeId: userStoreId }))
        } else if (storeList.length > 0) {
          setForm((prev) => ({
            ...prev,
            storeId: prev.storeId || storeList[0].id,
          }))
        }
      }
    } catch (e) {
      console.error(e)
    }
  }, [isStoreAdmin, userStoreId])

  const imagePreviewsRef = useRef<string[]>([])
  imagePreviewsRef.current = imagePreviews

  useEffect(() => {
    fetchStores()
    // Revoke blob URLs on unmount
    return () => {
      imagePreviewsRef.current.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [fetchStores])

  // Sync storeId whenever session loads userStoreId
  useEffect(() => {
    if (isStoreAdmin && userStoreId) {
      setForm((prev) => ({ ...prev, storeId: userStoreId }))
    }
  }, [isStoreAdmin, userStoreId])

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        name: '',
        ram: '8GB',
        storage: '256GB',
        color: 'Natural Titanium',
        image: '',
        price: form.price,
        costPrice: form.costPrice || '',
        stock: '1',
        sku: '',
      },
    ])
  }

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index))
  }

  const updateVariant = (index: number, field: string, value: string) => {
    setVariants((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleVariantImageUpload = async (index: number, file: File) => {
    try {
      let fileToUpload = file
      try {
        fileToUpload = await validateAndCompressImage(file)
        if (file.size > 2 * 1024 * 1024) {
          toast.info(
            `Foto varian "${file.name}" otomatis dikompres ke ukuran optimal (< 2 MB).`
          )
        }
      } catch (valErr: unknown) {
        const msg =
          valErr instanceof Error
            ? valErr.message
            : 'Format foto varian harus JPG, JPEG, atau PNG.'
        toast.error(msg)
        return
      }

      const fd = new FormData()
      fd.append('images', fileToUpload)
      const res = await fetch('/api/products/upload-images', {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (!res.ok || !data.urls?.[0]) {
        throw new Error(data.error || 'Gagal upload foto varian')
      }
      updateVariant(index, 'image', data.urls[0])
      toast.success('Foto varian berhasil diunggah')
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Gagal upload foto varian'
      toast.error(msg)
    }
  }

  // ─── Image Upload Handlers ───────────────────────────────────────────────
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      if (!files.length) return

      const remaining = 5 - uploadedImages.length
      if (remaining <= 0) {
        toast.error('Maksimal 5 foto produk')
        return
      }

      const toUpload = files.slice(0, remaining)
      if (files.length > remaining) {
        toast.warning(
          `Hanya ${remaining} foto lagi yang bisa ditambahkan (maks. 5)`
        )
      }

      // Validate and process (compress images > 2MB, validate MP4 video)
      const processedFiles: File[] = []
      for (const f of toUpload) {
        const isVid =
          f.type.startsWith('video/') || f.name.toLowerCase().endsWith('.mp4')
        try {
          if (isVid) {
            await validateVideo(f)
            processedFiles.push(f)
          } else {
            const compressed = await validateAndCompressImage(f)
            if (f.size > 2 * 1024 * 1024) {
              toast.info(
                `Foto "${f.name}" otomatis dikompres ke ukuran optimal (< 2 MB).`
              )
            }
            processedFiles.push(compressed)
          }
        } catch (valErr: unknown) {
          const msg =
            valErr instanceof Error
              ? valErr.message
              : `File "${f.name}" tidak valid`
          toast.error(msg)
          if (fileInputRef.current) fileInputRef.current.value = ''
          return
        }
      }

      // Show instant local previews
      const blobs = processedFiles.map((f) => URL.createObjectURL(f))
      setImagePreviews((prev) => [...prev, ...blobs])

      // Upload to VPS
      setUploadingImages(true)
      try {
        const fd = new FormData()
        processedFiles.forEach((f) => fd.append('images', f))
        const res = await fetch('/api/products/upload-images', {
          method: 'POST',
          body: fd,
        })
        const data = await res.json()
        if (!res.ok || !data.urls) {
          throw new Error(data.error || 'Gagal upload foto')
        }
        setUploadedImages((prev) => [...prev, ...data.urls])
        toast.success(`${data.urls.length} foto berhasil diupload`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal upload foto'
        toast.error(msg)
        // Remove the blob previews we just added
        setImagePreviews((prev) => prev.slice(0, prev.length - blobs.length))
        blobs.forEach((b) => URL.revokeObjectURL(b))
      } finally {
        setUploadingImages(false)
        // Reset file input so same file can be reselected
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    },
    [uploadedImages.length]
  )

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const dt = e.dataTransfer
      if (dt.files.length > 0) {
        const fakeEvent = {
          target: { files: dt.files },
        } as unknown as React.ChangeEvent<HTMLInputElement>
        handleFileSelect(fakeEvent)
      }
    },
    [handleFileSelect]
  )

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numericPrice = parseRupiahInput(form.price)
    const finalStoreId =
      isStoreAdmin && userStoreId ? userStoreId : form.storeId

    if (!form.name || !numericPrice) {
      toast.error('Nama gadget dan harga wajib diisi')
      return
    }

    if (!finalStoreId) {
      toast.error('Toko pemilik wajib dipilih')
      return
    }

    setLoading(true)
    try {
      const finalImages =
        uploadedImages.length > 0
          ? uploadedImages
          : [
              'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
            ]

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          storeId: finalStoreId,
          images: finalImages,
          price: numericPrice,
          costPrice: form.costPrice ? parseRupiahInput(form.costPrice) : 0,
          originalPrice: form.originalPrice
            ? parseRupiahInput(form.originalPrice)
            : undefined,
          weightGram: parseInt(form.weightGram, 10) || 500,
          pricePerKg: parseRupiahInput(form.pricePerKg) || 20000,
          variants: variants.map((v) => ({
            name:
              v.name ||
              `${v.storage || ''} ${v.color ? `- ${v.color}` : ''}`.trim() ||
              'Standar',
            ram: v.ram,
            storage: v.storage,
            color: v.color,
            image: v.image || undefined,
            price: v.price ? parseRupiahInput(v.price) : numericPrice,
            costPrice: v.costPrice
              ? parseRupiahInput(v.costPrice)
              : form.costPrice
                ? parseRupiahInput(form.costPrice)
                : 0,
            stock: parseInt(String(v.stock), 10) || 0,
            sku: v.sku?.trim() || form.sku?.trim() || undefined,
          })),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan produk')
      }

      toast.success('Produk gadget berhasil ditambahkan ke toko fisik!')
      router.push('/dashboard/admin/products')
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Terjadi kesalahan'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const selectedStore =
    stores.find(
      (s) => s.id === (isStoreAdmin && userStoreId ? userStoreId : form.storeId)
    ) || stores[0]

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-2 sm:px-6 sm:py-4">
      {/* Mobile View */}
      <ProductNewMobileView
        form={form}
        setForm={setForm}
        variants={variants}
        setVariants={setVariants}
        stores={stores}
        selectedStore={selectedStore}
        isStoreAdmin={isStoreAdmin}
        userStoreId={userStoreId || undefined}
        BRAND_OPTIONS={BRAND_OPTIONS}
        CONDITION_OPTIONS={CONDITION_OPTIONS}
        RAM_OPTIONS={RAM_OPTIONS}
        STORAGE_OPTIONS={STORAGE_OPTIONS}
        COLOR_OPTIONS={COLOR_OPTIONS}
        uploadedImages={uploadedImages}
        imagePreviews={imagePreviews}
        uploadingImages={uploadingImages}
        handleFileSelect={handleFileSelect}
        removeImage={removeImage}
        addVariant={addVariant}
        removeVariant={removeVariant}
        updateVariant={updateVariant}
        handleVariantImageUpload={handleVariantImageUpload}
        loading={loading}
      />

      {/* Desktop View */}
      <div className="hidden space-y-6 md:block">
        {/* 1. Header Hero Section */}
        <div className="shadow-2xs flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
              Tambah Produk Gadget
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Lengkapi detail gadget, kelola varian spesifikasi, harga jual, dan
              paket garansi toko.
            </p>
          </div>

          <Link
            href="/dashboard/admin/products"
            className="shadow-2xs inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200/90 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <span>← Kembali ke Katalog</span>
          </Link>
        </div>

        {/* 2. Form Card */}
        <div className="shadow-2xs rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section A: Informasi Dasar Produk */}
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-950 dark:text-white">
                  Informasi Dasar Produk
                </h2>
                <p className="text-xs text-slate-400">
                  Identitas utama gadget dan toko pemilik
                </p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Nama Lengkap Gadget */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Nama Lengkap Gadget <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="iPhone 15 Pro Max 256GB Natural Titanium"
                    className="w-full rounded-2xl border border-slate-200/90 bg-white px-4 py-2.5 font-medium outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {/* Grid 2 Kolom: Kode SKU & Toko Pemilik */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Kode SKU Produk (Manual)
                    </label>
                    <input
                      type="text"
                      value={form.sku || ''}
                      onChange={(e) =>
                        setForm({ ...form, sku: e.target.value })
                      }
                      placeholder="Contoh: SKU-IP15PM-256-NAT"
                      className="w-full rounded-2xl border border-slate-200/90 bg-white px-4 py-2.5 font-medium outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Toko Pemilik <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200/90 bg-slate-50 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-800/60">
                      <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                        {selectedStore?.name ||
                          'Affiliate Gadget - Roxy Mas Jakarta'}
                      </span>
                      <span className="shrink-0 rounded-md bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                        Otomatis
                      </span>
                    </div>
                  </div>
                </div>

                {/* Grid 2 Kolom: Merek & Kondisi Fisik */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Merek (Brand) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.brand}
                      onChange={(e) =>
                        setForm({ ...form, brand: e.target.value })
                      }
                      className="w-full rounded-2xl border border-slate-200/90 bg-white px-4 py-2.5 font-medium outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Kondisi Fisik <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.condition}
                      onChange={(e) =>
                        setForm({ ...form, condition: e.target.value })
                      }
                      className="w-full rounded-2xl border border-slate-200/90 bg-white px-4 py-2.5 font-medium outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section B: Harga, Pajak & Stok */}
            <div className="space-y-4 border-t border-slate-100 pt-4 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-slate-950 dark:text-white">
                  Harga, Pajak &amp; Stok
                </h2>
                <p className="text-xs text-slate-400">
                  Penentuan nominal transaksi dan ketersediaan unit
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Harga Jual (Rp) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={formatRupiahInput(form.price)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '')
                        setForm({ ...form, price: raw })
                      }}
                      placeholder="18.999.000"
                      className="w-full rounded-2xl border border-slate-200/90 bg-white px-4 py-2.5 font-medium outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Harga Modal / HPP (Rp)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatRupiahInput(form.costPrice)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '')
                        setForm({ ...form, costPrice: raw })
                      }}
                      placeholder="16.500.000"
                      className="w-full rounded-2xl border border-slate-200/90 bg-white px-4 py-2.5 font-medium outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Harga Coret Pembanding (Rp)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatRupiahInput(form.originalPrice)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '')
                        setForm({ ...form, originalPrice: raw })
                      }}
                      placeholder="20.999.000"
                      className="w-full rounded-2xl border border-slate-200/90 bg-white px-4 py-2.5 font-medium outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Total Stok Unit <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.stock}
                      onChange={(e) =>
                        setForm({ ...form, stock: e.target.value })
                      }
                      className="w-full rounded-2xl border border-slate-200/90 bg-white px-4 py-2.5 font-medium outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Berat Produk (gram){' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={form.weightGram}
                      onChange={(e) =>
                        setForm({ ...form, weightGram: e.target.value })
                      }
                      className="w-full rounded-2xl border border-slate-200/90 bg-white px-4 py-2.5 font-medium outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Tarif Ongkir Dasar per Kg (Rp){' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatRupiahInput(form.pricePerKg)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '')
                        setForm({ ...form, pricePerKg: raw })
                      }}
                      className="w-full rounded-2xl border border-slate-200/90 bg-white px-4 py-2.5 font-medium outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* Status PPN Inklusif Strip */}
                <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    <strong className="text-slate-900 dark:text-white">
                      Status PPN Inklusif:
                    </strong>{' '}
                    Harga jual telah mencakup PPN 11% sesuai regulasi PKP
                  </span>
                  <label className="flex cursor-pointer items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={form.isTaxable}
                      onChange={(e) =>
                        setForm({ ...form, isTaxable: e.target.checked })
                      }
                      className="h-4 w-4 rounded accent-orange-500"
                    />
                    <span className="text-xs font-semibold">
                      Dikenakan PPN (PKP Toko)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Section C: Media & Fasilitas Bonus */}
            <div className="space-y-4 border-t border-slate-100 pt-4 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-slate-950 dark:text-white">
                  Media &amp; Fasilitas Bonus
                </h2>
                <p className="text-xs text-slate-400">
                  Upload foto produk dan kelengkapan garansi bawaan
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Foto &amp; Video Produk ({uploadedImages.length}/5)
                  </label>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/40 py-8 text-center transition hover:border-orange-300 hover:bg-orange-50/20"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                      <Video className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Klik atau seret file media produk ke sini
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Foto JPG/PNG hingga 2MB, Video MP4 maksimal 30MB
                      </p>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,video/mp4"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  {uploadedImages.length > 0 && (
                    <div className="mt-3 grid grid-cols-5 gap-3">
                      {uploadedImages.map((url, i) => (
                        <div
                          key={i}
                          className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-white"
                        >
                          <img
                            src={url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="shadow-xs absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Garansi 30 Hari & Bonus 3-in-1 Bawaan Banner */}
                <div className="rounded-2xl border border-orange-200/80 bg-orange-50/40 p-4">
                  <span className="mb-2 block text-xs font-bold text-orange-950 dark:text-orange-200">
                    Garansi 30 Hari &amp; Bonus 3-in-1 Bawaan:
                  </span>
                  <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.includesCharger}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            includesCharger: e.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded accent-orange-500"
                      />
                      <span>Free Charger 20W</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.includesScreenProtector}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            includesScreenProtector: e.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded accent-orange-500"
                      />
                      <span>Free Antigores 9D</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.includesCase}
                        onChange={(e) =>
                          setForm({ ...form, includesCase: e.target.checked })
                        }
                        className="h-4 w-4 rounded accent-orange-500"
                      />
                      <span>Free Softcase</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Section D: Daftar Varian Gadget */}
            <div className="space-y-4 border-t border-slate-100 pt-4 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-950 dark:text-white">
                    Daftar Varian Gadget
                  </h2>
                  <p className="text-xs text-slate-400">
                    Konfigurasi spesifikasi dan stok setiap tipe varian (
                    {variants.length} varian)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addVariant}
                  className="shadow-xs inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tambah Varian</span>
                </button>
              </div>

              <div className="space-y-3">
                {variants.map((v, i) => (
                  <div
                    key={i}
                    className="shadow-2xs space-y-4 rounded-2xl border border-slate-200/90 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          Varian #{i + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {v.name || 'Pilih Spesifikasi'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="shadow-2xs inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                          <Upload className="h-3.5 w-3.5" />
                          <span>Foto Varian</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleVariantImageUpload(i, file)
                              e.target.value = ''
                            }}
                          />
                        </label>

                        {variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVariant(i)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Varian Row 1: Nama Varian, Kode SKU, RAM, Storage, Warna, Harga Jual */}
                    <div className="grid grid-cols-12 gap-3 text-xs">
                      <div className="col-span-3 space-y-1">
                        <label className="font-semibold text-slate-500">
                          Nama Varian
                        </label>
                        <input
                          type="text"
                          value={v.name}
                          onChange={(e) =>
                            updateVariant(i, 'name', e.target.value)
                          }
                          placeholder="128GB - Black Titanium"
                          className="w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2 font-medium outline-none focus:border-orange-500"
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <label className="font-semibold text-slate-500">
                          Kode SKU
                        </label>
                        <input
                          type="text"
                          value={v.sku || ''}
                          onChange={(e) =>
                            updateVariant(i, 'sku', e.target.value)
                          }
                          placeholder="SKU-128-BLK"
                          className="w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2 font-medium outline-none focus:border-orange-500"
                        />
                      </div>
                      <div className="col-span-1 space-y-1">
                        <label className="font-semibold text-slate-500">
                          RAM
                        </label>
                        <input
                          type="text"
                          value={v.ram}
                          onChange={(e) =>
                            updateVariant(i, 'ram', e.target.value)
                          }
                          placeholder="8GB"
                          className="w-full rounded-xl border border-slate-200/90 bg-white px-2 py-2 text-center font-medium outline-none focus:border-orange-500"
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <label className="font-semibold text-slate-500">
                          Storage
                        </label>
                        <input
                          type="text"
                          value={v.storage}
                          onChange={(e) =>
                            updateVariant(i, 'storage', e.target.value)
                          }
                          placeholder="128GB"
                          className="w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2 font-medium outline-none focus:border-orange-500"
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <label className="font-semibold text-slate-500">
                          Warna
                        </label>
                        <input
                          type="text"
                          value={v.color}
                          onChange={(e) =>
                            updateVariant(i, 'color', e.target.value)
                          }
                          placeholder="Black Titanium"
                          className="w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2 font-medium outline-none focus:border-orange-500"
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <label className="font-semibold text-slate-500">
                          Harga Jual (Rp)
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatRupiahInput(v.price)}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '')
                            updateVariant(i, 'price', raw)
                          }}
                          placeholder="18.999.000"
                          className="w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2 font-medium outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    {/* Varian Row 2: Stok Unit & HPP Modal */}
                    <div className="grid grid-cols-12 gap-3 pt-1 text-xs">
                      <div className="col-span-2 space-y-1">
                        <label className="font-semibold text-slate-500">
                          Stok Unit
                        </label>
                        <input
                          type="number"
                          value={v.stock}
                          onChange={(e) =>
                            updateVariant(i, 'stock', e.target.value)
                          }
                          className="w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2 font-medium outline-none focus:border-orange-500"
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <label className="font-semibold text-slate-500">
                          HPP Modal (Rp)
                        </label>
                        <input
                          type="text"
                          disabled
                          value={formatRupiahInput(v.costPrice) || 'Otomatis'}
                          className="w-full rounded-xl border border-slate-200/90 bg-slate-50 px-3 py-2 font-medium text-slate-600 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section E: Deskripsi Produk */}
            <div className="space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-950 dark:text-white">
                Deskripsi Produk
              </h2>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Garansi resmi toko 30 hari. Unit 100% mulus (Like New), battery health prima, fullset original box beserta bonus kelengkapan 3-in-1."
                className="w-full rounded-2xl border border-slate-200/90 bg-white p-4 text-xs font-medium outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Submit Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <Link
                href="/dashboard/admin/products"
                className="shadow-2xs rounded-xl border border-slate-200/90 bg-white px-6 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="shadow-xs rounded-xl bg-orange-500 px-7 py-2.5 text-xs font-bold text-white transition hover:bg-orange-600 active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Menyimpan Produk...' : 'Simpan ke Inventori'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
