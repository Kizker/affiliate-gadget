'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function Hero() {
  return (
    <section
      className="relative flex min-h-screen items-center justify-center overflow-hidden pb-16 pt-20 lg:snap-start"
      aria-label="Hero section"
    >
      {/* Background Image with Next.js Image Optimization */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-bg.jpg"
          alt="Smartphone repair background"
          fill
          priority
          quality={75}
          sizes="100vw"
          className="object-cover"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/98 via-slate-50/90 to-blue-50/60" />
      </div>

      {/* Animated Background Elements - CSS only, no Framer Motion */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-10 top-20 h-72 w-72 animate-pulse rounded-full bg-blue-500/15 blur-3xl" />
        <div
          className="absolute bottom-20 right-10 h-96 w-96 animate-pulse rounded-full bg-orange-400/15 blur-3xl"
          style={{ animationDelay: '0.7s' }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-80 w-80 animate-pulse rounded-full bg-blue-400/10 blur-3xl"
          style={{ animationDelay: '1s' }}
        />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          {/* Main Heading - Simplified, CSS animations */}
          <h1 className="mb-6 text-5xl font-bold leading-tight sm:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-800 bg-clip-text text-transparent">
              Servis Gadget
            </span>
            <br />
            <span className="text-gray-900">Jadi Lebih Mudah</span>
          </h1>

          {/* Subtitle */}
          <p
            className="animate-fade-in-up mx-auto mb-12 hidden max-w-3xl text-xl leading-relaxed text-gray-600 sm:block sm:text-2xl"
            style={{ animationDelay: '0.1s' }}
          >
            Temukan teknisi profesional, beli sparepart original, dan sewa
            peralatan berkualitas dalam satu platform
          </p>

          {/* CTA Buttons */}
          <div
            className="animate-fade-in-up flex flex-col items-center justify-center gap-4 sm:flex-row"
            style={{ animationDelay: '0.2s' }}
          >
            <Link
              href="/register"
              className="group flex transform items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-orange-500/25 transition-all duration-300 hover:scale-105 hover:from-orange-600 hover:to-orange-700 hover:shadow-2xl hover:shadow-orange-500/40"
              aria-label="Mulai registrasi akun baru"
            >
              Mulai Sekarang
              <ArrowRight
                className="h-5 w-5 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
            <Link
              href="/gadget"
              className="transform rounded-full border-2 border-blue-600 bg-white px-8 py-4 text-lg font-semibold text-blue-700 shadow-sm transition-all duration-300 hover:scale-105 hover:bg-blue-50 hover:text-blue-800"
              aria-label="Lihat katalog produk dan layanan"
            >
              Lihat Katalog
            </Link>
          </div>

          {/* Stats */}
          <div
            className="animate-fade-in-up mx-auto mt-12 hidden max-w-3xl grid-cols-3 gap-4 sm:mt-16 sm:grid sm:gap-8"
            style={{ animationDelay: '0.3s' }}
          >
            <div className="text-center">
              <div className="mb-1 text-2xl font-bold text-blue-700 sm:mb-2 sm:text-3xl md:text-4xl">
                1000+
              </div>
              <div className="text-xs text-gray-600 sm:text-sm md:text-base">
                Teknisi Terdaftar
              </div>
            </div>
            <div className="text-center">
              <div className="mb-1 text-2xl font-bold text-orange-600 sm:mb-2 sm:text-3xl md:text-4xl">
                5000+
              </div>
              <div className="text-xs text-gray-600 sm:text-sm md:text-base">
                Gadget Diperbaiki
              </div>
            </div>
            <div className="text-center">
              <div className="mb-1 text-2xl font-bold text-blue-700 sm:mb-2 sm:text-3xl md:text-4xl">
                4.9★
              </div>
              <div className="text-xs text-gray-600 sm:text-sm md:text-base">
                Rating Kepuasan
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator - Simplified CSS animation */}
      <div
        className="animate-fade-in absolute bottom-8 left-1/2 hidden -translate-x-1/2 transform sm:block"
        style={{ animationDelay: '1s' }}
        aria-hidden="true"
      >
        <div className="flex h-10 w-6 justify-center rounded-full border-2 border-blue-400">
          <div className="mt-2 h-3 w-1.5 animate-bounce rounded-full bg-blue-600" />
        </div>
      </div>
    </section>
  )
}
