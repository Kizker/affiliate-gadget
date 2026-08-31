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
          quantity: true,
          price: true,
          subtotal: true,
          service: { select: { name: true, category: true } },
          product: { select: { id: true, name: true, brand: true, images: true } },
          rentalItem: { select: { name: true, images: true } },
        },
      },
      store: {
        select: {
          id: true,
          name: true,
          companyName: true,
          city: true,
          phone: true,
        },
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
      returnRequests: {
        select: {
          id: true,
          type: true,
          reason: true,
          reasonLabel: true,
          description: true,
          images: true,
          bankName: true,
          bankAccountNumber: true,
          bankAccountName: true,
          refundAmount: true,
          status: true,
          storeResponse: true,
          returnCourier: true,
          returnTrackingNumber: true,
          createdAt: true,
          resolvedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      reviews: {
        take: 1,
        select: { id: true, rating: true, comment: true },
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
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    insuranceFee: order.insuranceFee,
    courierCode: order.courierCode,
    courierService: order.courierService,
    trackingNumber: order.trackingNumber,
    warrantyExpiryDate: order.warrantyExpiryDate?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
    notes: order.notes,
    store: order.store
      ? {
          id: order.store.id,
          name: order.store.name,
          ptName: order.store.companyName,
          city: order.store.city,
          phone: order.store.phone,
        }
      : null,
    items: order.items.map((item) => ({
      type: item.type as string,
      notes: item.notes,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
      service: item.service
        ? { name: item.service.name, category: item.service.category as string }
        : undefined,
      product: item.product
        ? {
            id: item.product.id,
            name: item.product.name,
            brand: item.product.brand,
            images: item.product.images,
          }
        : undefined,
      rentalItem: item.rentalItem
        ? { name: item.rentalItem.name, images: item.rentalItem.images }
        : undefined,
    })),
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
    returnRequests: order.returnRequests.map((r) => ({
      id: r.id,
      type: r.type as string,
      reason: r.reason,
      reasonLabel: r.reasonLabel,
      description: r.description,
      images: r.images,
      bankName: r.bankName,
      bankAccountNumber: r.bankAccountNumber,
      bankAccountName: r.bankAccountName,
      refundAmount: r.refundAmount,
      status: r.status as string,
      storeResponse: r.storeResponse,
      returnCourier: r.returnCourier,
      returnTrackingNumber: r.returnTrackingNumber,
      createdAt: r.createdAt.toISOString(),
      resolvedAt: r.resolvedAt?.toISOString() ?? null,
    })),
  }))

  return <OrdersClient initialOrders={ordersData} />
}
