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
          },
        },
        variants: true,
      },
    })

    if (!product) {
      return NextResponse.json({ success: false, error: 'Produk gadget tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(
      {
        success: true,
        data: product,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching gadget detail:', error)
    return NextResponse.json({ success: false, error: 'Gagal memuat detail gadget' }, { status: 500 })
  }
}
