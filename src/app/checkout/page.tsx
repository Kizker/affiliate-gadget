'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { useCartStore } from '@/lib/store/cart-store'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import {
  AddressModal,
  UserAddressItem,
} from '@/components/customer/address-modal'
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
  Plus,
  Home,
  Star,
  Edit3,
  ChevronRight,
} from 'lucide-react'

interface BankAccount {
  id: string
  category: string
  bankName: string
  accountNumber: string
  accountName: string
}

interface CheckoutOrderResponseItem {
  order?: {
    id: string
    orderNumber?: string
  }
  id?: string
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
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<
    'GATEWAY' | 'MANUAL_TRANSFER'
  >('GATEWAY')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null)

  // Idempotency Key (LOW-04): unik per payload keranjang belanja
  const idempotencyKeyRef = useRef<string>('')
  useEffect(() => {
    if (typeof window !== 'undefined') {
      idempotencyKeyRef.current =
        window.crypto?.randomUUID?.() ||
        `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`
    }
  }, [selectedItemIds])

  // Address state
  const [addresses, setAddresses] = useState<UserAddressItem[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  )
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)

  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId]
  )

  const fetchAddresses = useCallback(async (selectNewest = false) => {
    setLoadingAddresses(true)
    try {
      const res = await fetch('/api/user/addresses')
      if (res.ok) {
        const data = await res.json()
        const list: UserAddressItem[] = data.addresses || []
        setAddresses(list)
        if (selectNewest && list.length > 0) {
          // Newly added address is first in ordered list
          setSelectedAddressId(list[0].id)
        } else {
          // Auto-select default address if none selected or if selected is missing
          setSelectedAddressId((prev) => {
            if (prev && list.some((a) => a.id === prev)) return prev
            const def = list.find((a) => a.isDefault) ?? list[0] ?? null
            return def ? def.id : null
          })
        }
      }
    } catch {
      // silent
    } finally {
      setLoadingAddresses(false)
    }
  }, [])

  const fetchBankAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/bank-accounts')
      if (res.ok) {
        const data = await res.json()
        setBankAccounts(data.accounts || [])
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error)
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/checkout')
    } else if (status === 'authenticated') {
      setUserId(session.user.id)
      setLoading(false)
      fetchAddresses()
    }
  }, [status, router, session, setUserId, fetchAddresses])

  useEffect(() => {
    if (status === 'authenticated' && selectedItems.length > 0) {
      fetchBankAccounts()
    }
  }, [status, selectedItems, fetchBankAccounts])

  const subtotal = selectedItems.reduce((sum, item) => {
    const itemPrice = item.rentalDays
      ? item.price * item.rentalDays * item.quantity
      : item.price * item.quantity
    return sum + itemPrice
  }, 0)

  // Calculate Mandatory Shipping Insurance (0.25% of subtotal + admin fee)
  const insuranceFee = Math.max(15000, Math.round(subtotal * 0.0025))
  const shippingCost =
    courier === 'GOJEK' ? 35000 : courierService === 'YES' ? 28000 : 15000
  const total = subtotal + shippingCost + insuranceFee

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
      toast.error('Harap setujui syarat & ketentuan garansi 30 hari')
      return
    }

    if (selectedItems.length === 0) {
      toast.error('Pilih minimal 1 item untuk checkout')
      return
    }

    if (!selectedAddressId || !selectedAddress) {
      toast.error('Harap pilih alamat pengiriman terlebih dahulu')
      return
    }

    setSubmitting(true)
    try {
      const addressString = [
        selectedAddress!.fullAddress,
        selectedAddress!.district,
        selectedAddress!.village,
        selectedAddress!.city,
        selectedAddress!.province,
        selectedAddress!.postalCode,
      ]
        .filter(Boolean)
        .join(', ')

      if (!idempotencyKeyRef.current && typeof window !== 'undefined') {
        idempotencyKeyRef.current =
          window.crypto?.randomUUID?.() ||
          `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKeyRef.current,
        },
        body: JSON.stringify({
          items: selectedItems,
          paymentMethod:
            paymentMethod === 'GATEWAY' ? 'MIDTRANS' : 'MANUAL_TRANSFER',
          courierCode: courier,
          courierService: courierService,
          shippingCost: shippingCost,
          insuranceFee: insuranceFee,
          isInsuranceMandatory: true,
          bonusChargerIncluded: true,
          bonusProtectorIncluded: true,
          bonusCaseIncluded: true,
          addressId: selectedAddressId,
          deliveryAddress: addressString,
          recipientName: selectedAddress!.recipientName,
          recipientPhone: selectedAddress!.phone,
          notes: notes,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        // Refresh idempotency key agar user bisa mencoba kembali jika request ditolak validasi/stok
        if (typeof window !== 'undefined') {
          idempotencyKeyRef.current =
            window.crypto?.randomUUID?.() ||
            `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`
        }
        throw new Error(errorData.error || 'Gagal memproses checkout')
      }

      const data = await res.json()
      removeSelectedItems()

      const orderIds = (data.orders || [])
        .map((o: CheckoutOrderResponseItem) => o.order?.id || o.id)
        .filter(Boolean)
        .join(',')
      router.push(`/order-confirmation/multiple?orders=${orderIds}`)
      toast.success(
        'Pesanan berhasil dibuat dengan Asuransi & Garansi 30 Hari!'
      )
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (selectedItems.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <div className="shadow-xs max-w-md space-y-4 rounded-3xl border border-slate-200/80 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
            <ShoppingCart className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">
            Tidak Ada Item yang Dipilih
          </h2>
          <p className="text-xs text-slate-500">
            Pilih gadget resmi di keranjang Anda sebelum melanjutkan proses
            checkout.
          </p>
          <div className="pt-2">
            <Link
              href="/cart"
              className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition hover:bg-orange-600"
            >
              <ArrowLeft className="h-4 w-4" /> Kembali ke Keranjang
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col justify-between bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar variant="light" />

      <main className="pb-20 pt-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/cart"
                className="shadow-2xs flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-600 transition-all hover:border-slate-300 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white"
                title="Kembali ke Keranjang"
                aria-label="Kembali ke Keranjang"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                  Checkout Pesanan
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Lengkapi pengiriman & konfirmasi pembayaran resmi
                </p>
              </div>
            </div>

            <div className="shadow-2xs inline-flex w-fit items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Pembayaran Aman & Terlindungi</span>
            </div>
          </div>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            {/* Left Column: Logistics, Payment & Items (7 cols) */}
            <div className="space-y-4 lg:col-span-7">
              {/* 1. Delivery Address & Courier Logistics */}
              <div className="shadow-xs space-y-4 rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <h2 className="flex items-center gap-2 text-sm font-bold text-slate-950 dark:text-white">
                    <MapPin className="h-4 w-4 text-orange-500" /> Alamat &
                    Kurir Pengiriman
                  </h2>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Langkah 1 dari 2
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Address Picker */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Pilih Alamat Pengiriman{' '}
                        <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsAddressModalOpen(true)}
                        className="shadow-2xs inline-flex cursor-pointer items-center gap-1 rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Tambah Alamat</span>
                      </button>
                    </div>

                    {loadingAddresses ? (
                      <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-200 py-8 dark:border-slate-700">
                        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                      </div>
                    ) : addresses.length === 0 ? (
                      /* Empty state */
                      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center dark:border-slate-700 dark:bg-slate-800/30">
                        <div className="shadow-2xs mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-900">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <p className="mb-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Belum ada alamat tersimpan
                        </p>
                        <p className="mb-3 text-[11px] text-slate-400">
                          Tambahkan alamat pengiriman untuk melanjutkan
                          checkout.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsAddressModalOpen(true)}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-slate-950 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Tambah Alamat Baru</span>
                        </button>
                      </div>
                    ) : (
                      /* Address card list */
                      <div className="max-h-72 space-y-2.5 overflow-y-auto pr-0.5">
                        {addresses.map((addr) => {
                          const isSelected = selectedAddressId === addr.id
                          return (
                            <button
                              key={addr.id}
                              type="button"
                              onClick={() => setSelectedAddressId(addr.id)}
                              className={`w-full cursor-pointer rounded-2xl border p-4 text-left transition-all ${
                                isSelected
                                  ? 'border-orange-400 bg-orange-50/60 ring-1 ring-orange-400/40 dark:border-orange-500 dark:bg-orange-950/20'
                                  : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/60 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-slate-600'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {/* Radio indicator */}
                                <div
                                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                                    isSelected
                                      ? 'border-orange-500 bg-orange-500'
                                      : 'border-slate-300 dark:border-slate-600'
                                  }`}
                                >
                                  {isSelected && (
                                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  {/* Name + badges */}
                                  <div className="mb-1 flex flex-wrap items-center gap-1.5">
                                    <span className="text-xs font-bold text-slate-950 dark:text-white">
                                      {addr.recipientName}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      •
                                    </span>
                                    <span className="text-[11px] font-medium text-slate-500">
                                      {addr.phone}
                                    </span>
                                    <span
                                      className={`inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                                        addr.label === 'Kantor'
                                          ? 'border-blue-200/80 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                                          : 'border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                      }`}
                                    >
                                      {addr.label === 'Kantor' ? (
                                        <Building2 className="h-2.5 w-2.5" />
                                      ) : (
                                        <Home className="h-2.5 w-2.5" />
                                      )}
                                      {addr.label || 'Rumah'}
                                    </span>
                                    {addr.isDefault && (
                                      <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-950 px-2 py-0.5 text-[10px] font-bold text-white dark:bg-slate-100 dark:text-slate-900">
                                        <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                                        Utama
                                      </span>
                                    )}
                                  </div>
                                  {/* Full address */}
                                  <p className="text-[11px] font-medium leading-relaxed text-slate-700 dark:text-slate-300">
                                    {addr.fullAddress}
                                  </p>
                                  <p className="mt-0.5 text-[10px] text-slate-400">
                                    {[
                                      addr.district,
                                      addr.city,
                                      addr.province,
                                      addr.postalCode,
                                    ]
                                      .filter(Boolean)
                                      .join(', ')}
                                  </p>
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {/* Link to settings */}
                    <Link
                      href="/dashboard/customer/settings"
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 transition hover:text-orange-700"
                    >
                      <Edit3 className="h-3 w-3" />
                      Kelola semua alamat di pengaturan
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>

                  {/* AddressModal */}
                  <AddressModal
                    isOpen={isAddressModalOpen}
                    onClose={() => setIsAddressModalOpen(false)}
                    onSuccess={async () => {
                      await fetchAddresses(true)
                    }}
                  />

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Pilihan Kurir Terproteksi Asuransi
                    </label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCourier('JNE')
                          if (
                            courierService !== 'YES' &&
                            courierService !== 'REG'
                          ) {
                            setCourierService('REG')
                          }
                        }}
                        className={`rounded-2xl border p-3.5 text-left transition-all ${
                          courier === 'JNE'
                            ? 'shadow-2xs border-slate-950 bg-slate-950 text-white dark:border-blue-600 dark:bg-blue-600'
                            : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="flex items-center gap-1.5">
                            <Truck className="h-3.5 w-3.5" /> JNE Express
                          </span>
                          <span>
                            {courierService === 'YES' && courier === 'JNE'
                              ? 'Rp 28.000'
                              : 'Rp 15.000'}
                          </span>
                        </div>
                        <p
                          className={`mt-1 text-[10px] ${courier === 'JNE' ? 'text-slate-300' : 'text-slate-400'}`}
                        >
                          {courierService === 'YES' && courier === 'JNE'
                            ? 'Layanan YES (1 Hari Esok Sampai)'
                            : 'Layanan Reguler (1-2 Hari Kerja)'}
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCourier('GOJEK')
                          setCourierService('INSTANT')
                        }}
                        className={`rounded-2xl border p-3.5 text-left transition-all ${
                          courier === 'GOJEK'
                            ? 'shadow-2xs border-slate-950 bg-slate-950 text-white dark:border-blue-600 dark:bg-blue-600'
                            : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="flex items-center gap-1.5">
                            <Truck className="h-3.5 w-3.5" /> Gojek Instant
                          </span>
                          <span>Rp 35.000</span>
                        </div>
                        <p
                          className={`mt-1 text-[10px] ${courier === 'GOJEK' ? 'text-slate-300' : 'text-slate-400'}`}
                        >
                          Langsung Sampai (Maks 2 Jam)
                        </p>
                      </button>
                    </div>

                    {/* JNE Service Sub-Toggle (MED-08) */}
                    {courier === 'JNE' && (
                      <div className="mt-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-2.5 dark:border-slate-800 dark:bg-slate-900/60">
                        <div className="mb-2 flex items-center justify-between px-1">
                          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            Pilihan Paket JNE
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Pilih estimasi kedatangan paket
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setCourierService('REG')}
                            className={`flex flex-col rounded-xl px-3 py-2 text-left transition-all ${
                              courierService === 'REG'
                                ? 'shadow-2xs border border-blue-600 bg-blue-50/80 font-bold text-blue-950 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-100'
                                : 'border border-slate-200/80 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300'
                            }`}
                          >
                            <span className="text-xs">JNE Reguler (REG)</span>
                            <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                              Rp 15.000 • 1-2 Hari Kerja
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setCourierService('YES')}
                            className={`flex flex-col rounded-xl px-3 py-2 text-left transition-all ${
                              courierService === 'YES'
                                ? 'shadow-2xs border border-orange-500 bg-orange-50/80 font-bold text-orange-950 dark:border-orange-500 dark:bg-orange-950/40 dark:text-orange-100'
                                : 'border border-slate-200/80 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300'
                            }`}
                          >
                            <span className="flex items-center justify-between text-xs">
                              <span>JNE YES</span>
                              <span className="py-0.2 rounded bg-orange-500/15 px-1 text-[9px] font-semibold text-orange-600 dark:text-orange-400">
                                Esok
                              </span>
                            </span>
                            <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                              Rp 28.000 • Prioritas 1 Hari
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Payment Method */}
              <div className="shadow-xs space-y-4 rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <h2 className="flex items-center gap-2 text-sm font-bold text-slate-950 dark:text-white">
                    <CreditCard className="h-4 w-4 text-orange-500" /> Metode
                    Pembayaran
                  </h2>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Langkah 2 dari 2
                  </span>
                </div>

                <div className="space-y-2.5">
                  {/* Payment Gateway (QRIS, VA) */}
                  <label
                    className={`flex cursor-pointer items-start justify-between rounded-2xl border p-4 transition-all ${
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
                        <span className="block text-xs font-bold text-slate-950 dark:text-white">
                          Payment Gateway Otomatis (QRIS, BCA VA, Mandiri,
                          E-Wallet)
                        </span>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Konfirmasi instan otomatis tanpa perlu upload bukti
                          transfer
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      Rekomendasi
                    </span>
                  </label>

                  {/* Manual Transfer */}
                  <label
                    className={`flex cursor-pointer items-start justify-between rounded-2xl border p-4 transition-all ${
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
                        <span className="block text-xs font-bold text-slate-950 dark:text-white">
                          Transfer Bank Manual ke Rekening Toko
                        </span>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Transfer langsung ke rekening bank resmi toko counter
                          fisik
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Display Bank Accounts if Manual Transfer Selected */}
                  {paymentMethod === 'MANUAL_TRANSFER' && (
                    <div className="mt-2 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                        <Building2 className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                        Rekening Tujuan Pembayaran Resmi:
                      </span>

                      {bankAccounts.length > 0 ? (
                        <div className="space-y-2">
                          {bankAccounts.map((acc) => (
                            <div
                              key={acc.id}
                              className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
                            >
                              <div>
                                <span className="block text-xs font-bold text-slate-900 dark:text-white">
                                  {acc.bankName} - {acc.accountNumber}
                                </span>
                                <span className="block text-[10px] text-slate-500">
                                  a.n. {acc.accountName}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyAccount(acc.accountNumber, acc.id)
                                }
                                className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
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
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-3 text-center dark:border-slate-800 dark:bg-slate-900/50">
                          <span className="block text-xs text-slate-500 dark:text-slate-400">
                            Informasi rekening tujuan transfer akan dikirimkan
                            otomatis setelah pesanan dibuat.
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Items Preview */}
              <div className="shadow-xs space-y-3 rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <h2 className="text-sm font-bold text-slate-950 dark:text-white">
                    Produk yang Dipesan ({selectedItems.length})
                  </h2>
                  <Link
                    href="/cart"
                    className="text-[11px] font-semibold text-orange-600 hover:underline"
                  >
                    Ubah Keranjang
                  </Link>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800">
                        <Image
                          src={item.image || '/placeholder.png'}
                          alt={item.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-1 text-xs font-bold text-slate-900 dark:text-white">
                          {item.name}
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          {item.quantity} unit × Rp{' '}
                          {item.price.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-xs font-bold tabular-nums text-slate-950 dark:text-white">
                          Rp{' '}
                          {(item.price * item.quantity).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary & Checkout Action (5 cols, Sticky) */}
            <div className="sticky top-28 space-y-4 lg:col-span-5">
              <div className="shadow-xs space-y-4 rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                <h3 className="border-b border-slate-100 pb-3.5 text-sm font-bold text-slate-950 dark:border-slate-800 dark:text-white">
                  Ringkasan Pembayaran
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Subtotal Produk</span>
                    <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                      Rp {subtotal.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>
                      Ongkos Kirim (
                      {courier === 'JNE'
                        ? `JNE ${courierService}`
                        : 'Gojek Instant'}
                      )
                    </span>
                    <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                      Rp {shippingCost.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                      <span>Asuransi Kurir 100%</span>
                    </span>
                    <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                      Rp {insuranceFee.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Free Bonus 3-in-1 Included */}
                  <div className="flex items-center justify-between pt-0.5 text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Gift className="h-3.5 w-3.5 text-orange-500" />
                      <span>Bonus Aksesoris 3-in-1</span>
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      GRATIS (Rp 0)
                    </span>
                  </div>
                  <p className="-mt-1 pl-5 text-[10px] leading-tight text-slate-400">
                    Charger 20W + Tempered Glass + Case
                  </p>

                  {/* Total Payment Row */}
                  <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <div>
                      <span className="block text-xs font-bold text-slate-900 dark:text-white">
                        Total Tagihan
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        Termasuk PPN & Asuransi
                      </span>
                    </div>

                    <span className="whitespace-nowrap text-base font-bold tabular-nums tracking-tight text-slate-950 dark:text-white sm:text-lg">
                      Rp {total.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Terms Agreement */}
                <div className="pt-1">
                  <label className="flex cursor-pointer items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-950"
                    />
                    <span className="leading-snug">
                      Saya menyetujui syarat garansi resmi toko 30 hari tukar
                      unit & asuransi kurir terproteksi.
                    </span>
                  </label>
                </div>

                {/* Primary CTA */}
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3.5 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition-all hover:bg-orange-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
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
                <div className="space-y-1.5 rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800/80 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span>Garansi 30 Hari Tukar Unit Gadget Second</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                    <Truck className="h-3.5 w-3.5 shrink-0 text-blue-600" />
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
