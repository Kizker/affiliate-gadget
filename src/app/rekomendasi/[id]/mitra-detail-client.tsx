'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import { MobileTopNav } from '@/components/layouts/mobile-top-nav'
import { useMitraAnalytics } from '@/hooks/use-mitra-analytics'

import type { MitraDetail } from '@/types/mitra-detail'
import {
  MitraHero,
  MitraEditorialBanner,
  MitraServiceCatalog,
  MitraFeatures,
  MitraGallery,
  MitraInfo,
  MitraReviews,
  MitraChatPopup,
  MitraMobileView,
} from '@/components/rekomendasi'

export type { MitraDetail, ServiceItem, MitraImage } from '@/types/mitra-detail'

interface MitraDetailClientProps {
  mitra: MitraDetail
  initialUserHasReview?: boolean
  randomEditorialImage?: string | null
  initialIsMobile?: boolean
}

export default function MitraDetailClient({
  mitra,
  initialUserHasReview = false,
  randomEditorialImage = null,
  initialIsMobile = false,
}: MitraDetailClientProps) {
  const router = useRouter()
  const { data: session, status } = useSession()

  // Track page view and inquiries with lightweight hook (Task 5.1)
  const { trackInquiry } = useMitraAnalytics(mitra.id)

  const [userHasReview, setUserHasReview] = useState(initialUserHasReview)

  // Lightweight check for user review using dedicated user-status endpoint (Task 1.1 & 1.2)
  const checkUserReview = useCallback(async () => {
    if (!session?.user?.id || !mitra.id || initialUserHasReview) return

    try {
      const response = await fetch(
        `/api/reviews/user-status?mitraId=${encodeURIComponent(mitra.id)}`
      )
      if (response.ok) {
        const data = await response.json()
        setUserHasReview(Boolean(data.hasReview))
      }
    } catch (error) {
      console.error('Error checking user review status:', error)
    }
  }, [session?.user?.id, mitra.id, initialUserHasReview])

  useEffect(() => {
    checkUserReview()
  }, [checkUserReview])

  // Memoized URL computations (Task 5.2)
  const heroImageSrc = useMemo(() => {
    return (
      mitra.banner ||
      (mitra.images && mitra.images.length > 0 ? mitra.images[0].url : '') ||
      '/images/service/service-roxy.jpg'
    )
  }, [mitra.banner, mitra.images])

  const whatsAppUrl = useMemo(() => {
    const phoneClean = (mitra.whatsapp || mitra.phone).replace(/[^0-9]/g, '')
    const phoneFormatted = phoneClean.startsWith('0')
      ? '62' + phoneClean.slice(1)
      : phoneClean
    const text = encodeURIComponent(
      `Halo ${mitra.businessName}, saya menemukan profil workshop Anda di Affiliate Gadget dan ingin konsultasi servis gadget.`
    )
    return `https://wa.me/${phoneFormatted}?text=${text}`
  }, [mitra.whatsapp, mitra.phone, mitra.businessName])

  const mapsUrl = useMemo(() => {
    if (mitra.mapsUrl && mitra.mapsUrl.trim().startsWith('http')) {
      return mitra.mapsUrl.trim()
    }
    if (mitra.latitude && mitra.longitude) {
      return `https://maps.google.com/?q=${mitra.latitude},${mitra.longitude}`
    }
    const query = [mitra.businessName, mitra.address, mitra.city]
      .filter(Boolean)
      .join(', ')
    return `https://maps.google.com/?q=${encodeURIComponent(query)}`
  }, [
    mitra.mapsUrl,
    mitra.latitude,
    mitra.longitude,
    mitra.businessName,
    mitra.address,
    mitra.city,
  ])

  // Live chat URL builder
  const getChatUrl = useCallback(
    (serviceName?: string) => {
      const greeting = serviceName
        ? `Halo ${mitra.businessName}, saya ingin konsultasi dan estimasi biaya perbaikan "${serviceName}".`
        : `Halo ${mitra.businessName}, saya ingin konsultasi dan booking servis gadget.`
      return `/dashboard/customer/chat?mitraId=${mitra.id}&mitraName=${encodeURIComponent(
        mitra.businessName
      )}&mitraCity=${encodeURIComponent(mitra.city)}&mitraImage=${encodeURIComponent(
        mitra.banner || ''
      )}&serviceContext=${encodeURIComponent(greeting)}`
    },
    [mitra.id, mitra.businessName, mitra.city, mitra.banner]
  )

  // Direct booking handler
  const handleBookingChat = useCallback(
    (e?: React.MouseEvent, serviceName?: string) => {
      if (e) e.preventDefault()
      trackInquiry()
      const url = getChatUrl(serviceName)
      if (status === 'unauthenticated') {
        router.push(`/login?callbackUrl=${encodeURIComponent(url)}`)
        return
      }
      router.push(url)
    },
    [trackInquiry, getChatUrl, status, router]
  )

  // Share handler
  const handleShare = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator
        .share({
          title: mitra.businessName,
          text: `Servis gadget profesional di ${mitra.businessName}, ${mitra.city}. Teknisi bersertifikat & bergaransi!`,
          url: typeof window !== 'undefined' ? window.location.href : '',
        })
        .catch(() => {})
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Tautan profil mitra disalin ke clipboard')
    }
  }, [mitra.businessName, mitra.city])

  return (
    <div className="min-h-screen bg-white text-black selection:bg-neutral-900 selection:text-white dark:bg-neutral-950 dark:text-white md:h-screen md:overflow-hidden">
      {/* ─────────────────────────────────────────────────────────────
          1. MOBILE VIEW: WORLD-CLASS CLEAN, SIMPLE & ELEGANT LAYOUT
          Cupertino Studio / Airbnb style with interactive tabs,
          clean cards, and floating conversion bar
      ───────────────────────────────────────────────────────────── */}
      <div className="block md:hidden">
        <div className="hidden">
          <MobileTopNav
            showBack={true}
            backHref="/servis"
            title={mitra.businessName}
          />
        </div>
        <MitraMobileView
          mitra={mitra}
          heroImageSrc={heroImageSrc}
          whatsAppUrl={whatsAppUrl}
          mapsUrl={mapsUrl}
          onBookingChat={handleBookingChat}
          onShare={handleShare}
          userHasReview={userHasReview}
          session={session}
          onReviewCreatedOrUpdated={() => setUserHasReview(true)}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. DESKTOP VIEW: SNAP SCROLL FULLSCREEN (100vh) CONTAINER
          Preserved 100% for desktop browser experience & full test suite
      ───────────────────────────────────────────────────────────── */}
      <div className="hidden md:block md:h-screen md:overflow-hidden">
        <Navbar variant="light" />
        <main
          id="snap-container"
          className="md:snap-container w-full [scrollbar-width:none] md:h-screen md:snap-y md:snap-mandatory md:overflow-y-scroll [&::-webkit-scrollbar]:hidden"
        >
          {/* Hero Sections (Desktop) */}
          <MitraHero
            mitra={mitra}
            heroImageSrc={heroImageSrc}
            onBookingChat={handleBookingChat}
            onShare={handleShare}
            whatsAppUrl={whatsAppUrl}
            mapsUrl={mapsUrl}
            initialIsMobile={initialIsMobile}
          />

          {/* 2. Editorial Campaign Banner */}
          <MitraEditorialBanner
            mitra={mitra}
            heroImageSrc={heroImageSrc}
            onBookingChat={handleBookingChat}
            randomImageSrc={randomEditorialImage}
            initialIsMobile={initialIsMobile}
          />

          {/* 3. Katalog Layanan & Estimasi Biaya */}
          <MitraServiceCatalog
            services={mitra.services}
            businessName={mitra.businessName}
            onBookingChat={handleBookingChat}
            initialIsMobile={initialIsMobile}
          />

          {/* 4. Keunggulan Workshop */}
          <MitraFeatures
            features={mitra.features}
            businessName={mitra.businessName}
            initialIsMobile={initialIsMobile}
          />

          {/* 5. Galeri Workshop & Fasilitas */}
          <MitraGallery
            images={mitra.images}
            businessName={mitra.businessName}
            initialIsMobile={initialIsMobile}
          />

          {/* 6. Informasi Workshop & Lokasi Resmi */}
          <MitraInfo
            mitra={mitra}
            mapsUrl={mapsUrl}
            onBookingChat={handleBookingChat}
            initialIsMobile={initialIsMobile}
          />

          {/* 7. Ulasan Pelanggan */}
          <MitraReviews
            mitraId={mitra.id}
            rating={mitra.rating}
            totalReview={mitra.totalReview}
            userHasReview={userHasReview}
            session={session}
            initialReviews={mitra.reviews}
            onReviewCreatedOrUpdated={() => setUserHasReview(true)}
            initialIsMobile={initialIsMobile}
          />

          {/* 8. Desktop Footer */}
          <Footer variant="light" />
        </main>

        {/* 9. Desktop Floating Technician Chat Popup */}
        <MitraChatPopup
          businessName={mitra.businessName}
          heroImageSrc={heroImageSrc}
          onBookingChat={handleBookingChat}
        />
      </div>
    </div>
  )
}
