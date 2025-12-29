'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  Search,
  Plus,
  Download,
  Check,
  X,
  Trash2,
  Loader2,
  UserCheck,
  Shield,
  Store,
  Mail,
  Phone,
  Calendar,
} from 'lucide-react'
import CreateUserModal from '@/components/admin/create-user-modal'
import EditUserModal from '@/components/admin/edit-user-modal'
import { toast } from 'sonner'

interface User {
  id: string
  name: string | null
  email: string
  role: string
  phone: string | null
  isActive: boolean
  mitraStatus: string | null
  createdAt: string
  updatedAt: string
  technician?: { id: string } | null
}

interface Stats {
  byRole: Record<string, number>
  pendingMitra: number
  technicians: number
}

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<Stats>({
    byRole: {},
    pendingMitra: 0,
    technicians: 0,
  })
  const [loading, setLoading] = useState(true)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())

  // Filters
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [mitraStatusFilter, setMitraStatusFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        role: roleFilter,
        mitraStatus: mitraStatusFilter,
        search: searchQuery,
      })

      const res = await fetch(`/api/admin/users?${params}`)

      // Check if response is ok
      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Unauthorized. Please login as admin.')
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch users')
      }

      // Check if response has content
      const text = await res.text()
      if (!text) {
        throw new Error('Empty response from server')
      }

      const data = JSON.parse(text)
      setUsers(data.users || [])
      setStats(data.stats || { byRole: {}, pendingMitra: 0, technicians: 0 })
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [page, roleFilter, mitraStatusFilter, searchQuery, router])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Selection handlers (currently unused, kept for future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _toggleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(users.map((u) => u.id)))
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _toggleSelect = (id: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedUsers(newSelected)
  }

  // Bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedUsers.size === 0) return

    if (
      !confirm(
        `Are you sure you want to ${action} ${selectedUsers.size} users?`
      )
    ) {
      return
    }

    try {
      const res = await fetch('/api/admin/users/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          userIds: Array.from(selectedUsers),
        }),
      })

      if (!res.ok) throw new Error('Bulk action failed')

      toast.success(`Successfully ${action}ed ${selectedUsers.size} users`)
      setSelectedUsers(new Set())
      fetchUsers()
    } catch (error) {
      console.error('Error performing bulk action:', error)
      toast.error('Failed to perform bulk action')
    }
  }

  // Export CSV
  const handleExport = () => {
    const params = new URLSearchParams({
      role: roleFilter,
      mitraStatus: mitraStatusFilter,
    })
    window.open(`/api/admin/users/export?${params}`, '_blank')
  }

  // Delete user
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete user')

      toast.success('User deleted successfully')
      fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
    }
  }

  // Approve/Reject mitra
  const handleMitraAction = async (
    id: string,
    status: 'APPROVED' | 'REJECTED'
  ) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mitraStatus: status }),
      })

      if (!res.ok) throw new Error('Failed to update mitra status')

      toast.success(`Mitra ${status.toLowerCase()} successfully`)
      fetchUsers()
    } catch (error) {
      console.error('Error updating mitra status:', error)
      toast.error('Failed to update mitra status')
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-700'
      case 'ADMIN':
        return 'bg-blue-100 text-blue-700'
      case 'MITRA':
        return 'bg-green-100 text-green-700'
      case 'TECHNICIAN':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getRoleLabel = (user: User) => {
    if (user.technician) return 'TEKNISI'
    return user.role
  }

  const getMitraStatusBadge = (status: string | null) => {
    if (!status) return null

    switch (status) {
      case 'PENDING':
        return (
          <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-700">
            Pending
          </span>
        )
      case 'APPROVED':
        return (
          <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
            Approved
          </span>
        )
      case 'REJECTED':
        return (
          <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">
            Rejected
          </span>
        )
    }
  }

  const totalUsers = Object.values(stats.byRole).reduce((a, b) => a + b, 0)

  return (
    <div className="overflow-x-hidden">
      {/* Header Banner */}
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 p-8 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">👥 Kelola Users</h1>
            <p className="mt-2 text-blue-100">
              Manage all users, roles, and mitra approvals
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 px-4 py-2 backdrop-blur-sm">
              <p className="text-sm font-medium">Total Users</p>
              <p className="text-2xl font-bold">{totalUsers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {/* Total Users Card */}
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 p-4 shadow-lg transition-all hover:shadow-xl lg:rounded-2xl lg:p-6">
          <div className="absolute right-0 top-0 h-20 w-20 -translate-y-6 translate-x-6 rounded-full bg-white/10 lg:h-32 lg:w-32 lg:-translate-y-8 lg:translate-x-8"></div>
          <div className="relative">
            <div className="mb-2 inline-flex rounded-lg bg-white/20 p-2 backdrop-blur-sm lg:mb-4 lg:rounded-xl lg:p-3">
              <Users className="h-4 w-4 text-white lg:h-6 lg:w-6" />
            </div>
            <p className="text-xs font-medium text-purple-100 lg:text-sm">
              Total Users
            </p>
            <p className="mt-1 text-xl font-bold text-white lg:mt-2 lg:text-3xl">
              {totalUsers}
            </p>
          </div>
        </div>

        {/* Teknisi Card */}
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 p-4 shadow-lg transition-all hover:shadow-xl lg:rounded-2xl lg:p-6">
          <div className="absolute right-0 top-0 h-20 w-20 -translate-y-6 translate-x-6 rounded-full bg-white/10 lg:h-32 lg:w-32 lg:-translate-y-8 lg:translate-x-8"></div>
          <div className="relative">
            <div className="mb-2 inline-flex rounded-lg bg-white/20 p-2 backdrop-blur-sm lg:mb-4 lg:rounded-xl lg:p-3">
              <Shield className="h-4 w-4 text-white lg:h-6 lg:w-6" />
            </div>
            <p className="text-xs font-medium text-orange-100 lg:text-sm">
              Teknisi
            </p>
            <p className="mt-1 text-xl font-bold text-white lg:mt-2 lg:text-3xl">
              {stats.technicians || 0}
            </p>
          </div>
        </div>

        {/* Mitra Card */}
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500 to-green-700 p-4 shadow-lg transition-all hover:shadow-xl lg:rounded-2xl lg:p-6">
          <div className="absolute right-0 top-0 h-20 w-20 -translate-y-6 translate-x-6 rounded-full bg-white/10 lg:h-32 lg:w-32 lg:-translate-y-8 lg:translate-x-8"></div>
          <div className="relative">
            <div className="mb-2 inline-flex rounded-lg bg-white/20 p-2 backdrop-blur-sm lg:mb-4 lg:rounded-xl lg:p-3">
              <Store className="h-4 w-4 text-white lg:h-6 lg:w-6" />
            </div>
            <p className="text-xs font-medium text-green-100 lg:text-sm">
              Mitra
            </p>
            <p className="mt-1 text-xl font-bold text-white lg:mt-2 lg:text-3xl">
              {stats.byRole.MITRA || 0}
            </p>
          </div>
        </div>

        {/* Pending Approval Card */}
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-700 p-4 shadow-lg transition-all hover:shadow-xl lg:rounded-2xl lg:p-6">
          <div className="absolute right-0 top-0 h-20 w-20 -translate-y-6 translate-x-6 rounded-full bg-white/10 lg:h-32 lg:w-32 lg:-translate-y-8 lg:translate-x-8"></div>
          <div className="relative">
            <div className="mb-2 inline-flex rounded-lg bg-white/20 p-2 backdrop-blur-sm lg:mb-4 lg:rounded-xl lg:p-3">
              <UserCheck className="h-4 w-4 text-white lg:h-6 lg:w-6" />
            </div>
            <p className="text-xs font-medium text-yellow-100 lg:text-sm">
              Pending
            </p>
            <p className="mt-1 text-xl font-bold text-white lg:mt-2 lg:text-3xl">
              {stats.pendingMitra}
            </p>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="mb-6 space-y-4">
        {/* Filters Row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none sm:w-auto"
          >
            <option value="ALL">All Roles</option>
            <option value="CUSTOMER">Customer</option>
            <option value="TECHNICIAN">Teknisi</option>
            <option value="MITRA">Mitra</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>

          {/* Mitra Status Filter */}
          {roleFilter === 'MITRA' && (
            <select
              value={mitraStatusFilter}
              onChange={(e) => setMitraStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none sm:w-auto"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          )}

          {/* Search */}
          <div className="relative flex-1 sm:min-w-[250px]">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Actions Row */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Download className="h-5 w-5" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 font-medium text-white transition-all hover:shadow-lg"
          >
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline">Add User</span>
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedUsers.size > 0 && (
        <div className="mb-4 flex flex-col gap-3 rounded-lg bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-medium text-blue-900">
            {selectedUsers.size} user(s) selected
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleBulkAction('approve')}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              <Check className="h-4 w-4" />
              Approve
            </button>
            <button
              onClick={() => handleBulkAction('reject')}
              className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
            >
              <X className="h-4 w-4" />
              Reject
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Users Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-500">No users found</p>
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name || 'User'}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                        <span className="text-lg font-bold text-white">
                          {(user.name || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="max-w-[200px] truncate font-semibold text-gray-900">
                        {user.name || 'N/A'}
                      </h3>
                      <p className="max-w-[200px] truncate text-sm text-gray-600">
                        {getRoleLabel(user)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex flex-wrap gap-1">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${getRoleBadgeColor(user.technician ? 'TECHNICIAN' : user.role)}`}
                    >
                      {getRoleLabel(user)}
                    </span>
                    {getMitraStatusBadge(user.mitraStatus)}
                  </div>
                  <div className="flex items-center gap-2 truncate text-sm text-gray-600">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      {user.phone}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    {new Date(user.createdAt).toLocaleDateString('id-ID')}
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  {user.role === 'MITRA' && user.mitraStatus === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleMitraAction(user.id, 'APPROVED')}
                        className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleMitraAction(user.id, 'REJECTED')}
                        className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setEditingUser(user)
                      setShowEditModal(true)
                    }}
                    className={`${user.role === 'MITRA' && user.mitraStatus === 'PENDING' ? '' : 'flex-1'} rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 text-sm font-medium text-white hover:shadow-lg`}
                  >
                    Edit Details
                  </button>
                  {user.role !== 'SUPER_ADMIN' && (
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
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

      {/* Modals */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchUsers}
      />
      <EditUserModal
        isOpen={showEditModal}
        user={editingUser}
        onClose={() => {
          setShowEditModal(false)
          setEditingUser(null)
        }}
        onSuccess={fetchUsers}
      />
    </div>
  )
}
