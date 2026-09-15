'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  ArrowLeft,
  Smartphone,
  Plus,
  Trash2,
  Gift,
  ShieldCheck,
  Check,
  Building2,
  Upload,
  X,
  ImageIcon,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatRupiahInput, parseRupiahInput } from '@/lib/utils'
import { CreatableCombobox } from '@/components/ui/creatable-combobox'

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

export default function NewGadgetProductPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const isStoreAdmin = session?.user?.role === 'STORE_ADMIN'
  const userStoreId = session?.user?.storeId

  const [loading, setLoading] = useState(false)
  const [stores, setStores] = useState<any[]>([])
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
    condition: 'LIKE_NEW',
    price: '',
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
      stock: '3',
    },
    {
      name: '256GB - Natural Titanium',
      ram: '8GB',
      storage: '256GB',
      color: 'Natural Titanium',
      image: '',
      price: '',
      stock: '2',
    },
  ])

  const fetchStores = useCallback(async () => {
    try {
      const res = await fetch('/api/stores?scoped=true')
      const data = await res.json()
      if (data.success && data.data) {
        let storeList = data.data
        if (isStoreAdmin && userStoreId) {
          const matched = storeList.filter((s: any) => s.id === userStoreId)
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

  useEffect(() => {
    fetchStores()
    // Revoke blob URLs on unmount
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url))
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
        stock: '1',
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
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa format gambar')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Maksimal ukuran foto 10MB')
      return
    }
    try {
      const fd = new FormData()
      fd.append('images', file)
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
    } catch (err: any) {
      toast.error(err.message || 'Gagal upload foto varian')
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

      // Validate
      for (const f of toUpload) {
        if (!f.type.startsWith('image/')) {
          toast.error(`"${f.name}" bukan format gambar yang valid`)
          return
        }
        if (f.size > 10 * 1024 * 1024) {
          toast.error(`"${f.name}" terlalu besar (maks. 10MB)`)
          return
        }
      }

      // Show instant local previews
      const blobs = toUpload.map((f) => URL.createObjectURL(f))
      setImagePreviews((prev) => [...prev, ...blobs])

      // Upload to VPS
      setUploadingImages(true)
      try {
        const fd = new FormData()
        toUpload.forEach((f) => fd.append('images', f))
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
      } catch (err: any) {
        toast.error(err.message || 'Gagal upload foto')
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
            stock: parseInt(String(v.stock), 10) || 0,
          })),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan produk')
      }

      toast.success('Produk gadget berhasil ditambahkan ke toko fisik!')
      router.push('/dashboard/admin/products')
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-2 sm:px-6 sm:py-4">
      {/* 1. Header Hero Section */}
      <div className="shadow-xs flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
            <Smartphone className="h-3.5 w-3.5 text-orange-500" />
            <span>Inventori Toko Resmi</span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            Tambah Produk Gadget
          </h1>

          <p className="max-w-xl text-xs text-slate-600 dark:text-slate-400 sm:text-sm">
            Masukkan spesifikasi gadget, pilih toko pemilik, atur varian
            warna/RAM, dan aktifkan garansi 30 hari + bonus 3-in-1.
          </p>
        </div>

        <Link
          href="/dashboard/admin/products"
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          <span>← Kembali ke Katalog</span>
        </Link>
      </div>

      {/* 2. Form Card */}
      <div className="shadow-xs rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Nama Lengkap Gadget *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Contoh: iPhone 15 Pro Max 256GB Natural Titanium"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium outline-none transition focus:border-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Merek (Brand) *
              </label>
              <CreatableCombobox
                value={form.brand}
                onChange={(val) => setForm({ ...form, brand: val })}
                options={BRAND_OPTIONS}
                placeholder="Pilih atau ketik merek baru..."
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Toko Pemilik *
                </label>
                {isStoreAdmin && (
                  <span className="rounded-md bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                    Toko Anda (Otomatis)
                  </span>
                )}
              </div>

              {isStoreAdmin ? (
                stores.length > 0 ? (
                  <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-slate-100/80 px-4 py-3 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
                    <Building2 className="h-4 w-4 shrink-0 text-orange-500" />
                    <span className="truncate">
                      {stores[0].name} ({stores[0].city || 'Indonesia'})
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-slate-100/80 px-4 py-3 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Memuat cabang toko Anda...</span>
                  </div>
                )
              ) : (
                <select
                  value={form.storeId}
                  onChange={(e) =>
                    setForm({ ...form, storeId: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium outline-none transition focus:border-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.city || 'Indonesia'})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Harga Jual (Rp) *
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
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium outline-none transition focus:border-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
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
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium outline-none transition focus:border-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Total Stok Unit
              </label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium outline-none transition focus:border-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Kondisi Fisik
              </label>
              <CreatableCombobox
                value={form.condition}
                onChange={(val) => setForm({ ...form, condition: val })}
                options={CONDITION_OPTIONS}
                placeholder="Pilih atau ketik kondisi fisik..."
              />
            </div>

            {/* ─── Berat & Tarif Ongkir per Kg ─── */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Berat Produk (gram) *
              </label>
              <input
                type="number"
                min={1}
                value={form.weightGram}
                onChange={(e) =>
                  setForm({ ...form, weightGram: e.target.value })
                }
                placeholder="500"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium outline-none transition focus:border-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <p className="text-[10px] text-slate-400">
                Berat unit dalam gram (misal: 500 = 0,5 kg)
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Tarif Ongkir Dasar per Kg (Rp) *
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formatRupiahInput(form.pricePerKg)}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '')
                  setForm({ ...form, pricePerKg: raw })
                }}
                placeholder="20.000"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium outline-none transition focus:border-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <p className="text-[10px] text-slate-400">
                Tarif dasar ongkir per kg (default: Rp 20.000)
              </p>
            </div>
          </div>

          {/* ─── Photo Upload Section ─────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Foto Produk{' '}
                <span className="font-normal text-slate-500">
                  ({uploadedImages.length}/5 foto)
                </span>
              </label>
              {uploadedImages.length > 0 && (
                <span className="text-[10px] text-slate-400">
                  Foto pertama tampil sebagai cover
                </span>
              )}
            </div>

            {/* Drop zone + previews */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 transition hover:border-blue-300 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-blue-700"
            >
              {/* Image grid */}
              {uploadedImages.length > 0 && (
                <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {uploadedImages.map((url, i) => (
                    <div
                      key={i}
                      className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                    >
                      {}
                      <img
                        src={imagePreviews[i] || url}
                        alt={`Foto produk ${i + 1}`}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      {/* Cover badge */}
                      {i === 0 && (
                        <span className="absolute left-1 top-1 rounded-full bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
                          Cover
                        </span>
                      )}
                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow transition group-hover:opacity-100"
                        aria-label="Hapus foto"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  {/* Add more slot */}
                  {uploadedImages.length < 5 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImages}
                      className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 transition hover:border-blue-400 hover:text-blue-500 disabled:opacity-50 dark:border-slate-600"
                    >
                      <Plus className="h-5 w-5" />
                      <span className="text-[9px] font-semibold">Tambah</span>
                    </button>
                  )}
                </div>
              )}

              {/* Empty state — full drop zone */}
              {uploadedImages.length === 0 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImages}
                  className="flex w-full flex-col items-center justify-center gap-3 py-8 text-slate-400 transition hover:text-blue-500 disabled:opacity-50"
                >
                  {uploadingImages ? (
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40">
                      <ImageIcon className="h-7 w-7 text-blue-500" />
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {uploadingImages
                        ? 'Sedang mengupload...'
                        : 'Seret foto ke sini atau klik untuk pilih'}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      JPG, PNG, WebP • Maks. 10MB per foto • Maks. 5 foto
                    </p>
                  </div>
                </button>
              )}

              {/* Upload spinner overlay when uploading more photos */}
              {uploadingImages && uploadedImages.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Mengupload foto...</span>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              aria-label="Upload foto produk"
            />
          </div>

          {/* Value Props & Bonuses */}
          <div className="space-y-3 rounded-3xl border border-orange-200/60 bg-orange-50/60 p-5 dark:border-orange-900/40 dark:bg-orange-950/20">
            <h3 className="flex items-center gap-1.5 text-xs font-bold text-orange-900 dark:text-orange-300">
              <Gift className="h-4 w-4 text-orange-500" /> Skema Garansi 30 Hari
              &amp; Bonus 3-in-1 Bawaan:
            </h3>

            <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
              <label className="flex cursor-pointer items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={form.includesCharger}
                  onChange={(e) =>
                    setForm({ ...form, includesCharger: e.target.checked })
                  }
                  className="h-4 w-4 rounded text-orange-500"
                />
                <span>Free Charger 20W</span>
              </label>

              <label className="flex cursor-pointer items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={form.includesScreenProtector}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      includesScreenProtector: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded text-orange-500"
                />
                <span>Free Antigores 9D</span>
              </label>

              <label className="flex cursor-pointer items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={form.includesCase}
                  onChange={(e) =>
                    setForm({ ...form, includesCase: e.target.checked })
                  }
                  className="h-4 w-4 rounded text-orange-500"
                />
                <span>Free Softcase</span>
              </label>
            </div>
          </div>

          {/* Variants */}
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Daftar Varian Gadget ({variants.length})
                </h3>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  Kustomisasi RAM, Storage, Warna &amp; Foto Spesifik per Varian
                </p>
              </div>
              <button
                type="button"
                onClick={addVariant}
                className="shadow-xs inline-flex cursor-pointer items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Varian</span>
              </button>
            </div>

            <div className="space-y-3">
              {variants.map((v, i) => (
                <div
                  key={i}
                  className="shadow-2xs space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
                >
                  {/* Variant Top Bar: Header, Photo Slot, Delete */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        Varian #{i + 1}
                      </span>
                      {v.name && (
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {v.name}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Variant Photo uploader & preview */}
                      <div className="flex items-center gap-2">
                        {v.image ? (
                          <div className="group relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                            <img
                              src={v.image}
                              alt={`Foto Varian ${i + 1}`}
                              className="h-full w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => updateVariant(i, 'image', '')}
                              className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/60 text-[10px] font-bold text-white opacity-0 transition group-hover:opacity-100"
                              title="Hapus Foto Varian"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-orange-500 hover:bg-orange-50/50 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            <Upload className="h-3 w-3 text-orange-500" />
                            <span>Upload Foto Varian</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleVariantImageUpload(i, file)
                                e.target.value = ''
                              }}
                            />
                          </label>
                        )}

                        {/* Quick pick from already uploaded product gallery */}
                        {uploadedImages.length > 0 && !v.image && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400">
                              atau pilih:
                            </span>
                            <div className="flex items-center gap-1">
                              {uploadedImages
                                .slice(0, 4)
                                .map((imgUrl, imgIdx) => (
                                  <button
                                    key={imgIdx}
                                    type="button"
                                    onClick={() =>
                                      updateVariant(i, 'image', imgUrl)
                                    }
                                    className="h-7 w-7 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-slate-200 transition hover:border-orange-500"
                                    title="Gunakan foto produk ini"
                                  >
                                    <img
                                      src={imgUrl}
                                      alt=""
                                      className="h-full w-full object-cover"
                                    />
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariant(i)}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/20"
                          title="Hapus varian ini"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inputs Grid: Nama, RAM, Storage, Warna, Harga, Stok */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
                    <div className="lg:col-span-2">
                      <CreatableCombobox
                        label="Nama Varian"
                        placeholder="e.g. 256GB - Natural Titanium"
                        size="sm"
                        value={v.name}
                        options={[
                          `${v.storage || '256GB'} - ${v.color || 'Natural Titanium'}`,
                          'Standar',
                          'Paket Spesial',
                        ].filter(Boolean)}
                        onChange={(val) => updateVariant(i, 'name', val)}
                      />
                    </div>

                    <div>
                      <CreatableCombobox
                        label="RAM"
                        placeholder="8GB"
                        size="sm"
                        value={v.ram}
                        options={RAM_OPTIONS}
                        onChange={(val) => updateVariant(i, 'ram', val)}
                      />
                    </div>

                    <div>
                      <CreatableCombobox
                        label="Storage"
                        placeholder="256GB"
                        size="sm"
                        value={v.storage}
                        options={STORAGE_OPTIONS}
                        onChange={(val) => {
                          updateVariant(i, 'storage', val)
                          if (
                            !v.name ||
                            v.name === 'Varian Baru' ||
                            v.name.includes('GB')
                          ) {
                            updateVariant(
                              i,
                              'name',
                              `${val} - ${v.color || 'Natural Titanium'}`
                            )
                          }
                        }}
                      />
                    </div>

                    <div>
                      <CreatableCombobox
                        label="Warna"
                        placeholder="Natural Titanium"
                        size="sm"
                        value={v.color}
                        options={COLOR_OPTIONS}
                        onChange={(val) => {
                          updateVariant(i, 'color', val)
                          if (
                            !v.name ||
                            v.name === 'Varian Baru' ||
                            v.name.includes('GB')
                          ) {
                            updateVariant(
                              i,
                              'name',
                              `${v.storage || '256GB'} - ${val}`
                            )
                          }
                        }}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        Harga Varian (Rp)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatRupiahInput(v.price)}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '')
                          updateVariant(i, 'price', raw)
                        }}
                        placeholder={
                          formatRupiahInput(form.price) || '18.999.000'
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        Stok Unit
                      </label>
                      <input
                        type="number"
                        value={v.stock}
                        onChange={(e) =>
                          updateVariant(i, 'stock', e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Deskripsi Produk
            </label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Deskripsi garansi 30 hari, kondisi fisik unit, kelengkapan toko..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-medium outline-none transition focus:border-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <Link
              href="/dashboard/admin/products"
              className="rounded-full border border-slate-200 bg-white px-6 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading || uploadingImages}
              className="rounded-full bg-orange-500 px-8 py-2.5 text-xs font-semibold text-white shadow-sm shadow-orange-500/25 transition-all hover:bg-orange-600 active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Menyimpan Produk...' : 'Simpan ke Inventori'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
