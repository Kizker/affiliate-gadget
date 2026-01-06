'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Star,
  Award,
  DollarSign,
  ShoppingBag,
  Mail,
  Phone,
  MapPin,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  User,
  Clock,
  Shield,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface TechnicianDetail {
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
    address: string | null
    isActive: boolean
  }
  services: Array<{
    id: string
    name: string
    description: string | null
    category: string
    price: number
    duration: number
    isActive: boolean
  }>
  _count: {
    services: number
    orders: number
  }
}

interface Stats {
  totalOrders: number
  completedOrders: number
  totalRevenue: number
  averageRating: number
  totalReviews: number
}

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 },
  },
}

export default function TechnicianDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [technician, setTechnician] = useState<TechnicianDetail | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(
    null
  )

  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  useEffect(() => {
    if (resolvedParams) {
      fetchTechnician()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams])

  const fetchTechnician = async () => {
    if (!resolvedParams) return

    setLoading(true)
    try {
      const [techRes, statsRes] = await Promise.all([
        fetch(`/api/admin/technicians/${resolvedParams.id}`),
        fetch(`/api/admin/technicians/${resolvedParams.id}/stats`),
      ])

      if (!techRes.ok) throw new Error('Failed to fetch technician')

      const techData = await techRes.json()
      setTechnician(techData)

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error('Error fetching technician:', error)
      toast.error('Failed to load technician details')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!technician) return

    if (
      !confirm(
        `Are you sure you want to delete technician "${technician.user.name}"? This will set the user as inactive.`
      )
    ) {
      return
    }

    try {
      const res = await fetch(`/api/admin/technicians/${technician.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete')

      toast.success('Technician deleted successfully')
      router.push('/dashboard/admin/technicians')
    } catch (error) {
      console.error('Error deleting technician:', error)
      toast.error('Failed to delete technician')
    }
  }

  const handleToggleStatus = async () => {
    if (!technician) return

    try {
      const res = await fetch(`/api/admin/technicians/${technician.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !technician.isAvailable }),
      })

      if (!res.ok) throw new Error('Failed to update')

      toast.success(
        `Status updated to ${!technician.isAvailable ? 'Available' : 'Unavailable'}`
      )
      fetchTechnician()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!technician) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <User className="h-20 w-20 text-gray-300" />
        <h2 className="mt-6 text-2xl font-bold text-gray-900">
          Technician not found
        </h2>
        <Link
          href="/dashboard/admin/technicians"
          className="mt-6 rounded-full bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700"
        >
          Back to technicians
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Abstract Background Mesh */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-blue-400/20 blur-[100px]" />
        <div className="absolute right-[-10%] top-[10%] h-[600px] w-[600px] rounded-full bg-violet-400/20 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[20%] h-[500px] w-[500px] rounded-full bg-indigo-300/20 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            href="/dashboard/admin/technicians"
            className="group inline-flex items-center gap-2 rounded-full bg-white/60 px-4 py-2 text-sm font-medium text-slate-600 backdrop-blur-sm transition-all hover:bg-white hover:text-slate-900 hover:shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Technicians
          </Link>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Hero Section */}
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100"
          >
            <div className="absolute right-0 top-0 h-40 w-40 -translate-y-1/3 translate-x-1/3 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl" />

            <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
              <div className="flex flex-col gap-6 md:flex-row md:items-center">
                <div className="relative">
                  <div className="relative h-32 w-32 overflow-hidden rounded-full border-[4px] border-white shadow-2xl">
                    {technician.user.image ? (
                      <img
                        src={technician.user.image}
                        alt={technician.user.name || 'Technician'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600">
                        <User className="h-12 w-12 text-white/90" />
                      </div>
                    )}
                  </div>
                  <div
                    className={`absolute bottom-2 right-2 h-6 w-6 rounded-full border-[3px] border-white shadow-md ${
                      technician.isAvailable ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  >
                    {technician.isAvailable && (
                      <span className="absolute -inset-1 animate-ping rounded-full bg-emerald-400 opacity-75" />
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-extrabold text-slate-900">
                      {technician.user.name}
                    </h1>
                    {technician.user.isActive && (
                      <Shield className="h-5 w-5 fill-blue-500 text-blue-500" />
                    )}
                  </div>
                  <p className="font-medium text-slate-500">
                    {technician.experience} years experience •{' '}
                    {technician.user.email}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {technician.specialties.map((spec, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded-xl bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-600 ring-1 ring-inset ring-slate-200"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleToggleStatus}
                  className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-all active:scale-95 ${
                    technician.isAvailable
                      ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  }`}
                >
                  {technician.isAvailable ? (
                    <>
                      <XCircle className="h-4 w-4" /> Set Unavailable
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" /> Set Available
                    </>
                  )}
                </button>
                <Link
                  href={`/dashboard/admin/technicians/${technician.id}/edit`}
                >
                  <button className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-xl active:scale-95">
                    <Edit className="h-4 w-4" /> Edit Profile
                  </button>
                </Link>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-rose-600 ring-1 ring-inset ring-rose-100 transition-all hover:bg-rose-50 active:scale-95"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Stats Bento Grid */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {[
              {
                label: 'Total Revenue',
                value: `Rp ${((stats?.totalRevenue || 0) / 1000).toLocaleString('id-ID')}K`,
                icon: DollarSign,
                color: 'emerald',
                bg: 'bg-emerald-50',
                text: 'text-emerald-600',
              },
              {
                label: 'Total Orders',
                value: stats?.totalOrders || technician._count.orders,
                icon: ShoppingBag,
                color: 'blue',
                bg: 'bg-blue-50',
                text: 'text-blue-600',
              },
              {
                label: 'Average Rating',
                value: (stats?.averageRating || technician.rating).toFixed(1),
                icon: Star,
                color: 'amber',
                bg: 'bg-amber-50',
                text: 'text-amber-600',
              },
              {
                label: 'Total Reviews',
                value: stats?.totalReviews || technician.totalReview,
                icon: Award,
                color: 'violet',
                bg: 'bg-violet-50',
                text: 'text-violet-600',
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-lg shadow-slate-100 ring-1 ring-slate-50 transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div
                  className={`absolute right-0 top-0 -mr-4 -mt-4 h-24 w-24 rounded-full opacity-20 blur-2xl ${stat.bg.replace('50', '400')}`}
                />
                <div className="relative">
                  <div
                    className={`mb-4 inline-flex rounded-2xl p-3 ${stat.bg} ${stat.text}`}
                  >
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-500">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-3xl font-extrabold text-slate-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content Column */}
            <motion.div
              variants={itemVariants}
              className="space-y-8 lg:col-span-2"
            >
              {/* Bio Section */}
              {technician.bio && (
                <div className="rounded-3xl bg-white p-8 shadow-lg shadow-slate-100 ring-1 ring-slate-50">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
                      <User className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">
                      About {technician.user.name?.split(' ')[0]}
                    </h2>
                  </div>
                  <p className="text-lg leading-relaxed text-slate-600">
                    {technician.bio}
                  </p>
                </div>
              )}

              {/* Services Section */}
              <div className="rounded-3xl bg-white p-8 shadow-lg shadow-slate-100 ring-1 ring-slate-50">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-pink-50 p-2 text-pink-600">
                      <Zap className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Service Catalog
                    </h2>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-500">
                    {technician.services.length} Services
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {technician.services.map((service) => (
                    <div
                      key={service.id}
                      className="group flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-5 transition-all hover:border-indigo-100 hover:bg-white hover:shadow-md"
                    >
                      <div>
                        <div className="mb-2 flex items-start justify-between">
                          <h3 className="font-bold text-slate-900 transition-colors group-hover:text-indigo-600">
                            {service.name}
                          </h3>
                          <span
                            className={`h-2 w-2 rounded-full ${service.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                          />
                        </div>
                        <p className="mb-4 line-clamp-2 text-sm text-slate-500">
                          {service.description || 'No description provided.'}
                        </p>
                      </div>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-white px-2 py-1 text-xs font-semibold text-slate-500">
                          <Clock className="h-3.5 w-3.5" />
                          {service.duration} min
                        </div>
                        <p className="text-lg font-extrabold text-indigo-600">
                          Rp {service.price.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  ))}
                  {technician.services.length === 0 && (
                    <div className="col-span-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-12 text-center text-slate-400">
                      No services available yet.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Sidebar Column */}
            <motion.div variants={itemVariants} className="space-y-6">
              {/* Contact Card - Updated based on user feedback */}
              <div className="px-2">
                {' '}
                {/* Minimal padding, no card background */}
                <h2 className="mb-6 text-xl font-bold text-blue-600">
                  Contact Info
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-md hover:ring-blue-100">
                    <div className="rounded-full bg-blue-50 p-2.5 text-blue-600">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-medium text-slate-500">
                        Email Address
                      </p>
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {technician.user.email}
                      </p>
                    </div>
                  </div>

                  {technician.user.phone && (
                    <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-md hover:ring-blue-100">
                      <div className="rounded-full bg-blue-50 p-2.5 text-blue-600">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Phone Number
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {technician.user.phone}
                        </p>
                      </div>
                    </div>
                  )}

                  {technician.user.address && (
                    <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-md hover:ring-blue-100">
                      <div className="rounded-full bg-blue-50 p-2.5 text-blue-600">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Location
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {technician.user.address}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Card */}
              <div className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-100 ring-1 ring-slate-50">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">
                    Performance
                  </h2>
                  <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                    <Award className="h-5 w-5" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-600">
                        Completion Rate
                      </span>
                      <span className="font-bold text-slate-900">98%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100">
                      <div className="h-full w-[98%] rounded-full bg-emerald-500" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-600">
                        Response Time
                      </span>
                      <span className="font-bold text-slate-900">~15 min</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100">
                      <div className="h-full w-[85%] rounded-full bg-blue-500" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
