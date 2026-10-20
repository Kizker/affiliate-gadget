'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Image from 'next/image'
import {
  Star,
  Camera,
  Play,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import ReviewCard from '@/components/reviews/review-card'
import {
  MediaLightboxModal,
  MediaItem,
} from '@/components/gadget/media-lightbox-modal'

interface StoreReviewsSectionProps {
  storeId: string
  storeName: string
  className?: string
}

interface StoreReviewItem {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  images: string[]
  videos: string[]
  user: {
    id: string
    name: string | null
    image: string | null
  }
  product?: {
    id: string
    name: string
    slug?: string
  } | null
}

interface ReviewStatistics {
  totalReviews: number
  averageRating: number
  mediaCount: number
  starCounts: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
  mediaGallery: Array<{
    url: string
    type: 'image' | 'video'
    reviewId: string
    authorName: string
    rating: number
    date: string
  }>
}

export function StoreReviewsSection({
  storeId,
  storeName,
  className = '',
}: StoreReviewsSectionProps) {
  const [reviews, setReviews] = useState<StoreReviewItem[]>([])
  const [statistics, setStatistics] = useState<ReviewStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [hasMediaOnly, setHasMediaOnly] = useState(false)
  const [sort, setSort] = useState<'newest' | 'highest' | 'lowest'>('newest')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Lightbox state for store-wide media gallery filmstrip
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const fetchStoreReviews = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sort,
      })

      if (selectedRating) {
        params.append('rating', selectedRating.toString())
      }
      if (hasMediaOnly) {
        params.append('hasMedia', 'true')
      }

      params.append('storeId', storeId)
      const res = await fetch(`/api/reviews?${params.toString()}`)
      const data = await res.json()

      if (res.ok && data.success) {
        setReviews(data.reviews || [])
        setStatistics(data.statistics || null)
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error('Error fetching store reviews:', error)
    } finally {
      setLoading(false)
    }
  }, [storeId, page, sort, selectedRating, hasMediaOnly])

  useEffect(() => {
    fetchStoreReviews()
  }, [fetchStoreReviews])

  const galleryMediaList = useMemo<MediaItem[]>(() => {
    if (!statistics?.mediaGallery) return []
    return statistics.mediaGallery.map((m) => ({
      url: m.url,
      type: m.type,
      authorName: m.authorName,
      rating: m.rating,
      date: m.date,
    }))
  }, [statistics?.mediaGallery])

  const totalReviews = statistics?.totalReviews || 0
  const averageRating = statistics?.averageRating || 5.0

  return (
    <section className={`w-full py-8 md:py-12 ${className}`} id="ulasan-toko">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                Ulasan Pelanggan Gerai
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-bold text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                <Sparkles className="h-3 w-3" />
                <span>Terverifikasi</span>
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Ulasan asli dari pembeli yang menyelesaikan transaksi di gerai{' '}
              {storeName}
            </p>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">
              Urutkan:
            </span>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as any)
                setPage(1)
              }}
              className="shadow-2xs rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="newest">Terbaru</option>
              <option value="highest">Rating Tertinggi</option>
              <option value="lowest">Rating Terendah</option>
            </select>
          </div>
        </div>

        {/* Rating Hero Bento Banner */}
        <div className="mb-6 grid grid-cols-1 gap-6 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7 md:grid-cols-12">
          {/* Left Column: Big Average Score */}
          <div className="flex flex-col items-center justify-center border-b border-slate-100 pb-5 text-center dark:border-slate-800 md:col-span-4 md:border-b-0 md:border-r md:pb-0 md:pr-6">
            <span className="text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">
              {averageRating.toFixed(1)}
            </span>
            <div className="my-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-5 w-5 ${
                    s <= Math.round(averageRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-200 dark:text-slate-700'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Berdasarkan {totalReviews} ulasan pembeli
            </p>
          </div>

          {/* Right Column: Star Progress Bars */}
          <div className="flex flex-col justify-center space-y-1.5 md:col-span-8">
            {[5, 4, 3, 2, 1].map((star) => {
              const count =
                statistics?.starCounts[
                  star as keyof typeof statistics.starCounts
                ] || 0
              const percentage =
                totalReviews > 0 ? (count / totalReviews) * 100 : 0
              return (
                <div key={star} className="flex items-center gap-3 text-xs">
                  <div className="flex w-14 items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                    <span>{star}</span>
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  </div>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-[11px] font-medium text-slate-400">
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Store Media Gallery Filmstrip (Photos & Videos from buyers) */}
        {galleryMediaList.length > 0 && (
          <div className="mb-6 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-orange-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Galeri Foto & Video Pembeli
                </h3>
                <span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300 sm:inline-block">
                  {galleryMediaList.length} media
                </span>
              </div>
              <span className="hidden text-[11px] font-medium text-slate-400 sm:inline-block">
                Klik untuk memperbesar
              </span>
            </div>

            <div className="no-scrollbar flex items-center gap-2.5 overflow-x-auto pb-1">
              {galleryMediaList.map((media, idx) => (
                <button
                  key={`store-gallery-${idx}`}
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  className="hover:scale-102 shadow-2xs group relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 transition hover:opacity-90 dark:border-slate-800 dark:bg-slate-800"
                >
                  {media.type === 'video' ? (
                    <div className="relative flex h-full w-full items-center justify-center bg-slate-950">
                      <video
                        src={media.url}
                        className="h-full w-full object-cover opacity-60"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="rounded-full bg-orange-500/90 p-1.5 text-white shadow-md">
                          <Play className="h-3 w-3 fill-white" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Image
                      src={media.url}
                      alt={`Foto Ulasan ${idx + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filter Pills (All, With Media, 5 Stars, etc.) */}
        <div className="no-scrollbar mb-6 flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => {
              setSelectedRating(null)
              setHasMediaOnly(false)
              setPage(1)
            }}
            className={`cursor-pointer whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition ${
              selectedRating === null && !hasMediaOnly
                ? 'shadow-xs bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
            }`}
          >
            Semua ({totalReviews})
          </button>

          <button
            onClick={() => {
              setHasMediaOnly(!hasMediaOnly)
              setSelectedRating(null)
              setPage(1)
            }}
            className={`flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition ${
              hasMediaOnly
                ? 'shadow-xs bg-orange-500 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Dengan Foto & Video ({statistics?.mediaCount || 0})</span>
          </button>

          {[5, 4, 3, 2, 1].map((star) => (
            <button
              key={`filter-star-${star}`}
              onClick={() => {
                setSelectedRating(selectedRating === star ? null : star)
                setHasMediaOnly(false)
                setPage(1)
              }}
              className={`flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-bold transition ${
                selectedRating === star
                  ? 'shadow-xs bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
              }`}
            >
              <span>{star}</span>
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span>
                (
                {statistics?.starCounts[
                  star as keyof typeof statistics.starCounts
                ] || 0}
                )
              </span>
            </button>
          ))}
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
            <p className="mt-2 text-xs font-medium text-slate-500">
              Memuat ulasan pembeli...
            </p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
              <Star className="h-6 w-6" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
              Belum Ada Ulasan Sesuai Filter
            </h4>
            <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
              Coba pilih filter bintang lain atau tampilkan seluruh ulasan
              pembeli.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => (
              <ReviewCard
                key={rev.id}
                review={{
                  id: rev.id,
                  rating: rev.rating,
                  comment: rev.comment,
                  createdAt: rev.createdAt,
                  images: rev.images,
                  videos: rev.videos,
                  user: rev.user,
                }}
                compact={false}
              />
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Sebelumnya</span>
            </button>

            <span className="shrink-0 whitespace-nowrap text-xs font-semibold text-slate-500">
              Halaman {page} dari {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Fullscreen Media Lightbox for Filmstrip */}
      {lightboxIndex !== null && galleryMediaList.length > 0 && (
        <MediaLightboxModal
          isOpen={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          mediaList={galleryMediaList}
          initialIndex={lightboxIndex}
        />
      )}
    </section>
  )
}
