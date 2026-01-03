import prisma from '@/lib/db'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import MitraDetailClient from './mitra-detail-client'
import { Loader2 } from 'lucide-react'

// Enable ISR - revalidate every 2 minutes
export const revalidate = 120

// Pre-generate popular mitra pages at build time
export async function generateStaticParams() {
  const mitras = await prisma.mitra.findMany({
    where: {
      isApproved: true,
      isActive: true,
    },
    take: 20,
    orderBy: [{ rating: 'desc' }, { totalReview: 'desc' }],
    select: { id: true },
  })

  return mitras.map((mitra) => ({
    id: mitra.id,
  }))
}

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
    return { title: 'Mitra Tidak Ditemukan - HaloTekno' }
  }

  return {
    title: `${mitra.businessName} - Rekomendasi HaloTekno`,
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
type MitraData = {
  id: string
  businessName: string
  tagline: string | null
  description: string | null
  banner: string | null
  address: string
  city: string
  phone: string
  email: string | null
  website: string | null
  features: string[] | null
  weekdayHours: string | null
  weekendHours: string | null
  latitude: number | null
  longitude: number | null
  rating: number
  totalReview: number
  isOpen: boolean
  services: Array<{
    id: string
    name: string
    price: string
    icon: string | null
  }>
  images: Array<{ id: string; url: string }>
}

// Fetch mitra data on server
async function getMitra(id: string): Promise<MitraData | null> {
  try {
    const mitra = await prisma.mitra.findUnique({
      where: { id },
      include: {
        services: {
          orderBy: { createdAt: 'asc' },
        },
        images: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!mitra || !mitra.isApproved || !mitra.isActive) {
      return null
    }

    // Calculate if currently open
    const now = new Date()
    const dayOfWeek = now.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const currentHours = isWeekend ? mitra.weekendHours : mitra.weekdayHours
    const isOpen = !!currentHours

    return {
      id: mitra.id,
      businessName: mitra.businessName,
      tagline: mitra.tagline,
      description: mitra.description,
      banner: mitra.banner,
      address: mitra.address,
      city: mitra.city,
      phone: mitra.phone,
      email: mitra.email,
      website: mitra.website,
      features: mitra.features,
      weekdayHours: mitra.weekdayHours,
      weekendHours: mitra.weekendHours,
      latitude: mitra.latitude,
      longitude: mitra.longitude,
      rating: mitra.rating,
      totalReview: mitra.totalReview,
      isOpen,
      services: mitra.services.map((s) => ({
        id: s.id,
        name: s.name,
        price: s.price || 'Hubungi kami',
        icon: s.icon,
      })),
      images: mitra.images.map((img) => ({
        id: img.id,
        url: img.url,
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
  const mitra = await getMitra(id)

  if (!mitra) {
    notFound()
  }

  return (
    <Suspense fallback={<MitraDetailLoading />}>
      <MitraDetailClient mitra={mitra} />
    </Suspense>
  )
}
