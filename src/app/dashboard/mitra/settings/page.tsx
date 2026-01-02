'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  User,
  Phone,
  Mail,
  Loader2,
  Save,
  Lock,
  Key,
  Building2,
  MapPin,
  MessageCircle,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'

interface MitraProfile {
  id: string
  name: string | null
  email: string
  image: string | null
  phone: string | null
  role: string
  mitra?: {
    id: string
    businessName: string
    address: string
    city: string
    province: string
    whatsapp: string | null
  }
}

type Tab = 'profile' | 'security'

export default function MitraSettingsPage() {
  const { update } = useSession()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<MitraProfile | null>(null)

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
        setProfile(data.user)
        setFormData({
          name: data.user.name || '',
          phone: data.user.phone || '',
          email: data.user.email || '',
          businessName: data.user.mitra?.businessName || '',
          address: data.user.mitra?.address || '',
          city: data.user.mitra?.city || '',
          province: data.user.mitra?.province || '',
          whatsapp: data.user.mitra?.whatsapp || '',
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
        }),
      })

      if (res.ok) {
        toast.success('Profil berhasil diperbarui')
        await update() // Update session
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
    // Validate password fields
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard/mitra"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">
            Pengaturan Profil
          </h1>
          <p className="mt-2 text-sm text-gray-600 lg:text-base">
            Kelola profil dan informasi pribadi Anda
          </p>
        </div>

        {/* Tabs - Mobile Responsive */}
        <div className="mb-6 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all lg:px-6 lg:py-3 lg:text-base ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <User className="h-4 w-4 lg:h-5 lg:w-5" />
            Profil
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all lg:px-6 lg:py-3 lg:text-base ${
              activeTab === 'security'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Lock className="h-4 w-4 lg:h-5 lg:w-5" />
            Keamanan
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 bg-gradient-to-r from-blue-600 to-cyan-600 p-4 lg:p-6">
              <h2 className="text-lg font-semibold text-white lg:text-xl">
                Profil Saya
              </h2>
              <p className="mt-1 text-xs text-white/80 lg:text-sm">
                Update foto profil dan informasi pribadi Anda
              </p>
            </div>

            <div className="p-4 lg:p-6">
              {/* Form Fields */}
              <div className="space-y-4">
                {/* Personal Information */}
                <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900 lg:text-base">
                    Informasi Pribadi
                  </h3>
                  <div className="space-y-4">
                    {/* Name */}
                    <div>
                      <label className="mb-2 block text-xs font-medium text-gray-700 lg:text-sm">
                        Nama Lengkap
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 lg:h-5 lg:w-5" />
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="Masukkan nama lengkap"
                          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 lg:pl-10 lg:text-base"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="mb-2 block text-xs font-medium text-gray-700 lg:text-sm">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 lg:h-5 lg:w-5" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          placeholder="mitra@example.com"
                          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 lg:pl-10 lg:text-base"
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="mb-2 block text-xs font-medium text-gray-700 lg:text-sm">
                        Nomor Telepon
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 lg:h-5 lg:w-5" />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          placeholder="08123456789"
                          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 lg:pl-10 lg:text-base"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Business Information */}
                <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900 lg:text-base">
                    Informasi Bisnis
                  </h3>
                  <div className="space-y-4">
                    {/* Business Name */}
                    <div>
                      <label className="mb-2 block text-xs font-medium text-gray-700 lg:text-sm">
                        Nama Bisnis
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 lg:h-5 lg:w-5" />
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
                          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 lg:pl-10 lg:text-base"
                        />
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <label className="mb-2 block text-xs font-medium text-gray-700 lg:text-sm">
                        Alamat
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400 lg:h-5 lg:w-5" />
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
                          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 lg:pl-10 lg:text-base"
                        />
                      </div>
                    </div>

                    {/* City & Province */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-medium text-gray-700 lg:text-sm">
                          Kota
                        </label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) =>
                            setFormData({ ...formData, city: e.target.value })
                          }
                          placeholder="Kota"
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 lg:text-base"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-medium text-gray-700 lg:text-sm">
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
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 lg:text-base"
                        />
                      </div>
                    </div>

                    {/* WhatsApp */}
                    <div>
                      <label className="mb-2 block text-xs font-medium text-gray-700 lg:text-sm">
                        WhatsApp
                      </label>
                      <div className="relative">
                        <MessageCircle className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 lg:h-5 lg:w-5" />
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
                          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 lg:pl-10 lg:text-base"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg hover:shadow-xl disabled:opacity-50 sm:w-auto lg:text-base"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin lg:h-5 lg:w-5" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 lg:h-5 lg:w-5" />
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 bg-gradient-to-r from-blue-600 to-cyan-600 p-4 lg:p-6">
              <h2 className="text-lg font-semibold text-white lg:text-xl">
                Keamanan
              </h2>
              <p className="mt-1 text-xs text-white/80 lg:text-sm">
                Ubah password dan kelola keamanan akun Anda
              </p>
            </div>

            <div className="p-4 lg:p-6">
              <div className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-700 lg:text-sm">
                    Password Saat Ini
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 lg:h-5 lg:w-5" />
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
                      className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 lg:pl-10 lg:text-base"
                    />
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-700 lg:text-sm">
                    Password Baru
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 lg:h-5 lg:w-5" />
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
                      className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 lg:pl-10 lg:text-base"
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-700 lg:text-sm">
                    Konfirmasi Password Baru
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 lg:h-5 lg:w-5" />
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
                      className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 lg:pl-10 lg:text-base"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Password minimal 6 karakter
                  </p>
                </div>
              </div>

              {/* Change Password Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleChangePassword}
                  disabled={
                    saving ||
                    !passwordData.currentPassword ||
                    !passwordData.newPassword ||
                    !passwordData.confirmPassword
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg hover:shadow-xl disabled:opacity-50 sm:w-auto lg:text-base"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin lg:h-5 lg:w-5" />
                      Mengubah...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 lg:h-5 lg:w-5" />
                      Ubah Password
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
