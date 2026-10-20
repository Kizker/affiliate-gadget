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
    const { mitraId, rating, comment, images = [], videos = [] } = body

    const sanitizedImages = Array.isArray(images)
      ? images.filter((img) => typeof img === 'string')
      : []
    const sanitizedVideos = Array.isArray(videos)
      ? videos.filter((vid) => typeof vid === 'string')
      : []

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
          images: Array.isArray(images)
            ? sanitizedImages
            : existingReview.images,
          videos: Array.isArray(videos)
            ? sanitizedVideos
            : existingReview.videos,
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
          images: sanitizedImages,
          videos: sanitizedVideos,
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

// GET - Fetch reviews for a mitra or store
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const mitraId = searchParams.get('mitraId')
    const storeId = searchParams.get('storeId')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(
      100,
      Math.max(
        1,
        parseInt(searchParams.get('limit') || (storeId ? '10' : '100'))
      )
    )

    if (!mitraId && !storeId) {
      return NextResponse.json(
        { error: 'mitraId or storeId is required' },
        { status: 400 }
      )
    }

    // ─────────────────────────────────────────────────────────────
    // STORE REVIEWS BRANCH
    // ─────────────────────────────────────────────────────────────
    if (storeId) {
      const store = await prisma.store.findFirst({
        where: {
          OR: [{ id: storeId }, { slug: storeId }],
        },
        select: { id: true, name: true, slug: true, companyName: true },
      })

      if (!store) {
        return NextResponse.json(
          { success: false, error: 'Cabang toko tidak ditemukan' },
          { status: 404 }
        )
      }

      const ratingFilter = searchParams.get('rating')
        ? parseInt(searchParams.get('rating')!)
        : null
      const hasMediaFilter = searchParams.get('hasMedia') === 'true'
      const sort = searchParams.get('sort') || 'newest'

      const baseWhere: any = {
        OR: [
          { storeId: store.id },
          { product: { storeId: store.id } },
          { order: { storeId: store.id } },
        ],
      }

      const filterWhere: any = { ...baseWhere }
      if (ratingFilter && ratingFilter >= 1 && ratingFilter <= 5) {
        filterWhere.rating = ratingFilter
      }
      if (hasMediaFilter) {
        filterWhere.AND = [
          {
            OR: [
              { images: { isEmpty: false } },
              { videos: { isEmpty: false } },
            ],
          },
        ]
      }

      let orderBy: any = { createdAt: 'desc' }
      if (sort === 'highest') {
        orderBy = [{ rating: 'desc' }, { createdAt: 'desc' }]
      } else if (sort === 'lowest') {
        orderBy = [{ rating: 'asc' }, { createdAt: 'desc' }]
      } else if (sort === 'helpful') {
        orderBy = [{ helpfulCount: 'desc' }, { createdAt: 'desc' }]
      }

      const skip = (page - 1) * limit

      const [reviews, totalFiltered, allStoreReviews] = await Promise.all([
        prisma.review.findMany({
          where: filterWhere,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            product: {
              select: {
                id: true,
                name: true,
              },
            },
            order: {
              select: {
                id: true,
                orderNumber: true,
                status: true,
                completedAt: true,
              },
            },
          },
          orderBy,
          skip,
          take: limit,
        }),
        prisma.review.count({
          where: filterWhere,
        }),
        prisma.review.findMany({
          where: baseWhere,
          select: {
            id: true,
            rating: true,
            images: true,
            videos: true,
            createdAt: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        }),
      ])

      const totalReviews = allStoreReviews.length
      const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      let sumRating = 0
      let mediaCount = 0

      const mediaGallery: Array<{
        url: string
        type: 'image' | 'video'
        reviewId: string
        authorName: string
        rating: number
        date: string
      }> = []

      allStoreReviews.forEach((r) => {
        sumRating += r.rating
        if (r.rating >= 1 && r.rating <= 5) {
          starCounts[r.rating as keyof typeof starCounts]++
        }

        const hasImages = Array.isArray(r.images) && r.images.length > 0
        const hasVideos = Array.isArray(r.videos) && r.videos.length > 0

        if (hasImages || hasVideos) {
          mediaCount++
        }

        if (hasImages) {
          r.images.forEach((imgUrl) => {
            if (imgUrl) {
              mediaGallery.push({
                url: imgUrl,
                type: 'image',
                reviewId: r.id,
                authorName: r.user?.name || 'Pembeli',
                rating: r.rating,
                date: r.createdAt.toISOString(),
              })
            }
          })
        }

        if (hasVideos) {
          r.videos.forEach((vidUrl) => {
            if (vidUrl) {
              mediaGallery.push({
                url: vidUrl,
                type: 'video',
                reviewId: r.id,
                authorName: r.user?.name || 'Pembeli',
                rating: r.rating,
                date: r.createdAt.toISOString(),
              })
            }
          })
        }
      })

      const averageRating =
        totalReviews > 0 ? Number((sumRating / totalReviews).toFixed(1)) : 5.0

      return NextResponse.json({
        success: true,
        store: {
          id: store.id,
          name: store.name,
          slug: store.slug,
          companyName: store.companyName,
        },
        reviews,
        statistics: {
          totalReviews,
          averageRating,
          mediaCount,
          starCounts,
          mediaGallery,
        },
        pagination: {
          page,
          limit,
          totalFiltered,
          totalPages: Math.ceil(totalFiltered / limit) || 1,
        },
      })
    }

    // ─────────────────────────────────────────────────────────────
    // MITRA REVIEWS BRANCH
    // ─────────────────────────────────────────────────────────────
    const skip = (page - 1) * limit

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { mitraId: mitraId! },
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
        where: { mitraId: mitraId! },
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
