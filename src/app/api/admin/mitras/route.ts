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

    const mappedStores = stores.map((s) => ({
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
      email: s.email,
      rating: s.rating,
      totalReview: s.totalReview,
      totalSales: s.totalSales,
      commissionRate: s.commissionRate,
      isOwnerStore: s.isOwnerStore,
      isApproved: s.isActive,
      isActive: s.isActive,
      source: 'store' as const,
      createdAt: s.createdAt.toISOString(),
      bankAccounts: s.bankAccounts,
      schedules: s.schedules,
      user: {
        id: s.id,
        name: s.companyName,
        email: s.email || `${s.slug}@affiliategadget.com`,
        phone: s.phone,
        isActive: s.isActive,
        mitraStatus: s.isActive ? 'APPROVED' : 'PENDING',
      },
      _count: {
        services: s._count.products,
        products: s._count.products,
        orders: s._count.orders,
        images: 4,
        reviews: s.totalReview,
      },
    }))

    // 2. Query pending applicants from StoreApplication (when approved is false or ALL)
    let mappedApplicants: typeof mappedStores = []

    if (approved !== 'true') {
      const applicantWhere: Record<string, unknown> = {
        user: {
          role: 'MITRA',
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

      const pendingApplications = await (db as any).storeApplication.findMany({
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
      })

      mappedApplicants = pendingApplications.map((app: any) => ({
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
        email: app.user.email,
        rating: 0,
        totalReview: 0,
        totalSales: 0,
        commissionRate: 2.0,
        isOwnerStore: false,
        isApproved: false,
        isActive: false,
        source: 'pending_applicant' as any,
        rejectionReason: app.rejectionReason,
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
        user: {
          id: app.user.id,
          name: app.user.name || app.companyName,
          email: app.user.email,
          phone: app.user.phone || app.phone,
          isActive: app.user.isActive,
          mitraStatus: app.user.mitraStatus,
        },
        _count: {
          services: 0,
          products: 0,
          orders: 0,
          images: 0,
          reviews: 0,
        },
      }))
    }

    // Combine items based on filter
    const combinedList = [...mappedApplicants, ...mappedStores]

    // Calculate stats
    const [
      totalActiveStores,
      totalInactiveStores,
      totalPendingApplicants,
      uniqueCities,
    ] = await Promise.all([
      db.store.count({ where: { isActive: true } }),
      db.store.count({ where: { isActive: false } }),
      (db as any).storeApplication.count({
        where: { user: { role: 'MITRA', mitraStatus: 'PENDING' } },
      }),
      db.store.findMany({
        select: { city: true },
        distinct: ['city'],
      }),
    ])

    const totalCount = combinedList.length
    const paginatedItems = combinedList.slice(skip, skip + limit)

    return NextResponse.json({
      mitras: paginatedItems,
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
