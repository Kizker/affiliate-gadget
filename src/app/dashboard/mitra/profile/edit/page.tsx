'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
  Eye,
  ArrowLeft,
} from 'lucide-react'
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

interface MitraProfile {
  name: string
  tagline: string
  description: string
  city: string
  address: string
  phone: string
  email: string
  website: string
  banner: string
  gallery: string[]
  services: Service[]
  features: string[]
  latitude?: number
  longitude?: number
  hours: {
    weekday: string
    weekend: string
  }
}

const DEFAULT_PROFILE: MitraProfile = {
  name: '',
  tagline: '',
  description: '',
  city: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  banner: '',
  gallery: [],
  services: [],
  features: [],
  hours: {
    weekday: 'Senin - Sabtu: 09:00 - 18:00',
    weekend: 'Minggu: Tutup',
  },
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

export default function MitraDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<MitraProfile>(DEFAULT_PROFILE)
  const [loading, setLoading] = useState(false)
  const [fetchingProfile, setFetchingProfile] = useState(true)
  const [activeTab, setActiveTab] = useState('info')
  const [newService, setNewService] = useState({
    name: '',
    price: '',
    icon: '💻',
  })
  const [newFeature, setNewFeature] = useState('')
  const MAX_FEATURE_LENGTH = 30 // Character limit for custom features
  const [mitraId, setMitraId] = useState<string | null>(null)

  // Redirect pending mitra FIRST - before any other logic
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'MITRA') {
      const mitraStatus = (session.user as { mitraStatus?: string }).mitraStatus
      if (mitraStatus === 'PENDING') {
        router.push('/dashboard/mitra/pending')
      }
    }
  }, [status, session, router])

  // Fetch existing profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/mitra/profile')
        if (response.ok) {
          const data = await response.json()

          // Store mitra ID for preview
          if (data.id) {
            setMitraId(data.id)
          }

          // Transform API data to match frontend state
          setProfile({
            name: data.businessName || '',
            tagline: data.tagline || '',
            description: data.description || '',
            city: data.city || '',
            address: data.address || '',
            phone: data.phone || '',
            email: data.email || '',
            website: data.website || '',
            banner: data.banner || '',
            gallery: data.images?.map((img: { url: string }) => img.url) || [],
            services:
              data.services?.map(
                (svc: { name: string; price?: number; icon?: string }) => ({
                  name: svc.name,
                  price: svc.price || '',
                  icon: svc.icon || '💻',
                })
              ) || [],
            features: data.features || [],
            hours: {
              weekday: data.weekdayHours || 'Senin - Sabtu: 09:00 - 18:00',
              weekend: data.weekendHours || 'Minggu: Tutup',
            },
          })
        } else if (response.status === 404) {
          // Profile doesn't exist yet - this is OK for new mitra
          // Keep default profile state, don't reset
        } else {
          console.error('Error fetching profile:', response.status)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setFetchingProfile(false)
      }
    }

    if (status === 'authenticated') {
      // Don't fetch profile if pending mitra
      if (session?.user?.role === 'MITRA') {
        const mitraStatus = (session.user as { mitraStatus?: string })
          .mitraStatus
        if (mitraStatus === 'PENDING') {
          setFetchingProfile(false)
          return
        }
      }
      fetchProfile()
    }
  }, [status, session])

  // Calculate profile completion
  const getProfileCompletion = () => {
    let completed = 0
    const total = 10
    if (profile.name) completed++
    if (profile.tagline) completed++
    if (profile.description) completed++
    if (profile.address) completed++
    if (profile.city) completed++
    if (profile.phone) completed++
    if (profile.banner) completed++
    if (profile.services.length > 0) completed++
    if (profile.gallery.length > 0) completed++
    if (profile.features.length > 0) completed++
    return Math.round((completed / total) * 100)
  }

  if (status === 'loading' || fetchingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // Don't render if pending mitra (will redirect)
  if (session?.user?.role === 'MITRA') {
    const mitraStatus = (session.user as { mitraStatus?: string }).mitraStatus
    if (mitraStatus === 'PENDING') {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )
    }
  }

  const completion = getProfileCompletion()

  const handleSave = async () => {
    // Validation
    if (!profile.name || !profile.address || !profile.city || !profile.phone) {
      toast.error(
        'Mohon lengkapi data wajib: Nama Toko, Alamat, Kota, dan Telepon'
      )
      return
    }

    setLoading(true)
    try {
      // Transform frontend state to API format
      const payload = {
        businessName: profile.name,
        tagline: profile.tagline,
        description: profile.description,
        banner: profile.banner,
        address: profile.address,
        city: profile.city,
        province: '', // You can add province field if needed
        phone: profile.phone,
        whatsapp: profile.phone, // Use phone as whatsapp for now
        email: profile.email,
        website: profile.website,
        features: profile.features,
        weekdayHours: profile.hours.weekday,
        weekendHours: profile.hours.weekend,
        latitude: profile.latitude,
        longitude: profile.longitude,
        services: profile.services.map((svc) => ({
          name: svc.name,
          price: svc.price,
          icon: svc.icon,
          description: null,
        })),
        images: profile.gallery.map((url) => ({ url })),
      }

      const response = await fetch('/api/mitra/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Gagal menyimpan profil')
      }

      const data = await response.json()

      // Store mitra ID for preview
      if (data.id) {
        setMitraId(data.id)
      }

      toast.success(
        'Profil berhasil disimpan! Klik "Lihat Preview" untuk melihat hasilnya.'
      )
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error(
        error instanceof Error ? error.message : 'Gagal menyimpan profil'
      )
    } finally {
      setLoading(false)
    }
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

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Kelola Profil Bisnis
          </h1>
          <p className="mt-1 text-sm text-gray-600 sm:text-base">
            Lengkapi profil untuk tampil di halaman rekomendasi
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/mitra"
            className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Kembali ke Dashboard</span>
            <span className="sm:hidden">Kembali</span>
          </Link>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 font-medium text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 sm:flex-none"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="hidden sm:inline">Menyimpan...</span>
                <span className="sm:hidden">Simpan...</span>
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>Simpan</span>
              </>
            )}
          </button>
          {mitraId && (
            <Link
              href={`/rekomendasi/${mitraId}`}
              target="_blank"
              className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50"
            >
              <Eye className="h-5 w-5" />
              <span className="hidden sm:inline">Lihat Preview</span>
            </Link>
          )}
        </div>
      </div>

      {/* Profile Completion Card */}
      <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 p-4 shadow-xl sm:mb-8 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white sm:text-xl">
              Kelengkapan Profil
            </h2>
            <p className="mt-1 text-sm text-blue-100 sm:text-base">
              Lengkapi informasi agar tampil di rekomendasi
            </p>
          </div>
          <div className="flex items-center justify-end">
            <div className="relative h-16 w-16 sm:h-20 sm:w-20">
              <svg className="h-full w-full -rotate-90 transform">
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="8"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  fill="none"
                  stroke="white"
                  strokeWidth="8"
                  strokeDasharray={`${completion * 2.2} 220`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-white sm:text-xl">
                  {completion}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {[
          {
            id: 'info',
            label: 'Informasi Dasar',
            shortLabel: 'Info',
            icon: Store,
          },
          {
            id: 'services',
            label: 'Layanan',
            shortLabel: 'Layanan',
            icon: Edit3,
          },
          {
            id: 'gallery',
            label: 'Galeri',
            shortLabel: 'Galeri',
            icon: ImageIcon,
          },
          { id: 'contact', label: 'Kontak', shortLabel: 'Kontak', icon: Phone },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-all sm:px-5 sm:py-3 sm:text-base ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                : 'bg-white text-gray-600 shadow-sm hover:bg-gray-50'
            }`}
          >
            <tab.icon className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.shortLabel}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {/* Basic Info Tab */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900">Informasi Dasar</h3>

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
                  Nama Toko
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                  placeholder="Contoh: TechCare Pro Service"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  placeholder="Contoh: Solusi Teknologi Terpercaya Anda"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                placeholder="Jelaskan tentang toko Anda, pengalaman, keahlian, dll..."
                rows={4}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400"
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

              {/* Suggested Features */}
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
                          ? 'bg-blue-600 text-white'
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

              {/* Custom Feature Input */}
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
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addCustomFeature}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700"
                  >
                    <Plus className="inline h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  {newFeature.length}/{MAX_FEATURE_LENGTH} karakter
                </p>
              </div>

              {/* Selected Features */}
              {profile.features.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-gray-700">
                    Keunggulan terpilih:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.features.map((feature, index) => (
                      <div
                        key={index}
                        className="group relative rounded-full bg-blue-600 px-4 py-2 pr-8 text-sm font-medium text-white"
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
                  className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={newService.price}
                  onChange={(e) =>
                    setNewService({ ...newService, price: e.target.value })
                  }
                  placeholder="Mulai dari Rp..."
                  className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addService}
                  className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 font-medium text-white transition-all hover:bg-blue-700"
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
                  <p className="text-sm text-blue-600">{service.price}</p>
                </div>
              ))}
              {profile.services.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-400">
                  Belum ada layanan. Tambahkan layanan pertama Anda!
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
              key="mitra-gallery" // Prevent remount
              label="Galeri Foto Toko"
              value={profile.gallery}
              onChange={(urls) => {
                setProfile((prev) => {
                  const updated = { ...prev, gallery: urls }
                  return updated
                })
              }}
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
                  <Phone className="h-4 w-4" /> Nomor Telepon
                </label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile({ ...profile, phone: e.target.value })
                  }
                  placeholder="+62 812-xxxx-xxxx"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-4 font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </div>
  )
}
