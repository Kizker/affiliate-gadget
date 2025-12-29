'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  User,
  Phone,
  Mail,
  Upload,
  Loader2,
  Save,
  Lock,
  Key,
} from 'lucide-react'
import Link from 'next/link'

interface AdminProfile {
  id: string
  name: string | null
  email: string
  image: string | null
  phone: string | null
  role: string
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    image: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/admin/profile')
      if (res.ok) {
        const data = await res.json()
        setProfile(data.user)
        setFormData({
          name: data.user.name || '',
          phone: data.user.phone || '',
          image: data.user.image || '',
          email: data.user.email || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Gagal memuat profil')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    // Validate password fields
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        toast.error('Masukkan password saat ini')
        return
      }
      if (formData.newPassword.length < 6) {
        toast.error('Password baru minimal 6 karakter')
        return
      }
      if (formData.newPassword !== formData.confirmPassword) {
        toast.error('Konfirmasi password tidak cocok')
        return
      }
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          image: formData.image,
          email: formData.email,
          currentPassword: formData.currentPassword || undefined,
          newPassword: formData.newPassword || undefined,
        }),
      })

      if (res.ok) {
        toast.success('Profil berhasil diperbarui')
        // Reset password fields
        setFormData((prev) => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }))
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Hanya file gambar yang diperbolehkan')
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        setFormData((prev) => ({ ...prev, image: data.url }))
        toast.success('Foto berhasil diupload')
      } else {
        toast.error('Gagal upload foto')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Terjadi kesalahan saat upload')
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
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard/admin"
            className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            ← Kembali ke Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Pengaturan Profil
          </h1>
          <p className="mt-2 text-gray-600">
            Kelola profil dan informasi pribadi Anda
          </p>
        </div>

        {/* Profile Card */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 p-6">
            <h2 className="text-xl font-semibold text-white">Profil Saya</h2>
            <p className="mt-1 text-sm text-white/80">
              Update foto profil dan informasi pribadi Anda
            </p>
          </div>

          <div className="p-6">
            {/* Profile Photo */}
            <div className="mb-6 flex items-center gap-6">
              <div className="relative">
                {formData.image ? (
                  <img
                    src={formData.image}
                    alt="Profile"
                    className="h-24 w-24 rounded-full object-cover ring-4 ring-blue-100"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white ring-4 ring-blue-100">
                    <User className="h-12 w-12" />
                  </div>
                )}
                <label
                  htmlFor="image-upload"
                  className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700"
                >
                  <Upload className="h-4 w-4" />
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {formData.name || 'Admin'}
                </h3>
                <p className="text-sm text-gray-500">{profile?.role}</p>
                <p className="mt-1 text-xs text-gray-400">
                  JPG, PNG atau GIF. Maks 2MB
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Masukkan nama lengkap"
                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="admin@example.com"
                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Nomor Telepon
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="08123456789"
                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">
                  Ubah Password
                </h3>
              </div>

              {/* Current Password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Password Saat Ini
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currentPassword: e.target.value,
                      })
                    }
                    placeholder="Masukkan password saat ini"
                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Password Baru
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, newPassword: e.target.value })
                    }
                    placeholder="Minimal 6 karakter"
                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Konfirmasi Password Baru
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Ulangi password baru"
                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Kosongkan jika tidak ingin mengubah password
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2.5 font-medium text-white shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
