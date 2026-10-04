'use client'

import React from 'react'
import {
  ImageIcon,
  X,
  AlertCircle,
  Store,
  Package,
  Sparkles,
  Upload,
  Play,
  Link2,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { isVideoMedia } from '@/types/ads'
import { InternalAdItem, PRESET_BANNERS } from '../types'

interface ChangeMediaModalProps {
  isOpen: boolean
  editingAd: InternalAdItem | null
  onClose: () => void
  isSuperAdmin: boolean
  storeBanner: string | null
  storeProducts: any[]
  loadingProducts: boolean
  newImageUrl: string
  setNewImageUrl: (url: string) => void
  newImageLabel: string
  setNewImageLabel: (label: string) => void
  editTitle: string
  setEditTitle: (title: string) => void
  editTargetUrl: string
  setEditTargetUrl: (url: string) => void
  changeImageTab: 'STORE_BANNER' | 'PRODUCTS' | 'PRESETS' | 'UPLOAD' | 'URL'
  setChangeImageTab: (
    tab: 'STORE_BANNER' | 'PRODUCTS' | 'PRESETS' | 'UPLOAD' | 'URL'
  ) => void
  uploadingMedia: boolean
  setUploadingMedia: (uploading: boolean) => void
  savingImage: boolean
  onSave: () => void
}

export function ChangeMediaModal({
  isOpen,
  editingAd,
  onClose,
  isSuperAdmin,
  storeBanner,
  storeProducts,
  loadingProducts,
  newImageUrl,
  setNewImageUrl,
  newImageLabel,
  setNewImageLabel,
  editTitle,
  setEditTitle,
  editTargetUrl,
  setEditTargetUrl,
  changeImageTab,
  setChangeImageTab,
  uploadingMedia,
  setUploadingMedia,
  savingImage,
  onSave,
}: ChangeMediaModalProps) {
  if (!isOpen || !editingAd) return null

  return (
    <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl [scrollbar-width:thin] dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600">
              <ImageIcon className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
                Ganti Media Banner / Video Iklan
              </h3>
              <p className="line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                {editingAd.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Notice untuk Admin Toko */}
        {!isSuperAdmin && (
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-bold">Ketentuan Persetujuan Superadmin</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                Setiap perubahan foto, video, judul, atau target link oleh Admin
                Toko akan otomatis mengubah status iklan menjadi{' '}
                <strong>Menunggu Persetujuan (Pending)</strong> dan memerlukan
                peninjauan kembali oleh <strong>Superadmin</strong> sebelum
                ditayangkan kembali.
              </p>
            </div>
          </div>
        )}

        <div className="mt-4 space-y-4">
          {/* Tab Pilihan Sumber Foto/Video Baru */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Pilih Foto atau Video Pengganti Baru:
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2.5 dark:border-slate-800">
              {storeBanner && (
                <button
                  type="button"
                  onClick={() => setChangeImageTab('STORE_BANNER')}
                  className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition ${
                    changeImageTab === 'STORE_BANNER'
                      ? 'shadow-xs bg-orange-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  <Store className="h-3 w-3" />
                  <span>Banner Toko</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setChangeImageTab('PRODUCTS')}
                className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition ${
                  changeImageTab === 'PRODUCTS'
                    ? 'shadow-xs bg-orange-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                <Package className="h-3 w-3" />
                <span>Foto Produk Toko ({storeProducts.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setChangeImageTab('PRESETS')}
                className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition ${
                  changeImageTab === 'PRESETS'
                    ? 'shadow-xs bg-orange-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                <Sparkles className="h-3 w-3" />
                <span>Preset Promo</span>
              </button>

              <button
                type="button"
                onClick={() => setChangeImageTab('UPLOAD')}
                className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition ${
                  changeImageTab === 'UPLOAD'
                    ? 'shadow-xs bg-orange-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                <Upload className="h-3 w-3" />
                <span>Upload File (Foto/Video)</span>
              </button>

              <button
                type="button"
                onClick={() => setChangeImageTab('URL')}
                className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition ${
                  changeImageTab === 'URL'
                    ? 'shadow-xs bg-orange-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                <ImageIcon className="h-3 w-3" />
                <span>Input URL Media</span>
              </button>
            </div>
          </div>

          {/* Konten Pilihan Media Pengganti */}
          <div>
            {/* 1. Banner Toko */}
            {changeImageTab === 'STORE_BANNER' && storeBanner && (
              <div
                onClick={() => {
                  setNewImageUrl(storeBanner)
                  setNewImageLabel('Banner Profil Toko')
                }}
                className={`relative aspect-[21/9] w-full cursor-pointer overflow-hidden rounded-2xl border-2 transition ${
                  newImageUrl === storeBanner
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
                    {newImageUrl === storeBanner
                      ? '✓ Banner Toko Terpilih'
                      : 'Klik untuk Memakai Banner Toko'}
                  </span>
                </div>
              </div>
            )}

            {/* 2. Foto Produk Toko */}
            {changeImageTab === 'PRODUCTS' && (
              <div>
                {loadingProducts ? (
                  <div className="flex h-24 items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                  </div>
                ) : storeProducts.length === 0 ? (
                  <p className="py-3 text-center text-xs text-slate-400">
                    Belum ada foto produk di katalog toko ini.
                  </p>
                ) : (
                  <div className="grid max-h-48 grid-cols-3 gap-2 overflow-y-auto pr-1 [scrollbar-width:thin] sm:grid-cols-4">
                    {storeProducts.map((prod) => {
                      const img =
                        prod.images?.[0] ||
                        prod.thumbnail ||
                        '/images/banners/samsung-mobile-hero.jpg'
                      const isSelected = newImageUrl === img
                      return (
                        <div
                          key={prod.id}
                          onClick={() => {
                            setNewImageUrl(img)
                            setNewImageLabel(`Produk: ${prod.name}`)
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

            {/* 3. Preset Platform */}
            {changeImageTab === 'PRESETS' && (
              <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto pr-1 [scrollbar-width:thin] sm:grid-cols-3">
                {PRESET_BANNERS.map((preset, idx) => {
                  const isSelected = newImageUrl === preset.url
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setNewImageUrl(preset.url)
                        setNewImageLabel(preset.label)
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
            )}

            {/* 4. Upload File Komputer (Foto atau Video) */}
            {changeImageTab === 'UPLOAD' && (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-orange-400 hover:bg-orange-50/20 dark:border-slate-800 dark:bg-slate-950">
                {uploadingMedia ? (
                  <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                ) : (
                  <Upload className="h-6 w-6 text-orange-500" />
                )}
                <span className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  {uploadingMedia
                    ? 'Mengunggah Media ke Server...'
                    : 'Pilih File Foto atau Video Baru dari Komputer'}
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
                          setNewImageUrl(data.url)
                          setNewImageLabel(
                            `${isVid ? 'Video' : 'Upload'}: ${file.name}`
                          )
                          toast.success(
                            `${isVid ? 'Video' : 'Foto'} ${file.name} berhasil diunggah`
                          )
                        } else {
                          throw new Error(data.error || 'Gagal upload file')
                        }
                      } catch (err: any) {
                        const reader = new FileReader()
                        reader.onload = () => {
                          setNewImageUrl(reader.result as string)
                          setNewImageLabel(`Upload: ${file.name}`)
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
            )}

            {/* 5. Input URL Kustom */}
            {changeImageTab === 'URL' && (
              <div>
                <input
                  type="text"
                  placeholder="https://... Masukkan URL foto atau video banner baru (.mp4, .webm, dsb)"
                  value={newImageUrl}
                  onChange={(e) => {
                    setNewImageUrl(e.target.value)
                    setNewImageLabel(
                      isVideoMedia(e.target.value)
                        ? 'URL Video Kustom'
                        : 'URL Kustom'
                    )
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
            )}
          </div>

          {/* Pratinjau Media Banner Baru yang Dipilih */}
          {newImageUrl && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center justify-between pb-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                <span>
                  Pratinjau Media Baru:{' '}
                  <strong className="text-orange-600 dark:text-orange-400">
                    {newImageLabel ||
                      (isVideoMedia(newImageUrl)
                        ? 'Video Pengganti'
                        : 'Foto Pengganti')}
                  </strong>
                </span>
              </div>
              <div className="relative aspect-[21/9] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-950 dark:border-slate-800">
                {isVideoMedia(newImageUrl) ? (
                  <video
                    src={newImageUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src={newImageUrl}
                    alt="New Preview"
                    className="h-full w-full object-cover"
                  />
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {isVideoMedia(newImageUrl) && (
                  <div className="backdrop-blur-xs shadow-xs absolute left-2.5 top-2.5 z-10 flex items-center gap-1 rounded-md bg-orange-600/90 px-2 py-0.5 text-[9px] font-black text-white">
                    <Play className="h-2.5 w-2.5 fill-white text-white" />
                    <span>VIDEO PROMO</span>
                  </div>
                )}

                <div className="pointer-events-none absolute bottom-2 left-3 right-3 text-white">
                  <p className="text-xs font-bold leading-tight drop-shadow-md">
                    {editTitle || editingAd.title}
                  </p>
                  <p className="text-[10px] text-white/80">
                    {editingAd.store?.name || 'Toko Resmi PT'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Judul Promosi Iklan */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Sparkles className="h-4 w-4 text-orange-500" />
              <span>Judul Promosi Iklan:</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Promo Spesial Toko Kami..."
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          {/* Target Link Editing */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Link2 className="h-4 w-4 text-orange-500" />
                <span>Target Link Navigasi (URL Tujuan):</span>
              </label>
              {editTargetUrl && (
                <a
                  href={editTargetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:underline dark:text-orange-400"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>Cek Link</span>
                </a>
              )}
            </div>
            <input
              type="text"
              placeholder="/toko/... atau /gadget/... atau https://..."
              value={editTargetUrl}
              onChange={(e) => setEditTargetUrl(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={savingImage || !newImageUrl.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-5 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/20 hover:bg-orange-600 active:scale-95 disabled:opacity-50"
            >
              {savingImage ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Menyimpan Media...</span>
                </>
              ) : (
                <span>
                  {isSuperAdmin
                    ? 'Simpan Media Banner'
                    : 'Ajukan Perubahan ke Superadmin'}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
