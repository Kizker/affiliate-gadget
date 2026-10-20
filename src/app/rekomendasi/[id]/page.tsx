import prisma from '@/lib/db'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import MitraDetailClient from './mitra-detail-client'
import { Loader2 } from 'lucide-react'
import { auth } from '@/auth'
import { Footer } from '@/components/layouts/footer'
import { headers } from 'next/headers'
import { parseUserAgent } from '@/lib/user-agent-parser'
import { isMitraCurrentlyOpen } from '@/lib/mitra-utils'

// Force dynamic rendering - avoid DB calls at build time (Docker build stage has no DB)
export const dynamic = 'force-dynamic'

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const mitra = await prisma.mitra.findUnique({
    where: { id, isApproved: true, isActive: true },
    select: { businessName: true, tagline: true, banner: true, city: true },
  })

  if (!mitra) {
    return { title: 'Mitra Tidak Ditemukan - Affiliate Gadget' }
  }

  return {
    title: `${mitra.businessName} - Rekomendasi Affiliate Gadget`,
    description:
      mitra.tagline ||
      `${mitra.businessName} - Mitra servis terpercaya di ${mitra.city}`,
    openGraph: {
      title: mitra.businessName,
      description: mitra.tagline || '',
      images: mitra.banner ? [mitra.banner] : [],
    },
  }
}

// Define the type to match client component expectations
export type MitraData = {
  id: string
  businessName: string
  tagline: string | null
  description: string | null
  banner: string | null
  address: string
  city: string
  province: string
  phone: string
  whatsapp: string | null
  email: string | null
  website: string | null
  features: string[] | null
  weekdayHours: string | null
  weekendHours: string | null
  latitude: number | null
  longitude: number | null
  mapsUrl: string | null
  rating: number
  totalReview: number
  isOpen: boolean
  services: Array<{
    id: string
    name: string
    price: string
    icon: string | null
    description?: string | null
  }>
  images: Array<{ id: string; url: string }>
  reviews?: Array<{
    id: string
    rating: number
    comment: string | null
    createdAt: string
    images?: string[]
    videos?: string[]
    user: {
      id: string
      name: string | null
      image: string | null
    }
  }>
}

// Fetch mitra data on server with optimized select
async function getMitra(id: string): Promise<MitraData | null> {
  try {
    const mitra = await prisma.mitra.findUnique({
      where: { id },
      include: {
        services: {
          select: {
            id: true,
            name: true,
            price: true,
            icon: true,
            description: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        images: {
          select: {
            id: true,
            url: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            images: true,
            videos: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    })

    if (!mitra || !mitra.isApproved || !mitra.isActive) {
      return null
    }

    const isOpen = isMitraCurrentlyOpen(mitra.weekdayHours, mitra.weekendHours)
    const actualReviewCount = mitra._count?.reviews ?? 0
    // SINKRONISASI REVIEW COUNT & RATING:
    // Jika ada ulasan aktual di database, gunakan jumlah riil.
    // Jika tidak ada ulasan sama sekali di database, jangan tampilkan ulasan fiktif (set 0).
    const totalReview = actualReviewCount > 0 ? actualReviewCount : 0

    let rating = mitra.rating
    if (mitra.reviews && mitra.reviews.length > 0) {
      const sum = mitra.reviews.reduce((acc, r) => acc + r.rating, 0)
      rating = parseFloat((sum / mitra.reviews.length).toFixed(1))
    } else if (totalReview === 0) {
      rating = mitra.rating || 5.0
    }

    return {
      id: mitra.id,
      businessName: mitra.businessName,
      tagline: mitra.tagline,
      description: mitra.description,
      banner: mitra.banner,
      address: mitra.address,
      city: mitra.city,
      province: mitra.province,
      phone: mitra.phone,
      whatsapp: mitra.whatsapp,
      email: mitra.email,
      website: mitra.website,
      features: mitra.features,
      weekdayHours: mitra.weekdayHours,
      weekendHours: mitra.weekendHours,
      latitude: mitra.latitude,
      longitude: mitra.longitude,
      mapsUrl: (mitra as { mapsUrl?: string | null }).mapsUrl || null,
      rating,
      totalReview,
      isOpen,
      services: mitra.services.map((s) => ({
        id: s.id,
        name: s.name,
        price: s.price || 'Hubungi kami',
        icon: s.icon,
        description: s.description || null,
      })),
      images: mitra.images.map((img) => ({
        id: img.id,
        url: img.url,
      })),
      reviews: mitra.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
        user: {
          id: r.user.id,
          name: r.user.name,
          image: r.user.image,
        },
      })),
    }
  } catch (error) {
    console.error('Error fetching mitra:', error)
    return null
  }
}

// Loading fallback
function MitraDetailLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
    </div>
  )
}

export default async function MitraDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [mitra, session, headersList] = await Promise.all([
    getMitra(id),
    auth(),
    headers(),
  ])

  if (!mitra) {
    notFound()
  }

  const ua = headersList.get('user-agent') || ''
  const clientDevice = parseUserAgent(ua)
  const isMobileDevice = clientDevice.deviceType === 'mobile'

  let initialUserHasReview = false
  if (session?.user?.id) {
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: session.user.id,
        mitraId: id,
      },
      select: { id: true },
    })
    initialUserHasReview = !!existingReview
  }

  // Ambil gambar secara random dari galeri yang di-upload, jika tidak ada fallback ke banner
  let randomEditorialImage: string | null = null
  if (mitra.images && mitra.images.length > 0) {
    const validImages = mitra.images.filter((img) => Boolean(img?.url))
    if (validImages.length > 0) {
      const randomIndex = Math.floor(Math.random() * validImages.length)
      randomEditorialImage = validImages[randomIndex].url
    }
  }
  if (!randomEditorialImage) {
    randomEditorialImage = mitra.banner || null
  }

  return (
    <>
      <Suspense fallback={<MitraDetailLoading />}>
        <MitraDetailClient
          mitra={mitra}
          initialUserHasReview={initialUserHasReview}
          randomEditorialImage={randomEditorialImage}
          initialIsMobile={isMobileDevice}
        />
      </Suspense>
      <div className="block md:hidden">
        <Footer />
      </div>
    </>
  )
}
