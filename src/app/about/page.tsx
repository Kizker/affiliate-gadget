'use client'

import React, { useEffect } from 'react'
import {
  motion,
  useSpring,
  useMotionValue,
  useMotionTemplate,
} from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Cpu,
  Shield,
  Zap,
  MoveRight,
} from 'lucide-react'
import Link from 'next/link'

// --- Hooks ---

function useMousePosition() {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  useEffect(() => {
    const updateMouse = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }
    window.addEventListener('mousemove', updateMouse)
    return () => window.removeEventListener('mousemove', updateMouse)
  }, [mouseX, mouseY])

  return { mouseX, mouseY }
}

// --- Shared Components ---

const BackButton = () => (
  <Link
    href="/"
    className="fixed left-8 top-8 z-50 flex items-center gap-2 rounded-full border border-slate-200 bg-white/50 px-5 py-3 text-sm font-medium text-slate-800 backdrop-blur-md transition-all hover:scale-105 hover:bg-white hover:pl-4 hover:shadow-xl"
  >
    <ArrowLeft className="h-4 w-4" />
    <span>Back to Home</span>
  </Link>
)

const AnimatedTitle = ({
  text,
  className,
}: {
  text: string
  className?: string
}) => {
  return (
    <span className={`inline-block overflow-hidden ${className}`}>
      <motion.span
        initial={{ y: '100%' }}
        whileInView={{ y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="inline-block"
      >
        {text}
      </motion.span>
    </span>
  )
}

// --- Background Component ---

const InteractiveBackground = () => {
  const { mouseX, mouseY } = useMousePosition()

  // Smooth out the mouse movement
  const smoothX = useSpring(mouseX, { stiffness: 50, damping: 20 })
  const smoothY = useSpring(mouseY, { stiffness: 50, damping: 20 })

  const bg = useMotionTemplate`radial-gradient(600px circle at ${smoothX}px ${smoothY}px, rgba(59, 130, 246, 0.15), transparent 80%)`

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-slate-50" />
      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Mouse Spotlight */}
      <motion.div
        className="absolute inset-0 z-10"
        style={{ background: bg }}
      />
    </div>
  )
}

// --- Sections ---

function HeroSection() {
  return (
    <section className="relative flex h-screen w-full snap-start items-center justify-center overflow-hidden px-4 text-center">
      {/* Real Tech Video Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 z-10 bg-black/40" />{' '}
        {/* Overlay for text readability */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover"
        >
          <source
            src="https://videos.pexels.com/video-files/3163534/3163534-uhd_3840_2160_30fps.mp4"
            type="video/mp4"
          />
        </video>
      </div>

      <div className="relative z-10 max-w-[95vw]">
        {/* Huge Typography - White because of video */}
        <div className="flex flex-col items-center leading-none tracking-tighter text-white">
          <motion.h1
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="text-[18vw] font-black leading-[0.8] sm:text-[12rem]"
          >
            HALO
          </motion.h1>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ delay: 0.5, duration: 1 }}
            className="mb-2 h-1 w-full bg-white sm:mb-4 sm:h-4"
          />
          <motion.h1
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
            className="text-[18vw] font-thin leading-[0.8] text-white/80 sm:text-[12rem]"
          >
            TEKNO
          </motion.h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-8 sm:mt-12"
        >
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-white/80 sm:text-xl sm:tracking-[0.5em]">
            The Future of Tech Care
          </p>
        </motion.div>
      </div>
    </section>
  )
}

function PhilosophySection() {
  return (
    <section className="relative flex h-screen w-full snap-start items-center justify-center px-4">
      <div className="relative z-10 w-full max-w-5xl">
        <div className="flex flex-col items-center space-y-6 text-center sm:space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-slate-400 shadow-sm sm:px-6 sm:py-2 sm:text-sm"
          >
            Philosophy
          </motion.div>

          <div className="text-3xl font-medium leading-[1.2] text-slate-900 sm:text-6xl md:text-7xl">
            <div className="flex flex-wrap justify-center gap-x-2">
              <AnimatedTitle text="We don't just fix." />
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-x-2">
              <AnimatedTitle text="We" />
              <span className="font-serif italic text-blue-600">
                <AnimatedTitle text="revitalize." />
              </span>
            </div>

            <div className="mt-6 sm:mt-8">
              <span className="block text-2xl leading-tight text-slate-400 sm:text-5xl md:text-6xl">
                Technology is your superpower. <br /> We keep it flying.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ServicesPreviewSection() {
  const [activeIndex, setActiveIndex] = React.useState(0)
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)

  const items = [
    {
      title: 'Precision',
      icon: <Cpu />,
      desc: 'Micro-soldering & logic board diagnostics.',
    },
    {
      title: 'Speed',
      icon: <Zap />,
      desc: 'Same-day turnaround for most services.',
    },
    {
      title: 'Trust',
      icon: <Shield />,
      desc: 'Transparent process & data privacy.',
    },
  ]

  // Auto-scroll effect
  React.useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const nextIndex = (prev + 1) % items.length

        // Scroll to next card
        const cardWidth = container.scrollWidth / items.length
        container.scrollTo({
          left: cardWidth * nextIndex,
          behavior: 'smooth',
        })

        return nextIndex
      })
    }, 3000) // Change card every 3 seconds

    return () => clearInterval(interval)
  }, [items.length])

  return (
    <section className="relative flex h-screen w-full snap-start flex-col items-center justify-center overflow-hidden">
      {/* Center Content Vertically */}
      <div className="flex h-full w-full max-w-7xl flex-col justify-center px-4 sm:block sm:h-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-6 text-center text-3xl font-light tracking-tight text-slate-900 sm:mb-16 sm:text-4xl"
        >
          Premium Standards
        </motion.h2>

        {/* Scroll indicators for mobile */}
        <div className="mb-4 flex items-center justify-center gap-2 sm:hidden">
          {items.map((_, index) => (
            <div
              key={index}
              className={`h-1 w-12 rounded-full transition-all duration-300 ${
                index === activeIndex ? 'w-16 bg-blue-600' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Mobile: Horizontal Carousel | Desktop: Grid */}
        <div className="relative">
          <div
            ref={scrollContainerRef}
            className="scrollbar-hide flex w-full snap-x snap-mandatory gap-4 overflow-x-auto pb-8 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:pb-0"
          >
            {items.map((item, i) => (
              <motion.div
                key={i}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.2, duration: 0.8 }}
                viewport={{ once: true }}
                className="group relative flex min-w-[90vw] flex-shrink-0 snap-center flex-col justify-between overflow-hidden rounded-[2.5rem] bg-white p-6 shadow-xl shadow-slate-200/50 transition-all hover:-translate-y-2 hover:shadow-blue-200/50 sm:h-[500px] sm:min-w-0 sm:p-8"
              >
                <div>
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-50 text-slate-900 transition-colors group-hover:bg-blue-600 group-hover:text-white sm:mb-8 sm:h-20 sm:w-20">
                    {React.cloneElement(
                      item.icon as React.ReactElement<{ className?: string }>,
                      { className: 'w-7 h-7 sm:w-10 sm:h-10' }
                    )}
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-slate-900 sm:mb-4 sm:text-4xl">
                    {item.title}
                  </h3>
                  <p className="break-words text-sm text-slate-500 sm:text-lg">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-6 sm:mt-0 sm:pt-8">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400 sm:text-sm">
                    Available
                  </span>
                  <MoveRight className="ml-auto h-6 w-6 text-slate-300 transition-transform group-hover:translate-x-2 group-hover:text-blue-600" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function StatsSection() {
  const stats = [
    { label: 'Happy Clients', value: '5000', suffix: '+' },
    { label: 'Devices Fixed', value: '12', suffix: 'k' },
    { label: 'Expert Partners', value: '150', suffix: '+' },
  ]

  return (
    <section className="relative flex h-screen w-full snap-start items-center justify-center">
      <div className="relative z-10 flex w-full max-w-6xl flex-col items-center justify-center gap-12 px-4 text-center sm:grid sm:grid-cols-3 sm:gap-16">
        {stats.map((stat, i) => (
          <div key={i} className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 100 }}
              viewport={{ once: true }}
              className="flex items-baseline"
            >
              <span className="text-7xl font-black tracking-tighter text-slate-900 sm:text-[10rem]">
                {stat.value}
              </span>
              <span className="ml-1 text-4xl font-thin text-blue-600 sm:ml-2 sm:text-6xl">
                {stat.suffix}
              </span>
            </motion.div>
            <span className="mt-2 text-sm font-bold uppercase tracking-[0.3em] text-slate-500 sm:mt-8 sm:text-lg sm:tracking-[0.4em]">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="relative flex h-screen w-full snap-start items-center justify-center overflow-hidden px-4">
      <div className="z-10 max-w-5xl text-center">
        <motion.h2
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-10 text-5xl font-black tracking-tighter text-slate-900 sm:mb-16 sm:text-7xl md:text-9xl"
        >
          READY TO <br />
          <span className="relative inline-block">
            <span className="relative z-10 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              UPGRADE?
            </span>
            <motion.span
              initial={{ width: 0 }}
              whileInView={{ width: '100%' }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="absolute bottom-2 left-0 -z-0 h-4 w-full -rotate-2 bg-blue-100/50 sm:bottom-4 sm:h-8"
            />
          </span>
        </motion.h2>

        <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
          <Link
            href="/dashboard/customer"
            className="group relative h-16 w-56 overflow-hidden rounded-full bg-slate-900 text-white transition-all hover:w-60 hover:shadow-2xl sm:h-20 sm:w-64 sm:hover:w-72"
          >
            <div className="absolute inset-0 flex items-center justify-center text-lg font-bold transition-transform group-hover:-translate-y-full sm:text-xl">
              Explore Services
            </div>
            <div className="absolute inset-0 flex translate-y-full items-center justify-center text-lg font-bold text-blue-400 transition-transform group-hover:translate-y-0 sm:text-xl">
              Let&apos;s Go{' '}
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </Link>
        </div>

        <footer className="absolute bottom-8 left-0 w-full text-center sm:bottom-12">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-300 sm:text-xs">
            &copy; 2025 HaloTekno Inc.
          </p>
        </footer>
      </div>
    </section>
  )
}

export default function AboutPage() {
  return (
    <main className="relative h-screen w-full overflow-hidden bg-slate-50 selection:bg-blue-200 selection:text-blue-900">
      <InteractiveBackground />
      <BackButton />

      {/* Snap Scroll Container */}
      <div className="relative z-10 h-screen w-full snap-y snap-mandatory overflow-y-scroll scroll-smooth">
        <HeroSection />
        <PhilosophySection />
        <ServicesPreviewSection />
        <StatsSection />
        <CTASection />
      </div>
    </main>
  )
}
