'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Star,
  ThumbsUp,
  MessageSquare,
  ShieldCheck,
  Camera,
  Video,
  Play,
  Filter,
  CheckCircle2,
  Building2,
  Store,
  ChevronDown,
  Sparkles,
  Loader2,
  Truck,
  PenSquare,
} from 'lucide-react'
import { toast } from 'sonner'
import { MediaLightboxModal, MediaItem } from './media-lightbox-modal'
import { ProductReviewModal } from './product-review-modal'

interface ProductReviewsSectionProps {
  productId: string
  productName: string
  storeName?: string
}

interface ReviewItem {
  id: string
  userId: string
  productId: string
  orderId?: string | null
  storeId?: string | null
  rating: number
  comment: string | null
  variantName?: string | null
  images: string[]
  videos: string[]
  sellerReply?: string | null
  sellerReplyAt?: string | null
  helpfulCount: number
  createdAt: string
  user: {
    id: string
    name: string | null
    image: string | null
  }
  order?: {
    id: string
    orderNumber: string
    courierCode?: string | null
    courierService?: string | null
    status: string
  } | null
  store?: {
    id: string
    name: string
  } | null
}

const MONOGRAM_COLORS = [
  'bg-orange-100 text-orange-700 border-orange-200/80',
  'bg-blue-100 text-blue-700 border-blue-200/80',
  'bg-emerald-100 text-emerald-700 border-emerald-200/80',
  'bg-indigo-100 text-indigo-700 border-indigo-200/80',
  'bg-amber-100 text-amber-700 border-amber-200/80',
  'bg-rose-100 text-rose-700 border-rose-200/80',
]

export function ProductReviewsSection({
  productId,
  productName,
  storeName,
}: ProductReviewsSectionProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [hasMediaOnly, setHasMediaOnly] = useState(false)
  const [sortBy, setSortBy] = useState('newest')
  const [page, setPage] = useState(1)

  const [statistics, setStatistics] = useState({
    averageRating: 5.0,
    totalReviews: 0,
    satisfactionRate: 100,
    starCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>,
    mediaCount: 0,
    mediaGallery: [] as MediaItem[],
  })

  const [userEligibility, setUserEligibility] = useState({
    isLoggedIn: false,
    canReview: false,
    isDelivered: false,
    eligibleOrderId: null as string | null,
    eligibleVariantName: null as string | null,
    existingReview: null as any,
  })

  // Modal States
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean
    mediaList: MediaItem[]
    initialIndex: number
  }>({
    isOpen: false,
    mediaList: [],
    initialIndex: 0,
  })

  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, number>>({})
  const [votedReviews, setVotedReviews] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchReviews()
  }, [productId, selectedRating, hasMediaOnly, sortBy, page])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedRating) params.set('rating', selectedRating.toString())
      if (hasMediaOnly) params.set('hasMedia', 'true')
      if (sortBy) params.set('sort', sortBy)
      params.set('page', page.toString())
      params.set('limit', '15')

      const res = await fetch(
        `/api/gadgets/${productId}/reviews?${params.toString()}`
      )
      const data = await res.json()

      if (data.success && data.data) {
        setReviews(data.data.reviews || [])
        setStatistics(
          data.data.statistics || {
            averageRating: 5.0,
            totalReviews: 0,
            satisfactionRate: 100,
            starCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
            mediaCount: 0,
            mediaGallery: [],
          }
        )
        setUserEligibility(
          data.data.userEligibility || {
            isLoggedIn: false,
            canReview: false,
            isDelivered: false,
            eligibleOrderId: null,
            eligibleVariantName: null,
            existingReview: null,
          }
        )
      }
    } catch (error) {
      console.error('Error fetching product reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenLightbox = (mediaList: MediaItem[], index: number = 0) => {
    setLightboxState({
      isOpen: true,
      mediaList,
      initialIndex: index,
    })
  }

  const handleHelpfulVote = async (reviewId: string) => {
    if (votedReviews[reviewId]) {
      toast.info('Anda sudah menandai ulasan ini bermanfaat')
      return
    }

    try {
      const res = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: 'POST',
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setHelpfulVotes((prev) => ({ ...prev, [reviewId]: data.helpfulCount }))
        setVotedReviews((prev) => ({ ...prev, [reviewId]: true }))
        toast.success('Terima kasih atas tanggapan Anda!')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleOpenReviewModal = () => {
    if (!userEligibility.isLoggedIn) {
      toast.info('Silakan masuk terlebih dahulu untuk menulis ulasan')
      window.location.href = `/login?callbackUrl=/gadget/${productId}`
      return
    }

    if (!userEligibility.canReview || !userEligibility.eligibleOrderId) {
      toast.error(
        'Ulasan hanya dapat diberikan oleh customer yang telah membeli produk ini dan status pesanannya sudah selesai.'
      )
      return
    }

    setIsReviewModalOpen(true)
  }

  const maskName = (name?: string | null) => {
    if (!name) return 'Pembeli Terverifikasi'
    const parts = name.trim().split(' ')
    if (parts.length === 1) {
      const first = parts[0]
      return first.length > 2
        ? `${first.slice(0, 2)}***${first.slice(-1)}`
        : `${first}*`
    }
    return `${parts[0]} ${parts[1].charAt(0)}***`
  }

  const getMonogram = (name?: string | null) => {
    if (!name) return 'P'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <section
      className="mt-12 border-t border-slate-200/80 pt-10 dark:border-slate-800"
      aria-label="Ulasan Pembeli"
    >
      {/* 1. Header & Rating Overview Card */}
      <div className="shadow-xs space-y-7 rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        {/* Section Title Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl">
              Ulasan & Kepuasan Pembeli
            </h2>
            <span className="hidden items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300 sm:inline-flex">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Khusus Pembeli Terverifikasi</span>
            </span>
          </div>

          {userEligibility.canReview && (
            <button
              type="button"
              onClick={handleOpenReviewModal}
              className="shadow-xs inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-orange-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-orange-600 active:scale-95"
            >
              <PenSquare className="h-3.5 w-3.5" />
              <span>
                {userEligibility.existingReview
                  ? 'Ubah Ulasan Saya'
                  : 'Tulis Ulasan Pembeli'}
              </span>
            </button>
          )}
        </div>

        {/* Rating Stats & Breakdown (Unified 2-Column Responsive Layout) */}
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Left Column: Big Rating Hero Score (5 cols) */}
          <div className="flex flex-col items-center space-y-3 text-center lg:col-span-5 lg:items-start lg:text-left">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tabular-nums tracking-tight text-slate-950 dark:text-white sm:text-6xl">
                {statistics.averageRating.toFixed(1)}
              </span>
              <span className="text-base font-bold text-slate-400">/ 5.0</span>
            </div>

            <div className="flex items-center gap-1.5 text-amber-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.round(statistics.averageRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-200 dark:text-slate-700'
                  }`}
                />
              ))}
            </div>

            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {statistics.totalReviews > 0
                ? `Berdasarkan ${statistics.totalReviews} Ulasan Pembeli`
                : 'Belum ada ulasan'}
            </p>

            {statistics.totalReviews > 0 && (
              <div className="pt-0.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/50 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>
                    {statistics.satisfactionRate}% Pembeli Merekomendasikan
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Right Column: Star Breakdown Interactive Bars (7 cols) */}
          <div className="space-y-2.5 lg:col-span-7 lg:border-l lg:border-slate-100 lg:pl-10 lg:dark:border-slate-800/80">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = statistics.starCounts[star] || 0
              const percentage =
                statistics.totalReviews > 0
                  ? (count / statistics.totalReviews) * 100
                  : 0
              const isSelected = selectedRating === star

              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setSelectedRating(isSelected ? null : star)}
                  className={`group flex w-full cursor-pointer items-center gap-3 rounded-xl p-1.5 text-xs transition-all duration-200 ${
                    isSelected
                      ? 'bg-orange-50/80 dark:bg-orange-950/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex w-12 shrink-0 items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                    <span className="tabular-nums">{star}</span>
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  </div>

                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isSelected
                          ? 'bg-orange-500'
                          : star >= 4
                            ? 'bg-amber-400 group-hover:bg-amber-500'
                            : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <span className="w-10 shrink-0 text-right font-mono text-[11px] font-semibold tabular-nums text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200">
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 2. Customer Media Gallery Strip (Photos & Videos Carousel) */}
        {statistics.mediaGallery.length > 0 && (
          <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <Camera className="h-3.5 w-3.5 text-orange-500" />
                <span>Foto & Video dari Pembeli</span>
                <span className="py-0.2 rounded-full bg-slate-100 px-2 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {statistics.mediaGallery.length}
                </span>
              </span>

              <button
                type="button"
                onClick={() => setHasMediaOnly(!hasMediaOnly)}
                className={`cursor-pointer text-[11px] font-bold transition ${
                  hasMediaOnly
                    ? 'text-orange-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {hasMediaOnly
                  ? '✓ Menampilkan Bermedia'
                  : 'Filter Dengan Media'}
              </button>
            </div>

            <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-2">
              {statistics.mediaGallery.map((item, idx) => {
                const isVideo =
                  item.type === 'video' || item.url.match(/\.(mp4|webm|mov)$/i)
                return (
                  <button
                    key={`strip-${idx}`}
                    type="button"
                    onClick={() =>
                      handleOpenLightbox(statistics.mediaGallery, idx)
                    }
                    className="group relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 transition-all duration-200 hover:scale-105 hover:shadow-md dark:border-slate-800 dark:bg-slate-800 sm:h-24 sm:w-24"
                  >
                    {isVideo ? (
                      <div className="relative flex h-full w-full items-center justify-center bg-slate-950">
                        <video
                          src={item.url}
                          className="h-full w-full object-cover opacity-60"
                        />
                        <div className="absolute rounded-full bg-orange-500/90 p-2 text-white shadow-sm transition group-hover:scale-110">
                          <Play className="h-3.5 w-3.5 fill-white" />
                        </div>
                      </div>
                    ) : (
                      <Image
                        src={item.url}
                        alt="Media pembeli"
                        fill
                        sizes="96px"
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. Filter & Sort Toolbar */}
      <div className="mt-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Semua */}
          <button
            type="button"
            onClick={() => {
              setSelectedRating(null)
              setHasMediaOnly(false)
            }}
            className={`cursor-pointer rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 ${
              selectedRating === null && !hasMediaOnly
                ? 'shadow-xs border border-orange-500 bg-orange-50/80 font-bold text-orange-600 dark:border-orange-500 dark:bg-orange-950/30 dark:text-orange-400'
                : 'border border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            Semua ({statistics.totalReviews})
          </button>

          {/* Dengan Foto & Video */}
          {statistics.mediaCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setHasMediaOnly(!hasMediaOnly)
                setSelectedRating(null)
              }}
              className={`flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 ${
                hasMediaOnly
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/25'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <Camera className="h-3.5 w-3.5" />
              <span>Dengan Foto & Video ({statistics.mediaCount})</span>
            </button>
          )}

          {/* Star Rating Pills (Only show ratings with count > 0 to eliminate clutter) */}
          {[5, 4, 3, 2, 1]
            .filter((star) => (statistics.starCounts[star] || 0) > 0)
            .map((star) => {
              const count = statistics.starCounts[star] || 0
              const isSelected = selectedRating === star
              return (
                <button
                  key={`btn-star-${star}`}
                  type="button"
                  onClick={() => {
                    setSelectedRating(isSelected ? null : star)
                    setHasMediaOnly(false)
                  }}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-all duration-200 ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />
                  <span>{star} Bintang</span>
                  <span className="text-[11px] font-semibold tabular-nums opacity-70">
                    ({count})
                  </span>
                </button>
              )
            })}
        </div>

        {/* Sort Dropdown Pill */}
        <div className="flex shrink-0 items-center gap-2 self-start md:self-auto">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="shadow-2xs cursor-pointer appearance-none rounded-full border border-slate-200/90 bg-white py-2 pl-4 pr-9 text-xs font-bold text-slate-700 outline-none transition hover:border-slate-300 focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="newest">Paling Baru</option>
              <option value="highest">Rating Tertinggi</option>
              <option value="lowest">Rating Terendah</option>
              <option value="helpful">Paling Membantu</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {/* 4. Review Cards List */}
      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="shadow-xs rounded-3xl border border-slate-200/80 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-orange-500" />
            <p className="text-xs font-medium text-slate-400">
              Memuat ulasan pembeli...
            </p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="shadow-xs space-y-3 rounded-3xl border border-slate-200/80 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 dark:bg-orange-950/40">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Belum Ada Ulasan untuk Filter Ini
            </h4>
            <p className="mx-auto max-w-sm text-xs text-slate-500">
              {userEligibility.canReview
                ? 'Pesanan Anda telah selesai! Bagikan pengalaman dan ulasan mengenai gadget ini.'
                : 'Ulasan hanya dapat diisi oleh pembeli terverifikasi setelah pesanan selesai diterima.'}
            </p>
            <div className="pt-2">
              {userEligibility.canReview ? (
                <button
                  type="button"
                  onClick={handleOpenReviewModal}
                  className="shadow-xs inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-5 py-2 text-xs font-bold text-white transition hover:bg-orange-600 active:scale-95"
                >
                  <PenSquare className="h-3.5 w-3.5" />
                  <span>
                    {userEligibility.existingReview
                      ? 'Ubah Ulasan Anda'
                      : 'Beri Ulasan Sekarang'}
                  </span>
                </button>
              ) : (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Khusus Pembeli dengan Pesanan Selesai</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          reviews.map((review, rIdx) => {
            const hasMedia =
              (review.images && review.images.length > 0) ||
              (review.videos && review.videos.length > 0)

            const reviewMediaList: MediaItem[] = [
              ...(review.images || []).map((img) => ({
                url: img,
                type: 'image' as const,
                reviewId: review.id,
                authorName: maskName(review.user?.name),
                rating: review.rating,
                date: review.createdAt,
              })),
              ...(review.videos || []).map((vid) => ({
                url: vid,
                type: 'video' as const,
                reviewId: review.id,
                authorName: maskName(review.user?.name),
                rating: review.rating,
                date: review.createdAt,
              })),
            ]

            const colorClass = MONOGRAM_COLORS[rIdx % MONOGRAM_COLORS.length]
            const formattedDate = new Date(review.createdAt).toLocaleDateString(
              'id-ID',
              {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              }
            )

            const currentHelpful =
              helpfulVotes[review.id] ?? review.helpfulCount

            return (
              <div
                key={review.id}
                className="shadow-xs space-y-4 rounded-3xl border border-slate-200/80 bg-white p-5 transition duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 sm:p-6"
              >
                {/* 1. Review Author Header & Badges */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* User Monogram Squircle Avatar */}
                    {review.user?.image ? (
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-2xl border border-slate-200">
                        <Image
                          src={review.user.image}
                          alt="Avatar"
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className={`shadow-2xs flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-xs font-bold ${colorClass}`}
                      >
                        {getMonogram(review.user?.name)}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {maskName(review.user?.name)}
                        </h4>
                        <span className="py-0.2 inline-flex items-center gap-1 rounded-full border border-emerald-200/50 bg-emerald-50 px-2 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span>Pembeli Terverifikasi</span>
                        </span>
                      </div>

                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
                        <span>{formattedDate}</span>
                        {review.variantName && (
                          <>
                            <span>•</span>
                            <span className="font-medium text-slate-600 dark:text-slate-300">
                              Varian: {review.variantName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rating Stars & Logistics Tag */}
                  <div className="flex flex-col gap-1 sm:items-end">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3.5 w-3.5 ${
                            star <= review.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-200 dark:text-slate-700'
                          }`}
                        />
                      ))}
                    </div>

                    {review.order?.courierCode && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                        <Truck className="h-3 w-3 text-orange-500" />
                        <span>
                          {review.order.courierCode}{' '}
                          {review.order.courierService || 'REG'} (Diterima)
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Review Text Comment */}
                {review.comment && (
                  <p className="whitespace-pre-line text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    {review.comment}
                  </p>
                )}

                {/* 3. Media Attachments Grid (Photos & Videos) */}
                {hasMedia && (
                  <div className="flex flex-wrap gap-2.5 pt-1">
                    {reviewMediaList.map((media, mIdx) => {
                      const isVid = media.type === 'video'
                      return (
                        <button
                          key={`rev-media-${mIdx}`}
                          type="button"
                          onClick={() =>
                            handleOpenLightbox(reviewMediaList, mIdx)
                          }
                          className="group relative h-20 w-20 cursor-pointer overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 transition-all hover:scale-105 hover:shadow-md dark:border-slate-800 dark:bg-slate-800 sm:h-24 sm:w-24"
                        >
                          {isVid ? (
                            <div className="relative flex h-full w-full items-center justify-center bg-slate-950">
                              <video
                                src={media.url}
                                className="h-full w-full object-cover opacity-70"
                              />
                              <div className="absolute rounded-full bg-orange-500/90 p-2 text-white shadow-sm transition group-hover:scale-110">
                                <Play className="h-3.5 w-3.5 fill-white" />
                              </div>
                            </div>
                          ) : (
                            <Image
                              src={media.url}
                              alt="Foto ulasan pembeli"
                              fill
                              sizes="96px"
                              className="object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* 4. Official Store Reply Box (If available) */}
                {review.sellerReply && (
                  <div className="space-y-1.5 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800/80 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2">
                      <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300">
                        <Store className="h-3 w-3" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Tanggapan Resmi Toko{' '}
                        {review.store?.name ? `(${review.store.name})` : ''}:
                      </span>
                    </div>
                    <p className="pl-7 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                      {review.sellerReply}
                    </p>
                  </div>
                )}

                {/* 5. Review Footer: Helpful Vote Action */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs dark:border-slate-800/60">
                  <span className="text-[11px] text-slate-400">
                    Apakah ulasan ini bermanfaat?
                  </span>

                  <button
                    type="button"
                    onClick={() => handleHelpfulVote(review.id)}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition ${
                      votedReviews[review.id]
                        ? 'border-orange-200 bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300'
                        : 'border-slate-200/70 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300'
                    }`}
                  >
                    <ThumbsUp className="h-3 w-3" />
                    <span>Membantu ({currentHelpful})</span>
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Media Lightbox Modal */}
      <MediaLightboxModal
        isOpen={lightboxState.isOpen}
        onClose={() => setLightboxState((prev) => ({ ...prev, isOpen: false }))}
        mediaList={lightboxState.mediaList}
        initialIndex={lightboxState.initialIndex}
      />

      {/* Product Review Submission / Edit Modal */}
      <ProductReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        productId={productId}
        productName={productName}
        variantName={userEligibility.eligibleVariantName}
        orderId={userEligibility.eligibleOrderId}
        existingReview={userEligibility.existingReview}
        onSuccess={() => {
          fetchReviews()
        }}
      />
    </section>
  )
}
