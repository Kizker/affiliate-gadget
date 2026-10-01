import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import ExcelJS from 'exceljs'
import {
  getColumnFormatAndAlignment,
  CURRENCY_FORMAT,
} from '@/lib/reports-export-format'
import { getStoreWithdrawals } from '@/lib/store-withdrawal-store'

interface FinancialOrderRecord {
  id: string
  orderNumber: string
  status: any
  createdAt: Date
  completedAt?: Date | null
  subtotal: number
  total: number
  commissionAmount: number | null
  discountAmount: number | null
  shippingCost: number | null
  insuranceFee: number | null
  store: {
    name: string | null
    companyName: string | null
    defaultPackingFee?: number | null
  } | null
  user: {
    name: string | null
    email: string | null
  } | null
  items: Array<{
    price: number
    costPrice?: number | null
    quantity: number | null
    variantName?: string | null
    product?: {
      name: string
      costPrice?: number | null
    } | null
    service?: {
      name: string
    } | null
    rentalItem?: {
      name: string
    } | null
  }>
}

interface OrdersExportRecord {
  id: string
  orderNumber: string
  status: any
  createdAt: Date
  subtotal: number
  total: number
  discountAmount?: number | null
  shippingCost?: number | null
  insuranceFee?: number | null
  store?: {
    name: string | null
    companyName: string | null
  } | null
  user: {
    name: string | null
    email: string | null
    phone: string | null
  }
  items: Array<{
    quantity: number
    product?: { name: string } | null
    service?: { name: string } | null
    rentalItem?: { name: string } | null
  }>
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN', 'STORE_ADMIN', 'FINANCE_ADMIN'].includes(
        session.user.role
      )
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'orders'
    const format = searchParams.get('format') || 'xlsx'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let s: Date | undefined
    let e: Date | undefined

    const dateFilter: {
      createdAt?: {
        gte: Date
        lte: Date
      }
    } = {}
    if (startDate && endDate) {
      const parsedS = new Date(startDate)
      const parsedE = new Date(endDate)
      if (!isNaN(parsedS.getTime()) && !isNaN(parsedE.getTime())) {
        s = parsedS
        e = parsedE
        dateFilter.createdAt = {
          gte: s,
          lte: e,
        }
      }
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Affiliate Gadget'
    workbook.created = new Date()

    // Canonical revenue statuses — must match main reports/route.ts
    const REVENUE_STATUSES = [
      'PAID',
      'IN_PROGRESS',
      'SHIPPED',
      'COMPLETED',
      'COMPLAINED',
    ] as const

    const typeLabel =
      type === 'financials' || type === 'pnl'
        ? 'Laporan_Keuangan'
        : type === 'products'
          ? 'Produk'
          : 'Pesanan'
    let sheetName = typeLabel.toUpperCase()

    // STORE_ADMIN scope isolation — restrict export to their own store
    const isStoreAdmin = session.user.role === 'STORE_ADMIN'
    const queryStoreId = searchParams.get('storeId')
    const effectiveStoreId: string | undefined = isStoreAdmin
      ? ((session.user as { storeId?: string }).storeId ?? undefined)
      : queryStoreId && queryStoreId !== 'ALL'
        ? queryStoreId
        : undefined
    const storeScope = effectiveStoreId ? { storeId: effectiveStoreId } : {}

    // Dynamic filename with store PT name if isolated to a store
    let storeSuffix = ''
    if (effectiveStoreId) {
      const storeObj = await prisma.store.findUnique({
        where: { id: effectiveStoreId },
        select: { companyName: true, name: true, city: true },
      })
      if (storeObj) {
        const storeLabel = (
          storeObj.companyName ||
          storeObj.name ||
          storeObj.city ||
          'Toko'
        ).replace(/[^a-zA-Z0-9]/g, '_')
        storeSuffix = `_${storeLabel}`
      }
    }
    const filename = `Affiliate_Gadget_${typeLabel}${storeSuffix}_${new Date().toISOString().split('T')[0]}`

    // Get data based on type
    let headers: string[] = []
    let rows: (string | number)[][] = []
    let financialSummaryData: {
      totalOrders: number
      totalQty: number
      totalPemasukanKotor: number
      totalPemasukanEscrow: number
      totalHppModal: number
      totalLabaKotor: number
      totalPotonganKomisi: number
      totalPotonganPacking: number
      totalPotonganVoucher: number
      totalPotongan: number
      totalOngkirPassThrough: number
      totalAsuransiPassThrough: number
      totalPendapatanResmiToko: number
      totalKasBersihToko: number
      totalPendapatanResmiPlatform: number
      totalWithdrawn: number
      totalPeriodWithdrawn: number
      availableBalance: number
      escrowBalance: number
      periodLabel: string
      storeLabel: string
    } | null = null

    switch (type) {
      case 'financials':
      case 'pnl': {
        const financialDateWhereClause =
          s && e
            ? {
                OR: [
                  { completedAt: { gte: s, lte: e } },
                  { createdAt: { gte: s, lte: e } },
                  { updatedAt: { gte: s, lte: e } },
                ],
              }
            : {}

        // Hanya pesanan yang prosesnya sudah SELESAI (COMPLETED)
        // Pesanan yang masih pengiriman (SHIPPED) atau diproses (IN_PROGRESS) TIDAK dimasukkan
        const rawFinancialOrders = await prisma.order.findMany({
          where: {
            status: 'COMPLETED',
            ...financialDateWhereClause,
            ...storeScope,
          },
          include: {
            store: true,
            user: {
              select: { name: true, email: true },
            },
            items: {
              include: {
                product: true,
                service: true,
                rentalItem: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        })

        const financialOrders =
          rawFinancialOrders as unknown as FinancialOrderRecord[]

        sheetName = 'LAPORAN_KEUANGAN'
        headers = [
          'No',
          'Nomor Pesanan',
          'Toko / PT Cabang',
          'Tanggal',
          'Status',
          'Produk',
          'Qty',
          'Omzet Kotor (Rp)',
          'HPP Modal (Rp)',
          'Laba Kotor (Rp)',
          'Margin Kotor (%)',
          'Komisi Platform (Rp)',
          'Biaya Packing (Rp)',
          'Diskon Voucher (Rp)',
          'Ongkir Pass-Through (Rp)',
          'Asuransi Pass-Through (Rp)',
          'Laba Bersih Toko (Rp)',
          'Margin Bersih (%)',
        ]

        let sumGross = 0
        let sumCOGS = 0
        let sumGrossProfit = 0
        let sumCommission = 0
        let sumPacking = 0
        let sumVoucher = 0
        let sumShipping = 0
        let sumInsurance = 0
        let sumNetProfit = 0
        let sumQty = 0

        rows = financialOrders.map(
          (order: FinancialOrderRecord, index: number) => {
            const grossRevenue =
              order.items.length > 0
                ? order.items.reduce(
                    (sum: number, item: any) =>
                      sum + item.price * (item.quantity || 1),
                    0
                  )
                : order.subtotal || 0

            const cogs = order.items.reduce(
              (sum: number, item: any) =>
                sum +
                (item.costPrice || item.product?.costPrice || 0) *
                  (item.quantity || 1),
              0
            )
            const grossProfit = grossRevenue - cogs
            const grossMargin =
              grossRevenue > 0
                ? Number(((grossProfit / grossRevenue) * 100).toFixed(2))
                : 0

            const commission = order.commissionAmount ?? 0
            const packing = order.store?.defaultPackingFee ?? 5000
            const discount = order.discountAmount ?? 0
            const shipping = order.shippingCost ?? 0
            const insurance = order.insuranceFee ?? 0

            const totalExpense = commission + packing + discount
            const netProfit = grossProfit - totalExpense
            const netMargin =
              grossRevenue > 0
                ? Number(((netProfit / grossRevenue) * 100).toFixed(2))
                : 0

            const totalQty = order.items.reduce(
              (sum: number, item: any) => sum + (item.quantity || 1),
              0
            )

            sumGross += grossRevenue
            sumCOGS += cogs
            sumGrossProfit += grossProfit
            sumCommission += commission
            sumPacking += packing
            sumVoucher += discount
            sumShipping += shipping
            sumInsurance += insurance
            sumNetProfit += netProfit
            sumQty += totalQty

            const productNames = order.items
              .map(
                (i: any) =>
                  i.product?.name ||
                  i.service?.name ||
                  i.rentalItem?.name ||
                  i.variantName ||
                  'Gadget'
              )
              .join('; ')

            return [
              index + 1,
              order.orderNumber,
              order.store?.companyName || order.store?.name || '-',
              formatDate(order.completedAt || order.createdAt),
              formatStatus(order.status),
              productNames,
              totalQty,
              grossRevenue,
              cogs,
              grossProfit,
              grossMargin,
              commission,
              packing,
              discount,
              shipping,
              insurance,
              netProfit,
              netMargin,
            ]
          }
        )

        // Summary Total Row at the bottom
        if (financialOrders.length > 0) {
          const totalGrossMargin =
            sumGross > 0
              ? Number(((sumGrossProfit / sumGross) * 100).toFixed(2))
              : 0
          const totalNetMargin =
            sumGross > 0
              ? Number(((sumNetProfit / sumGross) * 100).toFixed(2))
              : 0

          rows.push([
            'TOTAL',
            '-',
            '-',
            '-',
            '-',
            '-',
            sumQty,
            sumGross,
            sumCOGS,
            sumGrossProfit,
            totalGrossMargin,
            sumCommission,
            sumPacking,
            sumVoucher,
            sumShipping,
            sumInsurance,
            sumNetProfit,
            totalNetMargin,
          ])
        }

        const isConsolidated =
          session.user.role === 'SUPER_ADMIN' && !effectiveStoreId

        // Query akumulasi all-time dan escrow untuk mencocokkan saldo dengan Web Dashboard
        const [allTimeCompletedAgg, escrowOrders, allRealStores] =
          await Promise.all([
            prisma.order.aggregate({
              where: {
                status: 'COMPLETED',
                ...storeScope,
              },
              _sum: {
                subtotal: true,
                discountAmount: true,
                commissionAmount: true,
              },
            }),
            prisma.order.findMany({
              where: {
                status: {
                  in: ['PAID', 'IN_PROGRESS', 'SHIPPED', 'COMPLAINED'],
                },
                ...storeScope,
                ...(s && e ? { createdAt: { gte: s, lte: e } } : {}),
              },
              select: {
                subtotal: true,
                discountAmount: true,
                commissionAmount: true,
              },
            }),
            prisma.store.findMany({ select: { id: true } }),
          ])

        const escrowBalance = escrowOrders.reduce(
          (sum, o) =>
            sum +
            Math.max(
              0,
              (o.subtotal || 0) -
                (o.discountAmount || 0) -
                (o.commissionAmount || 0)
            ),
          0
        )
        const allRealStoreIds = new Set(allRealStores.map((st) => st.id))

        let allTimeWithdrawn = 0
        let availableBalance = 0

        if (isConsolidated) {
          const holdingWithdrawals = getStoreWithdrawals().filter(
            (w) =>
              ['ALL', 'holding-01', 'HOLDING'].includes(w.storeId) &&
              w.status === 'SUCCESS'
          )
          allTimeWithdrawn = holdingWithdrawals.reduce(
            (sum, w) => sum + w.amount,
            0
          )
          const allTimeCommission =
            allTimeCompletedAgg._sum.commissionAmount || 0
          availableBalance = Math.max(0, allTimeCommission - allTimeWithdrawn)
        } else {
          const storeWithdrawals = getStoreWithdrawals(effectiveStoreId).filter(
            (w) =>
              w.storeId === effectiveStoreId &&
              allRealStoreIds.has(w.storeId) &&
              w.status === 'SUCCESS'
          )
          allTimeWithdrawn = storeWithdrawals.reduce(
            (sum, w) => sum + w.amount,
            0
          )
          const allTimeNetRevenue = Math.max(
            0,
            (allTimeCompletedAgg._sum.subtotal || 0) -
              (allTimeCompletedAgg._sum.discountAmount || 0) -
              (allTimeCompletedAgg._sum.commissionAmount || 0)
          )
          availableBalance = Math.max(0, allTimeNetRevenue - allTimeWithdrawn)
        }

        // Period withdrawals (jika ada filter rentang tanggal)
        let periodWithdrawals = getStoreWithdrawals(effectiveStoreId).filter(
          (w) =>
            isConsolidated
              ? ['ALL', 'holding-01', 'HOLDING'].includes(w.storeId)
              : w.storeId === effectiveStoreId && allRealStoreIds.has(w.storeId)
        )
        if (s && e) {
          const sTime = s.getTime()
          const eTime = e.getTime()
          periodWithdrawals = periodWithdrawals.filter((w) => {
            const t = new Date(w.createdAt).getTime()
            return t >= sTime && t <= eTime
          })
        }
        const totalPeriodWithdrawn = periodWithdrawals
          .filter((w) => w.status === 'SUCCESS')
          .reduce((sum, w) => sum + w.amount, 0)

        // Simpan data ikhtisar untuk pembentukan Sheet ke-2 (RINGKASAN_PENDAPATAN)
        financialSummaryData = {
          totalOrders: financialOrders.length,
          totalQty: sumQty,
          totalPemasukanKotor: sumGross,
          totalPemasukanEscrow:
            sumGross - sumVoucher + sumShipping + sumInsurance,
          totalHppModal: sumCOGS,
          totalLabaKotor: sumGrossProfit,
          totalPotonganKomisi: sumCommission,
          totalPotonganPacking: sumPacking,
          totalPotonganVoucher: sumVoucher,
          totalPotongan: sumCommission + sumPacking + sumVoucher,
          totalOngkirPassThrough: sumShipping,
          totalAsuransiPassThrough: sumInsurance,
          totalPendapatanResmiToko: sumNetProfit,
          totalKasBersihToko: Math.max(
            0,
            sumGross - sumVoucher - sumCommission
          ),
          totalPendapatanResmiPlatform: sumCommission,
          totalWithdrawn: allTimeWithdrawn,
          totalPeriodWithdrawn,
          availableBalance,
          escrowBalance,
          periodLabel:
            s && e ? `${formatDate(s)} - ${formatDate(e)}` : 'Semua Periode',
          storeLabel: storeSuffix
            ? storeSuffix.replace(/^_/, '').replace(/_/g, ' ')
            : 'Konsolidasi Seluruh Cabang Toko PT',
        }
        break
      }

      case 'orders': {
        const orderDateWhereClause =
          s && e
            ? {
                OR: [
                  { createdAt: { gte: s, lte: e } },
                  { completedAt: { gte: s, lte: e } },
                  {
                    status: 'COMPLETED' as const,
                    updatedAt: { gte: s, lte: e },
                  },
                ],
              }
            : {}

        const rawOrders = await prisma.order.findMany({
          where: {
            ...orderDateWhereClause,
            ...storeScope,
          },
          include: {
            store: {
              select: { name: true, companyName: true },
            },
            user: {
              select: { name: true, email: true, phone: true },
            },
            items: {
              include: {
                product: { select: { name: true } },
                service: { select: { name: true } },
                rentalItem: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        })

        const orders = rawOrders as unknown as OrdersExportRecord[]

        sheetName = 'PESANAN'
        headers = [
          'No',
          'Order Number',
          'Toko / PT Cabang',
          'Customer',
          'Email',
          'Phone',
          'Items',
          'Qty',
          'Status',
          'Subtotal (Rp)',
          'Diskon Voucher (Rp)',
          'Ongkir (Rp)',
          'Asuransi (Rp)',
          'Total Tagihan (Rp)',
          'Tanggal Pesanan',
        ]

        let totalSubtotal = 0
        let totalDiscount = 0
        let totalShipping = 0
        let totalInsurance = 0
        let totalQty = 0
        let totalGrossAmount = 0

        rows = orders.map((order, index) => {
          const subtotal = order.subtotal || 0
          const discount = order.discountAmount || 0
          const shipping = order.shippingCost || 0
          const insurance = order.insuranceFee || 0
          const totalAmount = order.total || 0
          const qty = order.items.reduce((sum, item) => sum + item.quantity, 0)

          totalSubtotal += subtotal
          totalDiscount += discount
          totalShipping += shipping
          totalInsurance += insurance
          totalQty += qty
          totalGrossAmount += totalAmount

          return [
            index + 1,
            order.orderNumber,
            order.store?.companyName || order.store?.name || '-',
            order.user.name || '-',
            order.user.email || '-',
            order.user.phone || '-',
            order.items
              .map(
                (item) =>
                  item.product?.name ||
                  item.service?.name ||
                  item.rentalItem?.name
              )
              .filter(Boolean)
              .join(', '),
            qty,
            formatStatus(order.status),
            subtotal,
            discount,
            shipping,
            insurance,
            totalAmount,
            formatDate(order.createdAt),
          ]
        })

        if (orders.length > 0) {
          rows.push([
            'TOTAL',
            '-',
            '-',
            '-',
            '-',
            '-',
            '-',
            totalQty,
            '-',
            totalSubtotal,
            totalDiscount,
            totalShipping,
            totalInsurance,
            totalGrossAmount,
            '-',
          ])
        }
        break
      }

      case 'products': {
        const rawProducts = await prisma.product.findMany({
          where: {
            ...storeScope,
          },
          include: {
            store: {
              select: { name: true, companyName: true },
            },
            _count: {
              select: {
                orderItems: {
                  where: {
                    order: {
                      status: { in: [...REVENUE_STATUSES] },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        })

        sheetName = 'PRODUK'
        headers = [
          'No',
          'Nama Produk',
          'Brand',
          'Kategori',
          'Kondisi',
          'Toko / PT Cabang',
          'Harga Jual (Rp)',
          'HPP Modal (Rp)',
          'Stok Fisik',
          'Total Terjual (Unit)',
          'Estimasi Nilai Stok (Rp)',
          'Status',
        ]

        let totalStock = 0
        let totalSold = 0
        let totalStockValue = 0

        rows = rawProducts.map((p, index) => {
          const stock = p.stock || 0
          const sold = p._count?.orderItems || 0
          const stockValue = stock * (p.costPrice || p.price)

          totalStock += stock
          totalSold += sold
          totalStockValue += stockValue

          return [
            index + 1,
            p.name,
            p.brand || '-',
            p.category || 'Gadget',
            p.condition || 'BARU',
            p.store?.companyName || p.store?.name || 'Pusat',
            p.price,
            p.costPrice || 0,
            stock,
            sold,
            stockValue,
            p.isActive ? 'Aktif' : 'Nonaktif',
          ]
        })

        if (rawProducts.length > 0) {
          rows.push([
            'TOTAL',
            '-',
            '-',
            '-',
            '-',
            '-',
            '-',
            '-',
            totalStock,
            totalSold,
            totalStockValue,
            '-',
          ])
        }
        break
      }

      default:
        return NextResponse.json(
          {
            error:
              'Tipe laporan tidak valid. Hanya mendukung laporan keuangan (financials), pesanan (orders), dan produk (products).',
          },
          { status: 400 }
        )
    }

    // Create worksheet with styling
    const worksheet = workbook.addWorksheet(sheetName)

    // Determine column formatting configuration (Currency, Percentage, Quantity, Alignment)
    const columnConfigs = headers.map((header) =>
      getColumnFormatAndAlignment(header)
    )

    // Add header row
    worksheet.addRow(headers)

    // Style header row (Trust Blue #1E3A8A)
    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' },
    }
    headerRow.alignment = {
      horizontal: 'center',
      vertical: 'middle',
      wrapText: true,
    }
    headerRow.height = 28

    // Add data rows
    rows.forEach((row) => {
      worksheet.addRow(row)
    })

    // Style each data row & cell with custom currency/number formats
    for (let rowIdx = 2; rowIdx <= rows.length + 1; rowIdx++) {
      const row = worksheet.getRow(rowIdx)
      const firstCellValue = row.getCell(1).value
      const isTotalRow = firstCellValue === 'TOTAL'

      row.height = isTotalRow ? 26 : 22

      if (isTotalRow) {
        row.font = { bold: true, size: 10, color: { argb: 'FF0F172A' } }
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF1F5F9' }, // Light slate-100 highlight
        }
      } else if (rowIdx % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' }, // Light slate-50 alternate zebra
        }
      }

      for (let colIdx = 0; colIdx < headers.length; colIdx++) {
        const cell = row.getCell(colIdx + 1)
        const colConfig = columnConfigs[colIdx]
        const cellValue = cell.value

        if (typeof cellValue === 'number') {
          if (colConfig.numFmt) {
            cell.numFmt = colConfig.numFmt
          }
          cell.alignment = colConfig.alignment
        } else if (isTotalRow && cellValue === 'TOTAL') {
          cell.alignment = {
            horizontal: 'center',
            vertical: 'middle',
            wrapText: false,
          }
        } else {
          cell.alignment = colConfig.alignment
        }

        // Cell borders
        if (isTotalRow) {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF94A3B8' } },
            bottom: { style: 'double', color: { argb: 'FF0F172A' } }, // Accounting double line
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          }
        } else {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          }
        }
      }
    }

    // Auto-fit column widths with breathing room and minimum widths
    worksheet.columns.forEach((column, colIdx) => {
      let maxLength = headers[colIdx]?.length || 10
      rows.forEach((row) => {
        const cellVal = row[colIdx]
        if (cellVal !== null && cellVal !== undefined) {
          let strLen = String(cellVal).length
          if (
            columnConfigs[colIdx].type === 'currency' &&
            typeof cellVal === 'number'
          ) {
            strLen += 7 // Extra width for "Rp " and thousand dots/commas
          }
          if (strLen > maxLength) {
            maxLength = strLen
          }
        }
      })
      const minWidth = columnConfigs[colIdx].type === 'currency' ? 20 : 12
      column.width = Math.min(Math.max(maxLength + 4, minWidth), 55)
    })

    // Buat Sheet ke-2: RINGKASAN_PENDAPATAN (hanya jika export financials dalam format xlsx)
    if (financialSummaryData && format === 'xlsx') {
      const summarySheet = workbook.addWorksheet('RINGKASAN_PENDAPATAN')

      // Metadata Header Info
      const titleRow = summarySheet.addRow([
        'IKHTISAR EKSEKUTIF KEUANGAN & PENDAPATAN RESMI',
      ])
      titleRow.font = { bold: true, size: 13, color: { argb: 'FF1E3A8A' } }
      titleRow.height = 26

      summarySheet.addRow([
        'Badan Usaha / Toko',
        financialSummaryData.storeLabel,
      ])
      summarySheet.addRow([
        'Periode Transaksi',
        financialSummaryData.periodLabel,
      ])
      summarySheet.addRow([
        'Kriteria Status',
        'Pesanan Selesai (COMPLETED) — Menghindari Estimasi Pesanan Berjalan',
      ])
      summarySheet.addRow([
        'Total Transaksi Selesai',
        `${financialSummaryData.totalOrders} Pesanan (${financialSummaryData.totalQty} Unit Gadget/Jasa)`,
      ])
      summarySheet.addRow([
        'Sisa Saldo Siap Cair (Web)',
        `Rp ${financialSummaryData.availableBalance.toLocaleString('id-ID')}`,
      ])
      summarySheet.addRow([
        'Total Saldo Telah Dicairkan',
        `Rp ${financialSummaryData.totalWithdrawn.toLocaleString('id-ID')}`,
      ])
      summarySheet.addRow([]) // blank separator

      // Style metadata rows
      for (let r = 2; r <= 7; r++) {
        const metaRow = summarySheet.getRow(r)
        metaRow.getCell(1).font = {
          bold: true,
          size: 10,
          color: { argb: 'FF475569' },
        }
        metaRow.getCell(2).font = { size: 10, color: { argb: 'FF0F172A' } }
      }

      const summaryHeaders = [
        'No',
        'Kategori Finansial',
        'Uraian Komponen Arus Kas',
        'Nilai (Rp)',
      ]
      summarySheet.addRow(summaryHeaders)

      const headerRowIndex = 9
      const sumHeaderRow = summarySheet.getRow(headerRowIndex)
      sumHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
      sumHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3A8A' },
      }
      sumHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' }
      sumHeaderRow.height = 28

      interface SummaryEntry {
        no: string
        category: string
        item: string
        amount: number
        highlightType?: 'subtotal' | 'success' | 'platform' | 'warning'
      }

      const summaryEntries: SummaryEntry[] = [
        // I. TOTAL PEMASUKAN
        {
          no: '1',
          category: 'I. TOTAL PEMASUKAN',
          item: 'Omzet Kotor Penjualan Produk/Jasa (Gross Merchandise Value)',
          amount: financialSummaryData.totalPemasukanKotor,
        },
        {
          no: '2',
          category: 'I. TOTAL PEMASUKAN',
          item: 'Ongkos Kirim Pass-Through (Logistik Kurir JNE/Gojek)',
          amount: financialSummaryData.totalOngkirPassThrough,
        },
        {
          no: '3',
          category: 'I. TOTAL PEMASUKAN',
          item: 'Asuransi Pengiriman Pass-Through (Proteksi Logistik)',
          amount: financialSummaryData.totalAsuransiPassThrough,
        },
        {
          no: 'SUBTOTAL',
          category: 'I. TOTAL PEMASUKAN',
          item: 'TOTAL PEMASUKAN KOTOR (DANA DIBAYAR PEMBELI)',
          amount: financialSummaryData.totalPemasukanEscrow,
          highlightType: 'subtotal',
        },

        // II. TOTAL POTONGAN
        {
          no: '4',
          category: 'II. TOTAL POTONGAN',
          item: 'Bagi Hasil Platform Holding (Komisi 1.5% - 2%)',
          amount: financialSummaryData.totalPotonganKomisi,
        },
        {
          no: '5',
          category: 'II. TOTAL POTONGAN',
          item: 'Biaya Operasional Kemasan / Packing Toko',
          amount: financialSummaryData.totalPotonganPacking,
        },
        {
          no: '6',
          category: 'II. TOTAL POTONGAN',
          item: 'Potongan Diskon Voucher Promo Penjualan',
          amount: financialSummaryData.totalPotonganVoucher,
        },
        {
          no: 'SUBTOTAL',
          category: 'II. TOTAL POTONGAN',
          item: 'TOTAL SELURUH POTONGAN OPERASIONAL & BIAYA',
          amount: financialSummaryData.totalPotongan,
          highlightType: 'subtotal',
        },

        // III. TOTAL PENDAPATAN RESMI
        {
          no: '7',
          category: 'III. PENDAPATAN RESMI',
          item: 'Beban Pokok Penjualan / HPP Modal Unit (COGS)',
          amount: financialSummaryData.totalHppModal,
        },
        {
          no: '8',
          category: 'III. PENDAPATAN RESMI',
          item: 'Laba Kotor Usaha Penjualan (Gross Profit)',
          amount: financialSummaryData.totalLabaKotor,
        },
        {
          no: '9',
          category: 'III. PENDAPATAN RESMI',
          item: 'Total Hak Kas Masuk Toko (Sebelum Penarikan)',
          amount: financialSummaryData.totalKasBersihToko,
          highlightType: 'success',
        },
        {
          no: '10',
          category: 'III. PENDAPATAN RESMI',
          item: 'Laba Bersih Resmi Usaha Toko (Net Profit)',
          amount: financialSummaryData.totalPendapatanResmiToko,
          highlightType: 'success',
        },
        {
          no: '11',
          category: 'III. PENDAPATAN RESMI',
          item: 'Pendapatan Resmi Platform Superadmin (Komisi Holding)',
          amount: financialSummaryData.totalPendapatanResmiPlatform,
          highlightType: 'platform',
        },

        // IV. REKONSILIASI SALDO & KAS (SESUAI WEB DASHBOARD)
        {
          no: '12',
          category: 'IV. REKONSILIASI SALDO & KAS',
          item: 'Total Saldo Sudah Ditarik / Dicairkan ke Rekening PT',
          amount: financialSummaryData.totalWithdrawn,
        },
        {
          no: '13',
          category: 'IV. REKONSILIASI SALDO & KAS',
          item: 'SISA SALDO SIAP CAIR (AVAILABLE BALANCE SESUAI WEB)',
          amount: financialSummaryData.availableBalance,
          highlightType: 'success',
        },
        {
          no: '14',
          category: 'IV. REKONSILIASI SALDO & KAS',
          item: 'Dana Tertahan Escrow (Pesanan Masih Dalam Pengiriman/Proses)',
          amount: financialSummaryData.escrowBalance,
          highlightType: 'warning',
        },
      ]

      summaryEntries.forEach((entry) => {
        summarySheet.addRow([
          entry.no,
          entry.category,
          entry.item,
          entry.amount,
        ])
      })

      // Styling data rows in Sheet 2
      const startDataRow = headerRowIndex + 1
      const endDataRow = headerRowIndex + summaryEntries.length

      for (let rIdx = startDataRow; rIdx <= endDataRow; rIdx++) {
        const row = summarySheet.getRow(rIdx)
        const entry = summaryEntries[rIdx - startDataRow]

        row.height = entry.highlightType ? 24 : 22

        const c1 = row.getCell(1)
        const c2 = row.getCell(2)
        const c3 = row.getCell(3)
        const c4 = row.getCell(4)

        c1.alignment = { horizontal: 'center', vertical: 'middle' }
        c2.alignment = { horizontal: 'left', vertical: 'middle' }
        c3.alignment = { horizontal: 'left', vertical: 'middle' }
        c4.alignment = { horizontal: 'right', vertical: 'middle' }
        c4.numFmt = CURRENCY_FORMAT

        if (entry.highlightType === 'subtotal') {
          row.font = { bold: true, size: 10, color: { argb: 'FF0F172A' } }
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF1F5F9' },
          }
          for (let col = 1; col <= 4; col++) {
            row.getCell(col).border = {
              top: { style: 'thin', color: { argb: 'FF94A3B8' } },
              bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
              left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            }
          }
        } else if (entry.highlightType === 'success') {
          row.font = { bold: true, size: 10, color: { argb: 'FF065F46' } }
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFECFDF5' }, // Emerald-50
          }
          for (let col = 1; col <= 4; col++) {
            row.getCell(col).border = {
              top: { style: 'thin', color: { argb: 'FFA7F3D0' } },
              bottom: { style: 'thin', color: { argb: 'FF059669' } },
              left: { style: 'thin', color: { argb: 'FFA7F3D0' } },
              right: { style: 'thin', color: { argb: 'FFA7F3D0' } },
            }
          }
          c4.border = {
            top: { style: 'thin', color: { argb: 'FFA7F3D0' } },
            bottom: { style: 'double', color: { argb: 'FF059669' } },
            left: { style: 'thin', color: { argb: 'FFA7F3D0' } },
            right: { style: 'thin', color: { argb: 'FFA7F3D0' } },
          }
        } else if (entry.highlightType === 'platform') {
          row.font = { bold: true, size: 10, color: { argb: 'FF1E40AF' } }
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFEFF6FF' }, // Blue-50
          }
          for (let col = 1; col <= 4; col++) {
            row.getCell(col).border = {
              top: { style: 'thin', color: { argb: 'FFBFDBFE' } },
              bottom: { style: 'double', color: { argb: 'FF1D4ED8' } },
              left: { style: 'thin', color: { argb: 'FFBFDBFE' } },
              right: { style: 'thin', color: { argb: 'FFBFDBFE' } },
            }
          }
        } else if (entry.highlightType === 'warning') {
          row.font = { bold: true, size: 10, color: { argb: 'FF92400E' } }
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFEF3C7' }, // Amber-100
          }
          for (let col = 1; col <= 4; col++) {
            row.getCell(col).border = {
              top: { style: 'thin', color: { argb: 'FFFDE68A' } },
              bottom: { style: 'thin', color: { argb: 'FFF59E0B' } },
              left: { style: 'thin', color: { argb: 'FFFDE68A' } },
              right: { style: 'thin', color: { argb: 'FFFDE68A' } },
            }
          }
        } else {
          for (let col = 1; col <= 4; col++) {
            row.getCell(col).border = {
              top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            }
          }
        }
      }

      // Column widths for Sheet 2 (4 clean columns)
      summarySheet.getColumn(1).width = 14
      summarySheet.getColumn(2).width = 32
      summarySheet.getColumn(3).width = 65
      summarySheet.getColumn(4).width = 25
    }

    // Generate buffer
    let buffer: Buffer

    if (format === 'csv') {
      const csvContent = await workbook.csv.writeBuffer()
      buffer = Buffer.from(csvContent)
    } else {
      const xlsxContent = await workbook.xlsx.writeBuffer()
      buffer = Buffer.from(xlsxContent)
    }

    // Set headers
    const responseHeaders = new Headers()
    responseHeaders.set(
      'Content-Type',
      format === 'csv'
        ? 'text/csv'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    responseHeaders.set(
      'Content-Disposition',
      `attachment; filename="${filename}.${format}"`
    )

    return new NextResponse(new Uint8Array(buffer), {
      headers: responseHeaders,
    })
  } catch (error) {
    console.error('Error exporting report:', error)
    return NextResponse.json(
      { error: 'Failed to export report' },
      { status: 500 }
    )
  }
}

function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING_PAYMENT: 'Menunggu Pembayaran',
    PAID: 'Dibayar',
    IN_PROGRESS: 'Diproses Toko',
    SHIPPED: 'Dikirim',
    RENTED: 'Disewa',
    RETURNED: 'Dikembalikan',
    COMPLETED: 'Selesai',
    COMPLAINED: 'Komplain',
    CANCELLED: 'Dibatalkan',
  }
  return statusMap[status] || status
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
