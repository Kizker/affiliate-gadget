'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Navbar, Footer } from '@/components/layouts'
import { SectionHeroClean } from '@/components/landing/section-hero-clean'
import { SectionTrustPillars } from '@/components/landing/section-trust-pillars'
import { SectionFeaturedGadgets } from '@/components/landing/section-featured-gadgets'
import { SectionStoreSpotlight } from '@/components/landing/section-store-spotlight'
import { useIsMobile } from '@/hooks/use-is-mobile'
import GadgetKatalogPage from '@/app/gadget/page'

interface HomeClientProps {
  initialIsMobile: boolean
}

export function HomeClient({ initialIsMobile }: HomeClientProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const isMobile = useIsMobile(768, initialIsMobile)

  useEffect(() => {
    if (session?.user?.role === 'AFTER_SALES') {
      router.replace('/dashboard/after-sales')
      return
    }
  }, [session?.user?.role, router])

  return (
    <>
      {/* Media-scoped preload for Level 1 Ad poster — speeds up mobile Frame-1 LCP while preventing desktop unused preload */}
      <link
        rel="preload"
        as="image"
        href="/uploads/ads/1790671997412-zuzb6l-poster.webp"
        media="(max-width: 768px)"
        fetchPriority="high"
      />

      {/* 1. Mobile View — Katalog Gadget sebagai Beranda Mobile Tunggal */}
      {isMobile ? (
        <div className="block md:hidden">
          <GadgetKatalogPage />
        </div>
      ) : (
        /* 2. Desktop View — Natural Scroll Layout */
        <div className="hidden md:block">
          {/* Navbar fixed di atas */}
          <Navbar variant="light" />

          {/* Natural scroll layout */}
          <main className="min-h-screen bg-white text-slate-900 selection:bg-orange-500 selection:text-white dark:bg-slate-950 dark:text-slate-100">
            {/* 1. Hero — Section 1 */}
            <SectionHeroClean />

            {/* 2. Trust Pillars — Section 2 */}
            <SectionTrustPillars />

            {/* 3. Featured Gadgets — Section 3 */}
            <SectionFeaturedGadgets />

            {/* 4. Store Spotlight — Section 4 */}
            <SectionStoreSpotlight />

            {/* 5. Footer — Section 5 */}
            <Footer variant="light" />
          </main>
        </div>
      )}
    </>
  )
}
