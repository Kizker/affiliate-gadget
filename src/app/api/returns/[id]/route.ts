import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { bookShippingPickup } from '@/lib/shipping/biteship-client'

// GET - Single return request details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: {
                  include: {
                    variants: true,
                  },
                },
                service: true,
              },
            },
            store: true,
          },
        },
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    })

    if (!returnRequest) {
      return NextResponse.json(
        { error: 'Pengajuan pengembalian tidak ditemukan' },
        { status: 404 }
      )
    }

    // Access & IDOR check: Customer can only view own, Store Admin can view store's, After Sales can view group's
    if (
      session.user.role === 'CUSTOMER' &&
      returnRequest.userId !== session.user.id
    ) {
      return NextResponse.json(
        { error: 'Pengajuan pengembalian tidak ditemukan' },
        { status: 404 }
      )
    }

    if (
      session.user.role === 'STORE_ADMIN' ||
      session.user.role === 'STORE_SALES'
    ) {
      let storeId = session.user.storeId
      if (!storeId && session.user.id) {
        const u = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { storeId: true },
        })
        storeId = u?.storeId || null
      }
      const orderStoreId = returnRequest.order?.storeId || returnRequest.storeId
      if (!storeId || orderStoreId !== storeId) {
        return NextResponse.json(
          { error: 'Pengajuan pengembalian tidak ditemukan' },
          { status: 404 }
        )
      }
    }

    if (session.user.role === 'AFTER_SALES') {
      const group = await prisma.storeGroup.findFirst({
        where: { afterSalesUserId: session.user.id },
        include: { stores: { select: { id: true } } },
      })
      const storeIds = group?.stores.map((s) => s.id) || []
      const orderStoreId = returnRequest.order?.storeId || returnRequest.storeId
      if (
        storeIds.length > 0 &&
        (!orderStoreId || !storeIds.includes(orderStoreId))
      ) {
        return NextResponse.json(
          { error: 'Pengajuan pengembalian tidak ditemukan' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json({ success: true, data: returnRequest })
  } catch (error) {
    console.error('Error fetching return request:', error)
    return NextResponse.json(
      { error: 'Failed to fetch return request' },
      { status: 500 }
    )
  }
}

// PUT - Update return request status or add tracking number
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const existing = await prisma.returnRequest.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            payment: true,
            store: true,
            user: {
              include: {
                addresses: {
                  where: { isDefault: true },
                  take: 1,
                },
              },
            },
            items: {
              include: {
                product: {
                  include: {
                    variants: true,
                  },
                },
                rentalItem: true,
                service: true,
              },
            },
          },
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Pengajuan pengembalian tidak ditemukan' },
        { status: 404 }
      )
    }

    // IDOR Protection: After Sales can only manage returns within their store group
    if (session.user.role === 'AFTER_SALES') {
      const group = await prisma.storeGroup.findFirst({
        where: { afterSalesUserId: session.user.id },
        include: { stores: { select: { id: true } } },
      })
      const storeIds = group?.stores.map((s) => s.id) || []
      const orderStoreId = existing.order?.storeId || existing.storeId
      if (
        storeIds.length > 0 &&
        (!orderStoreId || !storeIds.includes(orderStoreId))
      ) {
        return NextResponse.json(
          { error: 'Pengajuan pengembalian tidak ditemukan' },
          { status: 404 }
        )
      }
    }

    // After Sales Recommendation Action: AFTER_SALES_CONFIRM or FORWARD_TO_SUPERADMIN
    if (
      body.action === 'AFTER_SALES_CONFIRM' ||
      body.action === 'FORWARD_TO_SUPERADMIN'
    ) {
      if (
        session.user.role !== 'AFTER_SALES' &&
        session.user.role !== 'SUPER_ADMIN' &&
        session.user.role !== 'ADMIN'
      ) {
        return NextResponse.json(
          {
            error:
              'Konfirmasi dan penerusan rekomendasi ke Superadmin hanya dapat dilakukan oleh After Sales',
          },
          { status: 403 }
        )
      }

      const decision = String(
        body.decision ||
          (body.action === 'FORWARD_TO_SUPERADMIN' ? 'APPROVE' : '')
      ).toUpperCase()
      const rawNotes = (
        body.notes ||
        body.reason ||
        body.rejectionReason ||
        ''
      ).trim()

      const qcImages = Array.isArray(body.qcImages)
        ? body.qcImages
            .filter((img: any) => typeof img === 'string' && img.trim())
            .slice(0, 5)
        : []

      // Fleksibel: wajib menyertakan minimal salah satu dari alasan atau foto bukti QC
      if (!rawNotes && qcImages.length === 0) {
        return NextResponse.json(
          {
            error:
              'Mohon sertakan deskripsi alasan pemeriksaan atau lampirkan minimal 1 foto bukti QC.',
          },
          { status: 400 }
        )
      }

      const defaultDecisionNote =
        decision === 'APPROVE' || decision === 'ACCEPT'
          ? 'Pemeriksaan fisik (QC) selesai dan memenuhi syarat garansi.'
          : 'Pemeriksaan fisik (QC) tidak memenuhi kriteria klaim garansi.'
      const noteContent = rawNotes || defaultDecisionNote
      const imagesMarker =
        qcImages.length > 0 ? ` [Foto QC: ${qcImages.join(',')}]` : ''

      const formattedStoreResponse =
        decision === 'APPROVE' || decision === 'ACCEPT'
          ? `[Rekomendasi After Sales: DISETUJUI] ${noteContent}${imagesMarker}`
          : decision === 'REJECT'
            ? `[Rekomendasi After Sales: DITOLAK] ${noteContent}${imagesMarker}`
            : `[Divalidasi After Sales] ${noteContent}${imagesMarker}`

      const updatedReturn = await prisma.returnRequest.update({
        where: { id },
        data: {
          status: 'IN_REVIEW',
          storeResponse: formattedStoreResponse,
          qcStatus:
            decision === 'APPROVE' || decision === 'ACCEPT'
              ? 'PASSED'
              : 'FAILED',
          qcNotes: noteContent,
        },
        include: {
          order: true,
          user: { select: { id: true, name: true, email: true } },
        },
      })

      // Update aktivitas order agar naik ke urutan paling atas di tabel pesanan
      if (existing.orderId) {
        await prisma.order
          .update({
            where: { id: existing.orderId },
            data: { updatedAt: new Date() },
          })
          .catch(() => {})
      }

      // Kirim notifikasi ke semua Superadmin agar ditinjau & di-ACC final
      const superAdmins = await prisma.user.findMany({
        where: { role: 'SUPER_ADMIN', isActive: true },
        select: { id: true },
      })

      for (const sa of superAdmins) {
        await prisma.notification
          .create({
            data: {
              userId: sa.id,
              type: 'NEW_COMPLAINT',
              title: `Rekomendasi Retur Baru (${
                decision === 'REJECT' ? 'Ditolak' : 'Disetujui'
              })`,
              message: `After Sales merekomendasikan ${
                decision === 'REJECT' ? 'PENOLAKAN' : 'PERSETUJUAN'
              } untuk pesanan #${existing.order.orderNumber}. Catatan: ${noteContent}${
                qcImages.length > 0
                  ? ` (${qcImages.length} foto QC dilampirkan)`
                  : ''
              }`,
              link: '/dashboard/admin/returns',
            },
          })
          .catch(() => {})
      }

      // Notifikasi ke pembeli
      await prisma.notification
        .create({
          data: {
            userId: existing.userId,
            type: 'NEW_COMPLAINT',
            title: 'Pengajuan Telah Dikonfirmasi After Sales',
            message: `Pengajuan retur/klaim garansi pesanan #${existing.order.orderNumber} telah ditelaah oleh tim After Sales dan diteruskan ke Superadmin untuk persetujuan akhir.`,
            link: `/dashboard/customer/orders/${existing.orderId}`,
          },
        })
        .catch(() => {})

      return NextResponse.json({
        success: true,
        message:
          'Konfirmasi keputusan After Sales berhasil dikirimkan ke Superadmin untuk ACC Final',
        data: updatedReturn,
      })
    }

    // Rejection by After Sales (Direct legacy fallback)
    if (body.action === 'REJECT' && session.user.role === 'AFTER_SALES') {
      const note =
        body.rejectionReason ||
        'Pengajuan pengembalian ditolak oleh After Sales karena tidak memenuhi syarat garansi.'

      const updatedReturn = await prisma.returnRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          resolvedAt: new Date(),
          storeResponse: `[Ditolak After Sales] ${note}`,
        },
        include: {
          order: true,
          user: { select: { id: true, name: true, email: true } },
        },
      })

      await prisma.notification
        .create({
          data: {
            userId: existing.userId,
            type: 'COMPLAINT_RESOLVED',
            title: 'Pengajuan Pengembalian Ditolak After Sales',
            message: `Pengajuan pengembalian untuk pesanan #${existing.order.orderNumber} ditolak oleh After Sales: ${note}`,
            link: `/dashboard/customer/orders/${existing.orderId}`,
          },
        })
        .catch(() => {})

      return NextResponse.json({
        success: true,
        message: 'Pengajuan berhasil ditolak oleh After Sales',
        data: updatedReturn,
      })
    }

    // Superadmin & After Sales Final Decision Action: APPROVE or REJECT
    if (body.action === 'APPROVE' || body.action === 'REJECT') {
      if (
        session.user.role !== 'SUPER_ADMIN' &&
        session.user.role !== 'ADMIN' &&
        session.user.role !== 'AFTER_SALES'
      ) {
        return NextResponse.json(
          {
            error:
              'Persetujuan atau penolakan pengembalian hanya dapat dilakukan oleh After Sales atau Superadmin',
          },
          { status: 403 }
        )
      }

      const isApprove = body.action === 'APPROVE'
      const isSuperAdmin =
        session.user.role === 'SUPER_ADMIN' || session.user.role === 'ADMIN'

      // Jika Superadmin menolak pengajuan yang sedang dalam tahap rekomendasi After Sales:
      // Status dikembalikan ke After Sales agar After Sales dapat menelaah dan memutuskan ulang
      if (isSuperAdmin && !isApprove) {
        const rejectReason = (
          body.rejectionReason ||
          body.adminNotes ||
          'Ditolak oleh Superadmin untuk ditinjau ulang oleh tim After Sales.'
        ).trim()

        const updatedReturn = await prisma.returnRequest.update({
          where: { id },
          data: {
            status: 'IN_REVIEW',
            storeResponse: `[Dikembalikan Superadmin ke After Sales] ${rejectReason}`,
            qcStatus: 'NEEDS_REVISION',
          },
          include: {
            order: true,
            user: { select: { id: true, name: true, email: true } },
          },
        })

        // Kirim notifikasi ke tim After Sales bahwa tiket dikembalikan
        const afterSalesStaff = await prisma.user.findMany({
          where: { role: 'AFTER_SALES', isActive: true },
          select: { id: true },
        })

        for (const staff of afterSalesStaff) {
          await prisma.notification
            .create({
              data: {
                userId: staff.id,
                type: 'NEW_COMPLAINT',
                title: 'Tiket Retur Dikembalikan oleh Superadmin',
                message: `Pengajuan retur pesanan #${existing.order.orderNumber} telah ditolak Superadmin dan dikembalikan ke After Sales untuk ditinjau ulang: ${rejectReason}`,
                link: '/dashboard/after-sales/returns',
              },
            })
            .catch(() => {})
        }

        return NextResponse.json({
          success: true,
          message:
            'Pengajuan retur ditolak oleh Superadmin dan dikembalikan ke After Sales untuk ditinjau ulang',
          data: updatedReturn,
        })
      }

      // Jika Superadmin menyetujui (ACC Final) dan barang fisik telah tiba / tiket dalam IN_REVIEW After Sales:
      // Lakukan eksekusi otomatis: potong stok & kirim unit baru (REPLACEMENT) atau cairkan escrow Midtrans (REFUND)
      const isPackageArrived = Boolean(
        existing.packageReceivedAt ||
        existing.storeResponse?.includes('[Paket Fisik Tiba di Cabang]')
      )
      const hasAfterSalesRecommendation = Boolean(
        existing.storeResponse?.includes(
          '[Rekomendasi After Sales: DISETUJUI]'
        ) || existing.status === 'IN_REVIEW'
      )

      if (
        isSuperAdmin &&
        isApprove &&
        (isPackageArrived || hasAfterSalesRecommendation)
      ) {
        const resolutionType = existing.type || 'REPLACEMENT'

        if (resolutionType === 'REPLACEMENT') {
          // 1. Validasi & Pengurangan Stok Unit Pengganti di Toko Cabang Pengirim
          const productItems = (existing.order?.items || []).filter(
            (item: any) => item.productId && item.product
          )

          for (const item of productItems) {
            const requiredQty = item.quantity || 1
            const prod = item.product!
            let hasStock = false
            let currentStock = 0
            let targetVariantName = item.variantName || 'Standar'

            if (
              item.variantId &&
              Array.isArray(prod.variants) &&
              prod.variants.length > 0
            ) {
              const matchedVariant = prod.variants.find(
                (v: any) => v.id === item.variantId
              )
              if (matchedVariant) {
                currentStock = matchedVariant.stock
                targetVariantName = matchedVariant.name || targetVariantName
                hasStock = matchedVariant.stock >= requiredQty
              } else {
                currentStock = prod.stock
                hasStock = prod.stock >= requiredQty
              }
            } else {
              currentStock = prod.stock
              hasStock = prod.stock >= requiredQty
            }

            if (!hasStock) {
              return NextResponse.json(
                {
                  error: `Stok unit baru "${prod.name} (${targetVariantName})" di toko ${existing.order.store?.name || 'cabang'} tidak mencukupi (Sisa stok: ${currentStock} unit, dibutuhkan: ${requiredQty} unit). Harap lakukan restock unit toko terlebih dahulu atau alihkan ke opsi Retur & Refund.`,
                },
                { status: 400 }
              )
            }

            if (item.variantId) {
              await prisma.productVariant
                .update({
                  where: { id: item.variantId },
                  data: { stock: { decrement: requiredQty } },
                })
                .catch(() => {})
            }

            await prisma.product.update({
              where: { id: prod.id },
              data: { stock: { decrement: requiredQty } },
            })

            await prisma.auditLog
              .create({
                data: {
                  userId: session.user.id,
                  action: 'INVENTORY_DEDUCT_REPLACEMENT',
                  entityType: 'ORDER',
                  entityId: existing.orderId,
                  details: {
                    orderNumber: existing.order.orderNumber,
                    returnId: existing.id,
                    storeId: existing.order.storeId,
                    storeName: existing.order.store?.name,
                    productId: prod.id,
                    productName: prod.name,
                    variantId: item.variantId,
                    variantName: targetVariantName,
                    quantityDeducted: requiredQty,
                    previousStock: currentStock,
                    remainingStock: currentStock - requiredQty,
                    reason:
                      'Pengeluaran unit baru pengganti retur garansi 30 hari (ACC Final Superadmin)',
                  },
                },
              })
              .catch(() => {})
          }

          // 2. Terbitkan nomor resi otomatis via Biteship / auto waybill
          const courierCode = 'JNE'
          const courierService = 'REG'
          let tracking = ''

          if (existing.order) {
            const originStore = {
              name: existing.order.store?.name || 'Toko Gadget Pusat',
              companyName:
                existing.order.store?.companyName ||
                existing.order.store?.name ||
                'PT Gadget Jaya Sentosa',
              address:
                existing.order.store?.address || 'ITC Roxy Mas Lt. 2 No. 15',
              city: existing.order.store?.city || 'Jakarta',
              phone: existing.order.store?.phone || '081234567890',
              latitude: existing.order.store?.latitude,
              longitude: existing.order.store?.longitude,
              postalCode: existing.order.store?.postalCode,
            }

            const defaultAddress = existing.order.user?.addresses?.[0]
            const destinationCustomer = {
              name: existing.order.user?.name || 'Customer',
              address:
                defaultAddress?.fullAddress ||
                existing.order.user?.address ||
                'Alamat Lengkap Customer',
              city:
                defaultAddress?.city || existing.order.user?.city || 'Jakarta',
              province:
                defaultAddress?.province ||
                existing.order.user?.province ||
                'DKI Jakarta',
              postalCode:
                defaultAddress?.postalCode || existing.order.user?.postalCode,
              phone:
                defaultAddress?.phone ||
                existing.order.user?.phone ||
                '081298765432',
              latitude: defaultAddress?.latitude,
              longitude: defaultAddress?.longitude,
            }

            const items =
              existing.order.items && existing.order.items.length > 0
                ? existing.order.items.map((item: any) => ({
                    name:
                      item.product?.name ||
                      item.rentalItem?.name ||
                      item.service?.name ||
                      'Gadget Replacement Unit',
                    quantity: item.quantity,
                    weightGram: item.product?.weightGram || 500,
                    price: item.price,
                  }))
                : [
                    {
                      name: 'Unit Baru Pengganti (Garansi 30 Hari)',
                      quantity: 1,
                      weightGram: 500,
                      price: existing.order.total,
                    },
                  ]

            try {
              const bookedShippingRecord = await bookShippingPickup({
                orderId: existing.order.id,
                orderNumber: existing.order.orderNumber,
                courierCode,
                courierService,
                originStore,
                destinationCustomer,
                items,
              })
              tracking = bookedShippingRecord.trackingNumber
            } catch {
              const { generateWaybill } =
                await import('@/lib/shipping/biteship-client')
              tracking = generateWaybill(courierCode)
            }
          }

          const adminNote =
            body.adminNotes?.trim() ||
            '[Disetujui Superadmin] ACC Final Tukar Unit Baru disetujui.'
          const updatedReturn = await prisma.returnRequest.update({
            where: { id },
            data: {
              status: 'COMPLETED',
              type: 'REPLACEMENT',
              returnCourier: courierCode,
              returnTrackingNumber: tracking,
              storeResponse: `${adminNote} Unit baru pengganti otomatis dikirim via Biteship (${courierCode} ${courierService}) dengan resi ${tracking}. Garansi toko 30 hari aktif kembali.`,
              resolvedAt: new Date(),
            },
            include: {
              order: true,
              user: { select: { id: true, name: true, email: true } },
            },
          })

          if (existing.orderId) {
            await prisma.order.update({
              where: { id: existing.orderId },
              data: {
                status: 'SHIPPED',
                courierCode,
                courierService,
                trackingNumber: tracking,
                customerConfirmedAt: null,
                completedAt: null,
                updatedAt: new Date(),
              },
            })
          }

          // Notifikasi ke pembeli
          await prisma.notification
            .create({
              data: {
                userId: existing.userId,
                type: 'ORDER_SHIPPED',
                title: 'Unit Baru Pengganti Telah Dikirim (ACC Superadmin)',
                message: `Pengajuan tukar unit baru pesanan #${existing.order.orderNumber} telah disetujui Superadmin. Unit baru pengganti telah dikirim via Biteship (${courierCode} ${courierService}) dengan resi ${tracking}. Lacak pengiriman Anda sekarang.`,
                link: `/dashboard/customer/orders/${existing.orderId}`,
              },
            })
            .catch(() => {})

          // Notifikasi ke After Sales
          const afterSalesStaff = await prisma.user.findMany({
            where: { role: 'AFTER_SALES', isActive: true },
            select: { id: true },
          })
          for (const staff of afterSalesStaff) {
            await prisma.notification
              .create({
                data: {
                  userId: staff.id,
                  type: 'COMPLAINT_RESOLVED',
                  title: 'ACC Final Retur Disetujui Superadmin (Tukar Unit)',
                  message: `Superadmin telah menyetujui ACC Final tukar unit untuk pesanan #${existing.order.orderNumber}. Stok cabang telah dipotong dan resi pengganti ${tracking} telah terbit.`,
                  link: '/dashboard/after-sales/returns',
                },
              })
              .catch(() => {})
          }

          return NextResponse.json({
            success: true,
            message: `ACC Final berhasil disetujui Superadmin. Unit pengganti baru otomatis diproses kirim dengan nomor resi ${tracking}.`,
            data: updatedReturn,
          })
        } else {
          // REFUND: Otomatis transfer dana bersih balik ke customer (Escrow Midtrans)
          const { calculateNetRefundAmount } =
            await import('@/lib/returns/refund-calculator')
          const refundCalc = calculateNetRefundAmount({
            total: existing.order.total,
            subtotal: existing.order.subtotal,
            shippingCost: existing.order.shippingCost,
            tax: existing.order.tax,
            insuranceFee: existing.order.insuranceFee,
          })
          const refundAmount =
            existing.refundAmount &&
            existing.refundAmount < existing.order.total
              ? existing.refundAmount
              : refundCalc.netRefundAmount

          try {
            const { refundMidtransTransaction } = await import('@/lib/midtrans')
            await refundMidtransTransaction(
              existing.order.orderNumber,
              existing.id,
              refundAmount,
              body.adminNotes ||
                'Garansi 30 Hari Pengembalian Dana ACC Superadmin'
            )
          } catch (midtransErr) {
            console.warn('[MIDTRANS_REFUND_FAIL]:', midtransErr)
          }

          if (existing.bankAccountNumber && existing.bankName) {
            try {
              const { createIrisPayout } = await import('@/lib/midtrans-iris')
              await createIrisPayout({
                referenceNo: `REFUND-${existing.order.orderNumber}`,
                beneficiaryName:
                  existing.bankAccountName || existing.order.orderNumber,
                beneficiaryAccount: existing.bankAccountNumber,
                beneficiaryBank: existing.bankName,
                amount: refundAmount,
                notes: `Refund Pesanan #${existing.order.orderNumber} (ACC Superadmin)`,
              })
            } catch (irisErr) {
              console.warn('[MIDTRANS_IRIS_REFUND_FAIL]:', irisErr)
            }
          }

          const adminNote =
            body.adminNotes?.trim() ||
            '[Disetujui Superadmin] ACC Final Refund disetujui.'
          const updatedReturn = await prisma.returnRequest.update({
            where: { id },
            data: {
              status: 'COMPLETED',
              type: 'REFUND',
              refundAmount,
              storeResponse: `${adminNote} Dana escrow sebesar Rp ${Math.round(refundAmount).toLocaleString('id-ID')} telah otomatis dicairkan kembali ke rekening tujuan pembeli.`,
              resolvedAt: new Date(),
            },
            include: {
              order: true,
              user: { select: { id: true, name: true, email: true } },
            },
          })

          if (existing.orderId) {
            await prisma.order.update({
              where: { id: existing.orderId },
              data: {
                status: 'RETURNED',
                updatedAt: new Date(),
              },
            })

            if (existing.order.payment) {
              await prisma.payment.update({
                where: { id: existing.order.payment.id },
                data: {
                  notes: `Refund Midtrans diproses otomatis pasca-ACC Superadmin pada ${new Date().toLocaleString('id-ID')}`,
                },
              })
            }
          }

          // Notifikasi ke pembeli
          await prisma.notification
            .create({
              data: {
                userId: existing.userId,
                type: 'COMPLAINT_RESOLVED',
                title: 'Dana Refund Berhasil Dicairkan (ACC Superadmin)',
                message: `Pengembalian dana sebesar Rp ${Math.round(refundAmount).toLocaleString('id-ID')} untuk pesanan #${existing.order.orderNumber} telah di-ACC oleh Superadmin dan ditransfer kembali ke rekening ${existing.bankName || 'bank Anda'}.`,
                link: `/dashboard/customer/orders/${existing.orderId}`,
              },
            })
            .catch(() => {})

          // Notifikasi ke After Sales
          const afterSalesStaff = await prisma.user.findMany({
            where: { role: 'AFTER_SALES', isActive: true },
            select: { id: true },
          })
          for (const staff of afterSalesStaff) {
            await prisma.notification
              .create({
                data: {
                  userId: staff.id,
                  type: 'COMPLAINT_RESOLVED',
                  title: 'ACC Final Retur Disetujui Superadmin (Refund)',
                  message: `Superadmin telah menyetujui ACC Final refund untuk pesanan #${existing.order.orderNumber}. Dana sebesar Rp ${Math.round(refundAmount).toLocaleString('id-ID')} telah berhasil dicairkan.`,
                  link: '/dashboard/after-sales/returns',
                },
              })
              .catch(() => {})
          }

          return NextResponse.json({
            success: true,
            message: `ACC Final berhasil disetujui Superadmin. Dana refund sebesar Rp ${Math.round(refundAmount).toLocaleString('id-ID')} telah otomatis dicairkan.`,
            data: updatedReturn,
          })
        }
      }

      // Default approval / reject note untuk alur standar awal
      const defaultApproveNote = isSuperAdmin
        ? '[Disetujui Superadmin] Pengajuan retur telah disetujui Superadmin. Silakan kemas unit dan kirimkan ke alamat toko cabang yang tertera.'
        : 'Pengajuan retur telah disetujui After Sales. Silakan kemas unit dan kirimkan ke alamat toko cabang yang tertera.'

      const defaultRejectNote = isSuperAdmin
        ? '[Ditolak Superadmin] Pengajuan pengembalian ditolak oleh Superadmin.'
        : 'Pengajuan pengembalian ditolak oleh After Sales.'

      const updatedReturn = await prisma.returnRequest.update({
        where: { id },
        data: {
          status: isApprove ? 'APPROVED' : 'REJECTED',
          resolvedAt: isApprove ? null : new Date(),
          storeResponse: isApprove
            ? body.adminNotes || defaultApproveNote
            : body.rejectionReason || defaultRejectNote,
        },
        include: {
          order: true,
          user: { select: { id: true, name: true, email: true } },
        },
      })

      // Send notification to customer
      await prisma.notification
        .create({
          data: {
            userId: existing.userId,
            type: 'COMPLAINT_RESOLVED',
            title: isApprove
              ? isSuperAdmin
                ? 'Pengajuan Retur Disetujui Superadmin'
                : 'Pengajuan Retur Disetujui'
              : isSuperAdmin
                ? 'Pengajuan Retur Ditolak Superadmin'
                : 'Pengajuan Retur Ditolak',
            message: isApprove
              ? `Pengajuan retur untuk pesanan #${existing.order.orderNumber} telah DISETUJUI oleh ${isSuperAdmin ? 'Superadmin' : 'After Sales'}. Silakan kirimkan unit fisik gadget ke alamat toko cabang tujuan yang tertera di detail pesanan.`
              : `Pengajuan pengembalian untuk pesanan #${existing.order.orderNumber} DITOLAK oleh ${isSuperAdmin ? 'Superadmin' : 'After Sales'}: ${body.rejectionReason || 'Tidak memenuhi kriteria'}`,
            link: `/dashboard/customer/orders/${existing.orderId}`,
          },
        })
        .catch(() => {})

      return NextResponse.json({
        success: true,
        message: isApprove
          ? 'Pengembalian berhasil disetujui'
          : 'Pengembalian berhasil ditolak',
        data: updatedReturn,
      })
    }

    // Action: CONFIRM_PACKAGE_RECEIVED (Barang Retur Fisik Tiba di Toko Cabang & Mulai QC)
    if (body.action === 'CONFIRM_PACKAGE_RECEIVED') {
      if (
        session.user.role !== 'AFTER_SALES' &&
        session.user.role !== 'SUPER_ADMIN' &&
        session.user.role !== 'ADMIN'
      ) {
        return NextResponse.json(
          {
            error:
              'Konfirmasi penerimaan barang retur di cabang hanya dapat dilakukan oleh After Sales atau Superadmin',
          },
          { status: 403 }
        )
      }

      if (existing.status === 'COMPLETED' || existing.status === 'REJECTED') {
        return NextResponse.json(
          {
            error:
              'Tiket retur sudah tuntas atau ditolak sehingga tidak dapat dikonfirmasi penerimaan kembali.',
          },
          { status: 400 }
        )
      }

      const receivedNotes = (
        body.qcNotes ||
        body.notes ||
        'Unit fisik barang retur telah tiba di cabang toko. Teknisi sedang melakukan pemeriksaan fisik dan pengujian fungsi (QC).'
      ).trim()

      const receivedAt = new Date()
      const formattedDate = receivedAt.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })

      const recipientRole =
        session.user.role === 'SUPER_ADMIN' || session.user.role === 'ADMIN'
          ? 'Superadmin'
          : 'After Sales'

      const arrivalLog = `[Paket Fisik Tiba di Cabang] Dikonfirmasi oleh ${recipientRole} pada ${formattedDate}. Catatan QC: ${receivedNotes}`
      const newStoreResponse = existing.storeResponse
        ? `${existing.storeResponse}\n\n${arrivalLog}`
        : arrivalLog

      // Cek apakah client runtime mendukung field packageReceivedAt di model in-memory
      const hasQcSupport =
        (prisma as any)._runtimeDataModel?.models?.ReturnRequest?.fields?.some(
          (f: any) => f.name === 'packageReceivedAt'
        ) ?? false

      let updatedReturn: any

      if (hasQcSupport) {
        try {
          updatedReturn = await prisma.returnRequest.update({
            where: { id },
            data: {
              packageReceivedAt: receivedAt,
              qcStatus: body.qcStatus || 'IN_QC',
              qcNotes: receivedNotes,
              storeResponse: newStoreResponse,
            },
            include: {
              order: {
                include: {
                  store: true,
                },
              },
              user: { select: { id: true, name: true, email: true } },
            },
          })
        } catch {
          updatedReturn = null
        }
      }

      if (!updatedReturn) {
        // Fallback update SQL langsung ke PostgreSQL agar tidak memicu PrismaClientValidationError
        await prisma.$executeRawUnsafe(
          `UPDATE "return_requests" 
           SET "packageReceivedAt" = $1, "qcStatus" = $2, "qcNotes" = $3, "storeResponse" = $4, "updatedAt" = $5 
           WHERE "id" = $6`,
          receivedAt,
          body.qcStatus || 'IN_QC',
          receivedNotes,
          newStoreResponse,
          new Date(),
          id
        )

        await prisma.returnRequest
          .update({
            where: { id },
            data: {
              storeResponse: newStoreResponse,
            },
          })
          .catch(() => {})

        updatedReturn = await prisma.returnRequest.findUnique({
          where: { id },
          include: {
            order: {
              include: {
                store: true,
              },
            },
            user: { select: { id: true, name: true, email: true } },
          },
        })

        if (updatedReturn) {
          updatedReturn.packageReceivedAt = receivedAt.toISOString()
          updatedReturn.qcStatus = body.qcStatus || 'IN_QC'
          updatedReturn.qcNotes = receivedNotes
          updatedReturn.storeResponse = newStoreResponse
        }
      }

      // Update aktivitas order agar naik ke urutan paling atas di tabel pesanan
      if (existing.orderId) {
        await prisma.order
          .update({
            where: { id: existing.orderId },
            data: { updatedAt: new Date() },
          })
          .catch(() => {})
      }

      // Kirim notifikasi ke pembeli
      await prisma.notification
        .create({
          data: {
            userId: existing.userId,
            type: 'ORDER_STATUS_CHANGED',
            title: 'Paket Retur Telah Tiba di Toko Cabang',
            message: `Paket unit retur untuk pesanan #${existing.order.orderNumber} telah diterima dengan baik di ${
              existing.order.store?.name || 'toko cabang'
            }. Teknisi saat ini sedang melakukan pemeriksaan fisik (QC).`,
            link: `/dashboard/customer/orders/${existing.orderId}`,
          },
        })
        .catch(() => {})

      // Notifikasi ke seluruh staf After Sales dan Superadmin lain
      const notifyUsers = await prisma.user.findMany({
        where: {
          role: { in: ['SUPER_ADMIN', 'AFTER_SALES'] },
          id: { not: session.user.id },
          isActive: true,
        },
        select: { id: true },
      })

      for (const u of notifyUsers) {
        await prisma.notification
          .create({
            data: {
              userId: u.id,
              type: 'ORDER_STATUS_CHANGED',
              title: 'Unit Retur Tiba di Cabang (Mulai QC)',
              message: `Paket retur pesanan #${existing.order.orderNumber} telah dikonfirmasi tiba di ${
                existing.order.store?.name || 'cabang'
              } oleh ${recipientRole}. Status: Sedang QC Fisik.`,
              link: '/dashboard/admin/returns',
            },
          })
          .catch(() => {})
      }

      return NextResponse.json({
        success: true,
        message:
          'Konfirmasi paket retur tiba di cabang berhasil dicatat. Status beralih ke QC Fisik.',
        data: updatedReturn,
      })
    }

    const {
      status,
      storeResponse,
      returnCourier,
      returnTrackingNumber,
      resolutionAction, // 'REPLACEMENT' | 'REFUND' | 'REPAIR_IN_PROGRESS' | 'REPAIR_COMPLETED'
      estimatedRepairDays,
      repairNotes,
      replacementCourier,
      replacementTrackingNumber,
    } = body

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {}
    let bookedShippingRecord: any = null

    // Customer can update return tracking number
    if (session.user.role === 'CUSTOMER') {
      if (existing.userId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      if (returnCourier !== undefined) updateData.returnCourier = returnCourier
      if (returnTrackingNumber !== undefined) {
        updateData.returnTrackingNumber = returnTrackingNumber
        updateData.status = 'IN_REVIEW' // Paket retur sedang dalam perjalanan & menunggu penerimaan fisik/QC

        // Kirim notifikasi ke Admin After Sales grup cabang terkait
        const storeWithGroup = existing.order?.storeId
          ? await prisma.store.findUnique({
              where: { id: existing.order.storeId },
              include: {
                group: {
                  include: {
                    afterSalesUser: { select: { id: true } },
                  },
                },
              },
            })
          : null

        const targetAfterSalesId = storeWithGroup?.group?.afterSalesUser?.id

        const allAfterSales = targetAfterSalesId
          ? [{ id: targetAfterSalesId }]
          : await prisma.user.findMany({
              where: { role: 'AFTER_SALES', isActive: true },
              select: { id: true },
            })

        for (const asUser of allAfterSales) {
          await prisma.notification
            .create({
              data: {
                userId: asUser.id,
                type: 'ORDER_STATUS_CHANGED',
                title: 'Unit Retur Dikirim oleh Pembeli',
                message: `Pembeli pesanan #${existing.order.orderNumber} telah menginput nomor resi pengiriman balik: ${returnTrackingNumber} (${returnCourier || 'Ekspedisi'}). Paket fisik sedang menuju Service Center/Toko untuk QC.`,
                link: `/dashboard/after-sales/returns`,
              },
            })
            .catch(() => {})
        }
      }
    } else {
      if (
        session.user.role === 'STORE_ADMIN' ||
        session.user.role === 'STORE_SALES'
      ) {
        return NextResponse.json(
          {
            error:
              'Admin Toko Cabang tidak memiliki wewenang mengelola klaim garansi dan retur. Seluruh klaim dieksekusi oleh Admin After Sales.',
          },
          { status: 403 }
        )
      }

      // Validasi perlindungan ganda: Barang wajib dikonfirmasi telah tiba di cabang sebelum dieksekusi QC & kirim unit / refund
      if (resolutionAction === 'REPLACEMENT' || resolutionAction === 'REFUND') {
        const isPackageArrived = Boolean(
          existing.packageReceivedAt ||
          existing.storeResponse?.includes('[Paket Fisik Tiba di Cabang]')
        )

        if (existing.returnTrackingNumber && !isPackageArrived) {
          return NextResponse.json(
            {
              error:
                'Paket fisik barang retur dari pembeli belum dikonfirmasi tiba di toko cabang. Anda wajib mengonfirmasi penerimaan fisik dan melakukan QC terlebih dahulu.',
            },
            { status: 400 }
          )
        }
      }

      // After Sales, Superadmin, and Admin handle functional resolution actions
      if (resolutionAction === 'REPLACEMENT') {
        // 0. Validasi & Pengurangan Stok Unit Pengganti di Toko Cabang Pengirim
        const productItems = (existing.order?.items || []).filter(
          (item) => item.productId && item.product
        )

        for (const item of productItems) {
          const requiredQty = item.quantity || 1
          const prod = item.product!
          let hasStock = false
          let currentStock = 0
          let targetVariantName = item.variantName || 'Standar'

          if (
            item.variantId &&
            Array.isArray(prod.variants) &&
            prod.variants.length > 0
          ) {
            const matchedVariant = prod.variants.find(
              (v) => v.id === item.variantId
            )
            if (matchedVariant) {
              currentStock = matchedVariant.stock
              targetVariantName = matchedVariant.name || targetVariantName
              hasStock = matchedVariant.stock >= requiredQty
            } else {
              currentStock = prod.stock
              hasStock = prod.stock >= requiredQty
            }
          } else {
            currentStock = prod.stock
            hasStock = prod.stock >= requiredQty
          }

          if (!hasStock) {
            return NextResponse.json(
              {
                error: `Stok unit baru "${prod.name} (${targetVariantName})" di toko ${existing.order.store?.name || 'cabang'} tidak mencukupi (Sisa stok: ${currentStock} unit, dibutuhkan: ${requiredQty} unit). Harap lakukan restock unit toko terlebih dahulu atau alihkan ke opsi Retur & Refund.`,
              },
              { status: 400 }
            )
          }

          // Kurangi stok varian jika ada
          if (item.variantId) {
            await prisma.productVariant
              .update({
                where: { id: item.variantId },
                data: { stock: { decrement: requiredQty } },
              })
              .catch((err) => {
                console.warn('Non-fatal variant stock decrement error:', err)
              })
          }

          // Kurangi stok master produk
          await prisma.product.update({
            where: { id: prod.id },
            data: { stock: { decrement: requiredQty } },
          })

          // Catat mutasi inventori di AuditLog
          await prisma.auditLog
            .create({
              data: {
                userId: session.user.id,
                action: 'INVENTORY_DEDUCT_REPLACEMENT',
                entityType: 'ORDER',
                entityId: existing.orderId,
                details: {
                  orderNumber: existing.order.orderNumber,
                  returnId: existing.id,
                  storeId: existing.order.storeId,
                  storeName: existing.order.store?.name,
                  productId: prod.id,
                  productName: prod.name,
                  variantId: item.variantId,
                  variantName: targetVariantName,
                  quantityDeducted: requiredQty,
                  previousStock: currentStock,
                  remainingStock: currentStock - requiredQty,
                  reason:
                    'Pengeluaran unit baru pengganti retur garansi 30 hari',
                },
              },
            })
            .catch(() => {})
        }

        // Notifikasi ke staf/admin toko cabang tentang pemotongan stok untuk retur garansi
        if (existing.order?.storeId) {
          const storeStaff = await prisma.user.findMany({
            where: {
              storeId: existing.order.storeId,
              role: { in: ['STORE_ADMIN', 'STORE_SALES'] },
              isActive: true,
            },
            select: { id: true },
          })

          for (const staff of storeStaff) {
            await prisma.notification
              .create({
                data: {
                  userId: staff.id,
                  type: 'ORDER_STATUS_CHANGED',
                  title: 'Stok Berkurang: Unit Pengganti Retur Diproses',
                  message: `Admin After Sales telah memproses unit baru pengganti untuk pesanan #${existing.order.orderNumber}. 1 unit telah otomatis dipotong dari inventori toko cabang.`,
                  link: `/dashboard/admin/orders?search=${existing.order.orderNumber}`,
                },
              })
              .catch(() => {})
          }
        }

        // 1. Ganti Unit Baru: Mulai dari awal pengiriman lagi dan bisa dilacak via Biteship
        const selectedCourier = (
          replacementCourier ||
          returnCourier ||
          'JNE'
        ).toUpperCase()
        const isGojek = selectedCourier.includes('GOJEK')
        const courierCode: 'GOJEK' | 'JNE' = isGojek ? 'GOJEK' : 'JNE'
        const courierService = selectedCourier.includes('YES')
          ? 'YES'
          : isGojek
            ? 'INSTANT'
            : 'REG'

        let tracking = (
          replacementTrackingNumber ||
          returnTrackingNumber ||
          ''
        ).trim()

        // Jika tracking kosong atau auto, booking otomatis via Biteship API
        if (!tracking || tracking === 'AUTO' || tracking.startsWith('⚡')) {
          if (existing.order) {
            const originStore = {
              name: existing.order.store?.name || 'Toko Gadget Pusat',
              companyName:
                existing.order.store?.companyName ||
                existing.order.store?.name ||
                'PT Gadget Jaya Sentosa',
              address:
                existing.order.store?.address || 'ITC Roxy Mas Lt. 2 No. 15',
              city: existing.order.store?.city || 'Jakarta',
              phone: existing.order.store?.phone || '081234567890',
              latitude: existing.order.store?.latitude,
              longitude: existing.order.store?.longitude,
              postalCode: existing.order.store?.postalCode,
            }

            const defaultAddress = existing.order.user?.addresses?.[0]
            const destinationCustomer = {
              name: existing.order.user?.name || 'Customer',
              address:
                defaultAddress?.fullAddress ||
                existing.order.user?.address ||
                'Alamat Lengkap Customer Belum Terisi',
              city:
                defaultAddress?.city || existing.order.user?.city || 'Jakarta',
              province:
                defaultAddress?.province ||
                existing.order.user?.province ||
                'DKI Jakarta',
              postalCode:
                defaultAddress?.postalCode || existing.order.user?.postalCode,
              phone:
                defaultAddress?.phone ||
                existing.order.user?.phone ||
                '081298765432',
              latitude: defaultAddress?.latitude,
              longitude: defaultAddress?.longitude,
            }

            const items =
              existing.order.items && existing.order.items.length > 0
                ? existing.order.items.map((item) => ({
                    name:
                      item.product?.name ||
                      item.rentalItem?.name ||
                      item.service?.name ||
                      'Gadget Replacement Unit',
                    quantity: item.quantity,
                    weightGram: item.product?.weightGram || 500,
                    price: item.price,
                  }))
                : [
                    {
                      name: 'Unit Baru Pengganti (Garansi 30 Hari)',
                      quantity: 1,
                      weightGram: 500,
                      price: existing.order.total,
                    },
                  ]

            try {
              bookedShippingRecord = await bookShippingPickup({
                orderId: existing.order.id,
                orderNumber: existing.order.orderNumber,
                courierCode,
                courierService,
                originStore,
                destinationCustomer,
                items,
              })
              tracking = bookedShippingRecord.trackingNumber
            } catch (bookingErr) {
              console.error('Biteship booking error:', bookingErr)
              const { generateWaybill } =
                await import('@/lib/shipping/biteship-client')
              tracking = generateWaybill(courierCode)
            }
          }
        }

        updateData.status = 'COMPLETED'
        updateData.type = 'REPLACEMENT'
        updateData.returnCourier = courierCode
        updateData.returnTrackingNumber = tracking
        updateData.storeResponse =
          storeResponse ||
          `[GANTI_UNIT_BARU] Unit baru pengganti telah diproses otomatis via Biteship (${courierCode} ${courierService}) dengan nomor resi ${tracking}. Garansi 30 hari aktif kembali untuk unit baru ini.`
        updateData.resolvedAt = new Date()

        // Update order status back to SHIPPED with new tracking number so customer tracks like a normal order
        if (existing.orderId) {
          await prisma.order.update({
            where: { id: existing.orderId },
            data: {
              status: 'SHIPPED',
              courierCode,
              courierService,
              trackingNumber: tracking,
              customerConfirmedAt: null,
              completedAt: null,
            },
          })
        }

        // Notify customer
        await prisma.notification.create({
          data: {
            userId: existing.userId,
            type: 'ORDER_SHIPPED',
            title: 'Unit Baru Pengganti Telah Dikirim',
            message: `Unit baru pengganti pesanan #${existing.order.orderNumber} telah dikirim via Biteship (${courierCode} ${courierService}) dengan resi ${tracking}. Lacak pengiriman Anda sekarang.`,
            link: `/dashboard/customer/orders/${existing.orderId}`,
          },
        })
      } else if (resolutionAction === 'REFUND') {
        // 2. Kembalikan Duit: Otomatis transfer dana bersih balik ke customer (setelah potong ongkir, pajak, operasional)
        const { calculateNetRefundAmount } =
          await import('@/lib/returns/refund-calculator')
        const refundCalc = calculateNetRefundAmount({
          total: existing.order.total,
          subtotal: existing.order.subtotal,
          shippingCost: existing.order.shippingCost,
          tax: existing.order.tax,
          insuranceFee: existing.order.insuranceFee,
        })
        const refundAmount =
          existing.refundAmount && existing.refundAmount < existing.order.total
            ? existing.refundAmount
            : refundCalc.netRefundAmount
        updateData.refundAmount = refundAmount

        // Trigger Midtrans refund helper for escrow reversal
        try {
          const { refundMidtransTransaction } = await import('@/lib/midtrans')
          await refundMidtransTransaction(
            existing.order.orderNumber,
            existing.id,
            refundAmount,
            storeResponse || 'Garansi 30 Hari Pengembalian Dana'
          )
        } catch (midtransErr) {
          console.warn('[MIDTRANS_REFUND_FAIL]:', midtransErr)
        }

        // If customer provided bank info, trigger / simulate Midtrans Iris payout
        if (existing.bankAccountNumber && existing.bankName) {
          try {
            const { createIrisPayout } = await import('@/lib/midtrans-iris')
            await createIrisPayout({
              referenceNo: `REFUND-${existing.order.orderNumber}`,
              beneficiaryName:
                existing.bankAccountName || existing.order.orderNumber,
              beneficiaryAccount: existing.bankAccountNumber,
              beneficiaryBank: existing.bankName,
              amount: refundAmount,
              notes: `Refund Pesanan #${existing.order.orderNumber}`,
            })
          } catch (irisErr) {
            console.warn('[MIDTRANS_IRIS_REFUND_FAIL]:', irisErr)
          }
        }

        updateData.status = 'COMPLETED'
        updateData.type = 'REFUND'
        updateData.storeResponse =
          storeResponse ||
          `[REFUND_MIDTRANS] Pengembalian dana tertahan sebesar Rp ${Math.round(
            refundAmount
          ).toLocaleString(
            'id-ID'
          )} telah berhasil ditransfer balik via Midtrans ke rekening tujuan.`
        updateData.resolvedAt = new Date()

        // Update order status to RETURNED (reversing escrow completely)
        if (existing.orderId) {
          await prisma.order.update({
            where: { id: existing.orderId },
            data: { status: 'RETURNED' },
          })

          // Update payment if exists
          if (existing.order.payment) {
            await prisma.payment.update({
              where: { id: existing.order.payment.id },
              data: {
                notes: `Refund Midtrans diproses pada ${new Date().toLocaleString('id-ID')}`,
              },
            })
          }
        }

        // Send refund proof email
        try {
          const { sendOrderRefundedEmail } = await import('@/lib/email')
          await sendOrderRefundedEmail({
            orderId: existing.orderId,
            refundAmount,
            reason: existing.reason,
            returnCourier: existing.returnCourier ?? undefined,
            returnTrackingNumber: existing.returnTrackingNumber ?? undefined,
            bankName: existing.bankName || 'Midtrans / Rekening Asal',
            bankAccountNumber: existing.bankAccountNumber || '-',
            bankAccountHolder:
              existing.bankAccountName || existing.order.orderNumber,
          })
        } catch (emailErr) {
          console.error('Failed to send refund email:', emailErr)
        }

        // Notify customer
        await prisma.notification.create({
          data: {
            userId: existing.userId,
            type: 'ORDER_STATUS_CHANGED',
            title: 'Pengembalian Dana Berhasil Diproses',
            message: `Dana tertahan pesanan #${existing.order.orderNumber} sebesar Rp ${Math.round(
              refundAmount
            ).toLocaleString(
              'id-ID'
            )} telah ditransfer kembali ke rekening Anda.`,
            link: `/dashboard/customer/orders/${existing.orderId}`,
          },
        })
      } else if (resolutionAction === 'REPAIR_IN_PROGRESS') {
        // 3a. Perbaiki Barang - Tahap 1: Tunggu barang diperbaiki sebelum dikirim
        const estDays = estimatedRepairDays || '1 - 2 Hari Kerja'
        const notes = repairNotes ? ` (${repairNotes})` : ''

        updateData.status = 'IN_REVIEW'
        updateData.storeResponse =
          storeResponse ||
          `[SEDANG_DIPERBAIKI] Unit sedang dalam proses perbaikan/servis oleh tim teknisi resmi. Estimasi pengerjaan: ${estDays}.${notes} Unit akan diuji fungsi 100% sebelum dikirimkan kembali.`

        // Notify customer
        await prisma.notification.create({
          data: {
            userId: existing.userId,
            type: 'ORDER_STATUS_CHANGED',
            title: 'Unit Masuk Tahap Perbaikan Teknisi',
            message: `Unit pesanan #${existing.order.orderNumber} sedang dalam tahap perbaikan oleh teknisi toko (Estimasi: ${estDays}).`,
            link: `/dashboard/customer/orders/${existing.orderId}`,
          },
        })
      } else if (resolutionAction === 'REPAIR_COMPLETED') {
        // 3b. Perbaiki Barang - Tahap 2: Selesai perbaikan & dikirim balik via Biteship
        const selectedCourier = (
          replacementCourier ||
          returnCourier ||
          'JNE'
        ).toUpperCase()
        const isGojek = selectedCourier.includes('GOJEK')
        const courierCode: 'GOJEK' | 'JNE' = isGojek ? 'GOJEK' : 'JNE'
        const courierService = selectedCourier.includes('YES')
          ? 'YES'
          : isGojek
            ? 'INSTANT'
            : 'REG'

        let tracking = (
          replacementTrackingNumber ||
          returnTrackingNumber ||
          ''
        ).trim()

        if (!tracking || tracking === 'AUTO' || tracking.startsWith('⚡')) {
          if (existing.order) {
            const originStore = {
              name: existing.order.store?.name || 'Toko Gadget Pusat',
              companyName:
                existing.order.store?.companyName ||
                existing.order.store?.name ||
                'PT Gadget Jaya Sentosa',
              address:
                existing.order.store?.address || 'ITC Roxy Mas Lt. 2 No. 15',
              city: existing.order.store?.city || 'Jakarta',
              phone: existing.order.store?.phone || '081234567890',
              latitude: existing.order.store?.latitude,
              longitude: existing.order.store?.longitude,
              postalCode: existing.order.store?.postalCode,
            }

            const defaultAddress = existing.order.user?.addresses?.[0]
            const destinationCustomer = {
              name: existing.order.user?.name || 'Customer',
              address:
                defaultAddress?.fullAddress ||
                existing.order.user?.address ||
                'Alamat Lengkap Customer Belum Terisi',
              city:
                defaultAddress?.city || existing.order.user?.city || 'Jakarta',
              province:
                defaultAddress?.province ||
                existing.order.user?.province ||
                'DKI Jakarta',
              postalCode:
                defaultAddress?.postalCode || existing.order.user?.postalCode,
              phone:
                defaultAddress?.phone ||
                existing.order.user?.phone ||
                '081298765432',
              latitude: defaultAddress?.latitude,
              longitude: defaultAddress?.longitude,
            }

            const items =
              existing.order.items && existing.order.items.length > 0
                ? existing.order.items.map((item) => ({
                    name:
                      item.product?.name ||
                      item.rentalItem?.name ||
                      item.service?.name ||
                      'Gadget Hasil Servis Bergaransi',
                    quantity: item.quantity,
                    weightGram: item.product?.weightGram || 500,
                    price: item.price,
                  }))
                : [
                    {
                      name: 'Unit Gadget Hasil Servis Bergaransi',
                      quantity: 1,
                      weightGram: 500,
                      price: existing.order.total,
                    },
                  ]

            try {
              bookedShippingRecord = await bookShippingPickup({
                orderId: existing.order.id,
                orderNumber: existing.order.orderNumber,
                courierCode,
                courierService,
                originStore,
                destinationCustomer,
                items,
              })
              tracking = bookedShippingRecord.trackingNumber
            } catch (bookingErr) {
              console.error('Biteship booking error in repair:', bookingErr)
              const { generateWaybill } =
                await import('@/lib/shipping/biteship-client')
              tracking = generateWaybill(courierCode)
            }
          }
        }

        updateData.status = 'COMPLETED'
        updateData.returnCourier = courierCode
        updateData.returnTrackingNumber = tracking
        updateData.storeResponse =
          storeResponse ||
          `[PERBAIKAN_SELESAI] Perbaikan unit telah selesai 100% dan lulus uji QC teknisi. Unit telah dikirim kembali via Biteship (${courierCode} ${courierService}) dengan nomor resi ${tracking}.`
        updateData.resolvedAt = new Date()

        // Reship order with repaired unit tracking
        if (existing.orderId) {
          await prisma.order.update({
            where: { id: existing.orderId },
            data: {
              status: 'SHIPPED',
              courierCode,
              courierService,
              trackingNumber: tracking,
              customerConfirmedAt: null,
              completedAt: null,
            },
          })
        }

        // Notify customer
        await prisma.notification.create({
          data: {
            userId: existing.userId,
            type: 'ORDER_SHIPPED',
            title: 'Unit Selesai Diperbaiki & Sedang Dikirim',
            message: `Perbaikan unit pesanan #${existing.order.orderNumber} telah selesai! Unit dikirim kembali via Biteship (${courierCode} ${courierService}) dengan resi ${tracking}. Lacak pengiriman Anda sekarang.`,
            link: `/dashboard/customer/orders/${existing.orderId}`,
          },
        })
      } else {
        // Generic status update (APPROVE, REJECT, RESPONSE)
        if (status) updateData.status = status
        if (storeResponse !== undefined)
          updateData.storeResponse = storeResponse
        if (returnCourier !== undefined)
          updateData.returnCourier = returnCourier
        if (returnTrackingNumber !== undefined)
          updateData.returnTrackingNumber = returnTrackingNumber
        if (
          status === 'COMPLETED' ||
          status === 'APPROVED' ||
          status === 'REJECTED'
        ) {
          updateData.resolvedAt = new Date()
        }

        // If completed as refund by default
        if (
          status === 'COMPLETED' &&
          existing.orderId &&
          existing.type === 'REFUND'
        ) {
          await prisma.order.update({
            where: { id: existing.orderId },
            data: { status: 'RETURNED' },
          })

          try {
            const { sendOrderRefundedEmail } = await import('@/lib/email')
            await sendOrderRefundedEmail({
              orderId: existing.orderId,
              refundAmount: existing.refundAmount || undefined,
              reason: existing.reason,
              returnCourier: existing.returnCourier || returnCourier,
              returnTrackingNumber:
                existing.returnTrackingNumber || returnTrackingNumber,
              bankName: existing.bankName || undefined,
              bankAccountNumber: existing.bankAccountNumber || undefined,
              bankAccountHolder: existing.bankAccountName || undefined,
            })
          } catch (emailErr) {
            console.error('Failed to send refund email:', emailErr)
          }
        }
      }
    }

    const updated = await prisma.returnRequest.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      message: 'Pengajuan pengembalian berhasil diperbarui',
      data: updated,
      booking: bookedShippingRecord,
    })
  } catch (error) {
    console.error('Error updating return request:', error)
    return NextResponse.json(
      { error: 'Gagal memperbarui pengajuan pengembalian' },
      { status: 500 }
    )
  }
}

export const PATCH = PUT
