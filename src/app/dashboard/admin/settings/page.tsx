'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
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
  Camera,
  Trash2,
} from 'lucide-react'

export default function AdminSettingsPage() {
  const { update: updateSession } = useSession()
  const [activeTab, setActiveTab] = useState<'STORE' | 'ADMIN' | 'SECURITY'>(
    'ADMIN'
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingUserImage, setUploadingUserImage] = useState(false)
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
    logo: '',
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
            logo: store.logo || '',
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

        // Update live session immediately so sidebar avatar reflects changes
        if (updateSession) {
          try {
            await updateSession({
              name: userForm.name,
              image: userForm.image || storeForm.logo || undefined,
              user: {
                name: userForm.name,
                image: userForm.image || storeForm.logo || undefined,
              },
            })
          } catch (sessionErr) {
            console.warn('Session update warning:', sessionErr)
          }
        }

        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('profile-updated', {
              detail: { image: userForm.image || storeForm.logo },
            })
          )
        }

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

  // Upload Foto / Logo Toko (Store Logo)
  const handleStoreLogoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Hanya file foto (JPG, PNG, WebP) yang diperbolehkan')
      return
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error('Ukuran foto maksimal 15MB')
      return
    }

    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'avatars')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        setStoreForm((prev) => ({ ...prev, logo: data.url }))
        // Jika foto pengelola user masih kosong, otomatis pasangkan juga
        setUserForm((prev) => ({
          ...prev,
          image: prev.image || data.url,
        }))
        toast.success(
          'Foto logo toko berhasil diunggah. Klik "Simpan Perubahan" untuk menyimpan.'
        )
      } else {
        const errData = await res.json().catch(() => ({}))
        toast.error(errData.error || 'Gagal mengunggah foto toko')
      }
    } catch (error) {
      console.error('Error uploading store logo:', error)
      toast.error('Terjadi kesalahan saat upload foto toko')
    } finally {
      setUploadingLogo(false)
    }
  }

  // Upload Foto Profil Pengelola (User Avatar)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Hanya file gambar yang diperbolehkan')
      return
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error('Ukuran foto maksimal 15MB')
      return
    }

    setUploadingUserImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'avatars')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        setUserForm((prev) => ({ ...prev, image: data.url }))
        // Jika foto logo toko masih kosong dan ini adalah admin toko, pasangkan juga
        if (isStoreAdmin) {
          setStoreForm((prev) => ({
            ...prev,
            logo: prev.logo || data.url,
          }))
        }
        toast.success(
          'Foto profil berhasil diunggah. Klik "Simpan Perubahan" untuk menyimpan.'
        )
      } else {
        const errData = await res.json().catch(() => ({}))
        toast.error(errData.error || 'Gagal mengunggah foto')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Terjadi kesalahan saat upload')
    } finally {
      setUploadingUserImage(false)
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
    <div
      className="mx-auto max-w-6xl space-y-5 pb-16 pt-1"
      suppressHydrationWarning
    >
      {/* ========================================================================= */}
      {/* 1. TOP CONTROL PANEL (Role-Adaptive Switcher & Save Button)               */}
      {/* ========================================================================= */}
      <div className="shadow-2xs flex flex-col items-stretch justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:p-3">
        {/* Left: Section Badge / Single Tab for Platform Admin */}
        <div className="flex items-center gap-1.5 rounded-2xl bg-slate-100/80 p-1 dark:bg-slate-800/80">
          {isStoreAdmin ? (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('STORE')}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 ${
                  activeTab === 'STORE'
                    ? 'shadow-xs bg-white text-slate-950 dark:bg-slate-900 dark:text-white'
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
                    ? 'shadow-xs bg-white text-slate-950 dark:bg-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <User className="h-3.5 w-3.5 text-orange-500" />
                <span>Akun Pengelola</span>
              </button>
            </>
          ) : (
            <div className="shadow-2xs inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-950 dark:bg-slate-900 dark:text-white">
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
            <div className="shadow-2xs rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  <div className="group relative shrink-0">
                    {storeForm.logo ? (
                      <img
                        src={storeForm.logo}
                        alt={storeForm.storeName}
                        className="shadow-2xs h-16 w-16 rounded-2xl border-2 border-slate-200 object-cover dark:border-slate-700 sm:h-20 sm:w-20 sm:rounded-3xl"
                      />
                    ) : (
                      <div className="shadow-2xs flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-orange-200/60 bg-orange-100/80 text-2xl font-bold text-orange-700 dark:border-orange-800/40 dark:bg-orange-950/60 dark:text-orange-300 sm:h-20 sm:w-20 sm:rounded-3xl sm:text-3xl">
                        {(storeForm.storeName || 'T').charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Upload Overlay Button on avatar */}
                    <label
                      htmlFor="store-logo-upload"
                      title="Unggah Foto Profil / Logo Toko"
                      className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-orange-500 text-white shadow-md transition-all hover:bg-orange-600 active:scale-95 dark:border-slate-900 sm:h-8 sm:w-8"
                    >
                      {uploadingLogo ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Camera className="h-3.5 w-3.5" />
                      )}
                      <input
                        id="store-logo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingLogo}
                        onChange={handleStoreLogoUpload}
                      />
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                        {storeForm.storeName || 'Toko Cabang Resmi'}
                      </h2>
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/60 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Badan Usaha Terverifikasi</span>
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {storeForm.companyName} • {storeForm.city},{' '}
                      {storeForm.province}
                    </p>
                    <div className="flex items-center gap-2 pt-0.5">
                      <label
                        htmlFor="store-logo-upload"
                        className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-orange-600 underline-offset-2 transition hover:text-orange-700 hover:underline dark:text-orange-400"
                      >
                        <Upload className="h-3 w-3" />
                        <span>
                          {storeForm.logo
                            ? 'Ganti Foto / Logo Toko'
                            : 'Upload Foto Toko'}
                        </span>
                      </label>
                      {storeForm.logo && (
                        <>
                          <span className="text-slate-300 dark:text-slate-700">
                            •
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setStoreForm((prev) => ({ ...prev, logo: '' }))
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-500 transition hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Hapus</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {storeForm.whatsapp && (
                  <a
                    href={`https://wa.me/${storeForm.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shadow-2xs inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Hotline WA: {storeForm.whatsapp}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Grid 2 Bento Columns for Store Admin */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
              {/* Left Column (8 cols): Legalitas PT & Lokasi Toko */}
              <div className="space-y-5 lg:col-span-8">
                {/* 1. Legalitas & Identitas Toko */}
                <div className="shadow-2xs space-y-5 rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/50">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                        Identitas Toko & Badan Usaha PT
                      </h3>
                      <p className="text-xs text-slate-400">
                        Legalitas cabang yang tertera pada faktur resmi dan
                        profil pembeli.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        Nama Toko Cabang *
                      </label>
                      <input
                        type="text"
                        value={storeForm.storeName}
                        onChange={(e) =>
                          setStoreForm({
                            ...storeForm,
                            storeName: e.target.value,
                          })
                        }
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
                        onChange={(e) =>
                          setStoreForm({
                            ...storeForm,
                            companyName: e.target.value,
                          })
                        }
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
                        onChange={(e) =>
                          setStoreForm({ ...storeForm, taxId: e.target.value })
                        }
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
                        onChange={(e) =>
                          setStoreForm({
                            ...storeForm,
                            whatsapp: e.target.value,
                          })
                        }
                        placeholder="misal: 6281288997701"
                        className="w-full rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 font-medium outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Alamat Fisik Toko */}
                <div className="shadow-2xs space-y-5 rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                        Alamat Fisik Toko & Logistik Penjemputan
                      </h3>
                      <p className="text-xs text-slate-400">
                        Lokasi titik penjemputan paket kurir JNE & Gojek
                        Instant.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-3">
                    <div className="space-y-1.5 sm:col-span-3">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        Alamat Lengkap Toko / Mall Cabang *
                      </label>
                      <textarea
                        rows={2}
                        value={storeForm.address}
                        onChange={(e) =>
                          setStoreForm({
                            ...storeForm,
                            address: e.target.value,
                          })
                        }
                        placeholder="misal: ITC Roxy Mas Lt. 2 No. 45-47, Jl. KH. Hasyim Ashari No. 125, Cideng, Gambir"
                        className="w-full rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 font-medium leading-relaxed outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                        onChange={(e) =>
                          setStoreForm({ ...storeForm, city: e.target.value })
                        }
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
                        onChange={(e) =>
                          setStoreForm({
                            ...storeForm,
                            province: e.target.value,
                          })
                        }
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
                        onChange={(e) =>
                          setStoreForm({
                            ...storeForm,
                            postalCode: e.target.value,
                          })
                        }
                        placeholder="misal: 10150"
                        className="w-full rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 font-medium outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (4 cols): Rekening Bank Mandiri Cabang PT */}
              <div className="space-y-5 lg:col-span-4">
                <div className="shadow-2xs space-y-5 rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
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
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 p-5 text-white shadow-md">
                    <div className="absolute right-0 top-0 -mr-6 -mt-6 h-28 w-28 rounded-full bg-blue-500/10 blur-xl" />
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
                      <div className="flex items-center justify-between border-t border-white/10 pt-2 text-[11px]">
                        <span className="text-slate-400">Pemilik Rekening</span>
                        <span className="max-w-[150px] truncate font-bold text-white">
                          {storeForm.accountName ||
                            storeForm.companyName ||
                            'PT Terdaftar'}
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
                        onChange={(e) =>
                          setStoreForm({
                            ...storeForm,
                            bankName: e.target.value,
                          })
                        }
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
                        onChange={(e) =>
                          setStoreForm({
                            ...storeForm,
                            accountNumber: e.target.value,
                          })
                        }
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
                        onChange={(e) =>
                          setStoreForm({
                            ...storeForm,
                            accountName: e.target.value,
                          })
                        }
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
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* Left Bento Card (7 cols): Data Akun Pengelola */}
            <div className="shadow-2xs space-y-6 rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-7 lg:col-span-7">
              {/* Profile Avatar Header */}
              <div className="flex flex-col items-start gap-5 border-b border-slate-100 pb-6 dark:border-slate-800 sm:flex-row sm:items-center">
                <div className="group relative">
                  {userForm.image ? (
                    <img
                      src={userForm.image}
                      alt="Profile"
                      className="shadow-2xs h-20 w-20 rounded-3xl border-2 border-slate-200 object-cover dark:border-slate-700"
                    />
                  ) : (
                    <div className="shadow-2xs flex h-20 w-20 items-center justify-center rounded-3xl border-2 border-orange-200/60 bg-orange-100/80 text-2xl font-bold text-orange-700 dark:bg-orange-950/60 dark:text-orange-300">
                      {(userForm.name || 'A').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <label
                    htmlFor="image-upload"
                    title="Unggah Foto Profil Pengelola"
                    className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-orange-500 text-white shadow-md transition-all hover:bg-orange-600 active:scale-95 dark:border-slate-900"
                  >
                    {uploadingUserImage ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Camera className="h-3.5 w-3.5" />
                    )}
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      disabled={uploadingUserImage}
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {userForm.name || 'Pengelola Platform'}
                    </h3>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                        isSuperAdmin
                          ? 'border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                          : isAdminPlatform
                            ? 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                            : 'border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400'
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
                      onChange={(e) =>
                        setUserForm({ ...userForm, name: e.target.value })
                      }
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
                      onChange={(e) =>
                        setUserForm({ ...userForm, email: e.target.value })
                      }
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
                      onChange={(e) =>
                        setUserForm({ ...userForm, phone: e.target.value })
                      }
                      placeholder="081288997701"
                      className="w-full rounded-xl border border-slate-200/80 bg-slate-50 py-2.5 pl-9 pr-3.5 font-medium outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Info Hak Akses Admin Platform */}
              {!isStoreAdmin && (
                <div className="space-y-2.5 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:bg-slate-800/40">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <Layers className="h-3.5 w-3.5 text-orange-500" />
                    Cakupan Hak Akses Platform
                  </span>
                  <div className="grid grid-cols-1 gap-2 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span>Katalog Gadget Publik</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span>Verifikasi Cabang Toko</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span>Pusat Klaim Garansi 30 Hari</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span>Konfigurasi Akun Pengelola</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Bento Card (5 cols): Ganti Password & Keamanan */}
            <div className="shadow-2xs space-y-5 rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-7 lg:col-span-5">
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
                      onChange={(e) =>
                        setUserForm({
                          ...userForm,
                          currentPassword: e.target.value,
                        })
                      }
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
                      onChange={(e) =>
                        setUserForm({
                          ...userForm,
                          newPassword: e.target.value,
                        })
                      }
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
                      onChange={(e) =>
                        setUserForm({
                          ...userForm,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder="Ulangi password baru"
                      className="w-full rounded-xl border border-slate-200/80 bg-slate-50 py-2.5 pl-9 pr-3.5 font-medium outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="mt-2 flex items-start gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>
                    Kosongkan kolom sandi jika Anda hanya ingin memperbarui data
                    nama profil atau kontak.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
