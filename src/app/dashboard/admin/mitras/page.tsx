'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Store,
  Search,
  Plus,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  Eye,
  MessageSquare,
  Edit,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Mitra {
  id: string
  businessName: string
  tagline: string | null
  city: string
  province: string
  phone: string
  whatsapp: string | null
  email: string | null
  website: string | null
  rating: number
  totalReview: number
  totalViews: number
  totalInquiries: number
  isApproved: boolean
  isActive: boolean
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
    mitraStatus: string | null
  }
  _count: {
    services: number
    images: number
    reviews: number
  }
}

interface Stats {
  total: number
  approved: number
  pending: number
  cities: number
}

export default function MitrasPage() {
  const router = useRouter()
  const [mitras, setMitras] = useState<Mitra[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0,
    approved: 0,
    pending: 0,
    cities: 0,
  })
  const [loading, setLoading] = useState(true)

  // Filters
  const [approvalFilter, setApprovalFilter] = useState('ALL')
  const [cityFilter, setCityFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Available cities for filter
  const [cities, setCities] = useState<string[]>([])

  // Fetch mitras
  const fetchMitras = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search: searchQuery,
      })

      if (cityFilter) params.append('city', cityFilter)
      if (approvalFilter !== 'ALL') {
        params.append(
          'approved',
          approvalFilter === 'APPROVED' ? 'true' : 'false'
        )
      }

      const res = await fetch(`/api/admin/mitras?${params}`)

      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Unauthorized. Please login as super admin.')
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch mitras')
      }

      const data = await res.json()
      setMitras(data.mitras || [])
      setTotalPages(data.pagination?.totalPages || 1)

      // Use stats from API response
      if (data.stats) {
        setStats({
          total: data.stats.total,
          approved: data.stats.approved,
          pending: data.stats.pending,
          cities: data.stats.cities,
        })
      }

      // Extract unique cities for filter
      const allCities = Array.from(
        new Set(
          data.mitras
            .map((m: Mitra) => m.city)
            .filter((c: string | null) => !!c)
        )
      ).sort() as string[]
      setCities(allCities)
    } catch (error) {
      console.error('Error fetching mitras:', error)
      toast.error('Failed to load mitras')
    } finally {
      setLoading(false)
    }
  }, [page, approvalFilter, cityFilter, searchQuery, router])

  useEffect(() => {
    fetchMitras()
  }, [fetchMitras])

  // Delete mitra
  const handleDelete = async (id: string, businessName: string) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus mitra "${businessName}"?\n\nData akan PERMANEN dihapus dari database dan tidak dapat dikembalikan!`
      )
    )
      return

    try {
      const res = await fetch(`/api/admin/mitras/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete mitra')
      }

      toast.success('Mitra berhasil dihapus secara permanen')

      // Wait a bit before refreshing to ensure database transaction completes
      await new Promise((resolve) => setTimeout(resolve, 300))

      fetchMitras()
    } catch (error) {
      console.error('Error deleting mitra:', error)
      toast.error(
        error instanceof Error ? error.message : 'Gagal menghapus mitra'
      )
    }
  }

  // Toggle approval
  const handleToggleApproval = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/mitras/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: !currentStatus }),
      })

      if (!res.ok) throw new Error('Failed to update approval status')

      toast.success(
        `Mitra ${!currentStatus ? 'disetujui' : 'ditolak'} successfully`
      )
      fetchMitras()
    } catch (error) {
      console.error('Error updating approval:', error)
      toast.error('Gagal mengubah status approval')
    }
  }

  const getApprovalBadge = (isApproved: boolean) => {
    if (isApproved) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
          <CheckCircle className="h-3 w-3" />
          Approved
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
        <Clock className="h-3 w-3" />
        Pending
      </span>
    )
  }

  return (
    <div className="overflow-x-hidden">
      {/* Header Banner */}
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-8 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">🏪 Kelola Mitra</h1>
            <p className="mt-2 text-green-100">
              Manage partner workshops across Indonesia
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 px-4 py-2 backdrop-blur-sm">
              <p className="text-sm font-medium">Total Mitra</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {/* Total Mitras */}
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500 to-green-700 p-4 shadow-lg transition-all hover:shadow-xl lg:rounded-2xl lg:p-6">
          <div className="absolute right-0 top-0 h-20 w-20 -translate-y-6 translate-x-6 rounded-full bg-white/10 lg:h-32 lg:w-32 lg:-translate-y-8 lg:translate-x-8"></div>
          <div className="relative">
            <div className="mb-2 inline-flex rounded-lg bg-white/20 p-2 backdrop-blur-sm lg:mb-4 lg:rounded-xl lg:p-3">
              <Store className="h-4 w-4 text-white lg:h-6 lg:w-6" />
            </div>
            <p className="text-xs font-medium text-green-100 lg:text-sm">
              Total Mitra
            </p>
            <p className="mt-1 text-xl font-bold text-white lg:mt-2 lg:text-3xl">
              {stats.total}
            </p>
          </div>
        </div>

        {/* Approved */}
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-4 shadow-lg transition-all hover:shadow-xl lg:rounded-2xl lg:p-6">
          <div className="absolute right-0 top-0 h-20 w-20 -translate-y-6 translate-x-6 rounded-full bg-white/10 lg:h-32 lg:w-32 lg:-translate-y-8 lg:translate-x-8"></div>
          <div className="relative">
            <div className="mb-2 inline-flex rounded-lg bg-white/20 p-2 backdrop-blur-sm lg:mb-4 lg:rounded-xl lg:p-3">
              <CheckCircle className="h-4 w-4 text-white lg:h-6 lg:w-6" />
            </div>
            <p className="text-xs font-medium text-emerald-100 lg:text-sm">
              Approved
            </p>
            <p className="mt-1 text-xl font-bold text-white lg:mt-2 lg:text-3xl">
              {stats.approved}
            </p>
          </div>
        </div>

        {/* Pending */}
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-700 p-4 shadow-lg transition-all hover:shadow-xl lg:rounded-2xl lg:p-6">
          <div className="absolute right-0 top-0 h-20 w-20 -translate-y-6 translate-x-6 rounded-full bg-white/10 lg:h-32 lg:w-32 lg:-translate-y-8 lg:translate-x-8"></div>
          <div className="relative">
            <div className="mb-2 inline-flex rounded-lg bg-white/20 p-2 backdrop-blur-sm lg:mb-4 lg:rounded-xl lg:p-3">
              <Clock className="h-4 w-4 text-white lg:h-6 lg:w-6" />
            </div>
            <p className="text-xs font-medium text-yellow-100 lg:text-sm">
              Pending
            </p>
            <p className="mt-1 text-xl font-bold text-white lg:mt-2 lg:text-3xl">
              {stats.pending}
            </p>
          </div>
        </div>

        {/* Cities Covered */}
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 p-4 shadow-lg transition-all hover:shadow-xl lg:rounded-2xl lg:p-6">
          <div className="absolute right-0 top-0 h-20 w-20 -translate-y-6 translate-x-6 rounded-full bg-white/10 lg:h-32 lg:w-32 lg:-translate-y-8 lg:translate-x-8"></div>
          <div className="relative">
            <div className="mb-2 inline-flex rounded-lg bg-white/20 p-2 backdrop-blur-sm lg:mb-4 lg:rounded-xl lg:p-3">
              <MapPin className="h-4 w-4 text-white lg:h-6 lg:w-6" />
            </div>
            <p className="text-xs font-medium text-teal-100 lg:text-sm">
              Cities
            </p>
            <p className="mt-1 text-xl font-bold text-white lg:mt-2 lg:text-3xl">
              {stats.cities}
            </p>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="mb-6 space-y-4">
        {/* Filters Row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {/* Approval Filter */}
          <select
            value={approvalFilter}
            onChange={(e) => setApprovalFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none sm:w-auto"
          >
            <option value="ALL">All Status</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING">Pending</option>
          </select>

          {/* City Filter */}
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none sm:w-auto"
          >
            <option value="">All Cities</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="relative flex-1 sm:min-w-[250px]">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by business name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-green-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Actions Row */}
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/admin/mitras/create"
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2 font-medium text-white transition-all hover:shadow-lg"
          >
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline">Tambah Mitra Baru</span>
            <span className="sm:hidden">Tambah</span>
          </Link>
        </div>
      </div>

      {/* Mitras Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mitras.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12">
              <Store className="h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-500">No mitras found</p>
            </div>
          ) : (
            mitras.map((mitra) => (
              <div
                key={mitra.id}
                className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
              >
                {/* Header - Fixed Height */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="truncate text-lg font-semibold text-gray-900">
                      {mitra.businessName}
                    </h3>
                    {mitra.tagline && (
                      <p className="mt-1 truncate text-sm text-gray-600">
                        {mitra.tagline}
                      </p>
                    )}
                  </div>
                  {getApprovalBadge(mitra.isApproved)}
                </div>

                {/* Content - Flexible Height with Min Height */}
                <div className="mt-4 flex-1 space-y-3">
                  {/* Location - Fixed Height */}
                  <div className="flex h-5 items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 flex-shrink-0 text-green-600" />
                    <span className="truncate">
                      {mitra.city}, {mitra.province}
                    </span>
                  </div>

                  {/* Contact Info - Fixed Height Container */}
                  <div className="space-y-2">
                    <div className="flex h-5 items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{mitra.phone}</span>
                    </div>
                    <div className="flex h-5 items-center gap-2 text-sm text-gray-600">
                      {mitra.email ? (
                        <>
                          <Mail className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{mitra.email}</span>
                        </>
                      ) : (
                        <span className="text-gray-400">No email</span>
                      )}
                    </div>
                    <div className="flex h-5 items-center gap-2 text-sm text-gray-600">
                      {mitra.website ? (
                        <>
                          <Globe className="h-4 w-4 flex-shrink-0" />
                          <a
                            href={mitra.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate text-green-600 hover:underline"
                          >
                            {mitra.website}
                          </a>
                        </>
                      ) : (
                        <span className="text-gray-400">No website</span>
                      )}
                    </div>
                  </div>

                  {/* Stats - Fixed Height */}
                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-gray-50 p-3">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-yellow-600">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm font-semibold">
                          {mitra.rating.toFixed(1)}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-gray-500">
                        {mitra.totalReview} reviews
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-blue-600">
                        <Eye className="h-4 w-4" />
                        <span className="text-sm font-semibold">
                          {mitra.totalViews}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">views</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-purple-600">
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-sm font-semibold">
                          {mitra.totalInquiries}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">inquiries</p>
                    </div>
                  </div>
                </div>

                {/* Actions - Fixed at Bottom */}
                <div className="mt-4 flex gap-2">
                  {!mitra.isApproved && (
                    <button
                      onClick={() => handleToggleApproval(mitra.id, false)}
                      className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                      Approve
                    </button>
                  )}
                  {mitra.isApproved && (
                    <button
                      onClick={() => handleToggleApproval(mitra.id, true)}
                      className="rounded-lg bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-600 hover:bg-yellow-100"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  )}
                  <Link
                    href={`/dashboard/admin/mitras/${mitra.id}/edit`}
                    className={`${!mitra.isApproved ? '' : 'flex-1'} flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2 text-sm font-medium text-white hover:shadow-lg`}
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(mitra.id, mitra.businessName)}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-700">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
