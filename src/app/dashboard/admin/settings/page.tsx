'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  User,
  Phone,
  Mail,
  Upload,
  Loader2,
  Save,
  Lock,
  Building2,
  CreditCard,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Store,
  Landmark,
  CheckCircle2,
  KeyRound,
  Sparkles,
  Smartphone,
  Layers,
  Settings as SettingsIcon,
  ShieldAlert,
} from 'lucide-react'

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'STORE' | 'ADMIN' | 'SECURITY'>('ADMIN')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userRole, setUserRole] = useState('')

  // User Profile Form State
  const [userForm, setUserForm] = useState({
    name: '',
    phone: '',
    image: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Store Profile Form State (hanya untuk role STORE_ADMIN)
  const [storeForm, setStoreForm] = useState({
    storeName: '',
    companyName: '',
    taxId: '',
    address: '',
    city: 'Jakarta Pusat',
    province: 'DKI Jakarta',
    postalCode: '',
    phone: '',
    whatsapp: '',
    bankName: 'Bank Mandiri',
    accountNumber: '',
    accountName: '',
  })

  const isStoreAdmin = userRole === 'STORE_ADMIN'
  const isSuperAdmin = userRole === 'SUPER_ADMIN'
  const isAdminPlatform = userRole === 'ADMIN'

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/admin/profile')
      if (res.ok) {
        const data = await res.json()
        const user = data.user
        const store = data.store

        const role = user.role || 'ADMIN'
        setUserRole(role)

        // Set default tab based on role
        if (role === 'STORE_ADMIN') {
          setActiveTab('STORE')
        } else {
          setActiveTab('ADMIN')
        }

        setUserForm({
          name: user.name || '',
          phone: user.phone || '',
          image: user.image || '',
          email: user.email || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })

        if (store) {
          const primaryBank = (store.bankAccounts && store.bankAccounts[0]) || {
            bankName: 'Bank Mandiri',
            accountNumber: '',
            accountName: store.companyName || '',
          }

          setStoreForm({
            storeName: store.name || '',
            companyName: store.companyName || '',
            taxId: store.taxId || '',
            address: store.address || '',
            city: store.city || 'Jakarta Pusat',
            province: store.province || 'DKI Jakarta',
            postalCode: store.postalCode || '',
            phone: store.phone || '',
            whatsapp: store.whatsapp || '',
            bankName: primaryBank.bankName || 'Bank Mandiri',
            accountNumber: primaryBank.accountNumber || '',
            accountName: primaryBank.accountName || '',
          })
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Gagal memuat informasi profil')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    // Validate password fields if filled
    if (userForm.newPassword) {
      if (!userForm.currentPassword) {
        toast.error('Masukkan password saat ini untuk ganti password')
        return
      }
      if (userForm.newPassword.length < 6) {
        toast.error('Password baru minimal 6 karakter')
        return
      }
      if (userForm.newPassword !== userForm.confirmPassword) {
        toast.error('Konfirmasi password tidak cocok')
        return
      }
    }

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        name: userForm.name,
        phone: userForm.phone,
        image: userForm.image,
        email: userForm.email,
        currentPassword: userForm.currentPassword || undefined,
        newPassword: userForm.newPassword || undefined,
      }

      // Hanya sertakan data toko jika role STORE_ADMIN
      if (isStoreAdmin) {
        payload.storeData = storeForm
      }

      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(
          isStoreAdmin
            ? 'Pengaturan profil & toko berhasil disimpan!'
            : 'Pengaturan akun & keamanan berhasil disimpan!'
        )
        setUserForm((prev) => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }))
        fetchProfile()
      } else {
        toast.error(data.error || 'Gagal menyimpan perubahan')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Terjadi kesalahan saat menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Hanya file gambar yang diperbolehkan')
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        setUserForm((prev) => ({ ...prev, image: data.url }))
        toast.success('Foto profil berhasil diunggah')
      } else {
        toast.error('Gagal mengunggah foto')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Terjadi kesalahan saat upload')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-16 pt-1" suppressHydrationWarning>
      {/* ========================================================================= */}
      {/* 1. TOP CONTROL PANEL (Role-Adaptive Switcher & Save Button)               */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-2.5 sm:p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Left: Section Badge / Single Tab for Platform Admin */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl dark:bg-slate-800/80">
          {isStoreAdmin ? (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('STORE')}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 ${
                  activeTab === 'STORE'
                    ? 'bg-white text-slate-950 shadow-xs dark:bg-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Store className="h-3.5 w-3.5 text-orange-500" />
                <span>Profil Toko & PT Cabang</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ADMIN')}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 ${
                  activeTab === 'ADMIN'
                    ? 'bg-white text-slate-950 shadow-xs dark:bg-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <User className="h-3.5 w-3.5 text-orange-500" />
                <span>Akun Pengelola</span>
              </button>
            </>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-slate-900 px-4 py-2 text-xs font-bold text-slate-950 dark:text-white shadow-2xs">
              <User className="h-3.5 w-3.5 text-orange-500" />
              <span>Profil Akun</span>
            </div>
          )}
        </div>

        {/* Right: Save CTA Button (Action Orange Pill) */}
        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition-all hover:bg-orange-600 active:scale-95 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5 stroke-[2.5]" />
          )}
          <span>Simpan Perubahan</span>
        </button>
      </div>

      <form onSubmit={(e) => handleSave(e)} className="space-y-5">
        {/* ========================================================================= */}
        {/* VIEW 1: STORE ADMIN ONLY (Profil Toko Cabang & Legalitas PT)              */}
        {/* ========================================================================= */}
        {isStoreAdmin && activeTab === 'STORE' && (
          <div className="space-y-5">
            {/* Store Hero Summary Bento Card */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100/80 text-orange-700 font-bold text-xl border border-orange-200/60 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800/40 shrink-0 shadow-2xs">
                    {(storeForm.storeName || 'T').charAt(0).toUpperCase()}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                        {storeForm.storeName || 'Toko Cabang Resmi'}
                      </h2>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Badan Usaha Terverifikasi</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {storeForm.companyName} • {storeForm.city}, {storeForm.province}
                    </p>
                  </div>
                </div>

                {storeForm.whatsapp && (
                  <a
                    href={`https://wa.me/${storeForm.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 shrink-0"
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Hotline WA: {storeForm.whatsapp}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Grid 2 Bento Columns for Store Admin */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column (8 cols): Legalitas PT & Lokasi Toko */}
              <div className="lg:col-span-8 space-y-5">
                {/* 1. Legalitas & Identitas Toko */}
                <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/50">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                        Identitas Toko & Badan Usaha PT
                      </h3>
                      <p className="text-xs text-slate-400">
                        Legalitas cabang yang tertera pada faktur resmi dan profil pembeli.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        Nama Toko Cabang *
                      </label>
                      <input
                        type="text"
                        value={storeForm.storeName}
                        onChange={(e) => setStoreForm({ ...storeForm, storeName: e.target.value })}
                        placeholder="misal: Affiliate Gadget - Roxy Mas Jakarta"
                        className="w-full rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 font-medium outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        Nama Badan Usaha (PT) *
                      </label>
                      <input
                        type="text"
                        value={storeForm.companyName}
                        onChange={(e) => setStoreForm({ ...storeForm, companyName: e.target.value })}
                        placeholder="misal: PT Gadget Jaya Sentosa"
                        className="w-full rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 font-medium outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        NPWP Badan Usaha (PT)
                      </label>
                      <input
                        type="text"
                        value={storeForm.taxId}
                        onChange={(e) => setStoreForm({ ...storeForm, taxId: e.target.value })}
                        placeholder="misal: 01.428.910.4-015.000"
                        className="w-full rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 font-mono font-medium outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        Hotline WhatsApp Sales *
                      </label>
                      <input
                        type="text"
                        value={storeForm.whatsapp}
                        onChange={(e) => setStoreForm({ ...storeForm, whatsapp: e.target.value })}
                        placeholder="misal: 6281288997701"
                        className="w-full rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 font-medium outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Alamat Fisik Toko */}
                <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                        Alamat Fisik Toko & Logistik Penjemputan
                      </h3>
                      <p className="text-xs text-slate-400">
                        Lokasi titik penjemputan paket kurir JNE & Gojek Instant.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="sm:col-span-3 space-y-1.5">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        Alamat Lengkap Toko / Mall Cabang *
                      </label>
                      <textarea
                        rows={2}
                        value={storeForm.address}
                        onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                        placeholder="misal: ITC Roxy Mas Lt. 2 No. 45-47, Jl. KH. Hasyim Ashari No. 125, Cideng, Gambir"
                        className="w-full rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 font-medium outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white leading-relaxed"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        Kota / Wilayah *
                      </label>
                      <input
                        type="text"
                        value={storeForm.city}
                        onChange={(e) => setStoreForm({ ...storeForm, city: e.target.value })}
                        placeholder="misal: Jakarta Pusat"
                        className="w-full rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 font-medium outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        Provinsi *
                      </label>
                      <input
                        type="text"
                        value={storeForm.province}
                        onChange={(e) => setStoreForm({ ...storeForm, province: e.target.value })}
                        placeholder="misal: DKI Jakarta"
                        className="w-full rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 font-medium outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        Kode Pos
                      </label>
                      <input
                        type="text"
                        value={storeForm.postalCode || ''}
                        onChange={(e) => setStoreForm({ ...storeForm, postalCode: e.target.value })}
                        placeholder="misal: 10150"
                        className="w-full rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 font-medium outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (4 cols): Rekening Bank Mandiri Cabang PT */}
              <div className="lg:col-span-4 space-y-5">
                <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50">
                      <Landmark className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                        Rekening Bank PT
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Penampungan pencairan transaksi
                      </p>
                    </div>
                  </div>

                  {/* Bank Mandiri Visual Card */}
                  <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 p-5 text-white shadow-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-6 -mt-6 h-28 w-28 rounded-full bg-blue-500/10 blur-xl" />
                    <div className="relative z-10 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-blue-300">
                          {storeForm.bankName || 'Bank Mandiri'}
                        </span>
                        <Landmark className="h-4 w-4 text-blue-300/80" />
                      </div>
                      <p className="font-mono text-base font-bold tracking-widest text-slate-100">
                        {storeForm.accountNumber || '•••• •••• ••••'}
                      </p>
                      <div className="border-t border-white/10 pt-2 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Pemilik Rekening</span>
                        <span className="font-bold text-white truncate max-w-[150px]">
                          {storeForm.accountName || storeForm.companyName || 'PT Terdaftar'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        Nama Bank *
                      </label>
                      <input
                        type="text"
                        value={storeForm.bankName}
                        onChange={(e) => setStoreForm({ ...storeForm, bankName: e.target.value })}
                        placeholder="misal: Bank Mandiri"
                        className="w-full rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 font-medium outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        Nomor Rekening Bank *
                      </label>
                      <input
                        type="text"
                        value={storeForm.accountNumber}
                        onChange={(e) => setStoreForm({ ...storeForm, accountNumber: e.target.value })}
                        placeholder="misal: 1180019283741"
                        className="w-full rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 font-mono font-medium outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        Nama Pemilik Rekening (a.n. PT) *
                      </label>
                      <input
                        type="text"
                        value={storeForm.accountName}
                        onChange={(e) => setStoreForm({ ...storeForm, accountName: e.target.value })}
                        placeholder="misal: PT Gadget Jaya Sentosa"
                        className="w-full rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 font-medium outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: PROFIL AKUN PENGELOLA & PASSWORD (Semua Admin / Admin Platform)   */}
        {/* ========================================================================= */}
        {(activeTab === 'ADMIN' || !isStoreAdmin) && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Bento Card (7 cols): Data Akun Pengelola */}
            <div className="lg:col-span-7 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
              {/* Profile Avatar Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 border-b border-slate-100 pb-6 dark:border-slate-800">
                <div className="relative group">
                  {userForm.image ? (
                    <img
                      src={userForm.image}
                      alt="Profile"
                      className="h-20 w-20 rounded-3xl object-cover border-2 border-slate-200 dark:border-slate-700 shadow-2xs"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-100/80 text-orange-700 font-bold text-2xl dark:bg-orange-950/60 dark:text-orange-300 border-2 border-orange-200/60 shadow-2xs">
                      {(userForm.name || 'A').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <label
                    htmlFor="image-upload"
                    className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-orange-500 text-white shadow-md hover:bg-orange-600 active:scale-95 transition-all"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {userForm.name || 'Pengelola Platform'}
                    </h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                        isSuperAdmin
                          ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300'
                          : isAdminPlatform
                          ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
                          : 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400'
                      }`}
                    >
                      {isSuperAdmin
                        ? 'Super Admin'
                        : isAdminPlatform
                        ? 'Admin Platform'
                        : 'Admin Toko'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {isAdminPlatform
                      ? 'Pengelola katalog gadget, verifikasi toko, dan klaim garansi'
                      : isSuperAdmin
                      ? 'Pengawas konsolidasi omzet Multi-PT & keamanan sistem'
                      : 'Penanggung jawab operasional cabang toko'}
                  </p>
                </div>
              </div>

              {/* Form Input Fields */}
              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Nama Lengkap Pengelola *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={userForm.name}
                      onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                      placeholder="Nama lengkap pengelola"
                      className="w-full rounded-xl border border-slate-200/80 bg-slate-50 py-2.5 pl-9 pr-3.5 font-medium outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Email Akun (Login ID) *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      placeholder="admin@affiliategadget.com"
                      className="w-full rounded-xl border border-slate-200/80 bg-slate-50 py-2.5 pl-9 pr-3.5 font-medium outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Nomor WhatsApp / Kontak Pengelola
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={userForm.phone}
                      onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                      placeholder="081288997701"
                      className="w-full rounded-xl border border-slate-200/80 bg-slate-50 py-2.5 pl-9 pr-3.5 font-medium outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Info Hak Akses Admin Platform */}
              {!isStoreAdmin && (
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 dark:bg-slate-800/40 p-4 space-y-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-orange-500" />
                    Cakupan Hak Akses Platform
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>Katalog Gadget Publik</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>Verifikasi Cabang Toko</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>Pusat Klaim Garansi 30 Hari</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>Konfigurasi Akun Pengelola</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Bento Card (5 cols): Ganti Password & Keamanan */}
            <div className="lg:col-span-5 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/50">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                    Keamanan & Sandi
                  </h3>
                  <p className="text-xs text-slate-400">
                    Perbarui kata sandi akun login Anda
                  </p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Password Saat Ini
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="password"
                      value={userForm.currentPassword}
                      onChange={(e) => setUserForm({ ...userForm, currentPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-200/80 bg-slate-50 py-2.5 pl-9 pr-3.5 font-medium outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Password Baru
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="password"
                      value={userForm.newPassword}
                      onChange={(e) => setUserForm({ ...userForm, newPassword: e.target.value })}
                      placeholder="Minimal 6 karakter"
                      className="w-full rounded-xl border border-slate-200/80 bg-slate-50 py-2.5 pl-9 pr-3.5 font-medium outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Konfirmasi Password Baru
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="password"
                      value={userForm.confirmPassword}
                      onChange={(e) => setUserForm({ ...userForm, confirmPassword: e.target.value })}
                      placeholder="Ulangi password baru"
                      className="w-full rounded-xl border border-slate-200/80 bg-slate-50 py-2.5 pl-9 pr-3.5 font-medium outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3 text-[11px] text-slate-500 dark:bg-slate-800/60 dark:text-slate-400 border border-slate-100 dark:border-slate-800 flex items-start gap-2 mt-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Kosongkan kolom sandi jika Anda hanya ingin memperbarui data nama profil atau kontak.</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
