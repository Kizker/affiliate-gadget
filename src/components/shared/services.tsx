'use client'

import { Smartphone, Package, Wrench, Users } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const services = [
  {
    icon: Smartphone,
    title: 'Servis HP',
    description:
      'Perbaikan profesional untuk semua jenis smartphone dengan teknisi bersertifikat dan garansi resmi',
    shortDesc: 'Perbaikan smartphone profesional',
    gradient: 'from-cyan-500 to-blue-500',
    href: '/teknisi',
  },
  {
    icon: Package,
    title: 'Sparepart',
    description:
      'Sparepart original dan berkualitas tinggi dengan harga terbaik dan jaminan keaslian 100%',
    shortDesc: 'Sparepart original berkualitas',
    gradient: 'from-blue-500 to-purple-500',
    href: '/sparepart',
  },
  {
    icon: Wrench,
    title: 'Sewa Alat',
    description:
      'Layanan rental peralatan teknologi untuk berbagai kebutuhan bisnis dan personal Anda',
    shortDesc: 'Rental peralatan teknologi',
    gradient: 'from-purple-500 to-pink-500',
    href: '/sewa-alat',
  },
  {
    icon: Users,
    title: 'Direktori Mitra',
    description:
      'Jaringan mitra terpercaya di seluruh Indonesia siap melayani kebutuhan teknologi Anda',
    shortDesc: 'Jaringan mitra terpercaya',
    gradient: 'from-pink-500 to-cyan-500',
    href: '/rekomendasi',
  },
]

export default function Services() {
  const [visibleCards, setVisibleCards] = useState<boolean[]>([])
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            services.forEach((_, index) => {
              setTimeout(() => {
                setVisibleCards((prev) => {
                  const newVisible = [...prev]
                  newVisible[index] = true
                  return newVisible
                })
              }, index * 150)
            })
          }
        })
      },
      { threshold: 0.1 }
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
              'url(https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1920&q=80)',
          }}
        ></div>
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-blue-50/95"></div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl">
        <div className="mb-16 text-center sm:mb-20">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:mb-6 sm:text-5xl">
            Layanan{' '}
            <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Premium
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 sm:text-xl">
            Solusi lengkap untuk semua kebutuhan teknologi Anda
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4">
          {services.map((service, index) => {
            const Icon = service.icon
            return (
              <Link
                key={index}
                href={service.href}
                className={`group relative transform cursor-pointer rounded-3xl border border-gray-200 bg-white/90 p-6 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:scale-105 hover:border-blue-300 hover:shadow-2xl sm:p-8 ${
                  visibleCards[index]
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-10 opacity-0'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-50 to-cyan-50 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>

                <div className="relative">
                  <div
                    className={`h-14 w-14 bg-gradient-to-br sm:h-16 sm:w-16 ${service.gradient} mb-6 flex transform items-center justify-center rounded-2xl transition-transform duration-300 group-hover:rotate-6`}
                  >
                    <Icon className="h-7 w-7 text-white sm:h-8 sm:w-8" />
                  </div>

                  <h3 className="mb-3 text-xl font-bold text-gray-900 sm:mb-4 sm:text-2xl">
                    {service.title}
                  </h3>
                  {/* Mobile: Short description */}
                  <p className="text-sm leading-relaxed text-gray-600 sm:text-base lg:hidden">
                    {service.shortDesc}
                  </p>
                  {/* Desktop: Full description */}
                  <p className="hidden text-sm leading-relaxed text-gray-600 sm:text-base lg:block">
                    {service.description}
                  </p>

                  <div className="mt-6 hidden items-center text-sm font-semibold text-blue-600 transition-all duration-300 group-hover:gap-2 sm:mt-8 sm:text-base lg:flex">
                    Pelajari Lebih Lanjut
                    <span className="ml-2 transform transition-transform duration-300 group-hover:translate-x-2">
                      →
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
