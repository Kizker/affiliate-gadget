'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { Star } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-is-mobile'
import type { Session } from 'next-auth'

// Skeleton fallback for review list during dynamic load
function ReviewListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex animate-pulse items-start gap-4 rounded-2xl border border-neutral-100 p-4 dark:border-neutral-800"
        >
          <div className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-800" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/4 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-3 w-1/2 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-3 w-full rounded bg-neutral-200 dark:bg-neutral-800" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Dynamic imports for review modal and review list (Task 2.1 & 2.4)
const ReviewModal = dynamic(() => import('@/components/reviews/review-modal'), {
  ssr: false,
})
const ReviewList = dynamic(() => import('@/components/reviews/review-list'), {
  ssr: false,
  loading: () => <ReviewListSkeleton />,
})

interface MitraReviewsProps {
  mitraId: string
  rating: number
  totalReview: number
  userHasReview: boolean
  session: Session | null
  onReviewCreatedOrUpdated?: () => void
}

export function MitraReviews({
  mitraId,
  rating,
  totalReview,
  userHasReview,
  session,
  onReviewCreatedOrUpdated,
}: MitraReviewsProps) {
  const isMobile = useIsMobile(768)
  const [refreshReviews, setRefreshReviews] = useState(0)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [editingReview, setEditingReview] = useState<{
    id: string
    rating: number
    comment: string | null
  } | null>(null)

  return (
    <section
      id="ulasan-pelanggan"
      className="relative border-t border-neutral-100 bg-[#FBFBFD] px-4 py-8 dark:border-neutral-900 dark:bg-neutral-950/60 sm:px-6 md:flex md:h-screen md:snap-start md:flex-col md:justify-center md:overflow-hidden md:pt-16 lg:px-8"
      style={!isMobile ? { minHeight: '100vh', height: '100vh' } : undefined}
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-4 flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-2xl lg:text-3xl">
              Ulasan Pelanggan Servis
            </h2>
            <div className="mt-2 flex items-center justify-center gap-1.5 sm:justify-start">
              <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />
              <span className="text-sm font-bold text-neutral-900 dark:text-white">
                {rating.toFixed(1)} / 5.0
              </span>
            </div>
          </div>

          {session?.user &&
            session.user.role === 'CUSTOMER' &&
            !userHasReview && (
              <button
                onClick={() => {
                  setEditingReview(null)
                  setIsReviewModalOpen(true)
                }}
                className="rounded-full bg-black px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-neutral-800 active:scale-95 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
              >
                + Tulis Review Servis
              </button>
            )}
        </div>

        <div className="rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
          <ReviewList
            mitraId={mitraId}
            refreshTrigger={refreshReviews}
            currentUserId={session?.user?.id}
            onEditReview={(review) => {
              setEditingReview(review)
              setIsReviewModalOpen(true)
            }}
          />
        </div>

        {isReviewModalOpen && (
          <ReviewModal
            mitraId={mitraId}
            existingReview={editingReview}
            isOpen={isReviewModalOpen}
            onClose={() => {
              setIsReviewModalOpen(false)
              setEditingReview(null)
            }}
            onSuccess={() => {
              setRefreshReviews((prev) => prev + 1)
              onReviewCreatedOrUpdated?.()
            }}
          />
        )}
      </div>
    </section>
  )
}
