'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Loader2, Upload, X, Save } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Mitra {
  id: string
  userId: string
  businessName: string
  tagline: string | null
  description: string | null
  banner: string | null
  address: string
  city: string
  province: string
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

export default function EditMitraPage() {
  const router = useRouter()
  const params = useParams()
  const mitraId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mitra, setMitra] = useState<Mitra | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)

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

  // Fetch mitra data
  useEffect(() => {
    const fetchMitra = async () => {
      try {
        const res = await fetch(`/api/admin/mitras/${mitraId}`)
        if (!res.ok) {
          throw new Error('Failed to fetch mitra')
        }
        const data = await res.json()
        setMitra(data)

        // Populate form
        setFormData({
          businessName: data.businessName || '',
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
          weekdayHours: data.weekdayHours || '',
          weekendHours: data.weekendHours || '',
          isApproved: data.isApproved || false,
          isActive: data.isActive !== false,
        })

        if (data.banner) {
          setBannerPreview(data.banner)
        }
      } catch (error) {
        console.error('Error fetching mitra:', error)
        toast.error('Gagal memuat data mitra')
        router.push('/dashboard/admin/mitras')
      } finally {
        setLoading(false)
      }
    }

    if (mitraId) {
      fetchMitra()
    }
  }, [mitraId, router])

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setBannerPreview(reader.result as string)
        setFormData({ ...formData, banner: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const removeBanner = () => {
    setBannerPreview(null)
    setFormData({ ...formData, banner: '' })
  }

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

      const res = await fetch(`/api/admin/mitras/${mitraId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update mitra')
      }

      toast.success('Mitra berhasil diupdate!')
      router.refresh() // Refresh to get latest data
      router.push('/dashboard/admin/mitras')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Gagal mengupdate mitra'
      )
    } finally {
      setSaving(false)
    }
  }

  const availableFeatures = [
    'AC',
    'Parking',
    'WiFi',
    'Waiting Room',
    'Coffee',
    'Toilet',
    'Prayer Room',
    'Wheelchair Access',
  ]

  const indonesianProvinces = [
    'Aceh',
    'Bali',
    'Banten',
    'Bengkulu',
    'DI Yogyakarta',
    'DKI Jakarta',
    'Gorontalo',
    'Jambi',
    'Jawa Barat',
    'Jawa Tengah',
    'Jawa Timur',
    'Kalimantan Barat',
    'Kalimantan Selatan',
    'Kalimantan Tengah',
    'Kalimantan Timur',
    'Kalimantan Utara',
    'Kepulauan Bangka Belitung',
    'Kepulauan Riau',
    'Lampung',
    'Maluku',
    'Maluku Utara',
    'Nusa Tenggara Barat',
    'Nusa Tenggara Timur',
    'Papua',
    'Papua Barat',
    'Riau',
    'Sulawesi Barat',
    'Sulawesi Selatan',
    'Sulawesi Tengah',
    'Sulawesi Tenggara',
    'Sulawesi Utara',
    'Sumatera Barat',
    'Sumatera Selatan',
    'Sumatera Utara',
  ]

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    )
  }

  if (!mitra) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Mitra not found</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/dashboard/admin/mitras"
          className="mb-4 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Mitras
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Mitra</h1>
        <p className="mt-2 text-gray-600">
          Update mitra profile and business information
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* User Information (Read-only) */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              User Account
            </h2>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="mt-1 text-gray-900">
                    {mitra.user.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="mt-1 text-gray-900">{mitra.user.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Business Information Section */}
          <div className="border-t pt-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Business Information
            </h2>
            <div className="space-y-6">
              {/* Banner Upload */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Banner
                </label>
                {bannerPreview ? (
                  <div className="relative inline-block">
                    <img
                      src={bannerPreview}
                      alt="Banner Preview"
                      className="h-32 w-full max-w-md rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeBanner}
                      className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex h-32 w-full max-w-md cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <span className="mt-2 text-sm text-gray-500">
                      Upload Banner
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Business Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) =>
                      setFormData({ ...formData, businessName: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) =>
                      setFormData({ ...formData, tagline: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="border-t pt-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Location
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Province <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.province}
                    onChange={(e) =>
                      setFormData({ ...formData, province: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                  >
                    <option value="">Select Province</option>
                    {indonesianProvinces.map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) =>
                      setFormData({ ...formData, latitude: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) =>
                      setFormData({ ...formData, longitude: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="border-t pt-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Contact Information
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsapp: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Business Details Section */}
          <div className="border-t pt-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Business Details
            </h2>
            <div className="space-y-6">
              {/* Features */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Facilities
                </label>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {availableFeatures.map((feature) => (
                    <button
                      key={feature}
                      type="button"
                      onClick={() => toggleFeature(feature)}
                      className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all ${
                        formData.features.includes(feature)
                          ? 'border-green-600 bg-green-50 text-green-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {feature}
                    </button>
                  ))}
                </div>
              </div>

              {/* Operating Hours */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Weekday Hours
                  </label>
                  <input
                    type="text"
                    value={formData.weekdayHours}
                    onChange={(e) =>
                      setFormData({ ...formData, weekdayHours: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                    placeholder="09:00 - 18:00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Weekend Hours
                  </label>
                  <input
                    type="text"
                    value={formData.weekendHours}
                    onChange={(e) =>
                      setFormData({ ...formData, weekendHours: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                    placeholder="10:00 - 16:00"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Status Section */}
          <div className="border-t pt-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Status Management
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isApproved"
                  checked={formData.isApproved}
                  onChange={(e) =>
                    setFormData({ ...formData, isApproved: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <label
                  htmlFor="isApproved"
                  className="text-sm font-medium text-gray-700"
                >
                  Approved
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <label
                  htmlFor="isActive"
                  className="text-sm font-medium text-gray-700"
                >
                  Active
                </label>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 border-t pt-6">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 font-medium text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 inline h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
            <Link
              href="/dashboard/admin/mitras"
              className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
