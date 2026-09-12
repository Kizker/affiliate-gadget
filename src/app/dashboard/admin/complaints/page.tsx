'use client'

import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useSession } from 'next-auth/react'
import {
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  User,
  Package,
  Image as ImageIcon,
  Search,
  RotateCcw,
  ShieldCheck,
  X,
  ZoomIn,
  Phone,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Clock,
  Sparkles,
  Smartphone,
  ShieldAlert,
  Maximize2,
  Play,
  Send,
  ArrowRight,
  MessageSquare,
  Wrench,
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

const isVideoUrl = (url?: string | null) => {
  if (!url) return false
  return /\.(mp4|webm|mov|mkv|ogg|3gp)$/i.test(url)
}

interface Complaint {
  id: string
  orderId: string
  subject: string
  description: string
  images: string[]
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED'
  resolution: string | null
  rejectionNote: string | null
  createdAt: string
  resolvedAt: string | null
  order: {
    orderNumber: string
    status: string
    total: number
    technicianId: string | null
    technician?: {
      user: { name: string; email: string }
    } | null
    claimedById: string | null
    claimedBy?: { name: string; email: string } | null
    items: Array<{
      type: string
      service?: { name: string }
      product?: { name: string }
      rentalItem?: { name: string }
    }>
  }
  user: {
    name: string
    email: string
    phone: string | null
  }
  assignedTo?: {
    name: string
    email: string
  } | null
}

const statusConfig: Record<
  string,
  { label: string; badgeClass: string; dotClass: string }
> = {
  OPEN: {
    label: 'Perlu Ditangani',
    badgeClass:
      'bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/80',
    dotClass: 'bg-amber-500 animate-pulse',
  },
  IN_PROGRESS: {
    label: 'Sedang Ditangani',
    badgeClass:
      'bg-blue-50 text-blue-800 border border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/80',
    dotClass: 'bg-blue-500',
  },
  RESOLVED: {
    label: 'Garansi Selesai',
    badgeClass:
      'bg-emerald-50 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/80',
    dotClass: 'bg-emerald-500',
  },
  REJECTED: {
    label: 'Klaim Ditolak',
    badgeClass:
      'bg-rose-50 text-rose-800 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/80',
    dotClass: 'bg-rose-500',
  },
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr)
    const day = String(d.getDate()).padStart(2, '0')
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Agu',
      'Sep',
      'Okt',
      'Nov',
      'Des',
    ]
    const month = monthNames[d.getMonth()]
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${day} ${month} ${year}, ${hours}:${minutes}`
  } catch {
    return dateStr
  }
}

export default function AdminComplaintsPage() {
  const { data: session } = useSession()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [resolution, setResolution] = useState('')
  const [rejectionNote, setRejectionNote] = useState('')
  const [activeActionId, setActiveActionId] = useState<string | null>(null)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Lightbox state
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [showLightbox, setShowLightbox] = useState(false)
  const [activeItemTitle, setActiveItemTitle] = useState<string>('')

  useEffect(() => {
    setMounted(true)
  }, [])

  const openLightbox = (images: string[], index: number, title?: string) => {
    setLightboxImages(images)
    setLightboxIndex(index)
    setActiveItemTitle(title || 'Bukti Foto Kerusakan')
    setShowLightbox(true)
  }

  const closeLightbox = () => {
    setShowLightbox(false)
    setLightboxImages([])
    setLightboxIndex(0)
    setActiveItemTitle('')
  }

  const nextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % lightboxImages.length)
  }

  const prevImage = () => {
    setLightboxIndex(
      (prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length
    )
  }

  // Keyboard navigation & body scroll lock for Lightbox
  useEffect(() => {
    if (!showLightbox) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') nextImage()
      if (e.key === 'ArrowLeft') prevImage()
    }

    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [showLightbox, lightboxImages.length])

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success(`Nomor order ${text} disalin!`)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const fetchComplaints = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/complaints')
      if (res.ok) {
        const data = await res.json()
        setComplaints(data.complaints || [])
      } else {
        toast.error('Gagal memuat data klaim garansi')
      }
    } catch (error) {
      console.error('Error fetching complaints:', error)
      toast.error('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComplaints()
  }, [])

  // Filter complaints
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      // Status filter
      if (filterStatus !== 'ALL' && c.status !== filterStatus) return false

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchOrder = c.order?.orderNumber?.toLowerCase().includes(q)
        const matchSubject = c.subject?.toLowerCase().includes(q)
        const matchUser =
          c.user?.name?.toLowerCase().includes(q) ||
          c.user?.email?.toLowerCase().includes(q)
        if (!matchOrder && !matchSubject && !matchUser) return false
      }

      return true
    })
  }, [complaints, filterStatus, searchQuery])

  // Status counts for control bar & KPI metrics
  const counts = useMemo(() => {
    const total = complaints.length
    const open = complaints.filter((c) => c.status === 'OPEN').length
    const inProgress = complaints.filter(
      (c) => c.status === 'IN_PROGRESS'
    ).length
    const resolved = complaints.filter((c) => c.status === 'RESOLVED').length
    const rejected = complaints.filter((c) => c.status === 'REJECTED').length
    const resolutionRate =
      total > 0 ? Math.round((resolved / total) * 100) : 100

    return {
      all: total,
      open,
      inProgress,
      resolved,
      rejected,
      resolutionRate,
    }
  }, [complaints])

  const handleTakeComplaint = async (complaintId: string) => {
    setActionLoading(true)
    setActiveActionId(complaintId)
    try {
      const res = await fetch(`/api/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN_PROGRESS' }),
      })

      if (res.ok) {
        toast.success('Klaim garansi berhasil diambil & dalam penanganan!')
        fetchComplaints()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal mengambil klaim')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setActionLoading(false)
      setActiveActionId(null)
    }
  }

  const handleResolve = async (complaintId: string) => {
    if (!resolution.trim()) {
      toast.error('Mohon isi penjelasan resolusi ganti unit / perbaikan')
      return
    }

    setActionLoading(true)
    setActiveActionId(complaintId)
    try {
      const res = await fetch(`/api/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'RESOLVED',
          resolution,
        }),
      })

      if (res.ok) {
        toast.success('Klaim garansi 30 hari berhasil diselesaikan!')
        fetchComplaints()
        setResolution('')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menyelesaikan klaim')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setActionLoading(false)
      setActiveActionId(null)
    }
  }

  const handleReject = async (complaintId: string) => {
    if (!rejectionNote.trim()) {
      toast.error('Mohon isi alasan penolakan klaim')
      return
    }

    setActionLoading(true)
    setActiveActionId(complaintId)
    try {
      const res = await fetch(`/api/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'REJECTED',
          rejectionNote,
        }),
      })

      if (res.ok) {
        toast.success('Klaim garansi telah ditolak')
        fetchComplaints()
        setRejectionNote('')
        setShowRejectForm(false)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menolak klaim')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setActionLoading(false)
      setActiveActionId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16">
      {/* 1. 4 Metric Cards (Bento Grid) */}
      <div className="grid grid-cols-2 gap-3.5 sm:gap-4 lg:grid-cols-4">
        {/* Card 1: Total Klaim */}
        <div className="p-4.5 shadow-2xs hover:shadow-xs flex flex-col justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white transition-all duration-200 hover:border-slate-300/80 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Total Klaim
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100/80 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-black tabular-nums tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              {counts.all}
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Garansi 30H
            </span>
          </div>
        </div>

        {/* Card 2: Perlu Ditangani */}
        <div className="p-4.5 shadow-2xs hover:shadow-xs flex flex-col justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white transition-all duration-200 hover:border-slate-300/80 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Perlu Tindakan
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span
              className={`text-2xl font-black tabular-nums tracking-tight sm:text-3xl ${
                counts.open > 0
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-slate-950 dark:text-white'
              }`}
            >
              {counts.open}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                counts.open > 0
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {counts.open > 0 ? 'Perlu Respon' : 'Tertangani'}
            </span>
          </div>
        </div>

        {/* Card 3: Sedang Diproses */}
        <div className="p-4.5 shadow-2xs hover:shadow-xs flex flex-col justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white transition-all duration-200 hover:border-slate-300/80 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Dalam Proses
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span
              className={`text-2xl font-black tabular-nums tracking-tight sm:text-3xl ${
                counts.inProgress > 0
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-950 dark:text-white'
              }`}
            >
              {counts.inProgress}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                counts.inProgress > 0
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {counts.inProgress > 0 ? 'Uji Teknisi' : 'Antrean 0'}
            </span>
          </div>
        </div>

        {/* Card 4: Selesai / Tingkat Resolusi */}
        <div className="p-4.5 shadow-2xs hover:shadow-xs flex flex-col justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white transition-all duration-200 hover:border-slate-300/80 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Garansi Sukses
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-black tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400 sm:text-3xl">
              {counts.resolved}
            </span>
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
              {counts.resolutionRate}% Sukses
            </span>
          </div>
        </div>
      </div>

      {/* 2. Unified Control Panel (Toolbar Filter & Search) */}
      <div className="shadow-2xs flex flex-col items-stretch justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900 sm:p-3 xl:flex-row xl:items-center">
        {/* Left: Filter Pills */}
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto rounded-2xl bg-slate-100/80 p-1 dark:bg-slate-800/80">
          {[
            { id: 'ALL', label: `Semua (${counts.all})` },
            { id: 'OPEN', label: `Perlu Ditangani (${counts.open})` },
            {
              id: 'IN_PROGRESS',
              label: `Sedang Ditangani (${counts.inProgress})`,
            },
            { id: 'RESOLVED', label: `Selesai (${counts.resolved})` },
            { id: 'REJECTED', label: `Ditolak (${counts.rejected})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
                filterStatus === tab.id
                  ? 'shadow-xs bg-white text-slate-950 dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right: Search & Refresh */}
        <div className="flex items-center justify-end gap-2">
          <div className="relative flex-1 sm:w-72">
            <input
              type="text"
              placeholder="Cari order, customer, subjek..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-xs font-medium outline-none transition focus:border-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={fetchComplaints}
            title="Muat Ulang Data"
            disabled={loading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <RotateCcw
              className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* 3. Content Area: Bento Claim Cards (Single-surface luxury design) */}
      <AnimatePresence mode="popLayout">
        {filteredComplaints.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="shadow-xs space-y-3 rounded-3xl border border-slate-200/80 bg-white p-16 text-center dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800">
              <ShieldCheck className="h-7 w-7 text-slate-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Tidak ada tiket klaim garansi
              </p>
              <p className="mx-auto max-w-sm text-xs text-slate-400">
                {searchQuery
                  ? `Tidak ada hasil yang sesuai dengan "${searchQuery}"`
                  : 'Belum ada tiket klaim garansi 30 hari pada kategori status ini.'}
              </p>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="shadow-xs mt-2 inline-flex items-center gap-1.5 rounded-2xl bg-slate-950 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Pencarian</span>
              </button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-5">
            {filteredComplaints.map((complaint) => {
              const statusInfo =
                statusConfig[complaint.status] || statusConfig.OPEN
              const isAssignedToMe =
                complaint.assignedTo?.email === session?.user?.email
              const itemName =
                complaint.order?.items?.[0]?.product?.name ||
                complaint.order?.items?.[0]?.service?.name ||
                complaint.order?.items?.[0]?.rentalItem?.name ||
                'Unit Gadget Original'

              return (
                <motion.div
                  key={complaint.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="shadow-xs rounded-3xl border border-slate-200/80 bg-white p-6 transition-all duration-200 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 sm:p-7"
                >
                  {/* Card Header Bar (Single-surface clean layout) */}
                  <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-5 dark:border-slate-800/80 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-orange-100/80 bg-orange-50 text-orange-600 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-400">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() =>
                              copyToClipboard(
                                complaint.order?.orderNumber || complaint.id,
                                complaint.id
                              )
                            }
                            className="group inline-flex items-center gap-1 font-mono text-xs font-bold text-slate-950 transition hover:text-orange-600 dark:text-white"
                            title="Salin Nomor Order"
                          >
                            <span>#{complaint.order?.orderNumber}</span>
                            {copiedId === complaint.id ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3 text-slate-400 opacity-60 group-hover:text-orange-500" />
                            )}
                          </button>
                          <span className="text-slate-300 dark:text-slate-700">
                            •
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                            <Smartphone className="h-3 w-3 text-slate-500" />
                            <span className="max-w-[220px] truncate sm:max-w-xs">
                              {itemName}
                            </span>
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-400">
                          Diajukan pada {formatDate(complaint.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${statusInfo.badgeClass}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${statusInfo.dotClass}`}
                        />
                        <span>{statusInfo.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* 2-Column Bento Layout (Eliminating boxed-in-boxes clutter) */}
                  <div className="grid grid-cols-1 gap-6 pt-5 lg:grid-cols-12">
                    {/* Left Column (7.5 cols): Kendala, Galeri Foto, & Resolusi */}
                    <div className="space-y-4 lg:col-span-7">
                      {/* Subject & Description */}
                      <div className="space-y-2">
                        <h3 className="text-base font-bold leading-snug tracking-tight text-slate-950 dark:text-white sm:text-lg">
                          {complaint.subject}
                        </h3>
                        <p className="text-xs font-normal leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm">
                          {complaint.description}
                        </p>
                      </div>

                      {/* Evidence Media (Interactive Photo & Video Gallery) */}
                      {complaint.images && complaint.images.length > 0 && (
                        <div className="space-y-2.5 pt-2">
                          <div className="flex items-center justify-between">
                            <h4 className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                              <ImageIcon className="h-3.5 w-3.5 text-blue-500" />
                              <span>
                                Bukti Foto & Video Kerusakan (
                                {complaint.images.length})
                              </span>
                            </h4>
                            <span className="text-[11px] text-slate-400">
                              Klik media untuk perbesar / putar
                            </span>
                          </div>

                          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1.5">
                            {complaint.images.map((img, idx) => {
                              const isVideo = isVideoUrl(img)
                              return (
                                <button
                                  key={idx}
                                  onClick={() =>
                                    openLightbox(
                                      complaint.images,
                                      idx,
                                      complaint.subject
                                    )
                                  }
                                  className="sm:h-22 sm:w-22 shadow-2xs group relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-100 transition-all duration-200 hover:border-slate-900 dark:border-slate-800 dark:bg-slate-800"
                                >
                                  {isVideo ? (
                                    <div className="relative flex h-full w-full items-center justify-center bg-black">
                                      <video
                                        src={img}
                                        preload="metadata"
                                        className="h-full w-full object-cover opacity-80"
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white shadow-sm transition-transform group-hover:scale-110">
                                          <Play className="ml-0.5 h-3.5 w-3.5 fill-white" />
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <img
                                      src={img}
                                      alt={`Bukti ${idx + 1}`}
                                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                    />
                                  )}
                                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/0 backdrop-blur-[2px] transition-all duration-200 group-hover:bg-slate-950/40">
                                    <div className="flex h-7 w-7 scale-75 items-center justify-center rounded-full bg-white/90 text-slate-900 opacity-0 shadow-sm transition-all duration-200 group-hover:scale-100 group-hover:opacity-100">
                                      <ZoomIn className="h-3.5 w-3.5" />
                                    </div>
                                  </div>
                                  <span className="backdrop-blur-xs absolute bottom-1 right-1 rounded-md bg-slate-950/70 px-1.5 py-0.5 text-[9px] font-bold text-white">
                                    {isVideo
                                      ? '🎥 Video'
                                      : `${idx + 1}/${complaint.images.length}`}
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Resolution Summary Banner (If RESOLVED) */}
                      {complaint.resolution && (
                        <div className="mt-4 space-y-2.5 rounded-2xl border border-slate-100 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:border-emerald-800/80 dark:bg-emerald-950/60 dark:text-emerald-300">
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                              <span>Hasil Resolusi Garansi</span>
                            </div>
                            {complaint.resolvedAt && (
                              <span className="text-[11px] font-medium tabular-nums text-slate-400">
                                Diselesaikan: {formatDate(complaint.resolvedAt)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-medium leading-relaxed text-slate-700 dark:text-slate-300 sm:text-[13px]">
                            {complaint.resolution}
                          </p>
                        </div>
                      )}

                      {/* Rejection Note Banner (If REJECTED) */}
                      {complaint.rejectionNote && (
                        <div className="mt-4 space-y-2.5 rounded-2xl border border-slate-100 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/80 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 dark:border-rose-800/80 dark:bg-rose-950/60 dark:text-rose-300">
                              <XCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                              <span>Alasan Penolakan Klaim</span>
                            </div>
                          </div>
                          <p className="text-xs font-medium leading-relaxed text-slate-700 dark:text-slate-300 sm:text-[13px]">
                            {complaint.rejectionNote}
                          </p>
                        </div>
                      )}

                      {/* Action Form: Mulai Tangani (OPEN) */}
                      {complaint.status === 'OPEN' && (
                        <div className="pt-3">
                          <button
                            onClick={() => handleTakeComplaint(complaint.id)}
                            disabled={
                              actionLoading && activeActionId === complaint.id
                            }
                            className="shadow-xs inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95 disabled:opacity-50 dark:bg-white dark:text-slate-950"
                          >
                            {actionLoading &&
                            activeActionId === complaint.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ShieldCheck className="h-4 w-4 text-orange-400" />
                            )}
                            <span>Mulai Tangani Klaim</span>
                          </button>
                        </div>
                      )}

                      {/* Action Form: Selesaikan / Tolak (IN_PROGRESS) */}
                      {complaint.status === 'IN_PROGRESS' && (
                        <div className="shadow-xs mt-4 overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 transition-all dark:border-slate-800 dark:bg-slate-900/50 sm:p-5">
                          {!showRejectForm ? (
                            <div className="space-y-3.5">
                              {/* Header Card */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400">
                                    <Wrench className="h-3.5 w-3.5" />
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                      Langkah Penyelesaian & Unit Pengganti
                                    </h4>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                      Tuliskan solusi penggantian unit atau
                                      hasil pengecekan unit customer
                                    </p>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setShowRejectForm(true)}
                                  className="cursor-pointer text-[11px] font-semibold text-rose-600 transition hover:text-rose-700 hover:underline dark:text-rose-400"
                                >
                                  Tolak Klaim Ini?
                                </button>
                              </div>

                              {/* Quick Template Pills */}
                              <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-0.5">
                                <span className="shrink-0 text-[10.5px] font-medium text-slate-400">
                                  Template cepat:
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setResolution(
                                      'Unit fisik telah diverifikasi di cabang toko, kendala terkonfirmasi defect pabrik dan unit pengganti baru telah diserahkan langsung ke customer dengan garansi 30 hari penuh.'
                                    )
                                  }
                                  className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10.5px] font-medium text-slate-600 transition hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-emerald-950/50"
                                >
                                  🔄 Tukar Unit Baru
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setResolution(
                                      'Kendala sparepart layar LCD telah selesai diganti unit original baru dalam 2 jam servis kilat dan unit telah lulus uji quality control 100% normal.'
                                    )
                                  }
                                  className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10.5px] font-medium text-slate-600 transition hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-emerald-950/50"
                                >
                                  ⚡ Servis Kilat LCD
                                </button>
                              </div>

                              {/* Textarea Input */}
                              <div className="relative">
                                <textarea
                                  value={resolution}
                                  onChange={(e) =>
                                    setResolution(e.target.value)
                                  }
                                  placeholder="Contoh: Unit telah diperiksa di counter toko resmi, kendala hardware terverifikasi dan unit pengganti telah diserahkan ke pembeli..."
                                  rows={3}
                                  className="shadow-2xs w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-normal leading-relaxed text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                />
                              </div>

                              {/* Action Buttons */}
                              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                                <span className="text-[11px] font-medium text-slate-400">
                                  {resolution.trim().length > 0
                                    ? `${resolution.trim().length} karakter ditulis`
                                    : 'Wajib diisi sebelum menyelesaikan klaim'}
                                </span>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleResolve(complaint.id)}
                                    disabled={
                                      actionLoading &&
                                      activeActionId === complaint.id
                                    }
                                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-emerald-600/25 transition-all hover:bg-emerald-700 hover:shadow-emerald-600/35 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {actionLoading &&
                                    activeActionId === complaint.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="h-4 w-4" />
                                    )}
                                    <span>Selesaikan Klaim</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3.5">
                              {/* Reject Header */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-400">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-rose-700 dark:text-rose-400">
                                      Form Penolakan Klaim Garansi
                                    </h4>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                      Berikan alasan objektif mengapa klaim
                                      garansi tidak dapat disetujui
                                    </p>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setShowRejectForm(false)}
                                  className="cursor-pointer text-[11px] font-semibold text-slate-500 transition hover:text-slate-700 dark:text-slate-400"
                                >
                                  Kembali ke Persetujuan
                                </button>
                              </div>

                              {/* Reject Quick Template Pills */}
                              <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-0.5">
                                <span className="shrink-0 text-[10.5px] font-medium text-slate-400">
                                  Alasan umum:
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRejectionNote(
                                      'Kerusakan disebabkan oleh kelalaian penggunaan fisik (retak akibat benturan keras / kemasukan cairan) yang berada di luar cakupan garansi toko.'
                                    )
                                  }
                                  className="shrink-0 rounded-full border border-rose-200 bg-white px-2.5 py-1 text-[10.5px] font-medium text-rose-600 transition hover:bg-rose-50 dark:border-rose-900/50 dark:bg-slate-800 dark:text-rose-300"
                                >
                                  💧 Human Error / Cairan
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRejectionNote(
                                      'Segel garansi toko telah rusak atau unit telah dibongkar di luar teknisi resmi Affiliate Gadget.'
                                    )
                                  }
                                  className="shrink-0 rounded-full border border-rose-200 bg-white px-2.5 py-1 text-[10.5px] font-medium text-rose-600 transition hover:bg-rose-50 dark:border-rose-900/50 dark:bg-slate-800 dark:text-rose-300"
                                >
                                  🔒 Segel Rusak
                                </button>
                              </div>

                              {/* Textarea Input Reject */}
                              <div className="relative">
                                <textarea
                                  value={rejectionNote}
                                  onChange={(e) =>
                                    setRejectionNote(e.target.value)
                                  }
                                  placeholder="Tuliskan alasan penolakan secara jelas dan sopan kepada pembeli..."
                                  rows={3}
                                  className="shadow-2xs w-full rounded-xl border border-rose-200 bg-white p-3 text-xs font-normal leading-relaxed text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-rose-800 dark:bg-slate-900 dark:text-white"
                                />
                              </div>

                              {/* Reject Action Buttons */}
                              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                                <span className="text-[11px] font-medium text-slate-400">
                                  {rejectionNote.trim().length > 0
                                    ? `${rejectionNote.trim().length} karakter ditulis`
                                    : 'Alasan penolakan wajib diisi'}
                                </span>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setShowRejectForm(false)}
                                    className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                  >
                                    Batal
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleReject(complaint.id)}
                                    disabled={
                                      actionLoading &&
                                      activeActionId === complaint.id
                                    }
                                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-rose-600/25 transition-all hover:bg-rose-700 hover:shadow-rose-600/35 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {actionLoading &&
                                    activeActionId === complaint.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <XCircle className="h-4 w-4" />
                                    )}
                                    <span>Konfirmasi Tolak Klaim</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right Column (4.5 cols): Profil Customer & Detail Transaksi */}
                    <div className="space-y-4 lg:col-span-5 lg:border-l lg:border-slate-100 lg:pl-6 dark:lg:border-slate-800/80">
                      {/* Customer Info */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Data Pembeli
                          </span>
                          <User className="h-3.5 w-3.5 text-slate-400" />
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-sm font-black text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                            {(complaint.user?.name || 'C')
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-slate-950 dark:text-white">
                              {complaint.user?.name || 'Customer'}
                            </p>
                            <p className="truncate text-[11px] text-slate-400">
                              {complaint.user?.email}
                            </p>
                          </div>
                        </div>

                        {complaint.user?.phone && (
                          <a
                            href={`https://wa.me/${complaint.user.phone.replace(/[^0-9]/g, '')}?text=Halo%20${encodeURIComponent(complaint.user.name || 'Kak')},%20terkait%20klaim%20garansi%20pesanan%20${complaint.order?.orderNumber}...`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shadow-2xs flex w-full items-center justify-center gap-1.5 rounded-2xl border border-emerald-200/90 bg-emerald-50 py-2.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                          >
                            <Phone className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Hubungi via WhatsApp</span>
                            <ExternalLink className="ml-0.5 h-3 w-3 opacity-60" />
                          </a>
                        )}
                      </div>

                      {/* Transaction Summary */}
                      <div className="space-y-2.5 border-t border-slate-100 pt-3 dark:border-slate-800/80">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Rincian Transaksi
                          </span>
                          <Package className="h-3.5 w-3.5 text-orange-500" />
                        </div>

                        <div className="space-y-1">
                          <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                            {itemName}
                          </p>
                          <p className="text-xs font-black tabular-nums text-orange-600 dark:text-orange-400">
                            Total Tagihan: Rp{' '}
                            {(complaint.order?.total || 0).toLocaleString(
                              'id-ID'
                            )}
                          </p>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] dark:border-slate-800">
                          <span className="text-slate-400">
                            Proteksi Garansi:
                          </span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            30 Hari Tukar Unit
                          </span>
                        </div>

                        {complaint.assignedTo && (
                          <div className="flex items-center justify-between pt-1.5 text-[11px]">
                            <span className="text-slate-400">
                              Penanggung Jawab:
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {isAssignedToMe
                                ? 'Anda (Admin)'
                                : complaint.assignedTo.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </AnimatePresence>

      {/* 4. Luxury Fullscreen Portal Lightbox Modal (Escape stacking context & covers 100% viewport) */}
      {mounted &&
        showLightbox &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[99999] flex cursor-pointer select-none flex-col items-center justify-between bg-white/45 p-4 backdrop-blur-xl sm:p-6"
              onClick={closeLightbox}
            >
              {/* Top spacing spacer */}
              <div className="h-2 sm:h-4" />

              {/* Middle Main Image Stage (Clicking outside the image directly closes the modal) */}
              <div className="relative my-auto flex w-full flex-1 items-center justify-center px-2 sm:px-14">
                {/* Prev Button (Minimalist Clean Black Circle) */}
                {lightboxImages.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      prevImage()
                    }}
                    title="Foto Sebelumnya (←)"
                    className="absolute left-2 z-30 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-black/80 text-white shadow-md backdrop-blur-md transition hover:scale-105 hover:bg-black active:scale-95 sm:left-6 sm:h-11 sm:w-11"
                  >
                    <ChevronLeft className="h-5 w-5 stroke-[2] text-white" />
                  </button>
                )}

                {/* Main Media (Image/Video) Viewport */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={lightboxIndex}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative flex max-h-[68vh] max-w-[90vw] cursor-default items-center justify-center overflow-hidden rounded-2xl border border-slate-200/80 bg-black/90 shadow-2xl ring-1 ring-black/5 sm:max-h-[72vh] sm:max-w-[80vw] sm:rounded-3xl"
                  >
                    {isVideoUrl(lightboxImages[lightboxIndex]) ? (
                      <video
                        src={lightboxImages[lightboxIndex]}
                        controls
                        autoPlay
                        playsInline
                        className="max-h-[68vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl sm:max-h-[72vh] sm:rounded-3xl"
                      />
                    ) : (
                      <img
                        src={lightboxImages[lightboxIndex]}
                        alt={`Bukti ${lightboxIndex + 1}`}
                        className="max-h-[68vh] w-auto max-w-full select-none rounded-2xl object-contain sm:max-h-[72vh] sm:rounded-3xl"
                      />
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Next Button (Minimalist Clean Black Circle) */}
                {lightboxImages.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      nextImage()
                    }}
                    title="Foto Selanjutnya (→)"
                    className="absolute right-2 z-30 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-black/80 text-white shadow-md backdrop-blur-md transition hover:scale-105 hover:bg-black active:scale-95 sm:right-6 sm:h-11 sm:w-11"
                  >
                    <ChevronRight className="h-5 w-5 stroke-[2] text-white" />
                  </button>
                )}
              </div>

              {/* Bottom Bar: Filmstrip Thumbnails & Keyboard Shortcuts */}
              <div
                className="z-20 flex w-full max-w-2xl cursor-default flex-col items-center gap-2.5"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Filmstrip Carousel if multiple images */}
                {lightboxImages.length > 1 && (
                  <div className="no-scrollbar flex items-center gap-2.5 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/80 p-1.5 shadow-lg backdrop-blur-xl">
                    {lightboxImages.map((img, idx) => {
                      const isVideo = isVideoUrl(img)
                      return (
                        <button
                          key={idx}
                          onClick={() => setLightboxIndex(idx)}
                          className={`relative h-12 w-12 shrink-0 cursor-pointer overflow-hidden rounded-xl transition-all duration-200 sm:h-14 sm:w-14 ${
                            lightboxIndex === idx
                              ? 'scale-105 opacity-100 shadow-md ring-2 ring-orange-500'
                              : 'opacity-50 ring-1 ring-slate-200 hover:opacity-100'
                          }`}
                        >
                          {isVideo ? (
                            <div className="relative flex h-full w-full items-center justify-center bg-black">
                              <video
                                src={img}
                                className="h-full w-full object-cover opacity-70"
                              />
                              <Play className="absolute h-3 w-3 fill-white text-white" />
                            </div>
                          ) : (
                            <img
                              src={img}
                              alt={`Thumb ${idx + 1}`}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Keyboard Helper Text */}
                <p className="text-center text-[11px] font-medium tracking-wide text-slate-500">
                  Klik di luar gambar atau tekan{' '}
                  <span className="font-bold text-slate-900">ESC</span> untuk
                  menutup • Gunakan panah{' '}
                  <span className="font-bold text-slate-900">◄ ►</span> untuk
                  beralih
                </p>
              </div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
    </div>
  )
}
