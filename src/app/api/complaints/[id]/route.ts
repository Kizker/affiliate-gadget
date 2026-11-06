import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'

// GET - Get complaint detail
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

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            storeId: true,
            orderNumber: true,
            status: true,
            total: true,
            completedAt: true,
            createdAt: true,
            technicianId: true,
            technician: {
              select: {
                id: true,
                user: {
                  select: { id: true, name: true, email: true, phone: true },
                },
              },
            },
            claimedById: true,
            claimedBy: { select: { id: true, name: true, email: true } },
            items: {
              include: {
                service: { select: { name: true, category: true } },
                product: { select: { name: true, category: true } },
                rentalItem: { select: { name: true } },
              },
            },
          },
        },
        user: { select: { id: true, name: true, email: true, phone: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    })

    if (!complaint) {
      return NextResponse.json(
        { error: 'Complaint not found' },
        { status: 404 }
      )
    }

    // Authorization & IDOR check
    const isOwner = complaint.userId === session.user.id
    const isAssigned = complaint.assignedToId === session.user.id
    const isTechnicianForOrder =
      complaint.order.technician?.user.id === session.user.id
    const isPlatformAdmin =
      session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN'

    let isStoreAdminForOrder = false
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
      isStoreAdminForOrder = Boolean(
        storeId && complaint.order.storeId === storeId
      )
    }

    if (
      !isOwner &&
      !isAssigned &&
      !isTechnicianForOrder &&
      !isPlatformAdmin &&
      !isStoreAdminForOrder
    ) {
      return NextResponse.json(
        { error: 'Complaint not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ complaint })
  } catch (error) {
    console.error('Error fetching complaint:', error)
    return NextResponse.json(
      { error: 'Failed to fetch complaint' },
      { status: 500 }
    )
  }
}

// PATCH - Update complaint (status, resolution, rejection)
export async function PATCH(
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
    const { status, resolution, rejectionNote } = body

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            storeId: true,
            technicianId: true,
            technician: { select: { userId: true } },
            claimedById: true,
          },
        },
        user: { select: { id: true, name: true } },
      },
    })

    if (!complaint) {
      return NextResponse.json(
        { error: 'Complaint not found' },
        { status: 404 }
      )
    }

    // Check authorization - only technician, assigned person, or authorized admin can update
    const isTechnicianForOrder =
      complaint.order.technician?.userId === session.user.id
    const isAssigned = complaint.assignedToId === session.user.id
    const isClaimedAdmin = complaint.order.claimedById === session.user.id
    const isPlatformAdmin =
      session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN'

    let isStoreAdminForOrder = false
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
      isStoreAdminForOrder = Boolean(
        storeId && complaint.order.storeId === storeId
      )
    }

    if (
      !isTechnicianForOrder &&
      !isAssigned &&
      !isClaimedAdmin &&
      !isPlatformAdmin &&
      !isStoreAdminForOrder
    ) {
      return NextResponse.json(
        { error: 'Complaint not found' },
        { status: 404 }
      )
    }

    // Build update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {}

    if (status) {
      updateData.status = status

      // Auto-assign if taking over
      if (status === 'IN_PROGRESS' && !complaint.assignedToId) {
        updateData.assignedToId = session.user.id
      }

      // Set resolvedAt if resolving/rejecting
      if (status === 'RESOLVED' || status === 'REJECTED') {
        updateData.resolvedAt = new Date()
      }
    }

    if (resolution) {
      updateData.resolution = resolution
    }

    if (rejectionNote) {
      updateData.rejectionNote = rejectionNote
    }

    // Update complaint
    const updatedComplaint = await prisma.complaint.update({
      where: { id },
      data: updateData,
      include: {
        order: { select: { id: true, orderNumber: true } },
        user: { select: { id: true, name: true } },
      },
    })

    // If complaint is resolved/rejected, update order status back to COMPLETED
    if (status === 'RESOLVED' || status === 'REJECTED') {
      await prisma.order.update({
        where: { id: complaint.orderId },
        data: { status: 'COMPLETED' },
      })

      // Notify customer
      await prisma.notification.create({
        data: {
          userId: complaint.userId,
          type: 'COMPLAINT_RESOLVED',
          title:
            status === 'RESOLVED'
              ? 'Komplain Diselesaikan'
              : 'Komplain Ditolak',
          message:
            status === 'RESOLVED'
              ? `Komplain Anda untuk order #${updatedComplaint.order.orderNumber} telah diselesaikan`
              : `Komplain Anda untuk order #${updatedComplaint.order.orderNumber} ditolak: ${rejectionNote || 'Tidak valid'}`,
          link: `/dashboard/customer/orders`,
        },
      })

      if (status === 'RESOLVED') {
        try {
          const { sendOrderCompletedEmail } = await import('@/lib/email')
          await sendOrderCompletedEmail({ orderId: complaint.orderId })
        } catch (emailErr) {
          console.error(
            'Failed to send order completed email on complaint resolution:',
            emailErr
          )
        }
      }
    }

    return NextResponse.json({ complaint: updatedComplaint })
  } catch (error) {
    console.error('Error updating complaint:', error)
    return NextResponse.json(
      { error: 'Failed to update complaint' },
      { status: 500 }
    )
  }
}
