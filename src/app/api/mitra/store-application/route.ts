import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { storeDataSchema } from '@/lib/validations/auth'

// GET - Retrieve current store application data for editing
export async function GET() {
  try {
    const session = await auth()
    const userId = session?.user?.id
    const userEmail = session?.user?.email

    if (!userId && !userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const application = await prisma.storeApplication.findFirst({
      where: userId ? { userId } : { user: { email: userEmail! } },
    })

    if (!application) {
      return NextResponse.json(
        { error: 'Data aplikasi toko belum ditemukan.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ application }, { status: 200 })
  } catch (error) {
    console.error('[Get Store Application Error]', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data aplikasi toko.' },
      { status: 500 }
    )
  }
}

// PUT - Update and re-submit store application data
export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    const userEmail = session?.user?.email

    if (!userId && !userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findFirst({
      where: userId ? { id: userId } : { email: userEmail! },
      select: { id: true, role: true, mitraStatus: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Pengguna tidak ditemukan.' },
        { status: 404 }
      )
    }

    const body = await req.json().catch(() => ({}))
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

    const updated = await prisma.$transaction([
      prisma.storeApplication.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
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
        where: { id: user.id },
        data: {
          mitraStatus: 'PENDING',
        },
      }),
    ])

    return NextResponse.json(
      {
        success: true,
        message:
          'Data toko berhasil diperbarui dan diajukan ulang untuk ditinjau oleh Superadmin.',
        application: updated[0],
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Update Store Application Error]', error)
    return NextResponse.json(
      { error: 'Gagal memperbarui aplikasi toko.' },
      { status: 500 }
    )
  }
}
