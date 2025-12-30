'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import AddressMapPicker from '@/components/maps/address-map-picker'
import GoogleMapsAutocomplete from '@/components/maps/google-maps-autocomplete'
import GoogleMapsProvider from '@/components/maps/google-maps-provider'
import {
  User,
  Lock,
  Camera,
  Loader2,
  Check,
  ArrowLeft,
  MapPin,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

type Tab = 'profile' | 'security' | 'address'

interface UserProfile {
  id: string
  name: string | null
  email: string
  image: string | null
  phone: string | null
}

export default function CustomerSettingsPage() {
  const { status, update } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Profile data
  const [, setProfile] = useState<UserProfile | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // Address data
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [province, setProvince] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)

  // Password data
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const data = await res.json()
        setProfile(data.user)
        setName(data.user.name || '')
        setEmail(data.user.email)
        setPhone(data.user.phone || '')

        // Load saved address components
        if (data.user.address) setAddress(data.user.address)
        if (data.user.city) setCity(data.user.city)
        if (data.user.province) setProvince(data.user.province)
        if (data.user.postalCode) setPostalCode(data.user.postalCode)

        setAvatarPreview(data.user.image)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast({
        title: 'Error',
        description: 'Gagal memuat profil',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchProfile()
    }
  }, [status, router, fetchProfile])

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'File harus berupa gambar',
        variant: 'destructive',
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Ukuran file maksimal 5MB',
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

        // Update session to refresh navbar
        await update()

        // Small delay to ensure session propagates
        await new Promise((resolve) => setTimeout(resolve, 300))

        // Force refresh to update all components
        router.refresh()

        toast({
          title: 'Berhasil!',
          description: 'Avatar berhasil diupdate',
        })
      } else {
        const error = await res.json()
        toast({
          title: 'Gagal',
          description: error.error || 'Gagal mengupload avatar',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat mengupload avatar',
        variant: 'destructive',
      })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone }),
      })

      if (res.ok) {
        // Update session to refresh navbar
        await update()

        // Small delay to ensure session propagates
        await new Promise((resolve) => setTimeout(resolve, 300))

        // Force refresh to update all components
        router.refresh()

        toast({
          title: 'Berhasil!',
          description:
            'Profil berhasil diupdate. Perubahan sudah terlihat di navbar.',
        })
      } else {
        const error = await res.json()
        toast({
          title: 'Gagal',
          description: error.error || 'Gagal mengupdate profil',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat mengupdate profil',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Password baru tidak cocok',
        variant: 'destructive',
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password minimal 6 karakter',
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
          title: 'Berhasil!',
          description: 'Password berhasil diubah',
        })
      } else {
        const error = await res.json()
        toast({
          title: 'Gagal',
          description: error.error || 'Gagal mengubah password',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error changing password:', error)
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat mengubah password',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAddress = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/user/address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          city,
          province,
          postalCode,
          latitude,
          longitude,
        }),
      })

      if (res.ok) {
        toast({
          title: 'Berhasil!',
          description: 'Alamat berhasil disimpan',
        })
      } else {
        const error = await res.json()
        toast({
          title: 'Gagal',
          description: error.error || 'Gagal menyimpan alamat',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error saving address:', error)
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat menyimpan alamat',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleLocationSelect = (lat: number, lng: number, addr?: string) => {
    setLatitude(lat)
    setLongitude(lng)

    // Parse address from Google Maps geocoding
    if (addr) {
      // Try to extract components from formatted address
      const geocoder = new google.maps.Geocoder()
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const addressComponents = results[0].address_components

          // Extract city
          const cityComponent = addressComponents.find(
            (c) =>
              c.types.includes('administrative_area_level_2') ||
              c.types.includes('locality')
          )
          if (cityComponent) setCity(cityComponent.long_name)

          // Extract province
          const provinceComponent = addressComponents.find((c) =>
            c.types.includes('administrative_area_level_1')
          )
          if (provinceComponent) setProvince(provinceComponent.long_name)

          // Extract postal code
          const postalComponent = addressComponents.find((c) =>
            c.types.includes('postal_code')
          )
          if (postalComponent) setPostalCode(postalComponent.long_name)

          // Set full address
          setAddress(results[0].formatted_address)
        }
      })
    }
  }

  const handlePlaceSelected = (place: {
    address: string
    city: string
    province: string
    latitude: number
    longitude: number
  }) => {
    setAddress(place.address)
    setCity(place.city)
    setProvince(place.province)
    setLatitude(place.latitude)
    setLongitude(place.longitude)
  }

  // Geocode address when user types manually
  const geocodeAddress = async (addressText: string) => {
    if (!addressText || addressText.length < 5) return

    // Check if google maps is loaded
    if (typeof google === 'undefined' || !google.maps) {
      return
    }

    try {
      const geocoder = new google.maps.Geocoder()
      geocoder.geocode({ address: addressText }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location
          setLatitude(location.lat())
          setLongitude(location.lng())
        }
      })
    } catch (error) {
      console.error('Geocoding error:', error)
    }
  }

  // Debounce geocoding when address changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (address && city && province) {
        const fullAddress = `${address}, ${city}, ${province}`
        geocodeAddress(fullAddress)
      }
    }, 1000) // Wait 1 second after user stops typing

    return () => clearTimeout(timer)
  }, [address, city, province])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar variant="light" />

      <main className="container mx-auto min-h-screen flex-1 px-4 pb-8 pt-24">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard/customer"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Pengaturan</h1>
          <p className="text-gray-600">
            Kelola profil dan preferensi akun Anda
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl bg-white p-4 shadow-lg">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-all ${
                    activeTab === 'profile'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <User className="h-5 w-5" />
                  <span className="font-medium">Profil</span>
                </button>
                <button
                  onClick={() => setActiveTab('address')}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-all ${
                    activeTab === 'address'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <MapPin className="h-5 w-5" />
                  <span className="font-medium">Alamat</span>
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-all ${
                    activeTab === 'security'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Lock className="h-5 w-5" />
                  <span className="font-medium">Keamanan</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl bg-white p-6 shadow-lg">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Profil Saya
                    </h2>
                    <p className="text-sm text-gray-600">
                      Update foto profil dan informasi pribadi Anda
                    </p>
                  </div>

                  {/* Avatar Upload */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="relative h-24 w-24 overflow-hidden rounded-full bg-gray-200">
                        {avatarPreview ? (
                          <Image
                            src={avatarPreview}
                            alt="Avatar"
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <User className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                      {uploadingAvatar && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                          <Loader2 className="h-6 w-6 animate-spin text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <button
                        onClick={handleAvatarClick}
                        disabled={uploadingAvatar}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Camera className="h-4 w-4" />
                        Upload Foto
                      </button>
                      <p className="mt-1 text-xs text-gray-500">
                        JPG, PNG atau GIF. Maksimal 5MB.
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

                  {/* Profile Form */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nama Lengkap
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nomor Telepon
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="08123456789"
                        className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Simpan Perubahan
                    </button>
                  </div>
                </div>
              )}

              {/* Address Tab */}
              {activeTab === 'address' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Alamat Pengiriman
                    </h2>
                    <p className="text-sm text-gray-600">
                      Kelola alamat pengiriman Anda dengan bantuan Google Maps
                    </p>
                  </div>

                  {/* Address Form */}
                  <GoogleMapsProvider>
                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Cari Alamat dengan Google Maps
                        </label>
                        <GoogleMapsAutocomplete
                          onPlaceSelected={handlePlaceSelected}
                          defaultValue={address}
                          placeholder="Ketik alamat Anda..."
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          💡 Ketik alamat Anda untuk mendapatkan saran dari
                          Google Maps
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Alamat Lengkap
                        </label>
                        <textarea
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          rows={3}
                          placeholder="Jalan, nomor rumah, RT/RW, kelurahan..."
                          className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Kota/Kabupaten
                          </label>
                          <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="Contoh: Jakarta Selatan"
                            className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Provinsi
                          </label>
                          <input
                            type="text"
                            value={province}
                            onChange={(e) => setProvince(e.target.value)}
                            placeholder="Contoh: DKI Jakarta"
                            className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Kode Pos
                        </label>
                        <input
                          type="text"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          placeholder="12345"
                          maxLength={5}
                          className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                      </div>

                      {/* Google Maps */}
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Pilih Lokasi di Peta
                        </label>
                        <AddressMapPicker
                          onLocationSelect={handleLocationSelect}
                          initialLat={latitude || undefined}
                          initialLng={longitude || undefined}
                        />
                      </div>
                    </div>
                  </GoogleMapsProvider>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveAddress}
                      disabled={saving || !address}
                      className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Simpan Alamat
                    </button>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Keamanan
                    </h2>
                    <p className="text-sm text-gray-600">
                      Ubah password dan kelola keamanan akun Anda
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Password Saat Ini
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Password Baru
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Konfirmasi Password Baru
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleChangePassword}
                      disabled={
                        saving ||
                        !currentPassword ||
                        !newPassword ||
                        !confirmPassword
                      }
                      className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Ubah Password
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer variant="light" />
      <Toaster />
    </div>
  )
}
