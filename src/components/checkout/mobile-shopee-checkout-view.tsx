'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  MapPin,
  ChevronRight,
  Check,
  ShieldCheck,
  Ticket,
  CreditCard,
  Loader2,
  X,
  Plus,
  Home,
  Building2,
  Truck,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { UserAddressItem } from '@/components/customer/address-modal'
import { ShippingOption } from '@/lib/shipping/shipping-engine'
import { toast } from 'sonner'

interface MobileShopeeCheckoutViewProps {
  selectedItems: any[]
  isDirectBuy: boolean
  addresses: UserAddressItem[]
  selectedAddressId: string | null
  setSelectedAddressId: (id: string) => void
  onOpenNewAddressModal: () => void
  courier: 'JNE' | 'GOJEK'
  setCourier: (c: 'JNE' | 'GOJEK') => void
  courierService: string
  setCourierService: (s: string) => void
  notes: string
  setNotes: (n: string) => void
  voucherInput: string
  setVoucherInput: (v: string) => void
  handleApplyVoucher: () => void
  handleRemoveVoucher: () => void
  appliedVoucher: {
    code: string
    discountPercent: number
    discountAmount: number
    description?: string | null
  } | null
  voucherError: string | null
  isValidatingVoucher: boolean
  paymentMethod?: 'GATEWAY' | 'MANUAL_TRANSFER'
  setPaymentMethod?: (m: 'GATEWAY' | 'MANUAL_TRANSFER') => void
  termsAccepted: boolean
  setTermsAccepted: (accepted: boolean) => void
  subtotal: number
  insuranceFee: number
  shippingCost: number
  voucherDiscount: number
  total: number
  submitting: boolean
  handleSubmitOrder: () => void
  backHref: string
  // Real-time shipping engine props
  shippingOptions?: ShippingOption[]
  loadingShippingRates?: boolean
  shippingDistanceKm?: number | null
  jneRegCost?: number
  jneYesCost?: number
  gojekCost?: number
  isGojekAvailable?: boolean
  gojekUnavailableReason?: string
}

export function MobileShopeeCheckoutView({
  selectedItems,
  isDirectBuy,
  addresses,
  selectedAddressId,
  setSelectedAddressId,
  onOpenNewAddressModal,
  courier,
  setCourier,
  courierService,
  setCourierService,
  notes,
  setNotes,
  voucherInput,
  setVoucherInput,
  handleApplyVoucher,
  handleRemoveVoucher,
  appliedVoucher,
  voucherError,
  isValidatingVoucher,
  paymentMethod,
  setPaymentMethod,
  termsAccepted,
  setTermsAccepted,
  subtotal,
  insuranceFee,
  shippingCost,
  voucherDiscount,
  total,
  submitting,
  handleSubmitOrder,
  backHref,
  shippingOptions = [],
  loadingShippingRates = false,
  shippingDistanceKm = null,
  jneRegCost = 15_000,
  jneYesCost = 28_000,
  gojekCost = 20_000,
  isGojekAvailable = true,
  gojekUnavailableReason,
}: MobileShopeeCheckoutViewProps) {
  const [showVoucherBox, setShowVoucherBox] = useState(false)
  const [showNotesInput, setShowNotesInput] = useState(false)
  const [showAddressPicker, setShowAddressPicker] = useState(false)
  const [termsWarning, setTermsWarning] = useState(false)
  const termsRef = useRef<HTMLDivElement>(null)

  // Auto reset termsWarning setelah 700ms (berkedip sekali saja)
  useEffect(() => {
    if (!termsWarning) return
    const timer = setTimeout(() => {
      setTermsWarning(false)
    }, 700)
    return () => clearTimeout(timer)
  }, [termsWarning])

  const handleBuatPesanan = () => {
    if (!termsAccepted) {
      setTermsWarning(true)
      toast.error(
        'Harap centang persetujuan syarat garansi 30 hari & asuransi!'
      )
      termsRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
      return
    }
    handleSubmitOrder()
  }

  const selectedAddress =
    addresses.find((a) => a.id === selectedAddressId) ??
    addresses.find((a) => a.isDefault) ??
    addresses[0] ??
    null

  // Ambil nama toko dari item pertama atau fallback
  const firstItemStore = selectedItems[0]?.store?.name
    ? selectedItems[0].store.name
        .replace('Affiliate Gadget - ', '')
        .replace('AffiliateGadget Store - ', '')
    : 'PT Gadget Jaya Sentosa (Roxy Mas Pusat)'

  const savingsTotal =
    voucherDiscount +
    selectedItems.reduce((sum, it) => {
      const orig = it.originalPrice ? it.originalPrice * it.quantity : 0
      const current = it.price * it.quantity
      return sum + (orig > current ? orig - current : 0)
    }, 0)

  const router = useRouter()

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else if (backHref) {
      router.push(backHref)
    } else {
      router.back()
    }
  }

  return (
    <div className="min-h-screen select-none bg-[#F6F6F9] font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* 1. Header Minimalis Shopee Style */}
      <header className="shadow-2xs sticky top-0 z-30 flex h-12 items-center justify-between border-b border-slate-200/80 bg-white px-3.5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleBack}
            className="-ml-1 flex h-8 w-8 cursor-pointer items-center justify-center text-orange-500 transition-colors active:scale-90"
            aria-label="Kembali"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-[15px] font-bold tracking-tight text-slate-950 dark:text-white">
            Checkout
          </h1>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Garansi 30 Hari</span>
        </div>
      </header>

      {/* Main Form Cards Container */}
      <main className="mx-auto max-w-md space-y-2.5 px-3 pb-20 pt-2.5">
        {/* 2. Alamat Pengiriman Card (Shopee Style) */}
        <div
          onClick={() => {
            if (addresses.length > 0) {
              setShowAddressPicker(true)
            } else {
              onOpenNewAddressModal()
            }
          }}
          className="shadow-2xs dark:active:bg-slate-850 cursor-pointer rounded-2xl border border-slate-200/70 bg-white p-3.5 transition-all active:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
            <div className="min-w-0 flex-1">
              {selectedAddress ? (
                <>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-950 dark:text-white">
                      {selectedAddress.recipientName}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {selectedAddress.phone}
                    </span>
                    {selectedAddress.isDefault && (
                      <span className="py-0.2 rounded bg-orange-50 px-1.5 text-[9px] font-bold text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                        Utama
                      </span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {selectedAddress.fullAddress}
                    {selectedAddress.district
                      ? `, ${selectedAddress.district}`
                      : ''}
                    {selectedAddress.city ? `, ${selectedAddress.city}` : ''}
                    {selectedAddress.province
                      ? `, ${selectedAddress.province}`
                      : ''}
                    {selectedAddress.postalCode
                      ? ` ${selectedAddress.postalCode}`
                      : ''}
                  </p>
                </>
              ) : (
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs font-semibold text-orange-500">
                    + Pilih atau Tambah Alamat Pengiriman
                  </span>
                </div>
              )}
            </div>
            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
          </div>
        </div>

        {/* 3. Toko & Daftar Barang Card (Shopee Style) */}
        <div className="shadow-2xs space-y-3 rounded-2xl border border-slate-200/70 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
          {/* Header Toko Cabang PT */}
          <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2.5 dark:border-slate-800">
            <span className="rounded bg-orange-500 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-white">
              Official
            </span>
            <span className="truncate text-xs font-bold text-slate-950 dark:text-white">
              {firstItemStore}
            </span>
          </div>

          {/* Daftar Produk */}
          <div className="space-y-3">
            {selectedItems.map((item, idx) => {
              const strikePrice =
                item.originalPrice && item.originalPrice > item.price
                  ? item.originalPrice
                  : Math.round(item.price * 1.15)

              return (
                <div key={item.id || idx} className="flex gap-2.5">
                  {/* Thumbnail Foto */}
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">
                        Gadget
                      </div>
                    )}
                  </div>

                  {/* Info Produk */}
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-slate-950 dark:text-white">
                        {item.name}
                      </h3>
                      {item.variantName && (
                        <span className="mt-0.5 inline-block text-[11px] text-slate-500 dark:text-slate-400">
                          Variasi: {item.variantName}
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs font-bold text-slate-950 dark:text-white">
                          Rp {Number(item.price).toLocaleString('id-ID')}
                        </span>
                        <span className="text-[10px] text-slate-400 line-through">
                          Rp {strikePrice.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        x{item.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Proteksi Kerusakan & Asuransi Wajib (Shopee Style) */}
          <div className="rounded-xl border border-orange-100 bg-orange-50/40 p-2.5 dark:border-orange-900/30 dark:bg-orange-950/20">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded bg-orange-500 text-white">
                <Check className="h-2.5 w-2.5 stroke-[3]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Proteksi Kerusakan & Asuransi Kurir
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Rp {insuranceFee.toLocaleString('id-ID')}
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] leading-tight text-slate-500 dark:text-slate-400">
                  Unit second dilindungi garansi fisik 30 hari tukar unit &
                  asuransi ganti rugi 100% jika hilang/rusak di perjalanan.
                </p>
              </div>
            </div>
          </div>

          {/* Opsi Pengiriman Kurir (Shopee Style) */}
          <div className="space-y-2 border-t border-slate-100 pt-2 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-950 dark:text-white">
                Opsi Pengiriman
              </span>
              <div className="flex items-center gap-1.5">
                {loadingShippingRates ? (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-orange-600 dark:text-orange-400">
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    Cek Tarif API...
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-400">
                    Logistik Terproteksi
                  </span>
                )}
              </div>
            </div>

            {/* Pilihan JNE Express */}
            <div
              onClick={() => {
                setCourier('JNE')
                if (courierService !== 'YES' && courierService !== 'REG') {
                  setCourierService('REG')
                }
              }}
              className={`cursor-pointer rounded-xl border p-3 transition-all ${
                courier === 'JNE'
                  ? 'border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500/30 dark:border-emerald-500 dark:bg-emerald-950/20'
                  : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                      courier === 'JNE'
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {courier === 'JNE' && (
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        JNE Express
                      </span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        Antar Kota & Provinsi
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {courierService === 'YES'
                        ? 'Layanan YES (1 Hari / Esok Sampai)'
                        : 'Layanan Reguler (2-3 Hari Kerja)'}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Rp{' '}
                  {(courierService === 'YES'
                    ? jneYesCost
                    : jneRegCost
                  ).toLocaleString('id-ID')}
                </span>
              </div>

              {/* Sub-Pilihan Paket JNE (REG 2-3 Hari vs YES 1 Hari) */}
              {courier === 'JNE' && (
                <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-slate-100 pt-2.5 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setCourier('JNE')
                      setCourierService('REG')
                    }}
                    className={`flex flex-col rounded-lg p-2 text-left transition-all ${
                      courierService === 'REG'
                        ? 'border border-emerald-500 bg-emerald-500/10 font-bold text-emerald-950 dark:text-emerald-300'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span>JNE Reguler</span>
                      <span className="text-[9px] font-normal text-slate-500">
                        2-3 Hari
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      Rp {jneRegCost.toLocaleString('id-ID')}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setCourier('JNE')
                      setCourierService('YES')
                    }}
                    className={`flex flex-col rounded-lg p-2 text-left transition-all ${
                      courierService === 'YES'
                        ? 'border border-emerald-500 bg-emerald-500/10 font-bold text-emerald-950 dark:text-emerald-300'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1">
                        JNE YES
                        <span className="py-0.2 rounded bg-orange-100 px-1 text-[8px] font-bold text-orange-700 dark:bg-orange-950/50 dark:text-orange-300">
                          Kilat
                        </span>
                      </span>
                      <span className="text-[9px] font-normal text-slate-500">
                        1 Hari
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      Rp {jneYesCost.toLocaleString('id-ID')}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Pilihan Gojek Instant */}
            <div
              onClick={() => {
                if (!isGojekAvailable) {
                  toast.error(
                    gojekUnavailableReason ||
                      'Jarak pengiriman melebihi batas maksimal 40 km untuk Gojek Instant. Silakan pilih JNE Express.'
                  )
                  return
                }
                setCourier('GOJEK')
                setCourierService('INSTANT')
              }}
              className={`rounded-xl border p-3 transition-all ${
                !isGojekAvailable
                  ? 'cursor-not-allowed border-dashed border-slate-200 bg-slate-50/70 opacity-60 dark:border-slate-800 dark:bg-slate-900/40'
                  : courier === 'GOJEK'
                    ? 'cursor-pointer border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500/30 dark:border-emerald-500 dark:bg-emerald-950/20'
                    : 'cursor-pointer border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                      courier === 'GOJEK' && isGojekAvailable
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {courier === 'GOJEK' && isGojekAvailable && (
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Gojek Instant Kurir
                      </span>
                      {shippingDistanceKm !== null && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {shippingDistanceKm.toFixed(1)} km
                        </span>
                      )}
                      {!isGojekAvailable && (
                        <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                          &gt; 40 km
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {isGojekAvailable
                        ? 'Langsung Sampai (Maks 1-2 Jam)'
                        : 'Di luar jangkauan (maks 40 km). Gunakan JNE.'}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-bold ${
                    isGojekAvailable
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-400 line-through'
                  }`}
                >
                  Rp {gojekCost.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* Pesan untuk Penjual */}
          <div className="border-t border-slate-100 pt-2 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowNotesInput(!showNotesInput)}
              className="flex w-full items-center justify-between py-1 text-xs"
            >
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Pesan untuk Penjual
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <span>{notes ? 'Catatan terisi' : 'Tinggalkan pesan'}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </button>
            {showNotesInput && (
              <div className="mt-1.5">
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Titip di satpam atau konfirmasi via WA..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            )}
          </div>
        </div>

        {/* 4. Voucher & Diskon Platform (Shopee Style) */}
        <div className="shadow-2xs rounded-2xl border border-slate-200/70 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-orange-500" />
              <span className="text-xs font-bold text-slate-950 dark:text-white">
                Voucher Diskon
              </span>
            </div>
            {appliedVoucher ? (
              <div className="flex items-center gap-1">
                <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                  {appliedVoucher.code} (-Rp{' '}
                  {appliedVoucher.discountAmount.toLocaleString('id-ID')})
                </span>
                <button
                  type="button"
                  onClick={handleRemoveVoucher}
                  className="p-1 text-slate-400 hover:text-rose-500"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowVoucherBox(!showVoucherBox)}
                className="flex items-center gap-1 text-xs font-semibold text-orange-500 hover:text-orange-600"
              >
                <span>Gunakan Voucher</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {showVoucherBox && !appliedVoucher && (
            <div className="mt-3 flex gap-2 border-t border-slate-100 pt-2.5 dark:border-slate-800">
              <input
                type="text"
                value={voucherInput}
                onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                placeholder="Masukkan kode voucher"
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs uppercase outline-none focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <button
                type="button"
                onClick={handleApplyVoucher}
                disabled={isValidatingVoucher}
                className="shadow-2xs rounded-xl bg-orange-500 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-orange-600 disabled:opacity-50"
              >
                {isValidatingVoucher ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  'Pakai'
                )}
              </button>
            </div>
          )}
          {voucherError && (
            <p className="mt-1.5 text-[11px] font-medium text-rose-500">
              {voucherError}
            </p>
          )}
        </div>

        {/* 5. Metode Pembayaran Card */}
        <div className="shadow-2xs space-y-2.5 rounded-2xl border border-slate-200/70 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
            <CreditCard className="h-4 w-4 text-orange-500" />
            <span className="text-xs font-bold text-slate-950 dark:text-white">
              Metode Pembayaran
            </span>
          </div>

          <div className="space-y-2">
            {/* Payment Gateway Otomatis */}
            <div className="rounded-xl border border-orange-300/80 bg-orange-50/20 p-2.5 ring-1 ring-orange-200/50 transition-all dark:border-orange-800/60 dark:bg-orange-950/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-orange-400 bg-orange-400 text-white">
                    <Check className="h-2.5 w-2.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Payment Gateway Otomatis
                    </span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      QRIS Nasional, BCA VA, Mandiri, BRI, BNI (Verifikasi
                      Instan)
                    </p>
                  </div>
                </div>
                <span className="rounded bg-orange-50 px-1.5 py-0.5 text-[9px] font-bold text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                  Otomatis
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Rincian Pembayaran Card (Shopee Style) */}
        <div className="shadow-2xs space-y-2 rounded-2xl border border-slate-200/70 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
          <span className="block text-xs font-bold text-slate-950 dark:text-white">
            Rincian Pembayaran
          </span>

          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex justify-between">
              <span>Subtotal Produk</span>
              <span className="font-medium text-slate-900 dark:text-white">
                Rp {subtotal.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Proteksi & Asuransi Wajib</span>
              <span className="font-medium text-slate-900 dark:text-white">
                Rp {insuranceFee.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Subtotal Pengiriman</span>
              <span className="font-medium text-slate-900 dark:text-white">
                Rp {shippingCost.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>Paket Bonus 3-in-1 (Aksesoris)</span>
              <span className="font-semibold">Rp 0 (Gratis)</span>
            </div>
            {voucherDiscount > 0 && (
              <div className="flex justify-between text-orange-600 dark:text-orange-400">
                <span>Diskon Voucher</span>
                <span className="font-bold">
                  -Rp {voucherDiscount.toLocaleString('id-ID')}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-100 pt-2 text-xs font-extrabold text-slate-950 dark:border-slate-800 dark:text-white">
              <span>Total Pembayaran</span>
              <span className="text-sm text-orange-500">
                Rp {total.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* 7. Syarat & Ketentuan Garansi Checkbox */}
        <div
          ref={termsRef}
          className={`shadow-2xs rounded-2xl border p-3.5 transition-all duration-300 ${
            termsWarning
              ? 'border-red-500 bg-red-50/70 shadow-md shadow-red-500/20 ring-2 ring-red-400 dark:border-red-500 dark:bg-red-950/30'
              : 'border-slate-200/70 bg-white dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <label className="flex cursor-pointer items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => {
                setTermsAccepted(e.target.checked)
                if (e.target.checked) setTermsWarning(false)
              }}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-orange-500 accent-orange-500 focus:ring-orange-400"
            />
            <span className="select-none leading-snug">
              Saya menyetujui syarat garansi resmi toko 30 hari tukar unit &amp;
              asuransi kurir terproteksi.
            </span>
          </label>
        </div>
      </main>

      {/* 7. Fixed Bottom Floating Summary Bar (Shopee Style) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/80 bg-white/95 px-4 py-2.5 shadow-lg backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          {/* Sisi Kiri: Total & Hemat */}
          <div className="min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Total:
              </span>
              <span className="text-base font-black text-orange-500">
                Rp {total.toLocaleString('id-ID')}
              </span>
            </div>
            {savingsTotal > 0 && (
              <p className="text-[10px] font-semibold text-orange-600 dark:text-orange-400">
                Hemat Rp {savingsTotal.toLocaleString('id-ID')}
              </p>
            )}
          </div>

          {/* Sisi Kanan: Tombol Buat Pesanan */}
          <button
            type="button"
            onClick={handleBuatPesanan}
            disabled={submitting || !selectedAddress}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-6 py-2.5 text-xs font-bold text-white shadow-sm shadow-orange-500/25 transition-all hover:bg-orange-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>Buat Pesanan</span>
            )}
          </button>
        </div>
      </div>

      {/* 8. Address Selection Bottom Sheet Modal (Shopee Style) */}
      {showAddressPicker && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="flex max-h-[80vh] w-full max-w-md flex-col rounded-t-3xl bg-white p-4 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-950 dark:text-white">
                Pilih Alamat Pengiriman
              </h2>
              <button
                type="button"
                onClick={() => setShowAddressPicker(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-2.5 overflow-y-auto py-3">
              {addresses.map((addr) => {
                const isSelected = selectedAddress?.id === addr.id
                return (
                  <div
                    key={addr.id}
                    onClick={() => {
                      setSelectedAddressId(addr.id)
                      setShowAddressPicker(false)
                    }}
                    className={`cursor-pointer rounded-2xl border p-3 transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50/40 dark:border-orange-500 dark:bg-orange-950/20'
                        : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                          isSelected
                            ? 'border-orange-500 bg-orange-500 text-white'
                            : 'border-slate-300'
                        }`}
                      >
                        {isSelected && (
                          <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-950 dark:text-white">
                            {addr.recipientName}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {addr.phone}
                          </span>
                          <span className="py-0.2 rounded bg-slate-100 px-1.5 text-[9px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {addr.label || 'Rumah'}
                          </span>
                          {addr.isDefault && (
                            <span className="py-0.2 rounded bg-orange-50 px-1.5 text-[9px] font-bold text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                              Utama
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                          {addr.fullAddress}
                          {addr.district ? `, ${addr.district}` : ''}
                          {addr.city ? `, ${addr.city}` : ''}
                          {addr.province ? `, ${addr.province}` : ''}
                          {addr.postalCode ? ` ${addr.postalCode}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowAddressPicker(false)
                  onOpenNewAddressModal()
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-orange-500 bg-orange-50 py-2.5 text-xs font-bold text-orange-600 transition hover:bg-orange-100 active:scale-95 dark:bg-orange-950/30 dark:text-orange-400"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Alamat Baru</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
