import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    // Only ADMIN and SUPER_ADMIN can update users
    if (
      !session?.user ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { role, isActive, mitraStatus } = body

    // Get user to check if it's SUPER_ADMIN
    const user = await prisma.user.findUnique({
      where: { id },
      select: { role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Cannot modify SUPER_ADMIN
    if (user.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Cannot modify SUPER_ADMIN' },
        { status: 403 }
      )
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (role !== undefined) updateData.role = role
    if (isActive !== undefined) updateData.isActive = isActive
    if (mitraStatus !== undefined) updateData.mitraStatus = mitraStatus

    // Otomatis sinkronisasi status persetujuan jika user adalah MITRA
    const targetRole = role !== undefined ? role : user.role
    if (targetRole === 'MITRA') {
      const existingMitraProfile = await prisma.mitra.findUnique({
        where: { userId: id },
        select: { id: true },
      })

      if (isActive === true || (role === 'MITRA' && isActive !== false)) {
        // Mengaktifkan atau mengubah akun menjadi mitra: otomatis setujui & pastikan profil Mitra tersedia
        updateData.mitraStatus = 'APPROVED'
        updateData.isActive = true

        if (existingMitraProfile) {
          await prisma.mitra.updateMany({
            where: { userId: id },
            data: {
              isApproved: true,
              isActive: true,
            },
          })
        } else {
          const fullTargetUser = await prisma.user.findUnique({
            where: { id },
            select: { name: true, phone: true, email: true },
          })
          await prisma.mitra.create({
            data: {
              userId: id,
              businessName: fullTargetUser?.name || 'Bengkel Mitra Servis',
              address: 'Alamat workshop belum diatur',
              city: 'Jakarta',
              province: 'DKI Jakarta',
              phone: fullTargetUser?.phone || '-',
              whatsapp: fullTargetUser?.phone || null,
              email: fullTargetUser?.email || null,
              rating: 5.0,
              totalReview: 0,
              isApproved: true,
              isActive: true,
            },
          })
        }
      } else if (isActive === false) {
        // Menonaktifkan akun mitra
        await prisma.mitra.updateMany({
          where: { userId: id },
          data: {
            isActive: false,
          },
        })
      }

      try {
        const { invalidateMitraServiceDataCache } =
          await import('@/lib/mitra-service-data')
        invalidateMitraServiceDataCache()
      } catch {}
    }

    // If mitraStatus is being updated explicitly AND targetRole is MITRA, update Mitra table and user role
    if (mitraStatus !== undefined && targetRole === 'MITRA') {
      const isApproved = mitraStatus === 'APPROVED'
      await prisma.mitra.updateMany({
        where: { userId: id },
        data: {
          isApproved,
          isActive: isApproved,
        },
      })

      if (isApproved) {
        updateData.role = 'MITRA'
        updateData.isActive = true
      } else if (mitraStatus === 'REJECTED') {
        updateData.role = 'CUSTOMER'
        updateData.isActive = false
      }
    }

    // Otomatis sinkronisasi toko jika user adalah atau diangkat menjadi STORE_ADMIN
    if (targetRole === 'STORE_ADMIN') {
      updateData.role = 'STORE_ADMIN'
      if (isActive === true || mitraStatus === 'APPROVED') {
        updateData.mitraStatus = 'APPROVED'
        updateData.isActive = true
      } else if (mitraStatus === 'REJECTED') {
        updateData.mitraStatus = 'REJECTED'
        updateData.isActive = false
      }
      // Hapus profil Mitra Servis jika sebelumnya sempat terdaftar sebagai MITRA agar tidak nyangkut ke form Mitra Servis
      await prisma.mitra.deleteMany({ where: { userId: id } }).catch(() => {})
      const fullUser = await prisma.user.findUnique({
        where: { id },
        select: { storeId: true, email: true, name: true },
      })
      if (fullUser?.storeId && isActive !== undefined) {
        await prisma.store
          .update({
            where: { id: fullUser.storeId },
            data: { isActive: Boolean(isActive) },
          })
          .catch(() => {})
      } else if (!fullUser?.storeId) {
        const storeByEmail = await prisma.store.findFirst({
          where: { email: fullUser?.email || undefined },
          select: { id: true },
        })
        if (storeByEmail) {
          updateData.storeId = storeByEmail.id
        } else {
          const app = await (prisma as any).storeApplication.findFirst({
            where: { userId: id },
          })
          if (app && app.storeName) {
            let baseSlug = (app.storeName || 'toko-cabang')
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

            const newStore = await prisma.store.create({
              data: {
                name: app.storeName || 'Cabang Toko Fisik',
                slug: finalSlug,
                companyName: app.companyName || 'PT Cabang Toko',
                address: app.address || 'Alamat Toko',
                city: app.city || 'Tangerang',
                province: app.province || 'Banten',
                postalCode: app.postalCode || null,
                phone: app.phone || fullUser?.email || '081200000000',
                email: fullUser?.email,
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
            updateData.storeId = newStore.id
          }
        }
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        mitraStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    // Only ADMIN and SUPER_ADMIN can delete users
    if (
      !session?.user ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Cannot delete own self
    if (session.user.id === id) {
      return NextResponse.json(
        { error: 'Tidak dapat menghapus akun Anda sendiri saat sedang login' },
        { status: 400 }
      )
    }

    // Get user to check role and relations
    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: {
        store: true,
      },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // Cannot delete SUPER_ADMIN
    if (targetUser.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Akun Super Admin tidak dapat dihapus' },
        { status: 403 }
      )
    }

    // ─── 1. Penanganan Khusus Admin Toko (STORE_ADMIN) ───────────────────────
    // Pastikan saat admin toko dihapus, toko dan riwayat transaksinya tidak terganggu,
    // tetapi toko untuk sementara dinonaktifkan (isActive = false) agar tidak muncul di publik.
    let managedStoreName: string | null = null
    const managedStore = targetUser.storeId
      ? await prisma.store.findUnique({ where: { id: targetUser.storeId } })
      : await prisma.store.findFirst({ where: { email: targetUser.email } })

    if (managedStore) {
      managedStoreName = managedStore.name
      // Nonaktifkan toko untuk sementara
      await prisma.store.update({
        where: { id: managedStore.id },
        data: {
          isActive: false,
        },
      })
    }

    // Unlink user dari toko
    await prisma.user.update({
      where: { id },
      data: { storeId: null },
    })

    // ─── 2. Pembersihan Data Dependent (Anti-Foreign Key Violation) ───────────
    await prisma.$transaction(async (tx) => {
      // Data autentikasi & sesi
      await tx.session.deleteMany({ where: { userId: id } }).catch(() => {})
      await tx.account.deleteMany({ where: { userId: id } }).catch(() => {})
      await tx.userDevice.deleteMany({ where: { userId: id } }).catch(() => {})
      await tx.otpToken.deleteMany({ where: { userId: id } }).catch(() => {})
      await tx.emailVerificationToken
        .deleteMany({ where: { userId: id } })
        .catch(() => {})
      await tx.notificationLog
        .deleteMany({ where: { userId: id } })
        .catch(() => {})

      // Data aktivitas & personal user
      await tx.notification
        .deleteMany({ where: { userId: id } })
        .catch(() => {})
      await tx.cart.deleteMany({ where: { userId: id } }).catch(() => {})
      await tx.userAddress.deleteMany({ where: { userId: id } }).catch(() => {})
      await tx.auditLog.deleteMany({ where: { userId: id } }).catch(() => {})
      await tx.voucherUsage
        .deleteMany({ where: { userId: id } })
        .catch(() => {})
      await tx.chatTemplate
        .deleteMany({ where: { userId: id } })
        .catch(() => {})
      await tx.massUpdateTask
        .deleteMany({ where: { userId: id } })
        .catch(() => {})
      await tx.liveStreamComment
        .deleteMany({ where: { userId: id } })
        .catch(() => {})

      // Hapus profil mitra servis beserta layanan & gambarnya jika ada
      const userMitra = await tx.mitra.findUnique({
        where: { userId: id },
        select: { id: true },
      })
      if (userMitra) {
        await tx.mitraService
          .deleteMany({ where: { mitraId: userMitra.id } })
          .catch(() => {})
        await tx.mitraImage
          .deleteMany({ where: { mitraId: userMitra.id } })
          .catch(() => {})
        await tx.review
          .deleteMany({ where: { mitraId: userMitra.id } })
          .catch(() => {})
        await tx.mitra.delete({ where: { id: userMitra.id } }).catch(() => {})
      }
      await tx.storeApplication
        .deleteMany({ where: { userId: id } })
        .catch(() => {})

      // Unlink relasi staf / after sales
      await tx.storeGroup
        .updateMany({
          where: { afterSalesUserId: id },
          data: { afterSalesUserId: null },
        })
        .catch(() => {})

      // Unlink klaim chat staf
      await tx.adminChatRoom
        .updateMany({
          where: { claimedById: id },
          data: { claimedById: null },
        })
        .catch(() => {})

      // Hapus pesan dan room yang dikirim / dimiliki user sebagai customer
      await tx.adminChatMessage
        .deleteMany({ where: { senderId: id } })
        .catch(() => {})
      await tx.adminChatRoom
        .deleteMany({ where: { customerId: id } })
        .catch(() => {})
      await tx.chatMessage
        .deleteMany({ where: { senderId: id } })
        .catch(() => {})
      await tx.chatRoom
        .deleteMany({ where: { customerId: id } })
        .catch(() => {})

      // Unlink order assignment staf
      await tx.order
        .updateMany({
          where: { claimedById: id },
          data: { claimedById: null },
        })
        .catch(() => {})
      await tx.order
        .updateMany({
          where: { paymentRequestedById: id },
          data: { paymentRequestedById: null },
        })
        .catch(() => {})
      await tx.order
        .updateMany({
          where: { technicianPaymentRequestedById: id },
          data: { technicianPaymentRequestedById: null },
        })
        .catch(() => {})

      // ─── 3. Penanganan Transaksi Pesanan & Hak Konsumen ─────────────────────
      // Jika user memiliki riwayat order, alihkan ke akun penampung arsip
      // agar seluruh riwayat omzet, barang, dan akuntansi toko tidak hilang.
      const hasOrders = await tx.order.count({ where: { userId: id } })
      if (hasOrders > 0) {
        let archiveUser = await tx.user.findUnique({
          where: { id: 'system_deleted_user' },
        })
        if (!archiveUser) {
          archiveUser = await tx.user.create({
            data: {
              id: 'system_deleted_user',
              name: 'Pengguna Dihapus (Arsip)',
              email: 'deleted.user@system.internal',
              role: 'CUSTOMER',
              isActive: false,
            },
          })
        }

        await tx.order.updateMany({
          where: { userId: id },
          data: { userId: archiveUser.id },
        })
        await tx.returnRequest.updateMany({
          where: { userId: id },
          data: { userId: archiveUser.id },
        })
        await tx.complaint.updateMany({
          where: { userId: id },
          data: { userId: archiveUser.id },
        })
        await tx.review.updateMany({
          where: { userId: id },
          data: { userId: archiveUser.id },
        })
      }

      // ─── 4. Eksekusi Hapus User Permanen ──────────────────────────────────
      await tx.user.delete({
        where: { id },
      })
    })

    if (targetUser.role === 'MITRA') {
      try {
        const { invalidateMitraServiceDataCache } =
          await import('@/lib/mitra-service-data')
        invalidateMitraServiceDataCache()
      } catch {}
    }

    const successMessage = managedStoreName
      ? `Akun admin toko berhasil dihapus. Toko "${managedStoreName}" dinonaktifkan sementara dan riwayat transaksinya tetap aman.`
      : 'Pengguna berhasil dihapus'

    return NextResponse.json({
      success: true,
      message: successMessage,
      storeDeactivated: Boolean(managedStoreName),
      storeName: managedStoreName,
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Gagal menghapus pengguna dari database',
      },
      { status: 500 }
    )
  }
}
