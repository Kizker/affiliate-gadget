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
                product: true,
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

    // Access check: Customer can only view own, Store Admin can view store's, Admin/Superadmin can view all
    if (
      session.user.role === 'CUSTOMER' &&
      returnRequest.userId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
                product: true,
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {}
    let bookedShippingRecord: any = null

    // Customer can update return tracking number
    if (session.user.role === 'CUSTOMER') {
      if (existing.userId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      if (returnCourier !== undefined) updateData.returnCourier = returnCourier
      if (returnTrackingNumber !== undefined)
        updateData.returnTrackingNumber = returnTrackingNumber
    } else {
      // Admins & Store Admins handle functional resolution actions
      if (resolutionAction === 'REPLACEMENT') {
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
        // 2. Kembalikan Duit: Otomatis transfer dari Midtrans (dana tertahan) balik ke customer
        const refundAmount = existing.refundAmount || existing.order.total

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
