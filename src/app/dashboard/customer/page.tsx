import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import {
  ShoppingBag,
  Package,
  Wrench,
  Clock,
  Smartphone,
  Headphones,
  MapPin,
  Store,
} from 'lucide-react'
import Link from 'next/link'
import prisma from '@/lib/db'

export const metadata = {
  title: 'Dashboard - HaloTekno',
}

async function getData() {
  try {
    // Fetch top technicians (with user data and ratings)
    const techniciansRaw = await prisma.technician.findMany({
      where: { isAvailable: true },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
        services: {
          take: 1,
          orderBy: { price: 'asc' },
        },
      },
      orderBy: { rating: 'desc' },
      take: 4,
    })

    // Calculate real ratings from reviews for each technician
    const technicians = await Promise.all(
      techniciansRaw.map(async (tech) => {
        const reviews = await prisma.review.findMany({
          where: {
            order: {
              technicianId: tech.id,
            },
            type: 'TECHNICIAN',
          },
        })

        const totalRating = reviews.reduce(
          (sum, review) => sum + review.rating,
          0
        )
        const averageRating =
          reviews.length > 0 ? totalRating / reviews.length : 0

        return {
          ...tech,
          rating: averageRating,
          totalReview: reviews.length,
        }
      })
    )

    // Fetch top spareparts (active products only)
    const products = await prisma.product.findMany({
      where: { isActive: true, stock: { gt: 0 } },
      orderBy: { createdAt: 'desc' },
      take: 4,
    })

    // Fetch rental items with stock
    const rentalItems = await prisma.rentalItem.findMany({
      where: { isActive: true, stock: { gt: 0 } },
      orderBy: { createdAt: 'desc' },
      take: 4,
    })

    // Fetch partners/mitra (from Mitra model with user relation)
    const partnersRaw = await prisma.mitra.findMany({
      where: {
        isApproved: true,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        rating: 'desc',
      },
      take: 4,
    })

    // Transform mitra data to match UI expectations
    const partners = partnersRaw.map((mitra) => ({
      id: mitra.id,
      name: mitra.businessName || mitra.user.name || 'Mitra Servis',
      image: mitra.banner || mitra.user.image,
      address: `${mitra.address}, ${mitra.city}`,
      phone: mitra.phone,
      rating: mitra.rating,
      totalReview: mitra.totalReview,
    }))

    // Get stats
    const stats = {
      totalProducts: await prisma.product.count({ where: { isActive: true } }),
      totalTechnicians: await prisma.technician.count({
        where: { isAvailable: true },
      }),
      totalRentalItems: await prisma.rentalItem.count({
        where: { isActive: true },
      }),
      totalPartners: await prisma.mitra.count({
        where: { isApproved: true, isActive: true },
      }),
    }

    return {
      technicians,
      products,
      rentalItems,
      partners,
      stats,
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return {
      technicians: [],
      products: [],
      rentalItems: [],
      partners: [],
      stats: {
        totalProducts: 0,
        totalTechnicians: 0,
        totalRentalItems: 0,
        totalPartners: 0,
      },
    }
  }
}

export default async function CustomerDashboard() {
  const { technicians, products, rentalItems, partners, stats } =
    await getData()

  return (
    <div className="relative min-h-screen">
      {/* Background Image with Overlay */}
      <div className="fixed inset-0 -z-10">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1556656793-08538906a9f8?w=1920&q=80)',
          }}
        ></div>
        {/* White overlay - balanced visibility */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.92] via-blue-50/[0.99] to-white/[0.92]"></div>
      </div>

      <Navbar variant="light" />

      <main className="relative z-10 pb-16 pt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Main Banner with Tech Background */}
          <div className="mb-6">
            <div
              className="relative h-64 overflow-hidden rounded-2xl"
              style={{
                backgroundImage:
                  'url(https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/95 via-blue-500/90 to-transparent"></div>

              {/* Content */}
              <div className="relative flex h-full items-center px-12">
                <div className="max-w-xl">
                  <h1 className="mb-3 text-4xl font-bold text-white">
                    HaloTekno
                  </h1>
                  <p className="text-xl text-blue-50">
                    Layanan Servis dan Penjualan Gadget No. 1
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Kategori Section */}
          <div className="mb-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">KATEGORI</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {/* Konsultasi Servis */}
              <Link
                href="/konsultasi"
                className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:border-blue-300 hover:shadow-lg"
              >
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&q=80"
                    alt="Konsultasi"
                    className="absolute inset-0 h-full w-full object-cover opacity-60 transition-opacity group-hover:opacity-70"
                    loading="eager"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-50/60">
                    <Headphones className="relative z-10 mb-2 h-12 w-12 text-blue-500 transition-transform group-hover:scale-110 md:mb-0 md:h-16 md:w-16" />
                    <div className="relative z-10 text-center md:hidden">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Konsultasi Servis
                      </h3>
                      <p className="text-xs text-gray-600">Gratis</p>
                    </div>
                  </div>
                </div>
                <div className="hidden p-3 md:block">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Konsultasi Servis
                  </h3>
                  <p className="text-xs text-gray-600">Gratis</p>
                </div>
              </Link>

              {/* Jasa Cek/Bongkar */}
              <Link
                href="/cek-bongkar"
                className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:border-blue-300 hover:shadow-lg"
              >
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&q=80"
                    alt="Cek Bongkar"
                    className="absolute inset-0 h-full w-full object-cover opacity-60 transition-opacity group-hover:opacity-70"
                    loading="eager"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-50/60">
                    <Wrench className="relative z-10 mb-2 h-12 w-12 text-blue-500 transition-transform group-hover:scale-110 md:mb-0 md:h-16 md:w-16" />
                    <div className="relative z-10 text-center md:hidden">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Jasa Cek/Bongkar
                      </h3>
                      <p className="text-xs text-gray-600">Mulai 50rb</p>
                    </div>
                  </div>
                </div>
                <div className="hidden p-3 md:block">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Jasa Cek/Bongkar
                  </h3>
                  <p className="text-xs text-gray-600">Mulai 50rb</p>
                </div>
              </Link>

              {/* Jasa Servis */}
              <Link
                href="/jasa-servis"
                className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:border-blue-300 hover:shadow-lg"
              >
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&q=80"
                    alt="Jasa Servis"
                    className="absolute inset-0 h-full w-full object-cover opacity-60 transition-opacity group-hover:opacity-70"
                    loading="eager"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-50/60">
                    <Smartphone className="relative z-10 mb-2 h-12 w-12 text-blue-500 transition-transform group-hover:scale-110 md:mb-0 md:h-16 md:w-16" />
                    <div className="relative z-10 text-center md:hidden">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Jasa Servis
                      </h3>
                      <p className="text-xs text-gray-600">Bergaransi</p>
                    </div>
                  </div>
                </div>
                <div className="hidden p-3 md:block">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Jasa Servis
                  </h3>
                  <p className="text-xs text-gray-600">Bergaransi</p>
                </div>
              </Link>

              {/* Sewa Alat Ditempat */}
              <Link
                href="/sewa-alat"
                className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:border-blue-300 hover:shadow-lg"
              >
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=400&q=80"
                    alt="Sewa Alat"
                    className="absolute inset-0 h-full w-full object-cover opacity-60 transition-opacity group-hover:opacity-70"
                    loading="eager"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-50/60">
                    <Clock className="relative z-10 mb-2 h-12 w-12 text-blue-500 transition-transform group-hover:scale-110 md:mb-0 md:h-16 md:w-16" />
                    <div className="relative z-10 text-center md:hidden">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Sewa Alat Ditempat
                      </h3>
                      <p className="text-xs text-gray-600">Harian</p>
                    </div>
                  </div>
                </div>
                <div className="hidden p-3 md:block">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Sewa Alat Ditempat
                  </h3>
                  <p className="text-xs text-gray-600">Harian</p>
                </div>
              </Link>

              {/* Jual Sparepart */}
              <Link
                href="/sparepart"
                className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:border-blue-300 hover:shadow-lg"
              >
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80"
                    alt="Sparepart"
                    className="absolute inset-0 h-full w-full object-cover opacity-60 transition-opacity group-hover:opacity-70"
                    loading="eager"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-50/60">
                    <Package className="relative z-10 mb-2 h-12 w-12 text-blue-500 transition-transform group-hover:scale-110 md:mb-0 md:h-16 md:w-16" />
                    <div className="relative z-10 text-center md:hidden">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Jual Sparepart
                      </h3>
                      <p className="text-xs text-gray-600">
                        {stats.totalProducts}+ Item
                      </p>
                    </div>
                  </div>
                </div>
                <div className="hidden p-3 md:block">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Jual Sparepart
                  </h3>
                  <p className="text-xs text-gray-600">
                    {stats.totalProducts}+ Item
                  </p>
                </div>
              </Link>

              {/* Rekomendasi Tempat Servis */}
              <Link
                href="/rekomendasi"
                className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:border-blue-300 hover:shadow-lg"
              >
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80"
                    alt="Rekomendasi"
                    className="absolute inset-0 h-full w-full object-cover opacity-60 transition-opacity group-hover:opacity-70"
                    loading="eager"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-50/60">
                    <ShoppingBag className="relative z-10 mb-2 h-12 w-12 text-blue-500 transition-transform group-hover:scale-110 md:mb-0 md:h-16 md:w-16" />
                    <div className="relative z-10 text-center md:hidden">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Rekomendasi Tempat
                      </h3>
                      <p className="text-xs text-gray-600">Terpercaya</p>
                    </div>
                  </div>
                </div>
                <div className="hidden p-3 md:block">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Rekomendasi Tempat
                  </h3>
                  <p className="text-xs text-gray-600">Terpercaya</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Katalog Teknisi */}
          <div className="mb-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                TEKNISI TERBAIK
              </h2>
              <Link
                href="/teknisi"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Lihat Semua →
              </Link>
            </div>

            {technicians.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {technicians.map((tech) => {
                  const minPrice = tech.services[0]?.price || 50000
                  return (
                    <Link
                      key={tech.id}
                      href={`/teknisi/${tech.id}`}
                      className="overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:border-blue-300 hover:shadow-lg"
                    >
                      <div className="aspect-square overflow-hidden bg-blue-50">
                        <img
                          src={
                            tech.user.image ||
                            'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&q=80'
                          }
                          alt={tech.user.name || 'Teknisi'}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="mb-1 truncate font-semibold text-gray-900">
                          {tech.user.name || 'Teknisi'}
                        </h3>
                        <p className="mb-2 truncate text-xs text-gray-600">
                          {tech.specialties.slice(0, 2).join(', ')}
                        </p>
                        <div className="mb-2 flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span className="text-sm font-medium">
                            {tech.rating.toFixed(1)}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({tech.totalReview})
                          </span>
                        </div>
                        <p className="text-sm font-bold text-blue-600">
                          Mulai Rp {minPrice.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <p className="py-8 text-center text-gray-500">
                Belum ada teknisi tersedia
              </p>
            )}
          </div>

          {/* Katalog Sparepart */}
          <div className="mb-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                SPAREPART TERBARU
              </h2>
              <Link
                href="/sparepart"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Lihat Semua →
              </Link>
            </div>

            {products.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/sparepart/${product.id}`}
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:border-blue-300 hover:shadow-lg"
                  >
                    <div className="aspect-square overflow-hidden bg-blue-50">
                      <img
                        src={
                          product.images[0] ||
                          'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80'
                        }
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="mb-1 truncate font-semibold text-gray-900">
                        {product.name}
                      </h3>
                      <p className="mb-2 truncate text-xs text-gray-600">
                        {product.brand || 'Original'} • {product.category}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-blue-600">
                          Rp {product.price.toLocaleString('id-ID')}
                        </p>
                        <span
                          className={`hidden rounded px-2 py-1 text-xs md:inline-block ${
                            product.stock > 5
                              ? 'bg-green-100 text-green-700'
                              : product.stock > 0
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {product.stock > 0
                            ? `Stok ${product.stock}`
                            : 'Habis'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-gray-500">
                Belum ada sparepart tersedia
              </p>
            )}
          </div>

          {/* Katalog Rental Items */}
          <div className="mb-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                ALAT SEWA TERSEDIA
              </h2>
              <Link
                href="/sewa-alat"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Lihat Semua →
              </Link>
            </div>

            {rentalItems.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {rentalItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/sewa-alat/${item.id}`}
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:border-blue-300 hover:shadow-lg"
                  >
                    <div className="aspect-square overflow-hidden bg-blue-50">
                      <img
                        src={
                          item.images[0] ||
                          'https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=400&q=80'
                        }
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="mb-1 truncate font-semibold text-gray-900">
                        {item.name}
                      </h3>
                      <p className="mb-2 truncate text-xs text-gray-600">
                        {item.description || 'Alat sewa berkualitas'}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-blue-600">
                          Rp {item.pricePerDay.toLocaleString('id-ID')}/hari
                        </p>
                        <span
                          className={`hidden rounded px-2 py-1 text-xs md:inline-block ${
                            item.stock > 0
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {item.stock > 0 ? `${item.stock} unit` : 'Habis'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-gray-500">
                Belum ada alat sewa tersedia
              </p>
            )}
          </div>

          {/* Rekomendasi Tempat Servis (Mitra) */}
          <div className="mb-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                REKOMENDASI TEMPAT SERVIS
              </h2>
              <Link
                href="/rekomendasi"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Lihat Semua →
              </Link>
            </div>

            {partners.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {partners.map((partner) => (
                  <Link
                    key={partner.id}
                    href={`/rekomendasi/${partner.id}`}
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:border-blue-300 hover:shadow-lg"
                  >
                    <div className="aspect-square overflow-hidden bg-blue-50">
                      <img
                        src={
                          partner.image ||
                          'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80'
                        }
                        alt={partner.name || 'Mitra'}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="mb-1 truncate font-semibold text-gray-900">
                        {partner.name || 'Mitra Servis'}
                      </h3>
                      <p className="mb-2 flex items-center gap-1 truncate text-xs text-gray-600">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        {partner.address || 'Jakarta'}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                          Terpercaya
                        </span>
                        <Store className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-gray-500">
                Belum ada mitra tersedia
              </p>
            )}
          </div>
        </div>
      </main>

      <Footer variant="light" />
    </div>
  )
}
