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
    const inProgress = complaints.filter((c) => c.status === 'IN_PROGRESS').length
    const resolved = complaints.filter((c) => c.status === 'RESOLVED').length
    const rejected = complaints.filter((c) => c.status === 'REJECTED').length
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 100

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
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* 1. 4 Metric Cards (Bento Grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Total Klaim */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-4.5 sm:p-5 shadow-2xs hover:border-slate-300/80 hover:shadow-xs transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Total Klaim
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100/80 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white tabular-nums">
              {counts.all}
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Garansi 30H
            </span>
          </div>
        </div>

        {/* Card 2: Perlu Ditangani */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-4.5 sm:p-5 shadow-2xs hover:border-slate-300/80 hover:shadow-xs transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Perlu Tindakan
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className={`text-2xl sm:text-3xl font-black tracking-tight tabular-nums ${
              counts.open > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-950 dark:text-white'
            }`}>
              {counts.open}
            </span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              counts.open > 0
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              {counts.open > 0 ? 'Perlu Respon' : 'Tertangani'}
            </span>
          </div>
        </div>

        {/* Card 3: Sedang Diproses */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-4.5 sm:p-5 shadow-2xs hover:border-slate-300/80 hover:shadow-xs transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Dalam Proses
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className={`text-2xl sm:text-3xl font-black tracking-tight tabular-nums ${
              counts.inProgress > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-950 dark:text-white'
            }`}>
              {counts.inProgress}
            </span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              counts.inProgress > 0
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              {counts.inProgress > 0 ? 'Uji Teknisi' : 'Antrean 0'}
            </span>
          </div>
        </div>

        {/* Card 4: Selesai / Tingkat Resolusi */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-4.5 sm:p-5 shadow-2xs hover:border-slate-300/80 hover:shadow-xs transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Garansi Sukses
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
              {counts.resolved}
            </span>
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
              {counts.resolutionRate}% Sukses
            </span>
          </div>
        </div>
      </div>

      {/* 2. Unified Control Panel (Toolbar Filter & Search) */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-2.5 sm:p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        
        {/* Left: Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100/80 rounded-2xl dark:bg-slate-800/80 no-scrollbar">
          {[
            { id: 'ALL', label: `Semua (${counts.all})` },
            { id: 'OPEN', label: `Perlu Ditangani (${counts.open})` },
            { id: 'IN_PROGRESS', label: `Sedang Ditangani (${counts.inProgress})` },
            { id: 'RESOLVED', label: `Selesai (${counts.resolved})` },
            { id: 'REJECTED', label: `Ditolak (${counts.rejected})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                filterStatus === tab.id
                  ? 'bg-white text-slate-950 shadow-xs dark:bg-slate-900 dark:text-white'
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
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-xs font-medium outline-none transition focus:bg-white focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition shrink-0"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
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
            className="rounded-3xl border border-slate-200/80 bg-white p-16 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800">
              <ShieldCheck className="h-7 w-7 text-slate-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Tidak ada tiket klaim garansi
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchQuery
                  ? `Tidak ada hasil yang sesuai dengan "${searchQuery}"`
                  : 'Belum ada tiket klaim garansi 30 hari pada kategori status ini.'}
              </p>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 inline-flex items-center gap-1.5 rounded-2xl bg-slate-950 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 dark:bg-white dark:text-slate-950"
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
                  className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-200 dark:border-slate-800 dark:bg-slate-900"
                >
                  {/* Card Header Bar (Single-surface clean layout) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 border border-orange-100/80 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900/60 shrink-0">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() =>
                              copyToClipboard(
                                complaint.order?.orderNumber || complaint.id,
                                complaint.id
                              )
                            }
                            className="inline-flex items-center gap-1 font-mono text-xs font-bold text-slate-950 dark:text-white hover:text-orange-600 transition group"
                            title="Salin Nomor Order"
                          >
                            <span>#{complaint.order?.orderNumber}</span>
                            {copiedId === complaint.id ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3 text-slate-400 group-hover:text-orange-500 opacity-60" />
                            )}
                          </button>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                            <Smartphone className="h-3 w-3 text-slate-500" />
                            <span className="truncate max-w-[220px] sm:max-w-xs">{itemName}</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">
                          Diajukan pada {formatDate(complaint.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${statusInfo.badgeClass}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dotClass}`} />
                        <span>{statusInfo.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* 2-Column Bento Layout (Eliminating boxed-in-boxes clutter) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5">
                    
                    {/* Left Column (7.5 cols): Kendala, Galeri Foto, & Resolusi */}
                    <div className="lg:col-span-7 space-y-4">
                      
                      {/* Subject & Description */}
                      <div className="space-y-2">
                        <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-950 dark:text-white leading-snug">
                          {complaint.subject}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                          {complaint.description}
                        </p>
                      </div>

                      {/* Evidence Media (Interactive Photo & Video Gallery) */}
                      {complaint.images && complaint.images.length > 0 && (
                        <div className="pt-2 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <h4 className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                              <ImageIcon className="h-3.5 w-3.5 text-blue-500" />
                              <span>Bukti Foto & Video Kerusakan ({complaint.images.length})</span>
                            </h4>
                            <span className="text-[11px] text-slate-400">Klik media untuk perbesar / putar</span>
                          </div>
                          
                          <div className="flex gap-3 overflow-x-auto pb-1.5 no-scrollbar">
                            {complaint.images.map((img, idx) => {
                              const isVideo = isVideoUrl(img)
                              return (
                                <button
                                  key={idx}
                                  onClick={() => openLightbox(complaint.images, idx, complaint.subject)}
                                  className="group relative h-20 w-20 sm:h-22 sm:w-22 shrink-0 overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-100 shadow-2xs hover:border-slate-900 dark:border-slate-800 dark:bg-slate-800 transition-all duration-200 cursor-pointer"
                                >
                                  {isVideo ? (
                                    <div className="relative h-full w-full bg-black flex items-center justify-center">
                                      <video
                                        src={img}
                                        preload="metadata"
                                        className="h-full w-full object-cover opacity-80"
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white shadow-sm group-hover:scale-110 transition-transform">
                                          <Play className="h-3.5 w-3.5 fill-white ml-0.5" />
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <img
                                      src={img}
                                      alt={`Bukti ${idx + 1}`}
                                      className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                  )}
                                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/0 group-hover:bg-slate-950/40 backdrop-blur-[2px] transition-all duration-200">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-sm opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-75 transition-all duration-200">
                                      <ZoomIn className="h-3.5 w-3.5" />
                                    </div>
                                  </div>
                                  <span className="absolute bottom-1 right-1 rounded-md bg-slate-950/70 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs">
                                    {isVideo ? '🎥 Video' : `${idx + 1}/${complaint.images.length}`}
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Resolution Summary Banner (If RESOLVED) */}
                      {complaint.resolution && (
                        <div className="mt-4 rounded-2xl bg-slate-50/90 border border-slate-100 p-4 space-y-2.5 dark:bg-slate-800/40 dark:border-slate-800">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              <span>Hasil Resolusi Garansi</span>
                            </div>
                            {complaint.resolvedAt && (
                              <span className="text-[11px] text-slate-400 font-medium tabular-nums">
                                Diselesaikan: {formatDate(complaint.resolvedAt)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                            {complaint.resolution}
                          </p>
                        </div>
                      )}

                      {/* Rejection Note Banner (If REJECTED) */}
                      {complaint.rejectionNote && (
                        <div className="mt-4 rounded-2xl bg-slate-50/90 border border-slate-100 p-4 space-y-2.5 dark:bg-slate-800/40 dark:border-slate-800">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 border border-rose-200/80 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/80">
                              <XCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                              <span>Alasan Penolakan Klaim</span>
                            </div>
                          </div>
                          <p className="text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                            {complaint.rejectionNote}
                          </p>
                        </div>
                      )}

                      {/* Action Form: Mulai Tangani (OPEN) */}
                      {complaint.status === 'OPEN' && (
                        <div className="pt-3">
                          <button
                            onClick={() => handleTakeComplaint(complaint.id)}
                            disabled={actionLoading && activeActionId === complaint.id}
                            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 active:scale-95 transition disabled:opacity-50 dark:bg-white dark:text-slate-950"
                          >
                            {actionLoading && activeActionId === complaint.id ? (
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
                        <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/40 p-4.5 space-y-3.5 dark:border-blue-900/60 dark:bg-blue-950/20">
                          {!showRejectForm ? (
                            <div className="space-y-3">
                              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                                Langkah Penyelesaian & Unit Pengganti:
                              </label>
                              <textarea
                                value={resolution}
                                onChange={(e) => setResolution(e.target.value)}
                                placeholder="misal: Unit telah diperiksa di counter toko Roxy Mas, kendala LCD terverifikasi dan unit pengganti baru (iPhone 15 Pro) telah diserahkan ke pembeli..."
                                rows={2}
                                className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs font-medium outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white leading-relaxed"
                              />
                              <div className="flex items-center gap-2 flex-wrap pt-1">
                                <button
                                  onClick={() => handleResolve(complaint.id)}
                                  disabled={
                                    (actionLoading && activeActionId === complaint.id) ||
                                    !resolution.trim()
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition disabled:opacity-50"
                                >
                                  {actionLoading && activeActionId === complaint.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  )}
                                  <span>Setujui & Selesaikan Klaim</span>
                                </button>
                                <button
                                  onClick={() => setShowRejectForm(true)}
                                  className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition dark:border-rose-800 dark:bg-slate-900"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  <span>Tolak Klaim</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-xs font-bold text-rose-800 dark:text-rose-300">
                                <AlertTriangle className="h-4 w-4" />
                                <span>Alasan Penolakan Klaim (Wajib Diisi):</span>
                              </div>
                              <textarea
                                value={rejectionNote}
                                onChange={(e) => setRejectionNote(e.target.value)}
                                placeholder="misal: Kerusakan disebabkan layar retak akibat benturan keras / terkena air (tidak termasuk dalam cakupan garansi 30 hari)..."
                                rows={2}
                                className="w-full rounded-2xl border border-rose-200 bg-white p-3 text-xs font-medium outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 dark:border-rose-800 dark:bg-slate-800 dark:text-white leading-relaxed"
                              />
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  onClick={() => handleReject(complaint.id)}
                                  disabled={
                                    (actionLoading && activeActionId === complaint.id) ||
                                    !rejectionNote.trim()
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 active:scale-95 transition disabled:opacity-50"
                                >
                                  {actionLoading && activeActionId === complaint.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <XCircle className="h-3.5 w-3.5" />
                                  )}
                                  <span>Konfirmasi Penolakan</span>
                                </button>
                                <button
                                  onClick={() => setShowRejectForm(false)}
                                  className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                                >
                                  Batal
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                    </div>

                    {/* Right Column (4.5 cols): Profil Customer & Detail Transaksi */}
                    <div className="lg:col-span-5 space-y-4 lg:border-l lg:border-slate-100 lg:pl-6 dark:lg:border-slate-800/80">
                      
                      {/* Customer Info */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Data Pembeli
                          </span>
                          <User className="h-3.5 w-3.5 text-slate-400" />
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 font-black text-sm border border-blue-100 dark:bg-blue-950/60 dark:text-blue-300 shrink-0">
                            {(complaint.user?.name || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-950 dark:text-white text-xs truncate">
                              {complaint.user?.name || 'Customer'}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {complaint.user?.email}
                            </p>
                          </div>
                        </div>

                        {complaint.user?.phone && (
                          <a
                            href={`https://wa.me/${complaint.user.phone.replace(/[^0-9]/g, '')}?text=Halo%20${encodeURIComponent(complaint.user.name || 'Kak')},%20terkait%20klaim%20garansi%20pesanan%20${complaint.order?.orderNumber}...`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1.5 w-full rounded-2xl border border-emerald-200/90 bg-emerald-50 py-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                          >
                            <Phone className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Hubungi via WhatsApp</span>
                            <ExternalLink className="h-3 w-3 opacity-60 ml-0.5" />
                          </a>
                        )}
                      </div>

                      {/* Transaction Summary */}
                      <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Rincian Transaksi
                          </span>
                          <Package className="h-3.5 w-3.5 text-orange-500" />
                        </div>

                        <div className="space-y-1">
                          <p className="font-bold text-slate-900 dark:text-white text-xs truncate">
                            {itemName}
                          </p>
                          <p className="text-xs text-orange-600 dark:text-orange-400 font-black tabular-nums">
                            Total Tagihan: Rp {(complaint.order?.total || 0).toLocaleString('id-ID')}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Proteksi Garansi:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            30 Hari Tukar Unit
                          </span>
                        </div>

                        {complaint.assignedTo && (
                          <div className="pt-1.5 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Penanggung Jawab:</span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {isAssignedToMe ? 'Anda (Admin)' : complaint.assignedTo.name}
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
      {mounted && showLightbox && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex flex-col items-center justify-between bg-white/45 backdrop-blur-xl p-4 sm:p-6 select-none cursor-pointer"
            onClick={closeLightbox}
          >
            {/* Top spacing spacer */}
            <div className="h-2 sm:h-4" />

            {/* Middle Main Image Stage (Clicking outside the image directly closes the modal) */}
            <div className="relative flex-1 w-full flex items-center justify-center my-auto px-2 sm:px-14">
              {/* Prev Button (Minimalist Clean Black Circle) */}
              {lightboxImages.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    prevImage()
                  }}
                  title="Foto Sebelumnya (←)"
                  className="absolute left-2 sm:left-6 z-30 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-black/80 hover:bg-black text-white backdrop-blur-md shadow-md hover:scale-105 active:scale-95 transition cursor-pointer"
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
                  className="relative max-h-[68vh] sm:max-h-[72vh] max-w-[90vw] sm:max-w-[80vw] overflow-hidden rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 bg-black/90 flex items-center justify-center cursor-default ring-1 ring-black/5"
                >
                  {isVideoUrl(lightboxImages[lightboxIndex]) ? (
                    <video
                      src={lightboxImages[lightboxIndex]}
                      controls
                      autoPlay
                      playsInline
                      className="max-h-[68vh] sm:max-h-[72vh] w-auto max-w-full rounded-2xl sm:rounded-3xl object-contain shadow-2xl"
                    />
                  ) : (
                    <img
                      src={lightboxImages[lightboxIndex]}
                      alt={`Bukti ${lightboxIndex + 1}`}
                      className="max-h-[68vh] sm:max-h-[72vh] w-auto max-w-full object-contain rounded-2xl sm:rounded-3xl select-none"
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
                  className="absolute right-2 sm:right-6 z-30 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-black/80 hover:bg-black text-white backdrop-blur-md shadow-md hover:scale-105 active:scale-95 transition cursor-pointer"
                >
                  <ChevronRight className="h-5 w-5 stroke-[2] text-white" />
                </button>
              )}
            </div>

            {/* Bottom Bar: Filmstrip Thumbnails & Keyboard Shortcuts */}
            <div
              className="w-full max-w-2xl flex flex-col items-center gap-2.5 z-20 cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Filmstrip Carousel if multiple images */}
              {lightboxImages.length > 1 && (
                <div className="flex items-center gap-2.5 p-1.5 rounded-2xl bg-white/80 border border-slate-200/80 backdrop-blur-xl shadow-lg overflow-x-auto no-scrollbar">
                  {lightboxImages.map((img, idx) => {
                    const isVideo = isVideoUrl(img)
                    return (
                      <button
                        key={idx}
                        onClick={() => setLightboxIndex(idx)}
                        className={`relative h-12 w-12 sm:h-14 sm:w-14 shrink-0 overflow-hidden rounded-xl transition-all duration-200 cursor-pointer ${
                          lightboxIndex === idx
                            ? 'ring-2 ring-orange-500 scale-105 opacity-100 shadow-md'
                            : 'opacity-50 hover:opacity-100 ring-1 ring-slate-200'
                        }`}
                      >
                        {isVideo ? (
                          <div className="relative h-full w-full bg-black flex items-center justify-center">
                            <video src={img} className="h-full w-full object-cover opacity-70" />
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
              <p className="text-[11px] font-medium text-slate-500 tracking-wide text-center">
                Klik di luar gambar atau tekan <span className="text-slate-900 font-bold">ESC</span> untuk menutup • Gunakan panah <span className="text-slate-900 font-bold">◄ ►</span> untuk beralih
              </p>
            </div>

          </motion.div>
        </AnimatePresence>,
        document.body
      )}

    </div>
  )
}
