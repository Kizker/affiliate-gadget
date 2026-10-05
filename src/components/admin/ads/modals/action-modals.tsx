'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  XCircle,
  AlertTriangle,
  Trash2,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { InternalAdItem, Level1SlotInfo, calculateDurationText } from '../types'

function ModalPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  if (!mounted || typeof document === 'undefined') return null
  return createPortal(children, document.body)
}

interface RejectAdModalProps {
  ad: InternalAdItem | null
  rejectionReason: string
  onReasonChange: (reason: string) => void
  onClose: () => void
  onSubmit: () => void
  actionLoading: string | null
}

export function RejectAdModal({
  ad,
  rejectionReason,
  onReasonChange,
  onClose,
  onSubmit,
  actionLoading,
}: RejectAdModalProps) {
  if (!ad) return null

  return (
    <ModalPortal>
      <div className="backdrop-blur-xs fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/60 p-4 duration-200 animate-in fade-in">
        <div className="relative w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            <XCircle className="h-6 w-6" />
          </div>

          <div className="mt-4 text-center">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Tolak Pengajuan Iklan?
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Materi iklan{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                &ldquo;{ad.title}&rdquo;
              </span>
              {ad.store?.name && (
                <>
                  {' '}
                  dari{' '}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {ad.store.name}
                  </span>
                </>
              )}{' '}
              akan ditolak. Berikan catatan alasan penolakan untuk toko.
            </p>
          </div>

          <div className="mt-4 text-left">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Alasan Penolakan:
            </label>
            <textarea
              rows={3}
              placeholder="Contoh: Resolusi banner terlalu pecah atau materi promosi melanggar pedoman toko resmi."
              value={rejectionReason}
              onChange={(e) => onReasonChange(e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-900 focus:border-rose-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={actionLoading === ad.id}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={actionLoading === ad.id}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-rose-700 active:scale-95 disabled:opacity-50"
            >
              {actionLoading === ad.id ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menolak...</span>
                </>
              ) : (
                <span>Tolak Pengajuan</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}

interface CancelAdModalProps {
  ad: InternalAdItem | null
  onClose: () => void
  onConfirm: () => void
  actionLoading: string | null
}

export function CancelAdModal({
  ad,
  onClose,
  onConfirm,
  actionLoading,
}: CancelAdModalProps) {
  if (!ad) return null

  return (
    <ModalPortal>
      <div className="backdrop-blur-xs fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/60 p-4 duration-200 animate-in fade-in">
        <div className="relative w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            <AlertTriangle className="h-6 w-6" />
          </div>

          <div className="mt-4 text-center">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Batalkan Pengajuan Iklan?
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Pengajuan iklan{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                &ldquo;{ad.title}&rdquo;
              </span>{' '}
              akan ditarik dari antrean verifikasi dan dihapus. Anda dapat
              mengajukan iklan baru kapan saja.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={actionLoading === ad.id}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Kembali
            </button>
            <button
              type="button"
              disabled={actionLoading === ad.id}
              onClick={onConfirm}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-rose-700 active:scale-95 disabled:opacity-50"
            >
              {actionLoading === ad.id ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Membatalkan...</span>
                </>
              ) : (
                <span>Ya, Batalkan</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}

interface DeleteAdModalProps {
  ad: InternalAdItem | null
  onClose: () => void
  onConfirm: () => void
  actionLoading: string | null
}

export function DeleteAdModal({
  ad,
  onClose,
  onConfirm,
  actionLoading,
}: DeleteAdModalProps) {
  if (!ad) return null

  return (
    <ModalPortal>
      <div className="backdrop-blur-xs fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/60 p-4 duration-200 animate-in fade-in">
        <div className="relative w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            <Trash2 className="h-6 w-6" />
          </div>

          <div className="mt-4 text-center">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Hapus Iklan?
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Iklan{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                &ldquo;{ad.title}&rdquo;
              </span>{' '}
              {ad.store?.name ? `(${ad.store.name}) ` : ''}
              akan dihapus permanen dari sistem. Tindakan ini tidak dapat
              dibatalkan.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={actionLoading === ad.id}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={actionLoading === ad.id}
              onClick={onConfirm}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-rose-700 active:scale-95 disabled:opacity-50"
            >
              {actionLoading === ad.id ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menghapus...</span>
                </>
              ) : (
                <span>Ya, Hapus</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}

interface ApproveAdModalProps {
  ad: InternalAdItem | null
  level1Slot: Level1SlotInfo
  onClose: () => void
  onConfirm: () => void
  actionLoading: string | null
}

export function ApproveAdModal({
  ad,
  level1Slot,
  onClose,
  onConfirm,
  actionLoading,
}: ApproveAdModalProps) {
  if (!ad) return null

  const isLevel1Blocked =
    ad.placement === 'HOMEPAGE_HERO' &&
    level1Slot.isOccupied &&
    level1Slot.activeAd !== null &&
    level1Slot.activeAd.id !== ad.id

  return (
    <ModalPortal>
      <div className="backdrop-blur-xs fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/60 p-4 duration-200 animate-in fade-in">
        <div className="relative w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>

          <div className="mt-4 text-center">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Setujui Pengajuan Iklan?
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Iklan{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                &ldquo;{ad.title}&rdquo;
              </span>
              {ad.store?.name && (
                <>
                  {' '}
                  dari{' '}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {ad.store.name}
                  </span>
                </>
              )}{' '}
              akan disetujui dan langsung tayang aktif pada platform
              marketplace.
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-950/40">
            <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
              <span>Penempatan:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {ad.placement === 'HOMEPAGE_HERO'
                  ? 'Level 1: Hero Carousel Mobile (Eksklusif)'
                  : 'Level 2: In-Feed Grid Produk'}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-200/60 py-1 text-slate-600 dark:border-slate-800 dark:text-slate-400">
              <span>Durasi Aktif:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {calculateDurationText(
                  ad.startDate,
                  ad.endDate,
                  ad.placement === 'HOMEPAGE_HERO' ? 'LEVEL_1' : 'LEVEL_2'
                )}
              </span>
            </div>
          </div>

          {/* Warning if Level 1 slot is currently occupied by another ad */}
          {isLevel1Blocked && (
            <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <div>
                <p className="font-bold">Slot Level 1 Sedang Digunakan!</p>
                <p className="mt-1 text-[11px] leading-relaxed">
                  Slot Level 1 bersifat{' '}
                  <strong>
                    eksklusif (hanya 1 iklan yang boleh aktif pada satu waktu)
                  </strong>
                  . Saat ini slot sedang aktif oleh iklan{' '}
                  <strong>&ldquo;{level1Slot.activeAd?.title}&rdquo;</strong> (
                  {level1Slot.activeAd?.store?.name || 'Toko Lain'}) hingga{' '}
                  {level1Slot.activeAd?.endDate
                    ? new Date(level1Slot.activeAd.endDate).toLocaleDateString(
                        'id-ID',
                        {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        }
                      )
                    : 'selesai'}{' '}
                  ({level1Slot.activeAd?.remainingText}).
                </p>
                <p className="mt-1 text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                  Anda tidak dapat mengaktifkan 2 iklan Level 1 sekaligus.
                  Nonaktifkan iklan lama terlebih dahulu atau tunggu hingga masa
                  aktifnya berakhir.
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={actionLoading === ad.id}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={actionLoading === ad.id || isLevel1Blocked}
              onClick={onConfirm}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
            >
              {actionLoading === ad.id ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyetujui...</span>
                </>
              ) : isLevel1Blocked ? (
                <span>Slot Sedang Terisi</span>
              ) : (
                <span>Ya, Setujui &amp; Tayangkan</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}

interface DeactivateAdModalProps {
  ad: InternalAdItem | null
  onClose: () => void
  onConfirm: () => void
  actionLoading: string | null
}

export function DeactivateAdModal({
  ad,
  onClose,
  onConfirm,
  actionLoading,
}: DeactivateAdModalProps) {
  if (!ad) return null

  return (
    <ModalPortal>
      <div className="backdrop-blur-xs fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/60 p-4 duration-200 animate-in fade-in">
        <div className="relative w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <AlertTriangle className="h-6 w-6" />
          </div>

          <div className="mt-4 text-center">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Nonaktifkan Penayangan Iklan?
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Iklan{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                &ldquo;{ad.title}&rdquo;
              </span>{' '}
              akan disembunyikan sementara dari marketplace publik. Anda dapat
              mengaktifkannya kembali sewaktu-waktu.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={actionLoading === ad.id}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={actionLoading === ad.id}
              onClick={onConfirm}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-amber-700 active:scale-95 disabled:opacity-50"
            >
              {actionLoading === ad.id ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menonaktifkan...</span>
                </>
              ) : (
                <span>Ya, Nonaktifkan</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}
