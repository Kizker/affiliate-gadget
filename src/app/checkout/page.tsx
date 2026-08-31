'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
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
  Truck,
  ShieldCheck,
  Gift,
  CreditCard,
  MapPin,
  Lock,
  ArrowRight,
  Sparkles,
  Building2,
} from 'lucide-react'

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

  const items = useCartStore((state) => state.items)
  const selectedItemIds = useCartStore((state) => state.selectedItems)
  const removeSelectedItems = useCartStore((state) => state.removeSelectedItems)
  const setUserId = useCartStore((state) => state.setUserId)

  const selectedItems = useMemo(() => {
    return items.filter((item) => selectedItemIds.includes(item.id))
  }, [items, selectedItemIds])

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [courier, setCourier] = useState<'JNE' | 'GOJEK'>('JNE')
  const [courierService, setCourierService] = useState('REG')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'GATEWAY' | 'MANUAL_TRANSFER'>('GATEWAY')
  const [termsAccepted, setTermsAccepted] = useState(true)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/checkout')
    } else if (status === 'authenticated') {
      setUserId(session.user.id)
      setLoading(false)
    }
  }, [status, router, session, setUserId])

  useEffect(() => {
    if (selectedItems.length > 0) {
      fetchBankAccounts()
    }
  }, [selectedItems])

  const fetchBankAccounts = async () => {
    try {
      const res = await fetch('/api/bank-accounts')
      if (res.ok) {
        const data = await res.json()
        setBankAccounts(data.accounts || [])
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error)
    }
  }

  const subtotal = selectedItems.reduce((sum, item) => {
    const itemPrice = item.rentalDays
      ? item.price * item.rentalDays * item.quantity
      : item.price * item.quantity
    return sum + itemPrice
  }, 0)

  // Calculate Mandatory Shipping Insurance (0.25% of subtotal + admin fee)
  const insuranceFee = Math.max(15000, Math.round(subtotal * 0.0025))
  const shippingCost = courier === 'GOJEK' ? 35000 : courierService === 'YES' ? 28000 : 15000
  const total = subtotal + shippingCost + insuranceFee

  const handleCopyAccount = async (accountNumber: string, accountId: string) => {
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
      toast.error('Harap setujui syarat & ketentuan garansi 30 hari')
      return
    }

    if (selectedItems.length === 0) {
      toast.error('Pilih minimal 1 item untuk checkout')
      return
    }

    if (!deliveryAddress.trim()) {
      toast.error('Harap isi alamat lengkap pengiriman')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedItems,
          paymentMethod: paymentMethod === 'GATEWAY' ? 'MIDTRANS' : 'MANUAL_TRANSFER',
          courierCode: courier,
          courierService: courierService,
          shippingCost: shippingCost,
          insuranceFee: insuranceFee,
          isInsuranceMandatory: true,
          bonusChargerIncluded: true,
          bonusProtectorIncluded: true,
          bonusCaseIncluded: true,
          deliveryAddress: deliveryAddress,
          notes: notes,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Gagal memproses checkout')
      }

      const data = await res.json()
      removeSelectedItems()

      const orderIds = (data.orders || []).map((o: any) => o.order?.id || o.id).filter(Boolean).join(',')
      router.push(`/order-confirmation/multiple?orders=${orderIds}`)
      toast.success('Pesanan berhasil dibuat dengan Asuransi & Garansi 30 Hari!')
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal memproses checkout')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (selectedItems.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900 max-w-md space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
            <ShoppingCart className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">
            Tidak Ada Item yang Dipilih
          </h2>
          <p className="text-xs text-slate-500">
            Pilih gadget resmi di keranjang Anda sebelum melanjutkan proses checkout.
          </p>
          <div className="pt-2">
            <Link
              href="/cart"
              className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-xs font-bold text-white shadow-sm shadow-orange-500/25 hover:bg-orange-600 transition"
            >
              <ArrowLeft className="h-4 w-4" /> Kembali ke Keranjang
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      <Navbar variant="light" />

      <main className="pb-20 pt-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/cart"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-600 shadow-2xs hover:border-slate-300 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white transition-all shrink-0"
                title="Kembali ke Keranjang"
                aria-label="Kembali ke Keranjang"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                  Checkout Pesanan
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Lengkapi pengiriman & konfirmasi pembayaran resmi
                </p>
              </div>
            </div>

            <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-2xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Pembayaran Aman & Terlindungi</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
            
            {/* Left Column: Logistics, Payment & Items (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* 1. Delivery Address & Courier Logistics */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <h2 className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-orange-500" /> Alamat & Kurir Pengiriman
                  </h2>
                  <span className="text-[11px] font-semibold text-slate-400">Langkah 1 dari 2</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Alamat Lengkap Tujuan <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota, kode pos"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400 focus:bg-white transition dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Pilihan Kurir Terproteksi Asuransi
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setCourier('JNE')}
                        className={`rounded-2xl p-3.5 text-left border transition-all ${
                          courier === 'JNE'
                            ? 'border-slate-950 bg-slate-950 text-white dark:border-blue-600 dark:bg-blue-600 shadow-2xs'
                            : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-xs">
                          <span className="flex items-center gap-1.5">
                            <Truck className="h-3.5 w-3.5" /> JNE Express
                          </span>
                          <span>Rp 15.000</span>
                        </div>
                        <p className={`mt-1 text-[10px] ${courier === 'JNE' ? 'text-slate-300' : 'text-slate-400'}`}>
                          Reguler / YES (1-2 Hari Kerja)
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCourier('GOJEK')}
                        className={`rounded-2xl p-3.5 text-left border transition-all ${
                          courier === 'GOJEK'
                            ? 'border-slate-950 bg-slate-950 text-white dark:border-blue-600 dark:bg-blue-600 shadow-2xs'
                            : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-xs">
                          <span className="flex items-center gap-1.5">
                            <Truck className="h-3.5 w-3.5" /> Gojek Instant
                          </span>
                          <span>Rp 35.000</span>
                        </div>
                        <p className={`mt-1 text-[10px] ${courier === 'GOJEK' ? 'text-slate-300' : 'text-slate-400'}`}>
                          Langsung Sampai (Maks 2 Jam)
                        </p>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Payment Method */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <h2 className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-orange-500" /> Metode Pembayaran
                  </h2>
                  <span className="text-[11px] font-semibold text-slate-400">Langkah 2 dari 2</span>
                </div>

                <div className="space-y-2.5">
                  {/* Payment Gateway (QRIS, VA) */}
                  <label
                    className={`flex items-start justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'GATEWAY'
                        ? 'border-slate-950 bg-slate-50 dark:border-blue-500 dark:bg-blue-950/20'
                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'GATEWAY'}
                        onChange={() => setPaymentMethod('GATEWAY')}
                        className="mt-0.5 h-4 w-4 text-slate-950 focus:ring-slate-950 dark:text-blue-600"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-950 dark:text-white block">
                          Payment Gateway Otomatis (QRIS, BCA VA, Mandiri, E-Wallet)
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Konfirmasi instan otomatis tanpa perlu upload bukti transfer
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 shrink-0">
                      Rekomendasi
                    </span>
                  </label>

                  {/* Manual Transfer */}
                  <label
                    className={`flex items-start justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'MANUAL_TRANSFER'
                        ? 'border-slate-950 bg-slate-50 dark:border-blue-500 dark:bg-blue-950/20'
                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'MANUAL_TRANSFER'}
                        onChange={() => setPaymentMethod('MANUAL_TRANSFER')}
                        className="mt-0.5 h-4 w-4 text-slate-950 focus:ring-slate-950 dark:text-blue-600"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-950 dark:text-white block">
                          Transfer Bank Manual ke Rekening Toko
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Transfer langsung ke rekening bank resmi toko counter fisik
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Display Bank Accounts if Manual Transfer Selected */}
                  {paymentMethod === 'MANUAL_TRANSFER' && (
                    <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60 space-y-3">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                        Rekening Tujuan Pembayaran Resmi:
                      </span>
                      
                      {bankAccounts.length > 0 ? (
                        <div className="space-y-2">
                          {bankAccounts.map((acc) => (
                            <div key={acc.id} className="flex items-center justify-between rounded-xl bg-white p-3 border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800">
                              <div>
                                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                                  {acc.bankName} - {acc.accountNumber}
                                </span>
                                <span className="text-[10px] text-slate-500 block">
                                  a.n. {acc.accountName}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyAccount(acc.accountNumber, acc.id)}
                                className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 transition"
                              >
                                {copiedAccount === acc.id ? (
                                  <>
                                    <Check className="h-3 w-3 text-emerald-600" />
                                    <span>Tersalin</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3" />
                                    <span>Salin</span>
                                  </>
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl bg-white p-3 border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800">
                          <span className="text-xs font-bold text-slate-900 dark:text-white block">
                            BCA - 8830 1928 3920
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            a.n. Rekening Operasional Toko Gadget
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Items Preview */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <h2 className="text-sm font-bold text-slate-950 dark:text-white">
                    Produk yang Dipesan ({selectedItems.length})
                  </h2>
                  <Link href="/cart" className="text-[11px] font-semibold text-orange-600 hover:underline">
                    Ubah Keranjang
                  </Link>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedItems.map((item) => (
                    <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-50 border border-slate-100 dark:border-slate-800">
                        <Image
                          src={item.image || '/placeholder.png'}
                          alt={item.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                          {item.name}
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          {item.quantity} unit × Rp {item.price.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-slate-950 dark:text-white tabular-nums">
                          Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: Order Summary & Checkout Action (5 cols, Sticky) */}
            <div className="lg:col-span-5 sticky top-28 space-y-4">
              <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <h3 className="text-sm font-bold text-slate-950 dark:text-white border-b border-slate-100 pb-3.5 dark:border-slate-800">
                  Ringkasan Pembayaran
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Subtotal Produk</span>
                    <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                      Rp {subtotal.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Ongkos Kirim ({courier})</span>
                    <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                      Rp {shippingCost.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                      <span>Asuransi Kurir 100%</span>
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                      Rp {insuranceFee.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Free Bonus 3-in-1 Included */}
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 pt-0.5">
                    <span className="flex items-center gap-1.5">
                      <Gift className="h-3.5 w-3.5 text-orange-500" />
                      <span>Bonus Aksesoris 3-in-1</span>
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      GRATIS (Rp 0)
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 pl-5 -mt-1 leading-tight">
                    Charger 20W + Tempered Glass + Case
                  </p>

                  {/* Total Payment Row */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Total Tagihan
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Termasuk PPN & Asuransi
                      </span>
                    </div>

                    <span className="text-base sm:text-lg font-bold text-slate-950 dark:text-white tabular-nums tracking-tight whitespace-nowrap">
                      Rp {total.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Terms Agreement */}
                <div className="pt-1">
                  <label className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-950"
                    />
                    <span className="leading-snug">
                      Saya menyetujui syarat garansi resmi toko 30 hari tukar unit & asuransi kurir terproteksi.
                    </span>
                  </label>
                </div>

                {/* Primary CTA */}
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3.5 text-xs font-bold text-white shadow-sm shadow-orange-500/25 hover:bg-orange-600 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Memproses Pesanan...</span>
                    </>
                  ) : (
                    <>
                      <span>Bayar Sekarang</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                {/* Trust Badges */}
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-100 dark:border-slate-800/80 space-y-1.5">
                  <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Garansi 30 Hari Tukar Unit Gadget Second</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                    <Truck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span>Proteksi Rusak / Hilang JNE & Gojek 100%</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer variant="light" />
    </div>
  )
}
