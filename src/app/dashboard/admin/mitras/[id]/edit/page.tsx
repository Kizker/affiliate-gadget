'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Loader2,
  Save,
  Building2,
  MapPin,
  Phone,
  Clock,
  ShieldCheck,
  Store,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface StoreDetail {
  id: string
  businessName: string
  name?: string
  slug?: string
  companyName?: string
  taxId?: string | null
  tagline: string | null
  description: string | null
  banner: string | null
  address: string
  city: string
  province: string
  postalCode?: string | null
  latitude: number | null
  longitude: number | null
  phone: string
  whatsapp: string | null
  email: string | null
  website: string | null
  features: string[]
  weekdayHours: string | null
  weekendHours: string | null
  isApproved: boolean
  isActive: boolean
  user: {
    id: string
    name: string | null
    email: string
  }
}

export default function EditStorePage() {
  const router = useRouter()
  const params = useParams()
  const storeId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [store, setStore] = useState<StoreDetail | null>(null)

  // Form data
  const [formData, setFormData] = useState({
    businessName: '',
    tagline: '',
    description: '',
    banner: '',
    address: '',
    city: '',
    province: '',
    latitude: '',
    longitude: '',
    phone: '',
    whatsapp: '',
    email: '',
    website: '',
    features: [] as string[],
    weekdayHours: '',
    weekendHours: '',
    isApproved: false,
    isActive: true,
  })

  // Fetch store data
  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await fetch(`/api/admin/mitras/${storeId}`)
        if (!res.ok) {
          throw new Error('Failed to fetch store')
        }
        const data = await res.json()
        setStore(data)

        // Populate form
        setFormData({
          businessName: data.name || data.businessName || '',
          tagline: data.tagline || '',
          description: data.description || '',
          banner: data.banner || '',
          address: data.address || '',
          city: data.city || '',
          province: data.province || '',
          latitude: data.latitude?.toString() || '',
          longitude: data.longitude?.toString() || '',
          phone: data.phone || '',
          whatsapp: data.whatsapp || '',
          email: data.email || '',
          website: data.website || '',
          features: data.features || [],
          weekdayHours: data.weekdayHours || 'Senin - Jumat: 10:00 - 21:00',
          weekendHours: data.weekendHours || 'Sabtu - Minggu: 10:00 - 21:30',
          isApproved: data.isApproved || false,
          isActive: data.isActive !== false,
        })
      } catch (error) {
        console.error('Error fetching store:', error)
        toast.error('Gagal memuat data toko')
        router.push('/dashboard/admin/mitras')
      } finally {
        setLoading(false)
      }
    }

    if (storeId) {
      fetchStore()
    }
  }, [storeId, router])

  const toggleFeature = (feature: string) => {
    const features = formData.features.includes(feature)
      ? formData.features.filter((f) => f !== feature)
      : [...formData.features, feature]
    setFormData({ ...formData, features })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        businessName: formData.businessName,
        tagline: formData.tagline || null,
        description: formData.description || null,
        banner: formData.banner || null,
        address: formData.address,
        city: formData.city,
        province: formData.province,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        phone: formData.phone,
        whatsapp: formData.whatsapp || null,
        email: formData.email || null,
        website: formData.website || null,
        features: formData.features,
        weekdayHours: formData.weekdayHours || null,
        weekendHours: formData.weekendHours || null,
        isApproved: formData.isApproved,
        isActive: formData.isActive,
      }

      const res = await fetch(`/api/admin/mitras/${storeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update store')
      }

      toast.success('Data toko berhasil diperbarui!')
      router.refresh()
      router.push('/dashboard/admin/mitras')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Gagal memperbarui data toko'
      )
    } finally {
      setSaving(false)
    }
  }

  const availableFeatures = [
    'Garansi Resmi 30 Hari',
    'Teknisi Bersertifikat',
    'Servis LCD Kilat 2 Jam',
    'Pengiriman Gojek Instant',
    'Ekspedisi JNE Terproteksi',
    'Pembayaran QRIS / Mandiri',
    'Ruang Tunggu Ber-AC',
    'Free Konsultasi Unit',
  ]

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-slate-900 dark:text-white" />
      </div>
    )
  }

  if (!store) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-xs font-semibold text-slate-500">Data toko tidak ditemukan</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-20 pt-1" suppressHydrationWarning>
      {/* Top Floating Control Bar */}
      <div className="flex items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/admin/mitras"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white dark:bg-slate-900 dark:border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali</span>
          </Link>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-none">
            {formData.businessName || 'Profil Toko'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {store.slug && (
            <Link
              href={`/toko/${store.slug}`}
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white dark:bg-slate-900 dark:border-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <span>Halaman Publik</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 dark:bg-white px-5 py-1.5 text-xs font-bold text-white dark:text-slate-950 shadow-xs hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-95 transition disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN (8 Cols): MAIN STORE DATA                                    */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Card 1: Profil & Identitas Toko */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <Store className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Identitas & Profil Toko
                </h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Nama unit cabang, tagline, dan deskripsi publik
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Toko / Cabang <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={(e) =>
                    setFormData({ ...formData, businessName: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200/80 bg-slate-50/50 dark:bg-slate-800/50 dark:border-slate-700/80 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none transition focus:border-slate-900 focus:bg-white dark:focus:border-slate-400 dark:focus:bg-slate-850 shadow-2xs"
                  placeholder="Contoh: Affiliate Gadget - Roxy Mas Jakarta"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tagline Singkat
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) =>
                    setFormData({ ...formData, tagline: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200/80 bg-slate-50/50 dark:bg-slate-800/50 dark:border-slate-700/80 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none transition focus:border-slate-900 focus:bg-white dark:focus:border-slate-400 dark:focus:bg-slate-850 shadow-2xs"
                  placeholder="Pusat Gadget & Flagship Store Jakarta Pusat"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi Toko
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200/80 bg-slate-50/50 dark:bg-slate-800/50 dark:border-slate-700/80 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none transition focus:border-slate-900 focus:bg-white dark:focus:border-slate-400 dark:focus:bg-slate-850 shadow-2xs resize-none"
                  placeholder="Jelaskan layanan toko, fasilitas, dan keunggulan unit..."
                />
              </div>
            </div>
          </div>

          {/* Card 2: Alamat Fisik & Titik Logistik */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Alamat Fisik & Titik Logistik
                </h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Titik penjemputan paket kurir JNE dan Gojek Instant
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Alamat Lengkap <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200/80 bg-slate-50/50 dark:bg-slate-800/50 dark:border-slate-700/80 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none transition focus:border-slate-900 focus:bg-white dark:focus:border-slate-400 dark:focus:bg-slate-850 shadow-2xs resize-none"
                  placeholder="Gedung / Mall, Lantai, No. Unit, Jalan, Kelurahan, Kecamatan"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kota / Kabupaten <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200/80 bg-slate-50/50 dark:bg-slate-800/50 dark:border-slate-700/80 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none transition focus:border-slate-900 focus:bg-white dark:focus:border-slate-400 dark:focus:bg-slate-850 shadow-2xs"
                    placeholder="Jakarta Pusat"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Provinsi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.province}
                    onChange={(e) =>
                      setFormData({ ...formData, province: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200/80 bg-slate-50/50 dark:bg-slate-800/50 dark:border-slate-700/80 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none transition focus:border-slate-900 focus:bg-white dark:focus:border-slate-400 dark:focus:bg-slate-850 shadow-2xs"
                    placeholder="DKI Jakarta"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Kontak CS & Telepon */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Kontak Saluran Pelayanan CS
                </h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Nomor telepon toko dan WhatsApp CS untuk pemesanan/konsultasi
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor Telepon Toko <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200/80 bg-slate-50/50 dark:bg-slate-800/50 dark:border-slate-700/80 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none transition focus:border-slate-900 focus:bg-white dark:focus:border-slate-400 dark:focus:bg-slate-850 shadow-2xs font-mono"
                  placeholder="021-63859988"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor WhatsApp CS / Sales
                </label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsapp: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200/80 bg-slate-50/50 dark:bg-slate-800/50 dark:border-slate-700/80 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none transition focus:border-slate-900 focus:bg-white dark:focus:border-slate-400 dark:focus:bg-slate-850 shadow-2xs font-mono"
                  placeholder="6281288997701"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN (4 Cols): META & OPERATIONAL SETTINGS                       */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Card: Akun Pengelola Toko */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Entitas Toko
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                <span className="h-1 w-1 rounded-full bg-emerald-500" />
                Aktif
              </span>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 block">
                  Badan Usaha / Penanggung Jawab
                </span>
                <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                  {store.companyName || store.user.name || 'PT Gadget Jaya Sentosa'}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 block">
                  Email Akun Cabang
                </span>
                <p className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300 mt-0.5 truncate">
                  {store.user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Card: Status Operasional Switch */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <ShieldCheck className="h-4 w-4 text-slate-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Status Operasional
              </h3>
            </div>

            <div className="space-y-2.5">
              <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                <input
                  type="checkbox"
                  checked={formData.isApproved}
                  onChange={(e) =>
                    setFormData({ ...formData, isApproved: e.target.checked })
                  }
                  className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-slate-950 focus:ring-0 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Status Terverifikasi
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight block">
                    Lencana terverifikasi publik
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-slate-950 focus:ring-0 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Toko Aktif Beroperasi
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight block">
                    Bisa menerima pesanan & checkout
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Card: Jam Operasional */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <Clock className="h-4 w-4 text-slate-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Jam Operasional
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Hari Kerja (Senin - Jumat)
                </label>
                <input
                  type="text"
                  value={formData.weekdayHours}
                  onChange={(e) =>
                    setFormData({ ...formData, weekdayHours: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200/80 bg-slate-50/50 dark:bg-slate-800/50 dark:border-slate-700/80 px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-white outline-none transition focus:border-slate-900 focus:bg-white dark:focus:border-slate-400 dark:focus:bg-slate-850 shadow-2xs"
                  placeholder="10:00 - 21:00"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Akhir Pekan (Sabtu - Minggu)
                </label>
                <input
                  type="text"
                  value={formData.weekendHours}
                  onChange={(e) =>
                    setFormData({ ...formData, weekendHours: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200/80 bg-slate-50/50 dark:bg-slate-800/50 dark:border-slate-700/80 px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-white outline-none transition focus:border-slate-900 focus:bg-white dark:focus:border-slate-400 dark:focus:bg-slate-850 shadow-2xs"
                  placeholder="10:00 - 21:30"
                />
              </div>
            </div>
          </div>

          {/* Card: Fasilitas Toko */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <Sparkles className="h-4 w-4 text-slate-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Fasilitas & Keunggulan
              </h3>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {availableFeatures.map((feature) => {
                const isSelected = formData.features.includes(feature)
                return (
                  <button
                    key={feature}
                    type="button"
                    onClick={() => toggleFeature(feature)}
                    className={`rounded-full border px-2.5 py-1 text-left text-[10px] font-semibold transition-all ${
                      isSelected
                        ? 'border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950 shadow-2xs'
                        : 'border-slate-200/80 bg-slate-50/60 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {feature}
                  </button>
                )
              })}
            </div>
          </div>

        </div>

      </form>
    </div>
  )
}
