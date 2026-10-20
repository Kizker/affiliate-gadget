'use client'

import { Star, User, Edit2, Trash2, Play } from 'lucide-react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'
import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import {
  MediaLightboxModal,
  MediaItem,
} from '@/components/gadget/media-lightbox-modal'

interface ReviewCardProps {
  review: {
    id: string
    rating: number
    comment: string | null
    createdAt: string
    images?: string[]
    videos?: string[]
    user: {
      id: string
      name: string | null
      image: string | null
    }
  }
  currentUserId?: string
  compact?: boolean
  onClick?: () => void
  onEdit?: (review: {
    id: string
    rating: number
    comment: string | null
    images?: string[]
    videos?: string[]
  }) => void
  onDelete?: () => void
}

export default function ReviewCard({
  review,
  currentUserId,
  compact = false,
  onClick,
  onEdit,
  onDelete,
}: ReviewCardProps) {
  const [deleting, setDeleting] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const isOwnReview = currentUserId === review.user.id

  const mediaList = useMemo<MediaItem[]>(() => {
    const list: MediaItem[] = []
    review.images?.forEach((url) => {
      list.push({
        url,
        type: 'image',
        authorName: review.user.name || 'Pelanggan',
        rating: review.rating,
      })
    })
    review.videos?.forEach((url) => {
      list.push({
        url,
        type: 'video',
        authorName: review.user.name || 'Pelanggan',
        rating: review.rating,
      })
    })
    return list
  }, [review.images, review.videos, review.user.name, review.rating])

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Apakah Anda yakin ingin menghapus review ini?')) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/reviews?reviewId=${review.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete review')
      }

      toast.success('Review berhasil dihapus')
      if (onDelete) {
        onDelete()
      }
    } catch (error) {
      console.error('Error deleting review:', error)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error((error as any).message || 'Gagal menghapus review')
    } finally {
      setDeleting(false)
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      images: review.images,
      videos: review.videos,
    })
  }

  return (
    <>
      <div
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        className={`rounded-2xl border border-neutral-200/90 bg-white transition-all dark:border-neutral-800 dark:bg-neutral-900 ${
          compact
            ? 'cursor-pointer p-3.5 hover:border-neutral-400 hover:shadow-md sm:p-4'
            : 'p-5 shadow-sm hover:shadow-md sm:p-6'
        }`}
      >
        {/* User Info */}
        <div className={`flex items-start ${compact ? 'gap-3' : 'mb-4 gap-4'}`}>
          {/* Avatar */}
          <div
            className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-neutral-100 text-white dark:border-neutral-700 dark:bg-neutral-800 ${
              compact ? 'h-9 w-9' : 'h-11 w-11'
            }`}
          >
            {review.user.image ? (
              <img
                src={review.user.image}
                alt={review.user.name || 'User'}
                className="h-full w-full object-cover"
              />
            ) : (
              <User
                className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-neutral-500`}
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            {/* Name and Timestamp */}
            <div className="flex items-center justify-between gap-2">
              <h4
                className={`truncate font-bold text-neutral-900 dark:text-white ${
                  compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
                }`}
              >
                {review.user.name || 'Anonymous'}
              </h4>
              <span className="shrink-0 text-right text-[11px] text-neutral-400">
                {formatDistanceToNow(new Date(review.createdAt), {
                  addSuffix: true,
                  locale: id,
                })}
              </span>
            </div>

            {/* Rating Stars and Edit/Delete Buttons */}
            <div
              className={`flex items-center justify-between ${
                compact ? 'mt-1' : 'mb-3 mt-2'
              }`}
            >
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} ${
                      star <= review.rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-neutral-200 dark:text-neutral-700'
                    }`}
                  />
                ))}
                <span className="ml-1 text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                  {review.rating.toFixed(1)}
                </span>
              </div>

              {/* Edit/Delete Buttons - Icon only */}
              {isOwnReview && (
                <div className="ml-auto flex items-center gap-1">
                  <button
                    onClick={handleEdit}
                    className="cursor-pointer rounded-lg p-1 text-blue-600 transition-colors hover:bg-blue-50 dark:text-sky-400 dark:hover:bg-neutral-800"
                    aria-label="Edit review"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="cursor-pointer rounded-lg p-1 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:text-rose-400 dark:hover:bg-neutral-800"
                    aria-label="Hapus review"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Comment */}
            {review.comment && (
              <p
                className={`mt-1.5 leading-relaxed text-neutral-700 dark:text-neutral-300 ${
                  compact ? 'line-clamp-2 text-xs' : 'text-sm'
                }`}
              >
                {review.comment}
              </p>
            )}

            {/* Media thumbnails if any */}
            {((review.images && review.images.length > 0) ||
              (review.videos && review.videos.length > 0)) && (
              <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
                {review.images?.map((url, i) => (
                  <button
                    key={`rev-img-${i}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setLightboxIndex(i)
                    }}
                    className="shadow-2xs relative h-14 w-14 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-neutral-200 transition hover:opacity-90 dark:border-neutral-800"
                  >
                    <Image
                      src={url}
                      alt="Foto ulasan"
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </button>
                ))}
                {review.videos?.map((url, i) => {
                  const mediaIdx = (review.images?.length || 0) + i
                  return (
                    <button
                      key={`rev-vid-${i}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setLightboxIndex(mediaIdx)
                      }}
                      className="shadow-2xs relative flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-orange-300 bg-slate-950 dark:border-orange-800"
                    >
                      <video
                        src={url}
                        className="h-full w-full object-cover opacity-60"
                      />
                      <Play className="absolute h-4 w-4 fill-white text-white" />
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Media Lightbox */}
      {lightboxIndex !== null && mediaList.length > 0 && (
        <MediaLightboxModal
          isOpen={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          mediaList={mediaList}
          initialIndex={lightboxIndex}
        />
      )}
    </>
  )
}
