import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { calculateNetRefundAmount } from '@/lib/returns/refund-calculator'
import {
  doesReturnMatchOrderItem,
  extractReturnedQuantityFromDescription,
  getRemainingReturnableQuantityForItem,
} from '@/lib/order-return-utils'

// GET - List return requests
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const orderId = searchParams.get('orderId')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}

    // Role-based access control
    if (session.user.role === 'CUSTOMER') {
      where.userId = session.user.id
    } else if (session.user.role === 'AFTER_SALES') {
      const group = await prisma.storeGroup.findFirst({
        where: { afterSalesUserId: session.user.id },
        include: { stores: { select: { id: true } } },
      })
      const storeIds = group?.stores.map((s) => s.id) || []
      where.OR = [
        { storeId: { in: storeIds } },
        { order: { storeId: { in: storeIds } } },
      ]
    } else if (
      session.user.role === 'STORE_ADMIN' ||
      session.user.role === 'STORE_SALES'
    ) {
      let userStoreId = (session.user as any).storeId
      if (!userStoreId && session.user.id) {
        const u = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { storeId: true },
        })
        userStoreId = u?.storeId || null
      }
      if (!userStoreId && session.user.email) {
        const s = await prisma.store.findFirst({
          where: {
            OR: [
              { email: session.user.email },
              { users: { some: { id: session.user.id } } },
            ],
          },
          select: { id: true },
        })
        userStoreId = s?.id || null
      }

      if (userStoreId) {
        where.OR = [
          { storeId: userStoreId },
          { order: { storeId: userStoreId } },
          { order: { items: { some: { product: { storeId: userStoreId } } } } },
        ]
      } else {
        return NextResponse.json({ success: true, data: [] })
      }
    } else if (
      session.user.role === 'ADMIN' ||
      session.user.role === 'SUPER_ADMIN'
    ) {
      // Platform Admin and Superadmin see all requests
    }

    if (status) {
      where.status = status
    }

    if (orderId) {
      where.orderId = orderId
    }

    const returns = await prisma.returnRequest.findMany({
      where,
      include: {
        order: {
          select: {
            orderNumber: true,
            status: true,
            total: true,
            courierCode: true,
            courierService: true,
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    brand: true,
                    images: true,
                    stock: true,
                    variants: {
                      select: {
                        id: true,
                        name: true,
                        stock: true,
                      },
                    },
                  },
                },
                rentalItem: {
                  select: {
                    id: true,
                    name: true,
                    images: true,
                  },
                },
                service: { select: { id: true, name: true } },
              },
            },
            store: {
              select: {
                id: true,
                name: true,
                companyName: true,
                city: true,
                address: true,
                phone: true,
                groupId: true,
                group: {
                  select: {
                    id: true,
                    name: true,
                    afterSalesUserId: true,
                    afterSalesUser: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Query data QC & kedatangan fisik langsung dari PostgreSQL table return_requests untuk memastikan data selalu ada
    let rawQcData: any[] = []
    try {
      rawQcData = await prisma.$queryRawUnsafe(
        `SELECT id, "packageReceivedAt", "qcStatus", "qcNotes" FROM "return_requests"`
      )
    } catch {
      rawQcData = []
    }

    const qcMap = new Map(rawQcData.map((q: any) => [q.id, q]))

    const enrichedReturns = returns.map((r: any) => {
      const qc = qcMap.get(r.id)
      const hasArrivalMarker = r.storeResponse?.includes(
        '[Paket Fisik Tiba di Cabang]'
      )

      const effectivePackageReceivedAt = r.packageReceivedAt
        ? new Date(r.packageReceivedAt).toISOString()
        : qc?.packageReceivedAt
          ? new Date(qc.packageReceivedAt).toISOString()
          : hasArrivalMarker
            ? r.updatedAt.toISOString()
            : null

      const effectiveQcStatus =
        r.qcStatus || qc?.qcStatus || (hasArrivalMarker ? 'IN_QC' : null)

      const effectiveQcNotes =
        r.qcNotes ||
        qc?.qcNotes ||
        (hasArrivalMarker
          ? r.storeResponse?.match(/Catatan QC:\s*([^\n]+)/)?.[1]?.trim() ||
            null
          : null)

      const assignedGroup = r.order?.store?.group
      const hasAssignedAfterSales = Boolean(assignedGroup?.afterSalesUserId)
      const assignedAfterSalesName = assignedGroup?.afterSalesUser?.name || null
      const assignedGroupName = assignedGroup?.name || null
      const isSelfManaged = !hasAssignedAfterSales

      // Filter order.items agar kartu retur di After Sales & Superadmin HANYA menampilkan barang yang diajukan retur
      const allOrderItems = Array.isArray(r.order?.items) ? r.order.items : []
      let filteredOrderItems = allOrderItems
      let effectiveReturnedTotal = r.order?.total || 0

      if (allOrderItems.length > 0) {
        const matchedItems = allOrderItems.filter((item: any) =>
          doesReturnMatchOrderItem(r, item, allOrderItems.length)
        )
        const targetItems =
          matchedItems.length > 0 ? matchedItems : [allOrderItems[0]]

        filteredOrderItems = targetItems.map((item: any) => {
          const retQty = extractReturnedQuantityFromDescription(
            r.description,
            item.quantity || 1
          )
          const safeQty = Math.min(Math.max(1, retQty), item.quantity || 1)
          return {
            ...item,
            quantity: safeQty,
          }
        })

        // Jika dalam pesanan terdapat beberapa item atau kuantitas berbeda, sesuaikan nominal transaksi ke barang yang diretur
        if (
          allOrderItems.length > 1 ||
          filteredOrderItems[0]?.quantity !== allOrderItems[0]?.quantity
        ) {
          const calcUnitSum = filteredOrderItems.reduce(
            (sum: number, it: any) =>
              sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
            0
          )
          if (calcUnitSum > 0) {
            effectiveReturnedTotal = calcUnitSum
          }
        }
      }

      const isReturnedToAfterSales = Boolean(
        r.storeResponse?.includes('[Dikembalikan Superadmin ke After Sales]')
      )
      const effectiveStatus = isReturnedToAfterSales ? 'IN_REVIEW' : r.status

      return {
        ...r,
        status: effectiveStatus,
        order: r.order
          ? {
              ...r.order,
              items: filteredOrderItems,
              total: effectiveReturnedTotal,
              originalOrderTotal: r.order.total,
            }
          : r.order,
        hasAssignedAfterSales,
        assignedAfterSalesName,
        assignedGroupName,
        isSelfManaged,
        packageReceivedAt: effectivePackageReceivedAt,
        qcStatus: effectiveQcStatus,
        qcNotes: effectiveQcNotes,
      }
    })

    return NextResponse.json({ success: true, data: enrichedReturns })
  } catch (error) {
    console.error('Error fetching return requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch return requests' },
      { status: 500 }
    )
  }
}

// POST - Create new return/refund request
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      orderId,
      orderItemId,
      returnQuantity,
      itemTotalAmount,
      type = 'REFUND', // 'REFUND' | 'REPLACEMENT'
      reason,
      reasonLabel,
      description,
      images = [],
      videoUrl,
      bankName,
      bankAccountNumber,
      bankAccountName,
    } = body

    if (!orderId || !reason || !description) {
      return NextResponse.json(
        { error: 'Order ID, alasan, dan rincian kendala wajib diisi' },
        { status: 400 }
      )
    }

    if (
      type === 'REFUND' &&
      (!bankName || !bankAccountNumber || !bankAccountName)
    ) {
      return NextResponse.json(
        {
          error:
            'Informasi rekening bank (Nama Bank, Nomor Rekening, Atas Nama) wajib diisi untuk pengembalian dana.',
        },
        { status: 400 }
      )
    }

    // Verify order exists and belongs to user
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true } },
            rentalItem: { select: { id: true, name: true } },
            service: { select: { id: true, name: true } },
          },
        },
        store: true,
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Pesanan tidak ditemukan' },
        { status: 404 }
      )
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json(
        {
          error:
            'Anda hanya dapat mengajukan pengembalian untuk pesanan Anda sendiri',
        },
        { status: 403 }
      )
    }

    // Check if order has been received / confirmed by customer
    const isOrderReceived =
      order.status === 'COMPLETED' ||
      order.status === 'COMPLAINED' ||
      Boolean(order.customerConfirmedAt) ||
      Boolean(order.completedAt)

    if (!isOrderReceived) {
      return NextResponse.json(
        {
          error:
            'Pengajuan pengembalian hanya dapat dilakukan untuk pesanan yang telah selesai diterima',
        },
        { status: 400 }
      )
    }

    // Check if order was manually completed (which relinquishes warranty and releases escrow)
    if (order.status === 'COMPLETED' && order.completedAt) {
      return NextResponse.json(
        {
          error:
            'Pesanan telah diselesaikan dan garansi toko 30 hari telah berakhir.',
        },
        { status: 400 }
      )
    }

    // Check 30-day warranty window
    let isWarrantyOver = false
    if (order.warrantyExpiryDate) {
      isWarrantyOver = new Date(order.warrantyExpiryDate).getTime() < Date.now()
    } else {
      const completedDate =
        order.completedAt ||
        order.customerConfirmedAt ||
        order.updatedAt ||
        order.createdAt
      const daysSinceCompleted = Math.floor(
        (Date.now() - new Date(completedDate).getTime()) / (1000 * 60 * 60 * 24)
      )
      isWarrantyOver = daysSinceCompleted > 30
    }

    if (isWarrantyOver) {
      return NextResponse.json(
        {
          error:
            'Batas waktu pengajuan pengembalian (30 hari garansi ganti unit) telah berakhir.',
        },
        { status: 400 }
      )
    }

    // Check existing returns for this order
    const existingReturns = await prisma.returnRequest.findMany({
      where: {
        orderId,
      },
    })

    const targetOrderItem = orderItemId
      ? order.items.find((it) => it.id === orderItemId)
      : order.items.find((it) =>
          doesReturnMatchOrderItem({ description }, it, order.items.length)
        ) || order.items[0]

    if (targetOrderItem) {
      const remainingQty = getRemainingReturnableQuantityForItem(
        targetOrderItem,
        existingReturns,
        order
      )

      if (remainingQty <= 0) {
        const isRejected = existingReturns.some(
          (r) =>
            r.status === 'REJECTED' &&
            doesReturnMatchOrderItem(r, targetOrderItem, order.items.length)
        )
        if (isRejected) {
          return NextResponse.json(
            {
              error:
                'Pengajuan retur untuk produk ini telah ditolak sebelumnya dan tidak dapat diajukan kembali.',
            },
            { status: 400 }
          )
        }

        const isActive = existingReturns.some(
          (r) =>
            ['PENDING', 'IN_REVIEW', 'APPROVED'].includes(r.status) &&
            doesReturnMatchOrderItem(r, targetOrderItem, order.items.length)
        )
        if (isActive) {
          return NextResponse.json(
            {
              error:
                'Sudah ada pengajuan pengembalian aktif untuk produk ini. Harap tunggu verifikasi terlebih dahulu.',
            },
            { status: 400 }
          )
        }

        return NextResponse.json(
          {
            error: 'Semua unit untuk produk ini sudah diajukan pengembalian.',
          },
          { status: 400 }
        )
      }

      if (returnQuantity && Number(returnQuantity) > remainingQty) {
        return NextResponse.json(
          {
            error: `Jumlah unit yang diajukan (${returnQuantity}) melebihi sisa unit yang dapat diretur (${remainingQty} unit).`,
          },
          { status: 400 }
        )
      }
    }

    // Pastikan description menyertakan informasi unit jika diajukan pada multi-item
    let finalDescription = description
    if (
      targetOrderItem &&
      !finalDescription.includes('[Unit yang Diretur:') &&
      !finalDescription.includes('ItemID:')
    ) {
      const itemName =
        targetOrderItem.product?.name ||
        targetOrderItem.rentalItem?.name ||
        targetOrderItem.service?.name ||
        'Gadget'
      const variantPart = targetOrderItem.variantName
        ? ` - Varian: ${targetOrderItem.variantName}`
        : ''
      const qtyToRet = Math.max(
        1,
        Math.min(
          Number(returnQuantity) || targetOrderItem.quantity || 1,
          targetOrderItem.quantity || 1
        )
      )
      finalDescription = `[Unit yang Diretur: ${itemName}${variantPart} - ${qtyToRet} unit @ Rp ${targetOrderItem.price.toLocaleString('id-ID')} | ItemID:${targetOrderItem.id} | Qty:${qtyToRet}]\n\n${finalDescription}`
    }

    const effectiveReturnQty = extractReturnedQuantityFromDescription(
      finalDescription,
      Number(returnQuantity) || targetOrderItem?.quantity || 1
    )

    const effectiveItemTotal =
      itemTotalAmount && Number(itemTotalAmount) > 0
        ? Number(itemTotalAmount)
        : targetOrderItem
          ? Number(targetOrderItem.price) * Math.max(1, effectiveReturnQty)
          : order.total

    // Hitung nominal pengembalian dana berdasarkan unit yang diretur
    const isPartialOrder =
      order.items.length > 1 ||
      (targetOrderItem && effectiveReturnQty < (targetOrderItem.quantity || 1))

    const refundCalc =
      type === 'REFUND'
        ? isPartialOrder
          ? {
              originalTotal: effectiveItemTotal,
              subtotal: effectiveItemTotal,
              shippingCost: 0,
              taxDeduction: 0,
              insuranceFee: 0,
              operationalFee: 0,
              totalDeductions: 0,
              netRefundAmount: effectiveItemTotal,
              deductionBreakdown: {
                shippingCost: 0,
                tax: 0,
                insurance: 0,
                operational: 0,
              },
            }
          : calculateNetRefundAmount({
              total: order.total,
              subtotal: order.subtotal,
              shippingCost: order.shippingCost,
              tax: order.tax,
              insuranceFee: order.insuranceFee,
            })
        : null

    const initialStoreResponse = refundCalc
      ? isPartialOrder
        ? `[ESTIMASI_REFUND_PARSIAL] Total Nilai Unit Diretur: Rp ${effectiveItemTotal.toLocaleString('id-ID')} (${effectiveReturnQty} unit @ Rp ${(targetOrderItem?.price || 0).toLocaleString('id-ID')}). Pengembalian Bersih: Rp ${effectiveItemTotal.toLocaleString('id-ID')}.`
        : `[ESTIMASI_REFUND] Total: Rp ${refundCalc.originalTotal.toLocaleString('id-ID')}. Potongan: Ongkir Rp ${refundCalc.shippingCost.toLocaleString('id-ID')} + Pajak Rp ${refundCalc.taxDeduction.toLocaleString('id-ID')} + Asuransi Rp ${refundCalc.insuranceFee.toLocaleString('id-ID')} + Operasional & QC Rp ${refundCalc.operationalFee.toLocaleString('id-ID')}. Pengembalian Bersih: Rp ${refundCalc.netRefundAmount.toLocaleString('id-ID')}.`
      : null

    // Create the ReturnRequest in a transaction
    const [returnRequest] = await prisma.$transaction([
      prisma.returnRequest.create({
        data: {
          orderId,
          userId: session.user.id,
          storeId: order.storeId,
          type: type === 'REPLACEMENT' ? 'REPLACEMENT' : 'REFUND',
          reason,
          reasonLabel: reasonLabel || reason,
          description: finalDescription,
          images: Array.isArray(images) ? images : [],
          videoUrl: videoUrl || null,
          bankName: type === 'REFUND' ? bankName : null,
          bankAccountNumber: type === 'REFUND' ? bankAccountNumber : null,
          bankAccountName: type === 'REFUND' ? bankAccountName : null,
          refundAmount: refundCalc?.netRefundAmount ?? null,
          storeResponse: initialStoreResponse,
          status: 'PENDING',
        },
        include: {
          order: {
            select: {
              orderNumber: true,
              total: true,
            },
          },
        },
      }),
      // Create notification for customer
      prisma.notification.create({
        data: {
          userId: session.user.id,
          type: 'NEW_COMPLAINT',
          title: 'Pengajuan Pengembalian Berhasil Dikirim',
          message: `Pengajuan pengembalian untuk pesanan #${order.orderNumber} berhasil dikirim dan sedang menunggu verifikasi cabang toko.`,
          link: `/dashboard/customer/orders/${order.id}`,
        },
      }),
    ])

    return NextResponse.json(
      {
        success: true,
        message: 'Pengajuan pengembalian berhasil dikirim.',
        data: returnRequest,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating return request:', error)
    return NextResponse.json(
      { error: error.message || 'Gagal mengajukan pengembalian' },
      { status: 500 }
    )
  }
}
