'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import {
  User,
  Loader2,
  Check,
  Lock,
  Building2,
  MapPin,
  ArrowLeft,
  Search,
  Navigation,
} from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Autocomplete, GoogleMap, Marker } from '@react-google-maps/api'
import GoogleMapsProvider, {
  useGoogleMaps,
} from '@/components/maps/google-maps-provider'

type Tab = 'profile' | 'security'
type ProfileSubTab = 'personal' | 'business'

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

function MitraSettingsContent() {
  const { update } = useSession()

  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [profileSubTab, setProfileSubTab] = useState<ProfileSubTab>('personal')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Google Maps - use from provider
  const { isLoaded } = useGoogleMaps()

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  // Profile form data
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    businessName: '',
    address: '',
    city: '',
    province: '',
    whatsapp: '',
    latitude: 0,
    longitude: 0,
  })

  // Password form data
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/mitra/settings')
      if (res.ok) {
        const data = await res.json()
        setFormData({
          name: data.user.name || '',
          phone: data.user.phone || '',
          email: data.user.email || '',
          businessName: data.user.mitra?.businessName || '',
          address: data.user.mitra?.address || '',
          city: data.user.mitra?.city || '',
          province: data.user.mitra?.province || '',
          whatsapp: data.user.mitra?.whatsapp || '',
          latitude: data.user.mitra?.latitude || 0,
          longitude: data.user.mitra?.longitude || 0,
        })
      } else {
        toast.error('Gagal memuat profil')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Gagal memuat profil')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/mitra/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          businessName: formData.businessName,
          address: formData.address,
          city: formData.city,
          province: formData.province,
          whatsapp: formData.whatsapp,
          latitude: formData.latitude,
          longitude: formData.longitude,
        }),
      })

      if (res.ok) {
        toast.success('Profil berhasil diperbarui')
        await update()
        fetchProfile()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal memperbarui profil')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword) {
      toast.error('Masukkan password saat ini')
      return
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password baru minimal 6 karakter')
      return
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Konfirmasi password tidak cocok')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/mitra/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      if (res.ok) {
        toast.success('Password berhasil diubah')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal mengubah password')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  // Handle place selection from autocomplete
  const handlePlaceSelect = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace()
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()
        const address = place.formatted_address || ''

        let city = ''
        let province = ''

        place.address_components?.forEach((component) => {
          if (
            component.types.includes('locality') ||
            component.types.includes('administrative_area_level_2')
          ) {
            city = component.long_name
          }
          if (component.types.includes('administrative_area_level_1')) {
            province = component.long_name
          }
        })

        setFormData((prev) => ({
          ...prev,
          address,
          city: city || prev.city,
          province: province || prev.province,
          latitude: lat,
          longitude: lng,
        }))
      }
    }
  }

  // Get current location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Browser tidak mendukung geolocation')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude

        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }))

        if (isLoaded && google) {
          const geocoder = new google.maps.Geocoder()
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              let city = ''
              let province = ''

              results[0].address_components?.forEach((component) => {
                if (
                  component.types.includes('locality') ||
                  component.types.includes('administrative_area_level_2')
                ) {
                  city = component.long_name
                }
                if (component.types.includes('administrative_area_level_1')) {
                  province = component.long_name
                }
              })

              setFormData((prev) => ({
                ...prev,
                address: results[0].formatted_address || '',
                city: city || prev.city,
                province: province || prev.province,
              }))
            }
          })
        }

        toast.success('Lokasi berhasil didapatkan')
      },
      () => {
        toast.error('Gagal mendapatkan lokasi')
      }
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="relative"
    >
      {/* Background Mesh */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-blue-100/40 blur-[100px]" />
        <div className="absolute right-[-10%] top-[10%] h-[600px] w-[600px] rounded-full bg-sky-100/30 blur-[100px]" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-10">
          <Link
            href="/dashboard/mitra"
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
          <motion.div variants={itemVariants}>
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="grid gap-0 lg:grid-cols-4">
                {/* Sidebar Tabs */}
                <div className="border-b border-gray-200 p-6 lg:col-span-1 lg:border-b-0 lg:border-r">
                  <nav className="space-y-2">
                    <button
                      onClick={() => setActiveTab('profile')}
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-semibold transition-all ${
                        activeTab === 'profile'
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                          : 'text-gray-700 hover:bg-blue-50'
                      }`}
                    >
                      <User className="h-5 w-5" />
                      <span>Profil</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('security')}
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-semibold transition-all ${
                        activeTab === 'security'
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                          : 'text-gray-700 hover:bg-blue-50'
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
                            Profil Mitra
                          </h2>
                          <p className="text-sm text-gray-600">
                            Update informasi profil dan bisnis Anda
                          </p>
                        </div>

                        {/* Sub-tabs for Profile */}
                        <div className="flex gap-1 rounded-xl bg-blue-50 p-1">
                          <button
                            onClick={() => setProfileSubTab('personal')}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                              profileSubTab === 'personal'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-blue-600'
                            }`}
                          >
                            <User className="h-4 w-4" />
                            Informasi Pribadi
                          </button>
                          <button
                            onClick={() => setProfileSubTab('business')}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                              profileSubTab === 'business'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-blue-600'
                            }`}
                          >
                            <Building2 className="h-4 w-4" />
                            Informasi Bisnis
                          </button>
                        </div>

                        {/* Profile Form */}
                        <div className="space-y-5">
                          <AnimatePresence mode="wait">
                            {/* Personal Information Tab */}
                            {profileSubTab === 'personal' && (
                              <motion.div
                                key="personal"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-5"
                              >
                                <div>
                                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Nama Lengkap
                                  </label>
                                  <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        name: e.target.value,
                                      })
                                    }
                                    placeholder="Masukkan nama lengkap"
                                    className="w-full rounded-xl border border-gray-200 bg-white p-3 font-medium outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                  />
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                      Email
                                    </label>
                                    <input
                                      type="email"
                                      value={formData.email}
                                      onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          email: e.target.value,
                                        })
                                      }
                                      placeholder="mitra@example.com"
                                      className="w-full rounded-xl border border-gray-200 bg-white p-3 font-medium outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                    />
                                  </div>

                                  <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                      Nomor Telepon
                                    </label>
                                    <input
                                      type="tel"
                                      value={formData.phone}
                                      onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          phone: e.target.value,
                                        })
                                      }
                                      placeholder="08123456789"
                                      className="w-full rounded-xl border border-gray-200 bg-white p-3 font-medium outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                    />
                                  </div>
                                </div>
                              </motion.div>
                            )}

                            {/* Business Information Tab */}
                            {profileSubTab === 'business' && (
                              <motion.div
                                key="business"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-5"
                              >
                                {/* Business Details */}
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                      Nama Bisnis
                                    </label>
                                    <input
                                      type="text"
                                      value={formData.businessName}
                                      onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          businessName: e.target.value,
                                        })
                                      }
                                      placeholder="Nama bisnis Anda"
                                      className="w-full rounded-xl border border-gray-200 bg-white p-3 font-medium outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                    />
                                  </div>

                                  <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                      WhatsApp Bisnis
                                    </label>
                                    <input
                                      type="tel"
                                      value={formData.whatsapp}
                                      onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          whatsapp: e.target.value,
                                        })
                                      }
                                      placeholder="08123456789"
                                      className="w-full rounded-xl border border-gray-200 bg-white p-3 font-medium outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                    />
                                  </div>
                                </div>

                                {/* Location Section */}
                                <div className="rounded-xl border border-gray-200 p-5">
                                  <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                                        <MapPin className="h-5 w-5" />
                                      </div>
                                      <div>
                                        <h3 className="font-bold text-gray-900">
                                          Lokasi Bisnis
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                          Alamat lengkap dengan koordinat GPS
                                        </p>
                                      </div>
                                    </div>
                                    <button
                                      onClick={handleGetCurrentLocation}
                                      className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700"
                                    >
                                      <Navigation className="h-4 w-4" />
                                      Lokasi Saya
                                    </button>
                                  </div>

                                  {/* Address Autocomplete */}
                                  <div className="mb-4">
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                      Cari Alamat
                                    </label>
                                    {isLoaded ? (
                                      <Autocomplete
                                        onLoad={(autocomplete) => {
                                          autocompleteRef.current = autocomplete
                                        }}
                                        onPlaceChanged={handlePlaceSelect}
                                        options={{
                                          componentRestrictions: {
                                            country: 'id',
                                          },
                                        }}
                                      >
                                        <div className="relative">
                                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                          <input
                                            type="text"
                                            placeholder="Ketik alamat untuk mencari..."
                                            className="w-full rounded-xl border border-gray-200 bg-white p-3 pl-10 font-medium outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                          />
                                        </div>
                                      </Autocomplete>
                                    ) : (
                                      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-gray-500">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span className="text-sm">
                                          Loading Google Maps...
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Full Address */}
                                  <div className="mb-4">
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                      Alamat Lengkap
                                    </label>
                                    <textarea
                                      value={formData.address}
                                      onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          address: e.target.value,
                                        })
                                      }
                                      placeholder="Alamat lengkap bisnis"
                                      rows={3}
                                      className="w-full resize-none rounded-xl border border-gray-200 bg-white p-3 font-medium outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                    />
                                  </div>

                                  {/* City & Province */}
                                  <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        Kota
                                      </label>
                                      <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) =>
                                          setFormData({
                                            ...formData,
                                            city: e.target.value,
                                          })
                                        }
                                        placeholder="Kota"
                                        className="w-full rounded-xl border border-gray-200 bg-white p-3 font-medium outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        Provinsi
                                      </label>
                                      <input
                                        type="text"
                                        value={formData.province}
                                        onChange={(e) =>
                                          setFormData({
                                            ...formData,
                                            province: e.target.value,
                                          })
                                        }
                                        placeholder="Provinsi"
                                        className="w-full rounded-xl border border-gray-200 bg-white p-3 font-medium outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                      />
                                    </div>
                                  </div>

                                  {/* Interactive Map Preview */}
                                  {formData.latitude !== 0 &&
                                    formData.longitude !== 0 &&
                                    isLoaded && (
                                      <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700">
                                          Preview Lokasi
                                        </label>
                                        <div className="overflow-hidden rounded-xl border border-gray-200">
                                          <GoogleMap
                                            mapContainerStyle={{
                                              width: '100%',
                                              height: '250px',
                                            }}
                                            center={{
                                              lat: formData.latitude,
                                              lng: formData.longitude,
                                            }}
                                            zoom={15}
                                            options={{
                                              streetViewControl: false,
                                              mapTypeControl: false,
                                              fullscreenControl: false,
                                              zoomControl: true,
                                            }}
                                          >
                                            <Marker
                                              position={{
                                                lat: formData.latitude,
                                                lng: formData.longitude,
                                              }}
                                            />
                                          </GoogleMap>
                                        </div>
                                        <p className="text-center text-xs text-gray-500">
                                          📍 {formData.latitude.toFixed(6)},{' '}
                                          {formData.longitude.toFixed(6)}
                                        </p>
                                      </div>
                                    )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="flex justify-end pt-4">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSaveProfile}
                            disabled={saving}
                            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-700 disabled:opacity-50"
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
                              value={passwordData.currentPassword}
                              onChange={(e) =>
                                setPasswordData({
                                  ...passwordData,
                                  currentPassword: e.target.value,
                                })
                              }
                              placeholder="Masukkan password saat ini"
                              className="w-full rounded-xl border border-gray-200 bg-white p-3 font-medium outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-700">
                              Password Baru
                            </label>
                            <input
                              type="password"
                              value={passwordData.newPassword}
                              onChange={(e) =>
                                setPasswordData({
                                  ...passwordData,
                                  newPassword: e.target.value,
                                })
                              }
                              placeholder="Minimal 6 karakter"
                              className="w-full rounded-xl border border-gray-200 bg-white p-3 font-medium outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-700">
                              Konfirmasi Password Baru
                            </label>
                            <input
                              type="password"
                              value={passwordData.confirmPassword}
                              onChange={(e) =>
                                setPasswordData({
                                  ...passwordData,
                                  confirmPassword: e.target.value,
                                })
                              }
                              placeholder="Ulangi password baru"
                              className="w-full rounded-xl border border-gray-200 bg-white p-3 font-medium outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              Password minimal 6 karakter
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-end pt-4">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleChangePassword}
                            disabled={
                              saving ||
                              !passwordData.currentPassword ||
                              !passwordData.newPassword ||
                              !passwordData.confirmPassword
                            }
                            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-700 disabled:opacity-50"
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
      </div>
    </motion.div>
  )
}

export default function MitraSettingsPage() {
  return (
    <GoogleMapsProvider>
      <MitraSettingsContent />
    </GoogleMapsProvider>
  )
}
