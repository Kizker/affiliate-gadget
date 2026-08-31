'use client'

import { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { toast } from 'sonner'

export default function NewGadgetProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [stores, setStores] = useState<any[]>([])

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
    images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80'],
    specs: {
      Chipset: 'Apple A17 Pro / Snapdragon 8 Gen 3',
      Layar: '6.7 inch OLED 120Hz ProMotion',
      Kamera: '48MP Main + 12MP Ultra-wide + 12MP Telephoto',
      Baterai: '4.422 mAh Fast Charging 20W',
    },
  })

  const [variants, setVariants] = useState([
    { name: '128GB - Black Titanium', ram: '8GB', storage: '128GB', color: 'Black Titanium', price: '', stock: '3' },
    { name: '256GB - Natural Titanium', ram: '8GB', storage: '256GB', color: 'Natural Titanium', price: '', stock: '2' },
  ])

  useEffect(() => {
    fetchStores()
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
      { name: 'Varian Baru', ram: '8GB', storage: '128GB', color: 'Midnight', price: form.price, stock: '1' },
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.price) {
      toast.error('Nama gadget dan harga wajib diisi')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          variants: variants.map((v) => ({
            ...v,
            price: v.price || form.price,
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
    <div className="space-y-8 py-2 sm:py-4 w-full max-w-6xl">

      {/* 1. Header Hero Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-3xl bg-white p-6 sm:p-8 shadow-xs border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
            <Smartphone className="h-3.5 w-3.5 text-orange-500" />
            <span>Inventori Toko Resmi</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            Tambah Produk Gadget
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl">
            Masukkan spesifikasi gadget, pilih toko pemilik, atur varian warna/RAM, dan aktifkan garansi 30 hari + bonus 3-in-1.
          </p>
        </div>

        <Link
          href="/dashboard/admin/products"
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 whitespace-nowrap"
        >
          <span>← Kembali ke Katalog</span>
        </Link>
      </div>

      {/* 2. Form Card */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
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
                type="number"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="18999000"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium outline-none transition focus:border-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Harga Coret Pembanding (Rp)
              </label>
              <input
                type="number"
                value={form.originalPrice}
                onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                placeholder="20999000"
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
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium outline-none transition focus:border-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="LIKE_NEW">Second Like New (Mulus 99%)</option>
                <option value="SECOND_MULUS">Second Mulus (95% - 98%)</option>
                <option value="GRADE_A">Second Grade A (Normal 100%)</option>
              </select>
            </div>
          </div>

          {/* Value Props & Bonuses */}
          <div className="rounded-3xl bg-orange-50/60 p-5 border border-orange-200/60 dark:bg-orange-950/20 dark:border-orange-900/40 space-y-3">
            <h3 className="text-xs font-bold text-orange-900 dark:text-orange-300 flex items-center gap-1.5">
              <Gift className="h-4 w-4 text-orange-500" /> Skema Garansi 30 Hari & Bonus 3-in-1 Bawaan:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <label className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.includesCharger}
                  onChange={(e) => setForm({ ...form, includesCharger: e.target.checked })}
                  className="h-4 w-4 text-orange-500 rounded"
                />
                <span>Free Charger 20W</span>
              </label>

              <label className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.includesScreenProtector}
                  onChange={(e) => setForm({ ...form, includesScreenProtector: e.target.checked })}
                  className="h-4 w-4 text-orange-500 rounded"
                />
                <span>Free Antigores 9D</span>
              </label>

              <label className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.includesCase}
                  onChange={(e) => setForm({ ...form, includesCase: e.target.checked })}
                  className="h-4 w-4 text-orange-500 rounded"
                />
                <span>Free Softcase</span>
              </label>
            </div>
          </div>

          {/* Variants */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
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
                <div key={i} className="flex flex-wrap items-center gap-2 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                  <input
                    type="text"
                    placeholder="Nama Varian (mis: 256GB Titanium)"
                    value={v.name}
                    onChange={(e) => updateVariant(i, 'name', e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none dark:border-slate-700 dark:bg-slate-900"
                  />
                  <input
                    type="number"
                    placeholder="Harga Varian"
                    value={v.price}
                    onChange={(e) => updateVariant(i, 'price', e.target.value)}
                    className="w-32 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none dark:border-slate-700 dark:bg-slate-900"
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
                      className="p-2 text-slate-400 hover:text-red-500 transition"
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
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Deskripsi garansi 30 hari, kondisi fisik unit, kelengkapan toko..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-medium outline-none transition focus:border-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/dashboard/admin/products"
              className="rounded-full border border-slate-200 bg-white px-6 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading}
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
