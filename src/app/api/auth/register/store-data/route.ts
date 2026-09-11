import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { storeDataSchema } from '@/lib/validations/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const body = await req.json().catch(() => ({}))

    const targetUserId = session?.user?.id || body.userId

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Sesi tidak valid atau User ID tidak ditemukan.' },
        { status: 401 }
      )
    }

    // Verify user exists and has role MITRA
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true, mitraStatus: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Pengguna tidak ditemukan.' },
        { status: 404 }
      )
    }

    if (user.role !== 'MITRA' && user.role !== 'STORE_ADMIN') {
      return NextResponse.json(
        { error: 'Hanya pendaftar mitra toko yang dapat mengisi data toko.' },
        { status: 403 }
      )
    }

    // Validate body data
    const validated = storeDataSchema.safeParse(body)
    if (!validated.success) {
      const firstErrorMessage =
        validated.error.errors[0]?.message || 'Data toko tidak valid.'
      return NextResponse.json({ error: firstErrorMessage }, { status: 400 })
    }

    const {
      storeName,
      companyName,
      taxId,
      address,
      city,
      province,
      postalCode,
      phone,
      bankName,
      accountNumber,
      accountName,
    } = validated.data

    // Upsert StoreApplication and update user status to PENDING
    await prisma.$transaction([
      prisma.storeApplication.upsert({
        where: { userId: targetUserId },
        create: {
          userId: targetUserId,
          storeName,
          companyName,
          taxId: taxId || null,
          address,
          city,
          province,
          postalCode: postalCode || null,
          phone,
          bankName: bankName || null,
          accountNumber: accountNumber || null,
          accountName: accountName || null,
          rejectionReason: null,
        },
        update: {
          storeName,
          companyName,
          taxId: taxId || null,
          address,
          city,
          province,
          postalCode: postalCode || null,
          phone,
          bankName: bankName || null,
          accountNumber: accountNumber || null,
          accountName: accountName || null,
          rejectionReason: null,
        },
      }),
      prisma.user.update({
        where: { id: targetUserId },
        data: {
          mitraStatus: 'PENDING',
        },
      }),
    ])

    return NextResponse.json(
      {
        success: true,
        message:
          'Informasi toko berhasil disimpan. Pendaftaran Anda sedang menunggu proses review dari Superadmin.',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Store Data Registration Error]', error)
    const errorMessage =
      process.env.NODE_ENV === 'development' && error instanceof Error
        ? `Terjadi kendala: ${error.message}`
        : 'Terjadi kendala saat menyimpan data toko. Silakan coba lagi.'

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
