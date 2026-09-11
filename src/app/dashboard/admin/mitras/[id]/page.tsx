'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Store,
  Building2,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Copy,
  Check,
  Edit,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ShoppingBag,
  Percent,
  Calendar,
  Sparkles,
  RefreshCw,
  X,
} from 'lucide-react'
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
  isClosed?: boolean
}

interface StoreDetail {
  id: string
  businessName: string
  name?: string
  slug?: string
  companyName?: string
  taxId?: string | null
  tagline: string | null
  description?: string | null
  banner?: string | null
  logo?: string | null
  address?: string
  city: string
  province: string
  postalCode?: string | null
  latitude?: number | null
  longitude?: number | null
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
  features?: string[]
  weekdayHours?: string | null
  weekendHours?: string | null
  user?: {
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

export default function MitraDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [store, setStore] = useState<StoreDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [isProcessingAction, setIsProcessingAction] = useState(false)

  // Approve Modal State
  const [approveModalOpen, setApproveModalOpen] = useState(false)

  // Reject Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  const fetchDetail = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/mitras/${id}`)
      if (!res.ok) {
        throw new Error('Data toko atau pendaftar tidak ditemukan.')
      }
      const data = await res.json()
      setStore(data)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Gagal memuat detail toko')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  // Copy helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(label)
    toast.success(`${label} berhasil disalin ke clipboard`)
    setTimeout(() => setCopiedField(null), 2000)
  }

  // Approve applicant handler
  const handleApprove = async () => {
    if (!store) return
    const candidateId = store.user?.id || store.id
    setIsProcessingAction(true)
    try {
      const res = await fetch('/api/admin/mitras/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: candidateId,
          id: store.id,
          applicationId: store.id.replace('applicant_', ''),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyetujui pendaftaran.')
      }

      toast.success(
        data.message ||
          `Toko "${store.name || store.businessName}" berhasil disetujui!`
      )
      setApproveModalOpen(false)
      // Refresh details or redirect to newly created store
      if (data.store?.id) {
        router.push(`/dashboard/admin/mitras/${data.store.id}`)
      } else {
        fetchDetail()
      }
    } catch (err: any) {
      console.error(err)
      toast.error(
        err.message || 'Terjadi kesalahan saat menyetujui pendaftaran.'
      )
    } finally {
      setIsProcessingAction(false)
    }
  }

  // Reject applicant handler
  const handleReject = async () => {
    if (!store) return
    const candidateId = store.user?.id || store.id
    setIsProcessingAction(true)
    try {
      const res = await fetch('/api/admin/mitras/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: candidateId,
          id: store.id,
          reason: rejectReason.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menolak pendaftaran.')
      }

      toast.success(data.message || 'Pendaftaran berhasil ditolak.')
      setRejectModalOpen(false)
      setRejectReason('')
      router.push('/dashboard/admin/mitras')
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Terjadi kesalahan saat menolak pendaftaran.')
    } finally {
      setIsProcessingAction(false)
    }
  }

  // Toggle active / suspend store
  const handleToggleApproval = async () => {
    if (!store) return
    const newStatus = !store.isActive
    setIsProcessingAction(true)
    try {
      const res = await fetch(`/api/admin/mitras/${store.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: newStatus,
          isApproved: newStatus,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Gagal memperbarui status toko')
      }

      toast.success(
        newStatus
          ? `Toko "${store.name || store.businessName}" berhasil diaktifkan!`
          : `Toko "${store.name || store.businessName}" berhasil ditangguhkan.`
      )
      setStore((prev) =>
        prev ? { ...prev, isActive: newStatus, isApproved: newStatus } : null
      )
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Gagal mengupdate status toko')
    } finally {
      setIsProcessingAction(false)
    }
  }

  // Delete store
  const handleDeleteStore = async () => {
    if (!store) return
    setIsProcessingAction(true)
    try {
      const res = await fetch(`/api/admin/mitras/${store.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Gagal menghapus toko')
      }

      toast.success(
        `Toko "${store.name || store.businessName}" berhasil dihapus.`
      )
      router.push('/dashboard/admin/mitras')
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Gagal menghapus toko')
    } finally {
      setIsProcessingAction(false)
      setDeleteModalOpen(false)
    }
  }

  const isApplicant = Boolean(
    store?.source === 'pending_applicant' ||
    store?.id?.startsWith('applicant_') ||
    store?.user?.mitraStatus === 'PENDING'
  )

  const storeDisplayName = store?.name || store?.businessName || 'Cabang Toko'

  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="flex items-center gap-3">
          <div className="h-9 w-24 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="shadow-2xs rounded-3xl border border-slate-200/80 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-2">
              <div className="h-6 w-64 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-40 animate-pulse rounded bg-slate-100 dark:bg-slate-800/60" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="h-48 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800/40" />
            <div className="h-48 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800/40" />
          </div>
          <div className="space-y-6">
            <div className="h-48 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800/40" />
            <div className="h-36 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800/40" />
          </div>
        </div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 dark:bg-orange-950/40">
          <Store className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Data Toko Tidak Ditemukan
          </h2>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Data cabang toko atau pendaftar yang Anda cari tidak tersedia atau
            telah dihapus.
          </p>
        </div>
        <Link
          href="/dashboard/admin/mitras"
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 dark:bg-white dark:text-slate-950"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Daftar Toko</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-16">
      {/* ─── Breadcrumb & Navigation Bar ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/admin/mitras"
            className="shadow-2xs inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-orange-300 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-orange-700 dark:hover:text-orange-400"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Daftar Toko</span>
          </Link>
          <span className="text-xs text-slate-300 dark:text-slate-700">/</span>
          <span className="max-w-xs truncate text-xs font-bold text-slate-500 dark:text-slate-400 sm:max-w-md">
            {storeDisplayName}
          </span>
        </div>

        <button
          onClick={fetchDetail}
          className="shadow-2xs inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-white"
          title="Segarkan Data"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
          />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* ─── Applicant Review Alert Banner ──────────────────────────────────────── */}
      {isApplicant && (
        <div className="rounded-3xl border border-amber-200/90 bg-gradient-to-r from-amber-50 via-orange-50/70 to-amber-50 p-5 shadow-sm dark:border-amber-800/60 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-950/40 sm:p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-sm shadow-amber-500/25">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white sm:text-base">
                    Permohonan Pendaftaran Mitra Baru
                  </h2>
                  <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                    Menunggu Verifikasi
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  Calon mitra toko telah melengkapi data legalitas dan rekening
                  bank. Silakan periksa keabsahan informasi di bawah sebelum
                  menyetujui pembuatan akun toko resmi.
                </p>
              </div>
            </div>

            <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
              <button
                onClick={() => setRejectModalOpen(true)}
                disabled={isProcessingAction}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 sm:flex-initial"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Tolak</span>
              </button>
              <button
                onClick={() => setApproveModalOpen(true)}
                disabled={isProcessingAction}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:opacity-50 sm:flex-initial"
              >
                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>Setujui & Buat Toko</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Hero Header Profile Card ────────────────────────────────────────────── */}
      <div className="shadow-2xs rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            {/* Store Monogram / Logo */}
            <div className="h-18 w-18 flex shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-500 to-amber-500 text-2xl font-black text-white shadow-md shadow-orange-500/20 sm:h-20 sm:w-20 sm:text-3xl">
              {storeDisplayName.charAt(0).toUpperCase()}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                  {storeDisplayName}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                    isApplicant
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : store.isActive
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isApplicant
                        ? 'animate-pulse bg-amber-500'
                        : store.isActive
                          ? 'bg-emerald-500'
                          : 'bg-rose-500'
                    }`}
                  />
                  {isApplicant
                    ? 'Pengajuan Baru'
                    : store.isActive
                      ? 'Toko Aktif / Terverifikasi'
                      : 'Toko Ditangguhkan'}
                </span>

                {store.isOwnerStore && (
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                    Toko Internal Platform
                  </span>
                )}
              </div>

              <p className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">
                <span>{store.companyName || 'Badan Usaha Terdaftar'}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {store.city}, {store.province}
                </span>
                {store.createdAt && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      Terdaftar:{' '}
                      {new Date(store.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 border-t border-slate-100 pt-2 dark:border-slate-800 lg:border-t-0 lg:pt-0">
            {!isApplicant && (
              <>
                {store.slug && (
                  <Link
                    href={`/toko/${store.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <span>Web Publik</span>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                  </Link>
                )}

                <Link
                  href={`/dashboard/admin/mitras/${store.id}/edit`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition hover:bg-orange-600 active:scale-95"
                >
                  <Edit className="h-3.5 w-3.5" />
                  <span>Ubah Data</span>
                </Link>

                <button
                  onClick={handleToggleApproval}
                  disabled={isProcessingAction}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                    store.isActive
                      ? 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300'
                      : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                  }`}
                >
                  {store.isActive ? 'Tangguhkan' : 'Aktifkan'}
                </button>

                <button
                  onClick={() => setDeleteModalOpen(true)}
                  disabled={isProcessingAction}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:hover:border-rose-900 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                  title="Hapus Toko"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── Metric Badges & Snapshot Bento ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="shadow-2xs rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Platform Komisi
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {store.commissionRate ?? 2.0}%
            </span>
            <span className="text-[10px] font-semibold text-slate-400">
              per transaksi
            </span>
          </div>
        </div>

        <div className="shadow-2xs rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Total Produk Gadget
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {store._count?.products ?? 0}
            </span>
            <span className="text-[10px] font-semibold text-slate-400">
              unit katalog
            </span>
          </div>
        </div>

        <div className="shadow-2xs rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Total Pesanan Toko
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {store._count?.orders ?? store.totalSales ?? 0}
            </span>
            <span className="text-[10px] font-semibold text-slate-400">
              order diproses
            </span>
          </div>
        </div>

        <div className="shadow-2xs rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Penilaian Pembeli
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-amber-500">
              ★ {store.rating ? store.rating.toFixed(1) : '5.0'}
            </span>
            <span className="text-[10px] font-semibold text-slate-400">
              ({store.totalReview ?? 0} ulasan)
            </span>
          </div>
        </div>
      </div>

      {/* ─── Main Details Bento Grid (2 Columns) ─────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column: Legalitas & Rekening Bank */}
        <div className="space-y-6">
          {/* 1. Legalitas Badan Usaha PT & Perpajakan */}
          <div className="shadow-2xs space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Building2 className="h-4 w-4 text-orange-500" />
                Legalitas Badan Usaha PT / Toko
              </span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                {isApplicant
                  ? 'Dokumen Pendaftaran'
                  : 'Badan Hukum Terverifikasi'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
              <div>
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  Nama Badan Hukum (PT/CV)
                </span>
                <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
                  {store.companyName || '-'}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  NPWP Badan Usaha
                </span>
                <div className="mt-0.5 flex items-center gap-2">
                  <p className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                    {store.taxId || 'Tidak Dilampirkan (Opsional)'}
                  </p>
                  {store.taxId && (
                    <button
                      onClick={() => copyToClipboard(store.taxId!, 'NPWP')}
                      className="text-slate-400 transition hover:text-orange-500"
                      title="Salin NPWP"
                    >
                      {copiedField === 'NPWP' ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  Nama Akun Pemilik / PIC
                </span>
                <p className="mt-0.5 font-semibold text-slate-900 dark:text-white">
                  {store.user?.name || store.companyName || '-'}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  Email Akun Terdaftar
                </span>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <p className="truncate font-medium text-slate-900 dark:text-white">
                    {store.user?.email || store.email || '-'}
                  </p>
                </div>
              </div>

              <div className="sm:col-span-2">
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  Nomor Kontak Telepon PIC / Toko
                </span>
                <div className="mt-0.5 flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <p className="font-mono font-semibold text-slate-900 dark:text-white">
                    {store.phone || store.user?.phone || '-'}
                  </p>
                  {(store.phone || store.user?.phone) && (
                    <button
                      onClick={() =>
                        copyToClipboard(
                          store.phone || store.user?.phone || '',
                          'Nomor Telepon'
                        )
                      }
                      className="text-slate-400 transition hover:text-orange-500"
                      title="Salin Nomor Telepon"
                    >
                      {copiedField === 'Nomor Telepon' ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Rekening Bank Resmi Pencairan Dana */}
          <div className="shadow-2xs space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <CreditCard className="h-4 w-4 text-orange-500" />
                Rekening Bank Pencairan Dana Penjualan
              </span>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                Pencairan Otomatis
              </span>
            </div>

            {store.bankAccounts && store.bankAccounts.length > 0 ? (
              <div className="space-y-3">
                {store.bankAccounts.map((b, idx) => (
                  <div
                    key={b.id || idx}
                    className="dark:bg-slate-850 space-y-2.5 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {b.bankName}
                      </span>
                      {b.isPrimary && (
                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                          Rekening Utama
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 pt-1 text-xs sm:grid-cols-2">
                      <div>
                        <span className="text-[10px] font-medium text-slate-400">
                          Nomor Rekening
                        </span>
                        <div className="mt-0.5 flex items-center gap-2">
                          <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                            {b.accountNumber}
                          </p>
                          <button
                            onClick={() =>
                              copyToClipboard(b.accountNumber, 'Nomor Rekening')
                            }
                            className="text-slate-400 transition hover:text-orange-500"
                            title="Salin Nomor Rekening"
                          >
                            {copiedField === 'Nomor Rekening' ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-medium text-slate-400">
                          Atas Nama Rekening
                        </span>
                        <p className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200">
                          {b.accountName}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                Belum ada rekening bank yang dikonfigurasi.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Alamat Fisik, Jam Operasional & Layanan */}
        <div className="space-y-6">
          {/* 3. Titik Alamat Fisik & Logistik Kurir */}
          <div className="shadow-2xs space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <MapPin className="h-4 w-4 text-orange-500" />
                Alamat Fisik Cabang Toko
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Titik Kurir JNE & Gojek
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  Alamat Lengkap Cabang Toko
                </span>
                <p className="mt-1 font-semibold leading-relaxed text-slate-900 dark:text-white">
                  {store.address || 'Alamat fisik cabang toko belum diisi.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-3">
                <div>
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    Kota / Kabupaten
                  </span>
                  <p className="mt-0.5 text-xs font-bold text-slate-900 dark:text-white">
                    {store.city}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    Provinsi
                  </span>
                  <p className="mt-0.5 text-xs font-bold text-slate-900 dark:text-white">
                    {store.province}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    Kode Pos
                  </span>
                  <p className="mt-0.5 font-mono text-xs font-bold text-slate-900 dark:text-white">
                    {store.postalCode || '-'}
                  </p>
                </div>
              </div>

              {store.tagline && (
                <div className="border-t border-slate-100 pt-2 dark:border-slate-800">
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    Tagline Promosi Cabang
                  </span>
                  <p className="mt-0.5 italic text-slate-700 dark:text-slate-300">
                    "{store.tagline}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 4. Jam Buka & Layanan Toko */}
          <div className="shadow-2xs space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Clock className="h-4 w-4 text-orange-500" />
                Jam Operasional & Fasilitas
              </span>
              <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-[10px] font-bold text-orange-600 dark:bg-orange-950 dark:text-orange-400">
                Waktu Layanan
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="dark:bg-slate-850 rounded-2xl border border-slate-200/70 bg-slate-50/60 p-3.5 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Senin - Jumat
                  </span>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {store.weekdayHours || '10:00 - 21:00 WIB'}
                  </p>
                </div>

                <div className="dark:bg-slate-850 rounded-2xl border border-slate-200/70 bg-slate-50/60 p-3.5 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Sabtu - Minggu / Libur
                  </span>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {store.weekendHours || '10:00 - 21:30 WIB'}
                  </p>
                </div>
              </div>

              {/* Layanan & Keunggulan Toko */}
              <div className="pt-2">
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  Jaminan & Fasilitas Cabang
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    Garansi 30 Hari Tukar Unit
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                    <Sparkles className="h-3.5 w-3.5 text-orange-500" />
                    Servis LCD Kilat 2 Jam
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                    <Store className="h-3.5 w-3.5 text-blue-500" />
                    Ambil Langsung di Toko
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Modal Konfirmasi Setujui Mitra ────────────────────────────────────── */}
      {approveModalOpen && store && (
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
                    {storeDisplayName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!isProcessingAction) {
                    setApproveModalOpen(false)
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
                    untuk akun ({store.user?.email || store.email || '-'}).
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
              Pastikan Anda telah memeriksa kelengkapan legalitas dan rekening
              bank mitra sebelum menyetujui pendaftaran.
            </p>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setApproveModalOpen(false)}
                disabled={isProcessingAction}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={isProcessingAction}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-sm shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:opacity-50"
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

      {/* ─── Modal Penolakan Pendaftar ─────────────────────────────────────────── */}
      {rejectModalOpen && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 duration-150 animate-in fade-in">
          <div className="w-full max-w-md space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl duration-150 animate-in zoom-in-95 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/50">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Tolak Pendaftaran Toko
                  </h3>
                  <p className="text-xs text-slate-400">{storeDisplayName}</p>
                </div>
              </div>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Alasan Penolakan / Catatan Perbaikan (Opsional)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Contoh: Dokumen legalitas tidak terbaca, mohon perbarui NPWP atau lengkapi nomor rekening yang valid."
                rows={4}
                className="w-full resize-none rounded-2xl border border-slate-200/80 bg-slate-50 p-3 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-rose-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <p className="text-[11px] text-slate-400">
                Catatan ini akan tampil pada dashboard mitra pemohon untuk
                memandu mereka memperbaiki data.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={isProcessingAction}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-50"
              >
                {isProcessingAction && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                <span>Konfirmasi Tolak</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal Konfirmasi Hapus Toko ────────────────────────────────────────── */}
      {deleteModalOpen && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 duration-150 animate-in fade-in">
          <div className="w-full max-w-md space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl duration-150 animate-in zoom-in-95 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/50">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Hapus Cabang Toko?
                  </h3>
                  <p className="text-xs text-slate-400">
                    Tindakan ini permanen
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Apakah Anda yakin ingin menghapus cabang toko{' '}
              <strong className="text-slate-950 dark:text-white">
                {storeDisplayName}
              </strong>
              ? Seluruh data jadwal, rekening, dan profil toko ini akan dihapus
              dari platform.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteStore}
                disabled={isProcessingAction}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-50"
              >
                {isProcessingAction && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                <span>Ya, Hapus Toko</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
