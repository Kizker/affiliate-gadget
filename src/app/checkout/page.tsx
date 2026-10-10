'use client'

import {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
  Suspense,
} from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { StoreVoucherSelector } from '@/components/checkout/store-voucher-selector'
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
import { ShippingOption } from '@/lib/shipping/shipping-engine'
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
  Zap,
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

function CheckoutContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const dealToken = searchParams?.get('dealToken')

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
  const [liveDealInfo, setLiveDealInfo] = useState<{
    valid: boolean
    deal?: any
    discountAmount: number
    badgeLabel?: string
  } | null>(null)

  // Verifikasi dealToken live streaming saat masuk checkout (single-use limit)
  useEffect(() => {
    if (!dealToken) return
    fetch(`/api/live-deals/verify?token=${encodeURIComponent(dealToken)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.valid && data.deal) {
          const discountDiff = Math.max(
            0,
            data.deal.originalPrice - data.deal.discountPrice
          )
          setLiveDealInfo({
            valid: true,
            deal: data.deal,
            discountAmount: discountDiff,
            badgeLabel:
              data.deal.badgeLabel ||
              (data.deal.dealType === 'PINNED_DEAL'
                ? 'Diskon Spesial Sematan Live'
                : 'Diskon Khusus Siaran Live'),
          })
          toast.success(
            `${data.deal.badgeLabel || 'Diskon Live'} Diterapkan!`,
            {
              description: `Hemat Rp ${discountDiff.toLocaleString('id-ID')} (berlaku 1x checkout).`,
            }
          )
        } else {
          setLiveDealInfo(null)
          if (data.reason === 'USED') {
            toast.error(
              'Diskon khusus live deal ini telah digunakan untuk transaksi sebelumnya (hanya 1 kali checkout).'
            )
          }
        }
      })
      .catch(() => {})
  }, [dealToken])

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
  const [desktopTermsWarning, setDesktopTermsWarning] = useState(false)
  const desktopTermsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!desktopTermsWarning) return
    const timer = setTimeout(() => setDesktopTermsWarning(false), 700)
    return () => clearTimeout(timer)
  }, [desktopTermsWarning])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Voucher Promo state
  const [voucherInput, setVoucherInput] = useState('')
  const [selectedVoucherStoreId, setSelectedVoucherStoreId] = useState<
    string | null
  >(null)
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false)
  const [appliedVouchers, setAppliedVouchers] = useState<
    Array<{
      code: string
      discountPercent: number
      discountAmount: number
      maxDiscountAmount?: number | null
      minimumPurchase?: number
      description?: string | null
      targetStoreId: string
      targetStoreName: string
    }>
  >([])
  const appliedVoucher = appliedVouchers[0] || null
  const [showAddVoucherInput, setShowAddVoucherInput] = useState(false)
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

  // Real-time shipping states
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [loadingShippingRates, setLoadingShippingRates] = useState(false)
  const [shippingDistanceKm, setShippingDistanceKm] = useState<number | null>(
    null
  )

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

  // Group items by store for Shopee-style multi-store checkout
  const storeGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        storeId: string
        storeName: string
        city?: string | null
        province?: string | null
        items: any[]
      }
    >()

    for (const item of selectedItems) {
      const storeId = item.storeId || item.store?.id || 'default_store'
      const rawStoreName =
        item.store?.name || 'PT Gadget Jaya Sentosa (Roxy Mas Pusat)'
      const storeName = rawStoreName
        .replace('Affiliate Gadget - ', '')
        .replace('AffiliateGadget Store - ', '')
      const city = item.store?.city || 'Jakarta Pusat'
      const province = item.store?.province || 'DKI Jakarta'

      if (!map.has(storeId)) {
        map.set(storeId, {
          storeId,
          storeName,
          city,
          province,
          items: [],
        })
      }
      map.get(storeId)!.items.push(item)
    }

    return Array.from(map.values())
  }, [selectedItems])

  // Store-specific settings: { [storeId]: { courier: 'JNE' | 'GOJEK', courierService: string, notes: string } }
  const [storeSettings, setStoreSettings] = useState<
    Record<
      string,
      {
        courier: 'JNE' | 'GOJEK'
        courierService: string
        notes: string
      }
    >
  >({})

  // Store-specific real-time shipping data: { [storeId]: { options: ShippingOption[], loading: boolean, distanceKm: number | null } }
  const [storeShippingData, setStoreShippingData] = useState<
    Record<
      string,
      {
        options: ShippingOption[]
        loading: boolean
        distanceKm: number | null
      }
    >
  >({})

  // Fetch real-time shipping options per store group
  useEffect(() => {
    if (!selectedAddressId || storeGroups.length === 0) {
      setStoreShippingData({})
      return
    }

    let isMounted = true

    storeGroups.forEach((group) => {
      setStoreShippingData((prev) => ({
        ...prev,
        [group.storeId]: {
          options: prev[group.storeId]?.options || [],
          loading: true,
          distanceKm: prev[group.storeId]?.distanceKm ?? null,
        },
      }))

      const itemsPayload = group.items.map((it) => ({
        name: it.name,
        weightGram: it.weightGram || DEFAULT_WEIGHT_GRAM,
        price: it.price,
        quantity: it.quantity,
        productId: it.productId || (it.type === 'PRODUCT' ? it.id : undefined),
      }))

      fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId:
            group.storeId === 'default_store' ? undefined : group.storeId,
          addressId: selectedAddressId,
          items: itemsPayload,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (!isMounted) return
          if (data.success && Array.isArray(data.options)) {
            setStoreShippingData((prev) => ({
              ...prev,
              [group.storeId]: {
                options: data.options,
                loading: false,
                distanceKm:
                  typeof data.distanceKm === 'number' ? data.distanceKm : null,
              },
            }))

            // Auto-switch if Gojek selected but out of radius for this store
            const currentCourier =
              storeSettings[group.storeId]?.courier || 'JNE'
            const gojekOpt = data.options.find(
              (o: ShippingOption) => o.courierCode === 'GOJEK'
            )
            if (currentCourier === 'GOJEK' && gojekOpt && !gojekOpt.available) {
              setStoreSettings((prev) => ({
                ...prev,
                [group.storeId]: {
                  ...(prev[group.storeId] || { notes: '' }),
                  courier: 'JNE',
                  courierService: 'REG',
                },
              }))
            }
          } else {
            setStoreShippingData((prev) => ({
              ...prev,
              [group.storeId]: {
                options: [],
                loading: false,
                distanceKm: null,
              },
            }))
          }
        })
        .catch(() => {
          if (!isMounted) return
          setStoreShippingData((prev) => ({
            ...prev,
            [group.storeId]: {
              options: [],
              loading: false,
              distanceKm: null,
            },
          }))
        })
    })

    return () => {
      isMounted = false
    }
  }, [selectedAddressId, storeGroups])

  // Computed Store Packages for each store group
  const computedStorePackages = useMemo(() => {
    return storeGroups.map((group) => {
      const settings = storeSettings[group.storeId] || {
        courier: 'JNE',
        courierService: 'REG',
        notes: '',
      }
      const shippingInfo = storeShippingData[group.storeId]
      const jneRegOpt = shippingInfo?.options?.find(
        (o) => o.courierCode === 'JNE' && o.courierService === 'REG'
      )
      const jneYesOpt = shippingInfo?.options?.find(
        (o) => o.courierCode === 'JNE' && o.courierService === 'YES'
      )
      const gojekOpt = shippingInfo?.options?.find(
        (o) => o.courierCode === 'GOJEK'
      )

      const storeWeightGram = group.items.reduce(
        (sum, item) =>
          sum + (item.weightGram ?? DEFAULT_WEIGHT_GRAM) * item.quantity,
        0
      )
      const storeMaxPricePerKg =
        group.items.length > 0
          ? Math.max(
              ...group.items.map(
                (item) => item.pricePerKg ?? DEFAULT_PRICE_PER_KG
              )
            )
          : DEFAULT_PRICE_PER_KG

      const fallbackReg = calculateWeightShipping(
        storeWeightGram,
        storeMaxPricePerKg,
        'JNE',
        'REG'
      )
      const fallbackYes = calculateWeightShipping(
        storeWeightGram,
        storeMaxPricePerKg,
        'JNE',
        'YES'
      )
      const fallbackGojek = calculateWeightShipping(
        storeWeightGram,
        storeMaxPricePerKg,
        'GOJEK',
        'INSTANT'
      )

      const currentJneRegCost = jneRegOpt ? jneRegOpt.cost : fallbackReg
      const currentJneYesCost = jneYesOpt ? jneYesOpt.cost : fallbackYes
      const currentGojekCost = gojekOpt ? gojekOpt.cost : fallbackGojek
      const isGojekAvailable = gojekOpt ? gojekOpt.available : true
      const gojekUnavailableReason = gojekOpt?.unavailableReason

      let cost = currentJneRegCost
      if (settings.courier === 'GOJEK') {
        cost = currentGojekCost
      } else if (settings.courierService === 'YES') {
        cost = currentJneYesCost
      } else {
        cost = currentJneRegCost
      }

      const storeSubtotal = group.items.reduce((sum, it) => {
        const itemPrice = it.rentalDays
          ? it.price * it.rentalDays * it.quantity
          : it.price * it.quantity
        return sum + itemPrice
      }, 0)

      const insFee = calculateInsuranceFee(storeSubtotal)

      return {
        storeId: group.storeId,
        storeName: group.storeName,
        city: group.city,
        province: group.province,
        items: group.items,
        courier: settings.courier,
        courierService: settings.courierService,
        notes: settings.notes,
        shippingCost: cost,
        insuranceFee: insFee,
        subtotal: storeSubtotal,
        shippingOptions: shippingInfo?.options || [],
        loadingShippingRates: shippingInfo?.loading || false,
        shippingDistanceKm: shippingInfo?.distanceKm ?? null,
        jneRegCost: currentJneRegCost,
        jneYesCost: currentJneYesCost,
        gojekCost: currentGojekCost,
        isGojekAvailable,
        gojekUnavailableReason,
      }
    })
  }, [storeGroups, storeSettings, storeShippingData])

  const totalSubtotal = useMemo(() => {
    return computedStorePackages.reduce((sum, p) => sum + p.subtotal, 0)
  }, [computedStorePackages])

  const totalShippingCost = useMemo(() => {
    return computedStorePackages.reduce((sum, p) => sum + p.shippingCost, 0)
  }, [computedStorePackages])

  const totalInsuranceFee = useMemo(() => {
    return computedStorePackages.reduce((sum, p) => sum + p.insuranceFee, 0)
  }, [computedStorePackages])

  const subtotal = totalSubtotal
  const shippingCost = totalShippingCost
  const insuranceFee = totalInsuranceFee

  // Weight calculation for aggregate items
  const totalWeightGram = selectedItems.reduce((sum, item) => {
    return sum + (item.weightGram ?? DEFAULT_WEIGHT_GRAM) * item.quantity
  }, 0)

  // Primary store fallback props
  const primaryPackage = computedStorePackages[0]
  const jneRegCost = primaryPackage?.jneRegCost ?? 15_000
  const jneYesCost = primaryPackage?.jneYesCost ?? 28_000
  const gojekCost = primaryPackage?.gojekCost ?? 20_000
  const isGojekAvailable = primaryPackage?.isGojekAvailable ?? true
  const gojekUnavailableReason = primaryPackage?.gojekUnavailableReason

  // Voucher target store scoping (Single store per voucher)
  const activeVoucherStorePackage = useMemo(() => {
    if (computedStorePackages.length === 0) return null
    if (
      selectedVoucherStoreId &&
      computedStorePackages.some(
        (pkg) => pkg.storeId === selectedVoucherStoreId
      )
    ) {
      return (
        computedStorePackages.find(
          (pkg) => pkg.storeId === selectedVoucherStoreId
        ) || computedStorePackages[0]
      )
    }
    return computedStorePackages[0]
  }, [computedStorePackages, selectedVoucherStoreId])

  const activeVoucherStoreId = activeVoucherStorePackage?.storeId ?? null

  const voucherDiscount = useMemo(() => {
    return appliedVouchers.reduce((sum, v) => sum + v.discountAmount, 0)
  }, [appliedVouchers])
  const liveDealDiscount = liveDealInfo?.discountAmount || 0
  const total = Math.max(
    0,
    subtotal + shippingCost + insuranceFee - voucherDiscount - liveDealDiscount
  )

  const handleUpdateStoreCourier = (
    storeId: string,
    courierVal: 'JNE' | 'GOJEK',
    courierServiceVal: string
  ) => {
    setStoreSettings((prev) => ({
      ...prev,
      [storeId]: {
        ...(prev[storeId] || { notes: '' }),
        courier: courierVal,
        courierService: courierServiceVal,
      },
    }))
  }

  const handleUpdateStoreNotes = (storeId: string, notesVal: string) => {
    setStoreSettings((prev) => ({
      ...prev,
      [storeId]: {
        ...(prev[storeId] || { courier: 'JNE', courierService: 'REG' }),
        notes: notesVal,
      },
    }))
  }

  // Recalculate applied vouchers if store items or subtotal of target store changes
  useEffect(() => {
    if (appliedVouchers.length > 0) {
      let changed = false
      const updatedList: typeof appliedVouchers = []

      for (const v of appliedVouchers) {
        const targetPackage = computedStorePackages.find(
          (p) => p.storeId === v.targetStoreId
        )
        if (!targetPackage) {
          toast.error(
            `Pesanan untuk toko ${v.targetStoreName} tidak lagi tersedia. Voucher ${v.code} dilepas.`
          )
          changed = true
          continue
        }

        const storeSubtotal = targetPackage.subtotal
        if (
          v.minimumPurchase !== undefined &&
          storeSubtotal < v.minimumPurchase
        ) {
          toast.error(
            `Minimum belanja Rp ${v.minimumPurchase.toLocaleString('id-ID')} untuk ${targetPackage.storeName} tidak lagi terpenuhi. Voucher ${v.code} dilepas.`
          )
          changed = true
          continue
        }

        const raw = storeSubtotal * (v.discountPercent / 100)
        const cap =
          v.maxDiscountAmount !== undefined &&
          v.maxDiscountAmount !== null &&
          v.maxDiscountAmount > 0
            ? Math.min(raw, v.maxDiscountAmount)
            : raw
        const newDiscount = Math.round(
          Math.min(storeSubtotal, Math.max(0, cap))
        )
        if (newDiscount !== v.discountAmount) {
          changed = true
          updatedList.push({ ...v, discountAmount: newDiscount })
        } else {
          updatedList.push(v)
        }
      }

      if (changed) {
        setAppliedVouchers(updatedList)
      }
    }
  }, [computedStorePackages])

  const handleApplyVoucher = async () => {
    const trimmed = voucherInput.trim().toUpperCase()
    if (!trimmed) {
      setVoucherError('Silakan masukkan kode voucher terlebih dahulu')
      return
    }

    if (appliedVouchers.some((v) => v.code === trimmed)) {
      const msg = `Kode voucher "${trimmed}" sudah digunakan pada pesanan ini`
      setVoucherError(msg)
      toast.error(msg)
      return
    }

    const targetPkg = activeVoucherStorePackage
    if (!targetPkg) {
      setVoucherError('Tidak ada pesanan toko yang dapat menerima voucher')
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
          subtotal: targetPkg.subtotal,
          orderType: 'PRODUCT',
        }),
      })
      const data = await res.json()
      if (data.valid) {
        const newVoucherItem = {
          code: data.voucherCode,
          discountPercent: data.discountPercent,
          discountAmount: data.discountAmount,
          maxDiscountAmount: data.maxDiscountAmount,
          minimumPurchase: data.minimumPurchase,
          description: data.description,
          targetStoreId: targetPkg.storeId,
          targetStoreName: targetPkg.storeName,
        }
        setAppliedVouchers((prev) => [...prev, newVoucherItem])
        setVoucherInput('')
        setVoucherError(null)
        setShowAddVoucherInput(false)
        toast.success(
          `Voucher ${data.voucherCode} berhasil digunakan untuk ${targetPkg.storeName}! Hemat Rp ${data.discountAmount.toLocaleString('id-ID')}`
        )
      } else {
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

  const handleRemoveVoucher = (codeToRemove?: string) => {
    if (codeToRemove) {
      setAppliedVouchers((prev) => prev.filter((v) => v.code !== codeToRemove))
      toast.info(`Voucher ${codeToRemove} berhasil dihapus`)
    } else {
      setAppliedVouchers([])
      setVoucherInput('')
      setVoucherError(null)
      toast.info('Semua voucher berhasil dihapus')
    }
  }

  const handleCheckout = async () => {
    if (!termsAccepted) {
      toast.error('Harap setujui syarat & ketentuan garansi 30 hari')
      setDesktopTermsWarning(true)
      desktopTermsRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
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

      const storePackagesPayload = computedStorePackages.map((pkg) => {
        const pkgVouchers = appliedVouchers.filter(
          (v) => v.targetStoreId === pkg.storeId
        )
        const isVoucherTarget = pkgVouchers.length > 0
        return {
          storeId: pkg.storeId === 'default_store' ? undefined : pkg.storeId,
          storeName: pkg.storeName,
          courierCode: pkg.courier,
          courierService: pkg.courierService,
          shippingCost: pkg.shippingCost,
          insuranceFee: pkg.insuranceFee,
          notes: pkg.notes || null,
          voucherCode: isVoucherTarget ? pkgVouchers[0].code : null,
          voucherCodes: pkgVouchers.map((v) => v.code),
          items: pkg.items.map((item) => ({
            id: item.id,
            type: item.type || 'PRODUCT',
            productId:
              item.productId || (item.type === 'PRODUCT' ? item.id : undefined),
            variantId: item.variantId || undefined,
            variantName: item.variantName || undefined,
            rentalItemId:
              item.rentalItemId ||
              (item.type === 'RENTAL' ? item.id : undefined),
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
          })),
        }
      })

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKeyRef.current,
        },
        body: JSON.stringify({
          items: sanitizedItems,
          storePackages: storePackagesPayload,
          paymentMethod:
            paymentMethod === 'GATEWAY' ? 'MIDTRANS' : 'MANUAL_TRANSFER',
          courierCode: courier,
          courierService: courierService,
          shippingCost: totalShippingCost,
          insuranceFee: totalInsuranceFee,
          isInsuranceMandatory: true,
          bonusChargerIncluded: true,
          bonusProtectorIncluded: true,
          bonusCaseIncluded: true,
          addressId: selectedAddressId,
          deliveryAddress: addressString,
          recipientName: selectedAddress?.recipientName || '',
          recipientPhone: selectedAddress?.phone || '',
          voucherCode: appliedVouchers[0]?.code || null,
          voucherCodes: appliedVouchers.map((v) => v.code),
          voucherStoreId: appliedVouchers[0]?.targetStoreId || null,
          voucherAssignments: appliedVouchers.map((v) => ({
            code: v.code,
            storeId: v.targetStoreId,
          })),
          dealToken: dealToken || null,
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
          storePackages={computedStorePackages}
          onUpdateStoreCourier={handleUpdateStoreCourier}
          onUpdateStoreNotes={handleUpdateStoreNotes}
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
          appliedVouchers={appliedVouchers}
          appliedVoucher={appliedVoucher}
          voucherError={voucherError}
          isValidatingVoucher={isValidatingVoucher}
          selectedVoucherStoreId={activeVoucherStoreId}
          setSelectedVoucherStoreId={setSelectedVoucherStoreId}
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
          shippingOptions={shippingOptions}
          loadingShippingRates={loadingShippingRates}
          shippingDistanceKm={shippingDistanceKm}
          jneRegCost={jneRegCost}
          jneYesCost={jneYesCost}
          gojekCost={gojekCost}
          isGojekAvailable={isGojekAvailable}
          gojekUnavailableReason={gojekUnavailableReason}
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
              {/* Left Column: Items, Logistics & Payment (7 cols) */}
              <div className="space-y-4 lg:col-span-7">
                {/* 1. Produk yang Dipesan & Pengiriman Per Toko (Shopee Multi-Store) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-sm font-bold text-slate-950 dark:text-white">
                      Produk yang Dipesan ({selectedItems.length})
                    </h2>
                    <Link
                      href={isDirectBuy ? backHref : '/cart'}
                      className="text-[11px] font-semibold text-orange-600 hover:underline"
                    >
                      {isDirectBuy ? 'Ubah Varian' : 'Ubah Keranjang'}
                    </Link>
                  </div>

                  {computedStorePackages.map((pkg, pIdx) => {
                    const pkgCourier = pkg.courier
                    const pkgService = pkg.courierService
                    const pkgJneRegCost = pkg.jneRegCost ?? 15_000
                    const pkgJneYesCost = pkg.jneYesCost ?? 28_000
                    const pkgGojekCost = pkg.gojekCost ?? 20_000
                    const pkgIsGojekAvailable = pkg.isGojekAvailable ?? true
                    const pkgGojekReason = pkg.gojekUnavailableReason
                    const pkgDistance = pkg.shippingDistanceKm ?? null
                    const pkgVouchers = appliedVouchers.filter(
                      (v) => v.targetStoreId === pkg.storeId
                    )
                    const isVoucherTarget = pkgVouchers.length > 0
                    const pkgDiscount = pkgVouchers.reduce(
                      (sum, v) => sum + v.discountAmount,
                      0
                    )
                    const pkgStoreTotal = Math.max(
                      0,
                      pkg.subtotal +
                        pkg.shippingCost +
                        pkg.insuranceFee -
                        pkgDiscount
                    )

                    return (
                      <div
                        key={pkg.storeId || pIdx}
                        className="shadow-xs space-y-4 rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6"
                      >
                        {/* Store Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                            <Building2 className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
                            <h2 className="truncate text-sm font-bold text-slate-950 dark:text-white">
                              {pkg.storeName}
                            </h2>
                            {isVoucherTarget && (
                              <div className="flex flex-wrap gap-1">
                                {pkgVouchers.map((v) => (
                                  <span
                                    key={v.code}
                                    className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                                  >
                                    <Tag className="h-3 w-3" />
                                    Voucher {v.code} (-Rp{' '}
                                    {v.discountAmount.toLocaleString('id-ID')})
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          {pkg.city && (
                            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              Kota {pkg.city}
                            </span>
                          )}
                        </div>

                        {/* Store Items List */}
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                          {pkg.items.map((item) => (
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
                                {item.variantName && (
                                  <span className="text-[10px] text-slate-500">
                                    Varian: {item.variantName}
                                  </span>
                                )}
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

                        {/* Proteksi Kerusakan & Asuransi Kurir */}
                        <div className="rounded-2xl border border-orange-200/80 bg-orange-50/30 p-3.5 dark:border-orange-900/40 dark:bg-orange-950/20">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                              <div>
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                  Proteksi Kerusakan & Asuransi Kurir
                                </span>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                  Unit dilindungi garansi fisik 30 hari tukar
                                  unit & asuransi kurir 100% jika rusak/hilang.
                                </p>
                              </div>
                            </div>
                            <span className="shrink-0 text-xs font-bold text-slate-900 dark:text-white">
                              Rp {pkg.insuranceFee.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>

                        {/* Opsi Pengiriman Toko */}
                        <div className="space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                              Opsi Pengiriman Toko
                            </label>
                            {pkg.loadingShippingRates && (
                              <span className="flex items-center gap-1 text-[11px] font-semibold text-orange-600 dark:text-orange-400">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Cek tarif...
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {/* JNE */}
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() => {
                                handleUpdateStoreCourier(
                                  pkg.storeId,
                                  'JNE',
                                  pkgService === 'YES' ? 'YES' : 'REG'
                                )
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  handleUpdateStoreCourier(
                                    pkg.storeId,
                                    'JNE',
                                    pkgService === 'YES' ? 'YES' : 'REG'
                                  )
                                }
                              }}
                              className={`cursor-pointer rounded-2xl border p-3.5 text-left transition-all ${
                                pkgCourier === 'JNE'
                                  ? 'shadow-xs border-orange-300 bg-orange-50/30 text-slate-950 ring-1 ring-orange-200/50 dark:border-orange-800/60 dark:bg-orange-950/20 dark:text-white'
                                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between text-xs font-bold">
                                <span className="flex items-center gap-1.5">
                                  <Truck
                                    className={`h-3.5 w-3.5 ${pkgCourier === 'JNE' ? 'text-orange-400' : 'text-slate-400'}`}
                                  />{' '}
                                  JNE Express
                                </span>
                                <span
                                  className={
                                    pkgCourier === 'JNE'
                                      ? 'font-bold text-orange-600 dark:text-orange-400'
                                      : 'text-slate-900 dark:text-white'
                                  }
                                >
                                  Rp{' '}
                                  {(pkgService === 'YES'
                                    ? pkgJneYesCost
                                    : pkgJneRegCost
                                  ).toLocaleString('id-ID')}
                                </span>
                              </div>
                              <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                                {pkgService === 'YES'
                                  ? 'Layanan YES (1 Hari Esok Sampai)'
                                  : 'Layanan Reguler (2-3 Hari Kerja)'}
                              </p>
                              {pkgCourier === 'JNE' && (
                                <div className="mt-2 flex gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleUpdateStoreCourier(
                                        pkg.storeId,
                                        'JNE',
                                        'REG'
                                      )
                                    }}
                                    className={`rounded px-2 py-1 text-[10px] font-bold ${
                                      pkgService === 'REG'
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                                    }`}
                                  >
                                    Reguler (Rp{' '}
                                    {pkgJneRegCost.toLocaleString('id-ID')})
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleUpdateStoreCourier(
                                        pkg.storeId,
                                        'JNE',
                                        'YES'
                                      )
                                    }}
                                    className={`rounded px-2 py-1 text-[10px] font-bold ${
                                      pkgService === 'YES'
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                                    }`}
                                  >
                                    YES Kilat (Rp{' '}
                                    {pkgJneYesCost.toLocaleString('id-ID')})
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Gojek */}
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() => {
                                if (!pkgIsGojekAvailable) {
                                  toast.error(
                                    pkgGojekReason ||
                                      'Jarak pengiriman melebihi batas 40 km untuk Gojek Instant.'
                                  )
                                  return
                                }
                                handleUpdateStoreCourier(
                                  pkg.storeId,
                                  'GOJEK',
                                  'INSTANT'
                                )
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  if (!pkgIsGojekAvailable) {
                                    toast.error(
                                      pkgGojekReason ||
                                        'Jarak pengiriman melebihi batas 40 km untuk Gojek Instant.'
                                    )
                                    return
                                  }
                                  handleUpdateStoreCourier(
                                    pkg.storeId,
                                    'GOJEK',
                                    'INSTANT'
                                  )
                                }
                              }}
                              className={`rounded-2xl border p-3.5 text-left transition-all ${
                                !pkgIsGojekAvailable
                                  ? 'cursor-not-allowed border-dashed border-slate-200 bg-slate-50/70 opacity-60 dark:border-slate-800 dark:bg-slate-900/40'
                                  : pkgCourier === 'GOJEK'
                                    ? 'shadow-xs cursor-pointer border-orange-300 bg-orange-50/30 text-slate-950 ring-1 ring-orange-200/50 dark:border-orange-800/60 dark:bg-orange-950/20 dark:text-white'
                                    : 'cursor-pointer border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between text-xs font-bold">
                                <span className="flex items-center gap-1.5">
                                  <Truck
                                    className={`h-3.5 w-3.5 ${pkgCourier === 'GOJEK' ? 'text-orange-400' : 'text-slate-400'}`}
                                  />{' '}
                                  Gojek Instant
                                </span>
                                <span
                                  className={
                                    !pkgIsGojekAvailable
                                      ? 'text-slate-400 line-through'
                                      : pkgCourier === 'GOJEK'
                                        ? 'font-bold text-orange-600 dark:text-orange-400'
                                        : 'text-slate-900 dark:text-white'
                                  }
                                >
                                  Rp {pkgGojekCost.toLocaleString('id-ID')}
                                </span>
                              </div>
                              <div className="mt-1 flex items-center justify-between text-[10px]">
                                <span className="text-slate-500 dark:text-slate-400">
                                  {pkgIsGojekAvailable
                                    ? 'Langsung Sampai (Maks 1-2 Jam)'
                                    : 'Di luar radius maks 40 km'}
                                </span>
                                {pkgDistance !== null && (
                                  <span
                                    className={`shrink-0 whitespace-nowrap rounded px-1.5 py-0.5 font-semibold leading-none ${
                                      pkgIsGojekAvailable
                                        ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                    }`}
                                  >
                                    {pkgDistance.toFixed(1)} km
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Catatan / Pesan untuk Toko */}
                        <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                          <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Pesan untuk Penjual ({pkg.storeName})
                          </label>
                          <input
                            type="text"
                            value={pkg.notes}
                            onChange={(e) =>
                              handleUpdateStoreNotes(
                                pkg.storeId,
                                e.target.value
                              )
                            }
                            placeholder="Tinggalkan catatan khusus untuk toko ini (misal: warna, bubble wrap)..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                        </div>

                        {/* Subtotal Toko */}
                        <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs dark:border-slate-800">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-500 dark:text-slate-400">
                              Subtotal Pesanan Toko ({pkg.items.length} produk)
                            </span>
                            {pkgDiscount > 0 && (
                              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                Diskon Voucher (
                                {pkgVouchers.map((v) => v.code).join(', ')}):
                                -Rp {pkgDiscount.toLocaleString('id-ID')}
                              </span>
                            )}
                          </div>
                          <span className="font-extrabold text-slate-900 dark:text-white">
                            Rp {pkgStoreTotal.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* 2. Alamat & Kurir Pengiriman */}
                <div className="shadow-xs space-y-4 rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                    <h2 className="flex items-center gap-2 text-sm font-bold text-slate-950 dark:text-white">
                      <MapPin className="h-4 w-4 text-orange-400" /> Alamat
                      &amp; Kurir Pengiriman
                    </h2>
                    <button
                      type="button"
                      onClick={() => setIsAddressModalOpen(true)}
                      className="shadow-2xs inline-flex cursor-pointer items-center gap-1 rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Tambah Alamat</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {loadingAddresses ? (
                      <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-200 py-8 dark:border-slate-700">
                        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                      </div>
                    ) : addresses.length === 0 ? (
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

                    <Link
                      href="/dashboard/customer/settings"
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 transition hover:text-orange-700"
                    >
                      <Edit3 className="h-3 w-3" />
                      Kelola semua alamat di pengaturan
                      <ChevronRight className="h-3 w-3" />
                    </Link>
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
                    {appliedVouchers.length > 0 ? (
                      appliedVouchers.map((v) => (
                        <div
                          key={v.code}
                          className="flex items-center justify-between text-emerald-600 dark:text-emerald-400"
                        >
                          <span className="flex items-center gap-1.5 font-medium">
                            <Tag className="h-3.5 w-3.5" />
                            <span>
                              Diskon Voucher ({v.code} • {v.targetStoreName})
                            </span>
                          </span>
                          <span className="font-bold tabular-nums">
                            - Rp {v.discountAmount.toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))
                    ) : voucherDiscount > 0 ? (
                      <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Tag className="h-3.5 w-3.5" />
                          <span>Diskon Voucher</span>
                        </span>
                        <span className="font-bold tabular-nums">
                          - Rp {voucherDiscount.toLocaleString('id-ID')}
                        </span>
                      </div>
                    ) : null}

                    {/* Live Stream Deal Discount Deduction (Single-use per customer) */}
                    {liveDealDiscount > 0 && (
                      <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Zap className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
                          <span>
                            {liveDealInfo?.badgeLabel || 'Diskon Live Siaran'}{' '}
                            (1x checkout)
                          </span>
                        </span>
                        <span className="font-bold tabular-nums">
                          - Rp {liveDealDiscount.toLocaleString('id-ID')}
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
                      {appliedVouchers.length > 0 && (
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          {appliedVouchers.length} Voucher Terpasang
                        </span>
                      )}
                    </div>

                    {/* List of active vouchers */}
                    {appliedVouchers.length > 0 && (
                      <div className="mb-2.5 space-y-2">
                        {appliedVouchers.map((v) => (
                          <div
                            key={v.code}
                            className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-3 text-xs dark:border-emerald-800/70 dark:bg-emerald-950/40"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                  <span className="font-bold tracking-wide text-emerald-800 dark:text-emerald-200">
                                    {v.code}
                                  </span>
                                  {v.discountPercent ? (
                                    <span className="rounded-md bg-emerald-200/80 px-1.5 py-0.5 text-[10px] font-extrabold text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200">
                                      {v.discountPercent}% OFF
                                    </span>
                                  ) : null}
                                </div>
                                <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-200">
                                  Berlaku untuk toko:{' '}
                                  <strong>{v.targetStoreName}</strong>
                                </p>
                                <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                                  Potongan Diskon: Hemat Rp{' '}
                                  {v.discountAmount.toLocaleString('id-ID')}
                                </p>
                                {v.maxDiscountAmount &&
                                  v.maxDiscountAmount > 0 && (
                                    <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">
                                      *Maksimal diskon Rp{' '}
                                      {v.maxDiscountAmount.toLocaleString(
                                        'id-ID'
                                      )}
                                    </p>
                                  )}
                                {v.description && (
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                    {v.description}
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveVoucher(v.code)}
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-800 transition hover:bg-red-100 hover:text-red-700 dark:bg-emerald-900/60 dark:text-emerald-200 dark:hover:bg-red-950 dark:hover:text-red-300"
                                title={`Hapus voucher ${v.code}`}
                                aria-label={`Hapus voucher ${v.code}`}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Button to add another voucher if already has vouchers and form is closed */}
                    {appliedVouchers.length > 0 && !showAddVoucherInput && (
                      <button
                        type="button"
                        onClick={() => setShowAddVoucherInput(true)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-orange-300 bg-orange-50/50 py-2 text-xs font-bold text-orange-600 transition hover:bg-orange-100/60 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-400"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Tambah Voucher Lain</span>
                      </button>
                    )}

                    {/* Input form: rendered either when no vouchers applied, or when user clicks Tambah Voucher Lain */}
                    {(appliedVouchers.length === 0 || showAddVoucherInput) && (
                      <div className="space-y-2">
                        {/* Store Target Selector if Multi-Store */}
                        {computedStorePackages.length > 1 && (
                          <div className="mb-2">
                            <StoreVoucherSelector
                              stores={computedStorePackages.map((pkg) => ({
                                storeId: pkg.storeId,
                                storeName: pkg.storeName,
                                city: pkg.city,
                                subtotal: pkg.subtotal,
                              }))}
                              selectedStoreId={activeVoucherStoreId}
                              onSelectStore={(storeId) => {
                                setSelectedVoucherStoreId(storeId)
                                if (voucherError) setVoucherError(null)
                              }}
                            />
                          </div>
                        )}

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
                            placeholder="Contoh: SUPERGADGET"
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
                          {appliedVouchers.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setShowAddVoucherInput(false)}
                              className="shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                            >
                              Batal
                            </button>
                          )}
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
                  <div
                    ref={desktopTermsRef}
                    className={`rounded-xl p-2.5 transition-all duration-300 ${
                      desktopTermsWarning
                        ? 'border border-red-500 bg-red-50/70 shadow-md shadow-red-500/20 ring-2 ring-red-400 dark:border-red-500 dark:bg-red-950/30'
                        : 'pt-1'
                    }`}
                  >
                    <label className="flex cursor-pointer items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => {
                          setTermsAccepted(e.target.checked)
                          if (e.target.checked) setDesktopTermsWarning(false)
                        }}
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
        defaultRecipientName={
          addresses.find((a) => a.id === selectedAddressId)?.recipientName ||
          addresses[0]?.recipientName ||
          session?.user?.name ||
          ''
        }
        defaultPhone={
          addresses.find((a) => a.id === selectedAddressId)?.phone ||
          addresses[0]?.phone ||
          (session?.user as any)?.phone ||
          ''
        }
      />
    </>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            <span className="text-sm font-medium">
              Memuat proses checkout...
            </span>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  )
}
