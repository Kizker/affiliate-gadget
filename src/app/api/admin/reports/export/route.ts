import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import ExcelJS from 'exceljs'
import {
  getColumnFormatAndAlignment,
  CURRENCY_FORMAT,
} from '@/lib/reports-export-format'

interface FinancialOrderRecord {
  id: string
  orderNumber: string
  status: any
  createdAt: Date
  commissionAmount: number | null
  discountAmount: number | null
  shippingCost: number | null
  insuranceFee: number | null
  tax?: number | null
  dppAmount?: number | null
  vatRate?: number | null
  taxTypeApplied?: string | null
  pph23Amount?: number | null
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
  }>
}

interface OrdersExportRecord {
  id: string
  orderNumber: string
  status: any
  createdAt: Date
  subtotal: number
  total: number
  tax?: number | null
  dppAmount?: number | null
  vatRate?: number | null
  taxTypeApplied?: string | null
  pph23Amount?: number | null
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

    const dateFilter: {
      createdAt?: {
        gte: Date
        lte: Date
      }
    } = {}
    if (startDate && endDate) {
      const s = new Date(startDate)
      const e = new Date(endDate)
      if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
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
      type === 'financials' || type === 'pnl' ? 'Laporan_Keuangan' : 'Pesanan'
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
    let taxSummaryData: {
      sumPpn: number
      sumPph23: number
    } | null = null

    switch (type) {
      case 'financials':
      case 'pnl': {
        const rawFinancialOrders = await prisma.order.findMany({
          where: {
            status: { in: [...REVENUE_STATUSES] },
            ...dateFilter,
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
          'DPP (Rp)',
          'PPN 11% (Rp)',
          'Skema PPN',
          'PPh 23 Komisi (Rp)',
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
        let sumDpp = 0
        let sumPpn = 0
        let sumPph23 = 0
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
            const grossRevenue = order.items.reduce(
              (sum: number, item: any) =>
                sum + item.price * (item.quantity || 1),
              0
            )
            const cogs = order.items.reduce(
              (sum: number, item: any) =>
                sum + (item.costPrice ?? 0) * (item.quantity || 1),
              0
            )
            const grossProfit = grossRevenue - cogs
            const grossMargin =
              grossRevenue > 0
                ? Number(((grossProfit / grossRevenue) * 100).toFixed(2))
                : 0

            const ppn = order.tax ?? 0
            const dpp =
              order.dppAmount && order.dppAmount > 0
                ? order.dppAmount
                : ppn > 0
                  ? Math.max(0, grossRevenue - ppn)
                  : grossRevenue
            const taxScheme =
              order.taxTypeApplied === 'INCLUSIVE' || ppn > 0
                ? 'Inklusif'
                : 'Non-PKP'
            const pph23 = order.pph23Amount ?? 0

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
            sumDpp += dpp
            sumPpn += ppn
            sumPph23 += pph23
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
              .map((i: any) => i.product?.name || i.variantName || 'Gadget')
              .join('; ')

            return [
              index + 1,
              order.orderNumber,
              order.store?.companyName || order.store?.name || '-',
              formatDate(order.createdAt),
              formatStatus(order.status),
              productNames,
              totalQty,
              grossRevenue,
              dpp,
              ppn,
              taxScheme,
              pph23,
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
            sumDpp,
            sumPpn,
            '-',
            sumPph23,
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

        taxSummaryData = {
          sumPpn,
          sumPph23,
        }
        break
      }

      case 'orders': {
        const rawOrders = await prisma.order.findMany({
          where: {
            ...dateFilter,
            ...storeScope,
          },
          include: {
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
          'Customer',
          'Email',
          'Phone',
          'Items',
          'Qty',
          'Status',
          'DPP (Rp)',
          'PPN 11% (Rp)',
          'Skema PPN',
          'PPh 23 (Rp)',
          'Total (Rp)',
          'Created At',
        ]

        let totalDpp = 0
        let totalPpn = 0
        let totalPph23 = 0
        let totalQty = 0
        let totalAmount = 0

        rows = orders.map((order, index) => {
          const ppn = order.tax ?? 0
          const dpp =
            order.dppAmount && order.dppAmount > 0
              ? order.dppAmount
              : ppn > 0
                ? Math.max(0, order.subtotal - ppn)
                : order.subtotal
          const taxScheme =
            order.taxTypeApplied === 'INCLUSIVE' || ppn > 0
              ? 'Inklusif'
              : 'Non-PKP'
          const pph23 = order.pph23Amount ?? 0
          const qty = order.items.reduce((sum, item) => sum + item.quantity, 0)

          totalDpp += dpp
          totalPpn += ppn
          totalPph23 += pph23
          totalQty += qty
          totalAmount += order.total

          return [
            index + 1,
            order.orderNumber,
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
            dpp,
            ppn,
            taxScheme,
            pph23,
            order.total,
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
            totalQty,
            '-',
            totalDpp,
            totalPpn,
            '-',
            totalPph23,
            totalAmount,
            '-',
          ])
        }
        break
      }

      default:
        return NextResponse.json(
          {
            error:
              'Tipe laporan tidak valid. Hanya mendukung laporan keuangan (financials) dan pesanan (orders).',
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

    // Buat Sheet ke-2: RINGKASAN_PAJAK (hanya jika export financials dalam format xlsx)
    if (taxSummaryData && format === 'xlsx') {
      const taxSheet = workbook.addWorksheet('RINGKASAN_PAJAK')
      const taxHeaders = [
        'No',
        'Komponen Pajak',
        'Keterangan Regulasi & Penyetoran',
        'Total Periode (Rp)',
      ]
      taxSheet.addRow(taxHeaders)

      const taxHeaderRow = taxSheet.getRow(1)
      taxHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
      taxHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3A8A' },
      }
      taxHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' }
      taxHeaderRow.height = 28

      const taxRows = [
        [
          1,
          'PPN Keluaran (11%)',
          'SPT Masa PPN per bulan (Faktur Pajak Elektronik)',
          taxSummaryData.sumPpn,
        ],
        [
          2,
          'PPh 23 atas Komisi Platform (2%)',
          'e-Billing DJP (Kode Akun 411124), Batas Setor Tgl 10 Bulan Berikutnya',
          taxSummaryData.sumPph23,
        ],
      ]

      taxRows.forEach((r) => taxSheet.addRow(r))

      // Baris TOTAL
      const totalTax = taxSummaryData.sumPpn + taxSummaryData.sumPph23

      taxSheet.addRow(['TOTAL', 'Total Seluruh Pajak', '-', totalTax])

      // Format dan border tiap baris
      for (let rIdx = 2; rIdx <= taxRows.length + 2; rIdx++) {
        const row = taxSheet.getRow(rIdx)
        const isTot = row.getCell(1).value === 'TOTAL'
        row.height = isTot ? 26 : 22

        if (isTot) {
          row.font = { bold: true, size: 10, color: { argb: 'FF0F172A' } }
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF1F5F9' },
          }
        } else if (rIdx % 2 === 0) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' },
          }
        }

        const c1 = row.getCell(1)
        c1.alignment = { horizontal: 'center', vertical: 'middle' }

        const c2 = row.getCell(2)
        c2.alignment = { horizontal: 'left', vertical: 'middle' }

        const c3 = row.getCell(3)
        c3.alignment = isTot
          ? { horizontal: 'center', vertical: 'middle' }
          : { horizontal: 'left', vertical: 'middle' }

        const c4 = row.getCell(4)
        c4.numFmt = CURRENCY_FORMAT
        c4.alignment = { horizontal: 'right', vertical: 'middle' }

        for (let c = 1; c <= 4; c++) {
          const cell = row.getCell(c)
          if (isTot) {
            cell.border = {
              top: { style: 'thin', color: { argb: 'FF94A3B8' } },
              bottom: { style: 'double', color: { argb: 'FF0F172A' } },
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

      // Column widths
      taxSheet.getColumn(1).width = 10
      taxSheet.getColumn(2).width = 35
      taxSheet.getColumn(3).width = 72
      taxSheet.getColumn(4).width = 25
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
