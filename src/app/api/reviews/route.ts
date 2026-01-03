import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// POST - Submit a review
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only customers can review
    if (session.user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Only customers can submit reviews' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { mitraId, rating, comment } = body

    // Validation
    if (!mitraId) {
      return NextResponse.json(
        { error: 'Mitra ID is required' },
        { status: 400 }
      )
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Check if mitra exists
    const mitra = await prisma.mitra.findUnique({
      where: { id: mitraId },
    })

    if (!mitra) {
      return NextResponse.json({ error: 'Mitra not found' }, { status: 404 })
    }

    // Check if user already reviewed this mitra
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: session.user.id,
        mitraId: mitraId,
      },
    })

    let review
    if (existingReview) {
      // Update existing review
      review = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating,
          comment: comment || null,
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
      })
    } else {
      // Create new review
      review = await prisma.review.create({
        data: {
          userId: session.user.id,
          mitraId,
          type: 'MITRA',
          rating,
          comment: comment || null,
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
      })
    }

    // Recalculate mitra rating
    const reviews = await prisma.review.findMany({
      where: { mitraId },
      select: { rating: true },
    })

    const totalReviews = reviews.length
    const averageRating =
      reviews.reduce(
        (sum: number, r: { rating: number }) => sum + r.rating,
        0
      ) / totalReviews

    // Update mitra rating
    await prisma.mitra.update({
      where: { id: mitraId },
      data: {
        rating: averageRating,
        totalReview: totalReviews,
      },
    })

    return NextResponse.json({
      message: 'Review submitted successfully',
      review,
    })
  } catch (error) {
    console.error('Error submitting review:', error)
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    )
  }
}

// GET - Fetch reviews for a mitra
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const mitraId = searchParams.get('mitraId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')

    if (!mitraId) {
      return NextResponse.json(
        { error: 'Mitra ID is required' },
        { status: 400 }
      )
    }

    const skip = (page - 1) * limit

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { mitraId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({
        where: { mitraId },
      }),
    ])

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a review
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const reviewId = searchParams.get('reviewId')

    if (!reviewId) {
      return NextResponse.json(
        { error: 'Review ID is required' },
        { status: 400 }
      )
    }

    // Find the review
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    })

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Check if user owns this review
    if (review.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own reviews' },
        { status: 403 }
      )
    }

    const mitraId = review.mitraId

    // Delete the review
    await prisma.review.delete({
      where: { id: reviewId },
    })

    // Recalculate mitra rating if mitra exists
    if (mitraId) {
      const reviews = await prisma.review.findMany({
        where: { mitraId },
        select: { rating: true },
      })

      const totalReviews = reviews.length
      const averageRating =
        totalReviews > 0
          ? reviews.reduce(
              (sum: number, r: { rating: number }) => sum + r.rating,
              0
            ) / totalReviews
          : 0

      await prisma.mitra.update({
        where: { id: mitraId },
        data: {
          rating: averageRating,
          totalReview: totalReviews,
        },
      })
    }

    return NextResponse.json({ message: 'Review deleted successfully' })
  } catch (error) {
    console.error('Error deleting review:', error)
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    )
  }
}
