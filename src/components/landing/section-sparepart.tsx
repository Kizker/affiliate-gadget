'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ShieldCheck, Package, Truck } from 'lucide-react'

interface Product {
  id: string
  name: string
  category: string
  brand: string | null
  price: number
  images: string[]
}

export default function SectionSparepart() {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    fetch('/api/products?limit=6&sortBy=rating')
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []))
      .catch(console.error)
  }, [])

  const features = [
    { icon: ShieldCheck, title: 'Garansi' },
    { icon: Package, title: 'Lengkap' },
    { icon: Truck, title: 'Cepat' },
  ]

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-gradient-to-br from-cyan-50/60 via-white to-blue-50/50 lg:snap-start">
      {/* Background Image */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=1920&q=80)',
          }}
        />
      </div>

      {/* Animated Background Blobs */}
      <div className="absolute inset-0">
        <div className="absolute right-10 top-10 h-40 w-40 animate-pulse rounded-full bg-cyan-400/20 blur-3xl sm:h-80 sm:w-80" />
        <div
          className="absolute -left-10 bottom-10 h-48 w-48 animate-pulse rounded-full bg-blue-400/20 blur-3xl sm:h-96 sm:w-96"
          style={{ animationDelay: '1.5s' }}
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
              🛒 Sparepart Shop
            </span>
            <h2 className="mb-3 text-3xl font-bold leading-tight text-gray-900">
              Sparepart{' '}
              <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                Original
              </span>
            </h2>
            <p className="mx-auto mb-6 max-w-sm text-sm text-gray-600">
              Sparepart original bergaransi. LCD, baterai, charger, dan
              aksesoris berkualitas untuk semua brand.
            </p>

            {/* Features - Compact */}
            <div className="mb-6 flex justify-center gap-2">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="flex items-center gap-1.5 rounded-full bg-white px-3 py-2 shadow-md"
                >
                  <feature.icon className="h-4 w-4 text-cyan-600" />
                  <span className="text-xs font-medium text-gray-700">
                    {feature.title}
                  </span>
                </div>
              ))}
            </div>

            {/* Featured Image - After Content */}
            {products[0] && (
              <Link href={`/sparepart/${products[0].id}`}>
                <div className="mx-auto mb-6 max-w-sm cursor-pointer overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl">
                  <div className="relative h-48">
                    <Image
                      src={
                        products[0].images[0] ||
                        'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&h=400&fit=crop'
                      }
                      alt={products[0].name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4">
                      <div className="line-clamp-1 text-base font-bold text-white">
                        {products[0].name}
                      </div>
                      <div className="text-sm font-bold text-cyan-300">
                        Rp {products[0].price.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            <Link
              href="/sparepart"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105"
            >
              Lihat Sparepart
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
            <div className="grid grid-cols-3 gap-3">
              {products.slice(0, 6).map((product, idx) => (
                <Link key={product.id} href={`/sparepart/${product.id}`}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.08 }}
                    className="group relative aspect-square cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                  >
                    <Image
                      src={
                        product.images[0] ||
                        'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=200&h=200&fit=crop'
                      }
                      alt={product.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-110"
                    />
                    <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-transparent to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="line-clamp-1 text-xs font-medium text-white">
                        {product.name}
                      </span>
                      <span className="text-xs font-bold text-cyan-300">
                        Rp {product.price.toLocaleString('id-ID')}
                      </span>
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
              🛒 Sparepart Shop
            </span>
            <h2 className="mb-6 text-4xl font-bold leading-tight text-gray-900 xl:text-6xl">
              Sparepart
              <br />
              <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                Original
              </span>
            </h2>
            <p className="mb-8 max-w-md text-lg text-gray-600">
              Beli sparepart original dengan garansi. LCD, baterai, charger, dan
              aksesoris berkualitas.
            </p>

            <div className="mb-8 flex flex-wrap gap-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-md"
                >
                  <feature.icon className="h-5 w-5 text-cyan-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {feature.title}
                  </span>
                </div>
              ))}
            </div>

            <Link
              href="/sparepart"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 px-8 py-4 font-semibold text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/30"
            >
              Lihat Semua Sparepart
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
