import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import {
  getEtalaseByIdOrProductId,
  updateEtalaseRecord,
  deleteEtalaseRecord,
  invalidatePublicGadgetsCache,
} from '@/lib/etalase-db'

export const dynamic = 'force-dynamic'

async function resolveStoreScope(session: any): Promise<string | null> {
  const role = session?.user?.role
  if (role === 'STORE_ADMIN' || role === 'STORE_SALES') {
    if (session.user.storeId) return session.user.storeId
    if (session.user.id) {
      const u = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { storeId: true },
      })
      return u?.storeId || '__UNAUTHORIZED__'
    }
    return '__UNAUTHORIZED__'
  }
  return null
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const storeScope = await resolveStoreScope(session)
    const etalase = await getEtalaseByIdOrProductId(id)

    if (!etalase || (storeScope && etalase.storeId !== storeScope)) {
      return NextResponse.json(
        { error: 'Etalase tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: etalase,
    })
  } catch (error) {
    console.error('[GET /api/admin/etalase/[id] Error]:', error)
    return NextResponse.json(
      { error: 'Gagal memuat detail etalase' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = session.user.role
    if (!['SUPER_ADMIN', 'ADMIN', 'STORE_ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const storeScope = await resolveStoreScope(session)
    const body = await request.json()

    // Jika mengupdate daftar items, pastikan semua produk milik toko yang sama dengan etalase
    if (Array.isArray(body.items) && body.items.length > 0 && storeScope) {
      const productIds = body.items.map((i: any) => i.productId).filter(Boolean)
      const validProducts = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          storeId: storeScope,
        },
        select: { id: true },
      })
      if (validProducts.length !== productIds.length) {
        return NextResponse.json(
          { error: 'Produk tidak ditemukan di cabang toko Anda' },
          { status: 404 }
        )
      }
    }

    const updated = await updateEtalaseRecord(id, storeScope, {
      name: body.name ?? body.customTitle,
      description: body.description,
      brand: body.brand,
      category: body.category,
      coverProductId: body.coverProductId,
      customCoverImage: body.customCoverImage,
      customTitle: body.customTitle,
      priceMode: body.priceMode,
      customPrice: body.customPrice,
      customOriginalPrice: body.customOriginalPrice,
      isActive: body.isActive,
      items: body.items,
    })

    if (!updated) {
      return NextResponse.json(
        { error: 'Etalase tidak ditemukan' },
        { status: 404 }
      )
    }

    invalidatePublicGadgetsCache()

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    console.error('[PATCH /api/admin/etalase/[id] Error]:', error)
    return NextResponse.json(
      { error: 'Gagal memperbarui etalase' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = session.user.role
    if (!['SUPER_ADMIN', 'ADMIN', 'STORE_ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const storeScope = await resolveStoreScope(session)
    const ok = await deleteEtalaseRecord(id, storeScope)

    if (!ok) {
      return NextResponse.json(
        { error: 'Etalase tidak ditemukan' },
        { status: 404 }
      )
    }

    invalidatePublicGadgetsCache()

    return NextResponse.json({
      success: true,
      message: 'Etalase berhasil dihapus',
    })
  } catch (error) {
    console.error('[DELETE /api/admin/etalase/[id] Error]:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus etalase' },
      { status: 500 }
    )
  }
}
