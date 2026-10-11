import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ hasReview: false })
    }

    const { searchParams } = new URL(req.url)
    const mitraId = searchParams.get('mitraId')

    if (!mitraId) {
      return NextResponse.json(
        { error: 'Mitra ID is required' },
        { status: 400 }
      )
    }

    const userReview = await prisma.review.findFirst({
      where: {
        userId: session.user.id,
        mitraId,
      },
      select: {
        id: true,
        rating: true,
        comment: true,
      },
    })

    return NextResponse.json({
      hasReview: !!userReview,
      reviewId: userReview?.id,
      review: userReview || null,
    })
  } catch (error) {
    console.error('Error checking user review status:', error)
    return NextResponse.json(
      { error: 'Failed to check review status', hasReview: false },
      { status: 500 }
    )
  }
}
