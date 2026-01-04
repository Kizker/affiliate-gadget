'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { useCartStore } from '@/lib/store/cart-store'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import {
  ShoppingCart,
  ArrowLeft,
  Copy,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react'

interface CartItem {
  id: string
  type: 'SERVICE' | 'PRODUCT' | 'RENTAL'
  quantity: number
  rentalDays?: number
  service?: {
    id: string
    name: string
    category: string
    price: number
  }
  product?: {
    id: string
    name: string
    price: number
    images: string[]
  }
  rentalItem?: {
    id: string
    name: string
    pricePerDay: number
    images: string[]
  }
}

interface BankAccount {
  id: string
  category: string
  bankName: string
  accountNumber: string
  accountName: string
}

export default function CheckoutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Use stable selectors to avoid getServerSnapshot error
  const items = useCartStore((state) => state.items)
  const selectedItemIds = useCartStore((state) => state.selectedItems)
  const removeSelectedItems = useCartStore((state) => state.removeSelectedItems)
  const setUserId = useCartStore((state) => state.setUserId)

  // Filter selected items in useMemo to avoid recalculation
  const selectedItems = useMemo(() => {
    return items.filter((item) => selectedItemIds.includes(item.id))
  }, [items, selectedItemIds])

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null)

  // Redirect if not logged in
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/checkout')
    } else if (status === 'authenticated') {
      setUserId(session.user.id)
      setLoading(false)
    }
  }, [status, router, session, setUserId])

  // Fetch bank accounts when cart changes
  useEffect(() => {
    if (selectedItems.length > 0) {
      const categories = getCartCategories(selectedItems)
      fetchBankAccounts(categories)
    }
  }, [selectedItems])

  const getCartCategories = (items: CartItem[]): string[] => {
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

  const calculateSubtotal = () => {
    return selectedItems.reduce((sum, item) => {
      const itemPrice = item.rentalDays
        ? item.price * item.rentalDays * item.quantity
        : item.price * item.quantity
      return sum + itemPrice
    }, 0)
  }

  const subtotal = calculateSubtotal()
  const total = subtotal

  const handleCopyAccount = async (
    accountNumber: string,
    accountId: string
  ) => {
    try {
      await navigator.clipboard.writeText(accountNumber)
      setCopiedAccount(accountId)
      toast.success('Nomor rekening berhasil disalin')
      setTimeout(() => setCopiedAccount(null), 2000)
    } catch {
      toast.error('Gagal menyalin nomor rekening')
    }
  }

  const handleCheckout = async () => {
    if (!termsAccepted) {
      toast.error('Harap setujui syarat & ketentuan')
      return
    }

    if (selectedItems.length === 0) {
      toast.error('Pilih minimal 1 item untuk checkout')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedItems,
          paymentMethod: 'CASH',
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Gagal memproses checkout')
      }

      const data = await res.json()

      // Remove only selected items from cart
      removeSelectedItems()

      // Get order IDs for redirect
      interface OrderResponse {
        order: {
          id: string
        }
      }
      const orderIds = (data.orders as OrderResponse[])
        .map((o) => o.order.id)
        .join(',')

      // Redirect to multi-order confirmation page with all order IDs
      router.push(`/order-confirmation/multiple?orders=${orderIds}`)
      toast.success(`${data.orders.length} pesanan berhasil dibuat!`)
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error(
        error instanceof Error ? error.message : 'Gagal memproses checkout'
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/40">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    )
  }

  if (selectedItems.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/40 px-4">
        <ShoppingCart className="mb-4 h-16 w-16 text-gray-300" />
        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          Tidak Ada Item yang Dipilih
        </h2>
        <p className="mb-6 text-gray-600">
          Pilih item di keranjang untuk melanjutkan checkout
        </p>
        <Link
          href="/cart"
          className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 font-semibold text-white transition-all hover:shadow-lg"
        >
          Kembali ke Keranjang
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/40">
      <Navbar variant="light" />

      <main className="pb-16 pt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="space-y-6 lg:col-span-2">
              {/* Back Button */}
              <Link
                href="/cart"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-blue-600"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Keranjang
              </Link>

              {/* Order Summary */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <h2 className="mb-4 text-xl font-bold text-gray-900">
                  Ringkasan Pesanan ({selectedItems.length} item)
                </h2>
                <div className="space-y-4">
                  {selectedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                    >
                      {/* Image */}
                      {item.type !== 'SERVICE' && item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-20 w-20 rounded-lg object-cover"
                        />
                      )}
                      {item.type === 'SERVICE' && (
                        <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-blue-100">
                          <span className="text-3xl">⚙️</span>
                        </div>
                      )}

                      {/* Details */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {item.name}
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
                          Rp{' '}
                          {(item.rentalDays
                            ? item.price * item.rentalDays * item.quantity
                            : item.price * item.quantity
                          ).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  ))}
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

              {/* Bank Accounts */}
              {bankAccounts.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6">
                  <h2 className="mb-4 text-xl font-bold text-gray-900">
                    🏦 Rekening Tujuan Transfer
                  </h2>
                  <div className="space-y-4">
                    {bankAccounts.map((account) => (
                      <div
                        key={account.id}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-500">
                            {account.category}
                          </span>
                        </div>
                        <p className="font-bold text-gray-900">
                          {account.bankName}
                        </p>
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
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-4 space-y-6">
                {/* Price Breakdown */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6">
                  <h2 className="mb-4 text-xl font-bold text-gray-900">
                    Rincian Harga
                  </h2>
                  <div className="space-y-3">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                    </div>
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
                    disabled={
                      !termsAccepted || submitting || selectedItems.length === 0
                    }
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
                  <Link
                    href="/cart"
                    className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-gray-300 px-6 py-4 font-semibold text-gray-700 transition-all hover:border-blue-600 hover:text-blue-600"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    Kembali ke Keranjang
                  </Link>
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
          </div>
        </div>
      </main>

      <Footer variant="light" />
    </div>
  )
}
