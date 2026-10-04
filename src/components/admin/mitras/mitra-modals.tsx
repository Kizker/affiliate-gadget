'use client'

import React from 'react'
import {
  CheckCircle2,
  X,
  Check,
  Loader2,
  AlertTriangle,
  Trash2,
  UserPlus,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Plus,
} from 'lucide-react'
import { Mitra } from './types'

// 1. Approve Store Modal
export interface ApproveStoreModalProps {
  open: boolean
  mitra: Mitra | null
  isProcessingAction: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ApproveStoreModal({
  open,
  mitra,
  isProcessingAction,
  onClose,
  onConfirm,
}: ApproveStoreModalProps) {
  if (!open || !mitra) return null

  return (
    <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 duration-150 animate-in fade-in">
      <div className="w-full max-w-md space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl duration-150 animate-in zoom-in-95 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                Setujui Pendaftaran Toko
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {mitra.name || mitra.businessName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!isProcessingAction) {
                onClose()
              }
            }}
            className="text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2.5 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-xs dark:border-emerald-900/60 dark:bg-emerald-950/20">
          <p className="font-semibold text-emerald-900 dark:text-emerald-200">
            Persetujuan ini akan memproses langkah berikut:
          </p>
          <ul className="space-y-2 text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
                ✓
              </span>
              <span>
                Membuat entitas <strong>Store (Badan Usaha PT)</strong> resmi di
                sistem database.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
                ✓
              </span>
              <span>
                Menaikkan role akun pendaftar menjadi{' '}
                <strong>STORE_ADMIN</strong>.
              </span>
            </li>
          </ul>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessingAction}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessingAction}
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-sm shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {isProcessingAction ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>Setujui & Buat Toko</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// 2. Reject Store Modal
export interface RejectStoreModalProps {
  open: boolean
  mitra: Mitra | null
  rejectReason: string
  setRejectReason: (reason: string) => void
  isProcessingAction: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function RejectStoreModal({
  open,
  mitra,
  rejectReason,
  setRejectReason,
  isProcessingAction,
  onClose,
  onSubmit,
}: RejectStoreModalProps) {
  if (!open || !mitra) return null

  return (
    <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 duration-150 animate-in fade-in">
      <div className="w-full max-w-md space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl duration-150 animate-in zoom-in-95 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                Tolak Pengajuan Toko
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {mitra.name || mitra.businessName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Alasan Penolakan / Catatan Perbaikan{' '}
              <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Contoh: Mohon lengkapi alamat lengkap fisik cabang toko beserta nomor telepon resmi badan usaha."
              className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessingAction}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isProcessingAction || !rejectReason.trim()}
              className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-50"
            >
              {isProcessingAction ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <span>Kirim Penolakan</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 3. Delete Store Modal
export interface DeleteStoreModalProps {
  open: boolean
  deletingStore: { id: string; name: string } | null
  isProcessingAction: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteStoreModal({
  open,
  deletingStore,
  isProcessingAction,
  onClose,
  onConfirm,
}: DeleteStoreModalProps) {
  if (!open || !deletingStore) return null

  return (
    <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 duration-150 animate-in fade-in">
      <div className="w-full max-w-md space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl duration-150 animate-in zoom-in-95 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/50">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Hapus Cabang Toko?
              </h3>
              <p className="text-xs font-medium text-rose-500">
                Tindakan ini permanen
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!isProcessingAction) {
                onClose()
              }
            }}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          Apakah Anda yakin ingin menghapus cabang toko{' '}
          <strong className="font-bold text-slate-950 dark:text-white">
            {deletingStore.name}
          </strong>
          ? Seluruh data profil toko, rekening bank, dan jadwal operasional akan
          dihapus permanen dari sistem.
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessingAction}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessingAction}
            className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-sm shadow-rose-600/25 transition hover:bg-rose-700 disabled:opacity-50"
          >
            {isProcessingAction ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                <span>Ya, Hapus Toko</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// 4. Create Service Mitra Modal
export interface CreateServiceMitraModalProps {
  open: boolean
  username: string
  setUsername: (val: string) => void
  email: string
  setEmail: (val: string) => void
  password: string
  setPassword: (val: string) => void
  showPassword: boolean
  setShowPassword: (val: boolean) => void
  isCreating: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function CreateServiceMitraModal({
  open,
  username,
  setUsername,
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  isCreating,
  onClose,
  onSubmit,
}: CreateServiceMitraModalProps) {
  if (!open) return null

  return (
    <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 duration-150 animate-in fade-in">
      <div className="w-full max-w-md space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl duration-150 animate-in zoom-in-95 dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Tambah Akun Mitra Servis
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Buat akun login baru dengan role MITRA
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!isCreating) {
                onClose()
              }
            }}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Information Notice */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-3 text-[11px] text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300">
          Akun yang dibuat akan langsung memiliki role <strong>MITRA</strong>.
          Mitra dapat login mandiri untuk melengkapi profil bengkel dan tarif
          servis.
        </div>

        {/* Form: Username, Email, Password */}
        <form onSubmit={onSubmit} className="space-y-3.5">
          {/* 1. Username */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Username / Nama Mitra <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Contoh: Budi Servis Gadget"
                className="w-full rounded-xl border border-slate-200/80 bg-slate-50 py-2.5 pl-9 pr-3 text-xs font-medium text-slate-900 outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* 2. Email */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Alamat Email <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mitra@example.com"
                className="w-full rounded-xl border border-slate-200/80 bg-slate-50 py-2.5 pl-9 pr-3 text-xs font-medium text-slate-900 outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* 3. Password */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Password Akun <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full rounded-xl border border-slate-200/80 bg-slate-50 py-2.5 pl-9 pr-10 text-xs font-medium text-slate-900 outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              Kredensial ini akan digunakan mitra untuk login ke portal
              Affiliate Gadget.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-5 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition hover:bg-orange-600 disabled:opacity-50"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Buat Akun Mitra</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 5. Delete Service Mitra Modal
export interface DeleteServiceMitraModalProps {
  open: boolean
  deletingMitraUser: { id: string; name: string } | null
  isProcessingAction: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteServiceMitraModal({
  open,
  deletingMitraUser,
  isProcessingAction,
  onClose,
  onConfirm,
}: DeleteServiceMitraModalProps) {
  if (!open || !deletingMitraUser) return null

  return (
    <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 duration-150 animate-in fade-in">
      <div className="w-full max-w-md space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl duration-150 animate-in zoom-in-95 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/50">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Hapus Akun Mitra?
              </h3>
              <p className="text-xs font-medium text-rose-500">
                Tindakan ini permanen
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!isProcessingAction) {
                onClose()
              }
            }}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          Apakah Anda yakin ingin menghapus akun mitra{' '}
          <strong className="font-bold text-slate-950 dark:text-white">
            {deletingMitraUser.name}
          </strong>
          ? Seluruh data profil workshop dan riwayat servis terkait akan dihapus
          permanen dari sistem.
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessingAction}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessingAction}
            className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-sm shadow-rose-600/25 transition hover:bg-rose-700 disabled:opacity-50"
          >
            {isProcessingAction ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                <span>Ya, Hapus Mitra</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
