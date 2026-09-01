import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import RentalActions from '@/components/rental/rental-actions'
import ImageGallery from '@/components/catalog/image-gallery'
import { Package, Shield, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import prisma from '@/lib/db'

// Force dynamic rendering - avoid DB calls at build time (Docker build stage has no DB)
export const dynamic = 'force-dynamic'

async function getRentalItem(id: string) {
  try {
    const item = await prisma.rentalItem.findUnique({
      where: { id, isActive: true },
    })

    if (!item) return null

    // Get related rental items
    const relatedItems = await prisma.rentalItem.findMany({
      where: {
        id: { not: id },
        isActive: true,
        stock: { gt: 0 },
      },
      take: 6,
      orderBy: { createdAt: 'desc' },
    })

    return { item, relatedItems }
  } catch (error) {
    console.error('Error fetching rental item:', error)
    return null
  }
}

export default async function SewaAlatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getRentalItem(id)

  if (!data) {
    notFound()
  }

  const { item, relatedItems } = data!

  const isAvailable = item.stock > 0

  // Calculate rental rates
  const dailyRate = item.pricePerDay
  const depositAmount = item.depositAmount ?? 0
  const terms: string[] = item.terms ?? []

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/40">
      <Navbar variant="light" />

      <main className="mx-auto max-w-7xl px-4 pb-8 pt-24 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-gray-600">
          <Link href="/" className="hover:text-blue-600">
            Home
          </Link>
          {' / '}
          <Link href="/sewa-alat" className="hover:text-blue-600">
            Sewa Alat
          </Link>
          {' / '}
          <span className="text-gray-900">{item.name}</span>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left Column - Images */}
          <div className="space-y-4">
            {item.images.length > 0 ? (
              <ImageGallery images={item.images} productName={item.name} />
            ) : (
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                <Package className="h-24 w-24 text-gray-300" />
              </div>
            )}
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Item Header */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                {isAvailable ? (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                    <CheckCircle className="inline h-4 w-4" /> Tersedia
                  </span>
                ) : (
                  <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
                    <AlertCircle className="inline h-4 w-4" /> Tidak Tersedia
                  </span>
                )}
                {isAvailable && (
                  <span className="text-sm text-gray-600">
                    {item.stock} unit tersedia
                  </span>
                )}
              </div>
              <h1 className="mb-2 text-3xl font-bold text-gray-900">
                {item.name}
              </h1>
            </div>

            {/* Pricing */}
            <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/50 p-6">
              <h2 className="mb-4 text-lg font-bold text-gray-900">
                Harga Sewa
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">Harian</p>
                    <p className="text-sm text-gray-600">Per hari</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    Rp {dailyRate.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-blue-200 pt-3">
                  <div>
                    <p className="font-semibold text-gray-900">Deposit</p>
                    <p className="text-sm text-gray-600">
                      Dikembalikan setelah alat kembali
                    </p>
                  </div>
                  <p
                    className={`text-xl font-bold ${depositAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}
                  >
                    {depositAmount > 0
                      ? `Rp ${depositAmount.toLocaleString('id-ID')}`
                      : 'Gratis'}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            {item.description && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <h2 className="mb-3 text-xl font-bold text-gray-900">
                  Deskripsi
                </h2>
                <p className="leading-relaxed text-gray-700">
                  {item.description}
                </p>
              </div>
            )}

            {/* Rental Terms */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                Syarat & Ketentuan
              </h2>
              <div className="space-y-3 text-sm text-gray-700">
                {/* Deposit - always show */}
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                  <span>
                    {depositAmount > 0
                      ? `Deposit Rp ${depositAmount.toLocaleString('id-ID')} (dikembalikan setelah pengembalian)`
                      : 'Deposit Gratis'}
                  </span>
                </div>
                {/* Custom terms from database */}
                {terms.length > 0 ? (
                  terms.map((term, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                      <span>{term}</span>
                    </div>
                  ))
                ) : (
                  /* Default terms if none configured */
                  <>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                      <span>Minimal sewa 1 hari</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                      <span>Gratis antar-jemput area Jakarta</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                      <span>Pengembalian maksimal jam 18:00</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
                      <span>Denda keterlambatan Rp 50.000/jam</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                      <span>Kerusakan ditanggung penyewa</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Features */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-xl font-bold text-gray-900">Benefit</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Kondisi Prima</p>
                    <p className="text-sm text-gray-600">
                      Alat terawat dan berkondisi baik
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Fleksibel</p>
                    <p className="text-sm text-gray-600">
                      Durasi sewa menyesuaikan kebutuhan
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                    <Package className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Support 24/7</p>
                    <p className="text-sm text-gray-600">
                      Bantuan teknis selama masa sewa
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <RentalActions
              rentalItem={{
                id: item.id,
                name: item.name,
                pricePerDay: item.pricePerDay,
                stock: item.stock,
                images: item.images,
                depositAmount: depositAmount,
              }}
              isAvailable={isAvailable}
            />
          </div>
        </div>

        {/* Related Items */}
        {relatedItems.length > 0 && (
          <section className="mt-12 rounded-2xl bg-gray-50 p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Alat Sewa Lainnya
              </h2>
              <Link
                href="/sewa-alat"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Lihat Semua →
              </Link>
            </div>

            {/* Mobile: Masonry, Desktop: Grid */}
            <div className="columns-2 gap-4 lg:columns-1">
              {/* Desktop Grid */}
              <div className="hidden lg:grid lg:grid-cols-4 lg:gap-6">
                {relatedItems.map((rentalItem) => (
                  <Link
                    key={rentalItem.id}
                    href={`/sewa-alat/${rentalItem.id}`}
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:border-blue-300 hover:shadow-lg"
                  >
                    <div className="aspect-square overflow-hidden bg-blue-50">
                      <img
                        src={
                          rentalItem.images[0] ||
                          'https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=400&q=80'
                        }
                        alt={rentalItem.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="mb-1 truncate font-semibold text-gray-900">
                        {rentalItem.name}
                      </h3>
                      <p className="mb-2 truncate text-xs text-gray-600">
                        {rentalItem.description || 'Alat sewa berkualitas'}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-blue-600">
                          Rp {rentalItem.pricePerDay.toLocaleString('id-ID')}
                          /hari
                        </p>
                        <span className="hidden rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700 md:inline-block">
                          {rentalItem.stock} unit
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Mobile Masonry */}
              <div className="lg:hidden">
                {relatedItems.map((rentalItem) => (
                  <div key={rentalItem.id} className="mb-4 break-inside-avoid">
                    <Link
                      href={`/sewa-alat/${rentalItem.id}`}
                      className="block overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:border-blue-300 hover:shadow-lg"
                    >
                      <div className="aspect-square overflow-hidden bg-blue-50">
                        <img
                          src={
                            rentalItem.images[0] ||
                            'https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=400&q=80'
                          }
                          alt={rentalItem.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="mb-1 truncate font-semibold text-gray-900">
                          {rentalItem.name}
                        </h3>
                        <p className="mb-2 truncate text-xs text-gray-600">
                          {rentalItem.description || 'Alat sewa berkualitas'}
                        </p>
                        <p className="text-sm font-bold text-blue-600">
                          Rp {rentalItem.pricePerDay.toLocaleString('id-ID')}
                          /hari
                        </p>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer variant="light" />
    </div>
  )
}
