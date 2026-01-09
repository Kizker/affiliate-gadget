import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import TeknisiDetailClient from './teknisi-detail-client'
import { Loader2 } from 'lucide-react'

// Enable ISR - revalidate every 60 seconds
export const revalidate = 60

// Generate static paths for popular technicians at build time
export async function generateStaticParams() {
  const technicians = await db.technician.findMany({
    where: {
      isAvailable: true,
      user: { isActive: true },
    },
    take: 20,
    select: { id: true },
  })

  return technicians.map((tech) => ({
    id: tech.id,
  }))
}

// Fetch technician data on server
async function getTechnician(id: string) {
  try {
    const technician = await db.technician.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            phone: true,
            email: true,
            isActive: true,
          },
        },
        services: {
          where: { isActive: true },
          orderBy: { category: 'asc' },
        },
      },
    })

    if (!technician || !technician.user || !technician.user.isActive) {
      return null
    }

    return technician
  } catch (error) {
    console.error('Error fetching technician:', error)
    return null
  }
}

// Fetch reviews for technician
async function getReviews(technicianId: string) {
  try {
    const reviews = await db.review.findMany({
      where: {
        type: 'TECHNICIAN',
        order: { technicianId },
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    })

    // Calculate average rating
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0)
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0

    return {
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
        user: {
          name: r.user.name || 'Anonymous',
          image: r.user.image,
        },
      })),
      averageRating,
      totalReviews: reviews.length,
    }
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return { reviews: [], averageRating: 0, totalReviews: 0 }
  }
}

// Loading fallback component
function TeknisiDetailLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
    </div>
  )
}

export default async function TeknisiDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Fetch data in parallel on server
  const [technician, reviews] = await Promise.all([
    getTechnician(id),
    getReviews(id),
  ])

  if (!technician) {
    notFound()
  }

  // Transform technician data for client
  const technicianData = {
    id: technician.id,
    bio: technician.bio,
    experience: technician.experience,
    specialties: technician.specialties,
    rating: reviews.averageRating,
    totalReview: reviews.totalReviews,
    isAvailable: technician.isAvailable,
    user: {
      id: technician.user.id,
      name: technician.user.name,
      image: technician.user.image,
      phone: technician.user.phone,
    },
    services: technician.services.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      price: s.price,
      minPrice: s.minPrice,
      maxPrice: s.maxPrice,
      description: s.description,
    })),
    reviews: [],
  }

  return (
    <Suspense fallback={<TeknisiDetailLoading />}>
      <TeknisiDetailClient technician={technicianData} reviews={reviews} />
    </Suspense>
  )
}
