'use client'

import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import { SectionHeroClean } from '@/components/landing/section-hero-clean'
import { SectionTrustPillars } from '@/components/landing/section-trust-pillars'
import { SectionFeaturedGadgets } from '@/components/landing/section-featured-gadgets'
import { SectionStoreSpotlight } from '@/components/landing/section-store-spotlight'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-orange-500 selection:text-white dark:bg-slate-950 dark:text-slate-100">
      {/* Sticky Modern Top Header */}
      <Navbar variant="light" />

      {/* Streamlined Modern Minimalist Content Flow */}
      <main>
        {/* 1. Hero Showcase: High impact, spacious, clear value proposition */}
        <SectionHeroClean />

        {/* 2. Trust Pillars: 3 core reassurances (Garansi 30 Hari, Bonus 3-in-1, Toko Resmi) */}
        <SectionTrustPillars />

        {/* 3. Curated Featured Gadgets: Instant brand filter & high-contrast product cards */}
        <SectionFeaturedGadgets />

        {/* 4. Physical Stores & Branches: Verifiable credibility & physical presence */}
        <SectionStoreSpotlight />
      </main>

      {/* Modern Clean Footer */}
      <Footer variant="light" />
    </div>
  )
}
