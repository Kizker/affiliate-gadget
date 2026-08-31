'use client'

import { Shield, Zap, HeartHandshake, Trophy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const features = [
  {
    icon: Shield,
    title: 'Garansi Resmi',
    description:
      'Semua servis dilengkapi dengan garansi resmi untuk ketenangan Anda',
  },
  {
    icon: Zap,
    title: 'Proses Cepat',
    description: 'Layanan express tersedia untuk kebutuhan mendesak Anda',
  },
  {
    icon: HeartHandshake,
    title: 'Teknisi Profesional',
    description: 'Dikerjakan oleh teknisi bersertifikat dan berpengalaman',
  },
  {
    icon: Trophy,
    title: 'Harga Terbaik',
    description: 'Dapatkan harga kompetitif dengan kualitas terjamin',
  },
]

export default function Features() {
  const [visibleFeatures, setVisibleFeatures] = useState<boolean[]>([])
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            features.forEach((_, index) => {
              setTimeout(() => {
                setVisibleFeatures((prev) => {
                  const newVisible = [...prev]
                  newVisible[index] = true
                  return newVisible
                })
              }, index * 150)
            })
          }
        })
      },
      { threshold: 0.2 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen items-center overflow-hidden px-4 py-20 sm:px-6 sm:py-32 lg:px-8"
    >
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1551434678-e076c223a692?w=1920&q=80)',
          }}
        ></div>
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50/95 via-white/90 to-blue-50/95"></div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-5xl">
            Mengapa Memilih{' '}
            <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Affiliate Gadget?
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 sm:text-xl">
            Keunggulan yang membuat kami berbeda
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className={`group relative transform rounded-2xl border border-gray-200 bg-white/90 p-6 backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:border-blue-300 hover:shadow-2xl sm:p-8 ${
                  visibleFeatures[index]
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-10 opacity-0'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>

                <div className="relative text-center">
                  <div className="mx-auto mb-6 flex h-16 w-16 transform items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 transition-transform duration-300 group-hover:rotate-12">
                    <Icon className="h-8 w-8 text-white" />
                  </div>

                  <h3 className="mb-3 text-xl font-bold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
                    {feature.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
