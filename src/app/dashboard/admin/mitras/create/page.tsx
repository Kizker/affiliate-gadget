'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Store,
  Clock,
  Phone,
  Mail,
  Globe,
  Plus,
  X,
  Save,
  Loader2,
  CheckCircle,
  ArrowLeft,
  UserPlus,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import ImageUpload from '@/components/upload/image-upload'

interface Service {
  name: string
  price: string
  icon: string
}

const FEATURE_OPTIONS = [
  'Garansi Resmi',
  'Teknisi Bersertifikat',
  'Spare Part Original',
  'Free Konsultasi',
  'Home Service',
  'Express Service',
  'Pickup & Delivery',
  '24 Jam',
  'Pembayaran Cicilan',
]

const SERVICE_ICONS = [
  '💻',
  '📱',
  '🖥️',
  '⚡',
  '💾',
  '🧹',
  '🔧',
  '🎮',
  '📀',
  '🔌',
]

export default function CreateMitraPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('user')

  // New user form
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  })

  // Profile data (matching edit page structure)
  const [profile, setProfile] = useState({
    name: '',
    tagline: '',
    description: '',
    city: '',
    province: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    banner: '',
    gallery: [] as string[],
    services: [] as Service[],
    features: [] as string[],
    latitude: 0,
    longitude: 0,
    hours: {
      weekday: 'Senin - Sabtu: 09:00 - 18:00',
      weekend: 'Minggu: Tutup',
    },
    isApproved: false,
  })

  // Service form
  const [newService, setNewService] = useState({
    name: '',
    price: '',
    icon: '💻',
  })

  // Custom feature
  const [newFeature, setNewFeature] = useState('')
  const MAX_FEATURE_LENGTH = 30

  const generatePassword = () => {
    const password =
      Math.random().toString(36).slice(-10) +
      Math.random().toString(36).slice(-10).toUpperCase()
    setNewUser({ ...newUser, password })
    toast.success('Password generated')
  }

  const addService = () => {
    if (newService.name && newService.price) {
      setProfile({
        ...profile,
        services: [...profile.services, { ...newService }],
      })
      setNewService({ name: '', price: '', icon: '💻' })
      toast.success('Layanan ditambahkan!')
    }
  }

  const removeService = (index: number) => {
    setProfile({
      ...profile,
      services: profile.services.filter((_, i) => i !== index),
    })
  }

  const toggleFeature = (feature: string) => {
    if (profile.features.includes(feature)) {
      setProfile({
        ...profile,
        features: profile.features.filter((f) => f !== feature),
      })
    } else {
      setProfile({
        ...profile,
        features: [...profile.features, feature],
      })
    }
  }

  const addCustomFeature = () => {
    const trimmed = newFeature.trim()
    if (
      trimmed &&
      trimmed.length <= MAX_FEATURE_LENGTH &&
      !profile.features.includes(trimmed)
    ) {
      setProfile({
        ...profile,
        features: [...profile.features, trimmed],
      })
      setNewFeature('')
      toast.success('Keunggulan ditambahkan!')
    } else if (trimmed.length > MAX_FEATURE_LENGTH) {
      toast.error(`Maksimal ${MAX_FEATURE_LENGTH} karakter`)
    } else if (profile.features.includes(trimmed)) {
      toast.error('Keunggulan sudah ada')
    }
  }

  const removeFeature = (feature: string) => {
    setProfile({
      ...profile,
      features: profile.features.filter((f) => f !== feature),
    })
  }

  const handleSubmit = async () => {
    // Validation
    if (!profile.name || !profile.address || !profile.city || !profile.phone) {
      toast.error(
        'Mohon lengkapi data wajib: Nama Toko, Alamat, Kota, dan Telepon'
      )
      return
    }

    if (!newUser.name || !newUser.email) {
      toast.error('Nama dan email user wajib diisi')
      return
    }

    setLoading(true)

    try {
      // Create new user
      const userRes = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone || null,
          password: newUser.password || undefined,
          role: 'MITRA',
        }),
      })

      if (!userRes.ok) {
        const error = await userRes.json()
        throw new Error(error.error || 'Gagal membuat user')
      }

      const userData = await userRes.json()
      if (!userData.user || !userData.user.id) {
        throw new Error('User ID tidak ditemukan')
      }
      const userId = userData.user.id

      // Create mitra payload (matching edit page format)
      const payload = {
        userId,
        businessName: profile.name,
        tagline: profile.tagline || null,
        description: profile.description || null,
        banner: profile.banner || null,
        address: profile.address,
        city: profile.city,
        province: profile.province,
        phone: profile.phone,
        whatsapp: profile.phone,
        email: profile.email || null,
        website: profile.website || null,
        features: profile.features,
        weekdayHours: profile.hours.weekday || null,
        weekendHours: profile.hours.weekend || null,
        latitude: profile.latitude || null,
        longitude: profile.longitude || null,
        isApproved: profile.isApproved,
        services: profile.services.map((svc) => ({
          name: svc.name,
          price: svc.price,
          icon: svc.icon,
          description: null,
        })),
        images: profile.gallery.map((url) => ({ url })),
      }

      const res = await fetch('/api/admin/mitras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Gagal menambahkan toko')
      }

      toast.success('Cabang toko berhasil ditambahkan!')
      router.push('/dashboard/admin/mitras')
    } catch (error) {
      console.error('Error:', error)
      toast.error(
        error instanceof Error ? error.message : 'Gagal menambahkan cabang toko'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="mx-auto max-w-6xl space-y-6 pb-16 pt-1"
      suppressHydrationWarning
    >
      {/* 1. Header Hero Section */}
      <div className="shadow-xs flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
            <Store className="h-3.5 w-3.5 text-orange-500" />
            <span>Pendaftaran Toko Baru</span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            Tambah Toko Baru
          </h1>

          <p className="max-w-xl text-xs text-slate-600 dark:text-slate-400 sm:text-sm">
            Buat akun admin, daftarkan jam operasional, dan lokasi koordinat
            Maps toko resmi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/admin/mitras"
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <span>← Kembali ke Daftar Toko</span>
          </Link>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-orange-500 px-6 py-2.5 text-xs font-semibold text-white shadow-sm shadow-orange-500/25 transition-all hover:bg-orange-600 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Simpan Toko</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Tabs */}
      <div className="shadow-xs no-scrollbar flex items-center gap-2 overflow-x-auto rounded-3xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        {[
          { id: 'user', label: 'Data Pemilik & Admin', icon: UserPlus },
          { id: 'info', label: 'Informasi Toko', icon: Store },
          { id: 'contact', label: 'Kontak & Rekening', icon: Phone },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 ${
              activeTab === tab.id
                ? 'shadow-xs bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 3. Content Card */}
      <div className="shadow-xs rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        {/* User Tab */}
        {activeTab === 'user' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900">
              Data Akun Admin Toko
            </h3>
            <p className="text-sm text-gray-500">
              Masukkan data akun pengelola cabang toko yang akan didaftarkan
            </p>

            {/* New User Form */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Nama penanggung jawab"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  No. Telepon
                </label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) =>
                    setNewUser({ ...newUser, phone: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="081234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                    className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Auto-generate jika kosong"
                  />
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="rounded-xl bg-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-300"
                  >
                    Generate
                  </button>
                </div>
              </div>
            </div>

            {/* Approval checkbox */}
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <input
                type="checkbox"
                id="isApproved"
                checked={profile.isApproved}
                onChange={(e) =>
                  setProfile({ ...profile, isApproved: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300 text-green-600"
              />
              <label
                htmlFor="isApproved"
                className="text-sm font-medium text-gray-700"
              >
                Verifikasi dan aktifkan cabang toko langsung (Status Aktif)
              </label>
            </div>
          </div>
        )}

        {/* Info Tab */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900">Informasi Dasar</h3>

            {/* Banner Upload */}
            <ImageUpload
              label="Banner Toko"
              value={profile.banner}
              onChange={(url) => setProfile({ ...profile, banner: url })}
              onRemove={() => setProfile({ ...profile, banner: '' })}
              folder="affiliate-gadget/banners"
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Nama Toko <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                  placeholder="Contoh: TechCare Pro Service"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Tagline
                </label>
                <input
                  type="text"
                  value={profile.tagline}
                  onChange={(e) =>
                    setProfile({ ...profile, tagline: e.target.value })
                  }
                  placeholder="Contoh: Solusi Teknologi Terpercaya"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Deskripsi Toko
              </label>
              <textarea
                value={profile.description}
                onChange={(e) =>
                  setProfile({ ...profile, description: e.target.value })
                }
                placeholder="Jelaskan tentang toko Anda..."
                rows={4}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Alamat Lengkap <span className="text-red-500">*</span>
              </label>
              <textarea
                value={profile.address}
                onChange={(e) =>
                  setProfile({ ...profile, address: e.target.value })
                }
                placeholder="Masukkan alamat lengkap fisik toko (Jalan, No, RT/RW, Kecamatan)..."
                rows={3}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Kota <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={profile.city}
                  onChange={(e) =>
                    setProfile({ ...profile, city: e.target.value })
                  }
                  placeholder="Contoh: Jakarta Pusat"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Provinsi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={profile.province}
                  onChange={(e) =>
                    setProfile({ ...profile, province: e.target.value })
                  }
                  placeholder="Contoh: DKI Jakarta"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Features */}
            <div>
              <label className="mb-3 block text-sm font-medium text-gray-700">
                Keunggulan Toko
              </label>
              <div className="mb-4">
                <p className="mb-2 text-xs text-gray-500">Pilih dari saran:</p>
                <div className="flex flex-wrap gap-2">
                  {FEATURE_OPTIONS.map((feature) => (
                    <button
                      key={feature}
                      type="button"
                      onClick={() => toggleFeature(feature)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        profile.features.includes(feature)
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {profile.features.includes(feature) && (
                        <CheckCircle className="mr-1 inline h-4 w-4" />
                      )}
                      {feature}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom feature */}
              <div className="mb-4">
                <p className="mb-2 text-xs text-gray-500">
                  Atau tambahkan keunggulan custom:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustomFeature()}
                    placeholder="Contoh: Buka 24 Jam"
                    maxLength={MAX_FEATURE_LENGTH}
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    type="button"
                    onClick={addCustomFeature}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                  >
                    <Plus className="inline h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Selected features */}
              {profile.features.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-gray-700">
                    Keunggulan terpilih:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.features.map((feature, index) => (
                      <div
                        key={index}
                        className="group relative rounded-full bg-green-600 px-4 py-2 pr-8 text-sm font-medium text-white"
                      >
                        {feature}
                        <button
                          type="button"
                          onClick={() => removeFeature(feature)}
                          className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-1 opacity-0 transition-all hover:bg-white/30 group-hover:opacity-100"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900">
              Kontak & Jam Operasional
            </h3>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Phone className="h-4 w-4" /> Nomor Telepon{' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile({ ...profile, phone: e.target.value })
                  }
                  placeholder="+62 812-xxxx-xxxx"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Mail className="h-4 w-4" /> Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) =>
                    setProfile({ ...profile, email: e.target.value })
                  }
                  placeholder="toko@email.com"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Globe className="h-4 w-4" /> Website (opsional)
                </label>
                <input
                  type="text"
                  value={profile.website}
                  onChange={(e) =>
                    setProfile({ ...profile, website: e.target.value })
                  }
                  placeholder="www.toko-anda.com"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Clock className="h-4 w-4" /> Jam Buka (Weekday)
                </label>
                <input
                  type="text"
                  value={profile.hours.weekday}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      hours: { ...profile.hours, weekday: e.target.value },
                    })
                  }
                  placeholder="Senin - Sabtu: 09:00 - 18:00"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Clock className="h-4 w-4" /> Jam Buka (Weekend)
                </label>
                <input
                  type="text"
                  value={profile.hours.weekend}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      hours: { ...profile.hours, weekend: e.target.value },
                    })
                  }
                  placeholder="Minggu: Tutup / 10:00 - 15:00"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
