'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  Store,
  Shield,
  Search,
  Check,
  X,
  Loader2,
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  Eye,
  EyeOff,
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

interface MitraData {
  id: string
  businessName: string
  city: string
  rating: number
  totalReview: number
  isApproved: boolean
  isActive: boolean
  user: {
    id: string
    name: string | null
    email: string
    phone: string | null
    isActive: boolean
    mitraStatus: string | null
  }
  _count: {
    services: number
    images: number
    reviews: number
  }
}

export default function TechniciansPage() {
  const [activeTab, setActiveTab] = useState<'technicians' | 'mitra'>(
    'technicians'
  )
  const [technicians, setTechnicians] = useState<TechnicianData[]>([])
  const [mitras, setMitras] = useState<MitraData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [stats, setStats] = useState({
    totalTechnicians: 0,
    totalMitra: 0,
    pendingMitra: 0,
    activeMitra: 0,
  })

  // Fetch data
  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, refreshKey])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'technicians') {
        const res = await fetch('/api/admin/technicians?limit=100')
        if (!res.ok) throw new Error('Failed to fetch technicians')
        const data = await res.json()
        setTechnicians(data.technicians || [])
        setStats((prev) => ({
          ...prev,
          totalTechnicians: data.pagination?.total || 0,
        }))
      } else {
        const res = await fetch('/api/admin/mitras?limit=100')
        if (!res.ok) throw new Error('Failed to fetch mitras')
        const data = await res.json()
        setMitras(data.mitras || [])

        const pending = data.mitras.filter(
          (m: MitraData) => !m.isApproved
        ).length
        const active = data.mitras.filter(
          (m: MitraData) => m.isApproved && m.isActive
        ).length

        setStats((prev) => ({
          ...prev,
          totalMitra: data.pagination?.total || 0,
          pendingMitra: pending,
          activeMitra: active,
        }))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // Delete technician
  const handleDeleteTechnician = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete technician "${name}"? This will set the user as inactive.`
      )
    ) {
      return
    }

    try {
      const res = await fetch(`/api/admin/technicians/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete')

      toast.success('Technician deleted successfully')
      setRefreshKey((prev) => prev + 1)
    } catch (error) {
      console.error('Error deleting technician:', error)
      toast.error('Failed to delete technician')
    }
  }

  // Delete mitra
  const handleDeleteMitra = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete mitra "${name}"? This will set the mitra as inactive.`
      )
    ) {
      return
    }

    try {
      const res = await fetch(`/api/admin/mitras/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete')

      toast.success('Mitra deleted successfully')
      setRefreshKey((prev) => prev + 1)
    } catch (error) {
      console.error('Error deleting mitra:', error)
      toast.error('Failed to delete mitra')
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

  // Approve/Reject mitra
  const handleMitraApproval = async (id: string, approve: boolean) => {
    try {
      const res = await fetch(`/api/admin/mitras/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: approve }),
      })

      if (!res.ok) throw new Error('Failed to update')

      toast.success(`Mitra ${approve ? 'approved' : 'rejected'} successfully`)
      setRefreshKey((prev) => prev + 1)
    } catch (error) {
      console.error('Error updating mitra status:', error)
      toast.error('Failed to update mitra status')
    }
  }

  // Filter data
  const filteredTechnicians = technicians.filter(
    (t) =>
      t.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.specialties.some((s) =>
        s.toLowerCase().includes(searchQuery.toLowerCase())
      )
  )

  const filteredMitras = mitras.filter(
    (m) =>
      m.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Kelola Teknisi & Mitra
          </h1>
          <p className="mt-2 text-gray-600">
            Kelola teknisi internal dan mitra bisnis
          </p>
        </div>

        {/* Add New Button */}
        <Link
          href={
            activeTab === 'technicians'
              ? '/dashboard/admin/technicians/create'
              : '/dashboard/admin/mitras/create'
          }
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 font-medium text-white shadow-lg transition-all hover:shadow-xl"
        >
          <Plus className="h-5 w-5" />
          {activeTab === 'technicians' ? 'Tambah Teknisi' : 'Tambah Mitra'}
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Teknisi</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {stats.totalTechnicians}
              </p>
            </div>
            <div className="rounded-xl bg-blue-500 p-3">
              <Shield className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Mitra</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {stats.totalMitra}
              </p>
            </div>
            <div className="rounded-xl bg-green-500 p-3">
              <Store className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Approval</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {stats.pendingMitra}
              </p>
            </div>
            <div className="rounded-xl bg-yellow-500 p-3">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Mitra Aktif</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {stats.activeMitra}
              </p>
            </div>
            <div className="rounded-xl bg-cyan-500 p-3">
              <Store className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('technicians')}
            className={`rounded-lg px-6 py-2 font-medium transition-all ${
              activeTab === 'technicians'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Shield className="mr-2 inline h-5 w-5" />
            Teknisi ({stats.totalTechnicians})
          </button>
          <button
            onClick={() => setActiveTab('mitra')}
            className={`rounded-lg px-6 py-2 font-medium transition-all ${
              activeTab === 'mitra'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Store className="mr-2 inline h-5 w-5" />
            Mitra ({stats.totalMitra})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : activeTab === 'technicians' ? (
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
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
              >
                <Link href={`/dashboard/admin/technicians/${tech.id}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {tech.user.image ? (
                        <img
                          src={tech.user.image}
                          alt={tech.user.name || 'Technician'}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                          <Shield className="h-6 w-6 text-blue-600" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900 hover:text-blue-600">
                          {tech.user.name || 'N/A'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {tech.experience} tahun pengalaman
                        </p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        tech.isAvailable
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {tech.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                </Link>

                <div className="mt-4 space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {tech.specialties.map((spec, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-600"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    {tech.user.email}
                  </div>
                  {tech.user.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      {tech.user.phone}
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>
                      ⭐ {tech.rating.toFixed(1)} ({tech.totalReview} reviews)
                    </span>
                    <span>📋 {tech._count.services} services</span>
                  </div>
                </div>

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
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMitras.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12">
              <Store className="h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-500">No mitra found</p>
              <Link
                href="/dashboard/admin/mitras/create"
                className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
              >
                <Plus className="mr-2 inline h-4 w-4" />
                Add First Mitra
              </Link>
            </div>
          ) : (
            filteredMitras.map((mitra) => (
              <div
                key={mitra.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                      <Store className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {mitra.businessName}
                      </h3>
                      <p className="text-sm text-gray-500">{mitra.city}</p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      !mitra.isApproved
                        ? 'bg-yellow-100 text-yellow-700'
                        : mitra.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {!mitra.isApproved
                      ? 'Pending'
                      : mitra.isActive
                        ? 'Approved'
                        : 'Inactive'}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    {mitra.user.email}
                  </div>
                  {mitra.user.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      {mitra.user.phone}
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>
                      ⭐ {mitra.rating.toFixed(1)} ({mitra.totalReview} reviews)
                    </span>
                    <span>📋 {mitra._count.services} services</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  {!mitra.isApproved ? (
                    <>
                      <button
                        onClick={() => handleMitraApproval(mitra.id, true)}
                        className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                      >
                        <Check className="mr-1 inline h-4 w-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleMitraApproval(mitra.id, false)}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href={`/dashboard/admin/mitras/${mitra.id}/edit`}
                        className="flex-1 rounded-lg bg-blue-50 px-4 py-2 text-center text-sm font-medium text-blue-600 hover:bg-blue-100"
                      >
                        <Edit className="mr-1 inline h-4 w-4" />
                        Edit
                      </Link>
                      <button
                        onClick={() =>
                          handleDeleteMitra(mitra.id, mitra.businessName)
                        }
                        className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
