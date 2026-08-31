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
    <div className="space-y-8 py-6 sm:py-8">
      {/* 1. Header Hero Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-3xl bg-white p-6 sm:p-8 shadow-xs border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
            <Shield className="h-3.5 w-3.5 text-orange-500" />
            <span>Teknisi Bersertifikasi & Layanan Servis 2 Jam</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            Teknisi Servis Toko
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl">
            Kelola data staf teknisi bongkar pasang LCD, penanganan klaim garansi 30 hari, dan ketersediaan counter toko.
          </p>
        </div>

        <Link
          href="/dashboard/admin/technicians/create"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-xs font-semibold text-white shadow-sm shadow-orange-500/25 transition-all hover:bg-orange-600 active:scale-95 whitespace-nowrap"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>+ Tambah Teknisi</span>
        </Link>
      </div>

      {/* 2. 4 Metric Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Teknisi</p>
          <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{stats.totalTechnicians}</p>
          <p className="mt-1 text-[11px] text-slate-500">Staf servis terdaftar</p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Standby di Toko</p>
          <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.availableTechnicians}</p>
          <p className="mt-1 text-[11px] text-slate-500">Siap servis kilat 2 jam</p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Modul Servis</p>
          <p className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400">{stats.totalServices}</p>
          <p className="mt-1 text-[11px] text-slate-500">Katalog keahlian layar</p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Penanganan</p>
          <p className="mt-2 text-2xl font-black text-orange-600 dark:text-orange-400">{stats.totalOrders}</p>
          <p className="mt-1 text-[11px] text-slate-500">Order unit terselesaikan</p>
        </div>
      </div>

      {/* 3. Search Bar */}
      <div className="rounded-3xl bg-white p-4 shadow-xs border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-3 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari teknisi berdasarkan nama atau keahlian..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-xs font-medium outline-none transition focus:border-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
      </div>

      {/* 4. Technicians Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-500 mb-2" />
          <p className="text-xs font-medium">Memuat data staf teknisi...</p>
        </div>
      ) : filteredTechnicians.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-16 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800">
            <Shield className="h-7 w-7 text-slate-400" />
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">Tidak ada teknisi ditemukan</p>
          <p className="text-xs text-slate-400">Coba ubah kriteria pencarian atau tambahkan teknisi baru.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredTechnicians.map((tech) => (
            <div
              key={tech.id}
              className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900 space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {tech.user.image ? (
                      <img
                        src={tech.user.image}
                        alt={tech.user.name || 'Technician'}
                        className="h-11 w-11 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-700 font-bold text-sm dark:bg-orange-950/60 dark:text-orange-300">
                        {(tech.user.name || 'T').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {tech.user.name || 'Teknisi Tanpa Nama'}
                      </h3>
                      <p className="text-xs text-slate-400 truncate">
                        {tech.user.email}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      tech.isAvailable
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {tech.isAvailable ? 'Standby' : 'Sibuk'}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Pengalaman:</span>
                    <span className="font-semibold">{tech.experience} Tahun</span>
                  </div>

                  {tech.specialties && tech.specialties.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-slate-400">Spesialisasi:</span>
                      <div className="flex flex-wrap gap-1">
                        {tech.specialties.slice(0, 3).map((s, i) => (
                          <span
                            key={i}
                            className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  onClick={() => handleToggleAvailability(tech.id, tech.isAvailable)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  {tech.isAvailable ? 'Set Tidak Aktif' : 'Set Standby'}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDeleteTechnician(tech.id, tech.user.name || 'Teknisi')}
                    className="rounded-full p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Hapus Teknisi"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}



