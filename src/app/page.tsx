'use client'

import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import Hero from '@/components/shared/hero'
import SectionServices from '@/components/landing/section-services'
import SectionSparepart from '@/components/landing/section-sparepart'
import SectionRental from '@/components/landing/section-rental'
import SectionPartners from '@/components/landing/section-partners'
import { useEffect, useRef, useState, useCallback } from 'react'

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentSection, setCurrentSection] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isMobile, setIsMobile] = useState(true)
  const totalSections = 5 // Hero, Services, Sparepart, Rental, Partners+Footer

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const scrollToSection = useCallback(
    (sectionIndex: number) => {
      const container = containerRef.current
      if (!container || isAnimating) return

      const clampedIndex = Math.max(
        0,
        Math.min(sectionIndex, totalSections - 1)
      )
      if (clampedIndex === currentSection) return

      setIsAnimating(true)
      const targetScroll = clampedIndex * window.innerHeight

      // Smooth scroll animation
      const startScroll = container.scrollTop
      const distance = targetScroll - startScroll
      const duration = 600
      let startTime: number | null = null

      const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4)

      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)

        container.scrollTop = startScroll + distance * easeOutQuart(progress)

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setCurrentSection(clampedIndex)
          setIsAnimating(false)
        }
      }

      requestAnimationFrame(animate)
    },
    [currentSection, isAnimating, totalSections]
  )

  useEffect(() => {
    if (isMobile) return

    const container = containerRef.current
    if (!container) return

    let wheelTimeout: NodeJS.Timeout

    const handleWheel = (e: WheelEvent) => {
      // If we're on the last section, allow free scrolling
      if (currentSection === totalSections - 1) {
        // Don't prevent default, allow normal scrolling
        return
      }

      e.preventDefault()

      if (isAnimating) return

      clearTimeout(wheelTimeout)
      wheelTimeout = setTimeout(() => {
        if (e.deltaY > 0) {
          // Scroll down
          scrollToSection(currentSection + 1)
        } else if (e.deltaY < 0) {
          // Scroll up
          scrollToSection(currentSection - 1)
        }
      }, 50)
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [isMobile, isAnimating, currentSection, scrollToSection, totalSections])

  // Handle keyboard navigation
  useEffect(() => {
    if (isMobile) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnimating) return

      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault()
        scrollToSection(currentSection + 1)
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        scrollToSection(currentSection - 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMobile, isAnimating, currentSection, scrollToSection])

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar variant="light" />

      {/* Desktop - Custom smooth snap scroll */}
      <div
        ref={containerRef}
        className="hidden lg:block lg:h-screen lg:overflow-y-auto"
      >
        <div className="min-h-screen">
          <Hero />
        </div>
        <div className="min-h-screen">
          <SectionServices />
        </div>
        <div className="min-h-screen">
          <SectionSparepart />
        </div>
        <div className="min-h-screen">
          <SectionRental />
        </div>
        <div>
          <SectionPartners />
          <Footer variant="light" />
        </div>
      </div>

      {/* Mobile - Normal scroll */}
      <div className="lg:hidden">
        <Hero />
        <SectionServices />
        <SectionSparepart />
        <SectionRental />
        <SectionPartners />
        <Footer variant="light" />
      </div>
    </div>
  )
}
