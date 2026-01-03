'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  Phone,
  Mail,
  Globe,
  MessageCircle,
  Navigation,
} from 'lucide-react'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import ReviewModal from '@/components/reviews/review-modal'
import ReviewList from '@/components/reviews/review-list'
import ImageLightbox from '@/components/gallery/image-lightbox'
import GoogleMapDisplay from '@/components/maps/google-map-display'
import GoogleMapsProvider from '@/components/maps/google-maps-provider'
import { useSession } from 'next-auth/react'

interface MitraDetail {
  id: string
  businessName: string
  tagline: string | null
  description: string | null
  city: string
  address: string
  phone: string
  email: string | null
  website: string | null
  rating: number
  totalReview: number
  banner: string | null
  features: string[] | null
  weekdayHours: string | null
  weekendHours: string | null
  latitude: number | null
  longitude: number | null
  services: Array<{
    id: string
    name: string
    price: string
    icon: string | null
  }>
  images: Array<{ id: string; url: string }>
  isOpen: boolean
}

interface MitraDetailClientProps {
  mitra: MitraDetail
}

export default function MitraDetailClient({ mitra }: MitraDetailClientProps) {
  const { data: session } = useSession()
  const [refreshReviews, setRefreshReviews] = useState(0)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [editingReview, setEditingReview] = useState<{
    id: string
    rating: number
    comment: string | null
  } | null>(null)
  const [userHasReview, setUserHasReview] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const hasTrackedView = useRef(false)

  // Check if current user has already reviewed this mitra
  const checkUserReview = useCallback(async () => {
    if (!session?.user?.id || !mitra.id) return

    try {
      const response = await fetch(`/api/reviews?mitraId=${mitra.id}`)
      const data = await response.json()

      if (response.ok && data.reviews) {
        const userReview = data.reviews.find(
          (review: { user: { id: string } }) =>
            review.user.id === session.user.id
        )
        setUserHasReview(!!userReview)
      }
    } catch (error) {
      console.error('Error checking user review:', error)
    }
  }, [session?.user?.id, mitra.id])

  useEffect(() => {
    checkUserReview()
  }, [checkUserReview])

  // Track page view
  useEffect(() => {
    const trackView = async () => {
      if (hasTrackedView.current) return
      hasTrackedView.current = true

      try {
        await fetch('/api/mitra/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mitraId: mitra.id,
            type: 'view',
          }),
        })
      } catch (error) {
        console.error('Error tracking view:', error)
      }
    }

    if (mitra.id) {
      trackView()
    }
  }, [mitra.id])

  // Track inquiry (phone/WhatsApp click)
  const trackInquiry = async () => {
    try {
      await fetch('/api/mitra/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mitraId: mitra.id,
          type: 'inquiry',
        }),
      })
    } catch (error) {
      console.error('Error tracking inquiry:', error)
    }
  }

  return (
    <>
      <Navbar variant="light" />
      <div className="min-h-screen bg-white pt-16">
        {/* Hero Section - Full Screen on All Devices */}
        <div className="relative h-screen">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src={
                mitra.banner ||
                'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1920&q=80'
              }
              alt={mitra.businessName}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 flex h-full flex-col">
            {/* Back Button */}
            <div className="p-6">
              <Link
                href="/rekomendasi"
                className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-white backdrop-blur-md transition-all hover:bg-white/30"
              >
                <ArrowLeft className="h-5 w-5" />
                Kembali
              </Link>
            </div>

            {/* Hero Content */}
            <div className="flex flex-1 items-center justify-center px-6">
              <div className="max-w-4xl text-center text-white">
                <div className="mb-4 flex items-center justify-center gap-2">
                  <div className="flex items-center gap-1 rounded-full bg-white/20 px-4 py-2 backdrop-blur-md">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-lg font-bold">
                      {mitra.rating.toFixed(1)}
                    </span>
                    <span className="text-sm opacity-90">
                      ({mitra.totalReview} ulasan)
                    </span>
                  </div>
                </div>

                <h1 className="mb-4 text-3xl font-bold sm:text-4xl md:text-5xl lg:text-7xl">
                  {mitra.businessName}
                </h1>

                <p className="mb-6 text-base text-gray-200 sm:text-lg md:text-2xl md:text-xl">
                  {mitra.tagline ||
                    'Mitra terpercaya untuk kebutuhan servis Anda'}
                </p>

                <div className="mb-6 flex flex-wrap items-center justify-center gap-3 text-base sm:mb-8 sm:gap-4 sm:text-lg">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {mitra.city}
                  </div>
                  <span className="text-gray-400">•</span>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {mitra.isOpen ? 'Buka Hari Ini' : 'Tutup Hari Ini'}
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                  <a
                    href={`https://wa.me/${mitra.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={trackInquiry}
                    className="flex items-center gap-2 rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-2xl transition-all hover:scale-105 hover:bg-green-700 sm:px-8 sm:py-4 sm:text-base"
                  >
                    <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                    WhatsApp
                  </a>
                  <a
                    href={`tel:${mitra.phone}`}
                    onClick={trackInquiry}
                    className="flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-2xl transition-all hover:scale-105 hover:bg-blue-700 sm:px-8 sm:py-4 sm:text-base"
                  >
                    <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
                    Telepon
                  </a>
                  <a
                    href={
                      mitra.latitude && mitra.longitude
                        ? `https://www.google.com/maps/dir/?api=1&destination=${mitra.latitude},${mitra.longitude}`
                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${mitra.businessName} ${mitra.address}`)}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-full bg-white/20 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/30 sm:px-8 sm:py-4 sm:text-base"
                  >
                    <Navigation className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">Petunjuk Arah</span>
                    <span className="sm:hidden">Arah</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Scroll Indicator - Hidden on small screens */}
            <div className="hidden pb-8 text-center sm:block">
              <div className="inline-flex flex-col items-center gap-2 text-white">
                <span className="text-sm">Scroll untuk info lebih lanjut</span>
                <div className="h-8 w-5 rounded-full border-2 border-white p-1">
                  <div className="h-2 w-1 animate-bounce rounded-full bg-white"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="relative">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&q=80"
              alt="Background"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-blue-50/90 to-white/95"></div>
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-6 py-16">
            {/* About Section */}
            <section className="mb-16">
              <h2 className="mb-6 text-3xl font-bold text-gray-900">
                Tentang Kami
              </h2>
              <p className="text-lg leading-relaxed text-gray-700">
                {mitra.description}
              </p>
            </section>

            {/* Features Grid */}
            <section className="mb-16">
              <h2 className="mb-6 text-2xl font-bold text-gray-900 sm:text-3xl">
                Keunggulan Kami
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {mitra.features?.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-4"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
                      ✓
                    </div>
                    <span className="font-medium text-gray-900">{feature}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Services */}
            <section className="mb-16">
              <h2 className="mb-6 text-2xl font-bold text-gray-900 sm:text-3xl">
                Layanan Kami
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mitra.services.map((service) => (
                  <div
                    key={service.name}
                    className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg"
                  >
                    <div className="mb-3 text-4xl">{service.icon}</div>
                    <h3 className="mb-2 text-lg font-bold text-gray-900">
                      {service.name}
                    </h3>
                    <p className="text-sm text-blue-600">{service.price}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Gallery */}
            {mitra.images && mitra.images.length > 0 && (
              <section className="mb-16">
                <h2 className="mb-6 text-2xl font-bold text-gray-900 sm:text-3xl">
                  Galeri
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {mitra.images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => {
                        setLightboxIndex(index)
                        setLightboxOpen(true)
                      }}
                      className="group overflow-hidden rounded-2xl"
                    >
                      <img
                        src={image.url}
                        alt={`Gallery ${index + 1}`}
                        className="h-48 w-full object-cover transition-transform group-hover:scale-110"
                      />
                    </button>
                  ))}
                </div>

                {/* Image Lightbox */}
                <ImageLightbox
                  images={mitra.images.map((img) => img.url)}
                  initialIndex={lightboxIndex}
                  isOpen={lightboxOpen}
                  onClose={() => setLightboxOpen(false)}
                />
              </section>
            )}

            {/* Contact Info */}
            <section className="mb-16">
              <h2 className="mb-6 text-2xl font-bold text-gray-900 sm:text-3xl">
                Informasi Kontak
              </h2>

              {/* Contact Details Only */}
              <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 sm:p-8">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 flex-shrink-0 text-blue-600" />
                    <span className="text-sm text-gray-700 sm:text-base">
                      {mitra.phone}
                    </span>
                  </div>
                  {mitra.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 flex-shrink-0 text-blue-600" />
                      <span className="text-sm text-gray-700 sm:text-base">
                        {mitra.email}
                      </span>
                    </div>
                  )}
                  {mitra.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 flex-shrink-0 text-blue-600" />
                      <a
                        href={
                          mitra.website.startsWith('http')
                            ? mitra.website
                            : `https://${mitra.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline sm:text-base"
                      >
                        {mitra.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Location Map Card */}
              <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
                <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
                  {/* Left: Address Info */}
                  <div className="flex flex-col justify-center bg-gradient-to-br from-blue-50 to-white p-6 sm:p-8">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-gray-900 sm:text-2xl">
                      Alamat Kantor
                    </h3>
                    <p className="mb-6 text-sm leading-relaxed text-gray-700 sm:text-base">
                      {mitra.address}
                    </p>

                    {/* Operating Hours */}
                    {(mitra.weekdayHours || mitra.weekendHours) && (
                      <div className="space-y-2 border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-semibold text-gray-900">
                          Jam Operasional
                        </h4>
                        {mitra.weekdayHours && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Clock className="h-4 w-4 text-green-600" />
                            <span>{mitra.weekdayHours}</span>
                          </div>
                        )}
                        {mitra.weekendHours && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span>{mitra.weekendHours}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: Google Maps */}
                  <div className="h-64 sm:h-80 lg:h-full lg:min-h-[400px]">
                    {mitra.latitude && mitra.longitude ? (
                      <GoogleMapsProvider>
                        <GoogleMapDisplay
                          latitude={mitra.latitude}
                          longitude={mitra.longitude}
                          address={mitra.address}
                          businessName={mitra.businessName}
                        />
                      </GoogleMapsProvider>
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gray-100">
                        <div className="text-center">
                          <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                          <p className="mt-2 text-sm text-gray-600">
                            Lokasi belum tersedia
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Reviews Section */}
            <section>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                  Ulasan Pelanggan
                </h2>

                {/* Review Button - Only for logged in customers who haven't reviewed */}
                {session?.user &&
                  session.user.role === 'CUSTOMER' &&
                  !userHasReview && (
                    <button
                      onClick={() => {
                        setEditingReview(null)
                        setIsReviewModalOpen(true)
                      }}
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      <Star className="h-5 w-5" />
                      Tulis Review
                    </button>
                  )}
              </div>

              {/* Review List */}
              <ReviewList
                mitraId={mitra.id}
                refreshTrigger={refreshReviews}
                currentUserId={session?.user?.id}
                onEditReview={(review) => {
                  setEditingReview(review)
                  setIsReviewModalOpen(true)
                }}
              />
            </section>

            {/* Review Modal */}
            <ReviewModal
              mitraId={mitra.id}
              existingReview={editingReview}
              isOpen={isReviewModalOpen}
              onClose={() => {
                setIsReviewModalOpen(false)
                setEditingReview(null)
              }}
              onSuccess={() => {
                setRefreshReviews((prev) => prev + 1)
              }}
            />
          </div>
        </div>
        <Footer variant="light" />
      </div>
    </>
  )
}
