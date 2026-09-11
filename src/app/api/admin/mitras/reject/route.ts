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
    const { userId, id, applicationId, reason } = body

    let targetUserId = userId
    if (!targetUserId && (applicationId || id)) {
      const cleanAppId = String(applicationId || id).replace('applicant_', '')
      const app = await (prisma as any).storeApplication.findUnique({
        where: { id: cleanAppId },
        select: { userId: true },
      })
      if (app) {
        targetUserId = app.userId
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'User ID atau ID pendaftar wajib disertakan.' },
        { status: 400 }
      )
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
      return NextResponse.json(
        {
          error:
            'Alasan penolakan / instruksi perbaikan wajib diisi minimal 3 karakter.',
        },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { storeApplication: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Pengguna pendaftar tidak ditemukan.' },
        { status: 404 }
      )
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: targetUserId },
        data: {
          mitraStatus: 'REJECTED',
        },
      }),
      prisma.storeApplication.upsert({
        where: { userId: targetUserId },
        create: {
          userId: targetUserId,
          storeName: user.name || 'Cabang Toko',
          companyName: user.name || 'Badan Usaha',
          address: user.address || 'Alamat',
          city: user.city || 'Kota',
          province: user.province || 'Provinsi',
          phone: user.phone || '08123456789',
          rejectionReason: reason.trim(),
        },
        update: {
          rejectionReason: reason.trim(),
        },
      }),
    ])

    return NextResponse.json(
      {
        success: true,
        message:
          'Pendaftaran berhasil ditolak. Calon mitra dapat melihat catatan perbaikan dan mengajukan ulang.',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Admin Mitra Reject Error]', error)
    return NextResponse.json(
      { error: 'Terjadi kendala saat menolak pendaftaran mitra toko.' },
      { status: 500 }
    )
  }
}
