import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { isAdminStaffRole } from '@/lib/dashboard-utils'
import {
  getStoreWithdrawals,
  getTotalWithdrawn,
} from '@/lib/store-withdrawal-store'
import { checkBankAccountCooldown } from '@/lib/withdrawal-security'
import {
  calculatePaymentGatewayFee,
  calculateMaintenanceFee,
} from '@/lib/tax/tax-engine'

// Status canonical transaksi aktif/berbayar
const ACTIVE_ORDER_STATUSES = [
  'PAID',
  'IN_PROGRESS',
  'SHIPPED',
  'COMPLETED',
  'COMPLAINED',
] as const

const ESCROW_STATUSES = [
  'PAID',
  'IN_PROGRESS',
  'SHIPPED',
  'COMPLAINED',
] as const

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || !isAdminStaffRole(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const isStoreAdmin = session.user.role === 'STORE_ADMIN'

    // Tentukan storeId yang menjadi target
    const rawStoreId = isStoreAdmin
      ? (session.user as { storeId?: string }).storeId
      : searchParams.get('storeId') || undefined

    const targetStoreId = rawStoreId === 'ALL' ? undefined : rawStoreId

    // Jika Superadmin tanpa query param storeId atau storeId === 'ALL', tampilkan konsolidasi seluruh cabang
    let targetStore: any = null
    const isConsolidated = !targetStoreId && session.user.role === 'SUPER_ADMIN'

    if (targetStoreId) {
      targetStore = await prisma.store.findUnique({
        where: { id: targetStoreId },
        include: {
          bankAccounts: {
            orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
          },
        },
      })
    } else if (isConsolidated) {
      targetStore = {
        id: 'ALL',
        name: 'Konsolidasi Seluruh Toko',
        companyName: 'PT Affiliate Gadget Nusantara (Holding Multi-PT)',
        taxId: '01.000.890.1-011.000',
        city: 'Nasional (Seluruh Cabang)',
        bankAccounts: [
          {
            id: 'bank-holding-01',
            storeId: 'ALL',
            bankName: 'Bank Mandiri (Pusat)',
            accountNumber: '1180099887766',
            accountName: 'PT Affiliate Gadget Nusantara',
            isPrimary: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      }
    }

    // Filter order berdasarkan storeId
    const storeWhereClause = targetStoreId
      ? {
          OR: [
            { storeId: targetStoreId },
            { items: { some: { product: { storeId: targetStoreId } } } },
          ],
        }
      : {}

    // Filter tanggal (Periode: hari ini, minggu ini, bulan ini, tahun ini, per bulan)
    // Filter tanggal (Periode: hari ini, minggu ini, bulan ini, tahun ini, per bulan)
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    let s: Date | undefined
    let e: Date | undefined

    if (startDateParam && endDateParam) {
      const parsedS = new Date(startDateParam)
      const parsedE = new Date(endDateParam)
      if (!isNaN(parsedS.getTime()) && !isNaN(parsedE.getTime())) {
        s = parsedS
        e = parsedE
      }
    }

    const dateWhereClause =
      s && e
        ? {
            OR: [
              // Pesanan yang dibuat pada rentang tanggal
              { createdAt: { gte: s, lte: e } },
              // Pesanan yang diselesaikan pada rentang tanggal
              { completedAt: { gte: s, lte: e } },
              // Fallback pesanan COMPLETED yang diupdate pada rentang tanggal
              {
                status: 'COMPLETED' as const,
                updatedAt: { gte: s, lte: e },
              },
            ],
          }
        : {}

    // Ambil semua order terkait yang relevan secara paralel
    const [orders, allStores, allTimeCompletedAgg] = await Promise.all([
      prisma.order.findMany({
        where: {
          status: { in: [...ACTIVE_ORDER_STATUSES] },
          ...storeWhereClause,
          ...dateWhereClause,
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          store: {
            select: {
              id: true,
              name: true,
              companyName: true,
            },
          },
          payment: {
            select: {
              method: true,
              status: true,
              notes: true,
            },
          },
          items: {
            select: {
              quantity: true,
              price: true,
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      session.user.role === 'SUPER_ADMIN'
        ? prisma.store.findMany({
            select: {
              id: true,
              name: true,
              companyName: true,
              city: true,
            },
            where: { isActive: true },
          })
        : Promise.resolve([]),
      // All-time completed orders for calculating true live withdrawable balance
      prisma.order.aggregate({
        where: {
          status: 'COMPLETED',
          ...storeWhereClause,
        },
        _sum: {
          subtotal: true,
          discountAmount: true,
          commissionAmount: true,
        },
      }),
    ])

    // Hitung Metrik Finansial
    let grossRevenue = 0
    let platformCommission = 0
    let completedNetRevenue = 0
    let escrowBalance = 0
    let totalUnitsSold = 0
    let totalVatOutput = 0
    const totalPph23Withheld = 0
    let totalVatOnCommission = 0
    let totalGatewayFees = 0
    const totalMaintenanceFees = 0

    // Rincian status kurir & pengiriman untuk Escrow
    const courierBreakdown = {
      paidCount: 0,
      inProgressCount: 0, // Toko packing / Menunggu kurir pickup
      shippedCount: 0, // Kurir sedang dalam perjalanan
      complainedCount: 0, // Ditahan karena komplain
      totalEscrowOrders: 0,
    }

    // List Mutasi Buku Kas
    interface MutationItem {
      id: string
      refNumber: string
      title: string
      subtitle: string
      type: 'INCOME' | 'EXPENSE' | 'ESCROW' | 'PAYOUT'
      category:
        | 'SALE'
        | 'COMMISSION'
        | 'WITHDRAWAL'
        | 'ESCROW'
        | 'PPH23'
        | 'GATEWAY'
        | 'MAINTENANCE'
      categoryLabel: string
      amount: number
      date: string
      rawDate: Date
      status: 'SETTLED' | 'PENDING' | 'SUCCESS'
      statusLabel: string
      orderStatus?: string
      courierInfo?: string
      trackingNumber?: string | null
    }

    const mutations: MutationItem[] = []

    orders.forEach((order) => {
      const orderTotal = order.total || 0
      const orderSubtotal = order.subtotal || 0
      const commission = order.commissionAmount || 0
      const discount = order.discountAmount || 0

      // Hak bersih toko = subtotal - diskon - komisi platform
      const netStoreAmount = Math.max(0, orderSubtotal - discount - commission)

      // Total unit
      const unitsCount = order.items.reduce(
        (sum, item) => sum + (item.quantity || 1),
        0
      )

      const customerName = order.user?.name || 'Customer'
      const firstProductName =
        order.items[0]?.product?.name || 'Gadget Smartphone'
      const additionalItems =
        order.items.length > 1 ? ` (+${order.items.length - 1} item)` : ''
      const productTitle = `Penjualan ${firstProductName}${additionalItems}`

      const courierDesc = [
        order.courierCode || 'Kurir',
        order.courierService || '',
        order.trackingNumber ? `(${order.trackingNumber})` : '',
      ]
        .filter(Boolean)
        .join(' ')

      const orderCompletionDate =
        order.completedAt ||
        (order.status === 'COMPLETED' ? order.updatedAt : null)

      const isCompletedInPeriod =
        order.status === 'COMPLETED' &&
        (!s ||
          !e ||
          (orderCompletionDate &&
            orderCompletionDate >= s &&
            orderCompletionDate <= e))

      const isCreatedInPeriod =
        !s || !e || (order.createdAt >= s && order.createdAt <= e)

      if (order.status === 'COMPLETED') {
        if (!isCompletedInPeriod) return

        grossRevenue += orderTotal
        platformCommission += commission
        totalVatOutput += order.tax || 0
        totalVatOnCommission += Math.round(commission * 0.11)
        totalUnitsSold += unitsCount
        completedNetRevenue += netStoreAmount

        const effectiveDate = orderCompletionDate || order.createdAt
        const formattedDate = new Intl.DateTimeFormat('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(effectiveDate))

        if (isConsolidated) {
          // Bagi Superadmin (Holding Platform):
          // 1. Komisi Platform adalah PEMASUKAN kas holding (INCOME)
          if (commission > 0) {
            mutations.push({
              id: `fee-${order.id}`,
              refNumber: `FEE-${order.orderNumber.replace(/^(ORD|SPR)-/, '')}`,
              title: `Bagi Hasil Platform (${order.commissionRate || 1.5}% Komisi)`,
              subtitle: `Diterima dari ${order.store?.companyName || order.store?.name || 'Toko Cabang'} (#${order.orderNumber})`,
              type: 'INCOME',
              category: 'COMMISSION',
              categoryLabel: 'Komisi Platform',
              amount: commission,
              date: formattedDate,
              rawDate: effectiveDate,
              status: 'SETTLED',
              statusLabel: 'Masuk Kas Platform',
              orderStatus: order.status,
            })
          }

          // 2. Penjualan Gadget adalah transaksi milik mitra toko cabang (bukan pendapatan superadmin)
          mutations.push({
            id: `sale-${order.id}`,
            refNumber: order.orderNumber,
            title: productTitle,
            subtitle: `Toko: ${order.store?.companyName || order.store?.name || 'Cabang'} · Customer: ${customerName} · Selesai`,
            type: 'ESCROW',
            category: 'SALE',
            categoryLabel: 'Penjualan Cabang',
            amount: netStoreAmount,
            date: formattedDate,
            rawDate: effectiveDate,
            status: 'SETTLED',
            statusLabel: 'Hak Toko Cabang',
            orderStatus: order.status,
            courierInfo: courierDesc,
            trackingNumber: order.trackingNumber,
          })

          // 3. Biaya Payment Gateway Transaksi Toko
          const gatewayFeeResult = calculatePaymentGatewayFee(
            order.payment?.method || 'MIDTRANS',
            orderTotal,
            order.payment?.notes
          )
          if (gatewayFeeResult.feeAmount > 0) {
            totalGatewayFees += gatewayFeeResult.feeAmount
            mutations.push({
              id: `gw-${order.id}`,
              refNumber: `GW-${order.orderNumber.replace(/^(ORD|SPR)-/, '')}`,
              title: `Biaya Gateway: ${gatewayFeeResult.methodLabel}`,
              subtitle: `${gatewayFeeResult.feeFormula} · Dipotong dari Toko (#${order.orderNumber})`,
              type: 'EXPENSE',
              category: 'GATEWAY',
              categoryLabel: 'Biaya Transaksi',
              amount: gatewayFeeResult.feeAmount,
              date: formattedDate,
              rawDate: effectiveDate,
              status: 'SETTLED',
              statusLabel: 'Dipotong dari Toko',
              orderStatus: order.status,
            })
          }
        } else {
          // Bagi Toko Cabang (Store Admin):
          // 1. Mutasi Penjualan Masuk Saldo Toko (INCOME)
          mutations.push({
            id: `sale-${order.id}`,
            refNumber: order.orderNumber,
            title: productTitle,
            subtitle: `Customer: ${customerName} · ${courierDesc} · Selesai`,
            type: 'INCOME',
            category: 'SALE',
            categoryLabel: 'Penjualan Gadget',
            amount: netStoreAmount,
            date: formattedDate,
            rawDate: effectiveDate,
            status: 'SETTLED',
            statusLabel: 'Masuk Saldo',
            orderStatus: order.status,
            courierInfo: courierDesc,
            trackingNumber: order.trackingNumber,
          })

          // 2. Mutasi Bagi Hasil Platform Dipotong (EXPENSE)
          if (commission > 0) {
            mutations.push({
              id: `fee-${order.id}`,
              refNumber: `FEE-${order.orderNumber.replace(/^(ORD|SPR)-/, '')}`,
              title: `Bagi Hasil Platform (${order.commissionRate || 1.5}% Komisi)`,
              subtitle: `Dipotong otomatis untuk pesanan #${order.orderNumber}`,
              type: 'EXPENSE',
              category: 'COMMISSION',
              categoryLabel: 'Komisi Platform',
              amount: commission,
              date: formattedDate,
              rawDate: effectiveDate,
              status: 'SETTLED',
              statusLabel: 'Terpotong',
              orderStatus: order.status,
            })
          }

          // 3. Potongan Biaya Payment Gateway Toko (EXPENSE)
          const gatewayFeeResult = calculatePaymentGatewayFee(
            order.payment?.method || 'MIDTRANS',
            orderTotal,
            order.payment?.notes
          )
          if (gatewayFeeResult.feeAmount > 0) {
            totalGatewayFees += gatewayFeeResult.feeAmount
            mutations.push({
              id: `gw-${order.id}`,
              refNumber: `GW-${order.orderNumber.replace(/^(ORD|SPR)-/, '')}`,
              title: `Biaya Gateway: ${gatewayFeeResult.methodLabel}`,
              subtitle: `${gatewayFeeResult.feeFormula} (#${order.orderNumber})`,
              type: 'EXPENSE',
              category: 'GATEWAY',
              categoryLabel: 'Biaya Transaksi',
              amount: gatewayFeeResult.feeAmount,
              date: formattedDate,
              rawDate: effectiveDate,
              status: 'SETTLED',
              statusLabel: 'Terpotong',
              orderStatus: order.status,
            })
          }
        }
      } else if (ESCROW_STATUSES.includes(order.status as any)) {
        if (!isCreatedInPeriod) return

        escrowBalance += netStoreAmount
        courierBreakdown.totalEscrowOrders += 1

        let statusLabel = 'Dana Tertahan'
        let subtitleStatus = 'Menunggu Proses'

        if (order.status === 'SHIPPED') {
          courierBreakdown.shippedCount += 1
          statusLabel = 'Kurir Perjalanan'
          subtitleStatus = 'Sedang Dikirim Kurir'
        } else if (order.status === 'IN_PROGRESS') {
          courierBreakdown.inProgressCount += 1
          statusLabel = 'Proses Packing / Kurir'
          subtitleStatus = 'Sedang Dipersiapkan / Tunggu Pickup'
        } else if (order.status === 'PAID') {
          courierBreakdown.paidCount += 1
          statusLabel = 'Perlu Diproses'
          subtitleStatus = 'Pembayaran Terverifikasi'
        } else if (order.status === 'COMPLAINED') {
          courierBreakdown.complainedCount += 1
          statusLabel = 'Dalam Investigasi'
          subtitleStatus = 'Komplain Garansi'
        }

        const formattedDate = new Intl.DateTimeFormat('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(order.createdAt))

        // Mutasi Escrow Tertahan
        mutations.push({
          id: `escrow-${order.id}`,
          refNumber: order.orderNumber,
          title: productTitle,
          subtitle: `Customer: ${customerName} · ${courierDesc} · ${subtitleStatus}`,
          type: 'ESCROW',
          category: 'ESCROW',
          categoryLabel: 'Dana Tertahan (Escrow)',
          amount: netStoreAmount,
          date: formattedDate,
          rawDate: order.createdAt,
          status: 'PENDING',
          statusLabel: statusLabel,
          orderStatus: order.status,
          courierInfo: courierDesc,
          trackingNumber: order.trackingNumber,
        })
      }
    })

    // Hitung riwayat penarikan saldo (Withdrawals)
    // Guard: hanya izinkan withdrawal dari storeId yang benar-benar ada di DB
    const allRealStoreIds = new Set(
      (
        await prisma.store.findMany({
          select: { id: true },
        })
      ).map((s) => s.id)
    )

    let allTimeWithdrawn = 0
    let availableBalance = 0

    if (isConsolidated) {
      // Untuk Superadmin (Holding Platform):
      // Saldo siap cair adalah seluruh komisi platform dari pesanan selesai dikurangi pencairan holding
      const holdingWithdrawals = getStoreWithdrawals().filter(
        (w) =>
          ['ALL', 'holding-01', 'HOLDING'].includes(w.storeId) &&
          w.status === 'SUCCESS'
      )
      allTimeWithdrawn = holdingWithdrawals.reduce(
        (sum, w) => sum + w.amount,
        0
      )
      const allTimeCommission = allTimeCompletedAgg._sum.commissionAmount || 0
      availableBalance = Math.max(0, allTimeCommission - allTimeWithdrawn)
    } else {
      // Untuk Toko Cabang:
      // Saldo siap cair adalah hak bersih toko dikurangi penarikan toko tersebut
      const storeWithdrawals = getStoreWithdrawals(targetStoreId).filter(
        (w) =>
          w.storeId === targetStoreId &&
          allRealStoreIds.has(w.storeId) &&
          w.status === 'SUCCESS'
      )
      allTimeWithdrawn = storeWithdrawals.reduce((sum, w) => sum + w.amount, 0)
      const allTimeNetRevenue = Math.max(
        0,
        (allTimeCompletedAgg._sum.subtotal || 0) -
          (allTimeCompletedAgg._sum.discountAmount || 0) -
          (allTimeCompletedAgg._sum.commissionAmount || 0)
      )
      availableBalance = Math.max(0, allTimeNetRevenue - allTimeWithdrawn)
    }

    let withdrawals = getStoreWithdrawals(targetStoreId).filter((w) =>
      isConsolidated
        ? ['ALL', 'holding-01', 'HOLDING'].includes(w.storeId)
        : w.storeId === targetStoreId && allRealStoreIds.has(w.storeId)
    )
    if (s && e) {
      const sTime = s.getTime()
      const eTime = e.getTime()
      withdrawals = withdrawals.filter((w) => {
        const t = new Date(w.createdAt).getTime()
        return t >= sTime && t <= eTime
      })
    }
    const totalWithdrawn = withdrawals
      .filter((w) => w.status === 'SUCCESS')
      .reduce((sum, w) => sum + w.amount, 0)

    withdrawals.forEach((wd) => {
      const formattedWdDate = new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(wd.createdAt))

      mutations.push({
        id: wd.id,
        refNumber: wd.refNumber,
        title: 'Pencairan Dana ke Rekening Mandiri PT',
        subtitle: `Transfer ke ${wd.bankName} ${wd.accountNumber} a.n. ${wd.accountName}`,
        type: 'PAYOUT',
        category: 'WITHDRAWAL',
        categoryLabel: 'Pencairan Saldo',
        amount: wd.amount,
        date: formattedWdDate,
        rawDate: new Date(wd.createdAt),
        status: wd.status === 'SUCCESS' ? 'SUCCESS' : 'PENDING',
        statusLabel:
          wd.status === 'SUCCESS' ? 'Berhasil Ditransfer' : 'Sedang Diproses',
      })
    })

    // Urutkan mutasi dari yang paling baru
    mutations.sort(
      (a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime()
    )

    // Data Rekening Bank & Toko Resmi
    const primaryBankAccount = targetStore?.bankAccounts?.find(
      (b: { isPrimary: boolean }) => b.isPrimary
    ) ||
      targetStore?.bankAccounts?.[0] || {
        bankName: 'Bank Mandiri',
        accountNumber: '1180099887766',
        accountName:
          targetStore?.companyName || 'PT Affiliate Gadget Nusantara',
      }

    const bankAccountCooldownStatus = checkBankAccountCooldown(
      targetStore?.bankAccountUpdatedAt
    )

    return NextResponse.json({
      success: true,
      store: targetStore
        ? {
            id: targetStore.id,
            name: targetStore.name,
            companyName: targetStore.companyName,
            taxId: targetStore.taxId || '01.428.910.4-015.000',
            city: targetStore.city,
            phone: targetStore.whatsapp || targetStore.phone || '081289001122',
            whatsapp:
              targetStore.whatsapp || targetStore.phone || '6281289001122',
            bankAccount: primaryBankAccount,
            bankAccountUpdatedAt: targetStore.bankAccountUpdatedAt || null,
            cooldownStatus: bankAccountCooldownStatus,
          }
        : null,
      bankAccountCooldownStatus,
      stats: {
        availableBalance,
        grossRevenue: isConsolidated ? platformCommission : grossRevenue,
        storeGMV: grossRevenue,
        platformCommission,
        escrowBalance,
        totalUnitsSold,
        totalWithdrawn,
        completedNetRevenue,
        totalVatOutput,
        totalPph23Withheld,
        totalVatOnCommission,
        totalGatewayFees,
        totalMaintenanceFees,
        courierBreakdown,
      },
      transactions: mutations,
      allStores: allStores.length > 0 ? allStores : undefined,
    })
  } catch (error) {
    console.error('Error fetching admin finance data:', error)
    return NextResponse.json(
      { error: 'Internal server error while fetching finance data' },
      { status: 500 }
    )
  }
}
