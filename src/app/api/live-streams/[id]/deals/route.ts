import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import {
  createLiveDeal,
  deactivateStreamDeals,
  verifyDealToken,
  getActiveDealForStream,
} from '@/lib/live-deals'

/**
 * GET /api/live-streams/[id]/deals?token=deal_xxx
 * Memverifikasi validitas token diskon live atau mendapatkan deal aktif saat ini
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: streamId } = await params
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (token) {
    const result = verifyDealToken(token)
    return NextResponse.json({
      success: true,
      valid: result.valid,
      reason: result.reason,
      deal: result.deal || null,
    })
  }

  // Jika tanpa token, ambil deal yang sedang aktif di stream ini
  const activeDeal = getActiveDealForStream(streamId)
  return NextResponse.json({
    success: true,
    activeDeal,
  })
}

/**
 * POST /api/live-streams/[id]/deals
 * Host studio membuat diskon spesial live untuk produk yang disematkan
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: streamId } = await params

  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const {
      productId,
      productTitle,
      productImage,
      productSlug,
      originalPrice,
      discountPrice,
    } = body

    if (
      !productId ||
      typeof originalPrice !== 'number' ||
      typeof discountPrice !== 'number'
    ) {
      return NextResponse.json(
        { success: false, error: 'Data diskon produk live tidak lengkap' },
        { status: 400 }
      )
    }

    if (discountPrice <= 0 || discountPrice >= originalPrice) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Harga diskon live harus lebih kecil dari harga normal dan lebih besar dari 0',
        },
        { status: 400 }
      )
    }

    const newDeal = createLiveDeal({
      streamId,
      productId,
      productTitle,
      productImage,
      productSlug,
      originalPrice,
      discountPrice,
    })

    return NextResponse.json({
      success: true,
      data: newDeal,
    })
  } catch (error) {
    console.error('[LiveDeal API] Error creating live deal:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal membuat diskon khusus live' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/live-streams/[id]/deals
 * Host melepas sematan barang (unpin) sehingga diskon live dinonaktifkan
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: streamId } = await params
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('productId') || undefined

  deactivateStreamDeals(streamId, productId)

  return NextResponse.json({
    success: true,
    message: 'Diskon khusus live telah dinonaktifkan.',
  })
}
