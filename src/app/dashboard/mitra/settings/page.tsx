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
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      <div className="relative">
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-6">
          <Link
            href="/dashboard/mitra"
            className="shadow-2xs mb-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Dashboard</span>
          </Link>
          <div className="mt-1">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Pengaturan Akun & Keamanan
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
              Kelola data pribadi, informasi toko resmi, koordinat GPS, dan kata
              sandi akun
            </p>
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-1">
          <motion.div variants={itemVariants}>
            <div className="shadow-xs overflow-hidden rounded-3xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="grid gap-0 lg:grid-cols-4">
                {/* Sidebar Tabs */}
                <div className="border-b border-slate-100 p-5 dark:border-slate-800 sm:p-6 lg:col-span-1 lg:border-b-0 lg:border-r">
                  <nav className="space-y-1.5">
                    <button
                      onClick={() => setActiveTab('profile')}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-left text-xs font-bold transition-all sm:text-sm ${
                        activeTab === 'profile'
                          ? 'shadow-xs bg-orange-500 text-white'
                          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      <User className="h-4 w-4" />
                      <span>Profil Toko</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('security')}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-left text-xs font-bold transition-all sm:text-sm ${
                        activeTab === 'security'
                          ? 'shadow-xs bg-orange-500 text-white'
                          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Lock className="h-4 w-4" />
                      <span>Keamanan Sandi</span>
                    </button>
                  </nav>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8 lg:col-span-3">
                  <AnimatePresence mode="wait">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                      <motion.div
                        key="profile"
                        initial={{ opacity: 0, x: 15 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -15 }}
                        className="space-y-6"
                      >
                        <div>
                          <h2 className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
                            Informasi Profil Mitra
                          </h2>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            Perbarui identitas pribadi dan detail bisnis toko
                            Anda
                          </p>
                        </div>

                        {/* Sub-tabs for Profile */}
                        <div className="flex gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                          <button
                            onClick={() => setProfileSubTab('personal')}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                              profileSubTab === 'personal'
                                ? 'shadow-xs bg-white text-slate-950 dark:bg-slate-900 dark:text-white'
                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                            }`}
                          >
                            <User className="h-3.5 w-3.5" />
                            <span>Informasi Pribadi</span>
                          </button>
                          <button
                            onClick={() => setProfileSubTab('business')}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                              profileSubTab === 'business'
                                ? 'shadow-xs bg-white text-slate-950 dark:bg-slate-900 dark:text-white'
                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                            }`}
                          >
                            <Building2 className="h-3.5 w-3.5" />
                            <span>Informasi Bisnis & Lokasi</span>
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
                                className="space-y-4"
                              >
                                <div>
                                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                    Nama Lengkap Penanggung Jawab
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
                                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 sm:text-sm"
                                  />
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                      Alamat Email Akun
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
                                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 sm:text-sm"
                                    />
                                  </div>

                                  <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                      Nomor Telepon Pribadi
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
                                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 sm:text-sm"
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
                                className="space-y-4"
                              >
                                {/* Business Details */}
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                      Nama Bisnis / Toko
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
                                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 sm:text-sm"
                                    />
                                  </div>

                                  <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
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
                                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 sm:text-sm"
                                    />
                                  </div>
                                </div>

                                {/* Location Section */}
                                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50 sm:p-5">
                                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                                        <MapPin className="h-4 w-4" />
                                      </div>
                                      <div>
                                        <h3 className="text-xs font-bold text-slate-900 dark:text-white sm:text-sm">
                                          Lokasi Fisik Bisnis
                                        </h3>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                          Alamat lengkap dengan sinkronisasi
                                          koordinat GPS Google Maps
                                        </p>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={handleGetCurrentLocation}
                                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-orange-600 active:scale-95"
                                    >
                                      <Navigation className="h-3.5 w-3.5" />
                                      <span>Lokasi GPS Saya</span>
                                    </button>
                                  </div>

                                  {/* Address Autocomplete */}
                                  <div className="mb-3.5">
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                      Cari Alamat (Places)
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
                                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                          <input
                                            type="text"
                                            placeholder="Ketik nama jalan atau landmark untuk mencari..."
                                            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 pl-9 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                                          />
                                        </div>
                                      </Autocomplete>
                                    ) : (
                                      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800">
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        <span>Memuat Google Maps...</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Full Address */}
                                  <div className="mb-3.5">
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
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
                                      placeholder="Alamat lengkap fisik toko"
                                      rows={3}
                                      className="w-full resize-none rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                                    />
                                  </div>

                                  {/* City & Province */}
                                  <div className="mb-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div>
                                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                        Kota / Kabupaten
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
                                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
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
                                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                                      />
                                    </div>
                                  </div>

                                  {/* Interactive Map Preview */}
                                  {formData.latitude !== 0 &&
                                    formData.longitude !== 0 &&
                                    isLoaded && (
                                      <div className="space-y-2 pt-1">
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                          Pratinjau Pin Lokasi Toko
                                        </label>
                                        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                                          <GoogleMap
                                            mapContainerStyle={{
                                              width: '100%',
                                              height: '240px',
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
                                        <p className="text-center text-[11px] font-medium text-slate-400 dark:text-slate-500">
                                          📍 Koordinat:{' '}
                                          {formData.latitude.toFixed(6)},{' '}
                                          {formData.longitude.toFixed(6)}
                                        </p>
                                      </div>
                                    )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="flex justify-end pt-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSaveProfile}
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-2.5 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition hover:bg-orange-600 active:scale-95 disabled:opacity-50"
                          >
                            {saving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                            <span>
                              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </span>
                          </motion.button>
                        </div>
                      </motion.div>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                      <motion.div
                        key="security"
                        initial={{ opacity: 0, x: 15 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -15 }}
                        className="space-y-6"
                      >
                        <div>
                          <h2 className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
                            Keamanan Kata Sandi
                          </h2>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            Ubah kata sandi akun untuk menjaga keamanan akses
                            dashboard
                          </p>
                        </div>

                        <div className="max-w-md space-y-4">
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                              Kata Sandi Saat Ini
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
                              placeholder="Masukkan kata sandi saat ini"
                              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                              Kata Sandi Baru
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
                              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                              Konfirmasi Kata Sandi Baru
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
                              placeholder="Ulangi kata sandi baru"
                              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                            />
                            <p className="mt-1 text-[11px] text-slate-400">
                              Kata sandi minimal 6 karakter kombinasi huruf dan
                              angka
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-start pt-2">
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
                            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-2.5 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition hover:bg-orange-600 active:scale-95 disabled:opacity-50"
                          >
                            {saving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                            <span>
                              {saving ? 'Menyimpan...' : 'Perbarui Kata Sandi'}
                            </span>
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
