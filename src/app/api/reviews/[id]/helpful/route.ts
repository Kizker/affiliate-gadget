import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, helpfulCount: true },
    })

    if (!review) {
      return NextResponse.json({ success: false, error: 'Ulasan tidak ditemukan' }, { status: 404 })
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        helpfulCount: { increment: 1 },
      },
      select: { id: true, helpfulCount: true },
    })

    return NextResponse.json({
      success: true,
      helpfulCount: updated.helpfulCount,
    })
  } catch (error) {
    console.error('Error incrementing helpful count:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui jumlah bermanfaat' },
      { status: 500 }
    )
  }
}
