'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import { ArrowLeft, Check, Loader2, AlertCircle } from 'lucide-react'

interface ProductData {
  id: string
  name: string
  price: number
  image: string
  stock?: number
}

interface RentalData {
  id: string
  name: string
  pricePerDay: number
  image: string
  stock?: number
  depositAmount?: number
}

function DirectCheckoutContent() {
  const { status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const type = searchParams.get('type') as 'product' | 'rental' | null
  const itemId = searchParams.get('id')
  const quantity = parseInt(searchParams.get('qty') || '1')
  const rentalDays = parseInt(searchParams.get('days') || '1')

  const [item, setItem] = useState<ProductData | RentalData | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [itemLoading, setItemLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Redirect if not logged in
  useEffect(() => {
    if (status === 'unauthenticated') {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/checkout/direct'
      router.push('/login?redirect=' + encodeURIComponent(currentPath))
    } else if (status === 'authenticated') {
      setLoading(false)
    }
  }, [status, router])

  // Fetch item details
  useEffect(() => {
    const fetchItem = async () => {
      if (!type || !itemId) {
        setItemLoading(false)
        return
      }

      setItemLoading(true)
      try {
        if (type === 'product') {
          const res = await fetch(`/api/products/${itemId}`)
          if (res.ok) {
            const data = await res.json()
            setItem({
              id: data.id,
              name: data.name,
              price: data.price,
              image: data.images?.[0] || '',
              stock: data.stock,
            })
          }
        } else if (type === 'rental') {
          const res = await fetch(`/api/rental/${itemId}`)
          if (res.ok) {
            const data = await res.json()
            setItem({
              id: data.id,
              name: data.name,
              pricePerDay: data.pricePerDay,
              image: data.images?.[0] || '',
              stock: data.stock,
              depositAmount: data.depositAmount || 0,
            })
          }
        }
      } catch (error) {
        console.error('Error fetching item:', error)
      } finally {
        setItemLoading(false)
      }
    }

    fetchItem()
  }, [type, itemId])

  const calculateTotal = () => {
    if (!item) return 0
    if (type === 'rental' && 'pricePerDay' in item) {
      return item.pricePerDay * rentalDays * quantity
    }
    if ('price' in item) {
      return item.price * quantity
    }
    return 0
  }

  const subtotal = calculateTotal()
  const depositAmount =
    type === 'rental' && item && 'depositAmount' in item
      ? item.depositAmount || 0
      : 0
  const total = subtotal + depositAmount

  const handleCheckout = async () => {
    if (!termsAccepted) {
      toast.error('Harap setujui syarat & ketentuan')
      return
    }

    if (!item || !type) {
      toast.error('Data tidak valid')
      return
    }

    setSubmitting(true)
    try {
      // Create order directly for single item
      const orderData = {
        items: [
          {
            type: type === 'product' ? 'PRODUCT' : 'RENTAL',
            productId: type === 'product' ? item.id : null,
            rentalItemId: type === 'rental' ? item.id : null,
            quantity,
            rentalDays: type === 'rental' ? rentalDays : null,
            price:
              type === 'rental' && 'pricePerDay' in item
                ? item.pricePerDay
                : 'price' in item
                  ? item.price
                  : 0,
            name: item.name,
            image: item.image,
          },
        ],
        paymentMethod: 'CASH',
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Gagal memproses checkout')
      }

      const data = await res.json()

      // Get order ID for redirect
      interface OrderResponse {
        order: {
          id: string
        }
      }
      const orderId = (data.orders as OrderResponse[])[0]?.order?.id

      if (orderId) {
        router.push(`/order-confirmation/sparepart/${orderId}`)
        toast.success('Pesanan berhasil dibuat!')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error(
        error instanceof Error ? error.message : 'Gagal memproses checkout'
      )
    } finally {
      setSubmitting(false)
    }
  }

  // Show loading while auth or item is loading
  if (loading || status === 'loading' || itemLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/40">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!type || !itemId || !item) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/40 px-4">
        <AlertCircle className="mb-4 h-16 w-16 text-gray-300" />
        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          Data Tidak Valid
        </h2>
        <p className="mb-6 text-gray-600">
          Silakan pilih produk terlebih dahulu
        </p>
        <Link
          href="/sparepart"
          className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 font-semibold text-white transition-all hover:shadow-lg"
        >
          Lihat Produk
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/40">
      <Navbar variant="light" />

      <main className="pb-16 pt-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>

          <div className="space-y-6">
            {/* Order Summary */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                Ringkasan Pesanan
              </h2>
              <div className="flex gap-4 border-b border-gray-100 pb-4">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {type === 'product' ? 'Sparepart' : 'Rental'}
                    </span>
                    <span className="text-sm text-gray-600">
                      Qty: {quantity}
                    </span>
                    {type === 'rental' && (
                      <span className="text-sm text-gray-600">
                        • {rentalDays} hari
                      </span>
                    )}
                  </div>
                  <p className="mt-2 font-semibold text-blue-600">
                    Rp {total.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                💳 Metode Pembayaran
              </h2>
              <div className="space-y-3">
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-blue-600 bg-blue-50 p-4">
                  <input
                    type="radio"
                    name="payment"
                    checked
                    readOnly
                    className="h-4 w-4 text-blue-600"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      Pembayaran Cash
                    </p>
                    <p className="text-sm text-gray-600">
                      Bayar langsung saat pengambilan barang
                    </p>
                  </div>
                </label>
                <div className="flex items-center gap-3 rounded-lg border-2 border-gray-200 bg-gray-50 p-4 opacity-50">
                  <input
                    type="radio"
                    disabled
                    className="h-4 w-4 text-gray-400"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-500">
                      Midtrans (Coming Soon)
                    </p>
                    <p className="text-sm text-gray-400">
                      E-wallet, VA, Credit Card
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                Rincian Harga
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal Sewa</span>
                  <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                {type === 'rental' && (
                  <div className="flex justify-between text-gray-600">
                    <div>
                      <span>Deposit</span>
                      <p className="text-xs text-gray-500">
                        Dikembalikan setelah alat kembali
                      </p>
                    </div>
                    <span
                      className={
                        depositAmount > 0
                          ? 'font-medium text-orange-600'
                          : 'font-medium text-green-600'
                      }
                    >
                      {depositAmount > 0
                        ? `Rp ${depositAmount.toLocaleString('id-ID')}`
                        : 'Gratis'}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-blue-600">
                      Rp {total.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  Saya setuju dengan{' '}
                  <Link
                    href="/terms"
                    target="_blank"
                    className="font-medium text-blue-600 hover:underline"
                  >
                    Syarat & Ketentuan
                  </Link>{' '}
                  dan{' '}
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="font-medium text-blue-600 hover:underline"
                  >
                    Kebijakan Privasi
                  </Link>
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleCheckout}
                disabled={!termsAccepted || submitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4 font-bold text-white transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    Konfirmasi Pesanan
                  </>
                )}
              </button>
            </div>

            {/* Warning */}
            {!termsAccepted && (
              <div className="flex items-start gap-2 rounded-lg bg-yellow-50 p-4">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  Harap setujui syarat & ketentuan untuk melanjutkan
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer variant="light" />
    </div>
  )
}

export default function DirectCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </div>
      }
    >
      <DirectCheckoutContent />
    </Suspense>
  )
}
