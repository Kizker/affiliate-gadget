'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import {
  User,
  Mail,
  Phone,
  Lock,
  ShieldCheck,
  Camera,
  Loader2,
  Save,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
  Building2,
  Headphones,
} from 'lucide-react'
import {
  validateAndCompressImage,
  processMediaUploadFile,
} from '@/lib/media-upload-client'

export default function AfterSalesSettingsPage() {
  const { data: session, update: updateSession } = useSession()

  const [activeTab, setActiveTab] = useState<'PROFILE' | 'SECURITY'>('PROFILE')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Show/Hide password toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Form State
  const [form, setForm] = useState({
    name: '',
    phone: '',
    image: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Metadata Toko / Grup Binaan
  const [afterSalesMeta, setAfterSalesMeta] = useState<{
    groupName?: string
    stores?: Array<{ id: string; name: string; city?: string | null }>
  }>({})

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/profile')
      if (res.ok) {
        const data = await res.json()
        const user = data.user
        setForm((prev) => ({
          ...prev,
          name: user.name || '',
          phone: user.phone || '',
          image: user.image || '',
          email: user.email || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }))
      }

      // Fetch After Sales dashboard data to display assigned store group
      const asRes = await fetch('/api/after-sales/dashboard')
      if (asRes.ok) {
        const asData = await asRes.json()
        setAfterSalesMeta({
          groupName: asData.group?.name || 'Grup Toko Terpusat',
          stores: asData.group?.stores || asData.managedStores || [],
        })
      }
    } catch (err) {
      console.error('Failed to fetch after sales profile:', err)
      toast.error('Gagal memuat profil after sales')
    } finally {
      setLoading(false)
    }
  }

  // Handle Avatar Upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingAvatar(true)
    try {
      const processed = await processMediaUploadFile(file)
      const formData = new FormData()
      formData.append('file', processed)
      formData.append('type', 'avatars')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal mengupload avatar')

      const newImageUrl = data.url
      setForm((prev) => ({ ...prev, image: newImageUrl }))

      // Save directly to profile
      await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: newImageUrl }),
      })

      await updateSession()
      toast.success('Foto profil berhasil diperbarui!')
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Gagal mengupload foto profil'
      toast.error(msg)
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  // Handle Save Profile & Password
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name.trim()) {
      toast.error('Nama lengkap tidak boleh kosong')
      return
    }

    if (activeTab === 'SECURITY' || form.newPassword) {
      if (!form.currentPassword) {
        toast.error('Password saat ini wajib diisi untuk mengubah password')
        return
      }
      if (form.newPassword.length < 8) {
        toast.error('Password baru minimal 8 karakter')
        return
      }
      if (form.newPassword !== form.confirmPassword) {
        toast.error('Konfirmasi password baru tidak cocok')
        return
      }
    }

    setSaving(true)
    try {
      const payload: Record<string, any> = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        image: form.image,
      }

      if (form.newPassword) {
        payload.currentPassword = form.currentPassword
        payload.newPassword = form.newPassword
      }

      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan profil')
      }

      await updateSession()
      toast.success('Profil After Sales berhasil diperbarui!')

      // Clear password fields on success
      setForm((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }))
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Gagal menyimpan perubahan'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          <span className="text-xs">Memuat pengaturan akun after sales...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      {/* ─── Header & Top Action Bar ────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-[11px] font-bold text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300">
              <Headphones className="h-3 w-3" />
              Layanan Purna Jual
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              Role: AFTER_SALES
            </span>
          </div>
          <h1 className="mt-1 text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Pengaturan Akun After Sales
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kelola identitas penanggung jawab purna jual, foto profil, dan kata
            sandi akun
          </p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-2.5 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition hover:bg-orange-600 active:scale-95 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>Simpan Perubahan</span>
        </button>
      </div>

      {/* ─── Tab Switcher Pill ──────────────────────────────────────────────── */}
      <div className="shadow-2xs flex w-fit items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white p-1.5 dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setActiveTab('PROFILE')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'PROFILE'
              ? 'shadow-xs bg-orange-500 text-white'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <User className="h-3.5 w-3.5" />
          <span>Profil Pengelola</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('SECURITY')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'SECURITY'
              ? 'shadow-xs bg-orange-500 text-white'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <KeyRound className="h-3.5 w-3.5" />
          <span>Keamanan &amp; Kata Sandi</span>
        </button>
      </div>

      {/* ─── Content Grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Kolom Kiri: Form Input (2 Kolom) */}
        <div className="space-y-6 lg:col-span-2">
          {activeTab === 'PROFILE' ? (
            /* TAB 1: PROFIL PENGELOLA */
            <div className="shadow-2xs rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Biodata &amp; Kontak Resmi
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Nama dan kontak yang ditampilkan ke pembeli pada chat
                      purna jual
                    </p>
                  </div>
                </div>
              </div>

              {/* Avatar Upload Banner */}
              <div className="mb-6 flex flex-col items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40 sm:flex-row">
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-2 border-white bg-slate-200 shadow-md dark:border-slate-700 dark:bg-slate-700">
                    {form.image ? (
                      <img
                        src={form.image}
                        alt="Foto Profil"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-slate-400" />
                    )}
                  </div>
                  {uploadingAvatar && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 text-white">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Foto Profil Penanggung Jawab
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Format JPG atau PNG (Maks 2MB, auto-kompres)
                  </p>
                  <label className="shadow-2xs mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <Camera className="h-3.5 w-3.5 text-orange-500" />
                    <span>Ganti Foto</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      className="hidden"
                      onChange={handleAvatarChange}
                      disabled={uploadingAvatar}
                    />
                  </label>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nama Lengkap Penanggung Jawab{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="Contoh: Budi Santoso"
                      className="h-10 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3.5 text-xs font-medium outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Email Akun Resmi (Login)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      disabled
                      value={form.email}
                      className="h-10 w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100/80 pl-10 pr-3.5 text-xs font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Email login dikelola dan diverifikasi oleh Superadmin
                    Platform.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nomor WhatsApp / Hotline CS
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                      placeholder="Contoh: 081234567890"
                      className="h-10 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3.5 text-xs font-medium outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              </form>
            </div>
          ) : (
            /* TAB 2: KEAMANAN & PASSWORD */
            <div className="shadow-2xs rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Ubah Kata Sandi
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Pastikan akun Anda terlindungi dengan password yang kuat
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Password Saat Ini <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={form.currentPassword}
                      onChange={(e) =>
                        setForm({ ...form, currentPassword: e.target.value })
                      }
                      placeholder="Masukkan password saat ini"
                      className="h-10 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-10 text-xs font-medium outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Password Baru <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={form.newPassword}
                        onChange={(e) =>
                          setForm({ ...form, newPassword: e.target.value })
                        }
                        placeholder="Minimal 8 karakter"
                        className="h-10 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-10 text-xs font-medium outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Konfirmasi Password Baru{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={form.confirmPassword}
                        onChange={(e) =>
                          setForm({ ...form, confirmPassword: e.target.value })
                        }
                        placeholder="Ulangi password baru"
                        className="h-10 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-10 text-xs font-medium outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                  <p>
                    🔒 Gunakan kombinasi huruf besar, huruf kecil, angka, dan
                    simbol untuk keamanan maksimal akun penanggung jawab purna
                    jual.
                  </p>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Kolom Kanan: Kartu Status Wewenang & Grup Binaan (1 Kolom) */}
        <div className="space-y-6">
          <div className="shadow-2xs rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Cakupan Penugasan Purna Jual
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Grup cabang toko yang Anda kelola
            </p>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-orange-200/80 bg-orange-50/50 p-3.5 dark:border-orange-900/40 dark:bg-orange-950/20">
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                  Grup Binaan Aktif
                </span>
                <p className="mt-0.5 text-sm font-black text-slate-900 dark:text-white">
                  {afterSalesMeta.groupName || 'Grup Toko Terpusat'}
                </p>
              </div>

              {afterSalesMeta.stores && afterSalesMeta.stores.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Cabang Terhubung ({afterSalesMeta.stores.length}):
                  </span>
                  <div className="space-y-1.5">
                    {afterSalesMeta.stores.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300"
                      >
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-semibold">{s.name}</span>
                        {s.city && (
                          <span className="text-[10px] text-slate-400">
                            • {s.city}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Wewenang Operasional:
                </span>
                <ul className="space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    <span>
                      Live Chat Purna Jual &amp; Konsultasi Pesanan Selesai
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    <span>
                      Penelaahan Bukti Retur &amp; Rekomendasi Solusi ke
                      Superadmin
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    <span>
                      Konfirmasi Kedatangan Paket Fisik &amp; Hasil Uji QC
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    <span>
                      Penerbitan Resi Unit Pengganti Baru / Rekomendasi Refund
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
