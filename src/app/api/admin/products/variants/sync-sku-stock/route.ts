import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/products/variants/sync-sku-stock
 * Unifies stock for all variants sharing the exact same Master SKU
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    const role = session?.user?.role

    if (!role || (role !== 'SUPER_ADMIN' && role !== 'STORE_ADMIN')) {
      return NextResponse.json(
        {
          error:
            'Akses ditolak: Hanya Superadmin atau Admin Toko yang dapat menyamakan stok SKU.',
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { sku, targetStock } = body

    if (!sku || typeof sku !== 'string' || sku.trim() === '') {
      return NextResponse.json(
        { error: 'Kode SKU wajib diisi.' },
        { status: 400 }
      )
    }

    const cleanSku = sku.trim()
    const newStock = Math.max(0, parseInt(String(targetStock)) || 0)

    let userStoreId = session.user.storeId
    if (role === 'STORE_ADMIN' && !userStoreId && session.user.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { storeId: true },
      })
      userStoreId = dbUser?.storeId || null
    }

    // Role-scoped update: only update variants for this store's products
    const whereClause: any = {
      sku: cleanSku,
    }

    if (role === 'STORE_ADMIN') {
      if (!userStoreId) {
        return NextResponse.json(
          { error: 'Toko tidak teridentifikasi' },
          { status: 400 }
        )
      }
      whereClause.product = {
        storeId: userStoreId,
      }
    }

    // Find affected variants first
    const variants = await prisma.productVariant.findMany({
      where: whereClause,
      select: { id: true, productId: true },
    })

    if (variants.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ditemukan variasi dengan SKU tersebut.' },
        { status: 404 }
      )
    }

    // Update variants stock atomically
    await prisma.$transaction(async (tx) => {
      await tx.productVariant.updateMany({
        where: whereClause,
        data: { stock: newStock },
      })

      // Update parent products total stock
      const productIds = Array.from(new Set(variants.map((v) => v.productId)))
      for (const prodId of productIds) {
        const allVars = await tx.productVariant.findMany({
          where: { productId: prodId },
          select: { stock: true },
        })
        const sumStock = allVars.reduce((acc, curr) => acc + curr.stock, 0)
        await tx.product.update({
          where: { id: prodId },
          data: { stock: sumStock },
        })
      }
    })

    return NextResponse.json({
      success: true,
      sku: cleanSku,
      syncedStock: newStock,
      updatedVariantsCount: variants.length,
      message: `Berhasil menyamakan stok (${newStock} unit) untuk seluruh variasi ber-SKU ${cleanSku}.`,
    })
  } catch (error: any) {
    console.error('Error syncing SKU stock:', error)
    return NextResponse.json(
      { error: error?.message || 'Gagal menyamakan stok SKU.' },
      { status: 500 }
    )
  }
}
