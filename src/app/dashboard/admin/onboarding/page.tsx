'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Store,
  Building2,
  MapPin,
  Phone,
  CreditCard,
  Clock,
  CheckCircle2,
  Loader2,
  RotateCw,
  LogOut,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Mail,
  User,
  Lock,
} from 'lucide-react'
import { toast } from 'sonner'
import { LogoutConfirmModal } from '@/components/auth/logout-confirm-modal'

const INDONESIAN_BANKS = [
  'Bank Mandiri',
  'BCA (Bank Central Asia)',
  'BRI (Bank Rakyat Indonesia)',
  'BNI (Bank Negara Indonesia)',
  'BSI (Bank Syariah Indonesia)',
  'CIMB Niaga',
  'Bank Permata',
  'Bank Danamon',
]

export default function StoreAdminOnboardingPage() {
  const { data: session, status, update: updateSession } = useSession()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [isChecking, setIsChecking] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const [userData, setUserData] = useState<{
    id: string
    name: string | null
    email: string
    phone: string | null
    role: string
    isActive: boolean
    mitraStatus: string | null
    storeId: string | null
  } | null>(null)

  const [hasStore, setHasStore] = useState(false)
  const prevActiveRef = useRef<boolean | null>(null)

  const [form, setForm] = useState({
    name: '',
    companyName: '',
    taxId: '',
    tagline: '',
    description: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    latitude: '',
    longitude: '',
    phone: '',
    whatsapp: '',
    email: '',
    bankName: 'Bank Mandiri',
    accountNumber: '',
    accountName: '',
    weekdayOpen: '09:00',
    weekdayClose: '21:00',
    weekendOpen: '10:00',
    weekendClose: '20:00',
    weekendClosed: false,
  })

  const fetchOnboardingStatus = useCallback(async (isManual = false) => {
    if (isManual) setIsChecking(true)
    try {
      const res = await fetch('/api/admin/onboarding?_t=' + Date.now(), {
        cache: 'no-store',
      })
      if (!res.ok) {
        if (isManual) toast.error('Gagal memeriksa status akun.')
        return
      }
      const data = await res.json()
      if (data.success && data.user) {
        // Detect transition from inactive to active
        if (
          prevActiveRef.current === false &&
          data.user.isActive === true &&
          !data.hasStore
        ) {
          toast.success(
            'Akun Anda telah diaktifkan oleh Superadmin! Silakan lengkapi profil toko Anda.'
          )
        }
        prevActiveRef.current = data.user.isActive
        setUserData(data.user)
        setHasStore(data.hasStore)

        // Pre-fill contact info if empty
        setForm((prev) => ({
          ...prev,
          phone: prev.phone || data.user.phone || '',
          whatsapp: prev.whatsapp || data.user.phone || '',
          email: prev.email || data.user.email || '',
        }))

        if (data.hasStore && data.user.isActive) {
          toast.success('Toko Anda sudah aktif! Mengalihkan ke Dashboard...')
          window.location.href = '/dashboard/admin'
          return
        }

        if (isManual) {
          if (!data.user.isActive) {
            toast.info(
              'Status saat ini: Masih menunggu aktivasi dari Superadmin.'
            )
          } else {
            toast.success(
              'Akun sudah aktif! Silakan isi formulir pendaftaran toko di bawah.'
            )
          }
        }
      }
    } catch (err) {
      console.error('Error fetching onboarding status:', err)
    } finally {
      setLoading(false)
      if (isManual) setIsChecking(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login')
      return
    }
    if (status === 'authenticated') {
      fetchOnboardingStatus(false)
    }
  }, [status, router, fetchOnboardingStatus])

  // Poll every 4 seconds while waiting for Superadmin activation
  useEffect(() => {
    if (!userData || userData.isActive) return
    const interval = setInterval(() => {
      fetchOnboardingStatus(false)
    }, 4000)
    return () => clearInterval(interval)
  }, [userData, fetchOnboardingStatus])

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      toast.error('Browser Anda tidak mendukung fitur geolokasi GPS.')
      return
    }
    toast.info('Mendeteksi titik koordinat lokasi Anda...')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setForm((prev) => ({
          ...prev,
          latitude: lat.toFixed(6),
          longitude: lng.toFixed(6),
        }))
        try {
          const revRes = await fetch(`/api/geo/reverse?lat=${lat}&lng=${lng}`)
          const revData = await revRes.json()
          if (revRes.ok && revData) {
            setForm((prev) => ({
              ...prev,
              address:
                revData.fullAddress || revData.displayName || prev.address,
              city: revData.city || prev.city,
              province: revData.province || prev.province,
              postalCode: revData.postalCode || prev.postalCode,
            }))
            toast.success('Titik GPS & alamat berhasil terdeteksi!')
          } else {
            toast.success('Koordinat GPS berhasil disimpan!')
          }
        } catch {
          toast.success('Koordinat GPS berhasil disimpan!')
        }
      },
      () => {
        toast.error('Gagal mengakses GPS. Pastikan izin lokasi diaktifkan.')
      }
    )
  }

  const handleSubmitStore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    if (form.name.trim().length < 3) {
      toast.error('Nama toko cabang minimal 3 karakter.')
      return
    }
    if (form.companyName.trim().length < 3) {
      toast.error('Nama Badan Usaha (PT / CV) minimal 3 karakter.')
      return
    }
    if (form.address.trim().length < 10) {
      toast.error('Alamat lengkap fisik toko minimal 10 karakter.')
      return
    }
    if (!form.city.trim() || !form.province.trim()) {
      toast.error('Kota dan Provinsi wajib diisi.')
      return
    }
    if (form.phone.trim().length < 8) {
      toast.error('Nomor telepon toko wajib diisi.')
      return
    }
    if (!form.accountNumber.trim() || !form.accountName.trim()) {
      toast.error('Nomor rekening dan nama pemilik rekening wajib diisi.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/admin/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Gagal menyimpan pendaftaran toko.')
        setIsSubmitting(false)
        return
      }

      toast.success(
        'Pendaftaran toko berhasil! Mengalihkan ke Dashboard Toko...'
      )
      if (updateSession) {
        await updateSession()
      }
      setTimeout(() => {
        window.location.href = '/dashboard/admin'
      }, 600)
    } catch (err) {
      console.error('Submit store onboarding error:', err)
      toast.error('Terjadi kesalahan jaringan. Silakan coba lagi.')
      setIsSubmitting(false)
    }
  }

  if (loading || status === 'loading') {
    return (
      <div className="flex min-h-[75vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-xs font-semibold text-slate-500">
            Memuat status pendaftaran toko...
          </p>
        </div>
      </div>
    )
  }

  const isAccountActive = !!userData?.isActive

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Top Progress Stepper */}
      <div className="shadow-2xs mb-6 rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-[11px] font-bold text-orange-600 dark:bg-orange-950/50 dark:text-orange-400">
              <Store className="h-3.5 w-3.5" />
              Onboarding Cabang Toko Resmi
            </span>
            <h1 className="mt-2 text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl">
              {!isAccountActive
                ? 'Menunggu Aktivasi Akun oleh Superadmin'
                : 'Lengkapi Profil & Pendaftaran Toko Cabang'}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="inline-flex items-center gap-1.5 self-start rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Keluar</span>
          </button>
        </div>

        {/* 3-Step Horizontal Indicator */}
        <div className="mt-6 grid grid-cols-1 gap-3 border-t border-slate-100 pt-5 dark:border-slate-800 sm:grid-cols-3">
          {/* Step 1 */}
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-50/70 p-3 dark:bg-emerald-950/20">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Tahap 1 • Selesai
              </p>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Registrasi Akun Toko
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div
            className={`flex items-center gap-3 rounded-2xl p-3 ${
              isAccountActive
                ? 'bg-emerald-50/70 dark:bg-emerald-950/20'
                : 'border border-amber-200/80 bg-amber-50/80 dark:border-amber-800/40 dark:bg-amber-950/20'
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                isAccountActive
                  ? 'bg-emerald-500 text-white'
                  : 'bg-amber-500 text-white'
              }`}
            >
              {isAccountActive ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4 animate-pulse" />
              )}
            </div>
            <div>
              <p
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  isAccountActive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-700 dark:text-amber-400'
                }`}
              >
                {isAccountActive
                  ? 'Tahap 2 • Disetujui'
                  : 'Tahap 2 • Menunggu ACC'}
              </p>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Aktivasi Superadmin
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div
            className={`flex items-center gap-3 rounded-2xl p-3 ${
              isAccountActive
                ? 'border border-orange-200 bg-orange-50/70 dark:border-orange-800/40 dark:bg-orange-950/20'
                : 'bg-slate-100/70 opacity-60 dark:bg-slate-800/40'
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                isAccountActive
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-300 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
              }`}
            >
              {isAccountActive ? (
                <Store className="h-4 w-4" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
            </div>
            <div>
              <p
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  isAccountActive
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-slate-500'
                }`}
              >
                {isAccountActive ? 'Tahap 3 • Aktif' : 'Tahap 3 • Terkunci'}
              </p>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Input Data & Nama Toko
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* STATE 1: WAITING FOR SUPERADMIN ACTIVATION */}
      {!isAccountActive ? (
        <div className="shadow-2xs rounded-3xl border border-slate-200/80 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900 sm:p-10">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 text-amber-500 dark:bg-amber-950/40">
            <Clock className="h-8 w-8 animate-pulse" />
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
            <span className="h-2 w-2 animate-ping rounded-full bg-amber-500" />
            Status Akun: Tidak Aktif (Menunggu Persetujuan Superadmin)
          </span>

          <h2 className="mt-4 text-lg font-black text-slate-950 dark:text-white sm:text-xl">
            Pendaftaran Akun Admin Toko Anda Sedang Ditinjau
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-slate-500 dark:text-slate-400 sm:text-sm">
            Sesuai prosedur keamanan platform, akun Admin Toko yang baru
            didaftarkan berada dalam status nonaktif hingga diverifikasi dan
            diaktifkan oleh <strong>Superadmin</strong>. Setelah akun Anda
            diaktifkan, halaman ini akan otomatis menampilkan formulir pengisian
            nama toko dan profil cabang Anda.
          </p>

          {/* Registered Account Info Box */}
          <div className="mx-auto mt-6 max-w-md rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 text-left dark:border-slate-800 dark:bg-slate-800/40">
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Identitas Pendaftar
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <User className="h-3.5 w-3.5" /> Nama Admin:
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {userData?.name || '-'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Mail className="h-3.5 w-3.5" /> Email:
                </span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {userData?.email || '-'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Phone className="h-3.5 w-3.5" /> No. Telepon:
                </span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {userData?.phone || '-'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fetchOnboardingStatus(true)}
              disabled={isChecking}
              className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-2.5 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition hover:bg-orange-600 active:scale-95 disabled:opacity-60"
            >
              <RotateCw
                className={`h-3.5 w-3.5 ${isChecking ? 'animate-spin' : ''}`}
              />
              <span>
                {isChecking
                  ? 'Memeriksa Status...'
                  : 'Cek Status Persetujuan Sekarang'}
              </span>
            </button>
          </div>
        </div>
      ) : (
        /* STATE 2: ACCOUNT ACTIVATED -> FILL STORE CREATION FORM */
        <form onSubmit={handleSubmitStore} className="space-y-6">
          {/* Banner Selamat Akun Aktif */}
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-800/50 dark:bg-emerald-950/30">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div className="text-xs leading-relaxed text-emerald-900 dark:text-emerald-200">
              <p className="font-bold">
                Akun Admin Toko Anda Telah Diaktifkan oleh Superadmin!
              </p>
              <p className="mt-0.5 opacity-90">
                Silakan lengkapi nama toko, identitas badan usaha PT/CV, alamat
                fisik, dan rekening pencairan di bawah ini untuk mengaktifkan
                operasional cabang toko Anda.
              </p>
            </div>
          </div>

          {/* Card 1: Identitas Toko & Badan Usaha */}
          <div className="shadow-2xs rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400">
                <Store className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-950 dark:text-white">
                  1. Identitas Toko & Badan Usaha PT / CV
                </h2>
                <p className="text-[11px] text-slate-500">
                  Nama toko yang tampil di katalog publik & legalitas perusahaan
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nama Toko Cabang <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: Affiliate Gadget - Roxy Mas"
                  className="w-full rounded-xl border border-slate-200/90 bg-slate-50/60 px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nama Badan Usaha (PT / CV){' '}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.companyName}
                  onChange={(e) =>
                    setForm({ ...form, companyName: e.target.value })
                  }
                  placeholder="Contoh: PT Gadget Jaya Sentosa"
                  className="w-full rounded-xl border border-slate-200/90 bg-slate-50/60 px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nomor NPWP Badan Usaha (Opsional)
                </label>
                <input
                  type="text"
                  value={form.taxId}
                  onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                  placeholder="Contoh: 01.234.567.8-012.000"
                  className="w-full rounded-xl border border-slate-200/90 bg-slate-50/60 px-3.5 py-2.5 font-mono text-xs font-medium text-slate-900 outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Slogan / Tagline Toko
                </label>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={(e) =>
                    setForm({ ...form, tagline: e.target.value })
                  }
                  placeholder="Contoh: Pusat Smartphone Second Bergaransi Resmi"
                  className="w-full rounded-xl border border-slate-200/90 bg-slate-50/60 px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Deskripsi Singkat Toko
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Jelaskan keunggulan cabang toko fisik Anda..."
                  className="w-full rounded-xl border border-slate-200/90 bg-slate-50/60 px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Alamat Fisik & Lokasi Toko */}
          <div className="shadow-2xs rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-950 dark:text-white">
                    2. Alamat Fisik & Titik Logistik Kurir
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Digunakan untuk penjemputan kurir JNE / Gojek Instant & arah
                    Google Maps
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDetectGps}
                className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/70 px-3 py-1.5 text-[11px] font-bold text-blue-700 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>Deteksi GPS Saat Ini</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-3">
                <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Alamat Lengkap Toko Fisik{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  placeholder="Nama Gedung/Mall, Lantai, Nomor Ruko, Jalan, Kelurahan, Kecamatan..."
                  className="w-full rounded-xl border border-slate-200/90 bg-slate-50/60 px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Provinsi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.province}
                  onChange={(e) =>
                    setForm({ ...form, province: e.target.value })
                  }
                  placeholder="Contoh: DKI Jakarta"
                  className="w-full rounded-xl border border-slate-200/90 bg-slate-50/60 px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Kota / Kabupaten <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Contoh: Jakarta Pusat"
                  className="w-full rounded-xl border border-slate-200/90 bg-slate-50/60 px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Kode Pos
                </label>
                <input
                  type="text"
                  value={form.postalCode}
                  onChange={(e) =>
                    setForm({ ...form, postalCode: e.target.value })
                  }
                  placeholder="Contoh: 10150"
                  className="w-full rounded-xl border border-slate-200/90 bg-slate-50/60 px-3.5 py-2.5 font-mono text-xs font-medium text-slate-900 outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Kontak & Jam Operasional */}
          <div className="shadow-2xs rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-950 dark:text-white">
                  3. Kontak & Jam Operasional Toko
                </h2>
                <p className="text-[11px] text-slate-500">
                  Nomor telepon CS cabang & jam buka layanan toko fisik
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nomor Telepon Toko <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Contoh: 081288997701"
                  className="w-full rounded-xl border border-slate-200/90 bg-slate-50/60 px-3.5 py-2.5 font-mono text-xs font-medium text-slate-900 outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nomor WhatsApp Sales
                </label>
                <input
                  type="text"
                  value={form.whatsapp}
                  onChange={(e) =>
                    setForm({ ...form, whatsapp: e.target.value })
                  }
                  placeholder="Contoh: 6281288997701"
                  className="w-full rounded-xl border border-slate-200/90 bg-slate-50/60 px-3.5 py-2.5 font-mono text-xs font-medium text-slate-900 outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Email Cabang Toko
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="toko@email.com"
                  className="w-full rounded-xl border border-slate-200/90 bg-slate-50/60 px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="sm:col-span-3">
                <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                      Jam Buka Senin - Sabtu
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={form.weekdayOpen}
                        onChange={(e) =>
                          setForm({ ...form, weekdayOpen: e.target.value })
                        }
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900"
                      />
                      <span className="text-xs text-slate-400">s/d</span>
                      <input
                        type="time"
                        value={form.weekdayClose}
                        onChange={(e) =>
                          setForm({ ...form, weekdayClose: e.target.value })
                        }
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Jam Buka Minggu
                      </p>
                      <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                        <input
                          type="checkbox"
                          checked={form.weekendClosed}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              weekendClosed: e.target.checked,
                            })
                          }
                          className="rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                        />
                        <span>Tutup di Hari Minggu</span>
                      </label>
                    </div>
                    {!form.weekendClosed ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={form.weekendOpen}
                          onChange={(e) =>
                            setForm({ ...form, weekendOpen: e.target.value })
                          }
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900"
                        />
                        <span className="text-xs text-slate-400">s/d</span>
                        <input
                          type="time"
                          value={form.weekendClose}
                          onChange={(e) =>
                            setForm({ ...form, weekendClose: e.target.value })
                          }
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900"
                        />
                      </div>
                    ) : (
                      <p className="py-1.5 text-xs font-semibold text-rose-500">
                        Libur / Tutup Operasional
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Rekening Bank Pencairan Omzet PT */}
          <div className="shadow-2xs rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-950 dark:text-white">
                  4. Rekening Bank Pencairan Omzet PT
                </h2>
                <p className="text-[11px] text-slate-500">
                  Digunakan untuk penarikan saldo hasil penjualan toko cabang
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nama Bank <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.bankName}
                  onChange={(e) =>
                    setForm({ ...form, bankName: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200/90 bg-slate-50/60 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {INDONESIAN_BANKS.map((bank) => (
                    <option key={bank} value={bank}>
                      {bank}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nomor Rekening <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.accountNumber}
                  onChange={(e) =>
                    setForm({ ...form, accountNumber: e.target.value })
                  }
                  placeholder="Contoh: 1230009876543"
                  className="w-full rounded-xl border border-slate-200/90 bg-slate-50/60 px-3.5 py-2.5 font-mono text-xs font-medium text-slate-900 outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Atas Nama Pemilik Rekening{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.accountName}
                  onChange={(e) =>
                    setForm({ ...form, accountName: e.target.value })
                  }
                  placeholder="Contoh: PT Gadget Jaya Sentosa"
                  className="w-full rounded-xl border border-slate-200/90 bg-slate-50/60 px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Submit Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-7 py-3.5 text-xs font-bold text-white shadow-md shadow-orange-500/25 transition hover:bg-orange-600 active:scale-95 disabled:opacity-60 sm:text-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan & Mengaktifkan Toko...</span>
                </>
              ) : (
                <>
                  <span>Simpan & Aktifkan Toko Sekarang</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => signOut({ callbackUrl: '/login' })}
      />
    </div>
  )
}
