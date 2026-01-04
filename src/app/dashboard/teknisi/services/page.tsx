'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Search,
  Wrench,
  Cpu,
  Edit2,
  Trash2,
  X,
  Loader2,
  Clock,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// --- Types ---

interface Service {
  id: string
  name: string
  category: string
  price: number
  minPrice?: number | null
  maxPrice?: number | null
  description: string | null
  estimatedDuration: number
}

const SERVICE_CATEGORIES = [
  { value: 'KONSULTASI', label: 'Konsultasi' },
  { value: 'CEK_BONGKAR', label: 'Cek & Bongkar' },
  { value: 'SERVIS_LENGKAP', label: 'Servis Lengkap' },
] as const

// --- Animation Variants ---

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
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

// --- Components ---

const CategoryIcon = ({ category }: { category: string }) => {
  switch (category) {
    case 'KONSULTASI':
      return <Search className="h-6 w-6" />
    case 'CEK_BONGKAR':
      return <Wrench className="h-6 w-6" />
    case 'SERVIS_LENGKAP':
      return <Cpu className="h-6 w-6" />
    default:
      return <Wrench className="h-6 w-6" />
  }
}

const categoryColors = {
  KONSULTASI: 'bg-indigo-100 text-indigo-600',
  CEK_BONGKAR: 'bg-amber-100 text-amber-600',
  SERVIS_LENGKAP: 'bg-emerald-100 text-emerald-600',
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(price)

const formatPriceRange = (service: Service) => {
  const minPrice = service.minPrice ?? service.price
  if (service.maxPrice && service.maxPrice > minPrice) {
    return `${formatPrice(minPrice)} - ${formatPrice(service.maxPrice)}`
  }
  return formatPrice(minPrice)
}

export default function ServicesPage() {
  const { status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'KONSULTASI',
    minPrice: '',
    maxPrice: '',
    description: '',
    duration: '60',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch('/api/technicians/me/services')
      if (res.ok) {
        const data = await res.json()
        setServices(data.services)
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      // Fake delay for smoother entry
      setTimeout(() => setLoading(false), 300)
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    if (status === 'authenticated') fetchServices()
  }, [status, router, fetchServices])

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setEditingService(service)
      setFormData({
        name: service.name,
        category: service.category,
        minPrice: (service.minPrice ?? service.price).toString(),
        maxPrice: service.maxPrice?.toString() || '',
        description: service.description || '',
        duration: service.estimatedDuration.toString(),
      })
    } else {
      setEditingService(null)
      setFormData({
        name: '',
        category: 'KONSULTASI',
        minPrice: '',
        maxPrice: '',
        description: '',
        duration: '60',
      })
    }
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    if (!confirm('Apakah Anda yakin ingin menghapus layanan ini?')) return

    try {
      const res = await fetch(`/api/technicians/me/services/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast({ title: 'Berhasil', description: 'Layanan dihapus.' })
        setServices((prev) => prev.filter((s) => s.id !== id))
      } else {
        throw new Error('Gagal menghapus')
      }
    } catch {
      toast({
        title: 'Gagal',
        description: 'Gagal menghapus layanan.',
        variant: 'destructive',
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = editingService
        ? `/api/technicians/me/services/${editingService.id}` // Assuming PUT/PATCH route exists
        : '/api/technicians/me/services'

      const method = editingService ? 'PATCH' : 'POST' // Using PATCH typically for updates based on common conventions here

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          description: formData.description,
          duration: parseInt(formData.duration),
          minPrice: formData.minPrice ? parseFloat(formData.minPrice) : null,
          maxPrice: formData.maxPrice ? parseFloat(formData.maxPrice) : null,
          price: formData.minPrice ? parseFloat(formData.minPrice) : 0,
        }),
      })

      if (!res.ok) throw new Error('Failed to save')

      toast({
        title: 'Berhasil',
        description: `Layanan berhasil ${editingService ? 'diperbarui' : 'ditambahkan'}.`,
      })
      setIsModalOpen(false)
      fetchServices() // Refetch to get fresh list
    } catch {
      toast({
        title: 'Gagal',
        description: 'Gagal menyimpan data.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Background Mesh (Matching Dashboard) */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-blue-400/20 blur-[100px]" />
        <div className="absolute right-[-10%] top-[10%] h-[600px] w-[600px] rounded-full bg-violet-400/20 blur-[100px]" />
      </div>

      <motion.main
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="container relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
      >
        {/* Header */}
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Link
              href="/dashboard/teknisi"
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-indigo-600"
            >
              <ArrowLeft className="h-4 w-4" /> Kembali ke Dashboard
            </Link>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                <Wrench className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                  Kelola Layanan
                </h1>
                <p className="text-gray-500">
                  Atur daftar harga dan jenis layanan yang Anda tawarkan.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari layanan..."
                className="h-11 rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none ring-offset-2 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleOpenModal()}
              className="flex h-11 items-center gap-2 rounded-xl bg-gray-900 px-5 text-sm font-bold text-white shadow-lg shadow-gray-900/20 transition-all hover:bg-gray-800"
            >
              <Plus className="h-4 w-4" /> Tambah
            </motion.button>
          </div>
        </div>

        {/* Content */}
        {filteredServices.length === 0 ? (
          <div className="flex h-[60vh] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-12 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm">
              <Wrench className="h-10 w-10 text-gray-300" />
            </div>
            <h3 className="mt-6 text-xl font-bold text-gray-900">
              Belum ada layanan
            </h3>
            <p className="mt-2 max-w-sm text-gray-500">
              Anda belum menambahkan layanan apapun. Mulai tambahkan layanan
              untuk menarik pelanggan.
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="mt-6 font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              + Tambah Layanan Sekarang
            </button>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {filteredServices.map((service) => (
              <motion.div
                key={service.id}
                variants={itemVariants}
                layout // Animate layout changes like filtering
                className="group relative flex flex-col justify-between overflow-hidden rounded-[2rem] border border-white/60 bg-white/60 p-6 shadow-xl shadow-indigo-100/10 backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-indigo-100 hover:shadow-2xl"
              >
                <div className="absolute right-4 top-4 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenModal(service)
                    }}
                    className="rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(service.id, e)}
                    className="rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div>
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${categoryColors[service.category as keyof typeof categoryColors] || categoryColors.KONSULTASI} transition-transform group-hover:scale-110`}
                  >
                    <CategoryIcon category={service.category} />
                  </div>
                  <div className="mt-6">
                    <h3 className="text-lg font-bold leading-tight text-gray-900">
                      {service.name}
                    </h3>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      {service.category.replace(/_/g, ' ')}
                    </p>
                  </div>
                  {service.description && (
                    <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-gray-500">
                      {service.description}
                    </p>
                  )}
                </div>

                <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500">
                      <Clock className="h-3.5 w-3.5" />
                      {service.estimatedDuration} min
                    </div>
                  </div>
                  <p className="text-left text-lg font-bold text-indigo-600">
                    {formatPriceRange(service)}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.main>

      {/* Manual Modal Implementation with Framer Motion */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-[2rem] bg-white shadow-2xl"
            >
              <div className="border-b border-gray-100 bg-gradient-to-br from-indigo-50 to-white px-8 py-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingService ? 'Edit Layanan' : 'Layanan Baru'}
                </h2>
                <p className="text-sm text-gray-500">
                  Lengkapi detail layanan yang Anda tawarkan.
                </p>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute right-6 top-6 rounded-full bg-white p-2 text-gray-400 shadow-sm hover:text-gray-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Nama Layanan
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full rounded-xl border-gray-200 bg-gray-50 p-3 text-sm font-medium outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Contoh: Install Ulang Windows"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Kategori
                      </label>
                      <div className="relative">
                        <select
                          className="w-full appearance-none rounded-xl border-gray-200 bg-gray-50 p-3 text-sm font-medium outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                          value={formData.category}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              category: e.target.value,
                            })
                          }
                        >
                          {SERVICE_CATEGORIES.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Estimasi (Menit)
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type="number"
                          className="w-full rounded-xl border-gray-200 bg-gray-50 py-3 pl-10 pr-3 text-sm font-medium outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                          placeholder="60"
                          value={formData.duration}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              duration: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Kisaran Harga (Rp)
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
                          Min
                        </span>
                        <input
                          required
                          type="number"
                          className="w-full rounded-xl border-gray-200 bg-gray-50 py-3 pl-10 pr-3 text-base font-bold outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                          placeholder="0"
                          value={formData.minPrice}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              minPrice: e.target.value,
                            })
                          }
                        />
                      </div>
                      <span className="text-gray-400">-</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
                          Max
                        </span>
                        <input
                          type="number"
                          className="w-full rounded-xl border-gray-200 bg-gray-50 py-3 pl-10 pr-3 text-base font-bold outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                          placeholder="Opsional"
                          value={formData.maxPrice}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              maxPrice: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      Harga fix akan ditentukan saat proses pengerjaan
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Deskripsi (Opsional)
                    </label>
                    <textarea
                      rows={3}
                      className="w-full resize-none rounded-xl border-gray-200 bg-gray-50 p-3 text-sm font-medium outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Jelaskan detail layanan..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-200"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-[2] rounded-xl bg-gray-900 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-gray-800 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />{' '}
                          Menyimpan...
                        </span>
                      ) : (
                        'Simpan Layanan'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
