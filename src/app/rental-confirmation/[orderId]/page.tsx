'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/layouts/navbar'
import {
  CheckCircle,
  Loader2,
  ArrowRight,
  Calendar,
  Copy,
  Check,
  Hammer,
  CreditCard,
  Shield,
} from 'lucide-react'
import { toast } from 'sonner'

interface RentalOrderData {
  id: string
  orderNumber: string
  total: number
  subtotal: number
  status: string
  createdAt: string
  items: Array<{
    id: string
    rentalDays: number | null
    price: number
    subtotal: number
    rentalItem: {
      id: string
      name: string
      images: string[]
      pricePerDay: number
    }
  }>
}

export default function RentalConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const router = useRouter()
  const [order, setOrder] = useState<RentalOrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [orderId, setOrderId] = useState<string>('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    params.then((p) => setOrderId(p.orderId))
  }, [params])

  useEffect(() => {
    if (!orderId) return

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`)
        if (res.ok) {
          const data = await res.json()
          setOrder(data.order)
        } else {
          router.push('/dashboard/customer/orders')
        }
      } catch (error) {
        console.error('Error fetching order:', error)
        router.push('/dashboard/customer/orders')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId, router])

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(order?.orderNumber || '')
    setCopied(true)
    toast.success('Nomor pesanan disalin!')
    setTimeout(() => setCopied(false), 2000)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!order) return null

  const rentalItem = order.items[0]
  const equipment = rentalItem?.rentalItem
  const rentalDays = rentalItem?.rentalDays || 1
  const deposit = (equipment?.pricePerDay || 0) * 10

  const startDate = new Date(order.createdAt)
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + rentalDays)

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Navbar variant="light" />

      <main className="container mx-auto flex flex-1 items-center justify-center px-4 py-6">
        <div className="w-full max-w-md">
          {/* Success Header */}
          <div className="mb-4 text-center">
            <div className="relative mx-auto mb-3 h-16 w-16">
              <div className="absolute inset-0 animate-ping rounded-full bg-purple-400 opacity-20" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Sewa Berhasil! 🛠️
            </h1>
            <p className="text-sm text-gray-600">
              Pesanan sewa alat Anda sedang diproses
            </p>
          </div>

          {/* Main Card */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
            {/* Order Number Header */}
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-purple-100">Nomor Pesanan</p>
                  <p className="text-lg font-bold text-white">
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
            <div className="border-b border-gray-100 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
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
            <div className="border-b border-gray-100 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Calendar className="h-4 w-4 text-blue-600" />
                Periode Sewa
              </div>
              <div className="grid grid-cols-2 gap-3">
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
            <div className="bg-gray-50 p-4">
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
            <div className="border-t border-yellow-100 bg-yellow-50 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-yellow-800">
                <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
                <span className="font-medium">Menunggu Pembayaran</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex gap-3">
            <Link
              href="/dashboard/customer/orders"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-3 text-sm font-bold text-white shadow-lg"
            >
              Lihat Pesanan
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/sewa-alat"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-purple-200 bg-white px-4 py-3 text-sm font-bold text-purple-600"
            >
              Sewa Lagi
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
