'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Eye,
  Star,
  MessageSquare,
  Phone,
  Edit3,
  Clock,
  Award,
  Loader2,
} from 'lucide-react'

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

// Stat Card Component (matching admin dashboard style)
function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  iconBg = 'bg-blue-500',
}: {
  icon: React.ElementType
  label: string
  value: string
  trend?: { value: number; isPositive: boolean }
  iconBg?: string
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md lg:rounded-2xl lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 lg:text-sm">{label}</p>
          <p className="mt-1 text-xl font-bold text-gray-900 lg:text-3xl">
            {value}
          </p>
          {trend && (
            <p
              className={`mt-1 text-xs lg:text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}%
            </p>
          )}
        </div>
        <div className={`rounded-lg lg:rounded-xl ${iconBg} p-2 lg:p-3`}>
          <Icon className="h-4 w-4 text-white lg:h-6 lg:w-6" />
        </div>
      </div>
    </div>
  )
}

export default function MitraDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<MitraAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasProfile, setHasProfile] = useState(false)
  const [mitraId, setMitraId] = useState<string>('')

  // Check if profile exists and fetch analytics
  useEffect(() => {
    const checkProfileAndFetchAnalytics = async () => {
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
    }

    if (status === 'authenticated') {
      checkProfileAndFetchAnalytics()
    }
  }, [status, router])

  // Auto-refresh analytics every 30 seconds for real-time updates
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

    // Set up polling interval (30 seconds)
    const intervalId = setInterval(refreshAnalytics, 30000)

    // Cleanup on unmount
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

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!hasProfile || !analytics) {
    return null // Will redirect to edit page
  }

  return (
    <div>
      {/* Header Banner */}
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Analytics</h1>
            <p className="mt-2 text-blue-100">
              Pantau performa dan aktivitas profil bisnis Anda
            </p>
          </div>
          <div className="hidden items-center gap-2 rounded-xl bg-white/10 px-4 py-2 backdrop-blur-sm md:flex">
            <Clock className="h-5 w-5" />
            <span className="text-sm">
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          icon={Eye}
          label="Total Views"
          value={analytics.profileViews.toString()}
          trend={{ value: 12, isPositive: true }}
          iconBg="bg-blue-500"
        />
        <StatCard
          icon={Star}
          label="Rating Rata-rata"
          value={analytics.averageRating.toFixed(1)}
          trend={{ value: 5, isPositive: true }}
          iconBg="bg-yellow-500"
        />
        <StatCard
          icon={MessageSquare}
          label="Total Ulasan"
          value={analytics.totalReviews.toString()}
          trend={{ value: 8, isPositive: true }}
          iconBg="bg-green-500"
        />
        <StatCard
          icon={Phone}
          label="Inquiries"
          value={analytics.inquiries.toString()}
          trend={{ value: 15, isPositive: true }}
          iconBg="bg-purple-500"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Status Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Status Profil</h2>
            <Award className="h-6 w-6 text-blue-600" />
          </div>

          {/* Completion Circle */}
          <div className="mb-6 flex justify-center">
            <div className="relative h-32 w-32">
              <svg className="h-full w-full -rotate-90 transform">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="12"
                  strokeDasharray={`${analytics.profileCompletion * 3.52} 352`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-gray-900">
                  {analytics.profileCompletion}%
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Layanan</span>
              <span className="font-semibold text-gray-900">
                {analytics.servicesCount} layanan
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Foto Galeri</span>
              <span className="font-semibold text-gray-900">
                {analytics.imagesCount} foto
              </span>
            </div>
          </div>

          {/* Edit Button */}
          <Link
            href="/dashboard/mitra/profile/edit"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-3 font-semibold text-white transition-all hover:shadow-lg"
          >
            <Edit3 className="h-5 w-5" />
            Edit Profil
          </Link>
        </div>

        {/* Recent Reviews */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Ulasan Pelanggan ({analytics.recentReviews.length})
            </h2>
            <MessageSquare className="h-6 w-6 text-blue-600" />
          </div>

          {analytics.recentReviews.length > 0 ? (
            <div className="max-h-96 space-y-4 overflow-y-auto pr-2">
              {analytics.recentReviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {review.userName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString(
                          'id-ID',
                          {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          }
                        )}
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
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400">
              <MessageSquare className="mx-auto mb-3 h-12 w-12 opacity-50" />
              <p>Belum ada ulasan</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Aksi Cepat</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href="/dashboard/mitra/profile/edit"
            className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
          >
            <div className="mb-4 inline-flex rounded-xl bg-blue-100 p-3">
              <Edit3 className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
              Edit Profil
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Perbarui informasi bisnis Anda
            </p>
          </Link>

          <Link
            href={mitraId ? `/rekomendasi/${mitraId}` : '/rekomendasi'}
            className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-green-300 hover:shadow-md"
          >
            <div className="mb-4 inline-flex rounded-xl bg-green-100 p-3">
              <Eye className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 group-hover:text-green-600">
              Lihat Profil Publik
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Lihat bagaimana pelanggan melihat profil Anda
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}
