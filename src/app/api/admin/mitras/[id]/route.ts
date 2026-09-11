import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

// GET /api/admin/mitras/[id] - Get store / mitra detail
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (
      !session?.user ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 0. Check if it is a pending applicant
    if (id.startsWith('applicant_')) {
      const appId = id.replace('applicant_', '')
      const app = await (db as any).storeApplication.findUnique({
        where: { id: appId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              isActive: true,
              mitraStatus: true,
            },
          },
        },
      })

      if (!app) {
        return NextResponse.json(
          { error: 'Data pendaftar tidak ditemukan' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        id,
        businessName: app.storeName,
        name: app.storeName,
        slug: '',
        companyName: app.companyName,
        taxId: app.taxId,
        tagline: null,
        description: null,
        banner: '',
        address: app.address,
        city: app.city,
        province: app.province,
        postalCode: app.postalCode,
        latitude: null,
        longitude: null,
        phone: app.phone,
        whatsapp: null,
        email: app.user?.email || '',
        website: null,
        commissionRate: 2.0,
        isOwnerStore: false,
        rating: 5.0,
        totalReview: 0,
        totalSales: 0,
        totalViews: 0,
        totalInquiries: 0,
        isApproved: false,
        isActive: false,
        source: 'pending_applicant',
        createdAt: app.submittedAt.toISOString(),
        bankAccounts:
          app.bankName && app.accountNumber
            ? [
                {
                  id: `bank_${app.id}`,
                  storeId: '',
                  bankName: app.bankName,
                  accountNumber: app.accountNumber,
                  accountName: app.accountName || app.companyName,
                  isPrimary: true,
                  createdAt: app.submittedAt,
                  updatedAt: app.updatedAt,
                },
              ]
            : [],
        schedules: [],
        features: [],
        weekdayHours: 'Senin - Jumat: 10:00 - 21:00',
        weekendHours: 'Sabtu - Minggu: 10:00 - 21:30',
        services: [],
        images: [],
        reviews: [],
        user: app.user,
        _count: {
          services: 0,
          products: 0,
          orders: 0,
          images: 0,
          reviews: 0,
        },
      })
    }

    // 1. First check if it is a Store record (Official store)
    const store = await db.store.findUnique({
      where: { id },
      include: {
        bankAccounts: true,
        schedules: true,
        _count: {
          select: {
            products: true,
            orders: true,
            liveStreams: true,
          },
        },
      },
    })

    if (store) {
      return NextResponse.json({
        id: store.id,
        businessName: store.name,
        name: store.name,
        slug: store.slug,
        companyName: store.companyName,
        taxId: store.taxId,
        tagline: store.tagline || '',
        description: store.description || '',
        banner: store.banner || '',
        address: store.address,
        city: store.city,
        province: store.province,
        postalCode: store.postalCode,
        latitude: store.latitude,
        longitude: store.longitude,
        phone: store.phone,
        whatsapp: store.whatsapp || store.phone,
        email: store.email || `${store.slug}@affiliategadget.com`,
        website: `https://affiliategadget.com/toko/${store.slug}`,
        commissionRate: store.commissionRate,
        isOwnerStore: store.isOwnerStore,
        rating: store.rating,
        totalReview: store.totalReview,
        totalSales: store.totalSales,
        totalViews: 120,
        totalInquiries: 45,
        isApproved: store.isActive,
        isActive: store.isActive,
        createdAt: store.createdAt.toISOString(),
        bankAccounts: store.bankAccounts,
        schedules: store.schedules,
        features: [
          'Garansi Resmi 30 Hari',
          'Teknisi Tersertifikasi',
          'Servis LCD Kilat 2 Jam',
          'Pengiriman Gojek Instant & JNE',
          'Pencairan Bank Mandiri Otomatis',
        ],
        weekdayHours: 'Senin - Jumat: 10:00 - 21:00',
        weekendHours: 'Sabtu - Minggu: 10:00 - 21:30',
        services: [],
        images: [],
        reviews: [],
        user: {
          id: store.id,
          name: store.companyName,
          email: store.email || `${store.slug}@affiliategadget.com`,
          phone: store.phone,
          isActive: store.isActive,
          mitraStatus: store.isActive ? 'APPROVED' : 'PENDING',
        },
        _count: {
          services: store._count.products,
          products: store._count.products,
          orders: store._count.orders,
          images: 4,
          reviews: store.totalReview,
        },
      })
    }

    // 2. Fallback to Mitra record
    const mitra = await db.mitra.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isActive: true,
            mitraStatus: true,
          },
        },
        services: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        images: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        schedules: {
          orderBy: {
            day: 'asc',
          },
        },
        reviews: {
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
      },
    })

    if (!mitra) {
      return NextResponse.json({ error: 'Mitra not found' }, { status: 404 })
    }

    return NextResponse.json(mitra)
  } catch (error) {
    console.error('Error fetching mitra:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/mitras/[id] - Update store / mitra
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (
      !session?.user ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      businessName,
      name,
      companyName,
      taxId,
      tagline,
      description,
      banner,
      address,
      city,
      province,
      postalCode,
      latitude,
      longitude,
      phone,
      whatsapp,
      email,
      website,
      features,
      weekdayHours,
      weekendHours,
      commissionRate,
      isApproved,
      isActive,
    } = body

    // 0. Check if it is a pending applicant
    if (id.startsWith('applicant_')) {
      const appId = id.replace('applicant_', '')
      const app = await (db as any).storeApplication.findUnique({
        where: { id: appId },
        include: { user: true },
      })

      if (!app) {
        return NextResponse.json(
          { error: 'Pengajuan pendaftar tidak ditemukan' },
          { status: 404 }
        )
      }

      if (isApproved !== false) {
        // Approve applicant and create Store
        let baseSlug = (app.storeName || 'toko')
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
        if (!baseSlug) baseSlug = `toko-${Date.now()}`

        let finalSlug = baseSlug
        const existingStoreWithSlug = await db.store.findUnique({
          where: { slug: finalSlug },
          select: { id: true },
        })
        if (existingStoreWithSlug) {
          finalSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`
        }

        const result = await db.$transaction(async (tx) => {
          const newStore = await tx.store.create({
            data: {
              name: app.storeName,
              slug: finalSlug,
              companyName: app.companyName,
              taxId: app.taxId || null,
              address: app.address,
              city: app.city,
              province: app.province,
              postalCode: app.postalCode || null,
              phone: app.phone,
              email: app.user.email,
              isActive: true,
              rating: 5.0,
              commissionRate:
                commissionRate !== undefined ? parseFloat(commissionRate) : 2.0,
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

          const updatedUser = await tx.user.update({
            where: { id: app.user.id },
            data: {
              role: 'STORE_ADMIN',
              storeId: newStore.id,
              mitraStatus: 'APPROVED',
              isActive: true,
            },
          })

          const existingMitra = await tx.mitra.findUnique({
            where: { userId: app.user.id },
          })
          if (existingMitra) {
            await tx.mitra.update({
              where: { id: existingMitra.id },
              data: { isApproved: true },
            })
          }

          return { newStore, updatedUser }
        })

        return NextResponse.json({
          success: true,
          message: `Toko "${app.storeName}" berhasil disetujui dan diaktifkan.`,
          store: result.newStore,
          businessName: result.newStore.name,
          isApproved: true,
          isActive: true,
        })
      } else {
        await db.user.update({
          where: { id: app.user.id },
          data: { mitraStatus: 'REJECTED' },
        })
        return NextResponse.json({
          success: true,
          message: `Pendaftaran toko "${app.storeName}" ditangguhkan.`,
          isApproved: false,
          isActive: false,
        })
      }
    }

    // 1. Check if it is a Store record
    const existingStore = await db.store.findUnique({
      where: { id },
    })

    if (existingStore) {
      const storeUpdateData: Record<string, unknown> = {}
      if (businessName !== undefined) storeUpdateData.name = businessName
      if (name !== undefined) storeUpdateData.name = name
      if (companyName !== undefined) storeUpdateData.companyName = companyName
      if (taxId !== undefined) storeUpdateData.taxId = taxId
      if (tagline !== undefined) storeUpdateData.tagline = tagline
      if (description !== undefined) storeUpdateData.description = description
      if (banner !== undefined) storeUpdateData.banner = banner
      if (address !== undefined) storeUpdateData.address = address
      if (city !== undefined) storeUpdateData.city = city
      if (province !== undefined) storeUpdateData.province = province
      if (postalCode !== undefined) storeUpdateData.postalCode = postalCode
      if (latitude !== undefined)
        storeUpdateData.latitude = latitude ? parseFloat(latitude) : null
      if (longitude !== undefined)
        storeUpdateData.longitude = longitude ? parseFloat(longitude) : null
      if (phone !== undefined) storeUpdateData.phone = phone
      if (whatsapp !== undefined) storeUpdateData.whatsapp = whatsapp
      if (email !== undefined) storeUpdateData.email = email
      if (commissionRate !== undefined)
        storeUpdateData.commissionRate = parseFloat(commissionRate)
      if (isActive !== undefined) storeUpdateData.isActive = isActive
      if (isApproved !== undefined) storeUpdateData.isActive = isApproved

      const updatedStore = await db.store.update({
        where: { id },
        data: storeUpdateData,
        include: {
          bankAccounts: true,
          schedules: true,
        },
      })

      return NextResponse.json({
        ...updatedStore,
        businessName: updatedStore.name,
        isApproved: updatedStore.isActive,
      })
    }

    // 2. Otherwise update Mitra record
    const existingMitra = await db.mitra.findUnique({
      where: { id },
    })

    if (!existingMitra) {
      return NextResponse.json(
        { error: 'Store or Mitra not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {}
    if (businessName !== undefined) updateData.businessName = businessName
    if (tagline !== undefined) updateData.tagline = tagline
    if (description !== undefined) updateData.description = description
    if (banner !== undefined) updateData.banner = banner
    if (address !== undefined) updateData.address = address
    if (city !== undefined) updateData.city = city
    if (province !== undefined) updateData.province = province
    if (latitude !== undefined)
      updateData.latitude = latitude ? parseFloat(latitude) : null
    if (longitude !== undefined)
      updateData.longitude = longitude ? parseFloat(longitude) : null
    if (phone !== undefined) updateData.phone = phone
    if (whatsapp !== undefined) updateData.whatsapp = whatsapp
    if (email !== undefined) updateData.email = email
    if (website !== undefined) updateData.website = website
    if (features !== undefined) updateData.features = features
    if (weekdayHours !== undefined) updateData.weekdayHours = weekdayHours
    if (weekendHours !== undefined) updateData.weekendHours = weekendHours
    if (isApproved !== undefined) updateData.isApproved = isApproved
    if (isActive !== undefined) updateData.isActive = isActive

    // Update mitra
    const mitra = await db.mitra.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    // Update user mitraStatus and role if approval changed
    if (isApproved !== undefined) {
      await db.user.update({
        where: { id: mitra.userId },
        data: {
          mitraStatus: isApproved ? 'APPROVED' : 'REJECTED',
          role: isApproved ? 'MITRA' : 'CUSTOMER',
        },
      })
    }

    return NextResponse.json(mitra)
  } catch (error) {
    console.error('Error updating mitra:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/mitras/[id] - Delete store / mitra
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (
      !session?.user ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 0. Check if it is an applicant record
    if (id.startsWith('applicant_')) {
      const appId = id.replace('applicant_', '')
      const app = await (db as any).storeApplication.findUnique({
        where: { id: appId },
      })
      if (app) {
        await (db as any).storeApplication.delete({ where: { id: appId } })
        await db.user.update({
          where: { id: app.userId },
          data: {
            mitraStatus: null,
            role: 'CUSTOMER',
          },
        })
      }
      return NextResponse.json({
        message: 'Pengajuan pendaftar berhasil dihapus',
      })
    }

    // 1. Check if it is a Store record
    const existingStore = await db.store.findUnique({
      where: { id },
    })

    if (existingStore) {
      await db.storeBankAccount.deleteMany({ where: { storeId: id } })
      await db.storeSchedule.deleteMany({ where: { storeId: id } })
      await db.store.delete({ where: { id } })
      return NextResponse.json({ message: 'Store deleted successfully' })
    }

    // 2. Otherwise check Mitra record
    const existingMitra = await db.mitra.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!existingMitra) {
      return NextResponse.json(
        { error: 'Store or Mitra not found' },
        { status: 404 }
      )
    }

    // Hard delete - actually remove from database
    await db.mitra.delete({
      where: { id },
    })

    // Update user mitraStatus to null (remove mitra status)
    await db.user.update({
      where: { id: existingMitra.userId },
      data: {
        mitraStatus: null,
        role: 'CUSTOMER',
      },
    })

    return NextResponse.json({ message: 'Mitra deleted successfully' })
  } catch (error) {
    console.error('Error deleting store/mitra:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
