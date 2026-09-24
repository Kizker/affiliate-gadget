import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { PaymentMethod, BankAccountCategory, Prisma } from '@prisma/client'
import { checkRateLimit } from '@/lib/rate-limit'
import { getRedis } from '@/lib/redis'
import {
  checkoutSchema,
  CHECKOUT_ERROR_CODES,
  CheckoutError,
} from '@/lib/validations/checkout'
import {
  INSURANCE_PERCENTAGE,
  calculateInsuranceFee,
  isValidInsuranceFee,
} from '@/lib/constants/insurance'
import {
  calculateWeightShipping,
  DEFAULT_PRICE_PER_KG,
  DEFAULT_WEIGHT_GRAM,
  WEIGHT_THRESHOLD_GRAM,
} from '@/lib/constants/shipping'
import { verifyServerShippingCost } from '@/lib/shipping/shipping-engine'
import { calculateVoucherDiscountAmount } from '@/lib/constants/voucher'
import { calculateOrderVat, calculatePph23 } from '@/lib/tax/tax-engine'

interface CartItem {
  type: 'PRODUCT' | 'RENTAL' | 'SERVICE'
  productId?: string | null
  variantId?: string | null
  variantName?: string | null
  rentalItemId?: string | null
  serviceId?: string | null
  quantity: number
  rentalDays?: number | null
  name?: string | null
  weightGram?: number | null
  pricePerKg?: number | null
}

interface CreatedOrder {
  order: {
    id: string
    orderNumber: string
    status: string
    total: number
    items: unknown[]
    user: {
      name: string | null
      email: string
    }
  }
  type: 'PRODUCT' | 'RENTAL' | 'SERVICE'
}

/**
 * Generates collision-proof order number: PREFIX-YYYYMMDD-8HEX
 * Uses crypto.randomUUID() for high entropy & substring (no deprecated substr)
 */
function generateOrderNumber(prefix: string): string {
  const now = new Date()
  const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, '')
  const randomSuffix = crypto
    .randomUUID()
    .replace(/-/g, '')
    .substring(0, 8)
    .toUpperCase()
  return `${prefix}-${yyyymmdd}-${randomSuffix}`
}

export async function POST(request: NextRequest) {
  let idempotencyRedisKey: string | null = null
  let redisClient: Awaited<ReturnType<typeof getRedis>> = null

  try {
    const session = await auth()

    // 1. Validate user session
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', code: CHECKOUT_ERROR_CODES.UNAUTHORIZED },
        { status: 401 }
      )
    }

    // 2. Check if user is a customer
    if (session.user.role !== 'CUSTOMER') {
      return NextResponse.json(
        {
          error: 'Only customers can checkout',
          code: CHECKOUT_ERROR_CODES.FORBIDDEN_ROLE,
        },
        { status: 403 }
      )
    }

    // 3. Rate limiting (Per-User: 5 req/min, Per-IP: 10 req/10min)
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1'

    const [userRateLimit, ipRateLimit] = await Promise.all([
      checkRateLimit(`checkout:user:${session.user.id}`, 5, 60),
      checkRateLimit(`checkout:ip:${clientIp}`, 10, 600),
    ])

    if (!userRateLimit.success) {
      return NextResponse.json(
        {
          error:
            'Terlalu banyak percobaan checkout. Silakan tunggu beberapa saat lagi.',
          code: CHECKOUT_ERROR_CODES.RATE_LIMIT_USER,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(userRateLimit.resetInSeconds),
          },
        }
      )
    }

    if (!ipRateLimit.success) {
      return NextResponse.json(
        {
          error:
            'Terlalu banyak permintaan dari alamat IP Anda. Silakan coba lagi nanti.',
          code: CHECKOUT_ERROR_CODES.RATE_LIMIT_IP,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(ipRateLimit.resetInSeconds),
          },
        }
      )
    }

    // 4. Idempotency Key via Redis Header
    const rawIdempotencyKey = request.headers.get('x-idempotency-key')?.trim()
    if (
      rawIdempotencyKey &&
      rawIdempotencyKey.length >= 8 &&
      rawIdempotencyKey.length <= 128
    ) {
      idempotencyRedisKey = `idempotency:checkout:${session.user.id}:${rawIdempotencyKey}`
      try {
        redisClient = await getRedis()
        if (redisClient && redisClient.isOpen) {
          const cached = await redisClient.get(idempotencyRedisKey)
          if (cached) {
            if (cached === 'PROCESSING') {
              return NextResponse.json(
                {
                  error:
                    'Pesanan Anda sedang diproses oleh sistem. Mohon tidak menekan tombol berulang kali.',
                  code: CHECKOUT_ERROR_CODES.IDEMPOTENCY_IN_PROGRESS,
                },
                { status: 409 }
              )
            }
            try {
              const parsed = JSON.parse(cached)
              return NextResponse.json(parsed, {
                status: 200,
                headers: {
                  'X-Idempotency-Replayed': 'true',
                },
              })
            } catch {
              // Jika JSON rusak di cache, hapus dan biarkan proses berlanjut
              await redisClient.del(idempotencyRedisKey)
            }
          }
          // Lock key dengan TTL 60 detik selama proses transaksi berjalan
          await redisClient.set(idempotencyRedisKey, 'PROCESSING', { EX: 60 })
        }
      } catch (redisErr) {
        console.warn(
          '[Idempotency] Redis initialization warning:',
          (redisErr as Error).message
        )
      }
    }

    let jsonBody: unknown
    try {
      jsonBody = await request.json()
    } catch {
      return NextResponse.json(
        {
          error: 'Format data tidak valid (invalid JSON)',
          code: CHECKOUT_ERROR_CODES.INVALID_JSON,
        },
        { status: 400 }
      )
    }

    const parseResult = checkoutSchema.safeParse(jsonBody)
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Data pesanan tidak valid',
          code: CHECKOUT_ERROR_CODES.VALIDATION_FAILED,
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const {
      items,
      paymentMethod: selectedPaymentMethod,
      courierCode,
      courierService,
      notes,
      deliveryAddress,
      recipientName,
      recipientPhone,
      voucherCode,
      addressId,
    } = parseResult.data

    // Format optional delivery notes
    let formattedNotes = notes ? String(notes).trim() : ''
    if (deliveryAddress || recipientName || recipientPhone) {
      const addressInfo = [
        recipientName ? `Penerima: ${recipientName}` : '',
        recipientPhone ? `HP: ${recipientPhone}` : '',
        deliveryAddress ? `Alamat: ${deliveryAddress}` : '',
      ]
        .filter(Boolean)
        .join(' | ')
      formattedNotes = formattedNotes
        ? `${formattedNotes}\n[Pengiriman: ${addressInfo}]`
        : `[Pengiriman: ${addressInfo}]`
    }

    // 5. Group items by type
    const productItems: CartItem[] = []
    const rentalItems: CartItem[] = []
    const serviceItems: CartItem[] = []

    for (const item of items as CartItem[]) {
      if (item.type === 'PRODUCT' && item.productId) {
        productItems.push(item)
      } else if (item.type === 'RENTAL' && item.rentalItemId) {
        rentalItems.push(item)
      } else if (item.type === 'SERVICE' && item.serviceId) {
        serviceItems.push(item)
      }
    }

    const createdOrders: CreatedOrder[] = []

    // Helper function to create order atomically with P2002 retry
    const createOrder = async (
      rawItems: CartItem[],
      orderType: 'PRODUCT' | 'RENTAL' | 'SERVICE',
      prefix: string
    ): Promise<CreatedOrder | null> => {
      if (rawItems.length === 0) return null

      let completeOrder: {
        id: string
        orderNumber: string
        status: string
        total: number
        items: unknown[]
        user: {
          name: string | null
          email: string
        }
      } | null = null

      let attempts = 0
      const maxAttempts = 2

      while (attempts < maxAttempts) {
        attempts++
        const orderNumber = generateOrderNumber(prefix)

        try {
          completeOrder = await prisma.$transaction(
            async (tx: any) => {
              let subtotal = 0

              type VerifiedItem = {
                raw: CartItem
                itemPrice: number
                costPrice?: number
                itemSubtotal: number
                storeId: string | null
                commissionRate: number
                isPkp?: boolean
                vatRate?: number
                isTaxable?: boolean
                technicianId: string | null
                weightGram?: number
                pricePerKg?: number
                includesCharger?: boolean
                includesScreenProtector?: boolean
                includesCase?: boolean
              }
              const verifiedItems: VerifiedItem[] = []

              for (const item of rawItems) {
                const quantity = Math.max(
                  1,
                  Math.floor(Number(item.quantity) || 1)
                )

                if (orderType === 'PRODUCT' && item.productId) {
                  // Atomic conditional update: only decrement if active and stock >= quantity
                  const updateResult = await tx.product.updateMany({
                    where: {
                      id: item.productId,
                      isActive: true,
                      stock: { gte: quantity },
                    },
                    data: {
                      stock: { decrement: quantity },
                    },
                  })

                  if (updateResult.count === 0) {
                    const current = await tx.product.findUnique({
                      where: { id: item.productId },
                      select: { name: true, stock: true, isActive: true },
                    })
                    if (!current || !current.isActive) {
                      throw new CheckoutError(
                        `Produk "${item.name || 'Gadget'}" sudah tidak tersedia atau non-aktif`,
                        CHECKOUT_ERROR_CODES.PRODUK_TIDAK_AKTIF,
                        400
                      )
                    }
                    throw new CheckoutError(
                      `Stok tidak mencukupi untuk "${current.name}". Sisa stok: ${current.stock}, diminta: ${quantity}`,
                      CHECKOUT_ERROR_CODES.STOK_HABIS,
                      400
                    )
                  }

                  const product = await tx.product.findUnique({
                    where: { id: item.productId },
                    include: { store: true, variants: true },
                  })

                  if (!product) {
                    throw new CheckoutError(
                      `Produk "${item.name || 'Gadget'}" tidak ditemukan`,
                      CHECKOUT_ERROR_CODES.PRODUK_TIDAK_DITEMUKAN,
                      404
                    )
                  }

                  // Guard LOW-06: Produk fisik wajib memiliki toko mitra aktif
                  if (
                    !product.storeId ||
                    !product.store ||
                    !product.store.isActive
                  ) {
                    throw new CheckoutError(
                      `Produk "${product.name}" belum terhubung dengan cabang toko resmi yang aktif`,
                      CHECKOUT_ERROR_CODES.PRODUK_TANPA_TOKO,
                      400
                    )
                  }

                  const matchedVariant =
                    item.variantId && Array.isArray(product.variants)
                      ? product.variants.find(
                          (v: any) => v.id === item.variantId
                        )
                      : null
                  const itemPrice = matchedVariant
                    ? matchedVariant.price
                    : product.price
                  const itemSubtotal = itemPrice * quantity
                  subtotal += itemSubtotal

                  // Snapshot HPP per unit (prioritaskan varian spesifik, fallback ke modal dasar produk)
                  const itemCostPrice =
                    matchedVariant?.costPrice != null &&
                    matchedVariant.costPrice > 0
                      ? matchedVariant.costPrice
                      : (product.costPrice ?? 0)

                  verifiedItems.push({
                    raw: {
                      ...item,
                      quantity,
                      variantName: matchedVariant?.name || item.variantName,
                    },
                    itemPrice,
                    costPrice: itemCostPrice,
                    itemSubtotal,
                    storeId: product.storeId,
                    commissionRate: product.store?.commissionRate ?? 2.0,
                    isPkp: product.store?.isPkp ?? true,
                    vatRate: product.store?.vatRate ?? 11.0,
                    isTaxable: product.isTaxable ?? true,
                    technicianId: null,
                    weightGram: product.weightGram ?? DEFAULT_WEIGHT_GRAM,
                    pricePerKg: product.pricePerKg ?? DEFAULT_PRICE_PER_KG,
                    includesCharger: product.includesCharger ?? true,
                    includesScreenProtector:
                      product.includesScreenProtector ?? true,
                    includesCase: product.includesCase ?? true,
                  })
                } else if (orderType === 'RENTAL' && item.rentalItemId) {
                  // Atomic conditional update for rental
                  const updateResult = await tx.rentalItem.updateMany({
                    where: {
                      id: item.rentalItemId,
                      isActive: true,
                      stock: { gte: quantity },
                    },
                    data: {
                      stock: { decrement: quantity },
                    },
                  })

                  if (updateResult.count === 0) {
                    const current = await tx.rentalItem.findUnique({
                      where: { id: item.rentalItemId },
                      select: { name: true, stock: true, isActive: true },
                    })
                    if (!current || !current.isActive) {
                      throw new CheckoutError(
                        `Item rental "${item.name || 'Barang'}" sudah tidak tersedia atau non-aktif`,
                        CHECKOUT_ERROR_CODES.PRODUK_TIDAK_AKTIF,
                        400
                      )
                    }
                    throw new CheckoutError(
                      `Stok sewa tidak mencukupi untuk "${current.name}". Sisa stok: ${current.stock}, diminta: ${quantity}`,
                      CHECKOUT_ERROR_CODES.STOK_HABIS,
                      400
                    )
                  }

                  const rentalItem = await tx.rentalItem.findUnique({
                    where: { id: item.rentalItemId },
                  })

                  if (!rentalItem) {
                    throw new CheckoutError(
                      `Item rental "${item.name || 'Barang'}" tidak ditemukan`,
                      CHECKOUT_ERROR_CODES.PRODUK_TIDAK_DITEMUKAN,
                      404
                    )
                  }

                  const days = Math.max(
                    1,
                    Math.floor(Number(item.rentalDays) || 1)
                  )
                  const rentalFee = rentalItem.pricePerDay * days
                  const deposit = rentalItem.depositAmount || 0
                  const itemPrice = rentalFee + deposit
                  const itemSubtotal = itemPrice * quantity
                  subtotal += itemSubtotal

                  verifiedItems.push({
                    raw: { ...item, quantity, rentalDays: days },
                    itemPrice,
                    itemSubtotal,
                    storeId: null,
                    commissionRate: 2.0,
                    technicianId: null,
                    weightGram: DEFAULT_WEIGHT_GRAM,
                    pricePerKg: DEFAULT_PRICE_PER_KG,
                  })
                } else if (orderType === 'SERVICE' && item.serviceId) {
                  const service = await tx.service.findUnique({
                    where: { id: item.serviceId },
                    include: { technician: true },
                  })

                  if (!service || !service.isActive) {
                    throw new CheckoutError(
                      `Layanan servis "${item.name || 'Servis'}" sudah tidak tersedia atau non-aktif`,
                      CHECKOUT_ERROR_CODES.PRODUK_TIDAK_AKTIF,
                      400
                    )
                  }

                  const itemPrice = service.price
                  const itemSubtotal = itemPrice
                  subtotal += itemSubtotal

                  verifiedItems.push({
                    raw: { ...item, quantity: 1 },
                    itemPrice,
                    itemSubtotal,
                    storeId: null,
                    commissionRate: 2.0,
                    technicianId: service.technicianId || null,
                  })
                }
              }

              // Server-side shipping, insurance & commission calculation
              let shippingCost = 0
              let insuranceFee = 0
              let totalWeightGram: number | null = null
              const detectedCourier = courierCode === 'GOJEK' ? 'GOJEK' : 'JNE'
              const detectedService =
                detectedCourier === 'GOJEK'
                  ? courierService === 'SAMEDAY'
                    ? 'SAMEDAY'
                    : 'INSTANT'
                  : courierService === 'YES'
                    ? 'YES'
                    : 'REG'

              if (orderType === 'PRODUCT' || orderType === 'RENTAL') {
                const accumulatedWeight = verifiedItems.reduce(
                  (sum, vi) =>
                    sum +
                    (vi.weightGram ?? DEFAULT_WEIGHT_GRAM) *
                      (vi.raw.quantity ?? 1),
                  0
                )
                totalWeightGram = accumulatedWeight

                // Dapatkan Store & Address untuk kalkulasi ongkir real-time
                const storeId = verifiedItems[0]?.storeId
                let originLoc: any = {}
                let destLoc: any = {}

                if (storeId) {
                  const store = await tx.store.findUnique({
                    where: { id: storeId },
                    select: {
                      latitude: true,
                      longitude: true,
                      city: true,
                      province: true,
                      postalCode: true,
                    },
                  })
                  if (store) {
                    originLoc = {
                      latitude: store.latitude,
                      longitude: store.longitude,
                      city: store.city,
                      province: store.province,
                      postalCode: store.postalCode,
                    }
                  }
                }

                if (addressId) {
                  const userAddr = await tx.userAddress.findUnique({
                    where: { id: addressId },
                    select: {
                      latitude: true,
                      longitude: true,
                      city: true,
                      province: true,
                      district: true,
                      postalCode: true,
                    },
                  })
                  if (userAddr) {
                    destLoc = {
                      latitude: userAddr.latitude,
                      longitude: userAddr.longitude,
                      city: userAddr.city,
                      province: userAddr.province,
                      district: userAddr.district,
                      postalCode: userAddr.postalCode,
                    }
                  }
                }

                const shippingVerification = await verifyServerShippingCost(
                  originLoc,
                  destLoc,
                  detectedCourier,
                  detectedService,
                  verifiedItems.map((vi) => ({
                    name: vi.raw.name,
                    weightGram: vi.weightGram ?? DEFAULT_WEIGHT_GRAM,
                    price: vi.itemPrice,
                    quantity: vi.raw.quantity ?? 1,
                  }))
                )

                if (
                  detectedCourier === 'GOJEK' &&
                  !shippingVerification.available
                ) {
                  throw new CheckoutError(
                    shippingVerification.reason ||
                      'Pengiriman Gojek Instant tidak tersedia untuk jarak pengiriman ini. Silakan gunakan JNE Express.',
                    CHECKOUT_ERROR_CODES.VALIDATION_FAILED,
                    400
                  )
                }

                shippingCost = shippingVerification.cost
                insuranceFee = calculateInsuranceFee(subtotal)
              }

              // Server integrity check for insurance
              if (
                !isValidInsuranceFee(
                  subtotal,
                  insuranceFee,
                  orderType === 'SERVICE'
                )
              ) {
                throw new CheckoutError(
                  'Integritas kalkulasi asuransi pengiriman gagal',
                  CHECKOUT_ERROR_CODES.INTERNAL_ERROR,
                  500
                )
              }

              // Voucher calculation (PRODUCT only)
              let appliedVoucherId: string | null = null
              let appliedVoucherCode: string | null = null
              let appliedDiscountAmount = 0

              if (orderType === 'PRODUCT' && voucherCode) {
                const cleanCode = voucherCode.trim().toUpperCase()
                const dbVoucher = await tx.voucher.findUnique({
                  where: { code: cleanCode },
                })

                if (!dbVoucher) {
                  throw new CheckoutError(
                    `Kode voucher "${cleanCode}" tidak valid`,
                    CHECKOUT_ERROR_CODES.VOUCHER_INVALID,
                    400
                  )
                }

                if (!dbVoucher.isActive) {
                  throw new CheckoutError(
                    'Voucher yang Anda gunakan sedang tidak aktif',
                    CHECKOUT_ERROR_CODES.VOUCHER_INVALID,
                    400
                  )
                }

                const now = new Date()
                if (now < dbVoucher.validFrom || now > dbVoucher.validUntil) {
                  throw new CheckoutError(
                    'Masa berlaku voucher telah berakhir',
                    CHECKOUT_ERROR_CODES.VOUCHER_EXPIRED,
                    400
                  )
                }

                if (dbVoucher.usedCount >= dbVoucher.totalQuota) {
                  throw new CheckoutError(
                    'Kuota penukaran voucher telah habis',
                    CHECKOUT_ERROR_CODES.VOUCHER_QUOTA_EMPTY,
                    400
                  )
                }

                if (subtotal < dbVoucher.minimumPurchase) {
                  throw new CheckoutError(
                    `Minimum belanja Rp ${dbVoucher.minimumPurchase.toLocaleString('id-ID')} untuk menggunakan voucher ini`,
                    CHECKOUT_ERROR_CODES.VOUCHER_MIN_PURCHASE,
                    400
                  )
                }

                const userUsageCount = await tx.voucherUsage.count({
                  where: {
                    voucherId: dbVoucher.id,
                    userId: session.user.id,
                  },
                })

                if (userUsageCount >= dbVoucher.usagePerUser) {
                  throw new CheckoutError(
                    `Anda telah mencapai batas maksimal (${dbVoucher.usagePerUser}x) pemakaian voucher ini`,
                    CHECKOUT_ERROR_CODES.VOUCHER_USER_LIMIT,
                    400
                  )
                }

                appliedDiscountAmount = calculateVoucherDiscountAmount(
                  subtotal,
                  dbVoucher.discountPercent,
                  dbVoucher.maxDiscountAmount
                )

                const voucherUpdate = await tx.voucher.updateMany({
                  where: {
                    id: dbVoucher.id,
                    usedCount: { lt: dbVoucher.totalQuota },
                  },
                  data: {
                    usedCount: { increment: 1 },
                  },
                })

                if (voucherUpdate.count === 0) {
                  throw new CheckoutError(
                    'Kuota voucher telah habis',
                    CHECKOUT_ERROR_CODES.VOUCHER_QUOTA_EMPTY,
                    400
                  )
                }

                appliedVoucherId = dbVoucher.id
                appliedVoucherCode = dbVoucher.code
              }

              const total = Math.max(
                0,
                subtotal + shippingCost + insuranceFee - appliedDiscountAmount
              )

              // Store & Commission & Tax
              const detectedStoreItem = verifiedItems.find((vi) => vi.storeId)
              const detectedStoreId = detectedStoreItem?.storeId || null
              const commissionRate = detectedStoreItem?.commissionRate ?? 2.0
              const isPkp = detectedStoreItem?.isPkp ?? false
              const vatRate = detectedStoreItem?.vatRate ?? 11.0
              const commissionAmount = (subtotal * commissionRate) / 100

              // Silent Inclusive VAT Extraction
              const subtotalAfterDiscount = Math.max(
                0,
                subtotal - appliedDiscountAmount
              )
              const vatResult = calculateOrderVat(subtotalAfterDiscount, {
                isPkp: orderType === 'PRODUCT' ? isPkp : false,
                vatRate,
              })

              // PPh 23 Komisi Platform & Cadangan PPh 22 Final UMKM
              // PPh 23 Komisi Platform (2% otomatis permanen)
              const pph23Result = calculatePph23(commissionAmount)

              // Dynamic 3-in-1 bonus based on product schema flags (BONUS-01)
              const bonusChargerIncluded =
                orderType === 'PRODUCT'
                  ? verifiedItems.every((vi) => vi.includesCharger !== false)
                  : false
              const bonusProtectorIncluded =
                orderType === 'PRODUCT'
                  ? verifiedItems.every(
                      (vi) => vi.includesScreenProtector !== false
                    )
                  : false
              const bonusCaseIncluded =
                orderType === 'PRODUCT'
                  ? verifiedItems.every((vi) => vi.includesCase !== false)
                  : false

              // Create Order record
              const newOrder = await tx.order.create({
                data: {
                  orderNumber,
                  userId: session.user.id,
                  storeId: detectedStoreId,
                  technicianId:
                    orderType === 'SERVICE'
                      ? verifiedItems[0]?.technicianId || null
                      : null,
                  status: 'PENDING_PAYMENT',
                  subtotal,
                  tax: vatResult.vatAmount,
                  dppAmount: vatResult.dppAmount,
                  vatRate: vatResult.vatRate,
                  taxTypeApplied: 'INCLUSIVE',
                  pph23Amount: pph23Result.pph23Amount,
                  pph23Rate: pph23Result.pph23Rate,
                  shippingCost,
                  totalWeightGram,
                  voucherId: appliedVoucherId,
                  voucherCode: appliedVoucherCode,
                  discountAmount: appliedDiscountAmount,
                  insuranceRate:
                    orderType !== 'SERVICE' ? INSURANCE_PERCENTAGE : 0,
                  insuranceFee,
                  isInsuranceMandatory: orderType !== 'SERVICE',
                  commissionRate,
                  commissionAmount,
                  courierCode: orderType !== 'SERVICE' ? detectedCourier : null,
                  courierService:
                    orderType !== 'SERVICE' ? detectedService : null,
                  bonusChargerIncluded,
                  bonusProtectorIncluded,
                  bonusCaseIncluded,
                  total,
                  notes: formattedNotes || null,
                },
              })

              if (appliedVoucherId) {
                await tx.voucherUsage.create({
                  data: {
                    voucherId: appliedVoucherId,
                    userId: session.user.id,
                    orderId: newOrder.id,
                    discountApplied: appliedDiscountAmount,
                  },
                })
              }

              // Create OrderItem records
              for (const vi of verifiedItems) {
                await tx.orderItem.create({
                  data: {
                    orderId: newOrder.id,
                    type: vi.raw.type,
                    serviceId: vi.raw.serviceId || null,
                    productId: vi.raw.productId || null,
                    rentalItemId: vi.raw.rentalItemId || null,
                    variantId: vi.raw.variantId || null,
                    variantName: vi.raw.variantName || null,
                    quantity: vi.raw.quantity,
                    rentalDays: vi.raw.rentalDays || null,
                    price: vi.itemPrice,
                    costPrice: vi.costPrice ?? 0,
                    subtotal: vi.itemSubtotal,
                    notes: null,
                  },
                })
              }

              // Create Payment record
              await tx.payment.create({
                data: {
                  orderId: newOrder.id,
                  method: selectedPaymentMethod as PaymentMethod,
                  status: 'PENDING',
                  amount: total,
                },
              })

              return await tx.order.findUnique({
                where: { id: newOrder.id },
                include: {
                  items: {
                    include: {
                      service: {
                        select: {
                          name: true,
                          category: true,
                        },
                      },
                      product: {
                        select: {
                          id: true,
                          name: true,
                          images: true,
                          price: true,
                        },
                      },
                      rentalItem: {
                        select: {
                          id: true,
                          name: true,
                          images: true,
                          pricePerDay: true,
                          depositAmount: true,
                        },
                      },
                    },
                  },
                  user: {
                    select: {
                      name: true,
                      email: true,
                    },
                  },
                },
              })
            },
            {
              maxWait: 5000,
              timeout: 10000,
            }
          )

          // Berhasil, keluar dari loop retry
          break
        } catch (txError: unknown) {
          // Retry jika terjadi tabrakan nomor pesanan (P2002 unique constraint)
          if (
            txError instanceof Prisma.PrismaClientKnownRequestError &&
            txError.code === 'P2002' &&
            attempts < maxAttempts
          ) {
            console.warn(
              `[Checkout] Order number collision detected for ${orderNumber}, retrying (${attempts}/${maxAttempts})...`
            )
            continue
          }
          throw txError
        }
      }

      return completeOrder ? { order: completeOrder, type: orderType } : null
    }

    // Create orders for each type
    const productOrder = await createOrder(productItems, 'PRODUCT', 'SPR')
    const rentalOrder = await createOrder(rentalItems, 'RENTAL', 'RNT')
    const serviceOrder = await createOrder(serviceItems, 'SERVICE', 'SVC')

    if (productOrder) createdOrders.push(productOrder)
    if (rentalOrder) createdOrders.push(rentalOrder)
    if (serviceOrder) createdOrders.push(serviceOrder)

    if (createdOrders.length === 0) {
      throw new CheckoutError(
        'Gagal membuat pesanan. Tidak ada item yang dapat diproses.',
        CHECKOUT_ERROR_CODES.ORDER_CREATION_FAILED,
        400
      )
    }

    // 6. Fetch relevant bank accounts (LOW-01 eliminated any)
    const categories: BankAccountCategory[] = []
    if (productItems.length > 0) categories.push(BankAccountCategory.SPAREPART)
    if (rentalItems.length > 0) categories.push(BankAccountCategory.SEWA)
    if (serviceItems.length > 0) categories.push(BankAccountCategory.JASA)

    const bankAccounts = await prisma.bankAccount.findMany({
      where: {
        category: {
          in: categories,
        },
        isActive: true,
      },
      orderBy: {
        category: 'asc',
      },
    })

    // 7. Payment Gateway Integration:
    // In-house custom payment modal charges Midtrans Core API on-demand (/api/payment/charge)
    const snapToken: string | null = null
    const snapRedirectUrl: string | null = null

    const responsePayload = {
      success: true,
      orders: createdOrders,
      bankAccounts,
      snapToken,
      snapRedirectUrl,
    }

    // Cache idempotency response if key provided (TTL 600 detik)
    if (idempotencyRedisKey && redisClient && redisClient.isOpen) {
      try {
        await redisClient.set(
          idempotencyRedisKey,
          JSON.stringify(responsePayload),
          { EX: 600 }
        )
      } catch (cacheErr) {
        console.warn(
          '[Idempotency] Failed to cache response:',
          (cacheErr as Error).message
        )
      }
    }

    return NextResponse.json(responsePayload)
  } catch (error: unknown) {
    // Release idempotency processing lock on failure
    if (idempotencyRedisKey && redisClient && redisClient.isOpen) {
      try {
        await redisClient.del(idempotencyRedisKey)
      } catch {
        // Ignore cache cleanup failure
      }
    }

    if (error instanceof CheckoutError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      )
    }

    if (error instanceof Error) {
      const msg = error.message
      if (
        msg.includes('Stok tidak mencukupi') ||
        msg.includes('Stok sewa tidak mencukupi')
      ) {
        return NextResponse.json(
          { error: msg, code: CHECKOUT_ERROR_CODES.STOK_HABIS },
          { status: 400 }
        )
      }
      if (msg.includes('sudah tidak tersedia atau non-aktif')) {
        return NextResponse.json(
          { error: msg, code: CHECKOUT_ERROR_CODES.PRODUK_TIDAK_AKTIF },
          { status: 400 }
        )
      }
      if (msg.includes('tidak ditemukan')) {
        return NextResponse.json(
          { error: msg, code: CHECKOUT_ERROR_CODES.PRODUK_TIDAK_DITEMUKAN },
          { status: 404 }
        )
      }
    }

    console.error('[Checkout] Internal server error:', error)
    return NextResponse.json(
      {
        error: 'Terjadi kesalahan sistem saat memproses pesanan',
        code: CHECKOUT_ERROR_CODES.INTERNAL_ERROR,
      },
      { status: 500 }
    )
  }
}
