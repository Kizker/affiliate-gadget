'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  Star,
  MessageCircle,
  Search,
  Wrench,
  ChevronRight,
} from 'lucide-react'

interface Technician {
  id: string
  bio: string | null
  experience: number
  specialties: string[]
  rating: number
  totalReview: number
  user: {
    name: string | null
    image: string | null
  }
}

export default function SectionServices() {
  const [technicians, setTechnicians] = useState<Technician[]>([])

  useEffect(() => {
    fetch('/api/technicians?limit=4&sortBy=rating')
      .then((res) => res.json())
      .then((data) => setTechnicians(data.technicians || []))
      .catch(console.error)
  }, [])

  const steps = [
    { icon: MessageCircle, title: 'Konsultasi' },
    { icon: Search, title: 'Diagnosa' },
    { icon: Wrench, title: 'Servis' },
  ]

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-gradient-to-br from-white via-blue-50/50 to-cyan-50/60 lg:snap-start">
      {/* Background Image */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1920&q=80)',
          }}
        />
      </div>

      {/* Animated Background Blobs */}
      <div className="absolute inset-0">
        <div className="absolute -left-20 top-20 h-48 w-48 animate-pulse rounded-full bg-blue-400/20 blur-3xl sm:h-96 sm:w-96" />
        <div
          className="absolute -right-20 bottom-20 h-40 w-40 animate-pulse rounded-full bg-cyan-400/20 blur-3xl sm:h-80 sm:w-80"
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
            <span className="mb-3 inline-block rounded-full bg-blue-100 px-4 py-1.5 text-xs font-medium text-blue-700">
              ✨ Layanan Premium
            </span>
            <h2 className="mb-3 text-3xl font-bold leading-tight text-gray-900">
              Servis Gadget{' '}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Profesional
              </span>
            </h2>
            <p className="mx-auto mb-6 max-w-sm text-sm text-gray-600">
              Proses transparan dari konsultasi hingga selesai dengan teknisi
              berpengalaman.
            </p>

            {/* Flow Steps - Compact */}
            <div className="mb-6 flex justify-center gap-3">
              {steps.map((step, idx) => (
                <div key={step.title} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className="mb-1.5 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
                      <step.icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-700">
                      {step.title}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <ChevronRight className="mx-1 h-4 w-4 text-gray-400" />
                  )}
                </div>
              ))}
            </div>

            {/* Featured Image - After Content */}
            {technicians[0] && (
              <div className="mx-auto mb-6 max-w-sm overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl">
                <div className="relative h-48">
                  <Image
                    src={
                      technicians[0].user.image ||
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop'
                    }
                    alt={technicians[0].user.name || 'Teknisi'}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <div className="text-base font-bold text-white">
                      {technicians[0].user.name}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-white/90">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      {technicians[0].rating.toFixed(1)} •{' '}
                      {technicians[0].experience}+ tahun pengalaman
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Link
              href="/teknisi"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105"
            >
              Cari Teknisi
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
              ✨ Layanan Premium
            </span>
            <h2 className="mb-6 text-4xl font-bold leading-tight text-gray-900 xl:text-6xl">
              Servis Gadget
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Profesional
              </span>
            </h2>
            <p className="mb-8 max-w-md text-lg text-gray-600">
              Proses transparan dari konsultasi hingga selesai. Teknisi
              berpengalaman siap membantu Anda.
            </p>

            <div className="mb-8 flex items-center gap-2">
              {steps.map((step, idx) => (
                <div key={step.title} className="flex items-center">
                  <div className="group flex flex-col items-center">
                    <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg transition-all group-hover:scale-110">
                      <step.icon className="h-7 w-7 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-gray-800">
                      {step.title}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <ChevronRight className="mx-2 h-5 w-5 text-gray-400" />
                  )}
                </div>
              ))}
            </div>

            <Link
              href="/teknisi"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-4 font-semibold text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/30"
            >
              Cari Teknisi
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="grid grid-cols-2 gap-3">
              {technicians.slice(0, 4).map((tech, idx) => (
                <Link key={tech.id} href={`/teknisi/${tech.id}`}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.08 }}
                    className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                  >
                    <Image
                      src={
                        tech.user.image ||
                        `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&${idx}`
                      }
                      alt={tech.user.name || 'Technician'}
                      fill
                      className="object-cover transition-transform group-hover:scale-110"
                    />
                    <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-transparent to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="line-clamp-1 text-sm font-semibold text-white">
                        {tech.user.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-white/90">
                          {tech.rating.toFixed(1)} • {tech.experience}+ tahun
                        </span>
                      </div>
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
