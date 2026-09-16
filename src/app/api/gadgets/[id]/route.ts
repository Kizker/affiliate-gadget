import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

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

    const relatedProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        id: { not: id },
      },
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
        store: {
          select: { name: true, city: true },
        },
      },
    })

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
