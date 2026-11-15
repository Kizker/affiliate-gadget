import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/admin/mitras - List all stores & mitras with complete operational & legal data + pending applicants
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()

    if (
      !session ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const search = searchParams.get('search') || ''
    const city = searchParams.get('city') || ''
    const approved = searchParams.get('approved')

    const skip = (page - 1) * limit

    // 1. Build query for Store records
    const storeWhere: Record<string, unknown> = {}
    if (search) {
      storeWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (city) {
      storeWhere.city = city
    }
    if (approved === 'true') {
      storeWhere.isActive = true
    }

    const isPendingTab = approved === 'false'

    // Query stores (hanya jika bukan tab khusus Menunggu Review)
    const stores = isPendingTab
      ? []
      : await db.store.findMany({
          where: storeWhere,
          include: {
            bankAccounts: true,
            schedules: true,
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                isActive: true,
              },
            },
            group: {
              select: {
                id: true,
                name: true,
                afterSalesUser: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
            _count: {
              select: {
                products: true,
                orders: true,
                liveStreams: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        })

    const mappedStores = stores.map((s) => {
      const storeAdminUser = s.users?.[0]
      return {
        id: s.id,
        businessName: s.name,
        name: s.name,
        slug: s.slug,
        companyName: s.companyName,
        taxId: s.taxId,
        tagline: s.tagline,
        description: s.description,
        address: s.address,
        city: s.city,
        province: s.province,
        postalCode: s.postalCode,
        latitude: s.latitude,
        longitude: s.longitude,
        phone: s.phone,
        whatsapp: s.whatsapp,
        email: s.email || storeAdminUser?.email || '',
        rating: s.rating,
        totalReview: s.totalReview,
        totalSales: s.totalSales,
        commissionRate: s.commissionRate,
        isOwnerStore: s.isOwnerStore,
        isApproved: s.isActive,
        isActive: s.isActive,
        groupId: s.groupId || null,
        group: s.group || null,
        source: 'store' as const,
        createdAt: s.createdAt.toISOString(),
        bankAccounts: s.bankAccounts,
        schedules: s.schedules,
        user: {
          id: storeAdminUser?.id || s.id,
          name: storeAdminUser?.name || s.companyName,
          email:
            storeAdminUser?.email || s.email || `${s.slug}@affiliategadget.com`,
          phone: storeAdminUser?.phone || s.phone,
          isActive: storeAdminUser?.isActive ?? s.isActive,
          mitraStatus: s.isActive ? 'APPROVED' : 'PENDING',
        },
        _count: {
          services: s._count.products,
          products: s._count.products,
          orders: s._count.orders,
          images: 4,
          reviews: s.totalReview,
        },
      }
    })

    // 2. Query pending applicants from StoreApplication AND StoreAdmin users without storeId
    let mappedApplicants: typeof mappedStores = []

    if (approved !== 'true') {
      try {
        const applicantWhere: Record<string, unknown> = {
          user: {
            role: { in: ['MITRA', 'STORE_ADMIN'] },
            mitraStatus: 'PENDING',
          },
        }

        if (search) {
          applicantWhere.OR = [
            { storeName: { contains: search, mode: 'insensitive' } },
            { companyName: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } },
            { user: { name: { contains: search, mode: 'insensitive' } } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
          ]
        }
        if (city) {
          applicantWhere.city = city
        }

        const pendingApplications = await (db as any).storeApplication.findMany(
          {
            where: applicantWhere,
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
            orderBy: {
              submittedAt: 'desc',
            },
          }
        )

        const appUserIds = new Set<string>()
        const fromApps = (pendingApplications || []).map((app: any) => {
          if (app.user?.id) appUserIds.add(app.user.id)
          return {
            id: `applicant_${app.id}`,
            businessName: app.storeName,
            name: app.storeName,
            slug: '',
            companyName: app.companyName,
            taxId: app.taxId,
            tagline: null,
            description: null,
            address: app.address,
            city: app.city,
            province: app.province,
            postalCode: app.postalCode,
            latitude: null,
            longitude: null,
            phone: app.phone,
            whatsapp: null,
            email: app.user?.email || '',
            rating: 0,
            totalReview: 0,
            totalSales: 0,
            commissionRate: 2.0,
            isOwnerStore: false,
            isApproved: false,
            isActive: false,
            groupId: null,
            group: null,
            source: 'pending_applicant' as any,
            rejectionReason: app.rejectionReason,
            createdAt: app.submittedAt
              ? app.submittedAt instanceof Date
                ? app.submittedAt.toISOString()
                : new Date(app.submittedAt).toISOString()
              : new Date().toISOString(),
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
            user: {
              id: app.user?.id || '',
              name: app.user?.name || app.companyName,
              email: app.user?.email || '',
              phone: app.user?.phone || app.phone,
              isActive: app.user?.isActive ?? false,
              mitraStatus: app.user?.mitraStatus || 'PENDING',
            },
            _count: {
              services: 0,
              products: 0,
              orders: 0,
              images: 0,
              reviews: 0,
            },
          }
        })

        // Also query STORE_ADMIN users who haven't created their Store record yet
        const pendingStoreAdmins = await db.user.findMany({
          where: {
            role: 'STORE_ADMIN',
            storeId: null,
            ...(search
              ? {
                  OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                  ],
                }
              : {}),
          },
          orderBy: { createdAt: 'desc' },
        })

        const fromUsers = pendingStoreAdmins
          .filter((u) => !appUserIds.has(u.id))
          .map((u) => ({
            id: `user_${u.id}`,
            businessName: u.isActive
              ? `${u.name || 'Admin Toko'} (Sedang Input Data Toko)`
              : `${u.name || 'Admin Toko'} (Menunggu Aktivasi)`,
            name: u.name || 'Pendaftar Admin Toko',
            slug: '',
            companyName: u.isActive
              ? 'Akun Aktif • Menunggu Admin Toko Isi Nama Toko'
              : 'Menunggu Persetujuan Aktivasi Superadmin',
            taxId: null,
            tagline: null,
            description: null,
            address: 'Menunggu input alamat oleh Admin Toko',
            city: '-',
            province: '-',
            postalCode: null,
            latitude: null,
            longitude: null,
            phone: u.phone || '-',
            whatsapp: u.phone || null,
            email: u.email,
            rating: 0,
            totalReview: 0,
            totalSales: 0,
            commissionRate: 2.0,
            isOwnerStore: false,
            isApproved: u.isActive,
            isActive: u.isActive,
            groupId: null,
            group: null,
            source: 'pending_applicant' as any,
            createdAt: u.createdAt.toISOString(),
            bankAccounts: [],
            schedules: [],
            user: {
              id: u.id,
              name: u.name || 'Admin Toko',
              email: u.email,
              phone: u.phone || '-',
              isActive: u.isActive,
              mitraStatus:
                u.mitraStatus || (u.isActive ? 'APPROVED' : 'PENDING'),
            },
            _count: {
              services: 0,
              products: 0,
              orders: 0,
              images: 0,
              reviews: 0,
            },
          }))

        mappedApplicants = [...fromUsers, ...fromApps]
      } catch (appError) {
        console.warn(
          'Warning: Failed to fetch storeApplication (table may not exist or schema desync):',
          appError
        )
        mappedApplicants = []
      }
    }

    // Combine items based on filter
    const combinedList = [...mappedApplicants, ...mappedStores]

    // Calculate stats
    let totalPendingApplicants = 0
    try {
      const [appCount, userNoStoreCount] = await Promise.all([
        (db as any).storeApplication.count({
          where: { user: { role: 'MITRA', mitraStatus: 'PENDING' } },
        }),
        db.user.count({
          where: { role: 'STORE_ADMIN', storeId: null },
        }),
      ])
      totalPendingApplicants = appCount + userNoStoreCount
    } catch (countError) {
      console.warn('Warning: Failed to count storeApplication:', countError)
      totalPendingApplicants = 0
    }

    const [totalActiveStores, totalInactiveStores, uniqueCities, allGroups] =
      await Promise.all([
        db.store.count({ where: { isActive: true } }),
        db.store.count({ where: { isActive: false } }),
        db.store.findMany({
          select: { city: true },
          distinct: ['city'],
        }),
        db.storeGroup
          .findMany({
            select: {
              id: true,
              name: true,
              afterSalesUser: {
                select: { id: true, name: true, email: true },
              },
            },
            orderBy: { name: 'asc' },
          })
          .catch(() => []),
      ])

    const totalCount = combinedList.length
    const paginatedItems = combinedList.slice(skip, skip + limit)

    return NextResponse.json({
      mitras: paginatedItems,
      allGroups,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
      stats: {
        total: totalActiveStores + totalInactiveStores + totalPendingApplicants,
        approved: totalActiveStores,
        pending: totalPendingApplicants,
        cities: uniqueCities.length,
      },
    })
  } catch (error) {
    console.error('Error fetching mitras:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/mitras - Create new mitra (Manual Store Creation)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()

    if (
      !session ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Mode 1: Buat Akun Admin Toko Baru (Admin Toko yang akan menginput nama toko & profil sendiri saat login)
    if (body.createStoreAdminOnly) {
      const { username, email: rawEmail, password, phone: rawPhone } = body
      const cleanName = String(username || '').trim()
      const cleanEmail = String(rawEmail || '')
        .trim()
        .toLowerCase()
      const cleanPass = String(password || '')

      if (!cleanName || cleanName.length < 2) {
        return NextResponse.json(
          { error: 'Nama Admin Toko minimal 2 karakter.' },
          { status: 400 }
        )
      }
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return NextResponse.json(
          { error: 'Format email tidak valid.' },
          { status: 400 }
        )
      }
      if (!cleanPass || cleanPass.length < 6) {
        return NextResponse.json(
          { error: 'Kata sandi minimal 6 karakter.' },
          { status: 400 }
        )
      }

      const existingUser = await db.user.findUnique({
        where: { email: cleanEmail },
      })
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email tersebut sudah terdaftar di sistem.' },
          { status: 400 }
        )
      }

      const bcrypt = await import('bcryptjs')
      const hashedPassword = await bcrypt.default.hash(cleanPass, 12)

      const createdUser = await db.user.create({
        data: {
          name: cleanName,
          email: cleanEmail,
          password: hashedPassword,
          phone: rawPhone ? String(rawPhone).trim() : null,
          role: 'STORE_ADMIN',
          isActive: true,
          mitraStatus: 'APPROVED',
          storeId: null,
          emailVerified: new Date(),
        },
      })

      return NextResponse.json(
        {
          success: true,
          user: {
            id: createdUser.id,
            name: createdUser.name,
            email: createdUser.email,
          },
          message: `Akun Admin Toko "${cleanName}" berhasil dibuat dan diaktifkan! Saat login, Admin Toko akan langsung mengisi nama toko & profil cabangnya.`,
        },
        { status: 201 }
      )
    }

    const {
      name,
      companyName,
      taxId,
      address,
      city,
      province,
      postalCode,
      phone,
      email,
      whatsapp,
      bankName,
      accountNumber,
      accountName,
      commissionRate,
      isOwnerStore,
    } = body

    if (!name || !companyName || !address || !city || !province || !phone) {
      return NextResponse.json(
        {
          error:
            'Data wajib belum lengkap (Nama Toko, PT, Alamat, Kota, Provinsi, Telepon).',
        },
        { status: 400 }
      )
    }

    // Generate unique slug
    let baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    if (!baseSlug) baseSlug = `store-${Date.now()}`

    let slug = baseSlug
    const existingSlug = await db.store.findUnique({ where: { slug } })
    if (existingSlug) {
      slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`
    }

    const newStore = await db.store.create({
      data: {
        name,
        slug,
        companyName,
        taxId: taxId || null,
        address,
        city,
        province,
        postalCode: postalCode || null,
        phone,
        email: email || null,
        whatsapp: whatsapp || null,
        commissionRate: commissionRate ? parseFloat(commissionRate) : 2.0,
        isOwnerStore: Boolean(isOwnerStore),
        isActive: true,
        rating: 5.0,
        bankAccounts:
          bankName && accountNumber
            ? {
                create: {
                  bankName,
                  accountNumber,
                  accountName: accountName || companyName,
                  isPrimary: true,
                },
              }
            : undefined,
      },
      include: {
        bankAccounts: true,
      },
    })

    return NextResponse.json(newStore, { status: 201 })
  } catch (error) {
    console.error('Error creating store:', error)
    return NextResponse.json(
      { error: 'Gagal membuat toko baru.' },
      { status: 500 }
    )
  }
}
