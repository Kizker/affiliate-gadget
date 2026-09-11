'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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

export default function NewGadgetProductPage() {
  const router = useRouter()
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
      price: '',
      stock: '3',
    },
    {
      name: '256GB - Natural Titanium',
      ram: '8GB',
      storage: '256GB',
      color: 'Natural Titanium',
      price: '',
      stock: '2',
    },
  ])

  useEffect(() => {
    fetchStores()
    // Revoke blob URLs on unmount
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchStores = async () => {
    try {
      const res = await fetch('/api/stores')
      const data = await res.json()
      if (data.success && data.data) {
        setStores(data.data)
        if (data.data.length > 0) {
          setForm((prev) => ({ ...prev, storeId: data.data[0].id }))
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        name: 'Varian Baru',
        ram: '8GB',
        storage: '128GB',
        color: 'Midnight',
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
    if (!form.name || !numericPrice) {
      toast.error('Nama gadget dan harga wajib diisi')
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
          images: finalImages,
          price: numericPrice,
          originalPrice: form.originalPrice
            ? parseRupiahInput(form.originalPrice)
            : undefined,
          variants: variants.map((v) => ({
            ...v,
            price: v.price ? parseRupiahInput(v.price) : numericPrice,
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
              <select
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium outline-none transition focus:border-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="Apple">Apple</option>
                <option value="Samsung">Samsung</option>
                <option value="Xiaomi">Xiaomi</option>
                <option value="ASUS">ASUS ROG</option>
                <option value="Vivo">Vivo</option>
                <option value="Oppo">Oppo</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Toko Pemilik *
              </label>
              <select
                value={form.storeId}
                onChange={(e) => setForm({ ...form, storeId: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium outline-none transition focus:border-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.city || 'Indonesia'})
                  </option>
                ))}
              </select>
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
              <select
                value={form.condition}
                onChange={(e) =>
                  setForm({ ...form, condition: e.target.value })
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium outline-none transition focus:border-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="LIKE_NEW">Second Like New (Mulus 99%)</option>
                <option value="SECOND_MULUS">Second Mulus (95% - 98%)</option>
                <option value="GRADE_A">Second Grade A (Normal 100%)</option>
              </select>
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
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Varian RAM / Storage / Warna
              </h3>
              <button
                type="button"
                onClick={addVariant}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-3.5 w-3.5" /> Tambah Varian
              </button>
            </div>

            <div className="space-y-2">
              {variants.map((v, i) => (
                <div
                  key={i}
                  className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/60 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <input
                    type="text"
                    placeholder="Nama Varian (mis: 256GB Titanium)"
                    value={v.name}
                    onChange={(e) => updateVariant(i, 'name', e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none dark:border-slate-700 dark:bg-slate-900"
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Harga Varian (Rp)"
                    value={formatRupiahInput(v.price)}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '')
                      updateVariant(i, 'price', raw)
                    }}
                    className="w-36 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none dark:border-slate-700 dark:bg-slate-900"
                  />
                  <input
                    type="number"
                    placeholder="Stok"
                    value={v.stock}
                    onChange={(e) => updateVariant(i, 'stock', e.target.value)}
                    className="w-20 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none dark:border-slate-700 dark:bg-slate-900"
                  />
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(i)}
                      className="p-2 text-slate-400 transition hover:text-red-500"
                      aria-label="Hapus Varian"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
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
