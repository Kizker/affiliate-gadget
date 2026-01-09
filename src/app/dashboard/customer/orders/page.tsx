import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/db'
import OrdersClient from './orders-client'

export default async function CustomerOrdersPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  // Pre-fetch orders on server for faster initial load
  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        select: {
          type: true,
          notes: true,
          service: { select: { name: true, category: true } },
          product: { select: { name: true } },
          rentalItem: { select: { name: true } },
        },
      },
      technician: {
        include: {
          user: { select: { name: true, phone: true, image: true } },
        },
      },
      reviews: {
        where: { type: 'TECHNICIAN' },
        take: 1,
        select: { id: true, rating: true, comment: true },
      },
      complaints: {
        select: {
          id: true,
          status: true,
          subject: true,
          description: true,
          images: true,
          resolution: true,
          rejectionNote: true,
          createdAt: true,
          resolvedAt: true,
          assignedTo: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Transform for client
  const ordersData = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status as string,
    total: order.total,
    createdAt: order.createdAt.toISOString(),
    notes: order.notes,
    items: order.items.map((item) => ({
      type: item.type as string,
      notes: item.notes,
      service: item.service
        ? { name: item.service.name, category: item.service.category as string }
        : undefined,
      product: item.product ? { name: item.product.name } : undefined,
      rentalItem: item.rentalItem ? { name: item.rentalItem.name } : undefined,
    })),
    technician: order.technician
      ? {
          id: order.technician.id,
          user: {
            name: order.technician.user.name || 'Teknisi',
            phone: order.technician.user.phone,
            image: order.technician.user.image,
          },
        }
      : undefined,
    review: order.reviews[0]
      ? { rating: order.reviews[0].rating, comment: order.reviews[0].comment }
      : null,
    completedAt: order.completedAt?.toISOString(),
    customerConfirmedAt: order.customerConfirmedAt?.toISOString(),
    complaints: order.complaints.map((c) => ({
      id: c.id,
      status: c.status as string,
      subject: c.subject,
      description: c.description,
      images: c.images,
      resolution: c.resolution,
      rejectionNote: c.rejectionNote,
      createdAt: c.createdAt.toISOString(),
      resolvedAt: c.resolvedAt?.toISOString() ?? null,
      assignedTo: c.assignedTo
        ? { name: c.assignedTo.name || 'Admin', email: c.assignedTo.email }
        : null,
    })),
  }))

  return <OrdersClient initialOrders={ordersData} />
}
