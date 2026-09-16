import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    const role = session?.user?.role

    if (!role || (role !== 'SUPER_ADMIN' && role !== 'STORE_ADMIN')) {
      return NextResponse.json(
        {
          error:
            'Akses ditolak: Hanya Superadmin atau Admin Toko yang dapat memperbarui varian warna massal.',
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      variantIds,
      newPrice,
      newStock,
      stockAdjustment,
    }: {
      variantIds?: string[]
      newPrice?: number | null
      newStock?: number | null
      stockAdjustment?: number | null
    } = body

    if (!variantIds || !Array.isArray(variantIds) || variantIds.length === 0) {
      return NextResponse.json(
        { error: 'Pilih setidaknya 1 varian warna untuk diperbarui.' },
        { status: 400 }
      )
    }

    const hasPriceUpdate =
      newPrice !== undefined &&
      newPrice !== null &&
      !isNaN(Number(newPrice)) &&
      Number(newPrice) >= 0
    const hasStockUpdate =
      newStock !== undefined &&
      newStock !== null &&
      !isNaN(Number(newStock)) &&
      Number(newStock) >= 0
    const hasStockAdj =
      stockAdjustment !== undefined &&
      stockAdjustment !== null &&
      !isNaN(Number(stockAdjustment)) &&
      Number(stockAdjustment) !== 0

    if (!hasPriceUpdate && !hasStockUpdate && !hasStockAdj) {
      return NextResponse.json(
        {
          error:
            'Masukkan setidaknya nilai harga baru atau jumlah stok untuk pembaruan massal.',
        },
        { status: 400 }
      )
    }

    // Role-based store check: Fetch variants and verify ownership
    const existingVariants = await prisma.productVariant.findMany({
      where: {
        id: { in: variantIds },
      },
      include: {
        product: {
          select: {
            id: true,
            storeId: true,
            name: true,
          },
        },
      },
    })

    if (existingVariants.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada varian yang ditemukan dengan ID yang diberikan.' },
        { status: 404 }
      )
    }

    // Store admin isolation
    if (role === 'STORE_ADMIN') {
      const userStoreId = session.user.storeId
      const unauthorized = existingVariants.some(
        (v) => v.product?.storeId !== userStoreId
      )
      if (unauthorized) {
        return NextResponse.json(
          {
            error:
              'Akses ditolak: Anda hanya dapat mengubah varian milik toko fisik cabang Anda.',
          },
          { status: 403 }
        )
      }
    }

    const affectedProductIds = new Set<string>()

    // Atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      let updatedCount = 0

      for (const variant of existingVariants) {
        const updateData: any = {}

        if (hasPriceUpdate) {
          updateData.price = Number(newPrice)
        }

        if (hasStockUpdate) {
          updateData.stock = Math.floor(Number(newStock))
        } else if (hasStockAdj) {
          const currentStock = Number(variant.stock) || 0
          const adjusted = Math.max(0, currentStock + Number(stockAdjustment))
          updateData.stock = adjusted
        }

        if (Object.keys(updateData).length > 0) {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: updateData,
          })
          updatedCount++
          affectedProductIds.add(variant.productId)
        }
      }

      // Re-calculate aggregate product price and stock
      for (const prodId of affectedProductIds) {
        const variants = await tx.productVariant.findMany({
          where: { productId: prodId },
        })

        if (variants.length > 0) {
          const totalStock = variants.reduce(
            (acc, v) => acc + (Number(v.stock) || 0),
            0
          )
          const minPrice = Math.min(
            ...variants.map((v) => Number(v.price) || 0)
          )

          await tx.product.update({
            where: { id: prodId },
            data: {
              stock: totalStock,
              ...(minPrice > 0 ? { price: minPrice } : {}),
            },
          })
        }
      }

      // Audit trail
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'BULK_COLOR_VARIANT_UPDATE',
          entityType: 'ProductVariant',
          details: {
            updatedCount,
            affectedProductCount: affectedProductIds.size,
            newPrice: hasPriceUpdate ? Number(newPrice) : null,
            newStock: hasStockUpdate ? Number(newStock) : null,
            stockAdjustment: hasStockAdj ? Number(stockAdjustment) : null,
            variantIds,
          },
        },
      })

      return { updatedCount, affectedProductCount: affectedProductIds.size }
    })

    const priceText = hasPriceUpdate
      ? `Rp ${Number(newPrice).toLocaleString('id-ID')}`
      : ''
    const message = hasPriceUpdate
      ? `Berhasil memperbarui ${result.updatedCount} varian warna ke harga ${priceText}.`
      : `Berhasil memperbarui stok untuk ${result.updatedCount} varian warna.`

    return NextResponse.json({
      success: true,
      message,
      updatedCount: result.updatedCount,
      affectedProductCount: result.affectedProductCount,
    })
  } catch (error: any) {
    console.error('Error bulk updating color variants:', error)
    return NextResponse.json(
      {
        error:
          'Terjadi kesalahan saat memperbarui varian warna massal: ' +
          (error?.message || 'Internal Server Error'),
      },
      { status: 500 }
    )
  }
}
