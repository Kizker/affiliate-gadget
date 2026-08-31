'use client'

import { useState } from 'react'
import {
  X,
  Loader2,
  UserPlus,
  Shield,
  Mail,
  Lock,
  Phone,
  User,
  ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'

interface CreateUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateUserModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateUserModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'CUSTOMER',
  })

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Gagal membuat akun pengguna')
      }

      toast.success('Akun pengguna berhasil dibuat!')
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'CUSTOMER',
      })
      onSuccess()
      onClose()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Gagal membuat akun pengguna'
      )
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md sm:max-w-lg rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header with Action Orange Accent */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-sm shadow-orange-500/25">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white">
                Tambah Akun Pengguna
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Buat akun baru dengan hak akses yang ditentukan
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          <div>
            <label className="mb-1.5 block font-semibold text-slate-700 dark:text-slate-300">
              Nama Lengkap <span className="text-orange-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200/80 bg-slate-50/70 dark:bg-slate-800 dark:border-slate-700 py-2.5 pl-9 pr-3.5 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition focus:border-orange-500 focus:bg-white dark:focus:border-orange-400 shadow-2xs"
                placeholder="cth. Andi Wijaya"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block font-semibold text-slate-700 dark:text-slate-300">
              Alamat Email <span className="text-orange-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200/80 bg-slate-50/70 dark:bg-slate-800 dark:border-slate-700 py-2.5 pl-9 pr-3.5 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition focus:border-orange-500 focus:bg-white dark:focus:border-orange-400 shadow-2xs"
                placeholder="cth. andi@affiliategadget.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="mb-1.5 block font-semibold text-slate-700 dark:text-slate-300">
                Password <span className="text-orange-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200/80 bg-slate-50/70 dark:bg-slate-800 dark:border-slate-700 py-2.5 pl-9 pr-3.5 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition focus:border-orange-500 focus:bg-white dark:focus:border-orange-400 shadow-2xs"
                  placeholder="Min. 8 karakter"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block font-semibold text-slate-700 dark:text-slate-300">
                Nomor Telepon / WA
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200/80 bg-slate-50/70 dark:bg-slate-800 dark:border-slate-700 py-2.5 pl-9 pr-3.5 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition focus:border-orange-500 focus:bg-white dark:focus:border-orange-400 shadow-2xs"
                  placeholder="081234567890"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block font-semibold text-slate-700 dark:text-slate-300">
              Peran & Hak Akses (Role) <span className="text-orange-500">*</span>
            </label>
            <div className="relative">
              <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <select
                required
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
                <span>Buat Akun</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
