'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { useConfirm } from '@/components/ui/confirm-dialog'
import {
  Star,
  Package,
  DollarSign,
  MessageCircle,
  Loader2,
  Edit,
  Plus,
  Trash2,
  Check,
  X,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'

interface Stats {
  totalOrders: number
  activeOrders: number
  completedOrders: number
  totalRevenue: number
  averageRating: number
  totalReviews: number
  unreadMessages: number
  ordersByStatus: {
    pending: number
    inProgress: number
    completed: number
    cancelled: number
  }
}

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

interface Order {
  id: string
  status: string
  total: number
  createdAt: string
  technicianPaymentRequestedById?: string | null
  user: {
    name: string | null
    email: string
    image: string | null
  }
  items: Array<{
    service: {
      name: string
      category: string
    }
  }>
}

interface TechnicianProfile {
  id: string
  bio: string | null
  experience: number
  specialties: string[]
  rating: number
  totalReview: number
  isAvailable: boolean
  user: {
    name: string | null
    email: string | null
    image: string | null
    phone: string | null
  }
}

export default function TechnicianDashboard() {
  const { status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  const [stats, setStats] = useState<Stats | null>(null)
  const [profile, setProfile] = useState<TechnicianProfile | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL')
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [requestingPaymentId, setRequestingPaymentId] = useState<string | null>(
    null
  )
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [, setEditingProfile] = useState(false)
  const [addingService, setAddingService] = useState(false)

  // Form states (currently unused, kept for future use)
  const [, setBio] = useState('')
  const [, setExperience] = useState(0)
  const [, setSpecialtiesInput] = useState('')
  const [, setIsAvailable] = useState(true)

  // Service form (for both add and edit)
  const [serviceName, setServiceName] = useState('')
  const [serviceCategory, setServiceCategory] = useState('KONSULTASI')
  const [serviceMinPrice, setServiceMinPrice] = useState('')
  const [serviceMaxPrice, setServiceMaxPrice] = useState('')
  const [serviceDescription, setServiceDescription] = useState('')

  // Edit service state
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchData()
    }
  }, [status, router])

  // Auto-refresh when order status filter changes
  useEffect(() => {
    if (status === 'authenticated') {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderStatusFilter])

  const fetchData = async () => {
    try {
      const statusParam =
        orderStatusFilter !== 'ALL' ? `&status=${orderStatusFilter}` : ''
      const [statsRes, profileRes, servicesRes, ordersRes] = await Promise.all([
        fetch('/api/technicians/me/stats'),
        fetch('/api/technicians/me/profile'),
        fetch('/api/technicians/me/services'),
        fetch(`/api/technicians/me/orders?limit=10${statusParam}`),
      ])

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
      }

      if (profileRes.ok) {
        const data = await profileRes.json()
        setProfile(data.technician)
        setBio(data.technician.bio || '')
        setExperience(data.technician.experience)
        setSpecialtiesInput(data.technician.specialties.join(', '))
        setIsAvailable(data.technician.isAvailable)
      }

      if (servicesRes.ok) {
        const data = await servicesRes.json()
        setServices(data.services)
      }

      if (ordersRes.ok) {
        const data = await ordersRes.json()
        setOrders(data.orders)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: string
  ) => {
    try {
      setUpdatingOrderId(orderId)
      const res = await fetch(`/api/technicians/me/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        toast({
          title: 'Berhasil!',
          description: `Status pesanan berhasil diupdate ke ${newStatus}`,
        })
        fetchData() // Refresh orders
      } else {
        const error = await res.json()
        toast({
          title: 'Gagal',
          description: error.error || 'Gagal mengupdate status pesanan',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat mengupdate status',
        variant: 'destructive',
      })
    } finally {
      setUpdatingOrderId(null)
    }
  }

  // Request payment confirmation from superadmin
  const handleRequestPayment = async (orderId: string) => {
    try {
      setRequestingPaymentId(orderId)
      const res = await fetch('/api/technician/orders/payment-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })

      if (res.ok) {
        toast({
          title: 'Request Terkirim!',
          description:
            'Permintaan konfirmasi pembayaran sudah dikirim ke Super Admin',
        })
        fetchData() // Refresh orders
      } else {
        const error = await res.json()
        toast({
          title: 'Gagal',
          description: error.error || 'Gagal mengirim request pembayaran',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error requesting payment:', error)
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan',
        variant: 'destructive',
      })
    } finally {
      setRequestingPaymentId(null)
    }
  }

  const handleAddService = async () => {
    try {
      const minPrice = parseFloat(serviceMinPrice || '0')
      const maxPrice = parseFloat(serviceMaxPrice || '0')

      if (!serviceName || serviceMinPrice === '') {
        toast({
          title: 'Validasi Gagal',
          description:
            'Nama layanan dan harga minimum harus diisi (gunakan 0 untuk gratis)',
          variant: 'destructive',
        })
        return
      }

      if (minPrice < 0) {
        toast({
          title: 'Validasi Gagal',
          description: 'Harga tidak boleh negatif',
          variant: 'destructive',
        })
        return
      }

      if (serviceMaxPrice && (maxPrice < 0 || maxPrice < minPrice)) {
        toast({
          title: 'Validasi Gagal',
          description:
            'Harga maksimum harus lebih besar dari atau sama dengan harga minimum',
          variant: 'destructive',
        })
        return
      }

      const res = await fetch('/api/technicians/me/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: serviceName,
          category: serviceCategory,
          price: minPrice, // Use minPrice as base price
          minPrice: minPrice,
          maxPrice: serviceMaxPrice ? maxPrice : null,
          description: serviceDescription,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setServices([data.service, ...services])
        setAddingService(false)
        setServiceName('')
        setServiceMinPrice('')
        setServiceMaxPrice('')
        setServiceDescription('')
        toast({
          title: 'Berhasil!',
          description: 'Layanan berhasil ditambahkan',
        })
      } else {
        toast({
          title: 'Gagal',
          description: 'Gagal menambahkan layanan',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error adding service:', error)
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat menambahkan layanan',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteService = async (id: string) => {
    confirm(
      'Hapus Layanan',
      'Yakin ingin menghapus layanan ini? Tindakan ini tidak dapat dibatalkan.',
      async () => {
        try {
          const res = await fetch(`/api/technicians/me/services/${id}`, {
            method: 'DELETE',
          })

          if (res.ok) {
            setServices(services.filter((s) => s.id !== id))
            toast({
              title: 'Berhasil!',
              description: 'Layanan berhasil dihapus',
            })
          } else {
            toast({
              title: 'Gagal',
              description: 'Gagal menghapus layanan',
              variant: 'destructive',
            })
          }
        } catch (error) {
          console.error('Error deleting service:', error)
          toast({
            title: 'Error',
            description: 'Terjadi kesalahan saat menghapus layanan',
            variant: 'destructive',
          })
        }
      }
    )
  }

  const handleEditService = (service: Service) => {
    setEditingServiceId(service.id)
    setServiceName(service.name)
    setServiceCategory(service.category)
    setServiceMinPrice(service.minPrice?.toString() || '')
    setServiceMaxPrice(service.maxPrice?.toString() || '')
    setServiceDescription(service.description || '')
  }

  const handleUpdateService = async () => {
    if (!editingServiceId) return

    try {
      const minPrice = parseFloat(serviceMinPrice || '0')
      const maxPrice = parseFloat(serviceMaxPrice || '0')

      if (!serviceName || serviceMinPrice === '') {
        toast({
          title: 'Validasi Gagal',
          description:
            'Nama layanan dan harga minimum harus diisi (gunakan 0 untuk gratis)',
          variant: 'destructive',
        })
        return
      }

      if (minPrice < 0) {
        toast({
          title: 'Validasi Gagal',
          description: 'Harga tidak boleh negatif',
          variant: 'destructive',
        })
        return
      }

      if (serviceMaxPrice && (maxPrice < 0 || maxPrice < minPrice)) {
        toast({
          title: 'Validasi Gagal',
          description:
            'Harga maksimum harus lebih besar dari atau sama dengan harga minimum',
          variant: 'destructive',
        })
        return
      }

      const res = await fetch(
        `/api/technicians/me/services/${editingServiceId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: serviceName,
            category: serviceCategory,
            price: minPrice,
            minPrice: minPrice,
            maxPrice: serviceMaxPrice ? maxPrice : null,
            description: serviceDescription,
          }),
        }
      )

      if (res.ok) {
        const data = await res.json()
        setServices(
          services.map((s) => (s.id === editingServiceId ? data.service : s))
        )
        setEditingServiceId(null)
        setServiceName('')
        setServiceMinPrice('')
        setServiceMaxPrice('')
        setServiceDescription('')
        toast({
          title: 'Berhasil!',
          description: 'Layanan berhasil diupdate',
        })
      } else {
        toast({
          title: 'Gagal',
          description: 'Gagal mengupdate layanan',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error updating service:', error)
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat mengupdate layanan',
        variant: 'destructive',
      })
    }
  }

  const handleCancelEdit = () => {
    setEditingServiceId(null)
    setServiceName('')
    setServiceCategory('KONSULTASI')
    setServiceMinPrice('')
    setServiceMaxPrice('')
    setServiceDescription('')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    }
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  if (loading || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <Navbar variant="light" />

      <main className="mx-auto max-w-7xl px-4 pb-12 pt-24 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Selamat Datang, {profile?.user.name || 'Teknisi'}! 👋
          </h1>
          <p className="mt-1 text-gray-600">
            Kelola layanan dan pesanan Anda di sini
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-6">
          {/* Total Orders */}
          <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-4 text-white shadow-lg transition-all hover:scale-105 lg:rounded-2xl lg:p-6">
            <div className="absolute right-0 top-0 h-20 w-20 -translate-y-6 translate-x-6 rounded-full bg-white/10 lg:h-32 lg:w-32 lg:-translate-y-8 lg:translate-x-8" />
            <Package className="mb-2 h-6 w-6 lg:mb-4 lg:h-8 lg:w-8" />
            <p className="text-xs font-medium opacity-90 lg:text-sm">
              Total Pesanan
            </p>
            <p className="text-xl font-bold lg:text-3xl">
              {stats?.totalOrders || 0}
            </p>
            <p className="mt-1 text-xs opacity-75 lg:mt-2">
              {stats?.activeOrders || 0} aktif
            </p>
          </div>

          {/* Revenue */}
          <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-4 text-white shadow-lg transition-all hover:scale-105 lg:rounded-2xl lg:p-6">
            <div className="absolute right-0 top-0 h-20 w-20 -translate-y-6 translate-x-6 rounded-full bg-white/10 lg:h-32 lg:w-32 lg:-translate-y-8 lg:translate-x-8" />
            <DollarSign className="mb-2 h-6 w-6 lg:mb-4 lg:h-8 lg:w-8" />
            <p className="text-xs font-medium opacity-90 lg:text-sm">
              Pendapatan
            </p>
            <p className="text-lg font-bold lg:text-3xl">
              {formatCurrency(stats?.totalRevenue || 0)}
            </p>
            <p className="mt-1 text-xs opacity-75 lg:mt-2">
              {stats?.completedOrders || 0} selesai
            </p>
          </div>

          {/* Rating */}
          <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 p-4 text-white shadow-lg transition-all hover:scale-105 lg:rounded-2xl lg:p-6">
            <div className="absolute right-0 top-0 h-20 w-20 -translate-y-6 translate-x-6 rounded-full bg-white/10 lg:h-32 lg:w-32 lg:-translate-y-8 lg:translate-x-8" />
            <Star className="mb-2 h-6 w-6 lg:mb-4 lg:h-8 lg:w-8" />
            <p className="text-xs font-medium opacity-90 lg:text-sm">Rating</p>
            <p className="text-xl font-bold lg:text-3xl">
              {stats?.averageRating || 0}
            </p>
            <p className="mt-1 text-xs opacity-75 lg:mt-2">
              {stats?.totalReviews || 0} ulasan
            </p>
          </div>

          {/* Messages */}
          <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-4 text-white shadow-lg transition-all hover:scale-105 lg:rounded-2xl lg:p-6">
            <div className="absolute right-0 top-0 h-20 w-20 -translate-y-6 translate-x-6 rounded-full bg-white/10 lg:h-32 lg:w-32 lg:-translate-y-8 lg:translate-x-8" />
            <MessageCircle className="mb-2 h-6 w-6 lg:mb-4 lg:h-8 lg:w-8" />
            <p className="text-xs font-medium opacity-90 lg:text-sm">
              Pesan Baru
            </p>
            <p className="text-xl font-bold lg:text-3xl">
              {stats?.unreadMessages || 0}
            </p>
            <Link
              href="/chat"
              className="mt-1 inline-block text-xs opacity-75 hover:opacity-100 lg:mt-2"
            >
              Lihat semua →
            </Link>
          </div>
        </div>

        {/* Services Management */}
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Layanan Saya</h2>
            <button
              onClick={() => setAddingService(!addingService)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Tambah Layanan
            </button>
          </div>

          {/* Add Service Form */}
          {addingService && (
            <div className="mb-4 rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Nama Layanan"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  autoFocus
                  className="rounded-lg border border-gray-300 bg-white p-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <select
                  value={serviceCategory}
                  onChange={(e) => setServiceCategory(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white p-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="KONSULTASI">Konsultasi</option>
                  <option value="CEK_BONGKAR">Cek & Bongkar</option>
                  <option value="SERVIS_LENGKAP">Servis Lengkap</option>
                </select>
                <div className="grid grid-cols-2 gap-4 md:col-span-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Harga Minimum *{' '}
                      <span className="text-xs text-gray-500">
                        (0 untuk gratis)
                      </span>
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={serviceMinPrice}
                      onChange={(e) => setServiceMinPrice(e.target.value)}
                      min="0"
                      className="w-full rounded-lg border border-gray-300 bg-white p-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Harga Maksimum (opsional)
                    </label>
                    <input
                      type="number"
                      placeholder="150000"
                      value={serviceMaxPrice}
                      onChange={(e) => setServiceMaxPrice(e.target.value)}
                      min="0"
                      className="w-full rounded-lg border border-gray-300 bg-white p-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </div>
                <textarea
                  placeholder="Deskripsi (opsional)"
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white p-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 md:col-span-2"
                  rows={2}
                />
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleAddService}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                >
                  <Check className="h-4 w-4" />
                  Simpan
                </button>
                <button
                  onClick={() => setAddingService(false)}
                  className="flex items-center gap-2 rounded-lg bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400"
                >
                  <X className="h-4 w-4" />
                  Batal
                </button>
              </div>
            </div>
          )}

          {/* Services List */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="rounded-lg border border-gray-200 p-4 transition-all hover:shadow-md"
              >
                {editingServiceId === service.id ? (
                  // Edit Form
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white p-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Nama Layanan"
                    />
                    <select
                      value={serviceCategory}
                      onChange={(e) => setServiceCategory(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white p-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="KONSULTASI">Konsultasi</option>
                      <option value="CEK_BONGKAR">Cek & Bongkar</option>
                      <option value="SERVIS_LENGKAP">Servis Lengkap</option>
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Harga Min (0 = gratis)"
                        value={serviceMinPrice}
                        onChange={(e) => setServiceMinPrice(e.target.value)}
                        min="0"
                        className="w-full rounded-lg border border-gray-300 bg-white p-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                      <input
                        type="number"
                        placeholder="Harga Max (opsional)"
                        value={serviceMaxPrice}
                        onChange={(e) => setServiceMaxPrice(e.target.value)}
                        min="0"
                        className="w-full rounded-lg border border-gray-300 bg-white p-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                    <textarea
                      value={serviceDescription}
                      onChange={(e) => setServiceDescription(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white p-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Deskripsi"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdateService}
                        className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
                      >
                        <Check className="h-4 w-4" />
                        Simpan
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center gap-1 rounded-lg bg-gray-500 px-3 py-1.5 text-sm text-white hover:bg-gray-600"
                      >
                        <X className="h-4 w-4" />
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <>
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {service.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {service.category}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditService(service)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteService(service.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-blue-600">
                      {service.minPrice !== null &&
                      service.minPrice !== undefined &&
                      service.maxPrice !== null &&
                      service.maxPrice !== undefined
                        ? service.minPrice === 0 && service.maxPrice === 0
                          ? 'Gratis'
                          : service.minPrice === 0
                            ? `Gratis - ${formatCurrency(service.maxPrice)}`
                            : `${formatCurrency(service.minPrice)} - ${formatCurrency(service.maxPrice)}`
                        : service.minPrice !== null &&
                            service.minPrice !== undefined
                          ? service.minPrice === 0
                            ? 'Gratis'
                            : `Mulai dari ${formatCurrency(service.minPrice)}`
                          : service.price === 0
                            ? 'Gratis'
                            : formatCurrency(service.price)}
                    </p>
                    {service.description && (
                      <p className="mt-2 text-sm text-gray-600">
                        {service.description}
                      </p>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {services.length === 0 && !addingService && (
            <div className="py-12 text-center text-gray-500">
              <Package className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>Belum ada layanan. Tambahkan layanan pertama Anda!</p>
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="rounded-2xl bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Pesanan</h2>
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="ALL">Semua Status</option>
              <option value="PENDING_PAYMENT">Menunggu Pembayaran</option>
              <option value="PAID">Sudah Dibayar</option>
              <option value="IN_PROGRESS">Sedang Dikerjakan</option>
              <option value="COMPLETED">Selesai</option>
              <option value="CANCELLED">Dibatalkan</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 text-left text-sm text-gray-600">
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Layanan</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Harga</th>
                  <th className="pb-3">Tanggal</th>
                  <th className="pb-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={
                            order.user.image ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(order.user.name || 'U')}`
                          }
                          alt={order.user.name || 'Customer'}
                          className="h-8 w-8 rounded-full"
                        />
                        <span className="font-medium">{order.user.name}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      {order.items[0]?.service.name || '-'}
                    </td>
                    <td className="py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusBadge(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 font-semibold">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="py-3 text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="py-3">
                      {order.status === 'PAID' && (
                        <button
                          onClick={() =>
                            handleUpdateOrderStatus(order.id, 'IN_PROGRESS')
                          }
                          disabled={updatingOrderId === order.id}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {updatingOrderId === order.id
                            ? 'Loading...'
                            : 'Mulai Kerjakan'}
                        </button>
                      )}
                      {order.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() =>
                            handleUpdateOrderStatus(order.id, 'COMPLETED')
                          }
                          disabled={updatingOrderId === order.id}
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {updatingOrderId === order.id
                            ? 'Loading...'
                            : 'Selesai'}
                        </button>
                      )}
                      {order.status === 'PENDING_PAYMENT' &&
                        (order.technicianPaymentRequestedById ? (
                          <span className="flex items-center gap-1 rounded-lg bg-yellow-100 px-3 py-1.5 text-xs font-medium text-yellow-700">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Menunggu Approval
                          </span>
                        ) : (
                          <button
                            onClick={() => handleRequestPayment(order.id)}
                            disabled={requestingPaymentId === order.id}
                            className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-1.5 text-xs text-white shadow hover:from-blue-600 hover:to-blue-700 disabled:opacity-50"
                          >
                            {requestingPaymentId === order.id
                              ? 'Loading...'
                              : 'Request Pembayaran'}
                          </button>
                        ))}
                      {(order.status === 'COMPLETED' ||
                        order.status === 'CANCELLED') && (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {orders.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>Belum ada pesanan</p>
            </div>
          )}
        </div>
      </main>

      <Footer variant="light" />
      <ConfirmDialog />
      <Toaster />
    </div>
  )
}
