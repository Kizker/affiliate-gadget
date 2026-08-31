import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/db'
import Link from 'next/link'
import { Package } from 'lucide-react'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import OrderDetailClient from './order-detail-client'

interface Props {
  params: Promise<{ orderId: string }>
}

export default async function CustomerOrderDetailPage({ params }: Props) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const { orderId } = await params

  // Fetch order data on server for faster initial load
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
      userId: session.user.id, // Ensure user owns this order
    },
    include: {
      items: {
        include: {
          service: { select: { id: true, name: true, category: true } },
          product: { select: { id: true, name: true, images: true, brand: true } },
          rentalItem: { select: { id: true, name: true, images: true } },
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
      },
      returnRequests: {
        select: {
          id: true,
          type: true,
          reason: true,
          reasonLabel: true,
          description: true,
          images: true,
          videoUrl: true,
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
      },
      reviews: {
        where: { type: 'TECHNICIAN' },
        take: 1,
        select: { rating: true, comment: true },
      },
    },
  })

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Navbar variant="light" />
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="text-center">
            <Package className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <h2 className="mb-2 text-xl font-bold text-gray-900">
              Pesanan tidak ditemukan
            </h2>
            <Link
              href="/dashboard/customer/orders"
              className="text-orange-600 hover:underline"
            >
              Kembali ke Pesanan Saya
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Transform for client component - convert nulls to undefined and enums to strings
  const orderData = {
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
    bonusChargerIncluded: order.bonusChargerIncluded,
    bonusProtectorIncluded: order.bonusProtectorIncluded,
    bonusCaseIncluded: order.bonusCaseIncluded,
    warrantyExpiryDate: order.warrantyExpiryDate?.toISOString() ?? null,
    customerConfirmedAt: order.customerConfirmedAt?.toISOString() ?? null,
    completedAt: order.completedAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    notes: order.notes,
    paymentStatus: order.status === 'PENDING_PAYMENT' ? 'PENDING' : 'PAID',
    store: order.store
      ? {
          id: order.store.id,
          name: order.store.name,
          ptName: order.store.companyName,
          city: order.store.city,
          address: order.store.address,
          phone: order.store.phone,
        }
      : null,
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
      videoUrl: r.videoUrl,
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
    items: order.items.map((item) => ({
      id: item.id,
      type: item.type as string,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
      notes: item.notes ?? undefined,
      service: item.service
        ? {
            id: item.service.id,
            name: item.service.name,
            category: item.service.category as string,
          }
        : undefined,
      product: item.product
        ? {
            id: item.product.id,
            name: item.product.name,
            brand: item.product.brand,
            slug: item.product.id,
            images: item.product.images,
          }
        : undefined,
      rentalItem: item.rentalItem
        ? {
            id: item.rentalItem.id,
            name: item.rentalItem.name,
            slug: item.rentalItem.id,
            images: item.rentalItem.images,
          }
        : undefined,
    })),
    review: order.reviews[0] ?? null,
  }

  return <OrderDetailClient order={orderData} />
}
