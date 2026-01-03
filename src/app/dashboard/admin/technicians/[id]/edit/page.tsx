'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Plus, Edit2, Trash2, Save, X } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Service {
  id: string
  name: string
  description: string | null
  category: 'KONSULTASI' | 'CEK_BONGKAR' | 'SERVIS_LENGKAP'
  price: number
  duration: number | null
  isActive: boolean
}

interface Technician {
  id: string
  bio: string | null
  experience: number
  specialties: string[]
  isAvailable: boolean
  services: Service[]
  user: {
    name: string | null
    email: string
  }
}

export default function EditTechnicianPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [technician, setTechnician] = useState<Technician | null>(null)

  // Technician form data
  const [formData, setFormData] = useState({
    bio: '',
    experience: 0,
    specialties: [] as string[],
    isAvailable: true,
  })

  // Service form data
  const [showServiceForm, setShowServiceForm] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    category: 'KONSULTASI' as 'KONSULTASI' | 'CEK_BONGKAR' | 'SERVIS_LENGKAP',
    price: 0,
    duration: 0,
    isActive: true,
  })

  useEffect(() => {
    fetchTechnician()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchTechnician = async () => {
    try {
      const res = await fetch(`/api/admin/technicians/${resolvedParams.id}`)
      if (!res.ok) throw new Error('Failed to fetch')

      const data = await res.json()
      setTechnician(data)
      setFormData({
        bio: data.bio || '',
        experience: data.experience,
        specialties: data.specialties,
        isAvailable: data.isAvailable,
      })
    } catch (error) {
      console.error('Error loading technician data:', error)
      toast.error('Gagal memuat data teknisi')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch(`/api/admin/technicians/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update')
      }

      toast.success('Teknisi berhasil diupdate!')
      router.refresh()
      fetchTechnician()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Gagal mengupdate teknisi'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleAddService = () => {
    setEditingService(null)
    setServiceForm({
      name: '',
      description: '',
      category: 'KONSULTASI',
      price: 0,
      duration: 0,
      isActive: true,
    })
    setShowServiceForm(true)
  }

  const handleEditService = (service: Service) => {
    setEditingService(service)
    setServiceForm({
      name: service.name,
      description: service.description || '',
      category: service.category,
      price: service.price,
      duration: service.duration || 0,
      isActive: service.isActive,
    })
    setShowServiceForm(true)
  }

  const handleSaveService = async () => {
    try {
      if (!serviceForm.name || serviceForm.price <= 0) {
        toast.error('Nama dan harga layanan wajib diisi')
        return
      }

      const url = editingService
        ? `/api/admin/services/${editingService.id}`
        : `/api/admin/services`

      const method = editingService ? 'PUT' : 'POST'

      const payload = editingService
        ? serviceForm
        : { ...serviceForm, technicianId: resolvedParams.id }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to save service')
      }

      toast.success(
        editingService
          ? 'Layanan berhasil diupdate!'
          : 'Layanan berhasil ditambahkan!'
      )
      setShowServiceForm(false)
      fetchTechnician()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Gagal menyimpan layanan'
      )
    }
  }

  const handleDeleteService = async (
    serviceId: string,
    serviceName: string
  ) => {
    if (
      !confirm(`Apakah Anda yakin ingin menghapus layanan "${serviceName}"?`)
    ) {
      return
    }

    try {
      const res = await fetch(`/api/admin/services/${serviceId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete service')
      }

      toast.success('Layanan berhasil dihapus!')
      fetchTechnician()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Gagal menghapus layanan'
      )
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      KONSULTASI: 'Konsultasi',
      CEK_BONGKAR: 'Cek & Bongkar',
      SERVIS_LENGKAP: 'Servis Lengkap',
    }
    return labels[category] || category
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!technician) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Teknisi tidak ditemukan</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/admin/technicians"
          className="mb-4 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Teknisi
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Teknisi</h1>
        <p className="mt-2 text-gray-600">
          {technician.user.name} ({technician.user.email})
        </p>
      </div>

      {/* Technician Profile Form */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:p-8">
        <h2 className="mb-6 text-xl font-semibold text-gray-900">
          Profil Teknisi
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
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
              placeholder="Deskripsi tentang teknisi..."
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Pengalaman (tahun)
              </label>
              <input
                type="number"
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
                Spesialisasi
              </label>
              <input
                type="text"
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
              <p className="mt-1 text-sm text-gray-500">Pisahkan dengan koma</p>
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
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <label
              htmlFor="isAvailable"
              className="text-sm font-medium text-gray-700"
            >
              Tersedia untuk menerima servis
            </label>
          </div>

          <div className="flex gap-4 border-t pt-6">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 font-medium text-white shadow-lg disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Perubahan'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Services Section */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Layanan</h2>
            <p className="mt-1 text-sm text-gray-600">
              Kelola layanan yang ditawarkan teknisi
            </p>
          </div>
          <button
            onClick={handleAddService}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 text-sm font-medium text-white hover:shadow-lg"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Tambah Layanan</span>
            <span className="sm:hidden">Tambah</span>
          </button>
        </div>

        {/* Service Form Modal */}
        {showServiceForm && (
          <div className="mb-6 rounded-lg border-2 border-blue-200 bg-blue-50 p-4 lg:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingService ? 'Edit Layanan' : 'Tambah Layanan Baru'}
              </h3>
              <button
                onClick={() => setShowServiceForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nama Layanan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={serviceForm.name}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, name: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    placeholder="Servis LCD iPhone"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={serviceForm.category}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        category: e.target.value as any,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="KONSULTASI">Konsultasi</option>
                    <option value="CEK_BONGKAR">Cek & Bongkar</option>
                    <option value="SERVIS_LENGKAP">Servis Lengkap</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Harga (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={serviceForm.price}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    placeholder="50000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Durasi (menit)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={serviceForm.duration}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        duration: parseInt(e.target.value) || 0,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    placeholder="60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Deskripsi
                </label>
                <textarea
                  value={serviceForm.description}
                  onChange={(e) =>
                    setServiceForm({
                      ...serviceForm,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="Detail layanan..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="serviceActive"
                  checked={serviceForm.isActive}
                  onChange={(e) =>
                    setServiceForm({
                      ...serviceForm,
                      isActive: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <label
                  htmlFor="serviceActive"
                  className="text-sm font-medium text-gray-700"
                >
                  Layanan aktif
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveService}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Save className="mr-2 inline h-4 w-4" />
                  Simpan Layanan
                </button>
                <button
                  type="button"
                  onClick={() => setShowServiceForm(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Services List */}
        {technician.services.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500">Belum ada layanan</p>
            <button
              onClick={handleAddService}
              className="mt-4 text-sm text-blue-600 hover:text-blue-700"
            >
              Tambah layanan pertama
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {technician.services.map((service) => (
              <div
                key={service.id}
                className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex-1">
                  <div className="mb-2 flex items-start justify-between">
                    <h3 className="font-semibold text-gray-900">
                      {service.name}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        service.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {service.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>

                  <p className="mb-2 text-xs text-gray-600">
                    {getCategoryLabel(service.category)}
                  </p>

                  {service.description && (
                    <p className="mb-3 line-clamp-2 text-sm text-gray-600">
                      {service.description}
                    </p>
                  )}

                  <div className="mb-3 flex items-center justify-between text-sm">
                    <span className="font-semibold text-blue-600">
                      Rp {service.price.toLocaleString('id-ID')}
                    </span>
                    {service.duration && (
                      <span className="text-gray-500">
                        {service.duration} menit
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 border-t pt-3">
                  <button
                    onClick={() => handleEditService(service)}
                    className="flex-1 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100"
                  >
                    <Edit2 className="mr-1 inline h-3 w-3" />
                    Edit
                  </button>
                  <button
                    onClick={() =>
                      handleDeleteService(service.id, service.name)
                    }
                    className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
