import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: storeIdentifier } = await params
    const { searchParams } = new URL(req.url)
    const ratingFilter = searchParams.get('rating')
      ? parseInt(searchParams.get('rating')!)
      : null
    const hasMediaFilter = searchParams.get('hasMedia') === 'true'
    const sort = searchParams.get('sort') || 'newest'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get('limit') || '20'))
    )

    // Verify store exists by id or slug
    const store = await prisma.store.findFirst({
      where: {
        OR: [{ id: storeIdentifier }, { slug: storeIdentifier }],
      },
      select: { id: true, name: true, slug: true, companyName: true },
    })

    if (!store) {
      return NextResponse.json(
        { success: false, error: 'Cabang toko tidak ditemukan' },
        { status: 404 }
      )
    }

    // Build Prisma query condition for this store's reviews
    const baseWhere: any = {
      OR: [
        { storeId: store.id },
        { product: { storeId: store.id } },
        { order: { storeId: store.id } },
      ],
    }

    // Star filter
    const filterWhere: any = { ...baseWhere }
    if (ratingFilter && ratingFilter >= 1 && ratingFilter <= 5) {
      filterWhere.rating = ratingFilter
    }

    // Has media filter
    if (hasMediaFilter) {
      filterWhere.AND = [
        {
          OR: [{ images: { isEmpty: false } }, { videos: { isEmpty: false } }],
        },
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

    // Fetch filtered reviews and all reviews of this store for aggregate statistics
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

    // Calculate rating statistics
    const totalReviews = allStoreReviews.length
    const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    let sumRating = 0
    let mediaCount = 0

    // Extract all media items for the store media gallery
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
  } catch (error) {
    console.error('Error fetching store reviews:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil ulasan toko' },
      { status: 500 }
    )
  }
}
