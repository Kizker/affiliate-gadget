import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// GET - Fetch analytics for mitra dashboard
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findFirst({
      where: session.user.id
        ? { id: session.user.id }
        : { email: session.user.email! },
      select: { id: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (
      user.role !== 'MITRA' &&
      user.role !== 'STORE_ADMIN' &&
      user.role !== 'SUPER_ADMIN'
    ) {
      return NextResponse.json(
        { error: 'Only mitra can access analytics' },
        { status: 403 }
      )
    }

    // Get mitra profile with analytics
    const mitra = await prisma.mitra.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        totalViews: true,
        totalInquiries: true,
        rating: true,
        totalReview: true,
        reviews: {
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

    const totalReviews =
      mitra.reviews.length > 0 ? mitra.reviews.length : mitra.totalReview || 0
    const averageRating =
      mitra.reviews.length > 0
        ? mitra.reviews.reduce((acc, r) => acc + r.rating, 0) /
          mitra.reviews.length
        : mitra.rating || 0

    const response = NextResponse.json({
      totalViews: mitra.totalViews || 0,
      totalInquiries: mitra.totalInquiries || 0,
      averageRating,
      totalReviews,
      recentReviews,
    })

    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    )
    return response
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
