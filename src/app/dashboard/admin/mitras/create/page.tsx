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
  Edit3,
  Image as ImageIcon,
  ArrowLeft,
  UserPlus,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import ImageUpload from '@/components/upload/image-upload'
import MultiImageUpload from '@/components/upload/multi-image-upload'
import GoogleMapsAutocomplete from '@/components/maps/google-maps-autocomplete'
import GoogleMapsProvider from '@/components/maps/google-maps-provider'

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
        throw new Error(error.error || 'Gagal membuat mitra')
      }

      toast.success('Mitra berhasil dibuat!')
      router.push('/dashboard/admin/mitras')
    } catch (error) {
      console.error('Error:', error)
      toast.error(
        error instanceof Error ? error.message : 'Gagal membuat mitra'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Abstract Background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-green-400/20 blur-[100px]" />
        <div className="absolute right-[-10%] top-[10%] h-[600px] w-[600px] rounded-full bg-emerald-400/20 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[20%] h-[500px] w-[500px] rounded-full bg-teal-300/20 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href="/dashboard/admin/mitras"
              className="mb-4 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Mitra
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Tambah Mitra Baru
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Buat akun mitra dan profil bisnis sekaligus
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 font-medium text-white shadow-lg shadow-green-600/20 transition-all hover:shadow-xl disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Buat Mitra
              </>
            )}
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {[
            { id: 'user', label: 'Data Pemilik', icon: UserPlus },
            { id: 'info', label: 'Informasi Dasar', icon: Store },
            { id: 'services', label: 'Layanan', icon: Edit3 },
            { id: 'gallery', label: 'Galeri', icon: ImageIcon },
            { id: 'contact', label: 'Kontak', icon: Phone },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 shadow-sm hover:bg-gray-50'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Card */}
        <div className="rounded-[2rem] border border-white/60 bg-white/60 p-6 shadow-xl backdrop-blur-xl">
          {/* User Tab */}
          {activeTab === 'user' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900">Data Pemilik</h3>
              <p className="text-sm text-gray-500">
                Masukkan data pemilik mitra yang akan didaftarkan
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
                    placeholder="Nama pemilik"
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
                  Approve mitra langsung (skip pending status)
                </label>
              </div>
            </div>
          )}

          {/* Info Tab */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900">
                Informasi Dasar
              </h3>

              {/* Banner Upload */}
              <ImageUpload
                label="Banner Toko"
                value={profile.banner}
                onChange={(url) => setProfile({ ...profile, banner: url })}
                onRemove={() => setProfile({ ...profile, banner: '' })}
                folder="halotekno/banners"
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
                <p className="mb-2 text-xs text-gray-500">
                  Gunakan Google Maps untuk memilih lokasi yang akurat
                </p>
                <GoogleMapsProvider>
                  <GoogleMapsAutocomplete
                    defaultValue={profile.address}
                    placeholder="Cari alamat menggunakan Google Maps..."
                    onPlaceSelected={(place) => {
                      setProfile({
                        ...profile,
                        address: place.address,
                        city: place.city,
                        province: place.province || place.city, // fallback to city if no province
                        latitude: place.latitude,
                        longitude: place.longitude,
                      })
                      toast.success(`Lokasi dipilih: ${place.city}`, {
                        description: place.address,
                      })
                    }}
                  />
                </GoogleMapsProvider>
                {profile.address && (
                  <p className="mt-2 text-xs text-gray-600">
                    📍 {profile.address}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Kota <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={profile.city}
                  readOnly
                  placeholder="Akan terisi otomatis dari Google Maps"
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Kota akan terisi otomatis saat Anda memilih alamat
                </p>
              </div>

              {/* Features */}
              <div>
                <label className="mb-3 block text-sm font-medium text-gray-700">
                  Keunggulan Toko
                </label>
                <div className="mb-4">
                  <p className="mb-2 text-xs text-gray-500">
                    Pilih dari saran:
                  </p>
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

          {/* Services Tab */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900">
                Layanan yang Ditawarkan
              </h3>

              {/* Add Service Form */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <select
                    value={newService.icon}
                    onChange={(e) =>
                      setNewService({ ...newService, icon: e.target.value })
                    }
                    className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-2xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {SERVICE_ICONS.map((icon) => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newService.name}
                    onChange={(e) =>
                      setNewService({ ...newService, name: e.target.value })
                    }
                    placeholder="Nama layanan"
                    className="rounded-lg border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="text"
                    value={newService.price}
                    onChange={(e) =>
                      setNewService({ ...newService, price: e.target.value })
                    }
                    placeholder="Mulai dari Rp..."
                    className="rounded-lg border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    onClick={addService}
                    className="flex items-center justify-center gap-2 rounded-lg bg-green-600 font-medium text-white transition-all hover:bg-green-700"
                  >
                    <Plus className="h-5 w-5" />
                    Tambah
                  </button>
                </div>
              </div>

              {/* Services List */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {profile.services.map((service, index) => (
                  <div
                    key={index}
                    className="group relative rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
                  >
                    <button
                      onClick={() => removeService(index)}
                      className="absolute right-2 top-2 rounded-full bg-red-100 p-1 text-red-600 opacity-0 transition-all hover:bg-red-600 hover:text-white group-hover:opacity-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="mb-2 text-3xl">{service.icon}</div>
                    <h4 className="font-semibold text-gray-900">
                      {service.name}
                    </h4>
                    <p className="text-sm text-green-600">{service.price}</p>
                  </div>
                ))}
                {profile.services.length === 0 && (
                  <div className="col-span-full py-12 text-center text-gray-400">
                    Belum ada layanan. Tambahkan layanan pertama!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Gallery Tab */}
          {activeTab === 'gallery' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900">Galeri Foto</h3>

              <MultiImageUpload
                label="Galeri Foto Toko"
                value={profile.gallery}
                onChange={(urls) => setProfile({ ...profile, gallery: urls })}
                maxImages={8}
                folder="halotekno/gallery"
              />
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
    </div>
  )
}
