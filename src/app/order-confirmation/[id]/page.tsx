'use client'

import { useEffect, useState, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle,
  Copy,
  Check,
  Loader2,
  MessageCircle,
  Package,
  ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'

interface OrderItem {
  id: string
  type: 'SERVICE' | 'PRODUCT' | 'RENTAL'
  quantity: number
  rentalDays?: number
  price: number
  subtotal: number
  service?: {
    name: string
    category: string
  }
  product?: {
    name: string
    images: string[]
  }
  rentalItem?: {
    name: string
    images: string[]
  }
}

interface Order {
  id: string
  orderNumber: string
  status: string
  subtotal: number
  tax: number
  total: number
  notes: string | null
  createdAt: string
  items: OrderItem[]
  user: {
    name: string | null
    email: string
  }
}

interface BankAccount {
  id: string
  category: string
  bankName: string
  accountNumber: string
  accountName: string
}

export default function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchOrder()
    }
  }, [status, resolvedParams.id])

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${resolvedParams.id}`)
      if (!res.ok) {
        throw new Error('Order not found')
      }
      const data = await res.json()
      setOrder(data.order)

      // Get bank accounts based on order items
      const categories = getOrderCategories(data.order.items)
      if (categories.length > 0) {
        fetchBankAccounts(categories)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      toast.error('Gagal memuat detail pesanan')
      router.push('/dashboard/customer/orders')
    } finally {
      setLoading(false)
    }
  }

  const getOrderCategories = (items: OrderItem[]): string[] => {
    const categories = new Set<string>()
    items.forEach((item) => {
      if (item.type === 'PRODUCT') categories.add('SPAREPART')
      if (item.type === 'RENTAL') categories.add('SEWA')
      if (item.type === 'SERVICE') categories.add('JASA')
    })
    return Array.from(categories)
  }

  const fetchBankAccounts = async (categories: string[]) => {
    try {
      const res = await fetch(
        `/api/bank-accounts?categories=${categories.join(',')}`
      )
      if (res.ok) {
        const data = await res.json()
        setBankAccounts(data.accounts || [])
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error)
    }
  }

  const handleCopyAccount = async (
    accountNumber: string,
    accountId: string
  ) => {
    try {
      await navigator.clipboard.writeText(accountNumber)
      setCopiedAccount(accountId)
      toast.success('Nomor rekening berhasil disalin')
      setTimeout(() => setCopiedAccount(null), 2000)
    } catch (error) {
      toast.error('Gagal menyalin nomor rekening')
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; text: string }> = {
      PENDING_PAYMENT: {
        color: 'bg-yellow-100 text-yellow-700',
        text: 'Menunggu Pembayaran',
      },
      PAID: { color: 'bg-blue-100 text-blue-700', text: 'Dibayar' },
      IN_PROGRESS: {
        color: 'bg-purple-100 text-purple-700',
        text: 'Sedang Dikerjakan',
      },
      COMPLETED: { color: 'bg-green-100 text-green-700', text: 'Selesai' },
      CANCELLED: { color: 'bg-red-100 text-red-700', text: 'Dibatalkan' },
    }
    const badge = badges[status] || {
      color: 'bg-gray-100 text-gray-700',
      text: status,
    }
    return (
      <span
        className={`rounded-full px-4 py-1.5 text-sm font-semibold ${badge.color}`}
      >
        {badge.text}
      </span>
    )
  }

  if (loading || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/40">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/40 px-4">
        <Package className="mb-4 h-16 w-16 text-gray-300" />
        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          Pesanan Tidak Ditemukan
        </h2>
        <p className="mb-6 text-gray-600">
          Pesanan yang Anda cari tidak ditemukan
        </p>
        <Link
          href="/dashboard/customer/orders"
          className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 font-semibold text-white transition-all hover:shadow-lg"
        >
          Lihat Semua Pesanan
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/40">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-2xl font-bold text-transparent"
          >
            HaloTekno
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Success Message */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Pesanan Berhasil Dibuat!
          </h1>
          <p className="text-gray-600">
            Terima kasih telah berbelanja di HaloTekno
          </p>
        </div>

        {/* Order Info */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm text-gray-600">Nomor Pesanan</p>
              <p className="text-xl font-bold text-gray-900">
                {order.orderNumber}
              </p>
            </div>
            {getStatusBadge(order.status)}
          </div>
          <div className="grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-600">Tanggal Pesanan</p>
              <p className="font-semibold text-gray-900">
                {new Date(order.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Pembayaran</p>
              <p className="text-2xl font-bold text-blue-600">
                Rp {order.total.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Detail Pesanan
          </h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0"
              >
                {item.type !== 'SERVICE' && (
                  <img
                    src={
                      item.product?.images[0] ||
                      item.rentalItem?.images[0] ||
                      'https://via.placeholder.com/80'
                    }
                    alt={item.product?.name || item.rentalItem?.name}
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                )}
                {item.type === 'SERVICE' && (
                  <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-blue-100">
                    <span className="text-3xl">⚙️</span>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {item.product?.name ||
                      item.rentalItem?.name ||
                      item.service?.name}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {item.type === 'PRODUCT' && 'Sparepart'}
                      {item.type === 'RENTAL' && 'Rental'}
                      {item.type === 'SERVICE' && 'Service'}
                    </span>
                    {item.type !== 'SERVICE' && (
                      <span className="text-sm text-gray-600">
                        Qty: {item.quantity}
                      </span>
                    )}
                    {item.type === 'RENTAL' && item.rentalDays && (
                      <span className="text-sm text-gray-600">
                        • {item.rentalDays} hari
                      </span>
                    )}
                  </div>
                  <p className="mt-2 font-semibold text-blue-600">
                    Rp {item.subtotal.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Price Summary */}
          <div className="mt-6 space-y-2 border-t border-gray-200 pt-4">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>Rp {order.subtotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>PPN (11%)</span>
              <span>Rp {order.tax.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 text-lg font-bold text-gray-900">
              <span>Total</span>
              <span className="text-blue-600">
                Rp {order.total.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Instructions */}
        {order.status === 'PENDING_PAYMENT' && bankAccounts.length > 0 && (
          <div className="mb-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-6">
            <h2 className="mb-4 text-xl font-bold text-gray-900">
              💳 Instruksi Pembayaran
            </h2>
            <p className="mb-4 text-gray-700">
              Silakan transfer ke salah satu rekening berikut:
            </p>
            <div className="space-y-4">
              {bankAccounts.map((account) => (
                <div
                  key={account.id}
                  className="rounded-lg border border-gray-200 bg-white p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">
                      {account.category}
                    </span>
                  </div>
                  <p className="font-bold text-gray-900">{account.bankName}</p>
                  <p className="mt-1 font-mono text-lg font-semibold text-blue-600">
                    {account.accountNumber}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    a.n. {account.accountName}
                  </p>
                  <button
                    onClick={() =>
                      handleCopyAccount(account.accountNumber, account.id)
                    }
                    className="mt-3 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700"
                  >
                    {copiedAccount === account.id ? (
                      <>
                        <Check className="h-4 w-4" />
                        Tersalin!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Salin Nomor Rekening
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-900">
                📸 Setelah transfer, upload bukti pembayaran via:
              </p>
              <Link
                href="/chat"
                className="mt-2 flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
              >
                <MessageCircle className="h-4 w-4" />
                Chat dengan Admin
              </Link>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href={`/dashboard/customer/orders/${order.id}`}
            className="flex items-center justify-center gap-2 rounded-lg border-2 border-blue-600 bg-blue-600 px-6 py-4 font-semibold text-white transition-all hover:bg-blue-700"
          >
            <Package className="h-5 w-5" />
            Lihat Detail Pesanan
          </Link>
          <Link
            href="/sparepart"
            className="flex items-center justify-center gap-2 rounded-lg border-2 border-gray-300 px-6 py-4 font-semibold text-gray-700 transition-all hover:border-blue-600 hover:text-blue-600"
          >
            Lanjut Belanja
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
