import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import {
  getEtalases,
  createEtalaseRecord,
  ensureInitialEtalasesSeeded,
  invalidatePublicGadgetsCache,
} from '@/lib/etalase-db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = session.user.role
    if (
      !['SUPER_ADMIN', 'ADMIN', 'STORE_ADMIN', 'STORE_SALES'].includes(role)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    let storeId = searchParams.get('storeId') || 'ALL'
    const search = searchParams.get('search') || ''
    const brand = searchParams.get('brand') || 'ALL'

    // Penegakan Multi-Tenant untuk Admin Toko
    if (role === 'STORE_ADMIN' || role === 'STORE_SALES') {
      let userStoreId = session.user.storeId
      if (!userStoreId && session.user.id) {
        const u = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { storeId: true },
        })
        userStoreId = u?.storeId || null
      }
      if (!userStoreId) {
        return NextResponse.json(
          { error: 'Store not assigned' },
          { status: 403 }
        )
      }
      storeId = userStoreId
    }

    await ensureInitialEtalasesSeeded()
    const etalases = await getEtalases({
      storeId: storeId === 'ALL' ? '' : storeId,
      brand,
      search,
      onlyActive: false,
    })

    return NextResponse.json(
      {
        success: true,
        etalases,
        total: etalases.length,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    )
  } catch (error) {
    console.error('[GET /api/admin/etalase Error]:', error)
    return NextResponse.json(
      { error: 'Gagal memuat daftar etalase' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = session.user.role
    if (!['SUPER_ADMIN', 'ADMIN', 'STORE_ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    let targetStoreId = body.storeId || ''

    if (role === 'STORE_ADMIN') {
      let userStoreId = session.user.storeId
      if (!userStoreId && session.user.id) {
        const u = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { storeId: true },
        })
        userStoreId = u?.storeId || null
      }
      if (!userStoreId) {
        return NextResponse.json(
          { error: 'Toko cabang tidak ditemukan pada sesi Anda' },
          { status: 403 }
        )
      }
      targetStoreId = userStoreId
    }

    if (!targetStoreId || targetStoreId === 'ALL') {
      return NextResponse.json(
        { error: 'Silakan pilih cabang toko pemilik etalase terlebih dahulu' },
        { status: 400 }
      )
    }

    const rawItems: Array<{
      productId: string
      label?: string
      sortOrder?: number
    }> = Array.isArray(body.items) ? body.items : []

    if (rawItems.length === 0) {
      return NextResponse.json(
        { error: 'Pilih minimal 1 produk untuk dimasukkan ke dalam etalase' },
        { status: 400 }
      )
    }

    // Validasi bahwa seluruh produk yang dimasukkan adalah milik cabang toko terkait (Anti-IDOR)
    const productIds = rawItems.map((i) => i.productId).filter(Boolean)
    const validProducts = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        storeId: targetStoreId,
      },
      select: { id: true, name: true, brand: true, category: true },
    })

    if (validProducts.length !== productIds.length) {
      return NextResponse.json(
        {
          error:
            'Terdapat produk yang tidak ditemukan atau bukan milik cabang toko ini',
        },
        { status: 404 }
      )
    }

    const primaryProd =
      validProducts.find((p) => p.id === body.coverProductId) ||
      validProducts[0]

    const etalaseName =
      String(body.name || body.customTitle || primaryProd?.name || '').trim() ||
      'Etalase Gadget Resmi'

    const created = await createEtalaseRecord({
      storeId: targetStoreId,
      name: etalaseName,
      description: body.description || null,
      brand: body.brand || primaryProd?.brand || null,
      category: body.category || primaryProd?.category || 'Smartphone',
      coverProductId: body.coverProductId || primaryProd?.id || null,
      customCoverImage: body.customCoverImage || null,
      customTitle: body.customTitle || etalaseName,
      priceMode: body.priceMode || 'LOWEST',
      customPrice:
        body.customPrice !== undefined && body.customPrice !== null
          ? Number(body.customPrice)
          : null,
      customOriginalPrice:
        body.customOriginalPrice !== undefined &&
        body.customOriginalPrice !== null
          ? Number(body.customOriginalPrice)
          : null,
      isActive: body.isActive ?? true,
      items: rawItems,
    })

    invalidatePublicGadgetsCache()

    return NextResponse.json({
      success: true,
      data: created,
    })
  } catch (error) {
    console.error('[POST /api/admin/etalase Error]:', error)
    return NextResponse.json(
      { error: 'Gagal membuat etalase baru' },
      { status: 500 }
    )
  }
}
