import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import SparepartActions from '@/components/sparepart/sparepart-actions'
import ImageGallery from '@/components/catalog/image-gallery'
import {
  Star,
  CheckCircle,
  Shield,
  Clock,
  Package,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import prisma from '@/lib/db'

// Enable ISR - revalidate every 60 seconds
export const revalidate = 60

export const metadata = {
  title: 'Detail Sparepart - Affiliate Gadget',
}

// Pre-generate popular product pages at build time
export async function generateStaticParams() {
  const products = await prisma.product.findMany({
    where: { isActive: true, stock: { gt: 0 } },
    take: 30,
    select: { id: true },
    orderBy: { createdAt: 'desc' },
  })

  return products.map((product) => ({
    id: product.id,
  }))
}

async function getProduct(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id, isActive: true },
      include: {
        orderItems: {
          select: {
            quantity: true,
          },
        },
      },
    })

    if (!product) return null

    // Calculate total sold
    const totalSold = product.orderItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    )

    // Get reviews for this product from orders
    const reviews = await prisma.review.findMany({
      where: {
        type: 'PRODUCT',
        order: {
          items: {
            some: {
              productId: id,
            },
          },
        },
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    })

    // Get related products from same category
    const relatedProducts = await prisma.product.findMany({
      where: {
        category: product.category,
        id: { not: id },
        isActive: true,
        stock: { gt: 0 },
      },
      take: 6,
      orderBy: { createdAt: 'desc' },
    })

    return { product: { ...product, totalSold }, reviews, relatedProducts }
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

export default async function SparepartDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getProduct(id)

  if (!data) {
    notFound()
  }

  const { product, reviews, relatedProducts } = data
  const isInStock = product.stock > 0

  // Calculate average rating
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0

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
          <Link href="/sparepart" className="hover:text-blue-600">
            Sparepart
          </Link>
          {' / '}
          <span className="text-gray-900">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left Column - Images & Reviews */}
          <div className="space-y-6">
            {/* Images */}
            {product.images.length > 0 ? (
              <ImageGallery
                images={product.images}
                productName={product.name}
              />
            ) : (
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                <Package className="h-24 w-24 text-gray-300" />
              </div>
            )}

            {/* Reviews Section */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  Ulasan Produk
                </h3>
                {reviews.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < Math.round(averageRating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {averageRating.toFixed(1)} ({reviews.length} ulasan)
                    </span>
                  </div>
                )}
              </div>

              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {review.user.image ? (
                            <img
                              src={review.user.image}
                              alt={review.user.name || 'User'}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                              <span className="text-sm font-semibold text-blue-600">
                                {(review.user.name || 'U')[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">
                              {review.user.name || 'Pengguna'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString(
                                'id-ID',
                                {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                }
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-gray-700">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Star className="mx-auto mb-2 h-12 w-12 text-gray-300" />
                  <p className="text-gray-500">
                    Belum ada ulasan untuk produk ini
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Product Header */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                {isInStock ? (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                    <CheckCircle className="inline h-4 w-4" /> Tersedia
                  </span>
                ) : (
                  <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
                    <AlertCircle className="inline h-4 w-4" /> Stok Habis
                  </span>
                )}
                {product.brand && (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                    {product.brand}
                  </span>
                )}
              </div>
              <h1 className="mb-2 text-3xl font-bold text-gray-900">
                {product.name}
              </h1>
              <p className="text-gray-600">{product.category}</p>
            </div>

            {/* Price */}
            <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/50 p-6">
              <p className="mb-1 text-sm text-gray-600">Harga</p>
              <p className="text-4xl font-bold text-blue-600">
                Rp {product.price.toLocaleString('id-ID')}
              </p>
              {isInStock && (
                <p className="mt-2 text-sm text-gray-600">
                  Stok tersedia:{' '}
                  <span className="font-semibold">{product.stock} unit</span>
                </p>
              )}
              {product.totalSold > 0 && (
                <p className="mt-1 text-sm text-gray-600">
                  Terjual:{' '}
                  <span className="font-semibold text-green-600">
                    {product.totalSold} unit
                  </span>
                </p>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <h2 className="mb-3 text-xl font-bold text-gray-900">
                  Deskripsi Produk
                </h2>
                <p className="leading-relaxed text-gray-700">
                  {product.description}
                </p>
              </div>
            )}

            {/* Specifications */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="mb-3 text-xl font-bold text-gray-900">
                Spesifikasi
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-600">Kategori</span>
                  <span className="font-semibold text-gray-900">
                    {product.category}
                  </span>
                </div>
                {product.brand && (
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-600">Brand</span>
                    <span className="font-semibold text-gray-900">
                      {product.brand}
                    </span>
                  </div>
                )}
                {product.model && (
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-600">
                      Model / Kompatibilitas
                    </span>
                    <span className="font-semibold text-gray-900">
                      {product.model}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-600">Kondisi</span>
                  <span className="font-semibold text-gray-900">Baru</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Garansi</span>
                  <span className="font-semibold text-gray-900">30 Hari</span>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                Keunggulan
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      Original Quality
                    </p>
                    <p className="text-sm text-gray-600">
                      Kualitas terjamin original
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      Pengiriman Cepat
                    </p>
                    <p className="text-sm text-gray-600">
                      Proses pengiriman 1-2 hari
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                    <Package className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Packing Aman</p>
                    <p className="text-sm text-gray-600">
                      Dikemas dengan bubble wrap
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <SparepartActions
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                stock: product.stock,
                images: product.images,
              }}
              isInStock={isInStock}
            />
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-12 rounded-2xl bg-gray-50 p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Produk Terkait
              </h2>
              <Link
                href="/sparepart"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Lihat Semua →
              </Link>
            </div>

            {/* Mobile: Masonry, Desktop: Grid */}
            <div className="columns-2 gap-4 lg:columns-1">
              {/* Desktop Grid */}
              <div className="hidden lg:grid lg:grid-cols-4 lg:gap-6">
                {relatedProducts.map((item) => (
                  <Link
                    key={item.id}
                    href={`/sparepart/${item.id}`}
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:border-blue-300 hover:shadow-lg"
                  >
                    <div className="aspect-square overflow-hidden bg-blue-50">
                      <img
                        src={
                          item.images[0] ||
                          'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80'
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
                        {item.brand || 'Original'} • {item.category}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-blue-600">
                          Rp {item.price.toLocaleString('id-ID')}
                        </p>
                        <span className="hidden rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700 md:inline-block">
                          Stok {item.stock}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Mobile Masonry */}
              <div className="lg:hidden">
                {relatedProducts.map((item) => (
                  <div key={item.id} className="mb-4 break-inside-avoid">
                    <Link
                      href={`/sparepart/${item.id}`}
                      className="block overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:border-blue-300 hover:shadow-lg"
                    >
                      <div className="aspect-square overflow-hidden bg-blue-50">
                        <img
                          src={
                            item.images[0] ||
                            'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80'
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
                          {item.brand || 'Original'} • {item.category}
                        </p>
                        <p className="text-sm font-bold text-blue-600">
                          Rp {item.price.toLocaleString('id-ID')}
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
