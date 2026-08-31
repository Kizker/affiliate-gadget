'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layouts/navbar'
import Link from 'next/link'
import {
  Calendar,
  CreditCard,
  ArrowRight,
  Loader2,
  Copy,
  Check,
  Hammer,
  Shield,
} from 'lucide-react'
import { toast } from 'sonner'

interface OrderDetails {
  id: string
  orderNumber: string
  total: number
  subtotal: number
  status: string
  createdAt: string
  items: Array<{
    id: string
    quantity: number
    rentalDays: number | null
    price: number
    subtotal: number
    rentalItem?: {
      id: string
      name: string
      images: string[]
      pricePerDay: number
      depositAmount?: number
    }
  }>
}

export default function RentalConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { status } = useSession()
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [orderId, setOrderId] = useState<string>('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    params.then((p) => setOrderId(p.orderId))
  }, [params])

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`)
      if (res.ok) {
        const data = await res.json()
        setOrder(data.order)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && orderId) {
      fetchOrder()
    }
  }, [status, orderId, router, fetchOrder])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(order?.orderNumber || '')
    setCopied(true)
    toast.success('Nomor pesanan disalin!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <Hammer className="h-16 w-16 text-gray-300" />
        <h2 className="mt-4 text-xl font-bold text-gray-900">
          Pesanan tidak ditemukan
        </h2>
        <Link
          href="/"
          className="mt-4 text-purple-600 hover:underline"
        >
          Kembali ke Beranda
        </Link>
      </div>
    )
  }

  const rentalItem = order.items[0]
  const equipment = rentalItem?.rentalItem
  const rentalDays = rentalItem?.rentalDays || 1
  const deposit = equipment?.depositAmount || (equipment?.pricePerDay || 0) * 10

  const startDate = new Date(order.createdAt)
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + rentalDays)

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Navbar variant="light" />

      <main className="container mx-auto flex flex-1 items-center justify-center px-3 py-4 pt-16">
        <div className="w-full max-w-md">
          {/* Main Card */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
            {/* Order Number Header */}
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-purple-100">Nomor Pesanan</p>
                  <p className="text-base font-bold text-white">
                    {order.orderNumber}
                  </p>
                </div>
                <button
                  onClick={copyOrderNumber}
                  className="flex items-center gap-1 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-white/30"
                >
                  {copied ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {copied ? 'Tersalin!' : 'Salin'}
                </button>
              </div>
            </div>

            {/* Equipment Info */}
            <div className="border-b border-gray-100 p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Hammer className="h-4 w-4 text-purple-600" />
                Alat Sewa
              </div>
              <div className="flex gap-3">
                {equipment?.images?.[0] ? (
                  <img
                    src={equipment.images[0]}
                    alt={equipment.name}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100">
                    <Hammer className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-gray-900">
                    {equipment?.name || 'Alat'}
                  </h3>
                  <span className="mt-1 inline-block rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                    {rentalDays} hari sewa
                  </span>
                  <p className="mt-1 text-lg font-bold text-purple-600">
                    {formatCurrency(equipment?.pricePerDay || 0)}
                    <span className="text-xs font-normal text-gray-500">
                      /hari
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Rental Period */}
            <div className="border-b border-gray-100 p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Calendar className="h-4 w-4 text-blue-600" />
                Periode Sewa
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-green-50 p-2 text-center">
                  <p className="text-xs text-gray-500">Mulai</p>
                  <p className="text-sm font-bold text-green-700">
                    {startDate.toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>
                <div className="rounded-lg bg-red-50 p-2 text-center">
                  <p className="text-xs text-gray-500">Kembali</p>
                  <p className="text-sm font-bold text-red-700">
                    {endDate.toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-gray-50 p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <CreditCard className="h-4 w-4 text-green-600" />
                Pembayaran
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Sewa ({rentalDays} hari)</span>
                  <span>{formatCurrency(rentalItem?.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3 text-blue-500" />
                    Deposit
                  </span>
                  <span>{formatCurrency(deposit)}</span>
                </div>
                <div className="mt-2 flex justify-between border-t border-gray-200 pt-2">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-purple-600">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>
              <p className="mt-1 text-right text-xs text-gray-500">
                *Deposit dikembalikan saat alat kembali
              </p>
            </div>

            {/* Status Badge */}
            <div
              className={`border-t px-3 py-2 ${
                order.status === 'PENDING_PAYMENT'
                  ? 'border-yellow-100 bg-yellow-50'
                  : order.status === 'PAID'
                    ? 'border-blue-100 bg-blue-50'
                    : order.status === 'IN_PROGRESS'
                      ? 'border-purple-100 bg-purple-50'
                      : order.status === 'SHIPPED'
                        ? 'border-orange-100 bg-orange-50'
                        : order.status === 'RENTED'
                          ? 'border-cyan-100 bg-cyan-50'
                          : order.status === 'RETURNED'
                            ? 'border-indigo-100 bg-indigo-50'
                            : order.status === 'COMPLETED'
                              ? 'border-green-100 bg-green-50'
                              : 'border-red-100 bg-red-50'
              }`}
            >
              <div
                className={`flex items-center gap-2 text-sm ${
                  order.status === 'PENDING_PAYMENT'
                    ? 'text-yellow-800'
                    : order.status === 'PAID'
                      ? 'text-blue-800'
                      : order.status === 'IN_PROGRESS'
                        ? 'text-purple-800'
                        : order.status === 'SHIPPED'
                          ? 'text-orange-800'
                          : order.status === 'RENTED'
                            ? 'text-cyan-800'
                            : order.status === 'RETURNED'
                              ? 'text-indigo-800'
                              : order.status === 'COMPLETED'
                                ? 'text-green-800'
                                : 'text-red-800'
                }`}
              >
                <div
                  className={`h-2 w-2 animate-pulse rounded-full ${
                    order.status === 'PENDING_PAYMENT'
                      ? 'bg-yellow-500'
                      : order.status === 'PAID'
                        ? 'bg-blue-500'
                        : order.status === 'IN_PROGRESS'
                          ? 'bg-purple-500'
                          : order.status === 'SHIPPED'
                            ? 'bg-orange-500'
                            : order.status === 'RENTED'
                              ? 'bg-cyan-500'
                              : order.status === 'RETURNED'
                                ? 'bg-indigo-500'
                                : order.status === 'COMPLETED'
                                  ? 'bg-green-500'
                                  : 'bg-red-500'
                  }`}
                />
                <span className="font-medium">
                  {order.status === 'PENDING_PAYMENT'
                    ? 'Menunggu Pembayaran'
                    : order.status === 'PAID'
                      ? 'Sudah Dibayar'
                      : order.status === 'IN_PROGRESS'
                        ? 'Sedang Diproses'
                        : order.status === 'SHIPPED'
                          ? 'Terkirim'
                          : order.status === 'RENTED'
                            ? 'Sedang Disewa'
                            : order.status === 'RETURNED'
                              ? 'Sudah Dikembalikan'
                              : order.status === 'COMPLETED'
                                ? 'Selesai'
                                : 'Dibatalkan'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-3 flex gap-2">
            <Link
              href="/dashboard/customer/orders"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 px-3 py-2.5 text-sm font-bold text-white shadow-lg"
            >
              Lihat Pesanan
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/sewa-alat"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-purple-200 bg-white px-3 py-2.5 text-sm font-bold text-purple-600"
            >
              Sewa Lagi
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
