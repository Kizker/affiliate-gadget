import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { sortRelatedProductsByRelevance } from '@/lib/relevance-scoring'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        store: {
          include: {
            bankAccounts: true,
            schedules: true,
            products: {
              where: { isActive: true, id: { not: id } },
              take: 6,
              select: {
                id: true,
                name: true,
                price: true,
                originalPrice: true,
                images: true,
                rating: true,
                totalReview: true,
                stock: true,
              },
            },
            _count: {
              select: {
                products: true,
              },
            },
          },
        },
        variants: true,
      },
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Produk gadget tidak ditemukan' },
        { status: 404 }
      )
    }

    // Ambil seluruh produk aktif untuk rekomendasi bertingkat relevansi
    const allCandidates = await prisma.product.findMany({
      where: {
        isActive: true,
        id: { not: id },
      },
      select: {
        id: true,
        name: true,
        brand: true,
        category: true,
        condition: true,
        price: true,
        originalPrice: true,
        images: true,
        rating: true,
        totalReview: true,
        stock: true,
        warrantyDays: true,
        includesCharger: true,
        includesScreenProtector: true,
        includesCase: true,
        storeId: true,
        createdAt: true,
        store: {
          select: { id: true, name: true, city: true },
        },
      },
    })

    // Agregasi penjualan riil untuk skor relevansi
    const candidateIds = allCandidates.map((c) => c.id)
    const salesMap = new Map<string, number>()
    if (candidateIds.length > 0) {
      const salesGroup = await prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          productId: { in: candidateIds },
          order: {
            status: { not: 'CANCELLED' },
          },
        },
        _sum: {
          quantity: true,
        },
      })
      salesGroup.forEach((s) => {
        if (s.productId) {
          salesMap.set(s.productId, s._sum.quantity || 0)
        }
      })
    }

    const enrichedCandidates = allCandidates.map((c) => ({
      ...c,
      has3in1Bonus: Boolean(
        c.includesCharger && c.includesScreenProtector && c.includesCase
      ),
      soldCount: salesMap.get(c.id) || 0,
    }))

    // Urutkan berdasarkan kemiripan merek, kategori, harga, dan performa
    const relatedProducts = sortRelatedProductsByRelevance(
      enrichedCandidates,
      product
    )

    return NextResponse.json(
      {
        success: true,
        data: {
          ...product,
          relatedProducts,
        },
      },
      {
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching gadget detail:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal memuat detail gadget' },
      { status: 500 }
    )
  }
}
