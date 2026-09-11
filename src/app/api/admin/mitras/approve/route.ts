import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (
      !session?.user ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya Superadmin/Admin yang berwenang.' },
        { status: 403 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const { userId, id, applicationId } = body

    const candidateId = userId || applicationId || id
    if (!candidateId) {
      return NextResponse.json(
        { error: 'User ID atau ID pendaftar wajib disertakan.' },
        { status: 400 }
      )
    }

    const cleanAppId = String(candidateId).replace('applicant_', '')

    // Find store application directly along with applicant user
    const app = await (prisma as any).storeApplication.findFirst({
      where: {
        OR: [{ userId: candidateId }, { id: cleanAppId }],
      },
      include: {
        user: true,
      },
    })

    if (!app) {
      return NextResponse.json(
        { error: 'Data formulir toko pendaftar belum ditemukan.' },
        { status: 404 }
      )
    }

    const user = app.user
    if (!user) {
      return NextResponse.json(
        { error: 'Pengguna pendaftar tidak ditemukan.' },
        { status: 404 }
      )
    }

    // Generate unique slug
    let baseSlug = app.storeName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    if (!baseSlug) {
      baseSlug = `toko-${Date.now()}`
    }

    let finalSlug = baseSlug
    const existingStoreWithSlug = await prisma.store.findUnique({
      where: { slug: finalSlug },
      select: { id: true },
    })

    if (existingStoreWithSlug) {
      finalSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`
    }

    // Execute atomic creation of Store and user upgrade to STORE_ADMIN
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Store record
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
          email: user.email,
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

      // 2. Upgrade user role and link to new Store
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          role: 'STORE_ADMIN',
          storeId: newStore.id,
          mitraStatus: 'APPROVED',
          isActive: true,
        },
      })

      // 3. Also mark Mitra record as approved if exists
      const existingMitra = await tx.mitra.findUnique({
        where: { userId: user.id },
      })
      if (existingMitra) {
        await tx.mitra.update({
          where: { id: existingMitra.id },
          data: { isApproved: true },
        })
      }

      return { newStore, updatedUser }
    })

    return NextResponse.json(
      {
        success: true,
        message: `Pendaftaran toko "${app.storeName}" berhasil disetujui. Akun telah ditingkatkan menjadi Admin Toko.`,
        storeId: result.newStore.id,
        slug: result.newStore.slug,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Admin Mitra Approve Error]', error)
    const errorMessage =
      process.env.NODE_ENV === 'development' && error instanceof Error
        ? `Gagal menyetujui pendaftaran: ${error.message}`
        : 'Terjadi kendala saat menyetujui pendaftaran mitra toko.'

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
