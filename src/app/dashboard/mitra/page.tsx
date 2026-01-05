'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Eye,
  Star,
  MessageSquare,
  Phone,
  Edit3,
  Award,
  Settings,
  LogOut,
  Zap,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

interface MitraAnalytics {
  profileViews: number
  totalReviews: number
  averageRating: number
  inquiries: number
  servicesCount: number
  imagesCount: number
  profileCompletion: number
  recentReviews: Array<{
    id: string
    rating: number
    comment?: string
    createdAt: string
    userName: string
  }>
}

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100, damping: 12 },
  },
}

// Stat Card Component (matching teknisi dashboard style)
const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color: 'indigo' | 'emerald' | 'amber' | 'rose'
  trend?: string
}) => {
  const gradients = {
    indigo:
      'from-indigo-500/10 to-blue-500/5 border-indigo-200/50 text-indigo-600',
    emerald:
      'from-emerald-500/10 to-teal-500/5 border-emerald-200/50 text-emerald-600',
    amber:
      'from-amber-500/10 to-orange-500/5 border-amber-200/50 text-amber-600',
    rose: 'from-rose-500/10 to-pink-500/5 border-rose-200/50 text-rose-600',
  }

  const iconBg = {
    indigo: 'bg-indigo-100 text-indigo-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    rose: 'bg-rose-100 text-rose-600',
  }

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -5, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }}
      className={`relative overflow-hidden rounded-3xl border bg-gradient-to-br p-6 backdrop-blur-sm transition-all ${gradients[color]}`}
    >
      <div className="flex items-start justify-between">
        <div className="relative z-10">
          <p className="text-sm font-semibold text-gray-500/90">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-3xl font-bold tracking-tight text-gray-900">
              {value}
            </h3>
          </div>
          {subtitle && (
            <p className="mt-1 text-sm font-medium text-gray-500/80">
              {subtitle}
            </p>
          )}
          {trend && (
            <div
              className={`mt-3 flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${color === 'emerald' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}
            >
              <TrendingUp className="h-3 w-3" />
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div
          className={`relative z-10 rounded-2xl p-3.5 shadow-sm transition-transform duration-300 group-hover:scale-110 ${iconBg[color]}`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>

      {/* Decorative blurred circles */}
      <div
        className={`absolute -right-6 -top-6 h-32 w-32 rounded-full opacity-20 blur-3xl ${color === 'indigo' ? 'bg-indigo-400' : color === 'emerald' ? 'bg-emerald-400' : color === 'amber' ? 'bg-amber-400' : 'bg-rose-400'}`}
      />
    </motion.div>
  )
}

// Reviews List with Pagination Component
const ReviewsList = ({
  reviews,
}: {
  reviews: Array<{
    id: string
    rating: number
    comment?: string
    createdAt: string
    userName: string
  }>
}) => {
  const [currentPage, setCurrentPage] = useState(1)
  const reviewsPerPage = 5
  const totalPages = Math.ceil(reviews.length / reviewsPerPage)

  // Get current page reviews
  const startIndex = (currentPage - 1) * reviewsPerPage
  const endIndex = startIndex + reviewsPerPage
  const currentReviews = reviews.slice(startIndex, endIndex)

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(
          1,
          '...',
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        )
      } else {
        pages.push(
          1,
          '...',
          currentPage - 1,
          currentPage,
          currentPage + 1,
          '...',
          totalPages
        )
      }
    }
    return pages
  }

  if (reviews.length === 0) {
    return (
      <div className="space-y-4 p-8 pt-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-16 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
            <MessageSquare className="h-8 w-8 text-indigo-400" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-gray-900">
            Belum ada ulasan
          </h3>
          <p className="mx-auto mt-2 max-w-xs text-gray-500">
            Ulasan dari pelanggan akan muncul di sini.
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="p-8 pt-6">
      {/* Reviews List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {currentReviews.map((review, i) => (
            <motion.div
              key={review.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: i * 0.05 }}
              className="group relative flex flex-col gap-4 rounded-3xl border border-gray-100 bg-white p-5 transition-all hover:border-indigo-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">{review.userName}</h3>
                  <p className="text-xs text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-700">
                {review.comment || 'Tidak ada komentar'}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {/* Previous Button */}
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:bg-white disabled:hover:text-gray-500"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, idx) => (
              <button
                key={idx}
                onClick={() => typeof page === 'number' && setCurrentPage(page)}
                disabled={page === '...'}
                className={`flex h-10 min-w-[40px] items-center justify-center rounded-xl px-3 text-sm font-semibold transition-all ${
                  page === currentPage
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-200'
                    : page === '...'
                      ? 'cursor-default text-gray-400'
                      : 'border border-gray-200 bg-white text-gray-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:bg-white disabled:hover:text-gray-500"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Page Info */}
      {totalPages > 1 && (
        <p className="mt-4 text-center text-sm text-gray-500">
          Menampilkan {startIndex + 1}-{Math.min(endIndex, reviews.length)} dari{' '}
          {reviews.length} ulasan
        </p>
      )}
    </div>
  )
}

const SkeletonLoader = () => (
  <div className="container mx-auto max-w-7xl space-y-8 p-6">
    <div className="flex animate-pulse gap-6">
      <div className="h-24 w-24 rounded-full bg-gray-200"></div>
      <div className="w-full space-y-4 pt-4">
        <div className="h-8 w-1/3 rounded-lg bg-gray-200"></div>
        <div className="h-4 w-1/4 rounded bg-gray-200"></div>
      </div>
    </div>
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-40 animate-pulse rounded-3xl bg-gray-200"
        ></div>
      ))}
    </div>
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="h-96 animate-pulse rounded-3xl bg-gray-200 lg:col-span-2"></div>
      <div className="h-96 animate-pulse rounded-3xl bg-gray-200"></div>
    </div>
  </div>
)

const Header = ({
  user,
}: {
  user: { name: string | null; email: string | null; image: string | null }
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 11) return 'Selamat Pagi'
    if (hour < 15) return 'Selamat Siang'
    if (hour < 18) return 'Selamat Sore'
    return 'Selamat Malam'
  }

  return (
    <motion.div
      variants={itemVariants}
      className="mb-12 hidden flex-col justify-between gap-6 md:flex md:flex-row md:items-end"
    >
      <div className="flex items-center gap-6">
        <div className="group relative">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border-[3px] border-white shadow-xl transition-transform hover:scale-105">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name || 'Mitra'}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600 text-3xl font-bold text-white">
                {user.name?.charAt(0) || 'M'}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block rounded-full bg-white/60 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-indigo-600 backdrop-blur-md">
              Mitra Dashboard
            </span>
          </div>
          <h1 className="mt-1 text-4xl font-extrabold tracking-tight text-gray-900 drop-shadow-sm">
            {getGreeting()},{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              {user.name?.split(' ')[0]}
            </span>
            !
          </h1>
          <p className="flex items-center gap-2 text-lg text-gray-600">
            Semoga harimu produktif dan menyenangkan.{' '}
            <Zap className="h-4 w-4 fill-amber-500 text-amber-500" />
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Link href="/dashboard/mitra/settings">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white/80 px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm backdrop-blur-sm transition-all hover:border-gray-300 hover:bg-white hover:shadow-md"
          >
            <Settings className="h-4 w-4" />
            Pengaturan
          </motion.button>
        </Link>
        <Link href="/dashboard/mitra/profile/edit">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-900/20 transition-all hover:bg-gray-800 hover:shadow-xl"
          >
            <Edit3 className="h-4 w-4" />
            Edit Profil
          </motion.button>
        </Link>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/80 px-5 py-3 text-sm font-semibold text-rose-600 shadow-sm backdrop-blur-sm transition-all hover:border-rose-300 hover:bg-rose-100 hover:shadow-md"
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </motion.button>
      </div>
    </motion.div>
  )
}

export default function MitraDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<MitraAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasProfile, setHasProfile] = useState(false)
  const [mitraId, setMitraId] = useState<string>('')

  const calculateCompletion = (profile: Record<string, unknown>) => {
    let completed = 0
    const total = 10
    if (profile.businessName) completed++
    if (profile.tagline) completed++
    if (profile.description) completed++
    if (profile.address) completed++
    if (profile.city) completed++
    if (profile.phone) completed++
    if (profile.banner) completed++
    if (Array.isArray(profile.services) && profile.services.length > 0)
      completed++
    if (Array.isArray(profile.images) && profile.images.length > 0) completed++
    if (Array.isArray(profile.features) && profile.features.length > 0)
      completed++
    return Math.round((completed / total) * 100)
  }

  const fetchAnalytics = useCallback(async () => {
    try {
      // Check profile existence
      const profileResponse = await fetch('/api/mitra/profile')

      if (profileResponse.status === 404) {
        // No profile, redirect to edit
        router.push('/dashboard/mitra/profile/edit')
        return
      }

      if (profileResponse.ok) {
        setHasProfile(true)
        const profileData = await profileResponse.json()
        setMitraId(profileData.id || '')

        // Calculate analytics from profile data
        const completion = calculateCompletion(profileData)

        // Fetch real analytics
        const analyticsResponse = await fetch('/api/mitra/analytics')
        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json()

          setAnalytics({
            profileViews: analyticsData.totalViews || 0,
            totalReviews: analyticsData.totalReviews || 0,
            averageRating: analyticsData.averageRating || 0,
            inquiries: analyticsData.totalInquiries || 0,
            servicesCount: profileData.services?.length || 0,
            imagesCount: profileData.images?.length || 0,
            profileCompletion: completion,
            recentReviews: analyticsData.recentReviews || [],
          })
        } else {
          // Fallback to profile data if analytics API fails
          setAnalytics({
            profileViews: 0,
            totalReviews: profileData.totalReview || 0,
            averageRating: profileData.rating || 0,
            inquiries: 0,
            servicesCount: profileData.services?.length || 0,
            imagesCount: profileData.images?.length || 0,
            profileCompletion: completion,
            recentReviews: [],
          })
        }
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAnalytics()
    }
  }, [status, fetchAnalytics])

  // Auto-refresh analytics every 30 seconds
  useEffect(() => {
    if (!hasProfile || status !== 'authenticated') return

    const refreshAnalytics = async () => {
      try {
        const analyticsResponse = await fetch('/api/mitra/analytics')
        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json()

          setAnalytics((prev) => {
            if (!prev) return prev
            return {
              ...prev,
              profileViews: analyticsData.totalViews || 0,
              totalReviews: analyticsData.totalReviews || 0,
              averageRating: analyticsData.averageRating || 0,
              inquiries: analyticsData.totalInquiries || 0,
              recentReviews: analyticsData.recentReviews || [],
            }
          })
        }
      } catch (error) {
        console.error('Error refreshing analytics:', error)
      }
    }

    const intervalId = setInterval(refreshAnalytics, 30000)
    return () => clearInterval(intervalId)
  }, [hasProfile, status])

  // Redirect pending mitra
  useEffect(() => {
    if (session?.user?.role === 'MITRA') {
      const mitraStatus = session.user.mitraStatus
      if (mitraStatus === 'PENDING') {
        router.push('/dashboard/mitra/pending')
      }
    }
  }, [session, router])

  if (status === 'loading' || loading) {
    return <SkeletonLoader />
  }

  if (!hasProfile || !analytics) {
    return null // Will redirect to edit page
  }

  const user = session?.user || { name: null, email: null, image: null }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Abstract Background Mesh */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-blue-400/20 blur-[100px]" />
        <div className="absolute right-[-10%] top-[10%] h-[600px] w-[600px] rounded-full bg-violet-400/20 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[20%] h-[500px] w-[500px] rounded-full bg-indigo-300/20 blur-[100px]" />
      </div>

      <motion.main
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="container relative z-10 mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8"
      >
        <Header user={user} />

        {/* Stats Grid */}
        <motion.div
          variants={itemVariants}
          className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          <StatCard
            title="Total Views"
            value={analytics.profileViews}
            icon={Eye}
            color="indigo"
            trend="+12%"
          />
          <StatCard
            title="Rating Rata-rata"
            value={analytics.averageRating.toFixed(1)}
            subtitle={`Dari ${analytics.totalReviews} ulasan`}
            icon={Star}
            color="rose"
          />
          <StatCard
            title="Total Ulasan"
            value={analytics.totalReviews}
            icon={MessageSquare}
            color="emerald"
            trend="+8%"
          />
          <StatCard
            title="Inquiries"
            value={analytics.inquiries}
            icon={Phone}
            color="amber"
            trend="+15%"
          />
        </motion.div>

        {/* Bento Grid Content */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Main Column: Recent Reviews (8 cols) */}
          <motion.div
            variants={itemVariants}
            className="space-y-8 lg:col-span-8"
          >
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/60 shadow-xl shadow-indigo-100/20 backdrop-blur-xl">
              <div className="border-b border-indigo-50/50 p-8 pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Ulasan Pelanggan
                    </h2>
                    <p className="text-sm text-gray-500">
                      Lihat feedback dari pelanggan Anda
                    </p>
                  </div>
                  {analytics.recentReviews.length > 0 && (
                    <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-600">
                      {analytics.recentReviews.length} ulasan
                    </span>
                  )}
                </div>
              </div>

              {/* Reviews List Content with Pagination */}
              <ReviewsList reviews={analytics.recentReviews} />
            </div>
          </motion.div>

          {/* Right Column: Sidebar (4 cols) */}
          <motion.div
            variants={itemVariants}
            className="space-y-8 lg:col-span-4"
          >
            {/* Profile Status Card */}
            <div className="hover:shadow-3xl relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-800 p-8 text-white shadow-2xl transition-all">
              {/* Animated glow */}
              <div className="absolute -right-20 -top-20 h-64 w-64 animate-pulse rounded-full bg-white/20 blur-3xl" />

              <div className="relative z-10 mb-6 flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-widest opacity-80">
                  Status Profil
                </span>
                <div className="rounded-full bg-emerald-400/30 p-2 text-emerald-100 backdrop-blur-md">
                  <Award className="h-6 w-6" />
                </div>
              </div>

              <div className="relative z-10 mb-6 flex justify-center">
                <div className="relative h-32 w-32">
                  <svg className="h-full w-full -rotate-90 transform">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="12"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="white"
                      strokeWidth="12"
                      strokeDasharray={`${analytics.profileCompletion * 3.52} 352`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold">
                      {analytics.profileCompletion}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-indigo-100/80">Layanan</span>
                  <span className="font-semibold">
                    {analytics.servicesCount} layanan
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-indigo-100/80">Foto Galeri</span>
                  <span className="font-semibold">
                    {analytics.imagesCount} foto
                  </span>
                </div>
              </div>

              <Link href="/dashboard/mitra/profile/edit">
                <button className="mt-8 w-full rounded-2xl bg-white py-4 font-bold text-gray-900 shadow-lg transition-transform hover:scale-[1.02] active:scale-95">
                  Edit Profil Lengkap
                </button>
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col rounded-[2.5rem] border border-white/60 bg-white/60 p-8 shadow-xl shadow-indigo-100/10 backdrop-blur-xl">
              <h3 className="mb-6 text-lg font-bold text-gray-900">
                Aksi Cepat
              </h3>
              <div className="flex-1 space-y-4">
                <Link
                  href={mitraId ? `/rekomendasi/${mitraId}` : '/rekomendasi'}
                  className="group flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:border-indigo-100 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-indigo-100 p-2">
                      <Eye className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 transition-colors group-hover:text-indigo-600">
                        Lihat Profil Publik
                      </p>
                      <p className="text-xs text-gray-500">
                        Preview profil Anda
                      </p>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/dashboard/mitra/settings"
                  className="group flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:border-indigo-100 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-100 p-2">
                      <Settings className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 transition-colors group-hover:text-emerald-600">
                        Pengaturan Akun
                      </p>
                      <p className="text-xs text-gray-500">Kelola akun Anda</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.main>
    </div>
  )
}
