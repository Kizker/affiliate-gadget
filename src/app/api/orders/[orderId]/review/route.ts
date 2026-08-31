import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await params
    const body = await request.json()
    const { rating, comment, images = [], videos = [] } = body

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Get order and verify
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        technician: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Verify user owns this order
    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify order is completed
    if (order.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Can only review completed orders' },
        { status: 400 }
      )
    }

    const firstProductItem = order.items.find((i) => i.type === 'PRODUCT' && i.productId)
    const reviewType = firstProductItem ? 'PRODUCT' : 'TECHNICIAN'
    const productId = firstProductItem?.productId || null
    const variantName = firstProductItem?.variantName || null

    const sanitizedImages = Array.isArray(images) ? images.filter((img) => typeof img === 'string') : []
    const sanitizedVideos = Array.isArray(videos) ? videos.filter((vid) => typeof vid === 'string') : []

    // Check if review already exists
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: session.user.id,
        orderId: orderId,
      },
    })

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
          productId: productId || existingReview.productId,
          storeId: order.storeId || existingReview.storeId,
          variantName: variantName || existingReview.variantName,
        },
      })
    } else {
      // Create new review
      review = await prisma.review.create({
        data: {
          userId: session.user.id,
          orderId: orderId,
          storeId: order.storeId,
          productId: productId,
          variantName: variantName,
          type: reviewType,
          rating: Number(rating),
          comment: comment?.trim() || null,
          images: sanitizedImages,
          videos: sanitizedVideos,
        },
      })
    }

    // If product review, recalculate rating & totalReview
    if (productId) {
      const allProductReviews = await prisma.review.findMany({
        where: { productId, type: 'PRODUCT' },
        select: { rating: true },
      })
      const total = allProductReviews.length
      const avg = total > 0 ? allProductReviews.reduce((acc, r) => acc + r.rating, 0) / total : 5.0

      await prisma.product.update({
        where: { id: productId },
        data: {
          rating: Number(avg.toFixed(1)),
          totalReview: total,
        },
      })
    }

    return NextResponse.json({ review, success: true })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await params

    // Get review for this order by current user
    const review = await prisma.review.findFirst({
      where: {
        userId: session.user.id,
        orderId: orderId,
      },
    })

    return NextResponse.json({ review })
  } catch (error) {
    console.error('Error fetching review:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
