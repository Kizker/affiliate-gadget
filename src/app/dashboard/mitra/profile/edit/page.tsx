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
  Eye,
  ArrowLeft,
  Wrench,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import ImageUpload from '@/components/upload/image-upload'
import MultiImageUpload from '@/components/upload/multi-image-upload'
import { motion } from 'framer-motion'

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
  province: string
  address: string
  phone: string
  whatsapp: string
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
  province: '',
  address: '',
  phone: '',
  whatsapp: '',
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
  'Buka Setiap Hari',
  'Pembayaran Cicilan',
]

const SERVICE_ICONS = [
  '📱',
  '💻',
  '🖥️',
  '⚡',
  '💾',
  '🧹',
  '🔧',
  '🎮',
  '📀',
  '🔌',
]

export default function MitraProfileEdit() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<MitraProfile>(DEFAULT_PROFILE)
  const [loading, setLoading] = useState(false)
  const [fetchingProfile, setFetchingProfile] = useState(true)
  const [activeTab, setActiveTab] = useState<
    'info' | 'services' | 'gallery' | 'contact'
  >('info')
  const [newService, setNewService] = useState({
    name: '',
    price: '',
    icon: '📱',
  })
  const [newFeature, setNewFeature] = useState('')
  const MAX_FEATURE_LENGTH = 30
  const [mitraId, setMitraId] = useState<string | null>(null)

  // Redirect pending mitra FIRST
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
        const response = await fetch('/api/mitra/profile', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        })
        if (response.ok) {
          const data = await response.json()

          if (data.id) {
            setMitraId(data.id)
          }

          // Transform API data to match frontend state
          setProfile({
            name: data.businessName || '',
            tagline: data.tagline || '',
            description: data.description || '',
            city: data.city || '',
            province: data.province || '',
            address: data.address || '',
            phone: data.phone || '',
            whatsapp: data.whatsapp || data.phone || '',
            email: data.email || '',
            website: data.website || '',
            banner: data.banner || '',
            gallery: data.images?.map((img: { url: string }) => img.url) || [],
            services:
              data.services?.map(
                (svc: {
                  name: string
                  price?: number | string
                  icon?: string
                }) => ({
                  name: svc.name,
                  price: svc.price ? String(svc.price) : '',
                  icon: svc.icon || '📱',
                })
              ) || [],
            features: Array.isArray(data.features) ? data.features : [],
            hours: {
              weekday: data.weekdayHours || 'Senin - Sabtu: 09:00 - 18:00',
              weekend: data.weekendHours || 'Minggu: Tutup',
            },
          })
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setFetchingProfile(false)
      }
    }

    if (status === 'authenticated') {
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

  // Calculate profile completion (10 criteria)
  const getProfileCompletion = () => {
    let completed = 0
    const total = 10
    if (profile.name?.trim()) completed++
    if (profile.tagline?.trim()) completed++
    if (profile.description?.trim()) completed++
    if (profile.address?.trim()) completed++
    if (profile.city?.trim()) completed++
    if (profile.phone?.trim()) completed++
    if (profile.banner?.trim()) completed++
    if (profile.services.length > 0) completed++
    if (profile.gallery.length > 0) completed++
    if (profile.features.length > 0) completed++
    return Math.round((completed / total) * 100)
  }

  const completion = getProfileCompletion()

  const handleSave = async () => {
    // Form validation
    if (!profile.name.trim()) {
      toast.error('Nama toko wajib diisi')
      setActiveTab('info')
      return
    }
    if (!profile.address.trim()) {
      toast.error('Alamat lengkap toko wajib diisi')
      setActiveTab('info')
      return
    }
    if (!profile.city.trim()) {
      toast.error('Kota toko wajib diisi')
      setActiveTab('info')
      return
    }
    if (!profile.phone.trim()) {
      toast.error('Nomor telepon / WhatsApp toko wajib diisi')
      setActiveTab('contact')
      return
    }

    setLoading(true)

    try {
      // Transform frontend state to API format
      const payload = {
        businessName: profile.name.trim(),
        tagline: profile.tagline.trim(),
        description: profile.description.trim(),
        banner: profile.banner || null,
        address: profile.address.trim(),
        city: profile.city.trim(),
        province: profile.province.trim() || 'DKI Jakarta',
        phone: profile.phone.trim(),
        whatsapp: (profile.whatsapp || profile.phone).trim(),
        email: profile.email.trim() || null,
        website: profile.website.trim() || null,
        features: profile.features,
        weekdayHours: profile.hours.weekday,
        weekendHours: profile.hours.weekend,
        latitude: profile.latitude || null,
        longitude: profile.longitude || null,
        services: profile.services
          .filter((svc) => svc.name.trim())
          .map((svc) => ({
            name: svc.name.trim(),
            price: svc.price.trim(),
            icon: svc.icon || '📱',
            description: null,
          })),
        images: profile.gallery.filter(Boolean).map((url) => ({ url })),
      }

      const response = await fetch('/api/mitra/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menyimpan profil')
      }

      if (data.id) {
        setMitraId(data.id)
      }

      // Check whether this mitra was pending or approved
      if (data.isPendingReview) {
        toast.success(
          'Profil toko berhasil disimpan dan dikirim ke Admin untuk ditinjau!'
        )
        router.push('/dashboard/mitra/pending')
      } else {
        toast.success('Seluruh data profil toko berhasil disimpan!')
        router.push('/dashboard/mitra')
      }
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
    if (!newService.name.trim()) {
      toast.error('Nama layanan servis wajib diisi')
      return
    }
    if (!newService.price.trim()) {
      toast.error('Estimasi harga layanan wajib diisi')
      return
    }

    setProfile({
      ...profile,
      services: [...profile.services, { ...newService }],
    })
    setNewService({ name: '', price: '', icon: '📱' })
    toast.success('Layanan servis ditambahkan!')
  }

  const removeService = (index: number) => {
    setProfile({
      ...profile,
      services: profile.services.filter((_, i) => i !== index),
    })
    toast.success('Layanan dihapus dari daftar')
  }

  const toggleFeature = (feature: string) => {
    if (profile.features.includes(feature)) {
      setProfile({
        ...profile,
        features: profile.features.filter((f) => f !== feature),
      })
    } else {
      if (profile.features.length >= 5) {
        toast.error('Maksimal 5 elemen keunggulan yang dapat dipilih')
        return
      }
      setProfile({
        ...profile,
        features: [...profile.features, feature],
      })
    }
  }

  const addCustomFeature = () => {
    const trimmed = newFeature.trim()
    if (profile.features.length >= 5) {
      toast.error('Maksimal 5 elemen keunggulan yang dapat ditambahkan')
      return
    }
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

  if (status === 'loading' || fetchingProfile) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-xs font-semibold text-slate-500">
            Memuat profil tokomu...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-4 sm:py-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Top Navigation Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <Link href="/dashboard/mitra">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                Edit Profil Toko
              </h1>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Lengkapi identitas, galeri workshop, tarif servis, dan kontak
                resmi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {mitraId && (
              <Link href={`/rekomendasi/${mitraId}`} target="_blank">
                <button
                  type="button"
                  className="shadow-2xs inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Lihat Profil Publik</span>
                </button>
              </Link>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-5 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition hover:bg-orange-600 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              <span>{loading ? 'Menyimpan...' : 'Simpan Profil'}</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Profile Completion Bento Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="shadow-xs overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Tingkat Kelengkapan Profil
              </span>
              <h2 className="mt-0.5 text-lg font-black text-slate-900 dark:text-white sm:text-xl">
                Status Kelengkapan Toko
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                Lengkapi seluruh 10 indikator agar toko Anda memperoleh
                verifikasi penuh dan dipercaya pelanggan.
              </p>
            </div>
            <div className="flex items-center justify-start sm:justify-end">
              <div className="relative h-16 w-16 sm:h-20 sm:w-20">
                <svg className="h-full w-full -rotate-90 transform">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="42%"
                    fill="none"
                    className="stroke-slate-100 dark:stroke-slate-800"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="42%"
                    fill="none"
                    stroke="#F97316"
                    strokeWidth="8"
                    strokeDasharray={`${completion * 2.1} 210`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-base font-black text-slate-900 dark:text-white sm:text-lg">
                    {completion}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 4 Tabs Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 overflow-x-auto pb-1"
        >
          {[
            {
              id: 'info' as const,
              label: 'Informasi Toko',
              shortLabel: 'Info',
              icon: Store,
            },
            {
              id: 'services' as const,
              label: `Layanan & Tarif (${profile.services.length})`,
              shortLabel: 'Layanan',
              icon: Wrench,
            },
            {
              id: 'gallery' as const,
              label: `Galeri Workshop (${profile.gallery.length})`,
              shortLabel: 'Galeri',
              icon: ImageIcon,
            },
            {
              id: 'contact' as const,
              label: 'Kontak & Jam Buka',
              shortLabel: 'Kontak',
              icon: Phone,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition-all sm:text-sm ${
                activeTab === tab.id
                  ? 'shadow-xs bg-orange-500 text-white'
                  : 'border border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </button>
          ))}
        </motion.div>

        {/* Tab Content Box */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="shadow-xs rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8"
        >
          {/* TAB 1: BASIC INFO */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                  Informasi Dasar & Lokasi
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Data utama identitas tokomu di katalog servis platform
                </p>
              </div>

              {/* Banner Upload */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Banner Profil Toko
                </label>
                <ImageUpload
                  label="Upload Banner Toko"
                  value={profile.banner}
                  onChange={(url) => setProfile({ ...profile, banner: url })}
                  onRemove={() => setProfile({ ...profile, banner: '' })}
                  folder="banners"
                />
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Nama Toko / Workshop{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) =>
                      setProfile({ ...profile, name: e.target.value })
                    }
                    placeholder="Contoh: TechCare Pro Service"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={profile.tagline}
                    onChange={(e) =>
                      setProfile({ ...profile, tagline: e.target.value })
                    }
                    placeholder="Contoh: Solusi Perbaikan Gadget Kilat & Bergaransi"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Deskripsi Toko
                </label>
                <textarea
                  value={profile.description}
                  onChange={(e) =>
                    setProfile({ ...profile, description: e.target.value })
                  }
                  placeholder="Jelaskan tentang toko Anda, pengalaman teknisi, spesialisasi perbaikan LCD/Mesin, garansi, sertifikasi, dll..."
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Alamat Lengkap Fisik Toko{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={profile.address}
                  onChange={(e) =>
                    setProfile({ ...profile, address: e.target.value })
                  }
                  placeholder="Masukkan alamat lengkap fisik toko (Jalan, No, Lantai/Blok Mall, RT/RW, Kecamatan)..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Kota <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={profile.city}
                    onChange={(e) =>
                      setProfile({ ...profile, city: e.target.value })
                    }
                    placeholder="Contoh: Jakarta Pusat"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Provinsi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={profile.province}
                    onChange={(e) =>
                      setProfile({ ...profile, province: e.target.value })
                    }
                    placeholder="Contoh: DKI Jakarta"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                  />
                </div>
              </div>

              {/* Features Chips */}
              <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Keunggulan & Layanan Unggulan Toko
                </label>

                <div className="mb-4">
                  <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                    Pilih dari saran keunggulan:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {FEATURE_OPTIONS.map((feature) => (
                      <button
                        key={feature}
                        type="button"
                        onClick={() => toggleFeature(feature)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                          profile.features.includes(feature)
                            ? 'shadow-xs bg-orange-500 font-semibold text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                        }`}
                      >
                        {profile.features.includes(feature) && (
                          <CheckCircle className="h-3.5 w-3.5" />
                        )}
                        <span>{feature}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Feature Input */}
                <div className="mb-4">
                  <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                    Atau tambah keunggulan sendiri:
                  </p>
                  <div className="flex max-w-md gap-2">
                    <input
                      type="text"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCustomFeature()}
                      placeholder="Contoh: Teknisi Sertifikasi Apple"
                      maxLength={MAX_FEATURE_LENGTH}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={addCustomFeature}
                      className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-orange-600 active:scale-95"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {newFeature.length}/{MAX_FEATURE_LENGTH} karakter
                  </p>
                </div>

                {/* Active Features */}
                {profile.features.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Keunggulan aktif terpilih:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {profile.features.map((feature, index) => (
                        <div
                          key={index}
                          className="group relative inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-orange-50/80 px-3 py-1 text-xs font-bold text-orange-600 dark:border-orange-900/40 dark:bg-orange-950/40 dark:text-orange-400"
                        >
                          <span>{feature}</span>
                          <button
                            type="button"
                            onClick={() => removeFeature(feature)}
                            className="rounded-full p-0.5 hover:bg-orange-200 dark:hover:bg-orange-900"
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

          {/* TAB 2: SERVICES & TARIFF */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                  Layanan & Tarif Servis
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Tambahkan jenis layanan perbaikan gadget yang disediakan toko
                  Anda beserta estimasi biayanya
                </p>
              </div>

              {/* Form Tambah Layanan Baru */}
              <div className="rounded-2xl border border-orange-200/80 bg-orange-50/40 p-5 dark:border-orange-950/40 dark:bg-orange-950/20">
                <h4 className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                  + Tambah Layanan Baru
                </h4>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-12">
                  <div className="sm:col-span-5">
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Nama Layanan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newService.name}
                      onChange={(e) =>
                        setNewService({ ...newService, name: e.target.value })
                      }
                      placeholder="Contoh: Ganti LCD / Touchscreen OLED"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Estimasi Biaya <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newService.price}
                      onChange={(e) =>
                        setNewService({ ...newService, price: e.target.value })
                      }
                      placeholder="Contoh: Rp 250.000 / Mulai Rp 150rb"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                    />
                  </div>

                  <div className="flex items-end sm:col-span-3">
                    <button
                      type="button"
                      onClick={addService}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600 active:scale-95"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Tambah Layanan</span>
                    </button>
                  </div>
                </div>

                {/* Pilihan Icon */}
                <div className="mt-4">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Pilih Icon Layanan:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SERVICE_ICONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setNewService({ ...newService, icon })}
                        className={`flex h-9 w-9 items-center justify-center rounded-xl border text-base transition-all ${
                          newService.icon === icon
                            ? 'shadow-xs border-orange-500 bg-orange-100 dark:bg-orange-950/60'
                            : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Daftar Layanan yang Tersedia */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Daftar Layanan Aktif ({profile.services.length})
                  </h4>
                </div>

                {profile.services.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
                    <Wrench className="mb-2 h-10 w-10 text-slate-300 dark:text-slate-600" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Belum ada layanan servis yang didaftarkan
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                      Gunakan formulir di atas untuk menambahkan layanan servis
                      pertama tokomu
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {profile.services.map((svc, index) => (
                      <div
                        key={index}
                        className="shadow-xs flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-xl dark:bg-orange-950/40">
                            {svc.icon || '📱'}
                          </span>
                          <div>
                            <h5 className="text-xs font-bold text-slate-900 dark:text-white sm:text-sm">
                              {svc.name}
                            </h5>
                            <p className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                              {svc.price}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeService(index)}
                          className="rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                          title="Hapus Layanan"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: GALLERY */}
          {activeTab === 'gallery' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                  Galeri Foto Workshop & Toko
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Unggah foto fisik toko, suasana workshop, meja kerja teknisi,
                  atau fasilitas untuk meyakinkan calon pelanggan
                </p>
              </div>

              <MultiImageUpload
                label="Foto Galeri Toko (Maksimal 8 Foto)"
                value={profile.gallery}
                onChange={(urls) => setProfile({ ...profile, gallery: urls })}
                maxImages={8}
                folder="gallery"
              />
            </div>
          )}

          {/* TAB 4: CONTACT & HOURS */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                  Kontak & Jam Operasional
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Saluran komunikasi yang akan dihubungi oleh customer saat
                  membutuhkan bantuan teknisi
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    <Phone className="h-3.5 w-3.5 text-orange-500" />
                    <span>Nomor Telepon Toko</span>{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile({ ...profile, phone: e.target.value })
                    }
                    placeholder="021-xxxx-xxxx / 0812-xxxx-xxxx"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    <Phone className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Nomor WhatsApp Resmi</span>
                  </label>
                  <input
                    type="text"
                    value={profile.whatsapp}
                    onChange={(e) =>
                      setProfile({ ...profile, whatsapp: e.target.value })
                    }
                    placeholder="0812-xxxx-xxxx (Untuk chat konsultasi)"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    <Mail className="h-3.5 w-3.5 text-orange-500" />
                    <span>Email Bisnis</span>
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile({ ...profile, email: e.target.value })
                    }
                    placeholder="toko@email.com"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    <Globe className="h-3.5 w-3.5 text-orange-500" />
                    <span>Website Toko (opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={profile.website}
                    onChange={(e) =>
                      setProfile({ ...profile, website: e.target.value })
                    }
                    placeholder="https://toko-anda.com"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    <Clock className="h-3.5 w-3.5 text-orange-500" />
                    <span>Jam Buka (Senin - Sabtu)</span>
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
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    <Clock className="h-3.5 w-3.5 text-orange-500" />
                    <span>Jam Buka (Minggu & Libur)</span>
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
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Bottom Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 flex justify-end"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-8 py-3.5 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition hover:bg-orange-600 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{loading ? 'Menyimpan...' : 'Simpan Seluruh Data Toko'}</span>
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}
