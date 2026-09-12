'use client'

import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import { SectionHeroClean } from '@/components/landing/section-hero-clean'
import { SectionTrustPillars } from '@/components/landing/section-trust-pillars'
import { SectionFeaturedGadgets } from '@/components/landing/section-featured-gadgets'
import { SectionStoreSpotlight } from '@/components/landing/section-store-spotlight'

export default function HomePage() {
  return (
    <>
      {/* Navbar fixed di atas, di luar scroll container */}
      <Navbar variant="light" />

      {/* Scroll snap container — fullscreen scroll */}
      <div
        id="snap-container"
        className="h-screen overflow-y-scroll bg-white text-slate-900 [scrollbar-width:none] selection:bg-orange-500 selection:text-white dark:bg-slate-950 dark:text-slate-100 [&::-webkit-scrollbar]:hidden"
      >
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
      </div>
    </>
  )
}
