'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Clock, Shield, Banknote } from 'lucide-react'

interface RentalItem {
  id: string
  name: string
  description: string | null
  pricePerDay: number
  images: string[]
}

export default function SectionRental() {
  const [items, setItems] = useState<RentalItem[]>([])

  useEffect(() => {
    fetch('/api/rental-items?limit=4&sortBy=rating')
      .then((res) => res.json())
      .then((data) => setItems(data.rentalItems || []))
      .catch(console.error)
  }, [])

  const benefits = [
    { icon: Clock, title: 'Fleksibel' },
    { icon: Shield, title: 'Terawat' },
    { icon: Banknote, title: 'Aman' },
  ]

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-gradient-to-br from-white via-blue-50/50 to-cyan-50/60 lg:snap-start">
      {/* Background Image */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1920&q=80)',
          }}
        />
      </div>

      {/* Animated Background Blobs */}
      <div className="absolute inset-0">
        <div className="absolute left-20 top-1/4 h-40 w-40 animate-pulse rounded-full bg-blue-400/20 blur-3xl sm:h-72 sm:w-72" />
        <div
          className="absolute bottom-1/4 right-20 h-48 w-48 animate-pulse rounded-full bg-cyan-400/20 blur-3xl sm:h-96 sm:w-96"
          style={{ animationDelay: '2s' }}
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
            <span className="mb-3 inline-block rounded-full bg-blue-100 px-4 py-1.5 text-xs font-medium text-blue-700">
              🔧 Tools Rental
            </span>
            <h2 className="mb-3 text-3xl font-bold leading-tight text-gray-900">
              Sewa Alat{' '}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Profesional
              </span>
            </h2>
            <p className="mx-auto mb-6 max-w-sm text-sm text-gray-600">
              Alat servis berkualitas tinggi tanpa perlu investasi besar. Solder
              station, multimeter, dan peralatan profesional.
            </p>

            {/* Features - Compact */}
            <div className="mb-6 flex justify-center gap-2">
              {benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="flex items-center gap-1.5 rounded-full bg-white px-3 py-2 shadow-md"
                >
                  <benefit.icon className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium text-gray-700">
                    {benefit.title}
                  </span>
                </div>
              ))}
            </div>

            {/* Featured Image - After Content */}
            {items[0] && (
              <Link href={`/sewa-alat/${items[0].id}`}>
                <div className="mx-auto mb-6 max-w-sm cursor-pointer overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl">
                  <div className="relative h-48">
                    <Image
                      src={
                        items[0].images[0] ||
                        'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&h=400&fit=crop'
                      }
                      alt={items[0].name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4">
                      <div className="line-clamp-1 text-base font-bold text-white">
                        {items[0].name}
                      </div>
                      <div className="text-sm font-bold text-cyan-300">
                        Rp {items[0].pricePerDay.toLocaleString('id-ID')}/hari
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            <Link
              href="/sewa-alat"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105"
            >
              Lihat Katalog
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
            <span className="mb-4 inline-block rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">
              🔧 Tools Rental
            </span>
            <h2 className="mb-6 text-4xl font-bold leading-tight text-gray-900 xl:text-6xl">
              Sewa Alat
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Profesional
              </span>
            </h2>
            <p className="mb-8 max-w-md text-lg text-gray-600">
              Alat servis berkualitas tinggi tanpa perlu investasi besar. Solder
              station, multimeter, dan peralatan profesional.
            </p>

            <div className="mb-8 flex flex-wrap gap-4">
              {benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-md"
                >
                  <benefit.icon className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {benefit.title}
                  </span>
                </div>
              ))}
            </div>

            <Link
              href="/sewa-alat"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-4 font-semibold text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/30"
            >
              Lihat Katalog Alat
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="grid grid-cols-2 gap-4">
              {items.slice(0, 4).map((item, idx) => (
                <Link key={item.id} href={`/sewa-alat/${item.id}`}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.08 }}
                    className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                  >
                    <Image
                      src={
                        item.images[0] ||
                        `https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&h=300&fit=crop`
                      }
                      alt={item.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-110"
                    />
                    <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-transparent to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="line-clamp-1 text-sm font-semibold text-white">
                        {item.name}
                      </span>
                      <span className="text-xs font-bold text-cyan-300">
                        Rp {item.pricePerDay.toLocaleString('id-ID')}/hari
                      </span>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
