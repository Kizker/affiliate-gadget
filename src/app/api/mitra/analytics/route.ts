import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// GET - Fetch analytics for mitra dashboard
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'MITRA') {
      return NextResponse.json(
        { error: 'Only mitra can access analytics' },
        { status: 403 }
      )
    }

    // Get mitra profile with analytics
    const mitra = await prisma.mitra.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        totalViews: true,
        totalInquiries: true,
        rating: true,
        totalReview: true,
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    if (!mitra) {
      return NextResponse.json({ error: 'Mitra not found' }, { status: 404 })
    }

    // Format recent reviews
    const recentReviews = mitra.reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
      userName: review.user.name || 'Anonymous',
    }))

    return NextResponse.json({
      totalViews: mitra.totalViews,
      totalInquiries: mitra.totalInquiries,
      averageRating: mitra.rating,
      totalReviews: mitra.totalReview,
      recentReviews,
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
