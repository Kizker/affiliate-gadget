'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Upload, X } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface User {
  id: string
  name: string | null
  email: string
}

export default function CreateMitraPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<User[]>([])

  // User creation mode
  const [createNewUser, setCreateNewUser] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState('')

  // Image previews
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)

  // Form data
  const [formData, setFormData] = useState({
    // User fields (for new user)
    userName: '',
    userEmail: '',
    userPhone: '',
    userPassword: '',
    userImage: '',
    // Mitra fields
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
  })

  // Fetch users without mitra profile
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true)
      try {
        const res = await fetch('/api/admin/users?limit=1000')
        if (res.ok) {
          const data = await res.json()
          // Filter users without mitra profile
          const usersWithoutMitra = data.users.filter(
            (u: User & { mitra?: unknown }) => !u.mitra
          )
          setAvailableUsers(usersWithoutMitra)
        }
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setLoadingUsers(false)
      }
    }

    if (!createNewUser) {
      fetchUsers()
    }
  }, [createNewUser])

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

  const generatePassword = () => {
    const password =
      Math.random().toString(36).slice(-10) +
      Math.random().toString(36).slice(-10).toUpperCase()
    setFormData({ ...formData, userPassword: password })
    toast.success('Password generated')
  }

  const toggleFeature = (feature: string) => {
    const features = formData.features.includes(feature)
      ? formData.features.filter((f) => f !== feature)
      : [...formData.features, feature]
    setFormData({ ...formData, features })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate required fields first
      if (
        !formData.businessName ||
        !formData.address ||
        !formData.city ||
        !formData.province ||
        !formData.phone
      ) {
        toast.error('Mohon lengkapi semua field yang wajib diisi')
        setLoading(false)
        return
      }

      if (createNewUser) {
        if (!formData.userName || !formData.userEmail) {
          toast.error('Nama dan email user wajib diisi')
          setLoading(false)
          return
        }
      } else {
        if (!selectedUserId) {
          toast.error('Silakan pilih user terlebih dahulu')
          setLoading(false)
          return
        }
      }

      // Prepare payload
      const payload: Record<string, unknown> = {
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
      }

      if (createNewUser) {
        // Create new user + mitra
        // First create user
        const userRes = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.userName,
            email: formData.userEmail,
            phone: formData.userPhone || null,
            image: formData.userImage || null,
            password: formData.userPassword || undefined,
            role: 'MITRA',
          }),
        })

        if (!userRes.ok) {
          const error = await userRes.json()
          throw new Error(error.error || 'Gagal membuat user')
        }

        const userData = await userRes.json()

        // API returns { user: {...} } not {...} directly
        if (!userData.user || !userData.user.id) {
          throw new Error('User ID tidak ditemukan setelah pembuatan user')
        }

        payload.userId = userData.user.id
      } else {
        // Use existing user
        if (!selectedUserId) {
          throw new Error('Silakan pilih user terlebih dahulu')
        }
        payload.userId = selectedUserId
      }

      // Ensure userId is set
      if (!payload.userId) {
        throw new Error('User ID tidak valid')
      }

      // Creating mitra with payload

      // Create mitra
      const res = await fetch('/api/admin/mitras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const responseData = await res.json()

      if (!res.ok) {
        console.error('Mitra creation error:', responseData)
        throw new Error(responseData.error || 'Gagal membuat mitra')
      }

      // Mitra created successfully
      toast.success('Mitra berhasil dibuat!')

      // Wait a bit before redirecting to ensure data is saved
      await new Promise((resolve) => setTimeout(resolve, 500))

      router.refresh() // Refresh to get latest data
      router.push('/dashboard/admin/mitras')
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      toast.error(
        error instanceof Error ? error.message : 'Gagal membuat mitra'
      )
    } finally {
      setLoading(false)
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
        <h1 className="text-3xl font-bold text-gray-900">Tambah Mitra Baru</h1>
        <p className="mt-2 text-gray-600">
          Buat akun mitra dan profil bisnis sekaligus
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* User Selection Section */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              1. Pilih User
            </h2>
            <div className="space-y-4">
              {/* Toggle between new user and existing user */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setCreateNewUser(true)}
                  className={`flex-1 rounded-lg border-2 px-4 py-3 font-medium transition-all ${
                    createNewUser
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Buat User Baru
                </button>
                <button
                  type="button"
                  onClick={() => setCreateNewUser(false)}
                  className={`flex-1 rounded-lg border-2 px-4 py-3 font-medium transition-all ${
                    !createNewUser
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Pilih User Existing
                </button>
              </div>

              {/* New User Form */}
              {createNewUser && (
                <div className="space-y-4 rounded-lg border border-gray-200 p-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nama Lengkap <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.userName}
                        onChange={(e) =>
                          setFormData({ ...formData, userName: e.target.value })
                        }
                        className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                        placeholder="Nama pemilik bengkel"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.userEmail}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            userEmail: e.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                        placeholder="email@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        No. Telepon
                      </label>
                      <input
                        type="tel"
                        value={formData.userPhone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            userPhone: e.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
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
                          value={formData.userPassword}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              userPassword: e.target.value,
                            })
                          }
                          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                          placeholder="Auto-generate jika kosong"
                        />
                        <button
                          type="button"
                          onClick={generatePassword}
                          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                        >
                          Generate
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Existing User Selection */}
              {!createNewUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Pilih User <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                    disabled={loadingUsers}
                  >
                    <option value="">
                      {loadingUsers ? 'Loading...' : 'Pilih user'}
                    </option>
                    {availableUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || 'N/A'} ({user.email})
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    Hanya user tanpa profil mitra yang ditampilkan
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Business Information Section */}
          <div className="border-t pt-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              2. Informasi Bisnis
            </h2>
            <div className="space-y-6">
              {/* Banner Upload */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Banner (Opsional)
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
                    Nama Bisnis <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) =>
                      setFormData({ ...formData, businessName: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                    placeholder="Bengkel Servis HP"
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
                    placeholder="Servis HP Terpercaya"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Deskripsi
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                  placeholder="Deskripsi lengkap tentang bisnis..."
                />
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="border-t pt-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              3. Lokasi
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Alamat Lengkap <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                  placeholder="Jl. Contoh No. 123, RT/RW 01/02"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Kota <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                    placeholder="Jakarta"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Provinsi <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.province}
                    onChange={(e) =>
                      setFormData({ ...formData, province: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                  >
                    <option value="">Pilih Provinsi</option>
                    {indonesianProvinces.map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Latitude (Opsional)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) =>
                      setFormData({ ...formData, latitude: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                    placeholder="-6.200000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Longitude (Opsional)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) =>
                      setFormData({ ...formData, longitude: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                    placeholder="106.816666"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="border-t pt-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              4. Kontak
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Telepon <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                  placeholder="081234567890"
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
                  placeholder="081234567890"
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
                  placeholder="info@bengkel.com"
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
                  placeholder="https://bengkel.com"
                />
              </div>
            </div>
          </div>

          {/* Business Details Section */}
          <div className="border-t pt-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              5. Detail Bisnis
            </h2>
            <div className="space-y-6">
              {/* Features */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Fasilitas
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
                    Jam Operasional Weekday
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
                    Jam Operasional Weekend
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

          {/* Approval Section */}
          <div className="border-t pt-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              6. Approval
            </h2>
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
                Approve mitra immediately
              </label>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Jika tidak dicentang, mitra akan berstatus PENDING
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 border-t pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 font-medium text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                  Membuat Mitra...
                </>
              ) : (
                'Buat Mitra'
              )}
            </button>
            <Link
              href="/dashboard/admin/mitras"
              className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Batal
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
