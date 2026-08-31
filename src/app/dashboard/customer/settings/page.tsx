'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { AddressModal, UserAddressItem } from '@/components/customer/address-modal'
import {
  User,
  Lock,
  Camera,
  Loader2,
  Check,
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  KeyRound,
  Plus,
  Home,
  Building2,
  Trash2,
  Edit3,
  Star,
  Sparkles,
  Calendar,
  AtSign,
  Smartphone,
  Laptop,
  LogOut,
  AlertCircle,
  FileText,
} from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

type Tab = 'profile' | 'address' | 'security'

export default function CustomerSettingsPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Profile data (Shopee buyer standard)
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState<'Laki-laki' | 'Perempuan' | ''>('')
  const [birthDate, setBirthDate] = useState('')
  const [bio, setBio] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // Multi-address data
  const [addresses, setAddresses] = useState<UserAddressItem[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [addressToEdit, setAddressToEdit] = useState<UserAddressItem | null>(null)
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Security data
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true)
  const [loginAlertsEnabled, setLoginAlertsEnabled] = useState(true)
  const [loggingOutOther, setLoggingOutOther] = useState(false)

  // Fetch full profile
  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const data = await res.json()
        setName(data.user.name || '')
        setUsername(data.user.username || '')
        setEmail(data.user.email || '')
        setPhone(data.user.phone || '')
        setGender(data.user.gender || '')
        if (data.user.birthDate) {
          const date = new Date(data.user.birthDate)
          setBirthDate(date.toISOString().split('T')[0])
        }
        setBio(data.user.bio || '')
        setAvatarPreview(data.user.image)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast({
        title: 'Gagal Memuat',
        description: 'Terjadi kendala saat mengambil data profil.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Fetch user multi-addresses
  const fetchAddresses = useCallback(async () => {
    setLoadingAddresses(true)
    try {
      const res = await fetch('/api/user/addresses')
      if (res.ok) {
        const data = await res.json()
        setAddresses(data.addresses || [])
      }
    } catch (error) {
      console.error('Error fetching addresses:', error)
    } finally {
      setLoadingAddresses(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchProfile()
      fetchAddresses()
    }
  }, [status, router, fetchProfile, fetchAddresses])

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Format Tidak Sesuai',
        description: 'Pilih berkas gambar yang valid (JPG, PNG, atau WebP).',
        variant: 'destructive',
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Ukuran Terlalu Besar',
        description: 'Ukuran berkas foto maksimal 5MB.',
        variant: 'destructive',
      })
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        setAvatarPreview(data.avatarUrl)
        await update()
        toast({
          title: 'Foto Profil Diperbarui',
          description: 'Foto profil baru Anda berhasil disimpan.',
        })
      } else {
        const error = await res.json()
        toast({
          title: 'Gagal Upload',
          description: error.error || 'Gagal mengunggah foto profil.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan sistem saat mengunggah foto profil.',
        variant: 'destructive',
      })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast({
        title: 'Nama Wajib Diisi',
        description: 'Silakan masukkan nama lengkap sesuai identitas Anda.',
        variant: 'destructive',
      })
      return
    }
    if (!email.trim()) {
      toast({
        title: 'Email Wajib Diisi',
        description: 'Silakan masukkan alamat email akun Anda.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim(),
          email: email.trim(),
          phone: phone.trim(),
          gender: gender || null,
          birthDate: birthDate || null,
          bio: bio.trim(),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        await update()
        toast({
          title: 'Biodata Tersimpan',
          description: data.message || 'Perubahan data profil pembeli berhasil diperbarui.',
        })
      } else {
        toast({
          title: 'Gagal Menyimpan',
          description: data.error || 'Gagal memperbarui profil.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan sistem saat menyimpan profil.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSetDefaultAddress = async (addressId: string) => {
    setSettingDefaultId(addressId)
    try {
      const res = await fetch(`/api/user/addresses/${addressId}/set-default`, {
        method: 'POST',
      })

      if (res.ok) {
        toast({
          title: 'Alamat Utama Diperbarui',
          description: 'Alamat ini akan otomatis digunakan saat checkout pesanan.',
        })
        await fetchAddresses()
      } else {
        const err = await res.json()
        toast({
          title: 'Gagal',
          description: err.error || 'Gagal mengubah alamat utama.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error setting default address:', error)
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat mengatur alamat utama.',
        variant: 'destructive',
      })
    } finally {
      setSettingDefaultId(null)
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus alamat pengiriman ini?')) return

    setDeletingId(addressId)
    try {
      const res = await fetch(`/api/user/addresses/${addressId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast({
          title: 'Alamat Dihapus',
          description: 'Alamat telah dihapus dari daftar buku alamat Anda.',
        })
        await fetchAddresses()
      } else {
        const err = await res.json()
        toast({
          title: 'Gagal Menghapus',
          description: err.error || 'Gagal menghapus alamat.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error deleting address:', error)
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat menghapus alamat.',
        variant: 'destructive',
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Password Tidak Cocok',
        description: 'Konfirmasi password baru tidak sesuai.',
        variant: 'destructive',
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Password Terlalu Pendek',
        description: 'Password baru minimal harus 6 karakter kombinasi.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      if (res.ok) {
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        toast({
          title: 'Password Berhasil Diubah',
          description: 'Gunakan kata sandi baru Anda saat login berikutnya.',
        })
      } else {
        const error = await res.json()
        toast({
          title: 'Gagal Mengubah Password',
          description: error.error || 'Password lama tidak sesuai.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error changing password:', error)
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan sistem saat mengubah password.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleLogoutOtherDevices = async () => {
    setLoggingOutOther(true)
    setTimeout(() => {
      setLoggingOutOther(false)
      toast({
        title: 'Sesi Lain Dikeluarkan',
        description: 'Semua perangkat lain telah berhasil di-logout dari akun Anda.',
      })
    }, 1200)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50/50">
        <Navbar variant="light" />
        <div className="flex flex-1 items-center justify-center pt-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-slate-900" />
            <p className="text-xs font-semibold text-slate-500">Memuat data akun pembeli...</p>
          </div>
        </div>
      </div>
    )
  }

  const tabsConfig = [
    {
      id: 'profile' as Tab,
      label: 'Profil & Biodata',
      shortLabel: 'Profil',
      icon: User,
    },
    {
      id: 'address' as Tab,
      label: `Alamat Pengiriman (${addresses.length})`,
      shortLabel: `Alamat (${addresses.length})`,
      icon: MapPin,
    },
    {
      id: 'security' as Tab,
      label: 'Kata Sandi & Keamanan',
      shortLabel: 'Keamanan',
      icon: Lock,
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 selection:bg-orange-500 selection:text-white">
      <Navbar variant="light" />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        
        {/* Top Segmented Navigation Pills (Aligned with Header Navbar max-w-7xl) */}
        <div className="rounded-full border border-slate-200/70 bg-slate-100/80 p-1 shadow-2xs flex gap-1 mb-6">
          {tabsConfig.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2 px-3 text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-slate-950 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            )
          })}
        </div>

        {/* Main Content Bento Card */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-2xs">
          <AnimatePresence mode="wait">
            
            {/* ========================================================================= */}
            {/* ------------------------- TAB 1: PROFIL & BIODATA ---------------------- */}
            {/* ========================================================================= */}
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                {/* Avatar Inner Box */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 sm:p-5 shadow-2xs">
                  <div className="relative shrink-0">
                    <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-white shadow-xs bg-slate-900 text-white flex items-center justify-center">
                      {avatarPreview ? (
                        <Image
                          src={avatarPreview}
                          alt="Avatar"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-xl font-black">
                          {(name || session?.user?.name || 'U').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {uploadingAvatar && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-950/60 backdrop-blur-2xs">
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAvatarClick}
                        disabled={uploadingAvatar}
                        className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        <span>{uploadingAvatar ? 'Mengunggah...' : 'Ubah Foto Profil'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Format JPG, PNG atau WebP. Ukuran berkas maksimal 5MB.
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Shopee Buyer Form Grid */}
                <div className="space-y-4">
                  {/* Row 1: Nama Lengkap & Username */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-700">
                        Nama Lengkap <span className="text-red-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <User className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Nama lengkap sesuai KTP"
                          required
                          className="w-full rounded-full border border-slate-200/70 bg-slate-50/80 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-300 focus:bg-white focus:shadow-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-700">
                        Username / Nama Panggilan
                      </label>
                      <div className="relative flex items-center">
                        <AtSign className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                          placeholder="sitiaminah99"
                          className="w-full rounded-full border border-slate-200/70 bg-slate-50/80 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-300 focus:bg-white focus:shadow-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Email & Nomor Telepon WhatsApp */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                          Alamat Email <span className="text-red-500">*</span>
                        </label>
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/70 bg-white px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 shadow-2xs">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          Terverifikasi
                        </span>
                      </div>
                      <div className="relative flex items-center">
                        <Mail className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="nama@email.com"
                          required
                          className="w-full rounded-full border border-slate-200/70 bg-slate-50/80 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-300 focus:bg-white focus:shadow-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                          Nomor Telepon / WhatsApp <span className="text-red-500">*</span>
                        </label>
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/70 bg-white px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 shadow-2xs">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          WhatsApp Aktif
                        </span>
                      </div>
                      <div className="relative flex items-center">
                        <Phone className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Contoh: 081234567890"
                          required
                          className="w-full rounded-full border border-slate-200/70 bg-slate-50/80 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-300 focus:bg-white focus:shadow-xs"
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Nomor aktif untuk pelacakan resi kurir JNE & konfirmasi driver Gojek.
                      </p>
                    </div>
                  </div>

                  {/* Row 3: Jenis Kelamin & Tanggal Lahir */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-700">
                        Jenis Kelamin
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['Laki-laki', 'Perempuan'] as const).map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setGender(item)}
                            className={`rounded-full border py-2.5 px-3 text-xs font-bold transition-all cursor-pointer ${
                              gender === item
                                ? 'border-slate-950 bg-slate-950 text-white shadow-xs'
                                : 'border-slate-200/70 bg-slate-50/80 text-slate-600 hover:border-slate-300 hover:bg-white'
                            }`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-700">
                        Tanggal Lahir
                      </label>
                      <div className="relative flex items-center">
                        <Calendar className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                          type="date"
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                          className="w-full rounded-full border border-slate-200/70 bg-slate-50/80 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white focus:shadow-xs cursor-pointer"
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Dapatkan voucher diskon & hadiah spesial di hari ulang tahun Anda.
                      </p>
                    </div>
                  </div>

                  {/* Row 4: Bio / Catatan Pembeli */}
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                      Bio / Catatan Khusus Pengiriman
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={2}
                        placeholder="Contoh: Jika rumah kosong, paket gadget dapat dititipkan ke security pos depan."
                        className="w-full resize-none rounded-2xl border border-slate-200/70 bg-slate-50/80 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-300 focus:bg-white focus:shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex items-center justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    <span>{saving ? 'Menyimpan...' : 'Simpan Profil Biodata'}</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* ========================================================================= */}
            {/* -------------------- TAB 2: ALAMAT PENGIRIMAN MULTI-ADDRESS ------------ */}
            {/* ========================================================================= */}
            {activeTab === 'address' && (
              <motion.div
                key="address"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                {/* Header Bar with Add Address CTA */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-950">
                      Daftar Alamat Pengiriman Saya
                    </h2>
                    <p className="text-xs text-slate-400">
                      Kelola alamat Rumah, Kantor, dan titik GPS akurat untuk kurir
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAddressToEdit(null)
                      setIsAddressModalOpen(true)
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition active:scale-95 cursor-pointer shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambah Alamat Baru</span>
                  </button>
                </div>

                {/* Address Cards List */}
                {loadingAddresses ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-900" />
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 shadow-2xs mb-3">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">
                      Belum Ada Alamat Tersimpan
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm mb-4">
                      Tambahkan alamat rumah atau kantor Anda untuk mempermudah proses checkout pembelian gadget.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setAddressToEdit(null)
                        setIsAddressModalOpen(true)
                      }}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Tambah Alamat Pertama</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {addresses.map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-2xl border transition-all p-5 shadow-2xs ${
                          item.isDefault
                            ? 'border-slate-950/30 bg-slate-50/90 ring-1 ring-slate-950/10'
                            : 'border-slate-200/80 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          
                          {/* Left Details */}
                          <div className="space-y-2 flex-1">
                            
                            {/* Badges & Recipient */}
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-black text-slate-950">
                                {item.recipientName}
                              </span>
                              <span className="text-xs font-medium text-slate-400">
                                •
                              </span>
                              <span className="text-xs font-semibold text-slate-600">
                                {item.phone}
                              </span>

                              {/* Label Badge (Rumah vs Kantor) */}
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border shadow-2xs ${
                                  item.label === 'Kantor'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200/80'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                                }`}
                              >
                                {item.label === 'Kantor' ? (
                                  <Building2 className="h-3 w-3" />
                                ) : (
                                  <Home className="h-3 w-3" />
                                )}
                                {item.label || 'Rumah'}
                              </span>

                              {/* Default Badge */}
                              {item.isDefault && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-950 text-white px-2.5 py-0.5 text-[10px] font-bold shadow-xs">
                                  <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                                  Alamat Utama
                                </span>
                              )}
                            </div>

                            {/* Full Address */}
                            <p className="text-xs leading-relaxed text-slate-700 font-medium">
                              {item.fullAddress}
                            </p>

                            {/* Village, District, City, Province, Postal Code */}
                            <p className="text-xs text-slate-500">
                              {[item.village, item.district, item.city, item.province, item.postalCode]
                                .filter(Boolean)
                                .join(', ')}
                            </p>

                            {/* GPS Pin Point Indicator */}
                            {item.latitude && item.longitude && (
                              <div className="flex items-center gap-1.5 pt-1">
                                <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50/80 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                  <MapPin className="h-3 w-3 text-blue-600" />
                                  Titik GPS Terpasang
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Right Action Buttons */}
                          <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                            {!item.isDefault && (
                              <button
                                type="button"
                                onClick={() => handleSetDefaultAddress(item.id)}
                                disabled={settingDefaultId === item.id}
                                className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer"
                              >
                                {settingDefaultId === item.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Star className="h-3 w-3 text-amber-500" />
                                )}
                                <span>Atur Utama</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setAddressToEdit(item)
                                setIsAddressModalOpen(true)
                              }}
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer"
                            >
                              <Edit3 className="h-3 w-3 text-slate-500" />
                              <span>Ubah</span>
                            </button>

                            {addresses.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteAddress(item.id)}
                                disabled={deletingId === item.id}
                                className="inline-flex items-center gap-1 rounded-full border border-rose-200/80 bg-rose-50/50 px-3 py-1.5 text-xs font-bold text-rose-600 shadow-2xs hover:bg-rose-100/60 transition cursor-pointer"
                              >
                                {deletingId === item.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                                <span>Hapus</span>
                              </button>
                            )}
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Modal Component */}
                <AddressModal
                  isOpen={isAddressModalOpen}
                  onClose={() => setIsAddressModalOpen(false)}
                  onSuccess={fetchAddresses}
                  addressToEdit={addressToEdit}
                />
              </motion.div>
            )}

            {/* ========================================================================= */}
            {/* ----------------- TAB 3: KATA SANDI & KEAMANAN AKUN --------------------- */}
            {/* ========================================================================= */}
            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                {/* 1. Ubah Kata Sandi */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h2 className="text-sm font-bold text-slate-950">
                        Ubah Kata Sandi Akun
                      </h2>
                      <p className="text-xs text-slate-400">
                        Perbarui kata sandi secara berkala untuk menjaga keamanan akun
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/70 bg-white px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 shadow-2xs">
                      <ShieldCheck className="h-3 w-3 text-emerald-600" />
                      Enkripsi Terproteksi
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Current Password */}
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-700">
                        Password Saat Ini
                      </label>
                      <div className="relative flex items-center">
                        <KeyRound className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Password lama"
                          className="w-full rounded-full border border-slate-200/70 bg-slate-50/80 py-2.5 pl-10 pr-10 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-300 focus:bg-white focus:shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-700">
                        Password Baru
                      </label>
                      <div className="relative flex items-center">
                        <Lock className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min. 6 karakter"
                          className="w-full rounded-full border border-slate-200/70 bg-slate-50/80 py-2.5 pl-10 pr-10 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-300 focus:bg-white focus:shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm New Password */}
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-700">
                        Konfirmasi Password Baru
                      </label>
                      <div className="relative flex items-center">
                        <Lock className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Ulangi password baru"
                          className="w-full rounded-full border border-slate-200/70 bg-slate-50/80 py-2.5 pl-10 pr-10 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-300 focus:bg-white focus:shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-[11px] text-slate-400">
                      Minimal 6 karakter, kombinasikan huruf dan angka untuk keamanan maksimal.
                    </div>
                    <button
                      type="button"
                      onClick={handleChangePassword}
                      disabled={
                        saving ||
                        !currentPassword ||
                        !newPassword ||
                        !confirmPassword
                      }
                      className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {saving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      <span>Perbarui Kata Sandi</span>
                    </button>
                  </div>
                </div>

                {/* 2. Shopee-Style Security Verification Settings */}
                <div className="pt-6 border-t border-slate-100 space-y-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-950">
                      Verifikasi & Keamanan Tambahan
                    </h2>
                    <p className="text-xs text-slate-400">
                      Proteksi transaksi checkout gadget dan akses akun Anda
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* 2FA Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/70 bg-slate-50/80">
                      <div className="space-y-1 pr-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900">
                            Verifikasi 2 Langkah (OTP WhatsApp)
                          </span>
                          <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.2 text-[9px] font-black">
                            DIREKOMENDASIKAN
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Minta kode OTP verifikasi WhatsApp saat login dari browser baru.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setTwoFactorEnabled(!twoFactorEnabled)
                          toast({
                            title: twoFactorEnabled ? '2FA Dinonaktifkan' : '2FA Diaktifkan',
                            description: 'Pengaturan keamanan 2 langkah berhasil diperbarui.',
                          })
                        }}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          twoFactorEnabled ? 'bg-slate-950' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Login Alerts Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/70 bg-slate-50/80">
                      <div className="space-y-1 pr-4">
                        <span className="text-xs font-bold text-slate-900">
                          Notifikasi Login Mencurigakan
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Kirim peringatan instan ke email jika ada aktivitas login asing.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginAlertsEnabled(!loginAlertsEnabled)
                          toast({
                            title: 'Pengaturan Disimpan',
                            description: 'Notifikasi keamanan email telah diperbarui.',
                          })
                        }}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          loginAlertsEnabled ? 'bg-slate-950' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            loginAlertsEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                  </div>
                </div>

                {/* 3. Daftar Perangkat & Sesi Login Aktif */}
                <div className="pt-6 border-t border-slate-100 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-bold text-slate-950">
                        Perangkat & Sesi Login Aktif
                      </h2>
                      <p className="text-xs text-slate-400">
                        Daftar perangkat yang saat ini memiliki akses aktif ke akun Anda
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogoutOtherDevices}
                      disabled={loggingOutOther}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-4 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer self-start sm:self-auto"
                    >
                      {loggingOutOther ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <LogOut className="h-3.5 w-3.5 text-rose-500" />
                      )}
                      <span>Keluarkan Perangkat Lain</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* Current Device */}
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/70 bg-slate-50/80">
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-xs">
                          <Laptop className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-950">
                              MacBook / Desktop (macOS)
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.2 text-[9px] font-black text-emerald-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Aktif Sekarang
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Google Chrome • Jakarta, Indonesia (Sesi Saat Ini)
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Smartphone Device */}
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/70 bg-white">
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 shadow-2xs">
                          <Smartphone className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="text-xs font-black text-slate-950">
                            iPhone 15 Pro (iOS Mobile)
                          </span>
                          <p className="text-[11px] text-slate-400">
                            Safari Mobile • Terakhir aktif 2 hari yang lalu
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </main>

      <Footer variant="light" />
      <Toaster />
    </div>
  )
}
