import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/../auth'
import prisma from '@/lib/db'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
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

    type ReportRow = Record<string, string | number>
    let data: ReportRow[] = []
    const filename = `report_${type}_${new Date().toISOString().split('T')[0]}`

    switch (type) {
      case 'orders':
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

        data = orders.map((order) => ({
          'Order Number': order.orderNumber,
          'Customer Name': order.user.name || '-',
          'Customer Email': order.user.email,
          'Customer Phone': order.user.phone || '-',
          Items: order.items
            .map(
              (item) =>
                item.product?.name ||
                item.service?.name ||
                item.rentalItem?.name
            )
            .join(', '),
          Status: order.status,
          'Total (Rp)': order.total,
          'Created At': new Date(order.createdAt).toLocaleString('id-ID'),
        }))
        break

      case 'revenue':
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
          },
        })

        data = revenueOrders.map((order) => {
          const category = order.items.some((i) => i.service)
            ? 'JASA'
            : order.items.some((i) => i.product)
              ? 'SPAREPART'
              : 'SEWA'

          return {
            'Order Number': order.orderNumber,
            Category: category,
            Status: order.status,
            'Total (Rp)': order.total,
            Date: new Date(order.createdAt).toLocaleDateString('id-ID'),
          }
        })
        break

      case 'technicians':
        const technicians = await prisma.technician.findMany({
          include: {
            user: {
              select: { name: true, email: true },
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

        data = technicians.map((tech) => ({
          Name: tech.user.name || '-',
          Email: tech.user.email,
          Specialties: tech.specialties.join(', '),
          'Experience (years)': tech.experience,
          'Total Orders': tech._count.orders,
          'Total Revenue (Rp)': tech.orders.reduce(
            (sum, order) => sum + order.total,
            0
          ),
          Rating: tech.rating.toFixed(2),
          'Total Reviews': tech.totalReview,
          Available: tech.isAvailable ? 'Yes' : 'No',
        }))
        break

      case 'products':
        const products = await prisma.product.findMany({
          include: {
            _count: {
              select: { orderItems: true },
            },
          },
        })

        data = products.map((product) => ({
          Name: product.name,
          Category: product.category,
          Brand: product.brand || '-',
          Model: product.model || '-',
          'Price (Rp)': product.price,
          Stock: product.stock,
          'Times Sold': product._count.orderItems,
          Active: product.isActive ? 'Yes' : 'No',
        }))
        break

      case 'customers':
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
        })

        data = customers.map((customer) => ({
          Name: customer.name || '-',
          Email: customer.email,
          Phone: customer.phone || '-',
          'Total Orders': customer._count.orders,
          'Total Spending (Rp)': customer.orders.reduce(
            (sum, order) => sum + order.total,
            0
          ),
          'Joined Date': new Date(customer.createdAt).toLocaleDateString(
            'id-ID'
          ),
          Active: customer.isActive ? 'Yes' : 'No',
        }))
        break

      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        )
    }

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, type.toUpperCase())

    // Generate buffer
    const buffer =
      format === 'csv'
        ? Buffer.from(XLSX.utils.sheet_to_csv(worksheet))
        : Buffer.from(
            XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
          )

    // Set headers
    const headers = new Headers()
    headers.set(
      'Content-Type',
      format === 'csv'
        ? 'text/csv'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    headers.set(
      'Content-Disposition',
      `attachment; filename="${filename}.${format}"`
    )

    return new NextResponse(buffer, { headers })
  } catch (error) {
    console.error('Error exporting report:', error)
    return NextResponse.json(
      { error: 'Failed to export report' },
      { status: 500 }
    )
  }
}
