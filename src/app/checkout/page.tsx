'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Script from 'next/script'
import { toast } from 'sonner'
import { loadMidtransSnap } from '@/lib/snap'
import { useCartStore } from '@/lib/store/cart-store'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import {
  AddressModal,
  UserAddressItem,
} from '@/components/customer/address-modal'
import { MobileShopeeCheckoutView } from '@/components/checkout/mobile-shopee-checkout-view'
import {
  calculateInsuranceFee,
  INSURANCE_PERCENTAGE,
} from '@/lib/constants/insurance'
import {
  calculateWeightShipping,
  calculateBilledKg,
  DEFAULT_PRICE_PER_KG,
  DEFAULT_WEIGHT_GRAM,
  WEIGHT_THRESHOLD_GRAM,
} from '@/lib/constants/shipping'
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
  ChevronRight,
  Star,
  Edit3,
  Tag,
  X,
  AlertCircle,
  CheckCircle2,
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
  const syncFromServer = useCartStore((state) => state.syncFromServer)
  const userId = useCartStore((state) => state.userId)
  const buyNowItem = useCartStore((state) => state.buyNowItem)
  const clearBuyNowItem = useCartStore((state) => state.clearBuyNowItem)

  const [isDirectBuy, setIsDirectBuy] = useState(false)
  const [directItem, setDirectItem] = useState<any>(null)

  // Detect Buy Now mode from URL parameter or cached direct item
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('buyNow') === '1') {
        setIsDirectBuy(true)
        let item = buyNowItem
        if (!item) {
          try {
            const stored = sessionStorage.getItem('affiliate_gadget_buy_now')
            if (stored) item = JSON.parse(stored)
          } catch {}
        }
        if (item) {
          setDirectItem(item)
        }
      }
    }
  }, [buyNowItem])

  const selectedItems = useMemo(() => {
    if (isDirectBuy && directItem) {
      return [directItem]
    }
    return items.filter((item) => selectedItemIds.includes(item.id))
  }, [isDirectBuy, directItem, items, selectedItemIds])

  const [courier, setCourier] = useState<'JNE' | 'GOJEK'>('JNE')
  const [courierService, setCourierService] = useState('REG')
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<
    'GATEWAY' | 'MANUAL_TRANSFER'
  >('GATEWAY')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Voucher Promo state
  const [voucherInput, setVoucherInput] = useState('')
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false)
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string
    discountPercent: number
    discountAmount: number
    maxDiscountAmount?: number | null
    minimumPurchase?: number
    description?: string | null
  } | null>(null)
  const [voucherError, setVoucherError] = useState<string | null>(null)

  // Idempotency Key (LOW-04): unik per payload keranjang atau pesanan langsung
  const idempotencyKeyRef = useRef<string>('')
  useEffect(() => {
    if (typeof window !== 'undefined') {
      idempotencyKeyRef.current =
        window.crypto?.randomUUID?.() ||
        `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`
    }
  }, [selectedItemIds, isDirectBuy, directItem])

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

  useEffect(() => {
    if (status === 'unauthenticated') {
      const redirectTarget = isDirectBuy ? '/checkout?buyNow=1' : '/checkout'
      router.push(`/login?redirect=${encodeURIComponent(redirectTarget)}`)
    } else if (status === 'authenticated') {
      if (userId !== session.user.id) {
        setUserId(session.user.id)
      } else {
        syncFromServer()
      }
      setLoading(false)
      fetchAddresses()
    }
  }, [
    status,
    router,
    session,
    userId,
    setUserId,
    syncFromServer,
    fetchAddresses,
    isDirectBuy,
  ])

  const subtotal = selectedItems.reduce((sum, item) => {
    const itemPrice = item.rentalDays
      ? item.price * item.rentalDays * item.quantity
      : item.price * item.quantity
    return sum + itemPrice
  }, 0)

  // Calculate Mandatory Shipping Insurance (0.2% flat from physical items subtotal)
  const insuranceFee = calculateInsuranceFee(subtotal)

  // Weight calculation for shipping (billed in whole kg, min 1 kg)
  const totalWeightGram = selectedItems.reduce((sum, item) => {
    return sum + (item.weightGram ?? DEFAULT_WEIGHT_GRAM) * item.quantity
  }, 0)
  const billedKg = calculateBilledKg(totalWeightGram)
  const maxPricePerKg =
    selectedItems.length > 0
      ? Math.max(
          ...selectedItems.map(
            (item) => item.pricePerKg ?? DEFAULT_PRICE_PER_KG
          )
        )
      : DEFAULT_PRICE_PER_KG

  // Apakah total berat memenuhi threshold untuk penagihan per-kg (>= 1kg)
  const isWeightBased = totalWeightGram >= WEIGHT_THRESHOLD_GRAM

  const jneRegCost = calculateWeightShipping(
    totalWeightGram,
    maxPricePerKg,
    'JNE',
    'REG'
  )
  const jneYesCost = calculateWeightShipping(
    totalWeightGram,
    maxPricePerKg,
    'JNE',
    'YES'
  )
  const gojekCost = calculateWeightShipping(
    totalWeightGram,
    maxPricePerKg,
    'GOJEK',
    'INSTANT'
  )
  const gojekSamedayCost = calculateWeightShipping(
    totalWeightGram,
    maxPricePerKg,
    'GOJEK',
    'SAMEDAY'
  )

  const shippingCost =
    courier === 'GOJEK'
      ? courierService === 'SAMEDAY'
        ? gojekSamedayCost
        : gojekCost
      : courierService === 'YES'
        ? jneYesCost
        : jneRegCost

  const voucherDiscount = appliedVoucher ? appliedVoucher.discountAmount : 0
  const total = Math.max(
    0,
    subtotal + shippingCost + insuranceFee - voucherDiscount
  )

  // Recalculate applied voucher if subtotal changes
  useEffect(() => {
    if (appliedVoucher) {
      if (
        appliedVoucher.minimumPurchase !== undefined &&
        subtotal < appliedVoucher.minimumPurchase
      ) {
        toast.error(
          `Minimum belanja Rp ${appliedVoucher.minimumPurchase.toLocaleString('id-ID')} tidak lagi terpenuhi. Voucher ${appliedVoucher.code} dilepas.`
        )
        setAppliedVoucher(null)
        setVoucherError(
          `Voucher ${appliedVoucher.code} membutuhkan minimum belanja Rp ${appliedVoucher.minimumPurchase.toLocaleString('id-ID')}`
        )
        return
      }

      const raw = subtotal * (appliedVoucher.discountPercent / 100)
      const cap =
        appliedVoucher.maxDiscountAmount !== undefined &&
        appliedVoucher.maxDiscountAmount !== null &&
        appliedVoucher.maxDiscountAmount > 0
          ? Math.min(raw, appliedVoucher.maxDiscountAmount)
          : raw
      const newDiscount = Math.round(Math.min(subtotal, Math.max(0, cap)))
      setAppliedVoucher((prev) =>
        prev ? { ...prev, discountAmount: newDiscount } : null
      )
    }
  }, [subtotal])

  const handleApplyVoucher = async () => {
    const trimmed = voucherInput.trim().toUpperCase()
    if (!trimmed) {
      setVoucherError('Silakan masukkan kode voucher terlebih dahulu')
      return
    }
    setIsValidatingVoucher(true)
    setVoucherError(null)
    try {
      const res = await fetch('/api/vouchers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: trimmed,
          subtotal,
          orderType: 'PRODUCT',
        }),
      })
      const data = await res.json()
      if (data.valid) {
        setAppliedVoucher({
          code: data.voucherCode,
          discountPercent: data.discountPercent,
          discountAmount: data.discountAmount,
          maxDiscountAmount: data.maxDiscountAmount,
          minimumPurchase: data.minimumPurchase,
          description: data.description,
        })
        setVoucherError(null)
        toast.success(
          `Voucher ${data.voucherCode} berhasil digunakan! Hemat Rp ${data.discountAmount.toLocaleString('id-ID')}`
        )
      } else {
        setAppliedVoucher(null)
        const errorMsg = data.reason || 'Kode voucher tidak valid'
        setVoucherError(errorMsg)
        toast.error(errorMsg)
      }
    } catch {
      const fallbackMsg = 'Terjadi kesalahan sistem saat memverifikasi voucher'
      setVoucherError(fallbackMsg)
      toast.error(fallbackMsg)
    } finally {
      setIsValidatingVoucher(false)
    }
  }

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null)
    setVoucherInput('')
    setVoucherError(null)
    toast.info('Voucher berhasil dihapus')
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

    if (subtotal <= 0) {
      toast.error('Subtotal pesanan tidak valid')
      return
    }

    if (isNaN(insuranceFee) || insuranceFee < 0) {
      toast.error('Perhitungan asuransi tidak valid. Harap refresh halaman.')
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

      const sanitizedItems = selectedItems.map((item) => ({
        id: item.id,
        type: item.type || 'PRODUCT',
        productId:
          item.productId || (item.type === 'PRODUCT' ? item.id : undefined),
        variantId: item.variantId || undefined,
        variantName: item.variantName || undefined,
        rentalItemId:
          item.rentalItemId || (item.type === 'RENTAL' ? item.id : undefined),
        serviceId:
          item.serviceId || (item.type === 'SERVICE' ? item.id : undefined),
        quantity: Number(item.quantity) || 1,
        rentalDays: item.rentalDays ? Number(item.rentalDays) : undefined,
        name: item.name || '',
        price: Number(item.price) || 0,
        image: item.image || '',
        weightGram: item.weightGram,
        pricePerKg: item.pricePerKg,
        notes: item.notes,
      }))

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKeyRef.current,
        },
        body: JSON.stringify({
          items: sanitizedItems,
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
          recipientName: selectedAddress?.recipientName || '',
          recipientPhone: selectedAddress?.phone || '',
          voucherCode: appliedVoucher?.code || null,
          notes: notes,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error('Checkout error response:', errorData)
        // Refresh idempotency key agar user bisa mencoba kembali jika request ditolak validasi/stok
        if (typeof window !== 'undefined') {
          idempotencyKeyRef.current =
            window.crypto?.randomUUID?.() ||
            `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`
        }
        let errorMsg = errorData.error || 'Gagal memproses checkout'
        if (errorData.details && typeof errorData.details === 'object') {
          const detailStr = Object.entries(errorData.details)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join('; ')
          if (detailStr) errorMsg = `${errorMsg} (${detailStr})`
        }
        throw new Error(errorMsg)
      }

      const data = await res.json()
      if (isDirectBuy) {
        clearBuyNowItem()
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.removeItem('affiliate_gadget_buy_now')
          } catch {}
        }
      } else {
        removeSelectedItems()
      }

      const orderIds = (data.orders || [])
        .map((o: CheckoutOrderResponseItem) => o.order?.id || o.id)
        .filter(Boolean)
        .join(',')

      // Trigger Custom In-House Payment Flow if payment method is GATEWAY
      if (paymentMethod === 'GATEWAY') {
        router.push(`/order-confirmation/multiple?orders=${orderIds}&autoPay=1`)
        toast.success('Pesanan berhasil dibuat! Silakan selesaikan pembayaran.')
        return
      }

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
            {isDirectBuy ? 'Unit Belum Dipilih' : 'Tidak Ada Item yang Dipilih'}
          </h2>
          <p className="text-xs text-slate-500">
            {isDirectBuy
              ? 'Silakan pilih unit gadget resmi di katalog sebelum melanjutkan checkout.'
              : 'Pilih gadget resmi di keranjang Anda sebelum melanjutkan proses checkout.'}
          </p>
          <div className="pt-2">
            <Link
              href={isDirectBuy ? '/gadget' : '/cart'}
              className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition hover:bg-orange-600"
            >
              <ArrowLeft className="h-4 w-4" />{' '}
              {isDirectBuy ? 'Kembali ke Katalog' : 'Kembali ke Keranjang'}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const backHref =
    isDirectBuy && directItem?.productId
      ? `/gadget/${directItem.productId}`
      : '/cart'

  return (
    <>
      {/* 1. Mobile View — Shopee Checkout Minimalis (Sesuai Screenshot Pengguna) */}
      <div className="block md:hidden">
        <MobileShopeeCheckoutView
          selectedItems={selectedItems}
          isDirectBuy={isDirectBuy}
          addresses={addresses}
          selectedAddressId={selectedAddressId}
          setSelectedAddressId={setSelectedAddressId}
          onOpenNewAddressModal={() => setIsAddressModalOpen(true)}
          courier={courier}
          setCourier={setCourier}
          courierService={courierService}
          setCourierService={setCourierService}
          notes={notes}
          setNotes={setNotes}
          voucherInput={voucherInput}
          setVoucherInput={setVoucherInput}
          handleApplyVoucher={handleApplyVoucher}
          handleRemoveVoucher={handleRemoveVoucher}
          appliedVoucher={appliedVoucher}
          voucherError={voucherError}
          isValidatingVoucher={isValidatingVoucher}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          termsAccepted={termsAccepted}
          setTermsAccepted={setTermsAccepted}
          subtotal={subtotal}
          insuranceFee={insuranceFee}
          shippingCost={shippingCost}
          voucherDiscount={voucherDiscount}
          total={total}
          submitting={submitting}
          handleSubmitOrder={handleCheckout}
          backHref={backHref}
        />
      </div>

      {/* 2. Desktop View — Layout Desktop Utuh */}
      <div className="hidden min-h-screen flex-col justify-between bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 md:flex">
        <Navbar variant="light" />

        <main className="pb-20 pt-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (
                      typeof window !== 'undefined' &&
                      window.history.length > 1
                    ) {
                      router.back()
                    } else {
                      router.push(backHref)
                    }
                  }}
                  className="shadow-2xs flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-600 transition-all hover:border-slate-300 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white"
                  title={
                    isDirectBuy ? 'Kembali ke Produk' : 'Kembali ke Keranjang'
                  }
                  aria-label={
                    isDirectBuy ? 'Kembali ke Produk' : 'Kembali ke Keranjang'
                  }
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                    {isDirectBuy ? 'Checkout Langsung' : 'Checkout Pesanan'}
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isDirectBuy
                      ? 'Konfirmasi pesanan unit gadget & pengiriman resmi'
                      : 'Lengkapi pengiriman & konfirmasi pembayaran resmi'}
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
                      <MapPin className="h-4 w-4 text-orange-400" /> Alamat &
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
                                    ? 'border-orange-300 bg-orange-50/30 ring-1 ring-orange-200/50 dark:border-orange-800/60 dark:bg-orange-950/20'
                                    : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/60 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-slate-600'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  {/* Radio indicator */}
                                  <div
                                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                                      isSelected
                                        ? 'border-orange-400 bg-orange-400'
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
                                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                        {addr.label === 'Kantor' ? (
                                          <Building2 className="h-2.5 w-2.5" />
                                        ) : (
                                          <Home className="h-2.5 w-2.5" />
                                        )}
                                        {addr.label || 'Rumah'}
                                      </span>
                                      {addr.isDefault && (
                                        <span className="inline-flex items-center gap-1 rounded-full border border-orange-200/60 bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-300">
                                          <Star className="h-2.5 w-2.5 fill-orange-500 text-orange-500" />
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
                      <div className="mb-1.5 flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Pilihan Kurir Terproteksi Asuransi
                        </label>
                      </div>
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
                              ? 'shadow-xs border-orange-300 bg-orange-50/30 text-slate-950 ring-1 ring-orange-200/50 dark:border-orange-800/60 dark:bg-orange-950/20 dark:text-white'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="flex items-center gap-1.5">
                              <Truck
                                className={`h-3.5 w-3.5 ${courier === 'JNE' ? 'text-orange-400' : 'text-slate-400'}`}
                              />{' '}
                              JNE Express
                            </span>
                            <span
                              className={
                                courier === 'JNE'
                                  ? 'font-bold text-orange-600 dark:text-orange-400'
                                  : 'text-slate-900 dark:text-white'
                              }
                            >
                              {courierService === 'YES' && courier === 'JNE'
                                ? `Rp ${jneYesCost.toLocaleString('id-ID')}`
                                : `Rp ${jneRegCost.toLocaleString('id-ID')}`}
                            </span>
                          </div>
                          <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
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
                              ? 'shadow-xs border-orange-300 bg-orange-50/30 text-slate-950 ring-1 ring-orange-200/50 dark:border-orange-800/60 dark:bg-orange-950/20 dark:text-white'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="flex items-center gap-1.5">
                              <Truck
                                className={`h-3.5 w-3.5 ${courier === 'GOJEK' ? 'text-orange-400' : 'text-slate-400'}`}
                              />{' '}
                              Gojek Instant
                            </span>
                            <span
                              className={
                                courier === 'GOJEK'
                                  ? 'font-bold text-orange-600 dark:text-orange-400'
                                  : 'text-slate-900 dark:text-white'
                              }
                            >
                              Rp {gojekCost.toLocaleString('id-ID')}
                            </span>
                          </div>
                          <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
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
                                  ? 'shadow-xs border border-orange-300 bg-orange-50/30 font-bold text-slate-950 ring-1 ring-orange-200/50 dark:border-orange-800/60 dark:bg-orange-950/20 dark:text-white'
                                  : 'border border-slate-200/80 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300'
                              }`}
                            >
                              <span className="text-xs">JNE Reguler (REG)</span>
                              <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                                Rp {jneRegCost.toLocaleString('id-ID')} • 1-2
                                Hari Kerja
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setCourierService('YES')}
                              className={`flex flex-col rounded-xl px-3 py-2 text-left transition-all ${
                                courierService === 'YES'
                                  ? 'shadow-xs border border-orange-300 bg-orange-50/30 font-bold text-slate-950 ring-1 ring-orange-200/50 dark:border-orange-800/60 dark:bg-orange-950/20 dark:text-white'
                                  : 'border border-slate-200/80 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300'
                              }`}
                            >
                              <span className="flex items-center justify-between text-xs">
                                <span>JNE YES</span>
                                <span className="py-0.2 rounded bg-slate-100 px-1 text-[9px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                  Esok
                                </span>
                              </span>
                              <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                                Rp {jneYesCost.toLocaleString('id-ID')} •
                                Prioritas 1 Hari
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
                      <CreditCard className="h-4 w-4 text-orange-400" /> Metode
                      Pembayaran
                    </h2>
                    <span className="text-[11px] font-semibold text-slate-400">
                      Langkah 2 dari 2
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {/* Payment Gateway Otomatis (QRIS, VA, E-Wallet) */}
                    <div className="flex items-start justify-between rounded-2xl border border-orange-300/80 bg-orange-50/20 p-4 ring-1 ring-orange-200/50 dark:border-orange-800/60 dark:bg-orange-950/20">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-orange-400 bg-orange-400 text-white">
                          <Check className="h-2.5 w-2.5" />
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-slate-950 dark:text-white">
                            Payment Gateway Otomatis (QRIS, BCA VA, Mandiri,
                            BNI, BRI)
                          </span>
                          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                            Konfirmasi instan otomatis tanpa perlu upload bukti
                            transfer. Bayar mudah via scan QRIS atau Virtual
                            Account bank resmi.
                          </p>
                          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                            <span className="shadow-2xs rounded-md border border-slate-200/80 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                              QRIS
                            </span>
                            <span className="shadow-2xs rounded-md border border-slate-200/80 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                              BCA VA
                            </span>
                            <span className="shadow-2xs rounded-md border border-slate-200/80 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                              Mandiri Bill
                            </span>
                            <span className="shadow-2xs rounded-md border border-slate-200/80 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                              BNI VA
                            </span>
                            <span className="shadow-2xs rounded-md border border-slate-200/80 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                              BRI VA
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full border border-orange-200/80 bg-orange-50 px-2.5 py-0.5 text-[10px] font-semibold text-orange-600 dark:border-orange-800/60 dark:bg-orange-950/40 dark:text-orange-300">
                        Otomatis & Terverifikasi
                      </span>
                    </div>
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
                            {item.weightGram ? (
                              <span className="ml-1.5 font-medium text-slate-500 dark:text-slate-400">
                                •{' '}
                                {item.weightGram >= 1000
                                  ? `${(item.weightGram / 1000).toLocaleString('id-ID')} kg`
                                  : `${item.weightGram}g`}{' '}
                                / unit
                              </span>
                            ) : null}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="text-xs font-bold tabular-nums text-slate-950 dark:text-white">
                            Rp{' '}
                            {(item.price * item.quantity).toLocaleString(
                              'id-ID'
                            )}
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
                        {totalWeightGram >= 1000
                          ? `${(totalWeightGram / 1000).toLocaleString('id-ID')} kg`
                          : `${totalWeightGram}g`}{' '}
                        ·{' '}
                        {courier === 'JNE'
                          ? `JNE ${courierService}`
                          : `Gojek ${courierService === 'SAMEDAY' ? 'Sameday' : 'Instant'}`}
                        )
                      </span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                        Rp {shippingCost.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                        <span>Asuransi Pengiriman (0,2%)</span>
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

                    {/* Voucher Discount Deduction */}
                    {voucherDiscount > 0 && (
                      <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Tag className="h-3.5 w-3.5" />
                          <span>Diskon Voucher ({appliedVoucher?.code})</span>
                        </span>
                        <span className="font-bold tabular-nums">
                          - Rp {voucherDiscount.toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}

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

                  {/* Voucher Promo Section (Below Total Tagihan, Responsive) */}
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                        <Tag className="h-3.5 w-3.5 text-orange-500" />
                        <span>Kode Voucher Promo</span>
                      </div>
                      {appliedVoucher && (
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          Voucher Terpasang
                        </span>
                      )}
                    </div>

                    {appliedVoucher ? (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-3 text-xs dark:border-emerald-800/70 dark:bg-emerald-950/40">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                              <span className="font-bold tracking-wide text-emerald-800 dark:text-emerald-200">
                                {appliedVoucher.code}
                              </span>
                              <span className="rounded-md bg-emerald-200/80 px-1.5 py-0.5 text-[10px] font-extrabold text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200">
                                {appliedVoucher.discountPercent}% OFF
                              </span>
                            </div>
                            <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                              Potongan Diskon: Hemat Rp{' '}
                              {appliedVoucher.discountAmount.toLocaleString(
                                'id-ID'
                              )}
                            </p>
                            {appliedVoucher.maxDiscountAmount &&
                              appliedVoucher.maxDiscountAmount > 0 && (
                                <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">
                                  *Maksimal diskon Rp{' '}
                                  {appliedVoucher.maxDiscountAmount.toLocaleString(
                                    'id-ID'
                                  )}
                                </p>
                              )}
                            {appliedVoucher.description && (
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                {appliedVoucher.description}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveVoucher}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-800 transition hover:bg-red-100 hover:text-red-700 dark:bg-emerald-900/60 dark:text-emerald-200 dark:hover:bg-red-950 dark:hover:text-red-300"
                            title="Hapus voucher"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={voucherInput}
                            onChange={(e) => {
                              setVoucherInput(e.target.value.toUpperCase())
                              if (voucherError) setVoucherError(null)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleApplyVoucher()
                              }
                            }}
                            placeholder="Contoh: HEMAT20"
                            disabled={isValidatingVoucher}
                            className={`w-full min-w-0 rounded-xl border bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-900 placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 focus:outline-none dark:bg-slate-800 dark:text-white ${
                              voucherError
                                ? 'border-red-400 focus:border-red-500 dark:border-red-700'
                                : 'border-slate-200 focus:border-orange-300 focus:ring-1 focus:ring-orange-200/60 dark:border-slate-700'
                            }`}
                          />
                          <button
                            type="button"
                            disabled={
                              isValidatingVoucher || !voucherInput.trim()
                            }
                            onClick={handleApplyVoucher}
                            className="shrink-0 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                          >
                            {isValidatingVoucher ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              'Gunakan'
                            )}
                          </button>
                        </div>

                        {voucherError && (
                          <div className="flex items-start gap-1.5 rounded-xl border border-red-200 bg-red-50/90 p-2.5 text-[11px] font-medium leading-tight text-red-600 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400">
                            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                            <span>{voucherError}</span>
                          </div>
                        )}
                      </div>
                    )}
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
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3.5 text-xs font-bold text-white shadow-sm shadow-orange-500/20 transition-all hover:bg-orange-500/90 hover:shadow-orange-500/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
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

        <div className="hidden md:block">
          <Footer variant="light" />
        </div>

        {/* Midtrans Snap JS SDK with fallback client key */}
        <Script
          src={
            process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
              ? 'https://app.midtrans.com/snap/snap.js'
              : 'https://app.sandbox.midtrans.com/snap/snap.js'
          }
          data-client-key={
            process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ||
            'Mid-client-WIrTyc_9rhskvlK5'
          }
          strategy="afterInteractive"
        />
      </div>

      {/* Shared Address Modal untuk Tambah Alamat Baru */}
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSuccess={async () => {
          await fetchAddresses(true)
        }}
      />
    </>
  )
}
