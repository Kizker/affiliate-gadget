'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Sparkles,
  X,
  Store,
  Calendar,
  CheckCircle2,
  Clock,
  Target,
  Package,
  Upload,
  ImageIcon,
  ShoppingBag,
  Globe,
  ExternalLink,
  Play,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { CustomSelect } from '@/components/ui/custom-select'
import { isVideoMedia } from '@/types/ads'
import {
  AdTargetType,
  CurrentStoreInfo,
  Level1SlotInfo,
  PRESET_BANNERS,
  computeTargetUrl,
} from '../types'

interface CreateAdModalProps {
  isOpen: boolean
  onClose: () => void
  isSuperAdmin: boolean
  currentStore: CurrentStoreInfo | null
  allStores: CurrentStoreInfo[]
  storeBanner: string | null
  storeProducts: any[]
  loadingProducts: boolean
  level1Slot: Level1SlotInfo
  formData: {
    title: string
    subtitle: string
    placement: 'HOMEPAGE_HERO' | 'PROMOTED_LIST'
    imageUrl: string
    targetType: AdTargetType
    targetUrl: string
    productId: string
    storeId: string
    priority: number
    startDate: string
    durationDays: number
    targetImpressions: number
    selectedPhotoLabel: string
  }
  setFormData: React.Dispatch<
    React.SetStateAction<{
      title: string
      subtitle: string
      placement: 'HOMEPAGE_HERO' | 'PROMOTED_LIST'
      imageUrl: string
      targetType: AdTargetType
      targetUrl: string
      productId: string
      storeId: string
      priority: number
      startDate: string
      durationDays: number
      targetImpressions: number
      selectedPhotoLabel: string
    }>
  >
  computedEndDateStr: string
  actionLoading: string | null
  photoSourceTab: 'STORE_BANNER' | 'PRODUCTS' | 'PRESETS' | 'UPLOAD' | 'URL'
  setPhotoSourceTab: (
    tab: 'STORE_BANNER' | 'PRODUCTS' | 'PRESETS' | 'UPLOAD' | 'URL'
  ) => void
  uploadingMedia: boolean
  setUploadingMedia: (uploading: boolean) => void
  onSelectStore: (store: CurrentStoreInfo) => void
  onSubmit: (e: React.FormEvent) => void
}

export function CreateAdModal({
  isOpen,
  onClose,
  isSuperAdmin,
  currentStore,
  allStores,
  storeBanner,
  storeProducts,
  loadingProducts,
  level1Slot,
  formData,
  setFormData,
  computedEndDateStr,
  actionLoading,
  photoSourceTab,
  setPhotoSourceTab,
  uploadingMedia,
  setUploadingMedia,
  onSelectStore,
  onSubmit,
}: CreateAdModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!isOpen || !mounted || typeof document === 'undefined') return null

  return createPortal(
    <div className="backdrop-blur-xs fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/70 p-3 duration-200 animate-in fade-in sm:p-4">
      <div className="relative my-auto max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl [scrollbar-width:thin] dark:border-slate-800 dark:bg-slate-900 sm:max-h-[90vh] sm:p-6">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800 sm:pb-4">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600">
              <Sparkles className="h-4 w-4 shrink-0" />
            </span>
            <h3 className="truncate text-sm font-extrabold text-slate-950 dark:text-white sm:text-base">
              {isSuperAdmin
                ? 'Buat Iklan Promosi'
                : 'Ajukan Iklan Promosi Toko'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-5">
          {/* KHUSUS SUPERADMIN: PILIH TOKO PEMILIK IKLAN */}
          {isSuperAdmin && allStores.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Store className="h-4 w-4 text-orange-500" />
                  <span>Pilih Toko Cabang Pemilik Iklan:</span>
                </label>
                {currentStore?.city && (
                  <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">
                    Cabang {currentStore.city}
                  </span>
                )}
              </div>
              <div className="mt-2">
                <CustomSelect
                  value={currentStore?.id || ''}
                  onChange={(val: string) => {
                    const found = allStores.find((s) => s.id === val)
                    if (found) {
                      onSelectStore(found)
                    }
                  }}
                  options={allStores.map((st) => ({
                    value: st.id,
                    label: `${st.name}${st.city ? ` (${st.city})` : ''}`,
                  }))}
                  placeholder="Pilih Toko Cabang..."
                />
              </div>
            </div>
          )}

          {/* BAGIAN 1: PEMILIHAN TINGKAT PENEMPATAN */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Pilih Tingkat Penempatan Iklan:
            </label>
            <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div
                onClick={() => {
                  if (level1Slot.isOccupied && !isSuperAdmin) {
                    toast.error(
                      'Slot Carousel (Level 1) maksimal 1 iklan saja dan saat ini sedang digunakan. Hapus iklan carousel lama terlebih dahulu jika ingin menggantinya, atau gunakan slot Iklan Grid Produk.'
                    )
                    return
                  }
                  setFormData((p) => ({ ...p, placement: 'HOMEPAGE_HERO' }))
                }}
                className={`cursor-pointer rounded-2xl border p-3.5 transition ${
                  formData.placement === 'HOMEPAGE_HERO'
                    ? 'shadow-xs border-blue-500 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-950/30'
                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-blue-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                    LEVEL 1 • CAROUSEL
                  </span>
                  {level1Slot.isOccupied ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                      MAKS. 1 (TERISI)
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      SLOT TERSEDIA
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs font-bold text-slate-900 dark:text-white">
                  Mobile &amp; Desktop Hero Carousel
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  Tampil di slider banner paling atas.
                  <strong className="mt-1 block text-blue-600 dark:text-blue-400">
                    Eksklusif: Maksimal 1 Iklan Saja
                  </strong>
                </p>
              </div>

              <div
                onClick={() =>
                  setFormData((p) => ({ ...p, placement: 'PROMOTED_LIST' }))
                }
                className={`cursor-pointer rounded-2xl border p-3.5 transition ${
                  formData.placement === 'PROMOTED_LIST'
                    ? 'shadow-xs border-orange-500 bg-orange-50/50 dark:border-orange-500 dark:bg-orange-950/30'
                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-orange-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                    LEVEL 2 • GRID PRODUK
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    BOLEH BANYAK IKLAN
                  </span>
                </div>
                <p className="mt-2 text-xs font-bold text-slate-900 dark:text-white">
                  In-Feed Grid Produk (Katalog)
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  Diselipkan di antara etalase kartu produk toko.
                  <strong className="mt-1 block text-orange-600 dark:text-orange-400">
                    Bebas: Dapat Memuat Banyak Iklan
                  </strong>
                </p>
              </div>
            </div>
          </div>

          {/* BAGIAN 2: ATURAN PENAYANGAN BERDASARKAN LEVEL */}
          {formData.placement === 'HOMEPAGE_HERO' ? (
            /* LEVEL 1: BERDASARKAN HARI */
            <div className="rounded-2xl border border-blue-200/80 bg-blue-50/50 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800 dark:text-blue-300">
                <Calendar className="h-4 w-4" />
                <span>Konfigurasi Level 1: Pilih Durasi Berdasarkan Hari</span>
              </div>

              {/* Keterangan Eksklusivitas Slot Level 1 */}
              {level1Slot.isOccupied && level1Slot.activeAd ? (
                <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/90 p-2.5 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
                  <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-[11px] font-bold">
                      Slot Level 1 Sedang Digunakan (Eksklusif 1 Toko)
                    </p>
                    <p className="mt-0.5 text-[10px] leading-relaxed">
                      Saat ini slot sedang digunakan oleh{' '}
                      <strong>
                        {level1Slot.activeAd.store?.name || 'Toko Lain'}
                      </strong>{' '}
                      hingga{' '}
                      {level1Slot.activeAd.endDate
                        ? new Date(
                            level1Slot.activeAd.endDate
                          ).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'selesai'}{' '}
                      ({level1Slot.activeAd.remainingText}). Pengajuan Anda akan
                      masuk ke antrean prioritas dan dijadwalkan tayang setelah
                      slot aktif kedaluwarsa.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/90 p-2.5 text-xs text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-[11px] font-bold">
                      Slot Level 1 Tersedia / Kosong
                    </p>
                    <p className="mt-0.5 text-[10px] leading-relaxed">
                      Belum ada iklan Level 1 aktif. Iklan Anda siap langsung
                      tayang eksklusif di carousel teratas beranda mobile
                      setelah disetujui.
                    </p>
                  </div>
                </div>
              )}

              {/* Pilihan Cepat Hari */}
              <div className="mt-3">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Pilih Berapa Hari Ingin Tayang:
                </label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {[3, 7, 14, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() =>
                        setFormData((p) => ({ ...p, durationDays: days }))
                      }
                      className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                        formData.durationDays === days
                          ? 'shadow-xs bg-blue-600 text-white'
                          : 'border border-blue-200 bg-white text-blue-700 hover:bg-blue-100/60 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-300'
                      }`}
                    >
                      {days === 7
                        ? '7 Hari (1 Minggu)'
                        : days === 14
                          ? '14 Hari (2 Minggu)'
                          : days === 30
                            ? '30 Hari (1 Bulan)'
                            : `${days} Hari`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Jumlah Hari Kustom & Tanggal Mulai */}
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Atau Masukkan Jumlah Hari Kustom:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={formData.durationDays}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        durationDays: parseInt(e.target.value, 10) || 1,
                      }))
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Mulai Tanggal:
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        startDate: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Ringkasan Durasi Level 1 */}
              <div className="mt-3 rounded-xl bg-blue-100/70 p-2.5 text-xs text-blue-900 dark:bg-blue-900/40 dark:text-blue-200">
                <p className="font-bold">
                  📅 Durasi Penayangan: {formData.durationDays} Hari
                </p>
                <p className="mt-0.5 text-[11px] opacity-90">
                  Aktif mulai{' '}
                  <strong>
                    {new Date(formData.startDate).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </strong>{' '}
                  hingga <strong>{computedEndDateStr}</strong> di carousel
                  teratas mobile.
                </p>
              </div>
            </div>
          ) : (
            /* LEVEL 2: BERDASARKAN BERAPA BANYAK INGIN MUNCUL & BERDASARKAN HARI */
            <div className="rounded-2xl border border-orange-200/80 bg-orange-50/50 p-4 dark:border-orange-900/60 dark:bg-orange-950/20">
              <div className="flex items-center gap-1.5 text-xs font-bold text-orange-800 dark:text-orange-300">
                <Target className="h-4 w-4" />
                <span>
                  Konfigurasi Level 2: Berapa Banyak Ingin Muncul & Berdasarkan
                  Hari
                </span>
              </div>

              {/* Parameter 1: Berapa Banyak Ingin Muncul */}
              <div className="mt-3">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  1. Berapa kali iklan ingin muncul di sela-sela katalog produk?
                  (Target Tayang):
                </label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {[500, 1000, 2500, 5000, 10000].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() =>
                        setFormData((p) => ({
                          ...p,
                          targetImpressions: count,
                        }))
                      }
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                        formData.targetImpressions === count
                          ? 'shadow-xs bg-orange-500 text-white'
                          : 'border border-orange-200 bg-white text-orange-700 hover:bg-orange-100/60 dark:border-orange-800 dark:bg-slate-900 dark:text-orange-300'
                      }`}
                    >
                      {Number(count).toLocaleString('id-ID')}x Muncul
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <input
                    type="number"
                    min="100"
                    step="100"
                    placeholder="Atau ketik target kemunculan kustom..."
                    value={formData.targetImpressions}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        targetImpressions: parseInt(e.target.value, 10) || 500,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white sm:w-64"
                  />
                </div>
              </div>

              {/* Parameter 2: Berdasarkan Hari Juga */}
              <div className="mt-4 border-t border-orange-200/60 pt-3 dark:border-orange-900/40">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  2. Batas durasi penayangan (Berdasarkan Hari):
                </label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {[3, 7, 14, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() =>
                        setFormData((p) => ({ ...p, durationDays: days }))
                      }
                      className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                        formData.durationDays === days
                          ? 'shadow-xs bg-orange-600 text-white'
                          : 'border border-orange-200 bg-white text-orange-700 hover:bg-orange-100/60 dark:border-orange-800 dark:bg-slate-900 dark:text-orange-300'
                      }`}
                    >
                      {days} Hari
                    </button>
                  ))}
                </div>
              </div>

              {/* Ringkasan Level 2 */}
              <div className="mt-3.5 rounded-xl bg-orange-100/70 p-2.5 text-xs text-orange-950 dark:bg-orange-900/40 dark:text-orange-200">
                <p className="font-bold">
                  🎯 Target:{' '}
                  {Number(formData.targetImpressions).toLocaleString('id-ID')}x
                  Kemunculan • 📅 Batas: {formData.durationDays} Hari
                </p>
                <p className="mt-0.5 text-[11px] opacity-90">
                  Iklan akan diselipkan di antara grid produk hingga mencapai
                  target{' '}
                  <strong>
                    {Number(formData.targetImpressions).toLocaleString('id-ID')}{' '}
                    tayangan
                  </strong>{' '}
                  atau batas waktu <strong>{computedEndDateStr}</strong>{' '}
                  tercapai (mana yang lebih dulu terpenuhi).
                </p>
              </div>
            </div>
          )}

          {/* BAGIAN 3: PILIH FOTO APA YANG INGIN DITAMPILKAN SEBAGAI BANNER */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Pilih Foto yang Ingin Ditampilkan Sebagai Banner:{' '}
                <span className="text-rose-500">*</span>
              </label>
              {formData.selectedPhotoLabel && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  ✓ Foto Terpilih
                </span>
              )}
            </div>

            {/* Tab Pilihan Sumber Foto */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2.5 dark:border-slate-800">
              {storeBanner && (
                <button
                  type="button"
                  onClick={() => setPhotoSourceTab('STORE_BANNER')}
                  className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition ${
                    photoSourceTab === 'STORE_BANNER'
                      ? 'shadow-xs bg-orange-500 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400'
                  }`}
                >
                  <Store className="h-3 w-3" />
                  <span>Banner Toko</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setPhotoSourceTab('PRODUCTS')}
                className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition ${
                  photoSourceTab === 'PRODUCTS'
                    ? 'shadow-xs bg-orange-500 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400'
                }`}
              >
                <Package className="h-3 w-3" />
                <span>Katalog Produk ({storeProducts.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setPhotoSourceTab('PRESETS')}
                className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition ${
                  photoSourceTab === 'PRESETS'
                    ? 'shadow-xs bg-orange-500 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400'
                }`}
              >
                <Sparkles className="h-3 w-3" />
                <span>Preset Banner Promo</span>
              </button>

              <button
                type="button"
                onClick={() => setPhotoSourceTab('UPLOAD')}
                className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition ${
                  photoSourceTab === 'UPLOAD'
                    ? 'shadow-xs bg-orange-500 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400'
                }`}
              >
                <Upload className="h-3 w-3" />
                <span>Upload File</span>
              </button>

              <button
                type="button"
                onClick={() => setPhotoSourceTab('URL')}
                className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition ${
                  photoSourceTab === 'URL'
                    ? 'shadow-xs bg-orange-500 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400'
                }`}
              >
                <ImageIcon className="h-3 w-3" />
                <span>Input URL</span>
              </button>
            </div>

            {/* Konten Tab Sumber Foto */}
            <div className="mt-3">
              {/* TAB 1: BANNER TOKO */}
              {photoSourceTab === 'STORE_BANNER' && storeBanner && (
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-500">
                    Pilih foto banner profil toko cabang Anda:
                  </p>
                  <div
                    onClick={() => {
                      const nextType: AdTargetType = 'STORE'
                      setFormData((p) => ({
                        ...p,
                        imageUrl: storeBanner,
                        selectedPhotoLabel: 'Foto Banner Toko',
                        targetType: nextType,
                        targetUrl: computeTargetUrl(
                          nextType,
                          currentStore,
                          p.productId,
                          p.targetUrl
                        ),
                      }))
                    }}
                    className={`group relative aspect-[21/9] w-full cursor-pointer overflow-hidden rounded-2xl border-2 transition ${
                      formData.imageUrl === storeBanner
                        ? 'border-orange-500 ring-4 ring-orange-500/20'
                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-800'
                    }`}
                  >
                    <img
                      src={storeBanner}
                      alt="Banner Toko"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <span className="rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-slate-900 shadow-md">
                        {formData.imageUrl === storeBanner
                          ? '✓ Banner Toko Terpilih'
                          : 'Klik untuk Memakai Banner Toko'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DARI KATALOG PRODUK */}
              {photoSourceTab === 'PRODUCTS' && (
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-500">
                    Klik salah satu foto produk toko untuk dijadikan banner
                    promosi:
                  </p>
                  {loadingProducts ? (
                    <div className="flex h-24 items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                    </div>
                  ) : storeProducts.length === 0 ? (
                    <p className="py-3 text-center text-xs text-slate-400">
                      Belum ada produk dengan foto di katalog toko ini.
                    </p>
                  ) : (
                    <div className="grid max-h-48 grid-cols-3 gap-2 overflow-y-auto pr-1 [scrollbar-width:thin] sm:grid-cols-4">
                      {storeProducts.map((prod) => {
                        const img =
                          prod.images?.[0] ||
                          prod.thumbnail ||
                          '/images/banners/samsung-mobile-hero.jpg'
                        const isSelected = formData.imageUrl === img

                        return (
                          <div
                            key={prod.id}
                            onClick={() => {
                              const nextType: AdTargetType = 'PRODUCT'
                              setFormData((p) => ({
                                ...p,
                                imageUrl: img,
                                selectedPhotoLabel: `Produk: ${prod.name}`,
                                productId: prod.id,
                                targetType: nextType,
                                targetUrl: computeTargetUrl(
                                  nextType,
                                  currentStore,
                                  prod.id,
                                  p.targetUrl
                                ),
                                title: p.title.trim()
                                  ? p.title
                                  : `Promo Spesial ${prod.name}`,
                              }))
                            }}
                            className={`cursor-pointer overflow-hidden rounded-xl border p-1.5 transition ${
                              isSelected
                                ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500/20 dark:bg-orange-950/30'
                                : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                            }`}
                          >
                            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                              <img
                                src={img}
                                alt={prod.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <p className="mt-1 line-clamp-1 text-[10px] font-bold text-slate-900 dark:text-white">
                              {prod.name}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PRESET BANNER PROMO */}
              {photoSourceTab === 'PRESETS' && (
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-500">
                    Pilih dari koleksi poster promosi gadget resmi:
                  </p>
                  <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto pr-1 [scrollbar-width:thin] sm:grid-cols-3">
                    {PRESET_BANNERS.map((preset, idx) => {
                      const isSelected = formData.imageUrl === preset.url
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            let nextType: AdTargetType = 'ALL_CATALOG'
                            let presetUrl = '/gadget'
                            if (preset.label.includes('Garansi')) {
                              nextType = 'WARRANTY'
                              presetUrl = '/garansi'
                            } else if (
                              preset.label.includes('QC') ||
                              preset.label.includes('LCD') ||
                              preset.label.includes('Teknisi')
                            ) {
                              nextType = 'ALL_CATALOG'
                              presetUrl = '/gadget'
                            } else if (preset.label.includes('Samsung')) {
                              nextType = 'ALL_CATALOG'
                              presetUrl = '/gadget?brand=Samsung'
                            }
                            setFormData((p) => ({
                              ...p,
                              imageUrl: preset.url,
                              selectedPhotoLabel: preset.label,
                              targetType: nextType,
                              targetUrl: presetUrl,
                            }))
                          }}
                          className={`cursor-pointer overflow-hidden rounded-xl border p-1.5 transition ${
                            isSelected
                              ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500/20 dark:bg-orange-950/30'
                              : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                          }`}
                        >
                          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-slate-950">
                            <img
                              src={preset.url}
                              alt={preset.label}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <p className="mt-1 line-clamp-1 text-[10px] font-bold text-slate-900 dark:text-white">
                            {preset.label}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: UPLOAD DARI KOMPUTER (FOTO / VIDEO) */}
              {photoSourceTab === 'UPLOAD' && (
                <div className="space-y-2">
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6 text-center hover:border-orange-400 hover:bg-orange-50/20 dark:border-slate-800 dark:bg-slate-900">
                    {uploadingMedia ? (
                      <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                    ) : (
                      <Upload className="h-6 w-6 text-orange-500" />
                    )}
                    <span className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                      {uploadingMedia
                        ? 'Mengunggah Media ke Server...'
                        : 'Pilih File Foto atau Video Banner dari Komputer'}
                    </span>
                    <span className="mt-0.5 text-[10px] text-slate-400">
                      Format Foto (PNG, JPG, WebP - maks 15MB) atau Video (MP4,
                      WebM, MOV - maks 60MB)
                    </span>
                    <input
                      type="file"
                      accept="image/*,video/mp4,video/webm,video/ogg,video/quicktime"
                      disabled={uploadingMedia}
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const isVid =
                            file.type.startsWith('video/') ||
                            file.name.endsWith('.mp4') ||
                            file.name.endsWith('.webm')
                          const maxLimit = isVid
                            ? 60 * 1024 * 1024
                            : 15 * 1024 * 1024
                          if (file.size > maxLimit) {
                            return toast.error(
                              isVid
                                ? 'Ukuran video maksimal 60MB'
                                : 'Ukuran foto maksimal 15MB'
                            )
                          }
                          try {
                            setUploadingMedia(true)
                            const fd = new FormData()
                            fd.append('file', file)
                            fd.append('folder', 'ads')
                            const res = await fetch('/api/upload', {
                              method: 'POST',
                              body: fd,
                            })
                            const data = await res.json()
                            if (data.success && data.url) {
                              setFormData((p) => ({
                                ...p,
                                imageUrl: data.url,
                                selectedPhotoLabel: `${isVid ? 'Video' : 'Upload'}: ${file.name}`,
                              }))
                              toast.success(
                                `${isVid ? 'Video' : 'Foto'} ${file.name} berhasil diunggah`
                              )
                            } else {
                              throw new Error(
                                data.error || 'Gagal upload media'
                              )
                            }
                          } catch (err: any) {
                            const reader = new FileReader()
                            reader.onload = () => {
                              setFormData((p) => ({
                                ...p,
                                imageUrl: reader.result as string,
                                selectedPhotoLabel: `Upload: ${file.name}`,
                              }))
                              toast.success(`Media ${file.name} siap digunakan`)
                            }
                            reader.readAsDataURL(file)
                          } finally {
                            setUploadingMedia(false)
                          }
                        }
                      }}
                    />
                  </label>
                </div>
              )}

              {/* TAB 5: INPUT URL KUSTOM */}
              {photoSourceTab === 'URL' && (
                <div>
                  <input
                    type="text"
                    placeholder="https://... URL gambar atau video banner (.mp4, .webm, dsb)"
                    value={formData.imageUrl}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        imageUrl: e.target.value,
                        selectedPhotoLabel: isVideoMedia(e.target.value)
                          ? 'URL Video Kustom'
                          : 'URL Kustom',
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              )}
            </div>

            {/* PRATINJAU MEDIA BANNER TERPILIH */}
            {formData.imageUrl && (
              <div className="mt-3.5 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                  <span className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300">
                    Media Banner Terpilih:{' '}
                    <strong className="text-orange-600 dark:text-orange-400">
                      {formData.selectedPhotoLabel || 'Kustom'}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        imageUrl: '',
                        selectedPhotoLabel: '',
                      }))
                    }
                    className="text-[10px] text-rose-500 hover:underline"
                  >
                    Hapus Pilihan
                  </button>
                </div>
                <div className="relative mt-2 aspect-[21/9] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-950 dark:border-slate-800">
                  {isVideoMedia(formData.imageUrl) ? (
                    <video
                      src={formData.imageUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <img
                      src={formData.imageUrl}
                      alt="Banner Preview"
                      className="h-full w-full object-cover"
                    />
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {isVideoMedia(formData.imageUrl) && (
                    <div className="backdrop-blur-xs shadow-xs absolute left-2.5 top-2.5 z-10 flex items-center gap-1 rounded-md bg-orange-600/90 px-2 py-0.5 text-[9px] font-black text-white">
                      <Play className="h-2.5 w-2.5 fill-white text-white" />
                      <span>VIDEO PROMO</span>
                    </div>
                  )}

                  <div className="pointer-events-none absolute bottom-2 left-3 right-3 text-white">
                    <p className="text-xs font-bold leading-tight drop-shadow-md">
                      {formData.title || 'Judul Promosi Iklan'}
                    </p>
                    <p className="text-[10px] text-white/80">
                      {formData.subtitle ||
                        (formData.placement === 'HOMEPAGE_HERO'
                          ? `Durasi: ${formData.durationDays} Hari`
                          : `Target: ${Number(formData.targetImpressions).toLocaleString('id-ID')}x Muncul`)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* BAGIAN 4: DETAIL INFORMASI IKLAN */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Judul Promo / Pesan Banner{' '}
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Flash Sale Spesial Diskon 30%"
              value={formData.title}
              onChange={(e) =>
                setFormData((p) => ({ ...p, title: e.target.value }))
              }
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          {/* Subjudul Promo (Opsional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Subjudul / Keterangan Promo (Opsional)
            </label>
            <input
              type="text"
              placeholder="Garansi 30 hari tukar unit"
              value={formData.subtitle}
              onChange={(e) =>
                setFormData((p) => ({ ...p, subtitle: e.target.value }))
              }
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          {/* Pilihan Tujuan Navigasi (Target Link) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Pilihan Tujuan Navigasi (Target Link){' '}
                <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] font-medium text-slate-400">
                Pilih kemana pembeli diarahkan saat banner diklik
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {/* 1. Profil Toko */}
              <button
                type="button"
                onClick={() => {
                  const nextType: AdTargetType = 'STORE'
                  setFormData((p) => ({
                    ...p,
                    targetType: nextType,
                    targetUrl: computeTargetUrl(
                      nextType,
                      currentStore,
                      p.productId,
                      p.targetUrl
                    ),
                  }))
                }}
                className={`flex flex-col items-start rounded-2xl border p-2.5 text-left transition ${
                  formData.targetType === 'STORE'
                    ? 'border-orange-500 bg-orange-50/70 ring-2 ring-orange-500/20 dark:border-orange-500 dark:bg-orange-950/30'
                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <Store
                    className={`h-4 w-4 ${
                      formData.targetType === 'STORE'
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-slate-500'
                    }`}
                  />
                  {formData.targetType === 'STORE' && (
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                  )}
                </div>
                <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
                  Profil Toko
                </p>
                <p className="line-clamp-1 text-[10px] text-slate-500 dark:text-slate-400">
                  /toko/{currentStore?.slug || '[slug]'}
                </p>
              </button>

              {/* 2. Katalog Toko */}
              <button
                type="button"
                onClick={() => {
                  const nextType: AdTargetType = 'STORE_CATALOG'
                  setFormData((p) => ({
                    ...p,
                    targetType: nextType,
                    targetUrl: computeTargetUrl(
                      nextType,
                      currentStore,
                      p.productId,
                      p.targetUrl
                    ),
                  }))
                }}
                className={`flex flex-col items-start rounded-2xl border p-2.5 text-left transition ${
                  formData.targetType === 'STORE_CATALOG'
                    ? 'border-orange-500 bg-orange-50/70 ring-2 ring-orange-500/20 dark:border-orange-500 dark:bg-orange-950/30'
                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <ShoppingBag
                    className={`h-4 w-4 ${
                      formData.targetType === 'STORE_CATALOG'
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-slate-500'
                    }`}
                  />
                  {formData.targetType === 'STORE_CATALOG' && (
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                  )}
                </div>
                <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
                  Katalog Toko
                </p>
                <p className="line-clamp-1 text-[10px] text-slate-500 dark:text-slate-400">
                  /gadget?store=...
                </p>
              </button>

              {/* 3. Detail Produk */}
              <button
                type="button"
                onClick={() => {
                  const nextType: AdTargetType = 'PRODUCT'
                  const pid = formData.productId || storeProducts[0]?.id || ''
                  setFormData((p) => ({
                    ...p,
                    targetType: nextType,
                    productId: pid,
                    targetUrl: computeTargetUrl(
                      nextType,
                      currentStore,
                      pid,
                      p.targetUrl
                    ),
                  }))
                }}
                className={`flex flex-col items-start rounded-2xl border p-2.5 text-left transition ${
                  formData.targetType === 'PRODUCT'
                    ? 'border-orange-500 bg-orange-50/70 ring-2 ring-orange-500/20 dark:border-orange-500 dark:bg-orange-950/30'
                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <Package
                    className={`h-4 w-4 ${
                      formData.targetType === 'PRODUCT'
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-slate-500'
                    }`}
                  />
                  {formData.targetType === 'PRODUCT' && (
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                  )}
                </div>
                <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
                  Detail Produk
                </p>
                <p className="line-clamp-1 text-[10px] text-slate-500 dark:text-slate-400">
                  /gadget/[id]
                </p>
              </button>

              {/* 4. Semua Katalog */}
              <button
                type="button"
                onClick={() => {
                  const nextType: AdTargetType = 'ALL_CATALOG'
                  setFormData((p) => ({
                    ...p,
                    targetType: nextType,
                    targetUrl: computeTargetUrl(
                      nextType,
                      currentStore,
                      p.productId,
                      p.targetUrl
                    ),
                  }))
                }}
                className={`flex flex-col items-start rounded-2xl border p-2.5 text-left transition ${
                  formData.targetType === 'ALL_CATALOG'
                    ? 'border-orange-500 bg-orange-50/70 ring-2 ring-orange-500/20 dark:border-orange-500 dark:bg-orange-950/30'
                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <Globe
                    className={`h-4 w-4 ${
                      formData.targetType === 'ALL_CATALOG'
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-slate-500'
                    }`}
                  />
                  {formData.targetType === 'ALL_CATALOG' && (
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                  )}
                </div>
                <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
                  Semua Katalog
                </p>
                <p className="line-clamp-1 text-[10px] text-slate-500 dark:text-slate-400">
                  /gadget
                </p>
              </button>
            </div>

            {/* Sub-selector jika memilih Detail Produk */}
            {formData.targetType === 'PRODUCT' && storeProducts.length > 0 && (
              <div className="mt-2.5 rounded-2xl border border-orange-200/80 bg-orange-50/50 p-3 dark:border-orange-900/40 dark:bg-orange-950/20">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Pilih Produk Toko yang Dituju:
                </label>
                <div className="mt-1.5">
                  <CustomSelect
                    value={formData.productId || storeProducts[0]?.id || ''}
                    onChange={(val: string) => {
                      const chosen = storeProducts.find((p) => p.id === val)
                      setFormData((prev) => ({
                        ...prev,
                        productId: val,
                        targetUrl: `/gadget/${val}`,
                        title: prev.title.trim()
                          ? prev.title
                          : chosen
                            ? `Flash Sale ${chosen.name}`
                            : prev.title,
                        selectedPhotoLabel: chosen
                          ? `Produk: ${chosen.name}`
                          : prev.selectedPhotoLabel,
                      }))
                    }}
                    options={storeProducts.map((p) => ({
                      value: p.id,
                      label: `${p.name} - Rp ${Number(p.price || 0).toLocaleString('id-ID')}`,
                    }))}
                    placeholder="Pilih Produk..."
                  />
                </div>
              </div>
            )}

            {/* Live Card Pratinjau Link Terbentuk */}
            <div className="mt-2.5 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-[11px] font-bold text-white">
                  🔗
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    Link Tujuan Navigasi Terbentuk:
                  </p>
                  <code className="block truncate text-xs font-black text-slate-900 dark:text-white">
                    {formData.targetUrl || '/gadget'}
                  </code>
                </div>
              </div>
              {formData.targetUrl && (
                <a
                  href={formData.targetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="shadow-2xs inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  <ExternalLink className="h-3 w-3 shrink-0 text-orange-500" />
                  <span className="whitespace-nowrap">Cek Link</span>
                </a>
              )}
            </div>
          </div>

          {/* Priority (Superadmin only) */}
          {isSuperAdmin && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Prioritas Urutan Tayang (Superadmin: Angka lebih tinggi = lebih
                awal)
              </label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    priority: parseInt(e.target.value, 10) || 0,
                  }))
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
          )}

          {/* Tombol Simpan / Kirim */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 whitespace-nowrap rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={actionLoading === 'create'}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/20 hover:bg-orange-600 active:scale-95 disabled:opacity-50 sm:px-5"
            >
              {actionLoading === 'create' ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                  <span className="whitespace-nowrap">Mengirim...</span>
                </>
              ) : (
                <span className="whitespace-nowrap">
                  {isSuperAdmin ? 'Terbitkan Iklan' : 'Kirim Pengajuan Iklan'}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
