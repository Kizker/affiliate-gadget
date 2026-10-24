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

    // Otomatis sinkronisasi status persetujuan jika user adalah MITRA
    const targetRole = role !== undefined ? role : user.role
    if (targetRole === 'MITRA') {
      if (isActive === true) {
        // Mengaktifkan akun mitra: otomatis setujui pendaftaran mitra
        updateData.mitraStatus = 'APPROVED'
        await prisma.mitra.updateMany({
          where: { userId: id },
          data: {
            isApproved: true,
            isActive: true,
          },
        })
      } else if (isActive === false) {
        // Menonaktifkan akun mitra
        await prisma.mitra.updateMany({
          where: { userId: id },
          data: {
            isActive: false,
          },
        })
      }
    }

    // If mitraStatus is being updated explicitly, also update Mitra table and user role
    if (mitraStatus !== undefined) {
      const isApproved = mitraStatus === 'APPROVED'
      await prisma.mitra.updateMany({
        where: { userId: id },
        data: {
          isApproved,
          isActive: isApproved,
        },
      })

      if (isApproved) {
        updateData.role = 'MITRA'
        updateData.isActive = true
      } else if (mitraStatus === 'REJECTED') {
        updateData.role = 'CUSTOMER'
        updateData.isActive = false
      }
    }

    // Otomatis sinkronisasi toko jika user diangkat menjadi STORE_ADMIN
    if (targetRole === 'STORE_ADMIN') {
      const fullUser = await prisma.user.findUnique({
        where: { id },
        select: { storeId: true, email: true, name: true },
      })
      if (!fullUser?.storeId) {
        const storeByEmail = await prisma.store.findFirst({
          where: { email: fullUser?.email || undefined },
          select: { id: true },
        })
        if (storeByEmail) {
          updateData.storeId = storeByEmail.id
        } else {
          const app = await (prisma as any).storeApplication.findFirst({
            where: { userId: id },
          })
          if (app) {
            let baseSlug = (app.storeName || 'toko-cabang')
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '')
            if (!baseSlug) baseSlug = `toko-${Date.now()}`
            const existingSlug = await prisma.store.findUnique({
              where: { slug: baseSlug },
              select: { id: true },
            })
            const finalSlug = existingSlug
              ? `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`
              : baseSlug

            const newStore = await prisma.store.create({
              data: {
                name: app.storeName || 'Cabang Toko Fisik',
                slug: finalSlug,
                companyName: app.companyName || 'PT Cabang Toko',
                address: app.address || 'Alamat Toko',
                city: app.city || 'Tangerang',
                province: app.province || 'Banten',
                postalCode: app.postalCode || null,
                phone: app.phone || fullUser?.email || '081200000000',
                email: fullUser?.email,
                isActive: true,
                rating: 5.0,
                commissionRate: 2.0,
                bankAccounts:
                  app.bankName && app.accountNumber
                    ? {
                        create: {
                          bankName: app.bankName,
                          accountNumber: app.accountNumber,
                          accountName: app.accountName || app.companyName,
                          isPrimary: true,
                        },
                      }
                    : undefined,
              },
            })
            updateData.storeId = newStore.id
          }
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
