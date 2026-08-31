import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'

import { isAdminStaffRole } from '@/lib/dashboard-utils'

// GET - Fetch admin & store profile
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or staff
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        phone: true,
        role: true,
        storeId: true,
        store: {
          include: {
            bankAccounts: true,
          },
        },
      },
    })

    if (!user || !isAdminStaffRole(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ user, store: user.store })
  } catch (error) {
    console.error('Error fetching admin profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update admin & store profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or staff
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, email: true, storeId: true },
    })

    if (!user || !isAdminStaffRole(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      phone,
      image,
      email,
      currentPassword,
      newPassword,
      storeData,
    } = body

    // If changing email, check if it's already taken
    if (email && email !== user.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: session.user.id },
        },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email sudah digunakan' },
          { status: 400 }
        )
      }
    }

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Password saat ini diperlukan' },
          { status: 400 }
        )
      }

      const userWithPassword = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { password: true },
      })

      if (!userWithPassword?.password) {
        return NextResponse.json(
          { error: 'Password tidak ditemukan' },
          { status: 400 }
        )
      }

      const isValid = await bcrypt.compare(
        currentPassword,
        userWithPassword.password
      )

      if (!isValid) {
        return NextResponse.json(
          { error: 'Password saat ini salah' },
          { status: 400 }
        )
      }
    }

    // Prepare update data for User
    interface UpdateData {
      name?: string
      phone?: string
      image?: string
      email?: string
      password?: string
    }
    const updateData: UpdateData = {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(image !== undefined && { image }),
      ...(email !== undefined && { email }),
    }

    // Hash new password if provided
    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      updateData.password = hashedPassword
    }

    // Run in transaction if updating both User and Store
    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: session.user.id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          phone: true,
          role: true,
          storeId: true,
        },
      })

      let updatedStore = null
      if (storeData && user.storeId) {
        const {
          storeName,
          companyName,
          taxId,
          address,
          city,
          province,
          postalCode,
          phone: storePhone,
          whatsapp,
          bankName,
          accountNumber,
          accountName,
        } = storeData

        updatedStore = await tx.store.update({
          where: { id: user.storeId },
          data: {
            ...(storeName && { name: storeName }),
            ...(companyName && { companyName }),
            ...(taxId !== undefined && { taxId }),
            ...(address && { address }),
            ...(city && { city }),
            ...(province && { province }),
            ...(postalCode !== undefined && { postalCode }),
            ...(storePhone && { phone: storePhone }),
            ...(whatsapp && { whatsapp }),
          },
          include: {
            bankAccounts: true,
          },
        })

        // Update or create primary bank account
        if (bankName && accountNumber && accountName) {
          const existingBank = await tx.storeBankAccount.findFirst({
            where: { storeId: user.storeId },
          })

          if (existingBank) {
            await tx.storeBankAccount.update({
              where: { id: existingBank.id },
              data: {
                bankName,
                accountNumber,
                accountName,
              },
            })
          } else {
            await tx.storeBankAccount.create({
              data: {
                storeId: user.storeId,
                bankName,
                accountNumber,
                accountName,
                isPrimary: true,
              },
            })
          }
        }
      }

      return { updatedUser, updatedStore }
    })

    return NextResponse.json({
      success: true,
      user: result.updatedUser,
      store: result.updatedStore,
      message: 'Profil berhasil diperbarui',
    })
  } catch (error) {
    console.error('Error updating admin profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
