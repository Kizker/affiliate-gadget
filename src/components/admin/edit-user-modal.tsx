'use client'

import { useState, useEffect } from 'react'
import {
  X,
  Loader2,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Shield,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'

interface UserData {
  id: string
  name: string | null
  email: string
  role: string
  phone: string | null
  isActive: boolean
  mitraStatus: string | null
}

interface EditUserModalProps {
  isOpen: boolean
  user: UserData | null
  onClose: () => void
  onSuccess: () => void
}

export default function EditUserModal({
  isOpen,
  user,
  onClose,
  onSuccess,
}: EditUserModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    role: '',
    isActive: true,
    mitraStatus: '',
  })

  useEffect(() => {
    if (user) {
      setFormData({
        role: user.role,
        isActive: user.isActive,
        mitraStatus: user.mitraStatus || '',
      })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)

    try {
      const updateData: {
        role: string
        isActive: boolean
        mitraStatus?: string
      } = {
        role: formData.role,
        isActive: formData.isActive,
      }

      if (formData.role === 'MITRA' && formData.mitraStatus) {
        updateData.mitraStatus = formData.mitraStatus
      }

      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Gagal memperbarui akun pengguna')
      }

      toast.success('Akun pengguna berhasil diperbarui!')
      onSuccess()
      onClose()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Gagal memperbarui akun pengguna'
      )
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !user) return null

  const isSuperAdmin = user.role === 'SUPER_ADMIN'

  const roleOptions = [
    {
      value: 'CUSTOMER',
      label: 'Customer (Pembeli)',
      description: 'Akses belanja gadget, cek resi & klaim garansi 30 hari',
    },
    {
      value: 'STORE_ADMIN',
      label: 'Admin Toko (Cabang PT)',
      description: 'Kelola inventori unit fisik & pesanan cabang toko',
    },
    {
      value: 'ADMIN',
      label: 'Admin Platform (Pengelola)',
      description: 'Master katalog gadget, verifikasi toko & pusat komplain',
    },
    {
      value: 'SUPER_ADMIN',
      label: 'Superadmin (Akses Penuh)',
      description: 'Hak akses tertinggi ke seluruh aktivitas platform & omzet',
    },
  ]

  const initial = (user.name || user.email || 'U').charAt(0).toUpperCase()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md sm:max-w-lg rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header with Action Orange Accent */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-sm shadow-orange-500/25">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white">
                Edit Hak Akses & Status
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pengaturan hak akses dan izin operasional akun
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 text-xs">
          {/* User Profile Card */}
          <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-100/80 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 font-bold text-sm border border-orange-200/60 dark:border-orange-800/40 shadow-2xs">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-950 dark:text-white truncate">
                {user.name || 'Pengguna Tanpa Nama'}
              </p>
              <div className="mt-0.5 flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                <span className="truncate text-xs font-mono">{user.email}</span>
              </div>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold shrink-0 border ${
                formData.isActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400'
              }`}
            >
              {formData.isActive ? '● Aktif' : '● Nonaktif'}
            </span>
          </div>

          {isSuperAdmin ? (
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-4 dark:border-amber-900/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300">
              <div className="flex items-center gap-2 font-bold text-xs">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span>Akun Super Admin Terproteksi</span>
              </div>
              <p className="text-[11px] mt-1.5 text-amber-700/90 dark:text-amber-400 leading-relaxed">
                Hak akses akun Super Admin dilindungi oleh sistem keamanan platform dan tidak dapat diubah maupun dinonaktifkan.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Selector */}
              <div>
                <label className="mb-1.5 block font-semibold text-slate-700 dark:text-slate-300">
                  Peran & Hak Akses (Role) <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="w-full appearance-none rounded-xl border border-slate-200/80 bg-slate-50/70 dark:bg-slate-800 dark:border-slate-700 py-2.5 pl-9 pr-9 text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none transition focus:border-orange-500 focus:bg-white dark:focus:border-orange-400 cursor-pointer shadow-2xs"
                  >
                    {roleOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                  {roleOptions.find((r) => r.value === formData.role)?.description ||
                    'Pilih hak akses akun pengguna'}
                </p>
              </div>

              {/* Status Verification for Store */}
              {formData.role === 'MITRA' && (
                <div>
                  <label className="mb-1.5 block font-semibold text-slate-700 dark:text-slate-300">
                    Status Verifikasi Toko
                  </label>
                  <div className="relative">
                    <select
                      value={formData.mitraStatus}
                      onChange={(e) =>
                        setFormData({ ...formData, mitraStatus: e.target.value })
                      }
                      className="w-full appearance-none rounded-xl border border-slate-200/80 bg-slate-50/70 dark:bg-slate-800 dark:border-slate-700 py-2.5 px-3.5 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none transition focus:border-orange-500 focus:bg-white dark:focus:border-orange-400 cursor-pointer shadow-2xs"
                    >
                      <option value="">Pilih Status Verifikasi</option>
                      <option value="PENDING">Pending (Menunggu Review)</option>
                      <option value="APPROVED">Approved (Terverifikasi & Aktif)</option>
                      <option value="REJECTED">Rejected (Ditolak)</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Modern iOS/Linear Style Interactive Switch for Account Status */}
              <div className="pt-2">
                <div
                  onClick={() =>
                    setFormData({ ...formData, isActive: !formData.isActive })
                  }
                  className={`flex items-center justify-between p-4 rounded-2xl border transition cursor-pointer select-none ${
                    formData.isActive
                      ? 'border-emerald-200/80 bg-emerald-50/30 dark:border-emerald-800/40 dark:bg-emerald-950/20'
                      : 'border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-850'
                  }`}
                >
                  <div className="pr-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 dark:text-white text-xs">
                        {formData.isActive ? 'Status Akun Aktif' : 'Status Akun Dinonaktifkan'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {formData.isActive
                        ? 'Pengguna dapat masuk dan beraktivitas di platform secara normal.'
                        : 'Pengguna ditangguhkan dan tidak dapat masuk ke sistem.'}
                    </p>
                  </div>

                  {/* Sleek Toggle Switch */}
                  <div
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      formData.isActive
                        ? 'bg-orange-500'
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        formData.isActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-orange-500/25 active:scale-95 transition disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Perubahan</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
