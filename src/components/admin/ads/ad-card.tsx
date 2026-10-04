'use client'

import React from 'react'
import {
  Sparkles,
  CheckCircle2,
  Clock,
  ExternalLink,
  Trash2,
  Store,
  AlertTriangle,
  Check,
  X,
  Calendar,
  Target,
  ImageIcon,
  Play,
  Timer,
} from 'lucide-react'
import {
  InternalAdItem,
  CurrentStoreInfo,
  Level1SlotInfo,
  calculateDurationText,
  getAdTimingInfo,
} from './types'

interface AdCardProps {
  ad: InternalAdItem
  isSuperAdmin: boolean
  currentStore: CurrentStoreInfo | null
  levelFilter: 'LEVEL_1' | 'LEVEL_2'
  level1Slot: Level1SlotInfo
  waitingLevel1Ads: InternalAdItem[]
  actionLoading: string | null
  onOpenChangeImage: (ad: InternalAdItem) => void
  onApprove: (ad: InternalAdItem) => void
  onReject: (ad: InternalAdItem) => void
  onCancel: (ad: InternalAdItem) => void
  onToggleActive: (ad: InternalAdItem) => void
  onDelete: (ad: InternalAdItem) => void
}

export function AdCard({
  ad,
  isSuperAdmin,
  currentStore,
  levelFilter,
  level1Slot,
  waitingLevel1Ads,
  actionLoading,
  onOpenChangeImage,
  onApprove,
  onReject,
  onCancel,
  onToggleActive,
  onDelete,
}: AdCardProps) {
  const isPending = ad.status === 'PENDING'
  const isApproved = ad.status === 'APPROVED'
  const isRejected = ad.status === 'REJECTED'
  const timing = getAdTimingInfo(ad)

  const isStreamingNow =
    ad.placement === 'HOMEPAGE_HERO' &&
    ((ad as any).isExclusiveLevel1Active ||
      level1Slot.activeAd?.id === ad.id ||
      (isApproved && ad.isActive && !timing.isExpired))

  const queueIndex =
    ad.placement === 'HOMEPAGE_HERO' &&
    !isStreamingNow &&
    (isApproved || isPending) &&
    !timing.isExpired
      ? waitingLevel1Ads.findIndex((w) => w.id === ad.id) + 1
      : 0

  const isVideo = Boolean(
    ad.imageUrl &&
    (ad.imageUrl.toLowerCase().endsWith('.mp4') ||
      ad.imageUrl.toLowerCase().endsWith('.webm') ||
      ad.imageUrl.toLowerCase().includes('/video/'))
  )

  // Store ownership check for editing media & deletion
  const isMyStoreAd = !isSuperAdmin
    ? !ad.store?.id || ad.store?.id === currentStore?.id
    : true
  const canEditMedia = isSuperAdmin || isMyStoreAd
  const canDeleteAd = isSuperAdmin || isMyStoreAd

  // Dynamic card border styling based on status / queue
  const cardBorderClass = isStreamingNow
    ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
    : timing.isUrgent && timing.isCurrentlyActive
      ? 'border-amber-400 dark:border-amber-600 ring-2 ring-amber-500/20 shadow-sm'
      : 'border-slate-200/80 dark:border-slate-800'

  return (
    <div
      className={`group flex flex-col justify-between overflow-hidden rounded-3xl border bg-white p-4 shadow-sm transition hover:shadow-md dark:bg-slate-900 ${cardBorderClass}`}
    >
      <div>
        {/* Antrean / Sisa Waktu Strip */}
        {levelFilter === 'LEVEL_1' ? (
          isStreamingNow ? (
            <div className="mb-3 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/90 px-3 py-1.5 text-xs dark:border-blue-900/60 dark:bg-blue-950/40">
              <div className="flex items-center gap-1.5">
                <span className="flex h-2 w-2 animate-pulse rounded-full bg-blue-600" />
                <span className="text-[11px] font-black text-blue-900 dark:text-blue-300">
                  #1 SEDANG DITAYANGKAN DI PALING ATAS
                </span>
              </div>
              <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400">
                Sisa: {timing.remainingText}
              </span>
            </div>
          ) : queueIndex > 0 ? (
            <div className="mb-3 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-1.5 text-xs dark:border-amber-900/60 dark:bg-amber-950/40">
              <div className="flex items-center gap-1.5">
                <Timer className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300">
                  ANTREAN KE-{queueIndex}: AKAN TAYANG BERIKUTNYA
                </span>
              </div>
              <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                {isPending
                  ? 'Menunggu Review'
                  : 'Siap Tayang Setelah Slot Expired'}
              </span>
            </div>
          ) : (
            <div className="mb-3 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
              <span>
                {isRejected
                  ? 'Pengajuan Ditolak'
                  : 'Masa Tayang Selesai / Non-Aktif'}
              </span>
            </div>
          )
        ) : timing.isCurrentlyActive ? (
          timing.isUrgent ? (
            <div className="mb-3 flex items-center justify-between rounded-xl border border-rose-300 bg-rose-50/90 px-3 py-1.5 text-xs dark:border-rose-900/60 dark:bg-rose-950/40">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 animate-bounce text-rose-600" />
                <span className="text-[11px] font-black text-rose-900 dark:text-rose-200">
                  SEBENTAR LAGI HABIS: Sisa {timing.remainingText}
                </span>
              </div>
              <span className="text-[10px] font-extrabold uppercase text-rose-700 dark:text-rose-400">
                Prioritas Perpanjangan
              </span>
            </div>
          ) : (
            <div className="mb-3 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-xs dark:border-emerald-900/60 dark:bg-emerald-950/40">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300">
                  Aktif Tayang: Sisa {timing.remainingText}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                {ad.endDate
                  ? `Berakhir ${new Date(ad.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`
                  : ''}
              </span>
            </div>
          )
        ) : isPending ? (
          <div className="mb-3 flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs dark:border-amber-900/60 dark:bg-amber-950/40">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
              Menunggu Review Moderasi Superadmin
            </span>
          </div>
        ) : (
          <div className="mb-3 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
            <span>
              {isRejected
                ? 'Pengajuan Ditolak'
                : 'Masa Tayang Habis / Non-Aktif'}
            </span>
          </div>
        )}

        {/* Top Placement & Status Badge */}
        <div className="mb-3 flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
              ad.placement === 'HOMEPAGE_HERO'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                : 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400'
            }`}
          >
            <Sparkles className="h-2.5 w-2.5" />
            {ad.placement === 'HOMEPAGE_HERO'
              ? 'Level 1: Hero Carousel Mobile & Desktop'
              : 'Level 2: In-Feed Grid Produk'}
          </span>

          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
              isApproved && ad.isActive
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                : isApproved && !ad.isActive
                  ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  : isPending
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
            }`}
          >
            {isApproved && ad.isActive
              ? ad.placement === 'HOMEPAGE_HERO'
                ? 'Disetujui & Aktif (Eksklusif)'
                : 'Disetujui & Aktif'
              : isApproved && !ad.isActive
                ? 'Non-Aktif'
                : isPending
                  ? ad.placement === 'HOMEPAGE_HERO' &&
                    level1Slot.isOccupied &&
                    level1Slot.activeAd?.id !== ad.id
                    ? 'Antrean Slot (Menunggu Expired)'
                    : 'Menunggu Review'
                  : 'Ditolak'}
          </span>
        </div>

        {/* Banner Image / Video Visual Preview */}
        <div
          onClick={canEditMedia ? () => onOpenChangeImage(ad) : undefined}
          className={`group/banner relative mb-3 aspect-[21/9] w-full overflow-hidden rounded-2xl border border-slate-100 bg-slate-950 dark:border-slate-800 ${
            canEditMedia ? 'cursor-pointer' : 'cursor-default'
          }`}
          title={
            canEditMedia
              ? 'Klik untuk mengganti foto atau video banner'
              : undefined
          }
        >
          {isVideo ? (
            <video
              src={ad.imageUrl}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="h-full w-full object-cover transition duration-300 group-hover/banner:scale-105"
            />
          ) : (
            <img
              src={
                ad.imageUrl ||
                ad.store?.banner ||
                '/images/banners/samsung-campaign-banner.jpg'
              }
              alt={ad.title}
              className="h-full w-full object-cover transition duration-300 group-hover/banner:scale-105"
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Video Promo Badge */}
          {isVideo && (
            <div className="backdrop-blur-xs shadow-xs absolute left-2.5 top-2.5 z-10 flex items-center gap-1 rounded-md bg-orange-600/90 px-2 py-0.5 text-[9px] font-black text-white">
              <Play className="h-2.5 w-2.5 fill-white text-white" />
              <span>VIDEO PROMO</span>
            </div>
          )}

          {/* Hover Overlay Button to Change Image */}
          {canEditMedia && (
            <div className="backdrop-blur-2xs absolute inset-0 flex items-center justify-center gap-1.5 bg-black/55 text-xs font-bold text-white opacity-0 transition duration-200 group-hover/banner:opacity-100">
              <ImageIcon className="h-4 w-4 text-orange-400" />
              <span>Klik untuk Ganti Foto / Video Banner</span>
            </div>
          )}

          <div className="pointer-events-none absolute bottom-2.5 left-3 right-3 text-white">
            <p className="text-xs font-bold leading-tight drop-shadow-md">
              {ad.title}
            </p>
            <p className="drop-shadow-xs text-[10px] font-medium text-white/80">
              {ad.subtitle
                ? ad.subtitle
                : `${ad.store?.name || 'Platform Sponsor'} • ${ad.store?.city || 'Indonesia'}`}
            </p>
          </div>

          {isSuperAdmin && (
            <div className="backdrop-blur-xs absolute right-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white">
              Prioritas: {ad.priority}
            </div>
          )}
        </div>

        {/* Store & Metadata info */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5 truncate">
              <Store className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate font-semibold text-slate-900 dark:text-white">
                {ad.store?.name || 'Semua Toko'}
              </span>
              {ad.store?.city && (
                <span className="text-[11px] text-slate-400">
                  ({ad.store.city})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
              <span>{ad.impressions} Views</span>
              <span>•</span>
              <span>{ad.clicks} Clicks</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
            <span className="truncate">
              Target Link:{' '}
              <code className="text-slate-600 dark:text-slate-300">
                {ad.targetUrl ||
                  (ad.store?.slug ? `/toko/${ad.store.slug}` : '/gadget')}
              </code>
            </span>
            <a
              href={
                ad.targetUrl ||
                (ad.store?.slug ? `/toko/${ad.store.slug}` : '/gadget')
              }
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50"
            >
              <ExternalLink className="h-3 w-3" />
              <span>Kunjungi</span>
            </a>
          </div>

          {/* Rejection Alert Box */}
          {isRejected && ad.rejectionReason && (
            <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50/80 p-2.5 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <div>
                <p className="text-[11px] font-bold">
                  Catatan Penolakan Superadmin:
                </p>
                <p className="mt-0.5 text-[11px]">{ad.rejectionReason}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Footer (Clean & Practical: Duration/Target Badges + Controls) */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          {ad.placement === 'HOMEPAGE_HERO' ? (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200/80 bg-blue-50/80 px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
              <Calendar className="h-3 w-3" />
              <span>
                {ad.subtitle?.includes('Durasi')
                  ? ad.subtitle
                  : calculateDurationText(ad.startDate, ad.endDate, 'LEVEL_1')}
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200/80 bg-orange-50/80 px-2.5 py-1 text-[11px] font-bold text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300">
              <Target className="h-3 w-3" />
              <span>
                {ad.subtitle?.includes('Target')
                  ? ad.subtitle
                  : calculateDurationText(ad.startDate, ad.endDate, 'LEVEL_2')}
              </span>
            </span>
          )}

          {canEditMedia && (
            <button
              type="button"
              onClick={() => onOpenChangeImage(ad)}
              className="shadow-2xs inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-orange-300 hover:bg-orange-50/60 hover:text-orange-600 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-orange-400"
              title={
                isSuperAdmin
                  ? 'Ganti foto atau video banner iklan ini'
                  : 'Ganti media iklan (wajib persetujuan ulang Superadmin)'
              }
            >
              <ImageIcon className="h-3.5 w-3.5 text-orange-500" />
              <span>Ganti Foto / Video</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Super Admin Approval Actions */}
          {isSuperAdmin && isPending && (
            <>
              <button
                type="button"
                onClick={() => onApprove(ad)}
                disabled={actionLoading === ad.id}
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Setujui</span>
              </button>
              <button
                type="button"
                onClick={() => onReject(ad)}
                disabled={actionLoading === ad.id}
                className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
              >
                <X className="h-3.5 w-3.5" />
                <span>Tolak</span>
              </button>
            </>
          )}

          {/* Store Admin Cancel Submission Action */}
          {!isSuperAdmin && isPending && (
            <button
              type="button"
              onClick={() => onCancel(ad)}
              disabled={actionLoading === ad.id}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 active:scale-95 disabled:opacity-50 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
            >
              <X className="h-3.5 w-3.5" />
              <span>Batalkan Pengajuan</span>
            </button>
          )}

          {/* Toggle Active for Approved (Super Admin Only) */}
          {isSuperAdmin && isApproved && (
            <button
              type="button"
              onClick={() => onToggleActive(ad)}
              disabled={actionLoading === ad.id}
              className={`rounded-xl px-2.5 py-1 text-[11px] font-semibold transition ${
                ad.isActive
                  ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {ad.isActive ? 'Nonaktifkan' : 'Aktifkan'}
            </button>
          )}

          {/* Delete action (Super Admin can delete any ad, Store Admin can delete their store's ad) */}
          {canDeleteAd && (
            <button
              type="button"
              onClick={() => onDelete(ad)}
              disabled={actionLoading === ad.id}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/80 px-2.5 py-1 text-[11px] font-bold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 hover:text-rose-800 active:scale-95 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
              title={
                isSuperAdmin
                  ? 'Hapus Iklan dari Sistem'
                  : 'Hapus Iklan / Pengajuan Toko'
              }
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
              <span>Hapus</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
