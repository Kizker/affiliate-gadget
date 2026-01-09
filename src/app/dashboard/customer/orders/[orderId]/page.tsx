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
          product: { select: { id: true, name: true, images: true } },
          rentalItem: { select: { id: true, name: true, images: true } },
        },
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
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    notes: order.notes,
    paymentStatus: 'PAID',
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
