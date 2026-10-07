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
          select: {
            id: true,
            name: true,
            slug: true,
            companyName: true,
            tagline: true,
            description: true,
            logo: true,
            banner: true,
            taxId: true,
            address: true,
            city: true,
            province: true,
            postalCode: true,
            phone: true,
            whatsapp: true,
            bankAccounts: true,
            schedules: true,
          } as any,
        },
      },
    })

    if (!user || !isAdminStaffRole(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userStore = (user as any).store
    const enrichedStore = userStore
      ? {
          ...userStore,
          isPkp: userStore.isPkp ?? true,
          vatRate: userStore.vatRate ?? 11.0,
          kppName: userStore.kppName ?? 'KPP Pratama Terdaftar',
          taxType: userStore.taxType ?? 'INCLUSIVE',
        }
      : null

    if (
      enrichedStore &&
      user.storeId &&
      typeof (prisma as any).$queryRawUnsafe === 'function'
    ) {
      try {
        const rawStoreCols: any[] = await prisma.$queryRawUnsafe(
          `SELECT "heroImage", "heroMobileImage", "heroTitle", "heroSubtitle", "heroDescription", "campaignKicker", "campaignTitle", "campaignSubtitle", "campaignDescription", "secondaryBanner", "secondaryBannerTitle", "secondaryBannerDesc" FROM stores WHERE id = $1`,
          user.storeId
        )
        if (rawStoreCols?.[0]) {
          Object.assign(enrichedStore, rawStoreCols[0])
        }
      } catch (rawErr) {
        console.warn('Raw visual fields query warning:', rawErr)
      }
    }

    return NextResponse.json({ user, store: enrichedStore })
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

      let updatedStore: any = null
      if (storeData && user.storeId) {
        const {
          storeName,
          companyName,
          tagline,
          description,
          logo,
          banner,
          heroImage,
          heroMobileImage,
          heroTitle,
          heroSubtitle,
          heroDescription,
          campaignKicker,
          campaignTitle,
          campaignSubtitle,
          campaignDescription,
          secondaryBanner,
          secondaryBannerTitle,
          secondaryBannerDesc,
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
          isPkp,
          vatRate,
          kppName,
          schedules,
        } = storeData

        updatedStore = await (tx.store.update as any)({
          where: { id: user.storeId },
          data: {
            ...(storeName && { name: storeName }),
            ...(companyName && { companyName }),
            ...(tagline !== undefined && {
              tagline: tagline ? String(tagline).trim().slice(0, 150) : null,
            }),
            ...(description !== undefined && {
              description: description
                ? String(description).trim().slice(0, 1000)
                : null,
            }),
            ...(logo !== undefined && {
              logo: logo ? String(logo).trim() : null,
            }),
            ...(banner !== undefined && {
              banner: banner ? String(banner).trim() : null,
            }),
            ...(taxId !== undefined && {
              taxId: taxId ? String(taxId).trim() : null,
            }),
            ...(address && { address }),
            ...(city && { city }),
            ...(province && { province }),
            ...(postalCode !== undefined && {
              postalCode: postalCode ? String(postalCode).trim() : null,
            }),
            ...(storePhone && { phone: storePhone }),
            ...(whatsapp !== undefined && {
              whatsapp: whatsapp ? String(whatsapp).trim() : null,
            }),
            ...(isPkp !== undefined && { isPkp: Boolean(isPkp) }),
            ...(vatRate !== undefined && {
              vatRate: Math.max(
                0,
                Math.min(20, parseFloat(String(vatRate)) || 11.0)
              ),
            }),
            ...(kppName !== undefined && {
              kppName: kppName ? String(kppName).trim() : null,
            }),
            taxType: 'INCLUSIVE',
          },
          select: {
            id: true,
            name: true,
            slug: true,
            companyName: true,
            tagline: true,
            description: true,
            logo: true,
            banner: true,
            taxId: true,
            isPkp: true,
            vatRate: true,
            kppName: true,
            address: true,
            city: true,
            province: true,
            postalCode: true,
            phone: true,
            whatsapp: true,
            bankAccounts: true,
            schedules: true,
          },
        })

        // Robustly update visual customization fields via raw SQL directly on PostgreSQL
        // This guarantees execution succeeds even if Next.js dev server has not been restarted
        const visualUpdates: string[] = []
        const visualParams: any[] = []
        let paramIdx = 1

        const addVisualField = (colName: string, val: any, maxLen?: number) => {
          if (val !== undefined) {
            visualUpdates.push(`"${colName}" = $${paramIdx++}`)
            if (val === null || val === '') {
              visualParams.push(null)
            } else {
              const strVal = String(val).trim()
              visualParams.push(maxLen ? strVal.slice(0, maxLen) : strVal)
            }
          }
        }

        addVisualField('heroImage', heroImage)
        addVisualField('heroMobileImage', heroMobileImage)
        addVisualField('heroTitle', heroTitle, 100)
        addVisualField('heroSubtitle', heroSubtitle, 100)
        addVisualField('heroDescription', heroDescription, 500)
        addVisualField('campaignKicker', campaignKicker, 100)
        addVisualField('campaignTitle', campaignTitle, 100)
        addVisualField('campaignSubtitle', campaignSubtitle, 100)
        addVisualField('campaignDescription', campaignDescription, 500)
        addVisualField('secondaryBanner', secondaryBanner)
        addVisualField('secondaryBannerTitle', secondaryBannerTitle, 100)
        addVisualField('secondaryBannerDesc', secondaryBannerDesc, 500)

        if (visualUpdates.length > 0) {
          visualParams.push(user.storeId)
          const sql = `UPDATE stores SET ${visualUpdates.join(', ')}, "updatedAt" = NOW() WHERE id = $${paramIdx}`
          await tx.$executeRawUnsafe(sql, ...visualParams)

          if (updatedStore) {
            visualUpdates.forEach((item, idx) => {
              const col = item.split('"')[1]
              updatedStore[col] = visualParams[idx]
            })
          }
        }

        if (Array.isArray(schedules)) {
          await tx.storeSchedule.deleteMany({
            where: { storeId: user.storeId },
          })
          const validSchedules = schedules
            .filter((s: any) => s.day && typeof s.day === 'string')
            .map((s: any) => ({
              storeId: user.storeId as string,
              day: s.day,
              openTime: String(s.openTime || '09:00').slice(0, 5),
              closeTime: String(s.closeTime || '21:00').slice(0, 5),
              isClosed: Boolean(s.isClosed),
            }))
          if (validSchedules.length > 0) {
            await tx.storeSchedule.createMany({
              data: validSchedules,
            })
          }
        }

        // Jika foto logo toko diupdate dan foto pengelola belum ada, sinkronkan ke akun user
        if (logo && !updateData.image) {
          await tx.user.update({
            where: { id: session.user.id },
            data: { image: logo },
          })
        }

        // Update or create primary bank account
        if (bankName && accountNumber && accountName) {
          const existingBank = await tx.storeBankAccount.findFirst({
            where: { storeId: user.storeId },
          })

          const isBankChanged =
            !existingBank ||
            existingBank.bankName !== bankName ||
            existingBank.accountNumber !== accountNumber ||
            existingBank.accountName !== accountName

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

          if (isBankChanged) {
            await tx.store.update({
              where: { id: user.storeId },
              data: { bankAccountUpdatedAt: new Date() } as any,
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
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
