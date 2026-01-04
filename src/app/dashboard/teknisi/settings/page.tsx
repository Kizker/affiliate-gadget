'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import {
  User,
  Lock,
  Briefcase,
  Camera,
  Loader2,
  Check,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

type Tab = 'profile' | 'technician' | 'security'

interface UserProfile {
  id: string
  name: string | null
  email: string
  image: string | null
  phone: string | null
  technician?: {
    bio: string | null
    experience: number
    specialties: string[]
    isAvailable: boolean
  }
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

export default function SettingsPage() {
  const { status, update } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Profile data
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // Technician data
  const [bio, setBio] = useState('')
  const [experience, setExperience] = useState(0)
  const [specialtiesInput, setSpecialtiesInput] = useState('')
  const [isAvailable, setIsAvailable] = useState(true)

  // Password data
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const data = await res.json()
        setProfile(data.user)
        setName(data.user.name || '')
        setEmail(data.user.email)
        setPhone(data.user.phone || '')
        setAvatarPreview(data.user.image)

        if (data.user.technician) {
          setBio(data.user.technician.bio || '')
          setExperience(data.user.technician.experience || 0)
          setSpecialtiesInput(
            data.user.technician.specialties?.join(', ') || ''
          )
          setIsAvailable(data.user.technician.isAvailable)
        }
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
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchProfile()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, router])

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

  const handleSaveTechnician = async () => {
    setSaving(true)
    try {
      const specialties = specialtiesInput
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)

      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio,
          experience,
          specialties,
          isAvailable,
        }),
      })

      if (res.ok) {
        toast({
          title: 'Berhasil!',
          description: 'Data teknisi berhasil diupdate',
        })
      } else {
        const error = await res.json()
        toast({
          title: 'Gagal',
          description: error.error || 'Gagal mengupdate data teknisi',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error updating technician:', error)
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat mengupdate data teknisi',
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Background Mesh */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-blue-400/20 blur-[100px]" />
        <div className="absolute right-[-10%] top-[10%] h-[600px] w-[600px] rounded-full bg-violet-400/20 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[20%] h-[500px] w-[500px] rounded-full bg-indigo-300/20 blur-[100px]" />
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
            href="/dashboard/teknisi"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-indigo-600"
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

        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar Tabs */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <div className="overflow-hidden rounded-[2rem] border border-white/60 bg-white/60 p-6 shadow-xl shadow-indigo-100/10 backdrop-blur-xl">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-semibold transition-all ${
                    activeTab === 'profile'
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <User className="h-5 w-5" />
                  <span>Profil</span>
                </button>
                {profile?.technician && (
                  <button
                    onClick={() => setActiveTab('technician')}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-semibold transition-all ${
                      activeTab === 'technician'
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Briefcase className="h-5 w-5" />
                    <span>Teknisi</span>
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('security')}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-semibold transition-all ${
                    activeTab === 'security'
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Lock className="h-5 w-5" />
                  <span>Keamanan</span>
                </button>
              </nav>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div variants={itemVariants} className="lg:col-span-3">
            <div className="overflow-hidden rounded-[2rem] border border-white/60 bg-white/60 p-8 shadow-xl shadow-indigo-100/10 backdrop-blur-xl">
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
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600">
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
                          className="w-full rounded-xl border-gray-200 bg-gray-50 p-3 font-medium outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
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
                          className="w-full rounded-xl border-gray-200 bg-gray-50 p-3 font-medium outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
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
                          className="w-full rounded-xl border-gray-200 bg-gray-50 p-3 font-medium outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
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

                {/* Technician Tab */}
                {activeTab === 'technician' && profile?.technician && (
                  <motion.div
                    key="technician"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Data Teknisi
                      </h2>
                      <p className="text-sm text-gray-600">
                        Kelola informasi profesional Anda sebagai teknisi
                      </p>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Bio
                        </label>
                        <textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          rows={4}
                          placeholder="Ceritakan tentang diri Anda..."
                          className="w-full resize-none rounded-xl border-gray-200 bg-gray-50 p-3 font-medium outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Pengalaman (tahun)
                        </label>
                        <input
                          type="number"
                          value={experience}
                          onChange={(e) =>
                            setExperience(parseInt(e.target.value) || 0)
                          }
                          min="0"
                          className="w-full rounded-xl border-gray-200 bg-gray-50 p-3 font-medium outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Spesialisasi (pisahkan dengan koma)
                        </label>
                        <input
                          type="text"
                          value={specialtiesInput}
                          onChange={(e) => setSpecialtiesInput(e.target.value)}
                          placeholder="iPhone, Samsung, Xiaomi"
                          className="w-full rounded-xl border-gray-200 bg-gray-50 p-3 font-medium outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                      <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
                        <input
                          type="checkbox"
                          id="isAvailable"
                          checked={isAvailable}
                          onChange={(e) => setIsAvailable(e.target.checked)}
                          className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                        />
                        <label
                          htmlFor="isAvailable"
                          className="font-semibold text-gray-700"
                        >
                          Tersedia untuk menerima pesanan
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSaveTechnician}
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
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full rounded-xl border-gray-200 bg-gray-50 p-3 font-medium outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
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
                          className="w-full rounded-xl border-gray-200 bg-gray-50 p-3 font-medium outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Konfirmasi Password Baru
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full rounded-xl border-gray-200 bg-gray-50 p-3 font-medium outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
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
          </motion.div>
        </div>
      </motion.main>

      <Footer variant="light" />
      <Toaster />
    </div>
  )
}
