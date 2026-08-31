'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  Package,
  Image as ImageIcon,
  MessageSquare,
  Filter,
  ChevronLeft,
  ChevronRight,
  Search,
  RefreshCcw,
  Shield,
  X,
  ZoomIn,
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

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

const statusConfig = {
  ALL: {
    label: 'Semua',
    color: 'bg-gray-100 text-gray-700',
    icon: Filter,
    gradient: 'from-gray-400 to-gray-500',
    bg: 'bg-gray-50',
  },
  OPEN: {
    label: 'Baru',
    color: 'bg-amber-100 text-amber-700 ring-amber-500/20',
    icon: AlertTriangle,
    gradient: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
  },
  IN_PROGRESS: {
    label: 'Ditangani',
    color: 'bg-indigo-100 text-indigo-700 ring-indigo-500/20',
    icon: Loader2,
    gradient: 'from-indigo-500 to-purple-500',
    bg: 'bg-indigo-50',
  },
  RESOLVED: {
    label: 'Selesai',
    color: 'bg-emerald-100 text-emerald-700 ring-emerald-500/20',
    icon: CheckCircle,
    gradient: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50',
  },
  REJECTED: {
    label: 'Ditolak',
    color: 'bg-rose-100 text-rose-700 ring-rose-500/20',
    icon: XCircle,
    gradient: 'from-rose-500 to-red-500',
    bg: 'bg-rose-50',
  },
}

export default function TechnicianComplaintsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [resolution, setResolution] = useState('')
  const [rejectionNote, setRejectionNote] = useState('')
  const [activeActionId, setActiveActionId] = useState<string | null>(null)
  const [showRejectForm, setShowRejectForm] = useState(false)

  // Lightbox state
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [showLightbox, setShowLightbox] = useState(false)

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images)
    setLightboxIndex(index)
    setShowLightbox(true)
  }

  const closeLightbox = () => {
    setShowLightbox(false)
    setLightboxImages([])
    setLightboxIndex(0)
  }

  const nextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % lightboxImages.length)
  }

  const prevImage = () => {
    setLightboxIndex(
      (prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length
    )
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchComplaints()
    }
  }, [status, router])

  const fetchComplaints = async () => {
    try {
      const res = await fetch('/api/complaints')
      if (res.ok) {
        const data = await res.json()
        setComplaints(data.complaints || [])
      }
    } catch (error) {
      console.error('Error fetching complaints:', error)
      toast.error('Gagal memuat data komplain')
    } finally {
      setLoading(false)
    }
  }

  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus
      const matchesSearch =
        c.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.user.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesStatus && matchesSearch
    })
  }, [complaints, filterStatus, searchQuery])

  // Track which complaint is being viewed for each order (for navigation)
  const [complaintIndexByOrder, setComplaintIndexByOrder] = useState<
    Record<string, number>
  >({})

  // Group complaints by orderId for display
  const groupedByOrder = useMemo(() => {
    const groups: Record<string, Complaint[]> = {}
    for (const c of filteredComplaints) {
      const orderId = c.orderId
      if (!groups[orderId]) groups[orderId] = []
      groups[orderId].push(c)
    }
    // Sort each group by createdAt desc (newest first)
    for (const orderId of Object.keys(groups)) {
      groups[orderId].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    }
    return groups
  }, [filteredComplaints])

  const orderIds = Object.keys(groupedByOrder)

  const navigateComplaint = (orderId: string, direction: 'next' | 'prev') => {
    const complaints = groupedByOrder[orderId]
    const currentIndex = complaintIndexByOrder[orderId] || 0
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1
    if (newIndex < 0) newIndex = complaints.length - 1
    if (newIndex >= complaints.length) newIndex = 0
    setComplaintIndexByOrder((prev) => ({ ...prev, [orderId]: newIndex }))
  }

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
        toast.success('Komplain berhasil diambil')
        fetchComplaints()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal mengambil komplain')
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
      toast.error('Mohon isi penjelasan resolusi')
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
        toast.success('Komplain berhasil diselesaikan')
        fetchComplaints()
        setResolution('')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menyelesaikan komplain')
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
      toast.error('Mohon isi alasan penolakan')
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
        toast.success('Komplain berhasil ditolak')
        fetchComplaints()
        setRejectionNote('')
        setShowRejectForm(false)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menolak komplain')
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-indigo-50/20 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header Section */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-2"
          >
            <Link
              href="/dashboard/teknisi"
              className="group inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-indigo-600"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Kembali ke Dashboard
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Komplain Pelanggan
              <span className="ml-3 inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 align-middle text-sm font-medium text-indigo-700 shadow-sm">
                {complaints.length}
              </span>
            </h1>
            <p className="max-w-2xl text-gray-600">
              Kelola dan selesaikan keluhan pelanggan dengan cepat untuk menjaga
              kepuasan layanan.
            </p>
          </motion.div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-4">
            {Object.entries(statusConfig)
              .filter(([key]) => key !== 'ALL')
              .map(([key, config]) => {
                const count = complaints.filter((c) => c.status === key).length
                if (key === 'ALL') return null
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-100 backdrop-blur"
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${config.gradient} text-white shadow-md`}
                    >
                      <config.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        {config.label}
                      </p>
                      <p className="text-xl font-bold text-gray-900">{count}</p>
                    </div>
                  </motion.div>
                )
              })}
          </div>
        </div>

        {/* Filters & Search */}
        <div className="sticky top-0 z-10 -mx-4 border-y border-gray-200 bg-white/80 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-white/60 sm:mx-0 sm:rounded-2xl sm:border sm:shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {Object.entries(statusConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setFilterStatus(key)}
                  className={`relative inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                    filterStatus === key
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                      : 'bg-transparent text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {filterStatus === key && (
                    <motion.div
                      layoutId="activeFilter"
                      className="absolute inset-0 rounded-xl bg-indigo-600"
                      initial={false}
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {key !== 'ALL' && <config.icon className="h-4 w-4" />}
                    {config.label}
                  </span>
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari order, nama, atau subjek..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="popLayout">
          {orderIds.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white/50 p-12 text-center"
            >
              <div className="rounded-full bg-gray-100 p-6">
                <Shield className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-gray-900">
                Tidak ada komplain ditemukan
              </h3>
              <p className="mt-2 max-w-sm text-gray-500">
                {searchQuery
                  ? `Tidak ada hasil untuk pencarian "${searchQuery}"`
                  : 'Belum ada komplain yang sesuai dengan filter ini.'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Reset Pencarian
                </button>
              )}
            </motion.div>
          ) : (
            <div className="space-y-6">
              {orderIds.map((orderId) => {
                const complaintsForOrder = groupedByOrder[orderId]
                const currentIndex = complaintIndexByOrder[orderId] || 0
                const complaint = complaintsForOrder[currentIndex]
                const totalComplaints = complaintsForOrder.length

                const statusInfo = statusConfig[complaint.status]
                const StatusIcon = statusInfo.icon || AlertTriangle
                const isAssignedToMe =
                  complaint.assignedTo?.email === session?.user?.email

                return (
                  <motion.div
                    key={orderId}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-lg hover:ring-indigo-100"
                  >
                    <div className="border-b border-gray-100 bg-gray-50/50 p-6 sm:px-8">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${statusInfo.gradient} text-white shadow-sm`}
                            >
                              <StatusIcon className="h-4 w-4" />
                            </span>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusInfo.color}`}
                            >
                              {statusInfo.label}
                            </span>
                            <span className="text-xs text-gray-400">
                              {format(
                                new Date(complaint.createdAt),
                                'dd MMM yyyy, HH:mm',
                                { locale: idLocale }
                              )}
                            </span>
                            {/* Complaint Navigation */}
                            {totalComplaints > 1 && (
                              <div className="flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                                <button
                                  onClick={() =>
                                    navigateComplaint(orderId, 'prev')
                                  }
                                  className="hover:text-indigo-900"
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </button>
                                <span>
                                  {currentIndex + 1} / {totalComplaints}
                                </span>
                                <button
                                  onClick={() =>
                                    navigateComplaint(orderId, 'next')
                                  }
                                  className="hover:text-indigo-900"
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 transition-colors group-hover:text-indigo-600">
                            {complaint.subject}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>Order #{complaint.order.orderNumber}</span>
                            <span>•</span>
                            <span className="font-medium text-gray-900">
                              {complaint.order.items[0]?.service?.name ||
                                complaint.order.items[0]?.product?.name ||
                                complaint.order.items[0]?.rentalItem?.name ||
                                'Order Item'}
                            </span>
                          </div>
                        </div>

                        {/* Assigned Info */}
                        {complaint.assignedTo ? (
                          <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-2 ring-1 ring-gray-100">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 ring-2 ring-white">
                              {(complaint.assignedTo.name || 'T').charAt(0)}
                            </div>
                            <div className="text-right sm:text-left">
                              <p className="text-xs text-gray-500">
                                Ditangani oleh
                              </p>
                              <p className="text-sm font-semibold text-gray-900">
                                {isAssignedToMe
                                  ? 'Anda'
                                  : complaint.assignedTo.name}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-full bg-yellow-50 px-4 py-1.5 text-xs font-medium text-yellow-700 ring-1 ring-inset ring-yellow-600/20">
                            Belum ada yang menangani
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-8 p-6 sm:grid-cols-12 sm:px-8">
                      {/* Left Column: Complaint Details */}
                      <div className="space-y-6 sm:col-span-8">
                        <div>
                          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <MessageSquare className="h-4 w-4 text-indigo-500" />
                            Deskripsi Masalah
                          </h4>
                          <div className="rounded-2xl bg-gray-50 p-4 text-sm leading-relaxed text-gray-600 ring-1 ring-gray-100">
                            {complaint.description}
                          </div>
                        </div>

                        {complaint.images.length > 0 && (
                          <div>
                            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                              <ImageIcon className="h-4 w-4 text-indigo-500" />
                              Bukti Foto ({complaint.images.length})
                            </h4>
                            <div className="flex gap-3 overflow-x-auto pb-2">
                              {complaint.images.map((img, idx) => (
                                <button
                                  key={idx}
                                  onClick={() =>
                                    openLightbox(complaint.images, idx)
                                  }
                                  className="group/img relative aspect-square w-24 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100 shadow-sm transition-all hover:w-28 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                >
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover/img:bg-black/30">
                                    <ZoomIn className="h-6 w-6 text-white opacity-0 transition-opacity group-hover/img:opacity-100" />
                                  </div>
                                  <img
                                    src={img}
                                    alt={`Bukti ${idx + 1}`}
                                    className="h-full w-full object-cover"
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Resolution/Rejection Display */}
                        {(complaint.resolution || complaint.rejectionNote) && (
                          <div
                            className={`rounded-2xl p-4 ring-1 ring-inset ${complaint.resolution ? 'bg-emerald-50 ring-emerald-100' : 'bg-rose-50 ring-rose-100'}`}
                          >
                            <h4
                              className={`mb-1 text-sm font-bold ${complaint.resolution ? 'text-emerald-800' : 'text-rose-800'}`}
                            >
                              {complaint.resolution
                                ? 'Resolusi Akhir'
                                : 'Alasan Penolakan'}
                            </h4>
                            <p
                              className={`text-sm ${complaint.resolution ? 'text-emerald-700' : 'text-rose-700'}`}
                            >
                              {complaint.resolution || complaint.rejectionNote}
                            </p>
                            {complaint.resolvedAt && (
                              <p
                                className={`mt-2 text-xs opacity-70 ${complaint.resolution ? 'text-emerald-700' : 'text-rose-700'}`}
                              >
                                Diproses pada{' '}
                                {format(
                                  new Date(complaint.resolvedAt),
                                  'dd MMMM yyyy, HH:mm',
                                  { locale: idLocale }
                                )}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Action Area */}
                        {complaint.status === 'OPEN' && (
                          <div className="pt-2">
                            <button
                              onClick={() => handleTakeComplaint(complaint.id)}
                              disabled={
                                actionLoading && activeActionId === complaint.id
                              }
                              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-xl disabled:opacity-50 sm:w-auto"
                            >
                              {actionLoading &&
                              activeActionId === complaint.id ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : (
                                <Shield className="h-5 w-5" />
                              )}
                              Ambil Tanggung Jawab
                            </button>
                          </div>
                        )}

                        {complaint.status === 'IN_PROGRESS' &&
                          isAssignedToMe && (
                            <div className="rounded-2xl bg-indigo-50/50 p-4 ring-1 ring-indigo-100/50">
                              {!showRejectForm ? (
                                <div className="space-y-4">
                                  <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-900">
                                      Solusi & Penjelasan
                                    </label>
                                    <div className="relative">
                                      <textarea
                                        value={resolution}
                                        onChange={(e) =>
                                          setResolution(e.target.value)
                                        }
                                        placeholder="Jelaskan langkah penyelesaian yang telah dilakukan..."
                                        rows={3}
                                        className="w-full rounded-xl border border-gray-200 py-3 pl-4 pr-4 shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex gap-3">
                                    <button
                                      onClick={() =>
                                        handleResolve(complaint.id)
                                      }
                                      disabled={
                                        (actionLoading &&
                                          activeActionId === complaint.id) ||
                                        !resolution.trim()
                                      }
                                      className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white shadow-md shadow-emerald-200 transition-all hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {actionLoading &&
                                      activeActionId === complaint.id
                                        ? 'Menyimpan...'
                                        : 'Selesaikan Masalah'}
                                    </button>
                                    <button
                                      onClick={() => setShowRejectForm(true)}
                                      className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 font-semibold text-rose-600 transition-all hover:bg-rose-50"
                                    >
                                      Tolak
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  <div className="rounded-xl bg-rose-50 p-3">
                                    <p className="flex items-center gap-2 text-sm text-rose-800">
                                      <AlertTriangle className="h-4 w-4" />
                                      Anda akan menolak komplain ini. Pastikan
                                      alasan jelas.
                                    </p>
                                  </div>
                                  <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-900">
                                      Alasan Penolakan
                                    </label>
                                    <textarea
                                      value={rejectionNote}
                                      onChange={(e) =>
                                        setRejectionNote(e.target.value)
                                      }
                                      placeholder="Mengapa komplain ini tidak valid?"
                                      rows={3}
                                      className="w-full rounded-xl border border-rose-200 focus:border-rose-500 focus:ring-rose-200"
                                    />
                                  </div>
                                  <div className="flex gap-3">
                                    <button
                                      onClick={() => handleReject(complaint.id)}
                                      disabled={
                                        (actionLoading &&
                                          activeActionId === complaint.id) ||
                                        !rejectionNote.trim()
                                      }
                                      className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 font-semibold text-white shadow-md shadow-rose-200 transition-all hover:-translate-y-0.5 hover:bg-rose-700 disabled:opacity-50"
                                    >
                                      Konfirmasi Penolakan
                                    </button>
                                    <button
                                      onClick={() => setShowRejectForm(false)}
                                      className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-semibold text-gray-600 hover:bg-gray-50"
                                    >
                                      Batal
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                      </div>

                      {/* Right Column: Customer Info Card */}
                      <div className="sm:col-span-4">
                        <div className="sticky top-28 rounded-2xl bg-gray-50 p-5 ring-1 ring-gray-200">
                          <h5 className="mb-4 flex items-center gap-2 border-b border-gray-200 pb-2 font-semibold text-gray-900">
                            <User className="h-4 w-4 text-indigo-500" />
                            Informasi Customer
                          </h5>
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-600">
                                {(complaint.user.name || 'U').charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {complaint.user.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Customer
                                </p>
                              </div>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div>
                                <p className="text-xs text-gray-500">Email</p>
                                <p className="font-medium text-gray-700">
                                  {complaint.user.email}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Telepon</p>
                                <p className="font-medium text-gray-700">
                                  {complaint.user.phone || '-'}
                                </p>
                              </div>
                            </div>

                            <div className="border-t border-gray-200 pt-4">
                              <Link
                                href={`/dashboard/teknisi/orders/${complaint.orderId}`}
                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-indigo-600"
                              >
                                <Package className="h-4 w-4" />
                                Lihat Order Detail
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {showLightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={closeLightbox}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute right-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-all hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Image Counter */}
            <div className="absolute left-4 top-4 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur">
              {lightboxIndex + 1} / {lightboxImages.length}
            </div>

            {/* Previous Button */}
            {lightboxImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  prevImage()
                }}
                className="absolute left-4 top-1/2 z-10 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-all hover:scale-110 hover:bg-white/20"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
            )}

            {/* Next Button */}
            {lightboxImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  nextImage()
                }}
                className="absolute right-4 top-1/2 z-10 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-all hover:scale-110 hover:bg-white/20"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            )}

            {/* Main Image */}
            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative max-h-[85vh] max-w-[90vw] overflow-hidden rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={lightboxImages[lightboxIndex]}
                alt={`Image ${lightboxIndex + 1}`}
                className="max-h-[85vh] max-w-[90vw] object-contain"
              />
            </motion.div>

            {/* Thumbnail Strip */}
            {lightboxImages.length > 1 && (
              <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2 rounded-2xl bg-white/10 p-2 backdrop-blur">
                {lightboxImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation()
                      setLightboxIndex(idx)
                    }}
                    className={`h-14 w-14 overflow-hidden rounded-lg transition-all ${
                      idx === lightboxIndex
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-black/50'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
