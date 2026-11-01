import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET - List all groups with after sales user and stores
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const groups = await prisma.storeGroup.findMany({
      include: {
        afterSalesUser: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        stores: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Also fetch available after sales users (users with role AFTER_SALES)
    const afterSalesUsers = await prisma.user.findMany({
      where: { role: 'AFTER_SALES' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        managedGroup: {
          select: { id: true, name: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    // Also fetch all stores so superadmin can select which stores belong to which group
    const allStores = await prisma.store.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        groupId: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: groups,
      afterSalesUsers,
      allStores,
    })
  } catch (error) {
    console.error('Error fetching store groups:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data grup cabang' },
      { status: 500 }
    )
  }
}

// POST - Create a new store group
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, afterSalesUserId, storeIds } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Nama grup wajib diisi' },
        { status: 400 }
      )
    }

    // Check if afterSalesUserId already manages another group
    if (afterSalesUserId) {
      const existingAssignment = await prisma.storeGroup.findFirst({
        where: { afterSalesUserId },
      })
      if (existingAssignment) {
        return NextResponse.json(
          {
            error:
              'Akun After Sales ini sudah ditugaskan pada grup lain. 1 akun hanya menangani 1 grup.',
          },
          { status: 400 }
        )
      }
    }

    // Create group and connect stores
    const group = await prisma.storeGroup.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        afterSalesUserId: afterSalesUserId || null,
        stores:
          Array.isArray(storeIds) && storeIds.length > 0
            ? {
                connect: storeIds.map((id: string) => ({ id })),
              }
            : undefined,
      },
      include: {
        afterSalesUser: {
          select: { id: true, name: true, email: true },
        },
        stores: {
          select: { id: true, name: true, city: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Grup cabang berhasil dibuat',
      data: group,
    })
  } catch (error: any) {
    console.error('Error creating store group:', error)
    return NextResponse.json(
      { error: error.message || 'Gagal membuat grup cabang' },
      { status: 500 }
    )
  }
}
