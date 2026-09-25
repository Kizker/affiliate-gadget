'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
  Save,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatRupiahInput, parseRupiahInput } from '@/lib/utils'
import { CreatableCombobox } from '@/components/ui/creatable-combobox'
import { CustomSelect } from '@/components/ui/custom-select'

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

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const { data: session } = useSession()
  const isStoreAdmin = session?.user?.role === 'STORE_ADMIN'
  const userStoreId = session?.user?.storeId

  const [initialLoading, setInitialLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [stores, setStores] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Uploaded images & previews
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  const [form, setForm] = useState({
    name: '',
    brand: 'Apple',
    category: 'Smartphone',
    model: '',
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
      Chipset: '',
      Layar: '',
      Kamera: '',
      Baterai: '',
    },
  })

  const [variants, setVariants] = useState<any[]>([])

  // Fetch initial product & stores
  useEffect(() => {
    if (!id) return
    const loadData = async () => {
      setInitialLoading(true)
      try {
        const [storesRes, productRes] = await Promise.all([
          fetch('/api/stores?scoped=true'),
          fetch(`/api/products/${id}`, { cache: 'no-store' }),
        ])

        const storesData = await storesRes.json()
        let storeList =
          storesData.success && storesData.data ? storesData.data : []
        if (isStoreAdmin && userStoreId) {
          const matched = storeList.filter((s: any) => s.id === userStoreId)
          if (matched.length > 0) {
            storeList = matched
          }
        }
        setStores(storeList)

        const productData = await productRes.json()
        const p = productData.data || productData

        if (!p || p.error) {
          toast.error('Produk tidak ditemukan')
          router.push('/dashboard/admin/products')
          return
        }

        // Security check: STORE_ADMIN can only view/edit products belonging to their store
        if (
          isStoreAdmin &&
          userStoreId &&
          p.storeId &&
          p.storeId !== userStoreId
        ) {
          toast.error(
            'Anda tidak berwenang mengedit produk dari cabang toko lain.'
          )
          router.push('/dashboard/admin/products')
          return
        }

        const existingSpecs =
          typeof p.specs === 'object' && p.specs !== null
            ? p.specs
            : {
                Chipset: 'Apple A17 Pro / Snapdragon 8 Gen 3',
                Layar: '6.7 inch OLED 120Hz ProMotion',
                Kamera: '48MP Main + 12MP Ultra-wide + 12MP Telephoto',
                Baterai: '4.422 mAh Fast Charging 20W',
              }

        setForm({
          name: p.name || '',
          brand: p.brand || 'Apple',
          category: p.category || 'Smartphone',
          model: p.model || '',
          condition: p.condition || 'LIKE_NEW',
          price: p.price ? String(p.price) : '',
          costPrice:
            p.costPrice !== undefined && p.costPrice !== null
              ? String(p.costPrice)
              : '',
          originalPrice: p.originalPrice ? String(p.originalPrice) : '',
          stock: String(p.stock ?? 5),
          weightGram: String(p.weightGram ?? 500),
          pricePerKg: String(p.pricePerKg ?? 20000),
          storeId: isStoreAdmin && userStoreId ? userStoreId : p.storeId || '',
          description: p.description || '',
          warrantyDays: String(p.warrantyDays ?? 30),
          includesCharger: Boolean(p.includesCharger ?? true),
          includesScreenProtector: Boolean(p.includesScreenProtector ?? true),
          includesCase: Boolean(p.includesCase ?? true),
          isTaxable: p.isTaxable !== false,
          specs: existingSpecs,
        })

        const imgs = Array.isArray(p.images) ? p.images : []
        setUploadedImages(imgs)
        setImagePreviews(imgs)

        if (Array.isArray(p.variants) && p.variants.length > 0) {
          setVariants(
            p.variants.map((v: any) => ({
              id: v.id,
              name: v.name || '',
              ram: v.ram || '8GB',
              storage: v.storage || '128GB',
              color: v.color || '',
              image: v.image || '',
              price: v.price ? String(v.price) : '',
              costPrice:
                v.costPrice !== undefined && v.costPrice !== null
                  ? String(v.costPrice)
                  : '',
              stock: String(v.stock ?? 1),
              sku: v.sku || '',
            }))
          )
        } else {
          setVariants([
            {
              name: 'Standar',
              ram: '8GB',
              storage: '128GB',
              color: 'Default',
              image: '',
              price: p.price ? String(p.price) : '',
              costPrice:
                p.costPrice !== undefined && p.costPrice !== null
                  ? String(p.costPrice)
                  : '',
              stock: String(p.stock ?? 1),
              sku: '',
            },
          ])
        }
      } catch (err) {
        console.error('Error loading product details:', err)
        toast.error('Gagal memuat data produk')
      } finally {
        setInitialLoading(false)
      }
    }

    loadData()

    return () => {
      imagePreviews.forEach((url) => {
        if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Variants helpers
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

  // Photo upload handler
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

      const blobs = toUpload.map((f) => URL.createObjectURL(f))
      setImagePreviews((prev) => [...prev, ...blobs])

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
        setImagePreviews((prev) => prev.slice(0, prev.length - blobs.length))
        blobs.forEach((b) => URL.revokeObjectURL(b))
      } finally {
        setUploadingImages(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    },
    [uploadedImages.length]
  )

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => {
      const blob = prev[index]
      if (blob?.startsWith('blob:')) URL.revokeObjectURL(blob)
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

  // Submit edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numericPrice = parseRupiahInput(form.price)
    if (!form.name || !numericPrice) {
      toast.error('Nama gadget dan harga wajib diisi')
      return
    }

    setSaving(true)
    try {
      const finalImages =
        uploadedImages.length > 0
          ? uploadedImages
          : [
              'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
            ]

      const finalStoreId =
        isStoreAdmin && userStoreId ? userStoreId : form.storeId
      const payload = {
        ...form,
        storeId: finalStoreId,
        images: finalImages,
        price: numericPrice,
        costPrice: form.costPrice ? parseRupiahInput(form.costPrice) : 0,
        originalPrice: form.originalPrice
          ? parseRupiahInput(form.originalPrice)
          : undefined,
        stock: parseInt(String(form.stock), 10) || 0,
        weightGram: parseInt(String(form.weightGram), 10) || 500,
        pricePerKg: parseRupiahInput(form.pricePerKg) || 20000,
        warrantyDays: parseInt(String(form.warrantyDays), 10) || 30,
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
          sku: v.sku || undefined,
        })),
      }

      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok || (data.success === false && data.error)) {
        throw new Error(data.error || 'Gagal memperbarui produk')
      }

      toast.success('Detail produk berhasil diperbarui!')
      router.push('/dashboard/admin/products')
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan saat menyimpan')
    } finally {
      setSaving(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-2 sm:px-6 sm:py-4">
        <div className="flex h-96 items-center justify-center rounded-3xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="text-center text-slate-400">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-orange-500" />
            <p className="text-xs font-semibold">
              Memuat data spesifikasi produk...
            </p>
          </div>
        </div>
      </div>
    )
  }

  const selectedStore =
    stores.find(
      (s) => s.id === (isStoreAdmin && userStoreId ? userStoreId : form.storeId)
    ) || stores[0]

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-2 sm:px-6 sm:py-4">
      {/* 1. Header Hero Section */}
      <div className="shadow-xs flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
            <Smartphone className="h-3.5 w-3.5 text-orange-500" />
            <span>Edit Inventori Produk Toko</span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            Edit Detail Produk Gadget
          </h1>

          <p className="max-w-xl text-xs text-slate-600 dark:text-slate-400 sm:text-sm">
            Perbarui spesifikasi produk, harga jual, stok fisik, varian
            warna/RAM, serta paket garansi dan proteksi unit.
          </p>
        </div>

        <Link
          href="/dashboard/admin/products"
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Katalog</span>
        </Link>
      </div>

      {/* 2. Form Card */}
      <div className="shadow-xs rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Nama Lengkap Gadget */}
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex h-5 items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nama Lengkap Gadget <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400">
                  Sertakan Merek, Seri, Storage & Warna
                </span>
              </div>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Contoh: iPhone 15 Pro Max 256GB Natural Titanium"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs font-medium outline-none transition focus:border-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900"
              />
            </div>

            {/* Baris 1: Merek (Brand) & Kondisi Fisik */}
            <div className="space-y-1.5">
              <div className="flex h-5 items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Merek (Brand) <span className="text-rose-500">*</span>
                </label>
              </div>
              <CreatableCombobox
                value={form.brand}
                onChange={(val) => setForm({ ...form, brand: val })}
                options={BRAND_OPTIONS}
                placeholder="Pilih atau ketik merek baru..."
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex h-5 items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Kondisi Fisik <span className="text-rose-500">*</span>
                </label>
              </div>
              <CreatableCombobox
                value={form.condition}
                onChange={(val) => setForm({ ...form, condition: val })}
                options={CONDITION_OPTIONS}
                placeholder="Pilih atau ketik kondisi fisik..."
              />
            </div>

            {/* Baris 2: Toko Pemilik (Full Width) */}
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex h-5 items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Toko Pemilik <span className="text-rose-500">*</span>
                </label>
                {isStoreAdmin && (
                  <span className="rounded-md bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                    Toko Anda (Otomatis)
                  </span>
                )}
              </div>
              {isStoreAdmin ? (
                stores.length > 0 ? (
                  <div className="flex h-10 items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-100/80 px-3.5 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
                    <Building2 className="h-4 w-4 shrink-0 text-orange-500" />
                    <span className="truncate">
                      {stores[0].name} ({stores[0].city || 'Indonesia'})
                    </span>
                  </div>
                ) : (
                  <div className="flex h-10 items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-100/80 px-3.5 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Memuat cabang toko Anda...</span>
                  </div>
                )
              ) : (
                <CustomSelect
                  value={form.storeId}
                  onChange={(val) =>
                    setForm({ ...form, storeId: val })
                  }
                  options={stores.map((s) => ({
                    value: s.id,
                    label: `${s.name} (${s.city || 'Indonesia'})`,
                  }))}
                  icon={<Building2 className="h-4 w-4 text-slate-400" />}
                />
              )}
            </div>

            {/* Baris 3: Harga Jual & Harga Modal / HPP */}
            <div className="space-y-1.5">
              <div className="flex h-5 items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Harga Jual (Rp) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400">
                  Harga Konsumen
                </span>
              </div>
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
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs font-medium outline-none transition focus:border-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex h-5 items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Harga Modal / HPP (Rp)
                </label>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Dasar Laba Bersih
                </span>
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={formatRupiahInput(form.costPrice)}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '')
                  setForm({ ...form, costPrice: raw })
                }}
                placeholder="16.500.000"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs font-medium outline-none transition focus:border-emerald-600 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900"
                title="Harga pokok modal unit untuk kalkulasi laba toko"
              />
            </div>

            {/* Status PPN Produk (Bebas PPN vs Dikenakan PPN) */}
            <div
              className={`p-5 sm:p-6 rounded-2xl border transition-all duration-200 sm:col-span-2 ${
                form.isTaxable
                  ? 'border-blue-300 bg-blue-50/70 dark:border-blue-800 dark:bg-blue-950/30'
                  : 'border-amber-300 bg-amber-50/70 dark:border-amber-800 dark:bg-amber-950/30'
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1.5 flex-1 pr-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Status Pajak Produk (PPN Inklusif)
                    </span>
                    {form.isTaxable ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-100/90 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 dark:border-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                        <Check className="h-3 w-3" /> Dikenakan PPN (Inklusif{' '}
                        {selectedStore?.vatRate ?? 11}%)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100/90 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:border-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                        Bebas PPN (Non-Pajak)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                    {form.isTaxable
                      ? selectedStore?.isPkp
                        ? `Harga jual di atas sudah termasuk PPN ${selectedStore?.vatRate ?? 11}% (Inklusif). DPP dan PPN Keluaran akan otomatis dipisahkan pada pelaporan akuntansi internal ${selectedStore?.companyName || selectedStore?.name || 'Toko'}.`
                        : `Dikenakan PPN aktif, namun cabang toko (${selectedStore?.name || 'Toko'}) saat ini berstatus Non-PKP sehingga pemotongan PPN bernilai Rp 0.`
                      : 'Produk ini ditandai BEBAS PPN (Tax-Exempt). Penjualan produk tidak memotong PPN, nilai DPP dicatat 100% penuh harga produk, dan PPN tercatat Rp 0 pada faktur pembukuan.'}
                  </p>
                </div>

                <label className="shadow-xs flex shrink-0 cursor-pointer select-none items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={form.isTaxable}
                    onChange={(e) =>
                      setForm({ ...form, isTaxable: e.target.checked })
                    }
                    className="h-5 w-5 cursor-pointer rounded border-slate-300 text-blue-600 accent-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {form.isTaxable
                      ? 'Dikenakan PPN (mengikuti PKP toko)'
                      : 'Bebas PPN (PPN Rp 0)'}
                  </span>
                </label>
              </div>
            </div>

            {/* Baris 4: Harga Coret Pembanding & Total Stok Unit */}
            <div className="space-y-1.5">
              <div className="flex h-5 items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Harga Coret Pembanding (Rp)
                </label>
                <span className="text-[10px] text-slate-400">
                  Coret Diskon (Opsional)
                </span>
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={formatRupiahInput(form.originalPrice)}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '')
                  setForm({ ...form, originalPrice: raw })
                }}
                placeholder="20.999.000"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs font-medium outline-none transition focus:border-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex h-5 items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Total Stok Unit <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400">
                  Kuantitas Fisik Siap Jual
                </span>
              </div>
              <input
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                placeholder="10"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs font-medium outline-none transition focus:border-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900"
              />
            </div>

            {/* Baris 5: Berat Produk & Tarif Ongkir Dasar */}
            <div className="space-y-1.5">
              <div className="flex h-5 items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Berat Produk (gram) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400">
                  Contoh: 500 = 0,5 kg
                </span>
              </div>
              <input
                type="number"
                min={1}
                value={form.weightGram}
                onChange={(e) =>
                  setForm({ ...form, weightGram: e.target.value })
                }
                placeholder="500"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs font-medium outline-none transition focus:border-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex h-5 items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tarif Ongkir Dasar per Kg (Rp){' '}
                  <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400">
                  Default: Rp 20.000 / kg
                </span>
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={formatRupiahInput(form.pricePerKg)}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '')
                  setForm({ ...form, pricePerKg: raw })
                }}
                placeholder="20.000"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs font-medium outline-none transition focus:border-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900"
              />
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
                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                        title="Hapus foto"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload trigger */}
              {uploadedImages.length < 5 ? (
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-slate-700">
                    {uploadingImages ? (
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {uploadingImages
                      ? 'Mengupload foto ke VPS...'
                      : 'Tarik & lepas foto di sini, atau klik tombol di bawah'}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    JPG, PNG, WebP • Maks. 10MB per foto • Sisa{' '}
                    {5 - uploadedImages.length} slot foto
                  </p>
                  <button
                    type="button"
                    disabled={uploadingImages}
                    onClick={() => fileInputRef.current?.click()}
                    className="shadow-xs mt-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Pilih Foto dari Perangkat</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
              ) : (
                <p className="text-center text-xs text-slate-500">
                  Maksimal 5 foto telah tercapai. Hapus foto untuk mengganti.
                </p>
              )}
            </div>
          </div>

          {/* ─── Variants Section ─────────────────────────────────────────── */}
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Daftar Varian Gadget ({variants.length})
                </h3>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  Kustomisasi RAM, Storage, Warna & Foto Spesifik per Varian
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

                  {/* Inputs Grid: Nama, RAM, Storage, Warna, Harga, Modal, Stok */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-8">
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
                        placeholder={
                          formatRupiahInput(form.price) || '18.999.000'
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        HPP Modal (Rp)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatRupiahInput(v.costPrice)}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '')
                          updateVariant(i, 'costPrice', raw)
                        }}
                        placeholder={
                          formatRupiahInput(form.costPrice) || 'Otomatis'
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium outline-none transition focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        title="Modal / HPP varian (opsional jika sama dengan produk utama)"
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

          {/* ─── Bonus 3-in-1 & Warranty ─────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                <Gift className="h-4 w-4 text-orange-500" />
                <span>Paket Bonus 3-in-1 Otomatis Disertakan</span>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.includesCharger}
                    onChange={(e) =>
                      setForm({ ...form, includesCharger: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-300 accent-orange-500"
                  />
                  <span>Kepala Charger & Kabel Fast Charging (Rp 0)</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.includesScreenProtector}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        includesScreenProtector: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-slate-300 accent-orange-500"
                  />
                  <span>Tempered Glass Presisi Terpasang (Rp 0)</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.includesCase}
                    onChange={(e) =>
                      setForm({ ...form, includesCase: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-300 accent-orange-500"
                  />
                  <span>Softcase Shockproof Presisi (Rp 0)</span>
                </label>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <span>Garansi Resmi Toko Fisik</span>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Durasi Garansi Tukar Unit (Hari)
                </label>
                <input
                  type="number"
                  value={form.warrantyDays}
                  onChange={(e) =>
                    setForm({ ...form, warrantyDays: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <p className="text-[11px] text-slate-500">
                  Standar garansi: 30 Hari tukar unit langsung di toko offline.
                </p>
              </div>
            </div>
          </div>

          {/* ─── Description & Specs ─────────────────────────────────────── */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Deskripsi Lengkap Unit Gadget
              </label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Deskripsikan kondisi fisik, kelengkapan aksesoris, riwayat penggunaan, dan jaminan unit..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium outline-none transition focus:border-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Spesifikasi Teknis Ringkas (Highlight di Halaman Produk)
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {['Chipset', 'Layar', 'Kamera', 'Baterai'].map((specKey) => (
                  <div key={specKey} className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500">
                      {specKey}
                    </span>
                    <input
                      type="text"
                      value={(form.specs as any)[specKey] || ''}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          specs: { ...form.specs, [specKey]: e.target.value },
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium outline-none transition focus:border-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Actions ─────────────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-6 dark:border-slate-800">
            <Link
              href="/dashboard/admin/products"
              className="rounded-full border border-slate-200 px-6 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Batal
            </Link>

            <button
              type="submit"
              disabled={saving || uploadingImages}
              className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-8 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan Perubahan...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
