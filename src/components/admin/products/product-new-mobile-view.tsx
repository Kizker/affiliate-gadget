'use client'

import React, { useRef } from 'react'
import Link from 'next/link'
import { Upload, Plus, Trash2, X, Camera } from 'lucide-react'
import { formatRupiahInput } from '@/lib/utils'

interface ProductVariantItem {
  name: string
  ram: string
  storage: string
  color: string
  image?: string
  price: string
  costPrice?: string
  stock: string | number
  sku?: string
}

interface ProductNewMobileViewProps {
  form: Record<string, unknown>
  setForm: React.Dispatch<React.SetStateAction<Record<string, unknown>>>
  variants: ProductVariantItem[]
  setVariants: React.Dispatch<React.SetStateAction<ProductVariantItem[]>>
  stores: Array<{ id: string; name: string; city?: string }>
  selectedStore: { id: string; name: string; city?: string } | undefined
  isStoreAdmin: boolean
  userStoreId?: string
  BRAND_OPTIONS: string[]
  CONDITION_OPTIONS: { value: string; label: string }[]
  RAM_OPTIONS: string[]
  STORAGE_OPTIONS: string[]
  COLOR_OPTIONS: string[]
  uploadedImages: string[]
  imagePreviews?: string[]
  uploadingImages?: boolean
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeImage: (index: number) => void
  addVariant: () => void
  removeVariant: (index: number) => void
  updateVariant: (index: number, field: string, value: string) => void
  handleVariantImageUpload: (index: number, file: File) => void
  loading: boolean
}

export function ProductNewMobileView({
  form,
  setForm,
  variants,
  selectedStore,
  BRAND_OPTIONS,
  CONDITION_OPTIONS,
  RAM_OPTIONS,
  STORAGE_OPTIONS,
  uploadedImages,
  handleFileSelect,
  removeImage,
  addVariant,
  removeVariant,
  updateVariant,
  handleVariantImageUpload,
  loading,
}: ProductNewMobileViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-4 md:hidden">
      {/* 1. Header Navigation */}
      <div>
        <Link
          href="/dashboard/admin/products"
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400"
        >
          ← Kembali
        </Link>
        <h1 className="mt-1 text-lg font-bold tracking-tight text-slate-950 dark:text-white">
          Tambah Produk Gadget
        </h1>
      </div>

      {/* 2. Informasi Dasar Card */}
      <div className="shadow-2xs space-y-3.5 rounded-3xl border border-slate-200/90 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xs font-bold text-slate-900 dark:text-white">
          Informasi Dasar
        </h2>

        <div className="space-y-3 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-600 dark:text-slate-400">
              Nama Lengkap Gadget <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="iPhone 15 Pro Max 256GB"
              className="w-full rounded-2xl border border-slate-200/90 bg-white px-3.5 py-2.5 font-medium outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-600 dark:text-slate-400">
              Kode SKU Produk (Manual)
            </label>
            <input
              type="text"
              value={form.sku || ''}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              placeholder="Contoh: SKU-IP15PM-256-NAT"
              className="w-full rounded-2xl border border-slate-200/90 bg-white px-3.5 py-2.5 font-medium outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="font-semibold text-slate-600 dark:text-slate-400">
                Merek (Brand) <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="w-full rounded-2xl border border-slate-200/90 bg-white px-3 py-2.5 text-xs font-medium outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {BRAND_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-600 dark:text-slate-400">
                Kondisi Fisik <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.condition}
                onChange={(e) =>
                  setForm({ ...form, condition: e.target.value })
                }
                className="w-full rounded-2xl border border-slate-200/90 bg-white px-3 py-2.5 text-xs font-medium outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {CONDITION_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-600 dark:text-slate-400">
              Toko Pemilik <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              disabled
              value={`${selectedStore?.name || 'Affiliate Gadget - Roxy Mas Jakarta'} (Otomatis)`}
              className="w-full rounded-2xl border border-slate-200/90 bg-slate-50 px-3.5 py-2.5 font-medium text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
            />
          </div>
        </div>
      </div>

      {/* 3. Harga & Inventori Card */}
      <div className="shadow-2xs space-y-3.5 rounded-3xl border border-slate-200/90 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xs font-bold text-slate-900 dark:text-white">
          Harga & Inventori
        </h2>

        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="font-semibold text-slate-600 dark:text-slate-400">
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
                className="w-full rounded-2xl border border-slate-200/90 bg-white px-3.5 py-2.5 font-medium outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-600 dark:text-slate-400">
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
                className="w-full rounded-2xl border border-slate-200/90 bg-white px-3.5 py-2.5 font-medium outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Checkbox PPN */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3">
            <label className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={form.isTaxable}
                onChange={(e) =>
                  setForm({ ...form, isTaxable: e.target.checked })
                }
                className="h-4 w-4 rounded border-slate-300 text-orange-500 accent-orange-500"
              />
              <span>Dikenakan PPN (Inklusif 11%)</span>
            </label>
            <span className="text-[10px] text-slate-400">PKP Toko</span>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-600 dark:text-slate-400">
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
              className="w-full rounded-2xl border border-slate-200/90 bg-white px-3.5 py-2.5 font-medium outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="font-semibold text-slate-600 dark:text-slate-400">
                Stok <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="w-full rounded-2xl border border-slate-200/90 bg-white px-3 py-2.5 font-medium outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-600 dark:text-slate-400">
                Berat (gram) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={form.weightGram}
                onChange={(e) =>
                  setForm({ ...form, weightGram: e.target.value })
                }
                className="w-full rounded-2xl border border-slate-200/90 bg-white px-3 py-2.5 font-medium outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-600 dark:text-slate-400">
                Ongkir/Kg <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formatRupiahInput(form.pricePerKg)}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '')
                  setForm({ ...form, pricePerKg: raw })
                }}
                className="w-full rounded-2xl border border-slate-200/90 bg-white px-3 py-2.5 font-medium outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Foto & Garansi Card */}
      <div className="shadow-2xs space-y-3.5 rounded-3xl border border-slate-200/90 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xs font-bold text-slate-900 dark:text-white">
          Foto & Garansi
        </h2>

        <div className="space-y-3 text-xs">
          <div>
            <label className="mb-1.5 block font-semibold text-slate-600 dark:text-slate-400">
              Foto & Video Produk
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-6 text-center text-slate-500 hover:border-orange-300 dark:border-slate-700 dark:bg-slate-800/40"
            >
              <Upload className="h-5 w-5 text-slate-400" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Unggah Foto / Video
              </p>
              <p className="text-[10px] text-slate-400">Maks. 5 file</p>
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
              <div className="mt-3 grid grid-cols-4 gap-2">
                {uploadedImages.map((url, i) => (
                  <div
                    key={i}
                    className="relative aspect-square overflow-hidden rounded-xl border border-slate-200"
                  >
                    <img
                      src={url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeImage(i)
                      }}
                      className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-2 dark:border-slate-800">
            <span className="block font-semibold text-slate-600 dark:text-slate-400">
              Garansi & Bonus 3-in-1 Bawaan:
            </span>
            <div className="space-y-2">
              <label className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
                <span>Free Charger 20W</span>
                <input
                  type="checkbox"
                  checked={form.includesCharger}
                  onChange={(e) =>
                    setForm({ ...form, includesCharger: e.target.checked })
                  }
                  className="h-4 w-4 rounded accent-orange-500"
                />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
                <span>Free Antigores 9D</span>
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
              </label>
              <label className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
                <span>Free Softcase</span>
                <input
                  type="checkbox"
                  checked={form.includesCase}
                  onChange={(e) =>
                    setForm({ ...form, includesCase: e.target.checked })
                  }
                  className="h-4 w-4 rounded accent-orange-500"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Daftar Varian Gadget Mobile */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 dark:text-white">
            Daftar Varian Gadget
          </h2>
          <button
            type="button"
            onClick={addVariant}
            className="shadow-xs inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-bold text-white"
          >
            <Plus className="h-3 w-3" />
            <span>Tambah Varian</span>
          </button>
        </div>

        <div className="space-y-3">
          {variants.map((v, i) => (
            <div
              key={i}
              className="shadow-2xs space-y-3 rounded-3xl border border-slate-200/90 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Varian #{i + 1}: {v.name || 'Pilih Varian'}
                </span>
                <span className="text-[10px] font-bold text-orange-500">
                  Aktif
                </span>
              </div>

              {/* Photo & Actions */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    {v.image ? (
                      <img
                        src={v.image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <Camera className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <label className="shadow-2xs inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                    <Upload className="h-3 w-3" />
                    <span>Ubah Foto</span>
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
                </div>

                {variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVariant(i)}
                    className="p-1.5 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Form fields */}
              <div className="space-y-2.5 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 dark:text-slate-400">
                    Nama Varian
                  </label>
                  <input
                    type="text"
                    value={v.name}
                    onChange={(e) => updateVariant(i, 'name', e.target.value)}
                    placeholder="256GB - Natural Titanium"
                    className="w-full rounded-2xl border border-slate-200/90 bg-white px-3.5 py-2 font-medium outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 dark:text-slate-400">
                    Kode SKU
                  </label>
                  <input
                    type="text"
                    value={v.sku || ''}
                    onChange={(e) => updateVariant(i, 'sku', e.target.value)}
                    placeholder="SKU-256-NAT"
                    className="w-full rounded-2xl border border-slate-200/90 bg-white px-3.5 py-2 font-medium outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 dark:text-slate-400">
                    RAM
                  </label>
                  <select
                    value={v.ram}
                    onChange={(e) => updateVariant(i, 'ram', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200/90 bg-white px-3 py-2 text-xs font-medium outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800"
                  >
                    {RAM_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 dark:text-slate-400">
                    Storage
                  </label>
                  <select
                    value={v.storage}
                    onChange={(e) => {
                      updateVariant(i, 'storage', e.target.value)
                      if (!v.name || v.name.includes('GB')) {
                        updateVariant(
                          i,
                          'name',
                          `${e.target.value} - ${v.color || 'Natural Titanium'}`
                        )
                      }
                    }}
                    className="w-full rounded-2xl border border-slate-200/90 bg-white px-3 py-2 text-xs font-medium outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800"
                  >
                    {STORAGE_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 dark:text-slate-400">
                    Warna
                  </label>
                  <input
                    type="text"
                    value={v.color}
                    onChange={(e) => {
                      updateVariant(i, 'color', e.target.value)
                      if (!v.name || v.name.includes('GB')) {
                        updateVariant(
                          i,
                          'name',
                          `${v.storage || '256GB'} - ${e.target.value}`
                        )
                      }
                    }}
                    placeholder="Natural Titanium"
                    className="w-full rounded-2xl border border-slate-200/90 bg-white px-3.5 py-2 font-medium outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 dark:text-slate-400">
                    Harga Jual
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
                    className="w-full rounded-2xl border border-slate-200/90 bg-white px-3.5 py-2 font-medium outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 dark:text-slate-400">
                    HPP Modal
                  </label>
                  <input
                    type="text"
                    disabled
                    value={formatRupiahInput(v.costPrice) || 'Otomatis'}
                    className="w-full rounded-2xl border border-slate-200/90 bg-slate-50 px-3.5 py-2 font-medium text-slate-600 outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 dark:text-slate-400">
                    Stok
                  </label>
                  <input
                    type="number"
                    value={v.stock}
                    onChange={(e) => updateVariant(i, 'stock', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200/90 bg-white px-3.5 py-2 font-medium outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Deskripsi Produk Card */}
      <div className="shadow-2xs space-y-3.5 rounded-3xl border border-slate-200/90 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xs font-bold text-slate-900 dark:text-white">
          Deskripsi Produk
        </h2>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Tuliskan deskripsi kondisi unit, kelengkapan aksesoris, dan catatan penting toko..."
          className="w-full rounded-2xl border border-slate-200/90 bg-white p-3.5 text-xs font-medium outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800"
        />
      </div>

      {/* 7. Action Footer */}
      <div className="grid grid-cols-2 gap-2.5 pt-2">
        <Link
          href="/dashboard/admin/products"
          className="shadow-2xs flex items-center justify-center rounded-2xl border border-slate-200/90 bg-white py-3 text-xs font-semibold text-slate-700"
        >
          Batal
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="shadow-xs flex items-center justify-center rounded-2xl bg-orange-500 py-3 text-xs font-bold text-white transition hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? 'Menyimpan...' : 'Simpan ke Inventori'}
        </button>
      </div>
    </div>
  )
}
