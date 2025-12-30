'use client'

import { useState, useEffect } from 'react'
import {
  Shield,
  Search,
  Loader2,
  Plus,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface TechnicianData {
  id: string
  bio: string | null
  experience: number
  specialties: string[]
  rating: number
  totalReview: number
  isAvailable: boolean
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
    phone: string | null
    isActive: boolean
  }
  _count: {
    services: number
    orders: number
  }
}

export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState<TechnicianData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [stats, setStats] = useState({
    totalTechnicians: 0,
    availableTechnicians: 0,
    totalServices: 0,
    totalOrders: 0,
  })

  // Fetch technicians
  useEffect(() => {
    fetchTechnicians()
  }, [refreshKey])

  const fetchTechnicians = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/technicians?limit=100')
      if (!res.ok) throw new Error('Failed to fetch technicians')
      const data = await res.json()
      setTechnicians(data.technicians || [])

      // Calculate stats
      const available = data.technicians.filter(
        (t: TechnicianData) => t.isAvailable
      ).length
      const totalServices = data.technicians.reduce(
        (sum: number, t: TechnicianData) => sum + t._count.services,
        0
      )
      const totalOrders = data.technicians.reduce(
        (sum: number, t: TechnicianData) => sum + t._count.orders,
        0
      )

      setStats({
        totalTechnicians: data.pagination?.total || 0,
        availableTechnicians: available,
        totalServices,
        totalOrders,
      })
    } catch (error) {
      console.error('Error fetching technicians:', error)
      toast.error('Failed to load technicians')
    } finally {
      setLoading(false)
    }
  }

  // Delete technician
  const handleDeleteTechnician = async (id: string, name: string) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus teknisi "${name}"?\n\nData akan PERMANEN dihapus dari database dan tidak dapat dikembalikan!`
      )
    )
      return

    try {
      const res = await fetch(`/api/admin/technicians/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete')
      }

      toast.success('Teknisi berhasil dihapus secara permanen')

      // Wait a bit before refreshing to ensure database transaction completes
      await new Promise((resolve) => setTimeout(resolve, 300))

      setRefreshKey((prev) => prev + 1)
    } catch (error) {
      console.error('Error deleting technician:', error)
      toast.error(
        error instanceof Error ? error.message : 'Gagal menghapus teknisi'
      )
    }
  }

  // Toggle technician availability
  const handleToggleAvailability = async (
    id: string,
    currentStatus: boolean
  ) => {
    try {
      const res = await fetch(`/api/admin/technicians/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !currentStatus }),
      })

      if (!res.ok) throw new Error('Failed to update')

      toast.success('Availability updated successfully')
      setRefreshKey((prev) => prev + 1)
    } catch (error) {
      console.error('Error updating availability:', error)
      toast.error('Failed to update availability')
    }
  }

  // Filter technicians
  const filteredTechnicians = technicians.filter(
    (t) =>
      t.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.specialties.some((s) =>
        s.toLowerCase().includes(searchQuery.toLowerCase())
      )
  )

  return (
    <div className="overflow-x-hidden">
      {/* Header Banner */}
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 p-8 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">🔧 Kelola Teknisi</h1>
            <p className="mt-2 text-blue-100">
              Manage internal technicians and their services
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 px-4 py-2 backdrop-blur-sm">
              <p className="text-sm font-medium">Total Teknisi</p>
              <p className="text-2xl font-bold">{stats.totalTechnicians}</p>
            </div>
            <Link
              href="/dashboard/admin/technicians/create"
              className="flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 font-medium backdrop-blur-sm transition-all hover:bg-white/30"
            >
              <Plus className="h-5 w-5" />
              Tambah Teknisi
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {/* Total Teknisi */}
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 p-4 shadow-lg transition-all hover:shadow-xl lg:rounded-2xl lg:p-6">
          <div className="absolute right-0 top-0 h-20 w-20 -translate-y-6 translate-x-6 rounded-full bg-white/10 lg:h-32 lg:w-32 lg:-translate-y-8 lg:translate-x-8"></div>
          <div className="relative">
            <div className="mb-2 inline-flex rounded-lg bg-white/20 p-2 backdrop-blur-sm lg:mb-4 lg:rounded-xl lg:p-3">
              <Shield className="h-4 w-4 text-white lg:h-6 lg:w-6" />
            </div>
            <p className="text-xs font-medium text-blue-100 lg:text-sm">
              Total Teknisi
            </p>
            <p className="mt-1 text-xl font-bold text-white lg:mt-2 lg:text-3xl">
              {stats.totalTechnicians}
            </p>
          </div>
        </div>

        {/* Available Teknisi */}
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500 to-green-700 p-4 shadow-lg transition-all hover:shadow-xl lg:rounded-2xl lg:p-6">
          <div className="absolute right-0 top-0 h-20 w-20 -translate-y-6 translate-x-6 rounded-full bg-white/10 lg:h-32 lg:w-32 lg:-translate-y-8 lg:translate-x-8"></div>
          <div className="relative">
            <div className="mb-2 inline-flex rounded-lg bg-white/20 p-2 backdrop-blur-sm lg:mb-4 lg:rounded-xl lg:p-3">
              <Eye className="h-4 w-4 text-white lg:h-6 lg:w-6" />
            </div>
            <p className="text-xs font-medium text-green-100 lg:text-sm">
              Available
            </p>
            <p className="mt-1 text-xl font-bold text-white lg:mt-2 lg:text-3xl">
              {stats.availableTechnicians}
            </p>
          </div>
        </div>

        {/* Total Services */}
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 p-4 shadow-lg transition-all hover:shadow-xl lg:rounded-2xl lg:p-6">
          <div className="absolute right-0 top-0 h-20 w-20 -translate-y-6 translate-x-6 rounded-full bg-white/10 lg:h-32 lg:w-32 lg:-translate-y-8 lg:translate-x-8"></div>
          <div className="relative">
            <div className="mb-2 inline-flex rounded-lg bg-white/20 p-2 backdrop-blur-sm lg:mb-4 lg:rounded-xl lg:p-3">
              <Shield className="h-4 w-4 text-white lg:h-6 lg:w-6" />
            </div>
            <p className="text-xs font-medium text-purple-100 lg:text-sm">
              Total Services
            </p>
            <p className="mt-1 text-xl font-bold text-white lg:mt-2 lg:text-3xl">
              {stats.totalServices}
            </p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-700 p-4 shadow-lg transition-all hover:shadow-xl lg:rounded-2xl lg:p-6">
          <div className="absolute right-0 top-0 h-20 w-20 -translate-y-6 translate-x-6 rounded-full bg-white/10 lg:h-32 lg:w-32 lg:-translate-y-8 lg:translate-x-8"></div>
          <div className="relative">
            <div className="mb-2 inline-flex rounded-lg bg-white/20 p-2 backdrop-blur-sm lg:mb-4 lg:rounded-xl lg:p-3">
              <Shield className="h-4 w-4 text-white lg:h-6 lg:w-6" />
            </div>
            <p className="text-xs font-medium text-cyan-100 lg:text-sm">
              Total Orders
            </p>
            <p className="mt-1 text-xl font-bold text-white lg:mt-2 lg:text-3xl">
              {stats.totalOrders}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search technicians..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Technicians Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTechnicians.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-500">No technicians found</p>
              <Link
                href="/dashboard/admin/technicians/create"
                className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
              >
                <Plus className="mr-2 inline h-4 w-4" />
                Add First Technician
              </Link>
            </div>
          ) : (
            filteredTechnicians.map((tech) => (
              <div
                key={tech.id}
                className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
              >
                {/* Header - Fixed Height */}
                <Link href={`/dashboard/admin/technicians/${tech.id}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {tech.user.image ? (
                        <img
                          src={tech.user.image}
                          alt={tech.user.name || 'Technician'}
                          className="h-12 w-12 flex-shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                          <Shield className="h-6 w-6 text-blue-600" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold text-gray-900 hover:text-blue-600">
                          {tech.user.name || 'N/A'}
                        </h3>
                        <p className="truncate text-sm text-gray-600">
                          {tech.user.email}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`flex-shrink-0 rounded-full px-2 py-1 text-xs ${
                        tech.isAvailable
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {tech.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                </Link>

                {/* Content - Flexible Height with Min Height */}
                <div className="mt-4 flex-1 space-y-3">
                  {/* Specialties - Fixed Height Container */}
                  <div className="h-16 overflow-hidden">
                    <div className="flex flex-wrap gap-1">
                      {tech.specialties.slice(0, 4).map((spec, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-600"
                        >
                          {spec}
                        </span>
                      ))}
                      {tech.specialties.length > 4 && (
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                          +{tech.specialties.length - 4}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contact Info - Fixed Height */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{tech.user.email}</span>
                    </div>
                    <div className="flex h-5 items-center gap-2 text-sm text-gray-600">
                      {tech.user.phone ? (
                        <>
                          <Phone className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{tech.user.phone}</span>
                        </>
                      ) : (
                        <span className="text-gray-400">No phone</span>
                      )}
                    </div>
                  </div>

                  {/* Stats - Fixed Height */}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      ⭐ {tech.rating.toFixed(1)} ({tech.totalReview})
                    </span>
                    <span className="flex items-center gap-1">
                      📋 {tech._count.services}
                    </span>
                  </div>
                </div>

                {/* Actions - Fixed at Bottom */}
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/dashboard/admin/technicians/${tech.id}`}
                    className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 text-center text-sm font-medium text-white hover:shadow-lg"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() =>
                      handleToggleAvailability(tech.id, tech.isAvailable)
                    }
                    className={`rounded-lg px-4 py-2 text-sm font-medium ${
                      tech.isAvailable
                        ? 'bg-green-50 text-green-600 hover:bg-green-100'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                    title={
                      tech.isAvailable ? 'Set Unavailable' : 'Set Available'
                    }
                  >
                    {tech.isAvailable ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() =>
                      handleDeleteTechnician(
                        tech.id,
                        tech.user.name || 'this technician'
                      )
                    }
                    className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
