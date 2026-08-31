import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// GET - List complaints
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

    // Role-based filtering
    if (session.user.role === 'CUSTOMER') {
      // Customers only see their own complaints
      where.userId = session.user.id
    } else if (session.user.role === 'STORE_ADMIN') {
      // Store Admins see complaints for their store branch orders
      if (session.user.storeId) {
        where.order = {
          OR: [
            { storeId: session.user.storeId },
            { items: { some: { product: { storeId: session.user.storeId } } } }
          ]
        }
      }
    } else if (session.user.role === 'TECHNICIAN') {
      // Technicians see complaints for orders they handled
      where.order = {
        technicianId: { not: null },
        technician: {
          userId: session.user.id,
        },
      }
    } else if (session.user.role === 'ADMIN') {
      // Platform Admin sees platform complaints
    }
    // SUPER_ADMIN sees all complaints (no filter)

    if (status) {
      where.status = status
    }

    if (orderId) {
      where.orderId = orderId
    }

    const complaints = await prisma.complaint.findMany({
      where,
      include: {
        order: {
          select: {
            orderNumber: true,
            status: true,
            total: true,
            technicianId: true,
            technician: {
              select: {
                user: {
                  select: { name: true, email: true },
                },
              },
            },
            claimedById: true,
            claimedBy: {
              select: { name: true, email: true },
            },
            items: {
              include: {
                service: { select: { name: true } },
                product: { select: { name: true } },
                rentalItem: { select: { name: true } },
              },
            },
          },
        },
        user: {
          select: { name: true, email: true, phone: true },
        },
        assignedTo: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ complaints })
  } catch (error) {
    console.error('Error fetching complaints:', error)
    return NextResponse.json(
      { error: 'Failed to fetch complaints' },
      { status: 500 }
    )
  }
}

// POST - Create new complaint
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { orderId, subject, description, images = [] } = body

    if (!orderId || !subject || !description) {
      return NextResponse.json(
        { error: 'Order ID, subject, and description are required' },
        { status: 400 }
      )
    }

    // Verify order exists and belongs to user
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        status: true,
        completedAt: true,
        updatedAt: true,
        technicianId: true,
        claimedById: true,
        items: { select: { type: true }, take: 1 },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only complain about your own orders' },
        { status: 403 }
      )
    }

    // Check if order is completed
    if (order.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Only completed orders can be complained' },
        { status: 400 }
      )
    }

    // Rental orders cannot be complained
    if (order.items[0]?.type === 'RENTAL') {
      return NextResponse.json(
        { error: 'Fitur komplain tidak tersedia untuk order sewa alat' },
        { status: 400 }
      )
    }

    // Check 7-day window
    const completedDate = order.completedAt || order.updatedAt
    const daysSinceCompleted = Math.floor(
      (Date.now() - completedDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysSinceCompleted > 7) {
      return NextResponse.json(
        { error: 'Complaint window has expired (7 days after completion)' },
        { status: 400 }
      )
    }

    // Check if there's already an ACTIVE complaint (prevent spam, but allow after resolution)
    const activeComplaint = await prisma.complaint.findFirst({
      where: {
        orderId,
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
    })

    if (activeComplaint) {
      return NextResponse.json(
        {
          error:
            'Sudah ada komplain aktif untuk order ini. Harap tunggu tanggapan terlebih dahulu.',
        },
        { status: 400 }
      )
    }

    // Create new complaint (allows history of multiple complaints per order)
    const [complaint] = await prisma.$transaction([
      prisma.complaint.create({
        data: {
          orderId,
          userId: session.user.id,
          subject,
          description,
          images,
          // Auto-assign to technician or admin who handled the order
          assignedToId: order.technicianId
            ? undefined // Will assign via technician's userId
            : order.claimedById || undefined,
        },
        include: {
          order: { select: { orderNumber: true } },
          user: { select: { name: true } },
        },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: { status: 'COMPLAINED' },
      }),
    ])

    // Get technician userId for notification
    let assignedUserId: string | null = null
    if (order.technicianId) {
      const technician = await prisma.technician.findUnique({
        where: { id: order.technicianId },
        select: { userId: true },
      })
      assignedUserId = technician?.userId || null
    } else {
      assignedUserId = order.claimedById
    }

    // Send notification to assigned person
    if (assignedUserId) {
      await prisma.notification.create({
        data: {
          userId: assignedUserId,
          type: 'NEW_COMPLAINT',
          title: 'Komplain Baru',
          message: `Customer mengajukan komplain untuk order #${complaint.order.orderNumber}`,
          link: `/dashboard/teknisi/complaints/${complaint.id}`,
        },
      })
    }

    return NextResponse.json({ complaint }, { status: 201 })
  } catch (error) {
    console.error('Error creating complaint:', error)
    return NextResponse.json(
      { error: 'Failed to create complaint' },
      { status: 500 }
    )
  }
}
