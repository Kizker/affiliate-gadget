import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import ExcelJS from 'exceljs'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
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
      dateFilter.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'HaloTekno'
    workbook.created = new Date()

    const filename = `HaloTekno_${type}_${new Date().toISOString().split('T')[0]}`
    let sheetName = type.toUpperCase()

    // Get data based on type
    let headers: string[] = []
    let rows: (string | number)[][] = []

    switch (type) {
      case 'orders': {
        const orders = await prisma.order.findMany({
          where: dateFilter,
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

        sheetName = 'ORDERS'
        headers = [
          'No',
          'Order Number',
          'Customer',
          'Email',
          'Phone',
          'Items',
          'Qty',
          'Status',
          'Total (Rp)',
          'Created At',
        ]
        rows = orders.map((order, index) => [
          index + 1,
          order.orderNumber,
          order.user.name || '-',
          order.user.email,
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
          order.items.reduce((sum, item) => sum + item.quantity, 0),
          formatStatus(order.status),
          order.total,
          formatDate(order.createdAt),
        ])
        break
      }

      case 'revenue': {
        const revenueOrders = await prisma.order.findMany({
          where: {
            status: { in: ['PAID', 'IN_PROGRESS', 'COMPLETED'] },
            ...dateFilter,
          },
          include: {
            items: {
              include: {
                service: true,
                product: true,
                rentalItem: true,
              },
            },
            user: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
        })

        sheetName = 'REVENUE'
        headers = [
          'No',
          'Order Number',
          'Customer',
          'Category',
          'Status',
          'Revenue (Rp)',
          'Date',
        ]
        rows = revenueOrders.map((order, index) => {
          const category = order.items.some((i) => i.service)
            ? 'Jasa Servis'
            : order.items.some((i) => i.product)
              ? 'Sparepart'
              : 'Sewa Alat'

          return [
            index + 1,
            order.orderNumber,
            order.user.name || '-',
            category,
            formatStatus(order.status),
            order.total,
            formatDate(order.createdAt),
          ]
        })
        break
      }

      case 'technicians': {
        const technicians = await prisma.technician.findMany({
          include: {
            user: {
              select: { name: true, email: true, phone: true },
            },
            orders: {
              where: {
                status: { in: ['PAID', 'IN_PROGRESS', 'COMPLETED'] },
                ...dateFilter,
              },
            },
            _count: {
              select: { orders: true },
            },
          },
        })

        sheetName = 'TECHNICIANS'
        headers = [
          'No',
          'Name',
          'Email',
          'Phone',
          'Specialties',
          'Exp (Years)',
          'Orders',
          'Revenue (Rp)',
          'Rating',
          'Reviews',
          'Available',
        ]

        const technicianData = technicians
          .map((tech) => ({
            name: tech.user.name || '-',
            email: tech.user.email,
            phone: tech.user.phone || '-',
            specialties: tech.specialties.join(', '),
            experience: tech.experience,
            totalOrders: tech._count.orders,
            totalRevenue: tech.orders.reduce(
              (sum, order) => sum + order.total,
              0
            ),
            rating: tech.rating,
            totalReviews: tech.totalReview,
            available: tech.isAvailable,
          }))
          .sort((a, b) => b.totalOrders - a.totalOrders)

        rows = technicianData.map((tech, index) => [
          index + 1,
          tech.name,
          tech.email,
          tech.phone,
          tech.specialties,
          tech.experience,
          tech.totalOrders,
          tech.totalRevenue,
          Number(tech.rating.toFixed(2)),
          tech.totalReviews,
          tech.available ? 'Ya' : 'Tidak',
        ])
        break
      }

      case 'products': {
        const products = await prisma.product.findMany({
          include: {
            _count: {
              select: { orderItems: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        })

        sheetName = 'PRODUCTS'
        headers = [
          'No',
          'Name',
          'Category',
          'Brand',
          'Model',
          'Price (Rp)',
          'Stock',
          'Sold',
          'Status',
        ]
        rows = products.map((product, index) => [
          index + 1,
          product.name,
          product.category,
          product.brand || '-',
          product.model || '-',
          product.price,
          product.stock,
          product._count.orderItems,
          product.isActive ? 'Aktif' : 'Nonaktif',
        ])
        break
      }

      case 'customers': {
        const customers = await prisma.user.findMany({
          where: {
            role: 'CUSTOMER',
            ...dateFilter,
          },
          include: {
            _count: {
              select: { orders: true },
            },
            orders: {
              where: {
                status: { in: ['PAID', 'IN_PROGRESS', 'COMPLETED'] },
              },
              select: {
                total: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        })

        sheetName = 'CUSTOMERS'
        headers = [
          'No',
          'Name',
          'Email',
          'Phone',
          'Orders',
          'Spending (Rp)',
          'Joined',
          'Status',
        ]
        rows = customers.map((customer, index) => [
          index + 1,
          customer.name || '-',
          customer.email,
          customer.phone || '-',
          customer._count.orders,
          customer.orders.reduce((sum, order) => sum + order.total, 0),
          formatDate(customer.createdAt),
          customer.isActive ? 'Aktif' : 'Nonaktif',
        ])
        break
      }

      case 'services': {
        const serviceOrders = await prisma.orderItem.findMany({
          where: {
            serviceId: { not: null },
            order: {
              status: { in: ['PAID', 'IN_PROGRESS', 'COMPLETED'] },
              ...dateFilter,
            },
          },
          include: {
            service: true,
          },
        })

        const serviceStats = new Map<
          string,
          { name: string; count: number; revenue: number }
        >()
        serviceOrders.forEach((item) => {
          if (item.service) {
            const existing = serviceStats.get(item.serviceId!) || {
              name: item.service.name,
              count: 0,
              revenue: 0,
            }
            existing.count += item.quantity
            existing.revenue += item.price * item.quantity
            serviceStats.set(item.serviceId!, existing)
          }
        })

        sheetName = 'SERVICES'
        headers = ['No', 'Service Name', 'Total Orders', 'Revenue (Rp)']
        rows = Array.from(serviceStats.entries())
          .map(([, stats]) => ({
            name: stats.name,
            count: stats.count,
            revenue: stats.revenue,
          }))
          .sort((a, b) => b.count - a.count)
          .map((stats, index) => [
            index + 1,
            stats.name,
            stats.count,
            stats.revenue,
          ])
        break
      }

      case 'rentals': {
        const rentalItems = await prisma.rentalItem.findMany({
          include: {
            _count: {
              select: { orderItems: true },
            },
            orderItems: {
              where: {
                order: {
                  status: { in: ['PAID', 'IN_PROGRESS', 'COMPLETED'] },
                  ...dateFilter,
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        })

        sheetName = 'RENTALS'
        headers = [
          'No',
          'Name',
          'Price/Day (Rp)',
          'Stock',
          'Total Rentals',
          'Revenue (Rp)',
        ]
        rows = rentalItems.map((item, index) => [
          index + 1,
          item.name,
          item.pricePerDay,
          item.stock,
          item._count.orderItems,
          item.orderItems.reduce((sum, oi) => sum + oi.price * oi.quantity, 0),
        ])
        break
      }

      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        )
    }

    // Create worksheet with styling
    const worksheet = workbook.addWorksheet(sheetName)

    // Add header row
    worksheet.addRow(headers)

    // Style header row
    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' }, // Blue
    }
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' }
    headerRow.height = 25

    // Add data rows
    rows.forEach((row) => {
      worksheet.addRow(row)
    })

    // Style all data rows - center aligned
    for (let i = 2; i <= rows.length + 1; i++) {
      const row = worksheet.getRow(i)
      row.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true,
      }
      row.height = 22

      // Alternate row colors
      if (i % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' }, // Light gray
        }
      }
    }

    // Auto-fit column widths
    worksheet.columns.forEach((column, index) => {
      let maxLength = headers[index]?.length || 10
      rows.forEach((row) => {
        const cellValue = row[index]
        const cellLength = String(cellValue || '').length
        if (cellLength > maxLength) {
          maxLength = cellLength
        }
      })
      column.width = Math.min(maxLength + 4, 50)
    })

    // Add borders to all cells
    const lastRow = rows.length + 1
    const lastCol = headers.length
    for (let row = 1; row <= lastRow; row++) {
      for (let col = 1; col <= lastCol; col++) {
        const cell = worksheet.getCell(row, col)
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        }
      }
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
    IN_PROGRESS: 'Diproses',
    COMPLETED: 'Selesai',
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
