import { z } from 'zod'

export const checkoutItemSchema = z
  .object({
    id: z.string().optional().nullable(),
    type: z.enum(['PRODUCT', 'RENTAL', 'SERVICE'], {
      required_error: 'Tipe item wajib ditentukan',
    }),
    productId: z.string().trim().min(1).optional().nullable(),
    variantId: z.string().trim().optional().nullable(),
    variantName: z.string().optional().nullable(),
    rentalItemId: z.string().trim().min(1).optional().nullable(),
    serviceId: z.string().trim().min(1).optional().nullable(),
    quantity: z
      .number({ invalid_type_error: 'Jumlah harus berupa angka' })
      .int('Jumlah harus berupa bilangan bulat')
      .positive('Jumlah item harus lebih dari 0')
      .max(10, 'Maksimal pembelian 10 unit per barang'),
    rentalDays: z
      .number({ invalid_type_error: 'Hari sewa harus berupa angka' })
      .int('Hari sewa harus berupa bilangan bulat')
      .positive('Hari sewa harus minimal 1 hari')
      .max(90, 'Maksimal durasi sewa 90 hari')
      .optional()
      .nullable(),
    name: z.string().max(255).optional().nullable(),
    price: z.number().nonnegative().optional().nullable(),
    image: z.string().optional().nullable(),
    stock: z.number().optional().nullable(),
    weightGram: z.number().optional().nullable(),
    pricePerKg: z.number().optional().nullable(),
    notes: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (
      data.type === 'PRODUCT' &&
      (!data.productId || data.productId.trim() === '')
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['productId'],
        message: 'productId wajib diisi untuk item produk',
      })
    }
    if (
      data.type === 'RENTAL' &&
      (!data.rentalItemId || data.rentalItemId.trim() === '')
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['rentalItemId'],
        message: 'rentalItemId wajib diisi untuk item sewa',
      })
    }
    if (
      data.type === 'SERVICE' &&
      (!data.serviceId || data.serviceId.trim() === '')
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['serviceId'],
        message: 'serviceId wajib diisi untuk item servis',
      })
    }
  })

export const checkoutSchema = z.object({
  items: z
    .array(checkoutItemSchema)
    .min(1, 'Keranjang belanja kosong')
    .max(20, 'Maksimal 20 item dalam satu pesanan'),
  paymentMethod: z
    .enum(['CASH', 'MANUAL_TRANSFER', 'MIDTRANS'])
    .default('CASH'),
  courierCode: z.string().trim().min(1).max(50).default('JNE'),
  courierService: z.string().trim().min(1).max(50).default('REG'),
  shippingCost: z
    .number({ invalid_type_error: 'Biaya pengiriman harus berupa angka' })
    .nonnegative('Biaya pengiriman tidak boleh negatif')
    .optional()
    .nullable(),
  insuranceFee: z
    .number({ invalid_type_error: 'Biaya asuransi harus berupa angka' })
    .nonnegative('Biaya asuransi tidak boleh negatif')
    .optional()
    .nullable(),
  isInsuranceMandatory: z.boolean().optional().nullable(),
  bonusChargerIncluded: z.boolean().optional().nullable(),
  bonusProtectorIncluded: z.boolean().optional().nullable(),
  bonusCaseIncluded: z.boolean().optional().nullable(),
  addressId: z.string().optional().nullable(),
  notes: z
    .string()
    .max(500, 'Catatan pengiriman maksimal 500 karakter')
    .optional()
    .nullable(),
  deliveryAddress: z
    .string()
    .max(500, 'Alamat pengiriman maksimal 500 karakter')
    .optional()
    .nullable(),
  recipientName: z
    .string()
    .max(100, 'Nama penerima maksimal 100 karakter')
    .optional()
    .nullable(),
  recipientPhone: z
    .string()
    .max(50, 'Nomor telepon penerima maksimal 50 digit')
    .optional()
    .nullable(),
  voucherCode: z
    .string()
    .trim()
    .max(50, 'Kode voucher maksimal 50 karakter')
    .optional()
    .nullable(),
})

export type CheckoutInput = z.infer<typeof checkoutSchema>
export type CheckoutItemInput = z.infer<typeof checkoutItemSchema>

export const CHECKOUT_ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN_ROLE: 'FORBIDDEN_ROLE',
  RATE_LIMIT_USER: 'RATE_LIMIT_USER',
  RATE_LIMIT_IP: 'RATE_LIMIT_IP',
  INVALID_JSON: 'INVALID_JSON',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  IDEMPOTENCY_IN_PROGRESS: 'IDEMPOTENCY_IN_PROGRESS',
  IDEMPOTENCY_REPLAY: 'IDEMPOTENCY_REPLAY',
  STOK_HABIS: 'STOK_HABIS',
  PRODUK_TIDAK_AKTIF: 'PRODUK_TIDAK_AKTIF',
  PRODUK_TIDAK_DITEMUKAN: 'PRODUK_TIDAK_DITEMUKAN',
  PRODUK_TANPA_TOKO: 'PRODUK_TANPA_TOKO',
  ORDER_CREATION_FAILED: 'ORDER_CREATION_FAILED',
  ORDER_NUMBER_CONFLICT: 'ORDER_NUMBER_CONFLICT',
  VOUCHER_INVALID: 'VOUCHER_INVALID',
  VOUCHER_EXPIRED: 'VOUCHER_EXPIRED',
  VOUCHER_QUOTA_EMPTY: 'VOUCHER_QUOTA_EMPTY',
  VOUCHER_MIN_PURCHASE: 'VOUCHER_MIN_PURCHASE',
  VOUCHER_USER_LIMIT: 'VOUCHER_USER_LIMIT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type CheckoutErrorCode =
  (typeof CHECKOUT_ERROR_CODES)[keyof typeof CHECKOUT_ERROR_CODES]

export class CheckoutError extends Error {
  public code: CheckoutErrorCode
  public statusCode: number

  constructor(
    message: string,
    code: CheckoutErrorCode = CHECKOUT_ERROR_CODES.INTERNAL_ERROR,
    statusCode: number = 400
  ) {
    super(message)
    this.name = 'CheckoutError'
    this.code = code
    this.statusCode = statusCode
  }
}
