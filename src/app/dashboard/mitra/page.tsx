'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
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
  TrendingUp,
  ExternalLink,
  type LucideIcon,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { toast } from 'sonner'

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

// Stat Card Component (matching e-commerce bento style)
const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  trend,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  variant?: 'orange' | 'emerald' | 'blue' | 'amber' | 'default'
  trend?: string
}) => {
  const iconTheme = {
    orange:
      'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400',
    emerald:
      'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
    amber:
      'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    default:
      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  }

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -3 }}
      className="shadow-2xs group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 transition-all duration-200 hover:border-orange-200 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {title}
        </span>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${iconTheme[variant]}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {value}
        </p>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
        {trend && (
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px]">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-3 w-3" />
              <span>{trend}</span>
            </span>
            <span className="text-slate-400 dark:text-slate-500">
              · Bulan ini
            </span>
          </div>
        )}
      </div>
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
      <div className="space-y-4 p-6 sm:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center dark:border-slate-800 dark:bg-slate-900/50 sm:p-16"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
            <MessageSquare className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
            Belum ada ulasan
          </h3>
          <p className="mx-auto mt-1 max-w-xs text-xs text-slate-500 dark:text-slate-400">
            Ulasan dari pelanggan akan otomatis tampil di sini setelah layanan
            selesai.
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="p-6 sm:p-8">
      {/* Reviews List */}
      <div className="space-y-3.5">
        <AnimatePresence mode="popLayout">
          {currentReviews.map((review, i) => (
            <motion.div
              key={review.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: i * 0.05 }}
              className="group relative flex flex-col gap-2.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all hover:border-orange-200 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700 sm:p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {review.userName}
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    {new Date(review.createdAt).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-0.5">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
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
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700"
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
                className={`flex h-9 min-w-[36px] items-center justify-center rounded-xl px-2.5 text-xs font-semibold transition-all ${
                  page === currentPage
                    ? 'shadow-xs bg-orange-500 text-white'
                    : page === '...'
                      ? 'cursor-default text-slate-400'
                      : 'border border-slate-200 bg-white text-slate-700 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
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
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700"
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
        <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
          Menampilkan {startIndex + 1}-{Math.min(endIndex, reviews.length)} dari{' '}
          {reviews.length} ulasan
        </p>
      )}
    </div>
  )
}

const SkeletonLoader = () => (
  <div className="container mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
    <div className="flex animate-pulse items-center gap-5">
      <div className="h-16 w-16 rounded-2xl bg-slate-200 dark:bg-slate-800 sm:h-20 sm:w-20"></div>
      <div className="w-full space-y-3">
        <div className="h-6 w-1/3 rounded-lg bg-slate-200 dark:bg-slate-800"></div>
        <div className="h-4 w-1/4 rounded bg-slate-200 dark:bg-slate-800"></div>
      </div>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
        ></div>
      ))}
    </div>
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="h-80 animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800 lg:col-span-8"></div>
      <div className="h-80 animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800 lg:col-span-4"></div>
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
      className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center"
    >
      <div className="flex items-center gap-4 sm:gap-5">
        <div className="group relative">
          <div className="shadow-xs relative h-16 w-16 overflow-hidden rounded-2xl border-2 border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 sm:h-20 sm:w-20">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name || 'Mitra'}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-500 to-amber-500 text-2xl font-black text-white sm:text-3xl">
                {user.name?.charAt(0) || 'M'}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200/80 bg-orange-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:border-orange-900/40 dark:bg-orange-950/40 dark:text-orange-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-500" />
              Mitra Servis Resmi
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {getGreeting()},{' '}
            <span className="text-orange-500">{user.name?.split(' ')[0]}</span>!
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            Kelola profil layanan, respons ulasan, dan pantau performa tokomu
            secara real-time.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        <Link href="/dashboard/mitra/settings">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="shadow-2xs inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Settings className="h-3.5 w-3.5 text-slate-500" />
            <span>Pengaturan</span>
          </motion.button>
        </Link>

        <Link href="/dashboard/mitra/profile/edit">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition hover:bg-orange-600 active:scale-95"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Edit Profil Toko</span>
          </motion.button>
        </Link>
      </div>
    </motion.div>
  )
}

export default function MitraDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<MitraAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
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

  const fetchAnalytics = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setIsRefreshing(true)
      try {
        // Check profile existence with no-store cache
        const profileResponse = await fetch('/api/mitra/profile', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        })

        if (profileResponse.status === 404) {
          const mitraStatus = (session?.user as { mitraStatus?: string })
            ?.mitraStatus
          if (session?.user?.role === 'MITRA' && mitraStatus !== 'APPROVED') {
            router.push('/dashboard/mitra/pending')
          } else {
            router.push('/dashboard/mitra/profile/edit')
          }
          return
        }

        if (profileResponse.ok) {
          setHasProfile(true)
          const profileData = await profileResponse.json()
          setMitraId(profileData.id || '')

          // Calculate analytics from profile data
          const completion = calculateCompletion(profileData)

          // Fetch real analytics with no-store cache
          const analyticsResponse = await fetch('/api/mitra/analytics', {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' },
          })

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
        if (!isSilent) setIsRefreshing(false)
      }
    },
    [router, session]
  )

  useEffect(() => {
    if (status === 'authenticated') {
      const mitraStatus = (session?.user as { mitraStatus?: string })
        ?.mitraStatus
      if (session?.user?.role === 'MITRA' && mitraStatus !== 'APPROVED') {
        router.push('/dashboard/mitra/pending')
        return
      }
      fetchAnalytics()
    }
  }, [status, session, router, fetchAnalytics])

  // Auto-refresh analytics every 10 seconds for real-time live data
  useEffect(() => {
    if (!hasProfile || status !== 'authenticated') return

    const intervalId = setInterval(() => {
      fetchAnalytics(true)
    }, 10000)

    const onFocus = () => fetchAnalytics(true)
    window.addEventListener('focus', onFocus)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('focus', onFocus)
    }
  }, [hasProfile, status, fetchAnalytics])

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
    <div className="space-y-6">
      <motion.main
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-8"
      >
        <Header user={user} />

        {/* Stats Grid */}
        <motion.div
          variants={itemVariants}
          className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4"
        >
          <StatCard
            title="Total Kunjungan Profil"
            value={analytics.profileViews}
            icon={Eye}
            variant="orange"
            trend="+12%"
          />
          <StatCard
            title="Rating Rata-rata"
            value={analytics.averageRating.toFixed(1)}
            subtitle={`Dari ${analytics.totalReviews} ulasan verified`}
            icon={Star}
            variant="amber"
          />
          <StatCard
            title="Total Ulasan"
            value={analytics.totalReviews}
            icon={MessageSquare}
            variant="emerald"
            trend="+8%"
          />
          <StatCard
            title="Pertanyaan Masuk"
            value={analytics.inquiries}
            icon={Phone}
            variant="blue"
            trend="+15%"
          />
        </motion.div>

        {/* Bento Grid Content */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Main Column: Recent Reviews (8 cols) */}
          <motion.div
            variants={itemVariants}
            className="space-y-6 lg:col-span-8"
          >
            <div className="shadow-xs rounded-3xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-100 p-6 pb-5 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
                      Ulasan Pelanggan
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      Ulasan dan feedback langsung dari pengguna jasa tokomu
                    </p>
                  </div>
                  {analytics.recentReviews.length > 0 && (
                    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                      {analytics.recentReviews.length} ulasan
                    </span>
                  )}
                </div>
              </div>

              {/* Reviews List Content with Pagination */}
              <ReviewsList reviews={analytics.recentReviews} />
            </div>
          </motion.div>

          {/* Right Column: Profile Status Card (4 cols) */}
          <motion.div
            variants={itemVariants}
            className="space-y-6 lg:col-span-4"
          >
            {/* Profile Status Card - High Contrast Clean Bento Style */}
            <div className="shadow-xs relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Tingkat Kelengkapan
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Status Profil Toko
                  </h3>
                </div>
                <div className="rounded-xl bg-orange-50 p-2.5 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                  <Award className="h-5 w-5" />
                </div>
              </div>

              {/* Circular Gauge */}
              <div className="my-6 flex justify-center">
                <div className="relative h-32 w-32">
                  <svg className="h-full w-full -rotate-90 transform">
                    <circle
                      cx="64"
                      cy="64"
                      r="54"
                      fill="none"
                      className="stroke-slate-100 dark:stroke-slate-800"
                      strokeWidth="10"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="54"
                      fill="none"
                      stroke="#F97316"
                      strokeWidth="10"
                      strokeDasharray={`${analytics.profileCompletion * 3.39} 339`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black tabular-nums text-slate-900 dark:text-white">
                      {analytics.profileCompletion}%
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                      Lengkap
                    </span>
                  </div>
                </div>
              </div>

              {/* Info Metrics Box */}
              <div className="space-y-2.5 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    Layanan Aktif
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {analytics.servicesCount} layanan
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    Foto Galeri Toko
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {analytics.imagesCount} foto
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <Link href="/dashboard/mitra/profile/edit" className="block">
                <button className="mt-5 w-full rounded-xl bg-orange-500 py-3 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition-all hover:bg-orange-600 active:scale-95">
                  Lengkapi Profil Toko
                </button>
              </Link>

              {mitraId && (
                <Link
                  href={`/rekomendasi/${mitraId}`}
                  target="_blank"
                  className="mt-3.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 transition hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400"
                >
                  <span>Lihat Tampilan Profil Publik</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </motion.main>
    </div>
  )
}
