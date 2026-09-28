'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { usePageGuard } from '@/hooks/use-page-guard'
import {
  Users,
  Search,
  Plus,
  Download,
  Trash2,
  Edit,
  ShieldCheck,
  Store,
  Mail,
  Phone,
  Calendar,
  X,
  ShoppingBag,
  Shield,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import CreateUserModal from '@/components/admin/create-user-modal'
import EditUserModal from '@/components/admin/edit-user-modal'
import { toast } from 'sonner'

interface User {
  id: string
  name: string | null
  email: string
  image: string | null
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
  const { isLoading: guardLoading, isAllowed } = usePageGuard(
    '/dashboard/admin/users'
  )
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<Stats>({
    byRole: {},
    pendingMitra: 0,
    technicians: 0,
  })
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Filters
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        role: roleFilter,
        search: searchQuery,
      })

      const res = await fetch(`/api/admin/users?${params}`)

      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Sesi habis. Silakan login kembali.')
          router.push('/login')
          return
        }
        throw new Error('Gagal memuat pengguna')
      }

      const text = await res.text()
      if (!text) throw new Error('Respon server kosong')

      const data = JSON.parse(text)
      setUsers(data.users || [])
      setStats(data.stats || { byRole: {}, pendingMitra: 0, technicians: 0 })
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Gagal memuat data pengguna')
    } finally {
      setLoading(false)
    }
  }, [page, roleFilter, searchQuery, router])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Export CSV
  const handleExport = () => {
    const params = new URLSearchParams({
      role: roleFilter,
    })
    window.open(`/api/admin/users/export?${params}`, '_blank')
  }

  // Delete user
  const handleDelete = async (
    id: string,
    name: string | null,
    email: string
  ) => {
    const displayName = name || email
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus akun "${displayName}"?\n\nData pengguna akan dihapus secara permanen dari database.`
      )
    ) {
      return
    }

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Gagal menghapus pengguna')
      }

      toast.success(`Akun "${displayName}" berhasil dihapus`)
      fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error(
        error instanceof Error ? error.message : 'Gagal menghapus pengguna'
      )
    }
  }

  // Quick toggle active/suspend status
  const handleToggleStatus = async (user: User) => {
    if (user.role === 'SUPER_ADMIN') {
      toast.error('Akun Super Admin tidak dapat dinonaktifkan')
      return
    }

    const newStatus = !user.isActive
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Gagal mengubah status akun')
      }

      toast.success(
        `Akun ${user.name || user.email} berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`
      )
      fetchUsers()
    } catch (error) {
      console.error('Error toggling status:', error)
      toast.error(
        error instanceof Error ? error.message : 'Gagal mengubah status akun'
      )
    }
  }

  const getRoleBadge = (user: User) => {
    if (user.technician) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-orange-200/60 bg-orange-50 px-2.5 py-0.5 text-[10px] font-semibold text-orange-700 dark:border-orange-800/40 dark:bg-orange-950/40 dark:text-orange-300">
          Teknisi
        </span>
      )
    }
    if (user.role === 'SUPER_ADMIN') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-purple-200/60 bg-purple-50 px-2.5 py-0.5 text-[10px] font-semibold text-purple-700 dark:border-purple-800/40 dark:bg-purple-950/40 dark:text-purple-300">
          Super Admin
        </span>
      )
    }
    if (user.role === 'ADMIN') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-blue-200/60 bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:border-blue-800/40 dark:bg-blue-950/40 dark:text-blue-300">
          Admin Platform
        </span>
      )
    }
    if (user.role === 'STORE_ADMIN' || user.role === 'MITRA') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200/60 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:border-indigo-800/40 dark:bg-indigo-950/40 dark:text-indigo-300">
          Admin Toko
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/60 bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:border-slate-700/60 dark:bg-slate-800 dark:text-slate-300">
        Customer
      </span>
    )
  }

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const totalUsers = Object.values(stats.byRole).reduce((a, b) => a + b, 0)
  const totalSuperAndAdmin =
    (stats.byRole.ADMIN || 0) + (stats.byRole.SUPER_ADMIN || 0)

  return (
    <div
      className="mx-auto max-w-6xl space-y-6 pb-12 pt-1"
      suppressHydrationWarning
    >
      {/* ========================================================================= */}
      {/* 1. TOP KPI METRIC CARDS (Bento Metric Grid)                               */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
        {/* 1. Total Pengguna (Action Orange Highlight) */}
        <div className="shadow-2xs hover:shadow-xs group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-orange-200 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total Pengguna
            </span>
            <div className="h-6.5 w-6.5 flex items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
              <Users className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900 dark:text-white sm:text-xl">
              {totalUsers} Pengguna
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
              <span className="inline-flex items-center gap-1 font-semibold text-orange-600 dark:text-orange-400">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                Semua Akun
              </span>
              <span className="text-slate-400 dark:text-slate-500">
                · Terdaftar
              </span>
            </div>
          </div>
        </div>

        {/* 2. Customer Pembeli */}
        <div className="shadow-2xs hover:shadow-xs group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Customer Pembeli
            </span>
            <div className="h-6.5 w-6.5 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <ShoppingBag className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900 dark:text-white sm:text-xl">
              {stats.byRole.CUSTOMER || 0} Member
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
              <span className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                Member Aktif
              </span>
              <span className="text-slate-400 dark:text-slate-500">
                · Belanja
              </span>
            </div>
          </div>
        </div>

        {/* 3. Admin Toko */}
        <div className="shadow-2xs hover:shadow-xs group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Admin Toko
            </span>
            <div className="h-6.5 w-6.5 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
              <Store className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900 dark:text-white sm:text-xl">
              {stats.byRole.STORE_ADMIN || 0} Akun
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                Pengelola Toko
              </span>
              <span className="text-slate-400 dark:text-slate-500">
                · Cabang PT
              </span>
            </div>
          </div>
        </div>

        {/* 4. Superadmin & Admin */}
        <div className="shadow-2xs hover:shadow-xs group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Superadmin & Admin
            </span>
            <div className="h-6.5 w-6.5 flex items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900 dark:text-white sm:text-xl">
              {totalSuperAndAdmin} Akun
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Pengelola Platform
              </span>
              <span className="text-slate-400 dark:text-slate-500">
                · Akses Sistem
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. UNIFIED TOOLBAR (Role Tabs, Live Search, Export & Tambah Akun)         */}
      {/* ========================================================================= */}
      <div className="shadow-2xs flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900 sm:p-3 md:flex-row md:items-center">
        {/* Role Tabs Switcher */}
        <div className="no-scrollbar flex items-center gap-1 overflow-x-auto rounded-xl bg-slate-100/80 p-1 dark:bg-slate-800/80">
          {[
            { id: 'ALL', label: 'Semua Role' },
            { id: 'SUPER_ADMIN', label: 'Superadmin' },
            { id: 'ADMIN', label: 'Admin Platform' },
            { id: 'STORE_ADMIN', label: 'Admin Toko' },
            { id: 'CUSTOMER', label: 'Customer' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setRoleFilter(tab.id)
                setPage(1)
              }}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                roleFilter === tab.id
                  ? 'shadow-2xs bg-white text-slate-950 dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Box, Export & Primary CTA */}
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2 sm:flex-nowrap md:flex-initial">
          {/* Live Search with orange focus ring */}
          <div className="relative w-full sm:w-56 md:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              className="dark:focus:bg-slate-850 w-full rounded-xl border border-slate-200/80 bg-slate-50 py-2 pl-8 pr-7 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-orange-400"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setPage(1)
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="dark:hover:bg-slate-750 inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            title="Export CSV data pengguna"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export</span>
          </button>

          {/* Primary Action Button (+ Tambah Akun with Action Orange) */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-orange-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition hover:bg-orange-600 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Tambah Akun</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. USER DATA TABLE LIST (Modern, Scannable & High-Density)                */}
      {/* ========================================================================= */}
      <div className="shadow-2xs overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
        {!mounted || loading ? (
          <div className="space-y-4 p-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex animate-pulse items-center justify-between gap-4 border-b border-slate-100 py-3 last:border-0 dark:border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-36 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-3 w-48 rounded bg-slate-100 dark:bg-slate-800/60" />
                  </div>
                </div>
                <div className="hidden h-6 w-24 rounded-full bg-slate-100 dark:bg-slate-800 sm:block" />
                <div className="hidden h-4 w-28 rounded bg-slate-100 dark:bg-slate-800 md:block" />
                <div className="h-6 w-20 rounded-full bg-slate-100 dark:bg-slate-800" />
                <div className="h-7 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="space-y-3 p-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 dark:bg-orange-950/40">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Tidak ada pengguna ditemukan
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {searchQuery || roleFilter !== 'ALL'
                  ? 'Coba ubah kata kunci pencarian atau filter role.'
                  : 'Belum ada akun pengguna yang terdaftar.'}
              </p>
            </div>
            {(searchQuery || roleFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setRoleFilter('ALL')
                  setPage(1)
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50/50 px-3.5 py-1.5 text-xs font-semibold text-orange-700 transition hover:bg-orange-100/60 dark:border-orange-800/60 dark:bg-orange-950/30 dark:text-orange-300"
              >
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-500">
                  <th className="px-4 py-3.5 sm:px-5">Pengguna & Profil</th>
                  <th className="px-4 py-3.5">Peran & Akses</th>
                  <th className="hidden px-4 py-3.5 sm:table-cell">
                    Kontak & Telepon
                  </th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="hidden px-4 py-3.5 md:table-cell">
                    Terdaftar
                  </th>
                  <th className="px-4 py-3.5 text-right sm:px-5">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
                {users.map((user) => {
                  const initial = (user.name || user.email || 'U')
                    .charAt(0)
                    .toUpperCase()
                  const isSuperAdmin = user.role === 'SUPER_ADMIN'

                  return (
                    <tr
                      key={user.id}
                      className="group transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                    >
                      {/* 1. User Identity & Orange Squircle Avatar */}
                      <td className="px-4 py-3.5 sm:px-5">
                        <div className="flex items-center gap-3">
                          {user.image ? (
                            <img
                              src={user.image}
                              alt={user.name || 'User'}
                              className="shadow-2xs h-9 w-9 shrink-0 rounded-xl border border-slate-200/60 object-cover dark:border-slate-700/60"
                            />
                          ) : (
                            <div className="shadow-2xs flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-orange-200/60 bg-orange-100/80 text-xs font-bold text-orange-700 dark:border-orange-800/40 dark:bg-orange-950/60 dark:text-orange-300">
                              {initial}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-slate-950 transition-colors group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-400 sm:text-sm">
                              {user.name || 'Pengguna Tanpa Nama'}
                            </p>
                            <p className="mt-0.5 max-w-[200px] truncate font-sans text-[11px] text-slate-400 dark:text-slate-500 sm:max-w-xs">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 2. Role Badge */}
                      <td className="px-4 py-3.5">{getRoleBadge(user)}</td>

                      {/* 3. Phone / WA */}
                      <td className="hidden px-4 py-3.5 sm:table-cell">
                        {user.phone ? (
                          <div className="flex items-center gap-1.5 font-mono text-xs text-slate-700 dark:text-slate-300">
                            <Phone className="h-3 w-3 shrink-0 font-sans text-slate-400" />
                            <span>{user.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">
                            -
                          </span>
                        )}
                      </td>

                      {/* 4. Active Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
                            user.isActive
                              ? 'border-emerald-200/60 bg-emerald-50 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'border-rose-200/60 bg-rose-50 text-rose-700 dark:border-rose-800/40 dark:bg-rose-950/40 dark:text-rose-400'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              user.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          {user.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>

                      {/* 5. Registered Date */}
                      <td className="hidden px-4 py-3.5 md:table-cell">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(user.createdAt)}
                        </span>
                      </td>

                      {/* 6. Quick Action Buttons */}
                      <td className="px-4 py-3.5 text-right sm:px-5">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Active/Inactive Button */}
                          {!isSuperAdmin && (
                            <button
                              onClick={() => handleToggleStatus(user)}
                              className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold transition ${
                                user.isActive
                                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400'
                              }`}
                              title={
                                user.isActive
                                  ? 'Nonaktifkan akun pengguna ini'
                                  : 'Aktifkan akun pengguna ini'
                              }
                            >
                              {user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                            </button>
                          )}

                          {/* Edit Role Button */}
                          <button
                            onClick={() => {
                              setEditingUser(user)
                              setShowEditModal(true)
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-orange-300 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-orange-800 dark:hover:text-orange-400"
                            title="Ubah Role & Status"
                          >
                            <Edit className="h-3 w-3 text-slate-400 group-hover:text-orange-500" />
                            <span>Edit</span>
                          </button>

                          {/* Delete Button */}
                          {!isSuperAdmin && (
                            <button
                              onClick={() =>
                                handleDelete(user.id, user.name, user.email)
                              }
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-rose-900 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                              title="Hapus Akun Pengguna"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. PAGINATION FOOTER                                                      */}
      {/* ========================================================================= */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Halaman {page} dari {totalPages}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="shadow-2xs rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="shadow-2xs rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateUserModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchUsers()
          }}
        />
      )}

      {showEditModal && editingUser && (
        <EditUserModal
          isOpen={showEditModal}
          user={editingUser}
          onClose={() => {
            setShowEditModal(false)
            setEditingUser(null)
          }}
          onSuccess={() => {
            setShowEditModal(false)
            setEditingUser(null)
            fetchUsers()
          }}
        />
      )}
    </div>
  )
}
