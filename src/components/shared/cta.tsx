'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function CTA() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-10 top-10 h-72 w-72 animate-pulse rounded-full bg-blue-400/10 blur-3xl"></div>
        <div className="absolute bottom-10 right-10 h-96 w-96 animate-pulse rounded-full bg-orange-500/15 blur-3xl delay-700"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <h2 className="mb-6 text-3xl font-bold text-white sm:text-5xl lg:text-6xl">
          Siap Memulai Perjalanan
          <br />
          <span className="text-orange-400">Teknologi Anda?</span>
        </h2>

        <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-blue-100 sm:text-xl">
          Bergabunglah dengan ribuan pengguna yang telah mempercayai Affiliate Gadget
          untuk solusi teknologi mereka
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/register"
            className="group flex w-full transform items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-4 text-lg font-bold text-white shadow-xl shadow-orange-500/30 transition-all duration-300 hover:scale-105 hover:from-orange-600 hover:to-orange-700 sm:w-auto"
          >
            Daftar Sekarang
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/teknisi"
            className="w-full transform rounded-full border-2 border-white/80 bg-white/10 px-8 py-4 text-lg font-bold text-white backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/20 sm:w-auto"
          >
            Lihat Layanan
          </Link>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 flex flex-wrap justify-center gap-8 text-white/90">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-orange-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm sm:text-base">Gratis Konsultasi</span>
          </div>
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-orange-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm sm:text-base">Garansi Resmi</span>
          </div>
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-orange-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm sm:text-base">Support 24/7</span>
          </div>
        </div>
      </div>
    </section>
  )
}
