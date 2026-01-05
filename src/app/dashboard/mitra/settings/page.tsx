'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import {
  User,
  Phone,
  Mail,
  Loader2,
  Check,
  Lock,
  Building2,
  MapPin,
  MessageCircle,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

type Tab = 'profile' | 'security'

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

export default function MitraSettingsPage() {
  const { update } = useSession()

  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
        <div className="absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-cyan-400/20 blur-[100px]" />
        <div className="absolute right-[-10%] top-[10%] h-[600px] w-[600px] rounded-full bg-blue-400/20 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[20%] h-[500px] w-[500px] rounded-full bg-sky-300/20 blur-[100px]" />
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
                            Profil Mitra
                          </h2>
                          <p className="text-sm text-gray-600">
                            Update informasi profil dan bisnis Anda
                          </p>
                        </div>

                        {/* Profile Form */}
                        <div className="space-y-5">
                          {/* Personal Information Section */}
                          <div className="rounded-xl bg-gray-50 p-5">
                            <h3 className="mb-4 text-sm font-bold text-gray-900">
                              Informasi Pribadi
                            </h3>
                            <div className="space-y-4">
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
                                  className="w-full rounded-xl border-gray-200 bg-white p-3 font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                                />
                              </div>
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
                                  className="w-full rounded-xl border-gray-200 bg-white p-3 font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
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
                                  className="w-full rounded-xl border-gray-200 bg-white p-3 font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Business Information Section */}
                          <div className="rounded-xl bg-gray-50 p-5">
                            <h3 className="mb-4 text-sm font-bold text-gray-900">
                              Informasi Bisnis
                            </h3>
                            <div className="space-y-4">
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
                                  className="w-full rounded-xl border-gray-200 bg-white p-3 font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                                />
                              </div>
                              <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                  Alamat
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
                                  className="w-full resize-none rounded-xl border-gray-200 bg-white p-3 font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                                />
                              </div>
                              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                                    className="w-full rounded-xl border-gray-200 bg-white p-3 font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
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
                                    className="w-full rounded-xl border-gray-200 bg-white p-3 font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                  WhatsApp
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
                                  className="w-full rounded-xl border-gray-200 bg-white p-3 font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                                />
                              </div>
                            </div>
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
                              className="w-full rounded-xl border-gray-200 bg-gray-50 p-3 font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
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
                              className="w-full rounded-xl border-gray-200 bg-gray-50 p-3 font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
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
                              className="w-full rounded-xl border-gray-200 bg-gray-50 p-3 font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
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
      </div>
    </motion.div>
  )
}
