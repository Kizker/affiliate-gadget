'use client'

import Link from 'next/link'
import {
  Package,
  Calendar,
  CreditCard,
  ExternalLink,
  ChevronRight,
} from 'lucide-react'

interface OrderItem {
  type?: string
  quantity: number
  product?: { name: string }
  service?: { name: string }
  rentalItem?: { name: string }
}

interface OrderData {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  items: OrderItem[]
}

interface OrderReferenceCardProps {
  order: OrderData
  variant?: 'compact' | 'full'
}

const statusColors: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  PENDING_PAYMENT: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    label: 'Menunggu Pembayaran',
  },
  PAID: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Dibayar' },
  IN_PROGRESS: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    label: 'Diproses',
  },
  SHIPPED: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Dikirim' },
  RENTED: { bg: 'bg-cyan-100', text: 'text-cyan-800', label: 'Disewa' },
  RETURNED: { bg: 'bg-teal-100', text: 'text-teal-800', label: 'Dikembalikan' },
  COMPLETED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Selesai' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Dibatalkan' },
}

export default function OrderReferenceCard({
  order,
  variant = 'full',
}: OrderReferenceCardProps) {
  const statusInfo = statusColors[order.status] || statusColors.PENDING_PAYMENT

  // Get first item name and count other items
  const firstItem = order.items[0]
  const firstItemName =
    firstItem?.product?.name ||
    firstItem?.service?.name ||
    firstItem?.rentalItem?.name ||
    'Item'
  const otherItemsCount = order.items.length - 1

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  if (variant === 'compact') {
    return (
      <Link
        href={`/dashboard/customer/orders/${order.id}`}
        className="block rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-3 transition-all hover:border-blue-400 hover:shadow-md"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Package className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-gray-900">
                {order.orderNumber}
              </p>
              <p className="truncate text-xs text-gray-600">
                {firstItemName}
                {otherItemsCount > 0 && ` +${otherItemsCount} lainnya`}
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
        </div>
      </Link>
    )
  }

  return (
    <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4 shadow-sm">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Referensi Pesanan
            </p>
            <p className="text-xs text-gray-500">
              Detail pesanan terkait chat ini
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.bg} ${statusInfo.text}`}
        >
          {statusInfo.label}
        </span>
      </div>

      {/* Order Details */}
      <div className="space-y-2 rounded-lg bg-white p-3 shadow-sm">
        {/* Order Number */}
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-gray-400" />
          <span className="text-xs text-gray-500">Nomor Pesanan:</span>
          <span className="text-sm font-semibold text-gray-900">
            {order.orderNumber}
          </span>
        </div>

        {/* Items */}
        <div className="flex items-start gap-2">
          <Package className="mt-0.5 h-4 w-4 text-gray-400" />
          <div className="min-w-0 flex-1">
            <span className="text-xs text-gray-500">Item:</span>
            <p className="truncate text-sm font-medium text-gray-900">
              {firstItemName}
              {otherItemsCount > 0 && (
                <span className="ml-1 text-xs text-gray-500">
                  +{otherItemsCount} item lainnya
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-xs text-gray-500">Tanggal:</span>
          <span className="text-sm text-gray-900">
            {formatDate(order.createdAt)}
          </span>
        </div>

        {/* Total */}
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-gray-400" />
          <span className="text-xs text-gray-500">Total:</span>
          <span className="text-sm font-bold text-blue-600">
            {formatPrice(order.total)}
          </span>
        </div>
      </div>

      {/* View Details Button */}
      <Link
        href={`/dashboard/customer/orders/${order.id}`}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-md"
      >
        <ExternalLink className="h-4 w-4" />
        Lihat Detail Pesanan
      </Link>
    </div>
  )
}
