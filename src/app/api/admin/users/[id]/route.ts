import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    // Only ADMIN and SUPER_ADMIN can update users
    if (
      !session?.user ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { role, isActive, mitraStatus } = body

    // Get user to check if it's SUPER_ADMIN
    const user = await prisma.user.findUnique({
      where: { id },
      select: { role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Cannot modify SUPER_ADMIN
    if (user.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Cannot modify SUPER_ADMIN' },
        { status: 403 }
      )
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (role !== undefined) updateData.role = role
    if (isActive !== undefined) updateData.isActive = isActive
    if (mitraStatus !== undefined) updateData.mitraStatus = mitraStatus

    // If mitraStatus is being updated, also update Mitra table and user role
    if (mitraStatus !== undefined) {
      // Find mitra record for this user
      const mitra = await prisma.mitra.findUnique({
        where: { userId: id },
      })

      if (mitra) {
        // Update Mitra.isApproved based on mitraStatus
        await prisma.mitra.update({
          where: { userId: id },
          data: {
            isApproved: mitraStatus === 'APPROVED',
          },
        })

        // Update user role based on mitra status
        if (mitraStatus === 'APPROVED') {
          updateData.role = 'MITRA'
        } else if (mitraStatus === 'REJECTED') {
          updateData.role = 'CUSTOMER'
        }
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        mitraStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    // Only ADMIN and SUPER_ADMIN can delete users
    if (
      !session?.user ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get user to check if it's SUPER_ADMIN
    const user = await prisma.user.findUnique({
      where: { id },
      select: { role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Cannot delete SUPER_ADMIN
    if (user.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Cannot delete SUPER_ADMIN' },
        { status: 403 }
      )
    }

    // Hard delete - permanently remove user from database
    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
