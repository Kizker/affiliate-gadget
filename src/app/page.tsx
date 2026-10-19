'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Navbar, Footer } from '@/components/layouts'
import { SectionHeroClean } from '@/components/landing/section-hero-clean'
import { SectionTrustPillars } from '@/components/landing/section-trust-pillars'
import { SectionFeaturedGadgets } from '@/components/landing/section-featured-gadgets'
import { SectionStoreSpotlight } from '@/components/landing/section-store-spotlight'
import { useIsMobile } from '@/hooks/use-is-mobile'

const GadgetKatalogPage = dynamic(() => import('@/app/gadget/page'), {
  ssr: false,
})

export default function HomePage() {
  const router = useRouter()
  const isMobile = useIsMobile(768)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Pada mode mobile, halaman beranda ditiadakan karena redundan dengan katalog yang kini menjadi Beranda
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      const searchStr = window.location.search || ''
      router.replace(`/gadget${searchStr}`)
    }
  }, [router])

  return (
    <>
      {/* 1. Mobile View — Katalog Gadget sebagai Beranda Mobile Tunggal */}
      {(!mounted || isMobile) && (
        <div
          className={`block md:hidden ${mounted && !isMobile ? 'hidden' : ''}`}
        >
          <GadgetKatalogPage />
        </div>
      )}

      {/* 2. Desktop View — Natural Scroll Layout (Snap Scroll Removed) */}
      {(!mounted || !isMobile) && (
        <div
          className={`hidden md:block ${mounted && isMobile ? '!hidden' : ''}`}
        >
          {/* Navbar fixed di atas */}
          <Navbar variant="light" />

          {/* Natural scroll layout — snap scroll disabled */}
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
