'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden pb-16 pt-20 lg:snap-start">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1556656793-08538906a9f8?w=1920&q=80)',
          }}
        ></div>
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-blue-50/90 to-cyan-50/95"></div>
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-10 top-20 h-72 w-72 animate-pulse rounded-full bg-blue-400/20 blur-3xl"></div>
        <div className="absolute bottom-20 right-10 h-96 w-96 animate-pulse rounded-full bg-cyan-400/20 blur-3xl delay-700"></div>
        <div className="absolute left-1/2 top-1/2 h-80 w-80 animate-pulse rounded-full bg-purple-400/10 blur-3xl delay-1000"></div>
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 text-5xl font-bold leading-tight sm:text-6xl lg:text-7xl"
          >
            <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Servis Gadget
            </span>
            <br />
            <span className="text-gray-900">Jadi Lebih Mudah</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mb-12 hidden max-w-3xl text-xl leading-relaxed text-gray-600 sm:block sm:text-2xl"
          >
            Temukan teknisi profesional, beli sparepart original, dan sewa
            peralatan berkualitas dalam satu platform
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link
              href="/register"
              className="group flex transform items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-4 text-lg font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50"
            >
              Mulai Sekarang
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/dashboard/customer"
              className="transform rounded-full border-2 border-blue-300 bg-white px-8 py-4 text-lg font-semibold text-blue-700 transition-all duration-300 hover:scale-105 hover:border-blue-400 hover:bg-blue-50"
            >
              Lihat Katalog
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mx-auto mt-12 hidden max-w-3xl grid-cols-3 gap-4 sm:mt-16 sm:grid sm:gap-8"
          >
            <div className="text-center">
              <div className="mb-1 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-2xl font-bold text-transparent sm:mb-2 sm:text-3xl md:text-4xl">
                1000+
              </div>
              <div className="text-xs text-gray-600 sm:text-sm md:text-base">
                Teknisi Terdaftar
              </div>
            </div>
            <div className="text-center">
              <div className="mb-1 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-2xl font-bold text-transparent sm:mb-2 sm:text-3xl md:text-4xl">
                50K+
              </div>
              <div className="text-xs text-gray-600 sm:text-sm md:text-base">
                Servis Selesai
              </div>
            </div>
            <div className="text-center">
              <div className="mb-1 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-2xl font-bold text-transparent sm:mb-2 sm:text-3xl md:text-4xl">
                4.9★
              </div>
              <div className="text-xs text-gray-600 sm:text-sm md:text-base">
                Rating Pengguna
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 transform sm:block"
      >
        <div className="flex h-10 w-6 justify-center rounded-full border-2 border-blue-400">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="mt-2 h-3 w-1.5 rounded-full bg-blue-600"
          ></motion.div>
        </div>
      </motion.div>
    </section>
  )
}
