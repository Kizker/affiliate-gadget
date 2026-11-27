import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { DayOfWeek } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    const userId = session?.user?.id
    const userEmail = session?.user?.email

    if (!userId && !userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findFirst({
      where: userId ? { id: userId } : { email: userEmail! },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        mitraStatus: true,
        storeId: true,
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
            groupId: true,
            group: {
              select: {
                id: true,
                name: true,
                afterSalesUser: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
        },
        storeApplication: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
          mitraStatus: user.mitraStatus,
          storeId: user.storeId,
        },
        hasStore: !!user.storeId && !!user.store,
        store: user.store,
        application: user.storeApplication,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    )
  } catch (error) {
    console.error('[GET /api/admin/onboarding Error]:', error)
    return NextResponse.json(
      { error: 'Gagal memuat status onboarding toko.' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    const userEmail = session?.user?.email

    if (!userId && !userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findFirst({
      where: userId ? { id: userId } : { email: userEmail! },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        mitraStatus: true,
        storeId: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.isActive) {
      return NextResponse.json(
        {
          error:
            'Akun Anda belum aktif. Silakan tunggu persetujuan dari Superadmin terlebih dahulu.',
        },
        { status: 403 }
      )
    }

    if (user.storeId) {
      const existingStore = await prisma.store.findUnique({
        where: { id: user.storeId },
      })
      if (existingStore) {
        return NextResponse.json({
          success: true,
          store: existingStore,
          message: 'Toko sudah terdaftar.',
        })
      }
    }

    const body = await req.json().catch(() => ({}))
    const {
      name,
      companyName,
      taxId,
      tagline,
      description,
      address,
      city,
      province,
      postalCode,
      latitude,
      longitude,
      phone,
      whatsapp,
      email,
      logo,
      banner,
      bankName,
      accountNumber,
      accountName,
      weekdayOpen = '09:00',
      weekdayClose = '21:00',
      weekendOpen = '10:00',
      weekendClose = '20:00',
      weekendClosed = false,
    } = body

    if (!name || String(name).trim().length < 3) {
      return NextResponse.json(
        { error: 'Nama toko cabang minimal 3 karakter.' },
        { status: 400 }
      )
    }

    if (!companyName || String(companyName).trim().length < 3) {
      return NextResponse.json(
        { error: 'Nama Badan Usaha (PT / CV) wajib diisi minimal 3 karakter.' },
        { status: 400 }
      )
    }

    if (!address || String(address).trim().length < 10) {
      return NextResponse.json(
        { error: 'Alamat lengkap fisik toko minimal 10 karakter.' },
        { status: 400 }
      )
    }

    if (!city || !province) {
      return NextResponse.json(
        { error: 'Kota/Kabupaten dan Provinsi wajib diisi.' },
        { status: 400 }
      )
    }

    if (!phone || String(phone).trim().length < 8) {
      return NextResponse.json(
        { error: 'Nomor telepon toko wajib diisi.' },
        { status: 400 }
      )
    }

    if (!bankName || !accountNumber || !accountName) {
      return NextResponse.json(
        {
          error:
            'Informasi rekening bank pencairan omzet (Bank, Nomor Rekening, Atas Nama) wajib dilengkapi.',
        },
        { status: 400 }
      )
    }

    const { verifyIndonesianBankAccount } =
      await import('@/lib/bank-validation')
    const bankCheck = await verifyIndonesianBankAccount({
      bankName: String(bankName),
      accountNumber: String(accountNumber),
      inputAccountName: String(accountName),
    })

    if (!bankCheck.valid) {
      return NextResponse.json(
        {
          error: bankCheck.message,
        },
        { status: 400 }
      )
    }

    // Generate unique slug
    let baseSlug = String(name)
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

    const weekdayDays: DayOfWeek[] = [
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ]

    const schedulesToCreate = [
      ...weekdayDays.map((d) => ({
        day: d,
        openTime: String(weekdayOpen || '09:00'),
        closeTime: String(weekdayClose || '21:00'),
        isClosed: false,
      })),
      {
        day: 'SUNDAY' as DayOfWeek,
        openTime: String(weekendOpen || '10:00'),
        closeTime: String(weekendClose || '20:00'),
        isClosed: Boolean(weekendClosed),
      },
    ]

    const newStore = await prisma.$transaction(async (tx) => {
      const createdStore = await tx.store.create({
        data: {
          name: String(name).trim(),
          slug: finalSlug,
          companyName: String(companyName).trim(),
          taxId: taxId ? String(taxId).trim() : null,
          tagline: tagline
            ? String(tagline).trim()
            : `Cabang Resmi ${String(name).trim()}`,
          description: description
            ? String(description).trim()
            : `Pusat penjualan smartphone & gadget second berkualitas bergaransi 30 hari di ${String(city).trim()}.`,
          address: String(address).trim(),
          city: String(city).trim(),
          province: String(province).trim(),
          postalCode: postalCode ? String(postalCode).trim() : null,
          latitude:
            latitude !== undefined && latitude !== null && latitude !== ''
              ? Number(latitude)
              : null,
          longitude:
            longitude !== undefined && longitude !== null && longitude !== ''
              ? Number(longitude)
              : null,
          phone: String(phone).trim(),
          whatsapp: whatsapp ? String(whatsapp).trim() : String(phone).trim(),
          email: email ? String(email).trim() : user.email,
          logo: logo || null,
          banner: banner || null,
          isActive: true,
          rating: 5.0,
          commissionRate: 2.0,
          bankAccounts: {
            create: {
              bankName: String(bankName).trim(),
              accountNumber: String(accountNumber).trim(),
              accountName: String(accountName).trim(),
              isPrimary: true,
            },
          },
          schedules: {
            create: schedulesToCreate,
          },
        },
      })

      await tx.user.update({
        where: { id: user.id },
        data: {
          role: 'STORE_ADMIN',
          storeId: createdStore.id,
          isActive: true,
          mitraStatus: 'APPROVED',
        },
      })

      return createdStore
    })

    return NextResponse.json({
      success: true,
      store: newStore,
      message: 'Toko cabang berhasil didaftarkan dan langsung aktif!',
    })
  } catch (error) {
    console.error('[POST /api/admin/onboarding Error]:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menyimpan pendaftaran toko.' },
      { status: 500 }
    )
  }
}
