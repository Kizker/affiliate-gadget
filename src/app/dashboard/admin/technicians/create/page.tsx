'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Upload, X } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function CreateTechnicianPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    // User fields
    name: '',
    email: '',
    phone: '',
    image: '',
    password: '',
    // Technician fields
    bio: '',
    experience: 0,
    specialties: [] as string[],
    isAvailable: true,
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
        setFormData({ ...formData, image: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImagePreview(null)
    setFormData({ ...formData, image: '' })
  }

  const generatePassword = () => {
    const password =
      Math.random().toString(36).slice(-10) +
      Math.random().toString(36).slice(-10).toUpperCase()
    setFormData({ ...formData, password })
    toast.success('Password generated')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.name || !formData.email) {
        toast.error('Nama dan email wajib diisi')
        setLoading(false)
        return
      }

      if (formData.specialties.length === 0) {
        toast.error('Minimal satu spesialisasi harus diisi')
        setLoading(false)
        return
      }

      const res = await fetch('/api/admin/technicians', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const responseData = await res.json()

      if (!res.ok) {
        throw new Error(responseData.error || 'Gagal membuat teknisi')
      }

      toast.success('Teknisi berhasil dibuat!')

      // Wait a bit before redirecting to ensure database transaction completes
      await new Promise((resolve) => setTimeout(resolve, 500))

      router.refresh() // Refresh to get latest data
      router.push('/dashboard/admin/technicians')
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      toast.error(
        error instanceof Error ? error.message : 'Gagal membuat teknisi'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/dashboard/admin/technicians"
          className="mb-4 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Technicians
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          Tambah Teknisi Baru
        </h1>
        <p className="mt-2 text-gray-600">
          Buat akun user dan profil teknisi sekaligus
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* User Information Section */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Informasi Akun
            </h2>
            <div className="space-y-6">
              {/* Image Upload */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Foto Profil (Opsional)
                </label>
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-32 w-32 rounded-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-full border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <span className="mt-2 text-xs text-gray-500">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  Jika tidak diisi, akan tampil avatar default
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    placeholder="Ahmad Teknisi"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    placeholder="ahmad@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    No. Telepon
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
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
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
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
                  <p className="mt-1 text-sm text-gray-500">
                    Kosongkan untuk auto-generate password
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Technician Information Section */}
          <div className="border-t pt-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Informasi Teknisi
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="Pengalaman dan keahlian teknisi..."
                />
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Pengalaman (tahun) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.experience}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        experience: parseInt(e.target.value) || 0,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Spesialisasi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.specialties.join(', ')}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        specialties: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter((s) => s),
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    placeholder="LCD, Mesin, Software"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Pisahkan dengan koma
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onChange={(e) =>
                    setFormData({ ...formData, isAvailable: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="isAvailable"
                  className="text-sm font-medium text-gray-700"
                >
                  Tersedia untuk menerima servis
                </label>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 border-t pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 font-medium text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                  Membuat Teknisi...
                </>
              ) : (
                'Buat Teknisi'
              )}
            </button>
            <Link
              href="/dashboard/admin/technicians"
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
