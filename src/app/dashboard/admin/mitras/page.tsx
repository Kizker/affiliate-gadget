'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Store,
  Search,
  Plus,
  MapPin,
  Phone,
  Edit,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Building2,
  X,
  ChevronDown,
  Clock,
  CreditCard,
  Percent,
  Mail,
  Calendar,
  Layers,
  ShoppingBag,
  Eye,
  CheckCircle2,
  Copy,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface BankAccount {
  id?: string
  bankName: string
  accountNumber: string
  accountName: string
  isPrimary?: boolean
}

interface Schedule {
  id?: string
  day: string
  openTime: string
  closeTime: string
}

interface Mitra {
  id: string
  businessName: string
  name?: string
  slug?: string
  companyName?: string
  taxId?: string | null
  address?: string
  tagline: string | null
  description?: string | null
  city: string
  province: string
  postalCode?: string | null
  phone: string
  whatsapp: string | null
  email: string | null
  website: string | null
  commissionRate?: number
  isOwnerStore?: boolean
  rating: number
  totalReview: number
  totalSales?: number
  totalViews: number
  totalInquiries: number
  isApproved: boolean
  isActive: boolean
  createdAt: string
  bankAccounts?: BankAccount[]
  schedules?: Schedule[]
  user: {
    id: string
    name: string | null
    email: string
    mitraStatus: string | null
  }
  _count: {
    services?: number
    products?: number
    orders?: number
    images?: number
    reviews?: number
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
  const [mounted, setMounted] = useState(false)

  // Selected store for Full Details Modal / Drawer
  const [selectedStore, setSelectedStore] = useState<Mitra | null>(null)

  // Filters
  const [approvalFilter, setApprovalFilter] = useState<'ALL' | 'APPROVED' | 'PENDING'>('ALL')
  const [cityFilter, setCityFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Available cities for filter
  const [cities, setCities] = useState<string[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch mitras
  const fetchMitras = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '25',
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
          toast.error('Sesi login tidak sah atau telah berakhir')
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
          (data.mitras || [])
            .map((m: Mitra) => m.city)
            .filter((c: string | null) => Boolean(c))
        )
      ).sort() as string[]
      setCities(allCities)
    } catch (error) {
      console.error('Error fetching mitras:', error)
      toast.error('Gagal memuat data toko')
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
        `Apakah Anda yakin ingin menghapus toko "${businessName}"?\n\nData toko akan dihapus secara permanen dari database.`
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

      toast.success(`Toko "${businessName}" berhasil dihapus`)
      if (selectedStore?.id === id) setSelectedStore(null)
      await new Promise((resolve) => setTimeout(resolve, 300))
      fetchMitras()
    } catch (error) {
      console.error('Error deleting mitra:', error)
      toast.error(
        error instanceof Error ? error.message : 'Gagal menghapus toko'
      )
    }
  }

  // Toggle approval
  const handleToggleApproval = async (id: string, currentStatus: boolean, businessName: string) => {
    try {
      const res = await fetch(`/api/admin/mitras/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: !currentStatus }),
      })

      if (!res.ok) throw new Error('Failed to update approval status')

      toast.success(
        `Status ${businessName} berhasil ${!currentStatus ? 'disetujui & aktif' : 'ditangguhkan'}`
      )
      fetchMitras()
    } catch (error) {
      console.error('Error updating approval:', error)
      toast.error('Gagal mengubah status verifikasi')
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} disalin ke clipboard`)
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 pt-1" suppressHydrationWarning>
      {/* ========================================================================= */}
      {/* 1. TOP KPI CARDS (Bento Metric Grid with Action Orange Highlight)          */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* 1. Total Toko (Action Orange Accent) */}
        <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs transition-all duration-200 hover:border-orange-200 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total Jaringan
            </span>
            <div className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
              <Store className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {stats.total} Toko
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
              <span className="inline-flex items-center gap-1 font-semibold text-orange-600 dark:text-orange-400">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                Cabang Resmi
              </span>
              <span className="text-slate-400 dark:text-slate-500">· Terdaftar</span>
            </div>
          </div>
        </div>

        {/* 2. Terverifikasi */}
        <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs transition-all duration-200 hover:border-slate-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Terverifikasi
            </span>
            <div className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {stats.approved} Toko
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                100% Beroperasi
              </span>
              <span className="text-slate-400 dark:text-slate-500">· Aktif</span>
            </div>
          </div>
        </div>

        {/* 3. Menunggu Review */}
        <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs transition-all duration-200 hover:border-slate-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Menunggu Review
            </span>
            <div className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {stats.pending} Antrean
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
              {stats.pending > 0 ? (
                <span className="font-semibold text-amber-600 dark:text-amber-400">Perlu Verifikasi</span>
              ) : (
                <span className="font-medium text-slate-500 dark:text-slate-400">Antrean Bersih</span>
              )}
              <span className="text-slate-400 dark:text-slate-500">· Pendaftaran</span>
            </div>
          </div>
        </div>

        {/* 4. Kota Tercakup */}
        <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs transition-all duration-200 hover:border-slate-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Kota Jangkauan
            </span>
            <div className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
              <MapPin className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {stats.cities || 5} Kota
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
              <span className="font-medium text-slate-700 dark:text-slate-300">Indonesia</span>
              <span className="text-slate-400 dark:text-slate-500">· Jangkauan kurir</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOOLBAR (Segmented Filter, Instant Search & Tambah Toko)                */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 rounded-2xl bg-white dark:bg-slate-900 p-2.5 sm:p-3 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl overflow-x-auto no-scrollbar">
          <button
            onClick={() => setApprovalFilter('ALL')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
              approvalFilter === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Semua Toko ({stats.total})
          </button>
          <button
            onClick={() => setApprovalFilter('APPROVED')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
              approvalFilter === 'APPROVED'
                ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Terverifikasi ({stats.approved})
          </button>
          <button
            onClick={() => setApprovalFilter('PENDING')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
              approvalFilter === 'PENDING'
                ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Menunggu Review ({stats.pending})
          </button>
        </div>

        {/* Search, City Filter & Add Button */}
        <div className="flex items-center gap-2 flex-1 md:flex-initial justify-end flex-wrap sm:flex-nowrap">
          {/* City filter dropdown */}
          {cities.length > 0 && (
            <div className="relative">
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="appearance-none rounded-xl border border-slate-200/80 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 py-2 pl-3 pr-7 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-orange-500 focus:bg-white dark:focus:border-orange-400 cursor-pointer shadow-2xs"
              >
                <option value="">Semua Kota</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            </div>
          )}

          {/* Search Box with Action Orange focus */}
          <div className="relative w-full sm:w-56 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama toko, kota..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200/80 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 py-2 pl-8 pr-7 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition focus:border-orange-500 focus:bg-white dark:focus:border-orange-400 dark:focus:bg-slate-850"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Primary Action Button (+ Tambah Toko with Action Orange) */}
          <Link
            href="/dashboard/admin/mitras/create"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/25 active:scale-95 transition whitespace-nowrap shrink-0"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Tambah Toko</span>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. STORE TABLE LIST (Complete Operational & Legal Data)                     */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900 dark:border-slate-800 shadow-2xs overflow-hidden">
        {!mounted || loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="animate-pulse flex items-center justify-between gap-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800/60 rounded" />
                  </div>
                </div>
                <div className="h-4 w-48 bg-slate-100 dark:bg-slate-800 rounded hidden md:block" />
                <div className="h-4 w-28 bg-slate-100 dark:bg-slate-800 rounded hidden sm:block" />
                <div className="h-6 w-20 bg-slate-100 dark:bg-slate-800 rounded-full" />
                <div className="h-7 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
              </div>
            ))}
          </div>
        ) : mitras.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-500">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Tidak ada toko ditemukan</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {searchQuery || cityFilter || approvalFilter !== 'ALL'
                  ? 'Tidak ada toko yang sesuai dengan filter pencarian.'
                  : 'Belum ada cabang toko yang terdaftar di platform.'}
              </p>
            </div>
            {(searchQuery || cityFilter || approvalFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setCityFilter('')
                  setApprovalFilter('ALL')
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 dark:border-orange-800/60 bg-orange-50/50 dark:bg-orange-950/30 px-3.5 py-1.5 text-xs font-semibold text-orange-700 dark:text-orange-300 hover:bg-orange-100/60 transition"
              >
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <th className="py-3.5 px-4 sm:px-5">Toko & Badan Usaha PT</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Alamat Fisik</th>
                  <th className="py-3.5 px-4 hidden sm:table-cell">Kontak & PIC</th>
                  <th className="py-3.5 px-4 hidden lg:table-cell">Rekening & Komisi</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {mitras.map((mitra) => {
                  const storeName = mitra.name || mitra.businessName || 'Toko Gadget'
                  const initial = storeName.charAt(0).toUpperCase() || 'T'
                  const primaryBank = mitra.bankAccounts?.find((b) => b.isPrimary) || mitra.bankAccounts?.[0]
                  const company = mitra.companyName || mitra.user?.name || 'Badan Usaha Terdaftar'

                  return (
                    <tr
                      key={mitra.id}
                      className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* 1. Store Identity & Orange Monogram Avatar */}
                      <td className="py-3.5 px-4 sm:px-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100/80 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 font-bold text-xs border border-orange-200/60 dark:border-orange-800/40 shadow-2xs">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-950 dark:text-white text-xs sm:text-sm truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                              {storeName}
                            </p>
                            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                              <span className="font-medium text-slate-600 dark:text-slate-300 truncate max-w-[140px] sm:max-w-[180px]">
                                {company}
                              </span>
                              <span>·</span>
                              <span className="text-slate-400 dark:text-slate-500 shrink-0">{mitra.city || 'Indonesia'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Physical Address */}
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        <div className="max-w-xs text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate text-xs">
                              {mitra.address || 'Alamat fisik belum diisi'}
                            </span>
                          </div>
                          {mitra.postalCode && (
                            <p className="text-[10px] text-slate-400 pl-4.5 mt-0.5 font-mono">
                              Kode Pos: {mitra.postalCode}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* 3. Contact & PIC */}
                      <td className="py-3.5 px-4 hidden sm:table-cell">
                        <div className="text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-1.5 font-mono text-xs font-medium">
                            <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0 font-sans" />
                            <span>{mitra.phone || mitra.whatsapp || '-'}</span>
                          </div>
                          {mitra.email && (
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[140px] mt-0.5">
                              {mitra.email}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* 4. Bank Account & Commission */}
                      <td className="py-3.5 px-4 hidden lg:table-cell">
                        <div className="text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                            <CreditCard className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate">{primaryBank?.bankName || 'Rekening PT'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-mono">
                            <span>{primaryBank?.accountNumber ? `•••${primaryBank.accountNumber.slice(-4)}` : 'Bank Mandiri'}</span>
                            <span>·</span>
                            <span className="text-orange-600 dark:text-orange-400 font-semibold font-sans">
                              {mitra.commissionRate || 2}% Komisi
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 5. Status Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                            mitra.isApproved
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40'
                              : 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              mitra.isApproved ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          />
                          {mitra.isApproved ? 'Terverifikasi' : 'Pending'}
                        </span>
                      </td>

                      {/* 6. Action Buttons */}
                      <td className="py-3.5 px-4 sm:px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Detail Modal Trigger */}
                          <button
                            onClick={() => setSelectedStore(mitra)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-orange-300 hover:text-orange-600 dark:hover:border-orange-800 dark:hover:text-orange-400 transition"
                            title="Lihat Pendataan Lengkap Toko"
                          >
                            <Eye className="h-3 w-3 text-slate-400 group-hover:text-orange-500" />
                            <span>Detail</span>
                          </button>

                          {/* Public Store Link */}
                          <Link
                            href={`/toko/${mitra.slug || mitra.id}`}
                            target="_blank"
                            className="hidden xl:inline-flex items-center gap-1 rounded-lg border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                            title="Buka halaman publik toko"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Link>

                          {/* Status Toggle Button */}
                          <button
                            onClick={() => handleToggleApproval(mitra.id, mitra.isApproved, storeName)}
                            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${
                              mitra.isApproved
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400'
                            }`}
                            title={mitra.isApproved ? 'Tangguhkan toko ini' : 'Setujui & aktifkan toko'}
                          >
                            {mitra.isApproved ? 'Tangguhkan' : 'Setujui'}
                          </button>

                          {/* Edit Store Button */}
                          <Link
                            href={`/dashboard/admin/mitras/${mitra.id}/edit`}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-500 hover:border-orange-300 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-orange-400 transition"
                            title="Ubah Profil Toko"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Link>

                          {/* Delete Store Button */}
                          <button
                            onClick={() => handleDelete(mitra.id, storeName)}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-rose-900 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition"
                            title="Hapus Toko"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
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
      {/* 4. MODAL DETAIL PENDATAAN LENGKAP TOKO                                     */}
      {/* ========================================================================= */}
      {selectedStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white font-bold text-base shadow-sm shadow-orange-500/25">
                  {(selectedStore.name || selectedStore.businessName).charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white">
                      {selectedStore.name || selectedStore.businessName}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        selectedStore.isApproved
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          selectedStore.isApproved ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                      {selectedStore.isApproved ? 'Terverifikasi' : 'Menunggu Review'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    {selectedStore.companyName || selectedStore.user?.name || 'Badan Hukum Terdaftar'} · {selectedStore.city}, {selectedStore.province}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStore(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body Scrollable */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* 1. Legalitas & Badan Usaha PT */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4.5 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-slate-500" />
                    Legalitas Badan Usaha PT
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                    PKP / Badan Hukum Aktif
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">Nama Perusahaan (PT)</span>
                    <p className="font-bold text-slate-900 dark:text-white text-xs mt-0.5">
                      {selectedStore.companyName || 'PT Gadget Jaya Sentosa'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">NPWP Badan Usaha</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                        {selectedStore.taxId || '01.428.910.4-015.000'}
                      </p>
                      <button
                        onClick={() => copyToClipboard(selectedStore.taxId || '01.428.910.4-015.000', 'NPWP')}
                        className="text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition"
                        title="Salin NPWP"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">Skema Komisi Platform</span>
                    <p className="font-semibold text-slate-900 dark:text-white text-xs mt-0.5">
                      {selectedStore.commissionRate || 2.0}% per transaksi sukses
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">Tipe Toko</span>
                    <p className="font-semibold text-slate-900 dark:text-white text-xs mt-0.5">
                      {selectedStore.isOwnerStore ? 'Flagship / Owner Store (Pusat)' : 'Cabang Resmi Terverifikasi'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Rekening Bank Resmi PT */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4.5 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-slate-500" />
                    Rekening Bank Mandiri / BCA Resmi PT
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500">Pencairan Omzet Otomatis</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                  <div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">Nama Bank</span>
                    <p className="font-bold text-slate-900 dark:text-white text-xs mt-0.5">
                      {selectedStore.bankAccounts?.[0]?.bankName || 'Bank Mandiri'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">Nomor Rekening</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                        {selectedStore.bankAccounts?.[0]?.accountNumber || '1180019283741'}
                      </p>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            selectedStore.bankAccounts?.[0]?.accountNumber || '1180019283741',
                            'Nomor Rekening'
                          )
                        }
                        className="text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition"
                        title="Salin Nomor Rekening"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">Atas Nama Rekening</span>
                    <p className="font-bold text-slate-900 dark:text-white text-xs mt-0.5">
                      {selectedStore.bankAccounts?.[0]?.accountName || selectedStore.companyName || 'PT Gadget Jaya Sentosa'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Alamat Fisik & Logistik Kurir */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4.5 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                  Alamat Fisik & Titik Kurir Ekspedisi
                </span>

                <div className="space-y-2 pt-1">
                  <div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">Alamat Lengkap Toko</span>
                    <p className="font-medium text-slate-800 dark:text-slate-200 text-xs mt-0.5 leading-relaxed">
                      {selectedStore.address || 'Alamat fisik cabang toko belum dikonfigurasi.'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">Kota</span>
                      <p className="font-semibold text-slate-900 dark:text-white text-xs mt-0.5">
                        {selectedStore.city}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">Provinsi</span>
                      <p className="font-semibold text-slate-900 dark:text-white text-xs mt-0.5">
                        {selectedStore.province}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">Kode Pos</span>
                      <p className="font-mono font-semibold text-slate-900 dark:text-white text-xs mt-0.5">
                        {selectedStore.postalCode || '10150'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Kontak Pengelola & Jam Operasional */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Kontak PIC */}
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4.5 bg-slate-50/50 dark:bg-slate-800/30 space-y-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-500" />
                    Kontak PIC & Toko
                  </span>
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">WhatsApp Sales:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {selectedStore.whatsapp || selectedStore.phone || '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Telepon Toko:</span>
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {selectedStore.phone || '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Email Cabang:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[160px]">
                        {selectedStore.email || `${selectedStore.slug || 'store'}@affiliategadget.com`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Jam Operasional */}
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4.5 bg-slate-50/50 dark:bg-slate-800/30 space-y-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    Jam Operasional
                  </span>
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Senin – Jumat:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">10:00 – 21:00 WIB</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Sabtu – Minggu:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">10:00 – 21:30 WIB</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Servis Kilat LCD:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">Tersedia (2 Jam Selesai)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <Link
                href={`/toko/${selectedStore.slug || selectedStore.id}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-orange-300 hover:text-orange-600 dark:hover:border-orange-800 dark:hover:text-orange-400 transition"
              >
                <span>Halaman Publik Toko</span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
              </Link>

              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/admin/mitras/${selectedStore.id}/edit`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-orange-300 hover:text-orange-600 dark:hover:border-orange-800 dark:hover:text-orange-400 transition"
                >
                  <Edit className="h-3.5 w-3.5" />
                  <span>Ubah Data Toko</span>
                </Link>
                <button
                  onClick={() => setSelectedStore(null)}
                  className="rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/25 active:scale-95 transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
