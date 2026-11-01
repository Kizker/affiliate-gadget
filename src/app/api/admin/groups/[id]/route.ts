import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

// PUT - Update existing store group
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, description, afterSalesUserId, storeIds } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Nama grup wajib diisi' },
        { status: 400 }
      )
    }

    // Check if another group already has this afterSalesUserId
    if (afterSalesUserId) {
      const existingAssignment = await prisma.storeGroup.findFirst({
        where: {
          afterSalesUserId,
          NOT: { id },
        },
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

    // Disconnect previously connected stores and connect new stores in transaction
    const targetStoreIds = Array.isArray(storeIds) ? storeIds : []

    const updatedGroup = await prisma.$transaction(async (tx) => {
      // First disconnect all current stores belonging to this group
      await tx.store.updateMany({
        where: { groupId: id },
        data: { groupId: null },
      })

      // Update group details
      const group = await tx.storeGroup.update({
        where: { id },
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          afterSalesUserId: afterSalesUserId || null,
        },
      })

      // Connect new store IDs
      if (targetStoreIds.length > 0) {
        await tx.store.updateMany({
          where: { id: { in: targetStoreIds } },
          data: { groupId: id },
        })
      }

      return group
    })

    // Return updated group with relations
    const result = await prisma.storeGroup.findUnique({
      where: { id: updatedGroup.id },
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
      message: 'Grup cabang berhasil diperbarui',
      data: result,
    })
  } catch (error: any) {
    console.error('Error updating store group:', error)
    return NextResponse.json(
      { error: error.message || 'Gagal memperbarui grup cabang' },
      { status: 500 }
    )
  }
}

// DELETE - Remove store group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    await prisma.$transaction(async (tx) => {
      // Unlink all stores
      await tx.store.updateMany({
        where: { groupId: id },
        data: { groupId: null },
      })

      // Delete group
      await tx.storeGroup.delete({
        where: { id },
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Grup cabang berhasil dihapus',
    })
  } catch (error: any) {
    console.error('Error deleting store group:', error)
    return NextResponse.json(
      { error: error.message || 'Gagal menghapus grup cabang' },
      { status: 500 }
    )
  }
}
