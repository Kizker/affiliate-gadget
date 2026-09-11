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
  Check,
  XCircle,
  AlertTriangle,
  Loader2,
  Sparkles,
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
  totalViews?: number
  totalInquiries?: number
  isApproved: boolean
  isActive: boolean
  source?: 'store' | 'pending_applicant'
  rejectionReason?: string | null
  createdAt: string
  bankAccounts?: BankAccount[]
  schedules?: Schedule[]
  user: {
    id: string
    name: string | null
    email: string
    phone?: string | null
    isActive?: boolean
    mitraStatus: string | null
  }
  _count?: {
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

  // Approve Modal State
  const [approveModalOpen, setApproveModalOpen] = useState(false)
  const [approvingMitra, setApprovingMitra] = useState<Mitra | null>(null)

  // Reject Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectingMitra, setRejectingMitra] = useState<Mitra | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deletingStore, setDeletingStore] = useState<{
    id: string
    name: string
  } | null>(null)

  const [isProcessingAction, setIsProcessingAction] = useState(false)

  // Filters
  const [approvalFilter, setApprovalFilter] = useState<
    'ALL' | 'APPROVED' | 'PENDING'
  >('ALL')
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

  // Open Approve Modal
  const handleOpenApproveModal = (mitra: Mitra) => {
    setApprovingMitra(mitra)
    setApproveModalOpen(true)
  }

  // Confirm Approve Applicant
  const handleConfirmApprove = async () => {
    if (!approvingMitra) return
    const storeName = approvingMitra.name || approvingMitra.businessName

    setIsProcessingAction(true)
    try {
      const res = await fetch('/api/admin/mitras/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: approvingMitra.user?.id,
          id: approvingMitra.id,
          applicationId: approvingMitra.id.replace('applicant_', ''),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyetujui pendaftaran.')
      }

      toast.success(data.message || `Toko "${storeName}" berhasil disetujui!`)
      setApproveModalOpen(false)
      setApprovingMitra(null)
      fetchMitras()
    } catch (err) {
      console.error('Error approving applicant:', err)
      toast.error(
        err instanceof Error ? err.message : 'Gagal menyetujui pendaftaran.'
      )
    } finally {
      setIsProcessingAction(false)
    }
  }

  // Open Reject Modal
  const handleOpenRejectModal = (mitra: Mitra) => {
    setRejectingMitra(mitra)
    setRejectReason('')
    setRejectModalOpen(true)
  }

  // Submit Reject
  const handleSubmitReject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectingMitra || !rejectReason.trim()) {
      toast.error('Harap masukkan alasan penolakan atau instruksi perbaikan.')
      return
    }

    setIsProcessingAction(true)
    try {
      const res = await fetch('/api/admin/mitras/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: rejectingMitra.user.id,
          reason: rejectReason.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menolak pendaftaran.')
      }

      toast.success('Pendaftaran berhasil ditolak dengan instruksi perbaikan.')
      setRejectModalOpen(false)
      setRejectingMitra(null)
      setRejectReason('')
      fetchMitras()
    } catch (err) {
      console.error('Error rejecting applicant:', err)
      toast.error(
        err instanceof Error ? err.message : 'Gagal menolak pendaftaran.'
      )
    } finally {
      setIsProcessingAction(false)
    }
  }

  // Open Delete Modal
  const handleOpenDeleteModal = (id: string, businessName: string) => {
    setDeletingStore({ id, name: businessName })
    setDeleteModalOpen(true)
  }

  // Confirm Delete store (for existing Store records)
  const handleConfirmDelete = async () => {
    if (!deletingStore) return

    setIsProcessingAction(true)
    try {
      const res = await fetch(`/api/admin/mitras/${deletingStore.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Gagal menghapus toko')
      }

      toast.success(`Toko "${deletingStore.name}" berhasil dihapus`)
      setDeleteModalOpen(false)
      setDeletingStore(null)
      await new Promise((resolve) => setTimeout(resolve, 300))
      fetchMitras()
    } catch (error) {
      console.error('Error deleting mitra:', error)
      toast.error(
        error instanceof Error ? error.message : 'Gagal menghapus toko'
      )
    } finally {
      setIsProcessingAction(false)
    }
  }

  // Toggle approval (for existing Store records or applicant)
  const handleToggleApproval = async (
    id: string,
    currentStatus: boolean,
    businessName: string
  ) => {
    // If it's an applicant, route to approval flow
    const applicant = mitras.find((m) => m.id === id)
    if (
      id.startsWith('applicant_') ||
      applicant?.source === 'pending_applicant' ||
      applicant?.user?.mitraStatus === 'PENDING'
    ) {
      if (applicant) {
        return handleOpenApproveModal(applicant)
      }
    }

    try {
      const res = await fetch(`/api/admin/mitras/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: !currentStatus }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Gagal mengubah status verifikasi')
      }

      const data = await res.json().catch(() => ({}))
      toast.success(
        data.message ||
          `Status ${businessName} berhasil ${!currentStatus ? 'disetujui & aktif' : 'ditangguhkan'}`
      )
      fetchMitras()
    } catch (error) {
      console.error('Error updating approval:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Gagal mengubah status verifikasi'
      )
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} disalin ke clipboard`)
  }

  return (
    <div
      className="mx-auto max-w-7xl space-y-6 pb-12 pt-1"
      suppressHydrationWarning
    >
      {/* ========================================================================= */}
      {/* 1. TOP KPI CARDS (Bento Metric Grid with Action Orange Highlight)          */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
        {/* 1. Total Toko */}
        <div className="shadow-2xs hover:shadow-xs group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-orange-200 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total Jaringan
            </span>
            <div className="h-6.5 w-6.5 flex items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
              <Store className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900 dark:text-white sm:text-xl">
              {stats.total} Toko
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
              <span className="inline-flex items-center gap-1 font-semibold text-orange-600 dark:text-orange-400">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                Cabang & Pendaftar
              </span>
              <span className="text-slate-400 dark:text-slate-500">
                · Terdata
              </span>
            </div>
          </div>
        </div>

        {/* 2. Terverifikasi */}
        <div className="shadow-2xs hover:shadow-xs group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Terverifikasi
            </span>
            <div className="h-6.5 w-6.5 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900 dark:text-white sm:text-xl">
              {stats.approved} Toko
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                100% Beroperasi
              </span>
              <span className="text-slate-400 dark:text-slate-500">
                · Aktif
              </span>
            </div>
          </div>
        </div>

        {/* 3. Menunggu Review */}
        <div className="shadow-2xs hover:shadow-xs group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Menunggu Review
            </span>
            <div className="h-6.5 w-6.5 flex items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900 dark:text-white sm:text-xl">
              {stats.pending} Antrean
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
              {stats.pending > 0 ? (
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  Perlu Verifikasi
                </span>
              ) : (
                <span className="font-medium text-slate-500 dark:text-slate-400">
                  Antrean Bersih
                </span>
              )}
              <span className="text-slate-400 dark:text-slate-500">
                · Pendaftaran
              </span>
            </div>
          </div>
        </div>

        {/* 4. Kota Tercakup */}
        <div className="shadow-2xs hover:shadow-xs group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Kota Jangkauan
            </span>
            <div className="h-6.5 w-6.5 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
              <MapPin className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900 dark:text-white sm:text-xl">
              {stats.cities || 5} Kota
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Indonesia
              </span>
              <span className="text-slate-400 dark:text-slate-500">
                · Jangkauan kurir
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOOLBAR (Segmented Filter, Instant Search & Tambah Toko)                */}
      {/* ========================================================================= */}
      <div className="shadow-2xs flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900 sm:p-3 md:flex-row md:items-center">
        {/* Status Filter Tabs */}
        <div className="no-scrollbar flex items-center gap-1 overflow-x-auto rounded-xl bg-slate-100/80 p-1 dark:bg-slate-800/80">
          <button
            onClick={() => setApprovalFilter('ALL')}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              approvalFilter === 'ALL'
                ? 'shadow-2xs bg-white text-slate-950 dark:bg-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Semua Toko ({stats.total})
          </button>
          <button
            onClick={() => setApprovalFilter('APPROVED')}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              approvalFilter === 'APPROVED'
                ? 'shadow-2xs bg-white text-slate-950 dark:bg-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Terverifikasi ({stats.approved})
          </button>
          <button
            onClick={() => setApprovalFilter('PENDING')}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              approvalFilter === 'PENDING'
                ? 'shadow-2xs bg-white text-slate-950 dark:bg-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Menunggu Review ({stats.pending})
          </button>
        </div>

        {/* Search, City Filter & Add Button */}
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2 sm:flex-nowrap md:flex-initial">
          {/* City filter dropdown */}
          {cities.length > 0 && (
            <div className="relative">
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="shadow-2xs cursor-pointer appearance-none rounded-xl border border-slate-200/80 bg-slate-50 py-2 pl-3 pr-7 text-xs font-semibold text-slate-700 outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-orange-400"
              >
                <option value="">Semua Kota</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
          )}

          {/* Search Box with Action Orange focus */}
          <div className="relative w-full sm:w-56 md:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama toko, PT, kota..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="dark:focus:bg-slate-850 w-full rounded-xl border border-slate-200/80 bg-slate-50 py-2 pl-8 pr-7 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none transition focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-orange-400"
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
            className="inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-orange-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition hover:bg-orange-600 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Tambah Toko</span>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. STORE TABLE LIST (Complete Operational & Legal Data)                     */}
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
                    <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-3 w-24 rounded bg-slate-100 dark:bg-slate-800/60" />
                  </div>
                </div>
                <div className="hidden h-4 w-48 rounded bg-slate-100 dark:bg-slate-800 md:block" />
                <div className="hidden h-4 w-28 rounded bg-slate-100 dark:bg-slate-800 sm:block" />
                <div className="h-6 w-20 rounded-full bg-slate-100 dark:bg-slate-800" />
                <div className="h-7 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        ) : mitras.length === 0 ? (
          <div className="space-y-3 p-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 dark:bg-orange-950/40">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {approvalFilter === 'PENDING'
                  ? 'Tidak Ada Antrean Review'
                  : 'Tidak ada toko atau pendaftar ditemukan'}
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {approvalFilter === 'PENDING'
                  ? 'Semua pendaftaran mitra telah diproses. Belum ada pengajuan toko baru yang menunggu verifikasi.'
                  : searchQuery || cityFilter || approvalFilter !== 'ALL'
                    ? 'Tidak ada data yang sesuai dengan filter pencarian.'
                    : 'Belum ada cabang toko atau pendaftar baru.'}
              </p>
            </div>
            {(searchQuery || cityFilter || approvalFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setCityFilter('')
                  setApprovalFilter('ALL')
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50/50 px-3.5 py-1.5 text-xs font-semibold text-orange-700 transition hover:bg-orange-100/60 dark:border-orange-800/60 dark:bg-orange-950/30 dark:text-orange-300"
              >
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-500">
                  <th className="w-[25%] min-w-[200px] px-4 py-3.5 sm:px-5">
                    Toko & Badan Usaha PT
                  </th>
                  <th className="hidden w-[18%] min-w-[140px] px-3 py-3.5 md:table-cell">
                    Alamat Fisik
                  </th>
                  <th className="hidden w-[16%] min-w-[130px] px-3 py-3.5 sm:table-cell">
                    Kontak & PIC
                  </th>
                  <th className="hidden w-[16%] min-w-[130px] px-3 py-3.5 lg:table-cell">
                    Rekening & Komisi
                  </th>
                  <th className="w-[11%] min-w-[125px] px-3 py-3.5">
                    Status & Tipe
                  </th>
                  <th className="w-[14%] min-w-[200px] px-4 py-3.5 text-right sm:px-5">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
                {mitras.map((mitra) => {
                  const isApplicant = Boolean(
                    mitra.source === 'pending_applicant' ||
                    mitra.id?.startsWith('applicant_') ||
                    mitra.user?.mitraStatus === 'PENDING'
                  )
                  const storeName =
                    mitra.name || mitra.businessName || 'Toko Gadget'
                  const initial = storeName.charAt(0).toUpperCase() || 'T'
                  const primaryBank =
                    mitra.bankAccounts?.find((b) => b.isPrimary) ||
                    mitra.bankAccounts?.[0]
                  const company =
                    mitra.companyName ||
                    mitra.user?.name ||
                    'Badan Usaha Terdaftar'

                  return (
                    <tr
                      key={mitra.id}
                      className="group transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                    >
                      {/* 1. Store Identity */}
                      <td className="px-4 py-3.5 sm:px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`shadow-2xs flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xs font-bold ${
                              isApplicant
                                ? 'border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-300'
                                : 'border-orange-200/80 bg-orange-50 text-orange-600 dark:border-orange-800/60 dark:bg-orange-950/50 dark:text-orange-400'
                            }`}
                          >
                            {initial}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate text-xs font-bold text-slate-950 transition-colors group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-400 sm:text-sm">
                                {storeName}
                              </p>
                              {isApplicant && (
                                <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-amber-200/80 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-300">
                                  <Sparkles className="h-2.5 w-2.5" />
                                  Baru
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                              <span className="max-w-[130px] truncate font-medium text-slate-600 dark:text-slate-300 sm:max-w-[160px]">
                                {company}
                              </span>
                              <span>·</span>
                              <span className="max-w-[80px] shrink-0 truncate text-slate-400 dark:text-slate-500">
                                {mitra.city || 'Indonesia'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Physical Address */}
                      <td className="hidden px-3 py-3.5 md:table-cell">
                        <div className="min-w-0 text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="block truncate text-xs font-medium text-slate-800 dark:text-slate-200">
                              {mitra.address
                                ? mitra.address.split(',')[0].trim()
                                : mitra.city || 'Indonesia'}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate pl-5 font-sans text-[11px] text-slate-400 dark:text-slate-500">
                            {mitra.city || '-'}
                            {mitra.province
                              ? `, ${mitra.province}`
                              : ', Indonesia'}
                          </p>
                        </div>
                      </td>

                      {/* 3. Contact & PIC */}
                      <td className="hidden px-3 py-3.5 sm:table-cell">
                        <div className="min-w-0 text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-1.5 font-mono text-xs font-medium">
                            <Phone className="h-3.5 w-3.5 shrink-0 font-sans text-slate-400" />
                            <span className="truncate">
                              {mitra.phone || mitra.whatsapp || '-'}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate pl-5 text-[11px] text-slate-400 dark:text-slate-500">
                            {mitra.email || '-'}
                          </p>
                        </div>
                      </td>

                      {/* 4. Bank Account & Commission */}
                      <td className="hidden px-3 py-3.5 lg:table-cell">
                        <div className="min-w-0 text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                            <CreditCard className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">
                              {primaryBank?.bankName ||
                                (isApplicant
                                  ? 'Belum Ada Rekening'
                                  : 'Rekening PT')}
                            </span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-1 pl-5 font-mono text-[10px] text-slate-400 dark:text-slate-500">
                            <span className="truncate">
                              {primaryBank?.accountNumber
                                ? `•••${primaryBank.accountNumber.slice(-4)}`
                                : '-'}
                            </span>
                            <span>·</span>
                            <span className="shrink-0 font-sans font-semibold text-orange-600 dark:text-orange-400">
                              {mitra.commissionRate || 2}% Komisi
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 5. Status Badge */}
                      <td className="px-3 py-3.5">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                              isApplicant
                                ? 'border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-300'
                                : mitra.isApproved
                                  ? 'border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300'
                                  : 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                isApplicant
                                  ? 'animate-pulse bg-amber-500'
                                  : mitra.isApproved
                                    ? 'bg-emerald-500'
                                    : 'bg-slate-400'
                              }`}
                            />
                            {isApplicant
                              ? 'Menunggu Review'
                              : mitra.isApproved
                                ? 'Terverifikasi'
                                : 'Nonaktif'}
                          </span>
                        </div>
                      </td>

                      {/* 6. Action Buttons */}
                      <td className="px-4 py-3.5 text-right sm:px-5">
                        <div className="inline-flex flex-nowrap items-center justify-end gap-1">
                          {/* 1. Detail (Universal untuk semua mitra & pendaftar) */}
                          <Link
                            href={`/dashboard/admin/mitras/${mitra.id}`}
                            className="shadow-2xs inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-slate-200/90 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-orange-300 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-orange-800 dark:hover:text-orange-400"
                            title="Buka Halaman Detail Lengkap"
                          >
                            <Eye className="h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:text-orange-500" />
                            <span>Detail</span>
                          </Link>

                          {/* 2. Tombol Aksi Spesifik */}
                          {isApplicant ? (
                            <>
                              <button
                                onClick={() => handleOpenApproveModal(mitra)}
                                disabled={isProcessingAction}
                                className="shadow-2xs inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-emerald-600 px-3.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                                title="Setujui pendaftaran mitra dan buat toko resmi"
                              >
                                <Check className="h-3.5 w-3.5 shrink-0" />
                                <span>Setujui</span>
                              </button>

                              <button
                                onClick={() => handleOpenRejectModal(mitra)}
                                disabled={isProcessingAction}
                                className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-rose-200/80 bg-rose-50/80 px-3.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
                                title="Tolak pendaftaran dengan instruksi perbaikan"
                              >
                                <X className="h-3.5 w-3.5 shrink-0" />
                                <span>Tolak</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <Link
                                href={`/toko/${mitra.slug || mitra.id}`}
                                target="_blank"
                                className="shadow-2xs hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200/90 bg-white text-slate-500 transition hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white xl:inline-flex"
                                title="Buka halaman publik toko"
                              >
                                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                              </Link>

                              <button
                                onClick={() =>
                                  handleToggleApproval(
                                    mitra.id,
                                    mitra.isApproved,
                                    storeName
                                  )
                                }
                                className={`shadow-2xs inline-flex h-8 shrink-0 items-center justify-center rounded-full border px-2.5 text-xs font-semibold transition ${
                                  mitra.isApproved
                                    ? 'border-rose-200/80 bg-rose-50/60 text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-400'
                                    : 'border-emerald-200/80 bg-emerald-50/60 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-400'
                                }`}
                                title={
                                  mitra.isApproved
                                    ? 'Tangguhkan toko ini'
                                    : 'Setujui & aktifkan toko'
                                }
                              >
                                {mitra.isApproved ? 'Tangguhkan' : 'Aktifkan'}
                              </button>

                              <Link
                                href={`/dashboard/admin/mitras/${mitra.id}/edit`}
                                className="shadow-2xs inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200/90 bg-white text-slate-500 transition hover:border-orange-300 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-orange-400"
                                title="Ubah Profil Toko"
                              >
                                <Edit className="h-3.5 w-3.5 shrink-0" />
                              </Link>

                              <button
                                onClick={() =>
                                  handleOpenDeleteModal(mitra.id, storeName)
                                }
                                className="shadow-2xs inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200/90 bg-white text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-rose-900 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                                title="Hapus Toko"
                              >
                                <Trash2 className="h-3.5 w-3.5 shrink-0" />
                              </button>
                            </>
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
      {/* ========================================================================= */}
      {/* 4. MODAL KONFIRMASI SETUJUI MITRA (Modern Luxury Dialog)                  */}
      {/* ========================================================================= */}
      {approveModalOpen && approvingMitra && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 duration-150 animate-in fade-in">
          <div className="w-full max-w-md space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl duration-150 animate-in zoom-in-95 dark:border-slate-800 dark:bg-slate-900">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                    Setujui Pendaftaran Mitra
                  </h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {approvingMitra.name || approvingMitra.businessName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!isProcessingAction) {
                    setApproveModalOpen(false)
                    setApprovingMitra(null)
                  }
                }}
                className="text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Info Bento Card */}
            <div className="space-y-2.5 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-xs dark:border-emerald-900/60 dark:bg-emerald-950/20">
              <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                Persetujuan ini akan memproses langkah berikut:
              </p>
              <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <Store className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span>
                    Menerbitkan profil <strong>cabang toko resmi</strong> di
                    katalog publik & direktori toko.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span>
                    Mengaktifkan peran <strong>Admin Toko (STORE_ADMIN)</strong>{' '}
                    untuk akun (
                    {approvingMitra.user?.email || approvingMitra.email || '-'}
                    ).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Percent className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span>
                    Menetapkan komisi platform standar <strong>1–3%</strong> per
                    pesanan berhasil.
                  </span>
                </li>
              </ul>
            </div>

            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Pastikan Anda telah memverifikasi data legalitas dan rekening bank
              mitra sebelum menyetujui pendaftaran.
            </p>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setApproveModalOpen(false)
                  setApprovingMitra(null)
                }}
                disabled={isProcessingAction}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={isProcessingAction}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-sm shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {isProcessingAction ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span>Setujui & Buat Toko</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL PENOLAKAN PENDAFTAR (Input Rejection Note)                        */}
      {/* ========================================================================= */}
      {rejectModalOpen && rejectingMitra && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 duration-150 animate-in fade-in">
          <div className="w-full max-w-md space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl duration-150 animate-in zoom-in-95 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                    Tolak Pengajuan Mitra
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {rejectingMitra.name || rejectingMitra.businessName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReject} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Alasan Penolakan / Catatan Perbaikan{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Contoh: Mohon lengkapi alamat lengkap fisik cabang toko beserta nomor telepon resmi badan usaha."
                  className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <p className="text-[10px] text-slate-400">
                  Pesan ini akan tampil di dashboard calon mitra agar mereka
                  dapat merevisi dan mengajukan ulang data toko mereka.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  disabled={isProcessingAction}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProcessingAction || !rejectReason.trim()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-50"
                >
                  {isProcessingAction ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>Kirim Penolakan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL KONFIRMASI HAPUS TOKO (Modern Luxury Dialog)                     */}
      {/* ========================================================================= */}
      {deleteModalOpen && deletingStore && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 duration-150 animate-in fade-in">
          <div className="w-full max-w-md space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl duration-150 animate-in zoom-in-95 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/50">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Hapus Cabang Toko?
                  </h3>
                  <p className="text-xs font-medium text-rose-500">
                    Tindakan ini permanen
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isProcessingAction) {
                    setDeleteModalOpen(false)
                    setDeletingStore(null)
                  }
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Apakah Anda yakin ingin menghapus cabang toko{' '}
              <strong className="font-bold text-slate-950 dark:text-white">
                {deletingStore.name}
              </strong>
              ? Seluruh data profil toko, rekening bank, dan jadwal operasional
              akan dihapus permanen dari sistem.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false)
                  setDeletingStore(null)
                }}
                disabled={isProcessingAction}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isProcessingAction}
                className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-sm shadow-rose-600/25 transition hover:bg-rose-700 disabled:opacity-50"
              >
                {isProcessingAction ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Ya, Hapus Toko</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
