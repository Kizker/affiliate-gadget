import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params
    const { searchParams } = new URL(req.url)
    const ratingFilter = searchParams.get('rating') ? parseInt(searchParams.get('rating')!) : null
    const hasMediaFilter = searchParams.get('hasMedia') === 'true'
    const sort = searchParams.get('sort') || 'newest'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, storeId: true },
    })

    if (!product) {
      return NextResponse.json({ success: false, error: 'Produk tidak ditemukan' }, { status: 404 })
    }

    // Build Prisma query condition
    const baseWhere: any = {
      productId: productId,
      type: 'PRODUCT',
    }

    // Star filter
    const filterWhere: any = { ...baseWhere }
    if (ratingFilter && ratingFilter >= 1 && ratingFilter <= 5) {
      filterWhere.rating = ratingFilter
    }

    // Has media filter
    if (hasMediaFilter) {
      filterWhere.OR = [
        { images: { isEmpty: false } },
        { videos: { isEmpty: false } },
      ]
    }

    // Order By
    let orderBy: any = { createdAt: 'desc' }
    if (sort === 'highest') {
      orderBy = [{ rating: 'desc' }, { createdAt: 'desc' }]
    } else if (sort === 'lowest') {
      orderBy = [{ rating: 'asc' }, { createdAt: 'desc' }]
    } else if (sort === 'helpful') {
      orderBy = [{ helpfulCount: 'desc' }, { createdAt: 'desc' }]
    }

    const skip = (page - 1) * limit

    // Fetch filtered reviews and all base reviews for aggregate statistics
    const [reviews, totalFiltered, allProductReviews] = await Promise.all([
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
          order: {
            select: {
              id: true,
              orderNumber: true,
              courierCode: true,
              courierService: true,
              status: true,
              completedAt: true,
            },
          },
          store: {
            select: {
              id: true,
              name: true,
              companyName: true,
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

    // Calculate detailed rating statistics
    const totalReviews = allProductReviews.length
    const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    let sumRating = 0
    let mediaCount = 0

    // Extract all media items for the media gallery strip preview
    const mediaGallery: Array<{
      url: string
      type: 'image' | 'video'
      reviewId: string
      authorName: string
      rating: number
      date: string
    }> = []

    allProductReviews.forEach((r) => {
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

    const averageRating = totalReviews > 0 ? Number((sumRating / totalReviews).toFixed(1)) : 5.0
    const satisfiedReviews = starCounts[5] + starCounts[4]
    const satisfactionRate = totalReviews > 0 ? Math.round((satisfiedReviews / totalReviews) * 100) : 100

    // Check customer eligibility (Delivered order verification)
    let userEligibility = {
      isLoggedIn: false,
      canReview: false,
      isDelivered: false,
      eligibleOrderId: null as string | null,
      eligibleVariantName: null as string | null,
      existingReview: null as any,
    }

    const session = await auth()
    if (session?.user?.id) {
      userEligibility.isLoggedIn = true

      // Check existing review by current user for this product
      const existingUserReview = await prisma.review.findFirst({
        where: {
          userId: session.user.id,
          productId: productId,
          type: 'PRODUCT',
        },
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      })

      if (existingUserReview) {
        userEligibility.canReview = true
        userEligibility.isDelivered = true
        userEligibility.existingReview = existingUserReview
        userEligibility.eligibleOrderId = existingUserReview.orderId
        userEligibility.eligibleVariantName = existingUserReview.variantName
      } else {
        // Look for completed/delivered order by this user containing this product
        const deliveredOrder = await prisma.order.findFirst({
          where: {
            userId: session.user.id,
            status: 'COMPLETED',
            items: {
              some: {
                productId: productId,
              },
            },
          },
          include: {
            items: {
              where: { productId: productId },
              take: 1,
            },
          },
          orderBy: { completedAt: 'desc' },
        })

        if (deliveredOrder) {
          userEligibility.canReview = true
          userEligibility.isDelivered = true
          userEligibility.eligibleOrderId = deliveredOrder.id
          userEligibility.eligibleVariantName = deliveredOrder.items[0]?.variantName || null
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page,
          limit,
          total: totalFiltered,
          totalPages: Math.ceil(totalFiltered / limit),
        },
        statistics: {
          averageRating,
          totalReviews,
          satisfactionRate,
          starCounts,
          mediaCount,
          mediaGallery: mediaGallery.slice(0, 16), // Top 16 media previews
        },
        userEligibility,
      },
    })
  } catch (error) {
    console.error('Error fetching product reviews:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal memuat ulasan produk' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Silakan masuk untuk memberikan ulasan' }, { status: 401 })
    }

    const { id: productId } = await params
    const body = await req.json()
    const {
      rating,
      comment,
      images = [],
      videos = [],
      variantName,
      orderId,
    } = body

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating harus bernilai antara 1 sampai 5 bintang' },
        { status: 400 }
      )
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, storeId: true },
    })

    if (!product) {
      return NextResponse.json({ success: false, error: 'Produk gadget tidak ditemukan' }, { status: 404 })
    }

    // Check if user has purchased and received the product, or find latest delivered order
    let resolvedOrderId = orderId
    let resolvedVariant = variantName

    if (!resolvedOrderId) {
      const deliveredOrder = await prisma.order.findFirst({
        where: {
          userId: session.user.id,
          status: 'COMPLETED',
          items: {
            some: { productId: productId },
          },
        },
        include: {
          items: {
            where: { productId: productId },
            take: 1,
          },
        },
        orderBy: { completedAt: 'desc' },
      })

      if (deliveredOrder) {
        resolvedOrderId = deliveredOrder.id
        if (!resolvedVariant) {
          resolvedVariant = deliveredOrder.items[0]?.variantName
        }
      }
    }

    // Check existing review
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: session.user.id,
        productId: productId,
        type: 'PRODUCT',
      },
    })

    // Clean image and video arrays
    const sanitizedImages = Array.isArray(images)
      ? images.filter((img: any) => typeof img === 'string' && img.trim().length > 0)
      : []
    const sanitizedVideos = Array.isArray(videos)
      ? videos.filter((vid: any) => typeof vid === 'string' && vid.trim().length > 0)
      : []

    let review
    if (existingReview) {
      // Update existing review
      review = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating: Number(rating),
          comment: comment?.trim() || null,
          images: sanitizedImages,
          videos: sanitizedVideos,
          variantName: resolvedVariant || existingReview.variantName,
          orderId: resolvedOrderId || existingReview.orderId,
          storeId: product.storeId || existingReview.storeId,
        },
        include: {
          user: { select: { id: true, name: true, image: true } },
          store: { select: { id: true, name: true } },
        },
      })
    } else {
      // Create new product review
      review = await prisma.review.create({
        data: {
          userId: session.user.id,
          productId: productId,
          storeId: product.storeId,
          orderId: resolvedOrderId || null,
          variantName: resolvedVariant || null,
          type: 'PRODUCT',
          rating: Number(rating),
          comment: comment?.trim() || null,
          images: sanitizedImages,
          videos: sanitizedVideos,
        },
        include: {
          user: { select: { id: true, name: true, image: true } },
          store: { select: { id: true, name: true } },
        },
      })
    }

    // Recalculate product rating & totalReview
    const allReviews = await prisma.review.findMany({
      where: { productId, type: 'PRODUCT' },
      select: { rating: true },
    })

    const totalReview = allReviews.length
    const averageRating = totalReview > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReview
      : 5.0

    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: Number(averageRating.toFixed(1)),
        totalReview,
      },
    })

    return NextResponse.json({
      success: true,
      message: existingReview ? 'Ulasan produk berhasil diperbarui!' : 'Ulasan dan lampiran media berhasil dikirim!',
      data: review,
    })
  } catch (error) {
    console.error('Error submitting product review:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan sistem saat menyimpan ulasan' },
      { status: 500 }
    )
  }
}
