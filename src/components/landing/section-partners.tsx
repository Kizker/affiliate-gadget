'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Star, BadgeCheck, MapPin } from 'lucide-react'

interface Mitra {
  id: string
  businessName: string
  description: string | null
  banner: string | null
  city: string
  rating: number
  totalReview: number
}

export default function SectionPartners() {
  const [partners, setPartners] = useState<Mitra[]>([])

  useEffect(() => {
    fetch('/api/mitra/list?sortBy=rating&sortOrder=desc&limit=4')
      .then((res) => res.json())
      .then((data) => setPartners(data.mitras || []))
      .catch(console.error)
  }, [])

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-gradient-to-br from-cyan-50/60 via-white to-blue-50/50">
      {/* Background Image */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1920&q=80)',
          }}
        />
      </div>

      {/* Animated Background Blobs */}
      <div className="absolute inset-0">
        <div className="absolute -right-10 top-10 h-48 w-48 animate-pulse rounded-full bg-blue-400/20 blur-3xl sm:h-96 sm:w-96" />
        <div
          className="absolute -left-10 bottom-10 h-40 w-40 animate-pulse rounded-full bg-cyan-400/20 blur-3xl sm:h-80 sm:w-80"
          style={{ animationDelay: '1s' }}
        />
      </div>

      <div className="container relative z-10 mx-auto px-4 py-4 sm:px-6 sm:py-16 lg:px-8">
        {/* Mobile Layout */}
        <div className="flex min-h-screen flex-col justify-center lg:hidden">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            {/* Content - Top */}
            <span className="mb-3 inline-block rounded-full bg-cyan-100 px-4 py-1.5 text-xs font-medium text-cyan-700">
              🏪 Mitra Terpercaya
            </span>
            <h2 className="mb-3 text-3xl font-bold leading-tight text-gray-900">
              Temukan
              <br />
              <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                Service Center
              </span>
            </h2>
            <p className="mx-auto mb-6 max-w-sm text-sm text-gray-600">
              Mitra service center terverifikasi dengan teknisi profesional dan
              sparepart original. Cari yang terdekat dari lokasimu.
            </p>

            {/* Trust Badges - Compact */}
            <div className="mb-6 flex justify-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-2 shadow-md">
                <BadgeCheck className="h-4 w-4 text-green-500" />
                <span className="text-xs font-medium text-gray-700">
                  Verified
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-2 shadow-md">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium text-gray-700">4.5+</span>
              </div>
            </div>

            {/* Featured Image - After Content */}
            {partners[0] && (
              <Link href={`/rekomendasi/${partners[0].id}`}>
                <div className="mx-auto mb-6 max-w-sm cursor-pointer overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl">
                  <div className="relative h-48">
                    <Image
                      src={
                        partners[0].banner ||
                        'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&h=400&fit=crop'
                      }
                      alt={partners[0].businessName}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4">
                      <div className="flex items-center gap-1.5">
                        <span className="line-clamp-1 text-base font-bold text-white">
                          {partners[0].businessName}
                        </span>
                        <BadgeCheck className="h-4 w-4 flex-shrink-0 text-blue-300" />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-white/90">
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          {partners[0].rating.toFixed(1)}
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {partners[0].city}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            <Link
              href="/rekomendasi"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105"
            >
              Lihat Mitra
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-2 lg:items-center lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="grid grid-cols-2 gap-4">
              {partners.slice(0, 4).map((partner, idx) => (
                <Link key={partner.id} href={`/rekomendasi/${partner.id}`}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.08 }}
                    className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                  >
                    <Image
                      src={
                        partner.banner ||
                        `https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=300&fit=crop`
                      }
                      alt={partner.businessName}
                      fill
                      className="object-cover transition-transform group-hover:scale-110"
                    />
                    <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-transparent to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="mb-1 flex items-center gap-1">
                        <span className="line-clamp-1 text-sm font-semibold text-white">
                          {partner.businessName}
                        </span>
                        <BadgeCheck className="h-4 w-4 flex-shrink-0 text-blue-300" />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/90">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{partner.rating.toFixed(1)}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{partner.city}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="mb-4 inline-block rounded-full bg-cyan-100 px-4 py-2 text-sm font-medium text-cyan-700">
              🏪 Mitra Terpercaya
            </span>
            <h2 className="mb-6 text-4xl font-bold leading-tight text-gray-900 xl:text-6xl">
              Temukan
              <br />
              <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                Service Center
              </span>
            </h2>
            <p className="mb-8 max-w-md text-lg text-gray-600">
              Mitra service center terverifikasi dengan teknisi profesional dan
              sparepart original.
            </p>

            <div className="mb-8 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-md">
                <BadgeCheck className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-gray-700">
                  Terverifikasi
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-md">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium text-gray-700">
                  Rating 4.5+
                </span>
              </div>
            </div>

            <Link
              href="/rekomendasi"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 px-8 py-4 font-semibold text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/30"
            >
              Lihat Semua Mitra
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
