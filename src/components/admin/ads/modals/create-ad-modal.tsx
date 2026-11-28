'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Sparkles,
  X,
  Store,
  Calendar,
  Clock,
  Upload,
  ShoppingBag,
  Package,
  Globe,
  ExternalLink,
  Play,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { CustomSelect } from '@/components/ui/custom-select'
import { isVideoMedia } from '@/types/ads'
import { processMediaUploadFile } from '@/lib/media-upload-client'
import {
  AdTargetType,
  CurrentStoreInfo,
  Level1SlotInfo,
  computeTargetUrl,
} from '../types'

interface CreateAdModalProps {
  isOpen: boolean
  onClose: () => void
  isSuperAdmin: boolean
  currentStore: CurrentStoreInfo | null
  allStores: CurrentStoreInfo[]
  storeBanner?: string | null
  storeProducts: any[]
  loadingProducts?: boolean
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
    endDate: string
    durationDays: number
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
      endDate: string
      durationDays: number
      selectedPhotoLabel: string
    }>
  >
  computedEndDateStr?: string
  actionLoading: string | null
  photoSourceTab?: any
  setPhotoSourceTab?: (tab: any) => void
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
  storeProducts,
  level1Slot,
  formData,
  setFormData,
  actionLoading,
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

  const isLevel1 = formData.placement === 'HOMEPAGE_HERO'

  return createPortal(
    <div className="backdrop-blur-xs fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/70 p-3 duration-200 animate-in fade-in sm:p-4">
      <div className="relative my-auto max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl [scrollbar-width:thin] dark:border-slate-800 dark:bg-slate-900 sm:max-h-[90vh] sm:p-6">
        {/* Header Modal */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800 sm:pb-4">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600">
              <Sparkles className="h-4 w-4 shrink-0" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-extrabold text-slate-950 dark:text-white sm:text-base">
                {isLevel1
                  ? isSuperAdmin
                    ? 'Buat Iklan Level 1 • Hero Carousel'
                    : 'Ajukan Iklan Level 1 • Hero Carousel'
                  : isSuperAdmin
                    ? 'Buat Iklan Level 2 • Grid Produk'
                    : 'Ajukan Iklan Level 2 • Grid Produk'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
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

          {/* STATUS TINGKAT PENEMPATAN IKLAN (TERKUNCI SESUAI TAB DI AWAL) */}
          {isLevel1 ? (
            <div className="flex items-center justify-between gap-2.5 rounded-2xl border border-blue-200 bg-blue-50/70 p-3.5 dark:border-blue-900/60 dark:bg-blue-950/30">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <span className="shrink-0 whitespace-nowrap rounded-lg bg-blue-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                  LEVEL 1 • CAROUSEL
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                    Hero Carousel (Slider Atas)
                  </p>
                  <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                    Slider banner paling atas beranda
                  </p>
                </div>
              </div>
              {level1Slot.isOccupied ? (
                <span className="shrink-0 whitespace-nowrap rounded-full bg-amber-100 px-2.5 py-0.5 text-[9px] font-black text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  SLOT TERISI
                </span>
              ) : (
                <span className="shrink-0 whitespace-nowrap rounded-full bg-emerald-100 px-2.5 py-0.5 text-[9px] font-black text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  SLOT TERSEDIA
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2.5 rounded-2xl border border-orange-200 bg-orange-50/70 p-3.5 dark:border-orange-900/60 dark:bg-orange-950/30">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <span className="shrink-0 whitespace-nowrap rounded-lg bg-orange-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                  LEVEL 2 • GRID PRODUK
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                    In-Feed Grid Produk (Katalog)
                  </p>
                  <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                    Diselipkan di antara etalase kartu produk toko
                  </p>
                </div>
              </div>
              <span className="shrink-0 whitespace-nowrap rounded-full bg-emerald-100 px-2.5 py-0.5 text-[9px] font-black text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                SLOT TERSEDIA
              </span>
            </div>
          )}

          {/* JADWAL MASA TAYANG IKLAN: PILIH TANGGAL MULAI & TANGGAL BERAKHIR SAJA */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <Calendar className="h-4 w-4 text-orange-500" />
              <span>Jadwal Masa Tayang Iklan:</span>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Tanggal Mulai Tayang: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => {
                    const newStart = e.target.value
                    const currentEnd = formData.endDate || newStart
                    const diff = Math.max(
                      1,
                      Math.round(
                        (new Date(currentEnd).getTime() -
                          new Date(newStart).getTime()) /
                          86400000
                      )
                    )
                    setFormData((p) => ({
                      ...p,
                      startDate: newStart,
                      durationDays: diff,
                    }))
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Tanggal Berakhir Tayang:{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  min={formData.startDate}
                  value={formData.endDate || ''}
                  onChange={(e) => {
                    const newEnd = e.target.value
                    const currentStart = formData.startDate
                    const diff = Math.max(
                      1,
                      Math.round(
                        (new Date(newEnd).getTime() -
                          new Date(currentStart).getTime()) /
                          86400000
                      )
                    )
                    setFormData((p) => ({
                      ...p,
                      endDate: newEnd,
                      durationDays: diff,
                    }))
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>

            {formData.startDate && formData.endDate && (
              <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <Clock className="h-3.5 w-3.5 text-orange-500" />
                <span>
                  Total Durasi:{' '}
                  <strong>{formData.durationDays || 1} Hari</strong> (
                  {new Date(formData.startDate).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}{' '}
                  s/d{' '}
                  {new Date(formData.endDate).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                  )
                </span>
              </div>
            )}
          </div>

          {/* UPLOAD BANNER PROMOSI (HANYA UPLOAD OPSINYA) */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Upload Banner Promosi (Foto / Video):{' '}
                <span className="text-rose-500">*</span>
              </label>
              {formData.imageUrl && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  ✓ File Banner Terpilih
                </span>
              )}
            </div>

            {/* Dropzone Upload */}
            <div className="mt-2.5">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6 text-center transition hover:border-orange-400 hover:bg-orange-50/20 dark:border-slate-800 dark:bg-slate-900">
                {uploadingMedia ? (
                  <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
                ) : (
                  <Upload className="h-7 w-7 text-orange-500" />
                )}
                <span className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  {uploadingMedia
                    ? 'Mengunggah Media ke Server...'
                    : formData.imageUrl
                      ? 'Klik untuk Mengganti File Banner'
                      : 'Pilih File Foto atau Video Banner dari Komputer'}
                </span>
                <span className="mt-0.5 text-[10px] text-slate-400">
                  Foto JPG, PNG (Maks 2MB, auto-kompres) atau Video MP4 (Maks
                  30MB, 10–60 dtk)
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,video/mp4"
                  disabled={uploadingMedia}
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const isVid =
                        file.type.startsWith('video/') ||
                        file.name.toLowerCase().endsWith('.mp4')
                      setUploadingMedia(true)
                      try {
                        let fileToUpload = file
                        try {
                          fileToUpload = await processMediaUploadFile(file)
                          if (!isVid && file.size > 2 * 1024 * 1024) {
                            toast.info(
                              `Foto "${file.name}" otomatis dikompres ke ukuran optimal (< 2 MB).`
                            )
                          }
                        } catch (validationErr: any) {
                          toast.error(
                            validationErr.message ||
                              'Format atau ukuran file tidak sesuai ketentuan.'
                          )
                          return
                        }

                        const fd = new FormData()
                        fd.append('file', fileToUpload)
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
                            selectedPhotoLabel: `${isVid ? 'Video' : 'Foto'}: ${file.name}`,
                          }))
                          toast.success(
                            `${isVid ? 'Video' : 'Foto'} ${file.name} berhasil diunggah`
                          )
                        } else {
                          throw new Error(data.error || 'Gagal upload media')
                        }
                      } catch (err: any) {
                        console.error('Error uploading ad media:', err)
                        toast.error(
                          err.message || 'Gagal mengunggah media ke server'
                        )
                      } finally {
                        setUploadingMedia(false)
                        e.target.value = ''
                      }
                    }
                  }}
                />
              </label>
            </div>

            {/* Pratinjau Media Banner */}
            {formData.imageUrl && (
              <div className="mt-3.5 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                  <span className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300">
                    Media Banner Terpilih:{' '}
                    <strong className="text-orange-600 dark:text-orange-400">
                      {formData.selectedPhotoLabel || 'File Terunggah'}
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
                    Hapus File
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
                        `Masa Tayang: ${formData.durationDays || 1} Hari`}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* DETAIL INFORMASI IKLAN */}
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
