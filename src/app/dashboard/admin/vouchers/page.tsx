'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Tag,
  Search,
  Plus,
  Edit,
  Trash2,
  Copy,
  Check,
  Percent,
  Calendar,
  Layers,
  ShoppingBag,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Sparkles,
  Users,
  Clock,
  ChevronRight,
  X,
  ArrowRight,
  DollarSign,
} from 'lucide-react'
import { toast } from 'sonner'

interface VoucherItem {
  id: string
  code: string
  description: string | null
  discountPercent: number
  maxDiscountAmount: number | null
  minimumPurchase: number
  totalQuota: number
  usedCount: number
  remainingQuota: number
  usagePerUser: number
  applicableOrderType: string
  isActive: boolean
  validFrom: string
  validUntil: string
  createdAt: string
  _count?: {
    usages: number
  }
}

interface VoucherUsageDetail {
  id: string
  discountApplied: number
  usedAt: string
  user: {
    id: string
    name: string | null
    email: string
    phone: string | null
  }
  order: {
    id: string
    orderNumber: string
    total: number
    status: string
    createdAt: string
  }
}

interface VoucherDetailResponse extends VoucherItem {
  usages: VoucherUsageDetail[]
}

export default function VouchersPage() {
  const router = useRouter()
  const { data: session, status: authStatus } = useSession()

  const [vouchers, setVouchers] = useState<VoucherItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'ACTIVE' | 'INACTIVE'
  >('ALL')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const [selectedVoucher, setSelectedVoucher] = useState<VoucherItem | null>(
    null
  )
  const [detailData, setDetailData] = useState<VoucherDetailResponse | null>(
    null
  )
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountPercent: 10,
    maxDiscountAmount: '',
    minimumPurchase: 0,
    totalQuota: 50,
    usagePerUser: 1,
    validFrom: new Date().toISOString().slice(0, 10),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    isActive: true,
  })

  // Auth guard: strictly SUPER_ADMIN
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login')
    } else if (
      authStatus === 'authenticated' &&
      session?.user?.role !== 'SUPER_ADMIN'
    ) {
      toast.error('Akses khusus Super Admin')
      router.push('/dashboard/admin')
    }
  }, [authStatus, session, router])

  const fetchVouchers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (statusFilter !== 'ALL') params.set('status', statusFilter)

      const res = await fetch(`/api/admin/vouchers?${params}`)
      if (!res.ok) {
        throw new Error('Gagal mengambil data voucher')
      }
      const data = await res.json()
      setVouchers(data.vouchers || [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, statusFilter])

  useEffect(() => {
    if (session?.user?.role === 'SUPER_ADMIN') {
      fetchVouchers()
    }
  }, [fetchVouchers, session])

  // Stats calculation
  const stats = useMemo(() => {
    const total = vouchers.length
    const active = vouchers.filter((v) => v.isActive).length
    const totalUsed = vouchers.reduce((sum, v) => sum + v.usedCount, 0)
    const exhausted = vouchers.filter((v) => v.usedCount >= v.totalQuota).length
    return { total, active, totalUsed, exhausted }
  }, [vouchers])

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success(`Kode ${code} disalin`)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleToggleActive = async (voucher: VoucherItem) => {
    try {
      const res = await fetch(`/api/admin/vouchers/${voucher.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !voucher.isActive }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Gagal mengubah status')
      }
      toast.success(
        `Voucher ${voucher.code} ${!voucher.isActive ? 'diaktifkan' : 'dinonaktifkan'}`
      )
      fetchVouchers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengubah status')
    }
  }

  const openCreateModal = () => {
    setFormData({
      code: '',
      description: '',
      discountPercent: 10,
      maxDiscountAmount: '',
      minimumPurchase: 0,
      totalQuota: 50,
      usagePerUser: 1,
      validFrom: new Date().toISOString().slice(0, 10),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
      isActive: true,
    })
    setShowCreateModal(true)
  }

  const openEditModal = (voucher: VoucherItem) => {
    setSelectedVoucher(voucher)
    setFormData({
      code: voucher.code,
      description: voucher.description || '',
      discountPercent: voucher.discountPercent,
      maxDiscountAmount:
        voucher.maxDiscountAmount !== null
          ? String(voucher.maxDiscountAmount)
          : '',
      minimumPurchase: voucher.minimumPurchase,
      totalQuota: voucher.totalQuota,
      usagePerUser: voucher.usagePerUser,
      validFrom: new Date(voucher.validFrom).toISOString().slice(0, 10),
      validUntil: new Date(voucher.validUntil).toISOString().slice(0, 10),
      isActive: voucher.isActive,
    })
    setShowEditModal(true)
  }

  const openDetailModal = async (voucher: VoucherItem) => {
    setSelectedVoucher(voucher)
    setShowDetailModal(true)
    setLoadingDetail(true)
    try {
      const res = await fetch(`/api/admin/vouchers/${voucher.id}`)
      if (!res.ok) throw new Error('Gagal memuat detail pemakaian')
      const data = await res.json()
      setDetailData(data.voucher)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat detail')
    } finally {
      setLoadingDetail(false)
    }
  }

  const openDeleteModal = (voucher: VoucherItem) => {
    setSelectedVoucher(voucher)
    setShowDeleteModal(true)
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          maxDiscountAmount:
            formData.maxDiscountAmount !== ''
              ? Number(formData.maxDiscountAmount)
              : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal membuat voucher')
      }
      toast.success(`Voucher ${data.voucher.code} berhasil dibuat!`)
      setShowCreateModal(false)
      fetchVouchers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal membuat voucher')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVoucher) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/vouchers/${selectedVoucher.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: formData.description,
          discountPercent: Number(formData.discountPercent),
          maxDiscountAmount:
            formData.maxDiscountAmount !== ''
              ? Number(formData.maxDiscountAmount)
              : null,
          minimumPurchase: Number(formData.minimumPurchase),
          totalQuota: Number(formData.totalQuota),
          usagePerUser: Number(formData.usagePerUser),
          validFrom: formData.validFrom,
          validUntil: formData.validUntil,
          isActive: formData.isActive,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memperbarui voucher')
      }
      toast.success('Voucher berhasil diperbarui!')
      setShowEditModal(false)
      fetchVouchers()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Gagal memperbarui voucher'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSubmit = async () => {
    if (!selectedVoucher) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/vouchers/${selectedVoucher.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menghapus voucher')
      }
      toast.success('Voucher berhasil dihapus!')
      setShowDeleteModal(false)
      fetchVouchers()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Gagal menghapus voucher'
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (authStatus === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Header ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Kelola Voucher & Promo
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Atur kode promo diskon persentase, kuota pemakaian, dan masa
                berlaku
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
        >
          <Plus className="h-4 w-4" />
          <span>Buat Voucher Baru</span>
        </button>
      </div>

      {/* ─── Stats Bento Cards ─── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Total Voucher
          </span>
          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {stats.total}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            Voucher Aktif
          </span>
          <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {stats.active}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
            Total Pemakaian
          </span>
          <p className="mt-1 text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
            {stats.totalUsed}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
            Kuota Habis
          </span>
          <p className="mt-1 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
            {stats.exhausted}
          </p>
        </div>
      </div>

      {/* ─── Search & Filters ─── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode voucher atau deskripsi..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {st === 'ALL'
                ? 'Semua Status'
                : st === 'ACTIVE'
                  ? 'Aktif'
                  : 'Nonaktif'}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Voucher Table ─── */}
      <div className="shadow-xs overflow-hidden rounded-3xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          </div>
        ) : vouchers.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
              <Tag className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
              Belum Ada Voucher
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Buat voucher promo pertama Anda untuk menarik lebih banyak
              pembeli.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-orange-600"
            >
              <Plus className="h-3.5 w-3.5" /> Buat Voucher
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Kode Promo</th>
                  <th className="px-4 py-3.5">Diskon (%)</th>
                  <th className="px-4 py-3.5">Min. Belanja</th>
                  <th className="px-4 py-3.5">Kuota / Terpakai</th>
                  <th className="px-4 py-3.5">Masa Berlaku</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {vouchers.map((v) => {
                  const isExpired = new Date(v.validUntil) < new Date()
                  const isExhausted = v.usedCount >= v.totalQuota
                  const quotaPercentage = Math.min(
                    100,
                    Math.round((v.usedCount / v.totalQuota) * 100)
                  )

                  return (
                    <tr
                      key={v.id}
                      className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    >
                      {/* Code & Desc */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-black tracking-wider text-slate-900 dark:text-white">
                            {v.code}
                          </span>
                          <button
                            onClick={() => handleCopy(v.code)}
                            title="Salin Kode"
                            className="text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            {copiedCode === v.code ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                        {v.description && (
                          <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">
                            {v.description}
                          </p>
                        )}
                      </td>

                      {/* Discount */}
                      <td className="px-4 py-4">
                        <div className="font-bold text-orange-600 dark:text-orange-400">
                          {v.discountPercent}% OFF
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {v.maxDiscountAmount
                            ? `Maks: Rp ${v.maxDiscountAmount.toLocaleString('id-ID')}`
                            : 'Tanpa Batas Maks'}
                        </div>
                      </td>

                      {/* Min Purchase */}
                      <td className="px-4 py-4 font-medium text-slate-700 dark:text-slate-300">
                        {v.minimumPurchase > 0
                          ? `Rp ${v.minimumPurchase.toLocaleString('id-ID')}`
                          : 'Rp 0 (Semua)'}
                      </td>

                      {/* Quota */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {v.usedCount}
                          </span>
                          <span className="text-slate-400">
                            / {v.totalQuota}
                          </span>
                          {isExhausted && (
                            <span className="rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-700 dark:bg-red-950/60 dark:text-red-300">
                              Habis
                            </span>
                          )}
                        </div>
                        <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className={`h-full rounded-full ${
                              isExhausted
                                ? 'bg-red-500'
                                : quotaPercentage > 75
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                            }`}
                            style={{ width: `${quotaPercentage}%` }}
                          />
                        </div>
                      </td>

                      {/* Validity Period */}
                      <td className="px-4 py-4">
                        <div className="text-slate-700 dark:text-slate-300">
                          {new Date(v.validFrom).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                          })}{' '}
                          -{' '}
                          {new Date(v.validUntil).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        {isExpired && (
                          <span className="py-0.2 mt-0.5 inline-block rounded bg-slate-100 px-1.5 text-[9px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            Kedaluwarsa
                          </span>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(v)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                            v.isActive
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              v.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          <span>{v.isActive ? 'Aktif' : 'Nonaktif'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openDetailModal(v)}
                            title="Lihat Riwayat Pemakaian"
                            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(v)}
                            title="Edit Voucher"
                            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(v)}
                            title="Hapus Voucher"
                            className="flex h-8 w-8 items-center justify-center rounded-xl text-red-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* ─── Create Voucher Modal ─── */}
      {showCreateModal && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-7">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-orange-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Buat Voucher Baru
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-5 space-y-4">
              {/* Kode Promo & Diskon */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Kode Promo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase().replace(/\s/g, ''),
                      })
                    }
                    placeholder="Contoh: DISKON50"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-900 placeholder:font-normal placeholder:normal-case placeholder:tracking-normal focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Diskon (%) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={1}
                      max={99}
                      value={formData.discountPercent}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discountPercent: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <Percent className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Deskripsi */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Deskripsi Voucher (Opsional)
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Misal: Promo Gajian diskon 10% semua produk"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Cap Maksimal & Min Belanja */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Maks Diskon (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.maxDiscountAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxDiscountAmount: e.target.value,
                      })
                    }
                    placeholder="Kosongkan jika tanpa batas"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Min. Pembelian (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.minimumPurchase}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minimumPurchase: Number(e.target.value),
                      })
                    }
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Kuota Total & Limit per User */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Total Kuota Voucher *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.totalQuota}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        totalQuota: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Maks Pemakaian / User *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.usagePerUser}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        usagePerUser: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Periode Berlaku */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Mulai Berlaku *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.validFrom}
                    onChange={(e) =>
                      setFormData({ ...formData, validFrom: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Berakhir Pada *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.validUntil}
                    onChange={(e) =>
                      setFormData({ ...formData, validUntil: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Simpan Voucher'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Edit Voucher Modal ─── */}
      {showEditModal && selectedVoucher && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-7">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-orange-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Edit Voucher: {selectedVoucher.code}
                </h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-5 space-y-4">
              {/* Kode Promo (Read Only) & Diskon */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Kode Promo (Permanen)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={formData.code}
                    className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Diskon (%) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={1}
                      max={99}
                      value={formData.discountPercent}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discountPercent: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <Percent className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Deskripsi */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Deskripsi Voucher
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Cap Maksimal & Min Belanja */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Maks Diskon (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.maxDiscountAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxDiscountAmount: e.target.value,
                      })
                    }
                    placeholder="Kosongkan jika tanpa batas"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Min. Pembelian (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.minimumPurchase}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minimumPurchase: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Kuota Total & Limit per User */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Total Kuota (Min: {selectedVoucher.usedCount} terpakai)
                  </label>
                  <input
                    type="number"
                    required
                    min={selectedVoucher.usedCount}
                    value={formData.totalQuota}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        totalQuota: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Maks Pemakaian / User
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.usagePerUser}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        usagePerUser: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Periode Berlaku */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Mulai Berlaku
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.validFrom}
                    onChange={(e) =>
                      setFormData({ ...formData, validFrom: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Berakhir Pada
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.validUntil}
                    onChange={(e) =>
                      setFormData({ ...formData, validUntil: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Status Active Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveEdit"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400"
                />
                <label
                  htmlFor="isActiveEdit"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Aktifkan voucher ini
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Perbarui Voucher'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Detail Pemakaian Modal ─── */}
      {showDetailModal && selectedVoucher && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-7">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-black text-slate-900 dark:text-white">
                    {selectedVoucher.code}
                  </span>
                  <span className="rounded-md bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-800 dark:bg-orange-950/60 dark:text-orange-300">
                    {selectedVoucher.discountPercent}% OFF
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
                  Riwayat pemakaian voucher oleh pelanggan
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 max-h-[60vh] overflow-y-auto">
              {loadingDetail ? (
                <div className="flex min-h-[200px] items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                </div>
              ) : !detailData?.usages || detailData.usages.length === 0 ? (
                <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
                  <Users className="h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Belum ada riwayat pemakaian untuk voucher ini.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {detailData.usages.map((usage) => (
                    <div
                      key={usage.id}
                      className="flex items-center justify-between py-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {usage.user?.name || 'Customer'}{' '}
                          <span className="font-normal text-slate-400">
                            ({usage.user?.email})
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Order #{usage.order?.orderNumber} •{' '}
                          {new Date(usage.usedAt).toLocaleString('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          - Rp {usage.discountApplied.toLocaleString('id-ID')}
                        </span>
                        <p className="text-[10px] text-slate-400">
                          Total Order: Rp{' '}
                          {usage.order?.total?.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ─── */}
      {showDeleteModal && selectedVoucher && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="mt-4 text-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Hapus Voucher {selectedVoucher.code}?
              </h3>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {selectedVoucher.usedCount > 0
                  ? `Voucher ini sudah dipakai sebanyak ${selectedVoucher.usedCount} kali. Voucher yang sudah memiliki riwayat pemakaian tidak dapat dihapus, hanya dapat dinonaktifkan.`
                  : 'Voucher ini akan dihapus permanen dari sistem.'}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              {selectedVoucher.usedCount > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    handleToggleActive(selectedVoucher)
                    setShowDeleteModal(false)
                  }}
                  className="rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-amber-700"
                >
                  Nonaktifkan Voucher
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleDeleteSubmit}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Hapus Permanen'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
