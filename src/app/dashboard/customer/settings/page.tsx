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
import { motion, AnimatePresence } from 'framer-motion'

type Tab = 'profile' | 'security' | 'address'

interface UserProfile {
  id: string
  name: string | null
  email: string
  image: string | null
  phone: string | null
}

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100, damping: 12 },
  },
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
        await update()
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
        await update()
        toast({
          title: 'Berhasil!',
          description: 'Profil berhasil diupdate',
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
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Background Mesh */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-cyan-400/20 blur-[100px]" />
        <div className="absolute right-[-10%] top-[10%] h-[600px] w-[600px] rounded-full bg-blue-400/20 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[20%] h-[500px] w-[500px] rounded-full bg-sky-300/20 blur-[100px]" />
      </div>

      <Navbar variant="light" />

      <motion.main
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="container relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-10">
          <Link
            href="/dashboard/customer"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Dashboard
          </Link>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            Pengaturan
          </h1>
          <p className="text-lg text-gray-600">
            Kelola profil dan preferensi akun Anda
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-1">
          {/* Single Card Container */}
          <motion.div variants={itemVariants}>
            <div className="overflow-hidden rounded-[2rem] border border-white/60 bg-white/60 shadow-xl shadow-blue-100/10 backdrop-blur-xl">
              <div className="grid gap-0 lg:grid-cols-4">
                {/* Sidebar Tabs */}
                <div className="border-b border-gray-200/60 p-6 lg:col-span-1 lg:border-b-0 lg:border-r">
                  <nav className="space-y-2">
                    <button
                      onClick={() => setActiveTab('profile')}
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-semibold transition-all ${
                        activeTab === 'profile'
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-blue-600/30'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <User className="h-5 w-5" />
                      <span>Profil</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('address')}
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-semibold transition-all ${
                        activeTab === 'address'
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-blue-600/30'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <MapPin className="h-5 w-5" />
                      <span>Alamat</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('security')}
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-semibold transition-all ${
                        activeTab === 'security'
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-blue-600/30'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Lock className="h-5 w-5" />
                      <span>Keamanan</span>
                    </button>
                  </nav>
                </div>

                {/* Content */}
                <div className="p-8 lg:col-span-3">
                  <AnimatePresence mode="wait">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                      <motion.div
                        key="profile"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">
                            Profil Saya
                          </h2>
                          <p className="text-sm text-gray-600">
                            Update foto profil dan informasi pribadi Anda
                          </p>
                        </div>

                        {/* Avatar Upload */}
                        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                          <div className="relative">
                            <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-gray-200 shadow-xl">
                              {avatarPreview ? (
                                <Image
                                  src={avatarPreview}
                                  alt="Avatar"
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600">
                                  <User className="h-12 w-12 text-white" />
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
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={handleAvatarClick}
                              disabled={uploadingAvatar}
                              className="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 font-semibold text-white shadow-lg transition-all hover:bg-gray-800 disabled:opacity-50"
                            >
                              <Camera className="h-4 w-4" />
                              Upload Foto
                            </motion.button>
                            <p className="mt-2 text-xs text-gray-500">
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
                        <div className="space-y-5">
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-700">
                              Nama Lengkap
                            </label>
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="w-full rounded-xl border-gray-200 bg-gray-50 p-3 font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-700">
                              Email
                            </label>
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full rounded-xl border-gray-200 bg-gray-50 p-3 font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-700">
                              Nomor Telepon
                            </label>
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="08123456789"
                              className="w-full rounded-xl border-gray-200 bg-gray-50 p-3 font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end pt-4">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSaveProfile}
                            disabled={saving}
                            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 font-bold text-white shadow-lg shadow-emerald-600/30 transition-all hover:shadow-xl disabled:opacity-50"
                          >
                            {saving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                            Simpan Perubahan
                          </motion.button>
                        </div>
                      </motion.div>
                    )}

                    {/* Address Tab */}
                    {activeTab === 'address' && (
                      <motion.div
                        key="address"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">
                            Alamat Pengiriman
                          </h2>
                          <p className="text-sm text-gray-600">
                            Kelola alamat pengiriman Anda dengan bantuan Google
                            Maps
                          </p>
                        </div>

                        {/* Address Form */}
                        <GoogleMapsProvider>
                          <div className="space-y-5">
                            <div>
                              <label className="mb-2 block text-sm font-semibold text-gray-700">
                                Cari Alamat dengan Google Maps
                              </label>
                              <GoogleMapsAutocomplete
                                onPlaceSelected={handlePlaceSelected}
                                defaultValue={address}
                                placeholder="Ketik alamat Anda..."
                              />
                              <p className="mt-1 text-xs text-gray-500">
                                💡 Ketik alamat Anda untuk mendapatkan saran
                                dari Google Maps
                              </p>
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-semibold text-gray-700">
                                Alamat Lengkap
                              </label>
                              <textarea
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                rows={3}
                                placeholder="Jalan, nomor rumah, RT/RW, kelurahan..."
                                className="w-full resize-none rounded-xl border-gray-200 bg-gray-50 p-3 font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                              />
                            </div>

                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                              <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                  Kota/Kabupaten
                                </label>
                                <input
                                  type="text"
                                  value={city}
                                  onChange={(e) => setCity(e.target.value)}
                                  placeholder="Contoh: Jakarta Selatan"
                                  className="w-full rounded-xl border-gray-200 bg-gray-50 p-3 font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                                />
                              </div>
                              <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                  Provinsi
                                </label>
                                <input
                                  type="text"
                                  value={province}
                                  onChange={(e) => setProvince(e.target.value)}
                                  placeholder="Contoh: DKI Jakarta"
                                  className="w-full rounded-xl border-gray-200 bg-gray-50 p-3 font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-semibold text-gray-700">
                                Kode Pos
                              </label>
                              <input
                                type="text"
                                value={postalCode}
                                onChange={(e) => setPostalCode(e.target.value)}
                                placeholder="12345"
                                maxLength={5}
                                className="w-full rounded-xl border-gray-200 bg-gray-50 p-3 font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                              />
                            </div>

                            {/* Google Maps */}
                            <div>
                              <label className="mb-2 block text-sm font-semibold text-gray-700">
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

                        <div className="flex justify-end pt-4">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSaveAddress}
                            disabled={saving || !address}
                            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 font-bold text-white shadow-lg shadow-emerald-600/30 transition-all hover:shadow-xl disabled:opacity-50"
                          >
                            {saving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                            Simpan Alamat
                          </motion.button>
                        </div>
                      </motion.div>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                      <motion.div
                        key="security"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">
                            Keamanan
                          </h2>
                          <p className="text-sm text-gray-600">
                            Ubah password dan kelola keamanan akun Anda
                          </p>
                        </div>

                        <div className="space-y-5">
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-700">
                              Password Saat Ini
                            </label>
                            <input
                              type="password"
                              value={currentPassword}
                              onChange={(e) =>
                                setCurrentPassword(e.target.value)
                              }
                              className="w-full rounded-xl border-gray-200 bg-gray-50 p-3 font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-700">
                              Password Baru
                            </label>
                            <input
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full rounded-xl border-gray-200 bg-gray-50 p-3 font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-700">
                              Konfirmasi Password Baru
                            </label>
                            <input
                              type="password"
                              value={confirmPassword}
                              onChange={(e) =>
                                setConfirmPassword(e.target.value)
                              }
                              className="w-full rounded-xl border-gray-200 bg-gray-50 p-3 font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end pt-4">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleChangePassword}
                            disabled={
                              saving ||
                              !currentPassword ||
                              !newPassword ||
                              !confirmPassword
                            }
                            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 font-bold text-white shadow-lg shadow-emerald-600/30 transition-all hover:shadow-xl disabled:opacity-50"
                          >
                            {saving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                            Ubah Password
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.main>

      <Footer variant="light" />
      <Toaster />
    </div>
  )
}
