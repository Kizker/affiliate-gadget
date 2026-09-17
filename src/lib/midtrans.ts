import crypto from 'crypto'
import dotenv from 'dotenv'
import path from 'path'

import midtransClient from 'midtrans-client'

export function getMidtransConfig() {
  try {
    dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true })
  } catch {}

  const isProduction =
    process.env.MIDTRANS_IS_PRODUCTION === 'true' ||
    process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
  const serverKey = process.env.MIDTRANS_SERVER_KEY || ''
  const clientKey =
    process.env.MIDTRANS_CLIENT_KEY ||
    process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ||
    ''
  const merchantId = process.env.MIDTRANS_MERCHANT_ID || ''

  return { isProduction, serverKey, clientKey, merchantId }
}

export function getSnapClient() {
  const { isProduction, serverKey, clientKey } = getMidtransConfig()
  return new midtransClient.Snap({
    isProduction,
    serverKey,
    clientKey,
  })
}

export function getCoreApiClient() {
  const { isProduction, serverKey, clientKey } = getMidtransConfig()
  return new midtransClient.CoreApi({
    isProduction,
    serverKey,
    clientKey,
  })
}

// Export default instances for backward compatibility
export const snap = getSnapClient()
export const coreApi = getCoreApiClient()

export interface CreateSnapTransactionParams {
  orderId: string
  grossAmount: number
  customerDetails: {
    firstName: string
    lastName?: string
    email: string
    phone?: string
    shippingAddress?: {
      address: string
      city?: string
      postalCode?: string
    }
  }
  itemDetails: Array<{
    id: string
    price: number
    quantity: number
    name: string
  }>
}

export async function createMidtransSnapTransaction(
  params: CreateSnapTransactionParams
): Promise<{ token: string; redirect_url: string }> {
  const { serverKey } = getMidtransConfig()
  if (!serverKey) {
    throw new Error(
      'MIDTRANS_SERVER_KEY is not configured in environment variables'
    )
  }
  const snapInstance = getSnapClient()

  // Midtrans validation requires gross_amount == sum(item.price * item.quantity)
  const items = params.itemDetails.map((item) => ({
    id: item.id.substring(0, 50),
    price: Math.round(item.price),
    quantity: item.quantity,
    name: item.name.substring(0, 50),
  }))

  const sumItems = items.reduce((acc, it) => acc + it.price * it.quantity, 0)
  const diff = Math.round(params.grossAmount) - sumItems

  if (diff !== 0) {
    items.push({
      id: diff < 0 ? 'VOUCHER-DISC' : 'ADJUSTMENT',
      price: diff,
      quantity: 1,
      name: diff < 0 ? 'Diskon Promo' : 'Biaya Tambahan',
    })
  }

  const parameter = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: Math.round(params.grossAmount),
    },
    customer_details: {
      first_name: params.customerDetails.firstName,
      last_name: params.customerDetails.lastName || '',
      email: params.customerDetails.email,
      phone: params.customerDetails.phone || '',
      shipping_address: params.customerDetails.shippingAddress
        ? {
            first_name: params.customerDetails.firstName,
            phone: params.customerDetails.phone || '',
            address: params.customerDetails.shippingAddress.address.substring(
              0,
              100
            ),
            city: params.customerDetails.shippingAddress.city || '',
            postal_code:
              params.customerDetails.shippingAddress.postalCode || '',
          }
        : undefined,
    },
    item_details: items,
  }

  const transaction = await snapInstance.createTransaction(parameter)
  return transaction
}

export function verifyMidtransSignature(params: {
  orderId: string
  statusCode: string
  grossAmount: string
  signatureKey: string
  customServerKey?: string
}): boolean {
  const { serverKey } = getMidtransConfig()
  const keyToUse = params.customServerKey || serverKey
  if (!keyToUse) return false
  const payload = `${params.orderId}${params.statusCode}${params.grossAmount}${keyToUse}`
  const hash = crypto.createHash('sha512').update(payload).digest('hex')
  return hash === params.signatureKey
}

export type CustomPaymentMethod =
  | 'qris'
  | 'bca_va'
  | 'mandiri_va'
  | 'bni_va'
  | 'bri_va'
  | 'gopay'
  | 'shopeepay'

export interface ChargeTransactionParams {
  orderId: string
  grossAmount: number
  paymentType: CustomPaymentMethod
  customerDetails?: {
    firstName: string
    email: string
    phone?: string
  }
}

export async function chargeMidtransTransaction(
  params: ChargeTransactionParams
): Promise<any> {
  const core = getCoreApiClient()
  const gross_amount = Math.round(params.grossAmount)
  const order_id = params.orderId

  const parameter: any = {
    transaction_details: {
      order_id,
      gross_amount,
    },
    customer_details: params.customerDetails
      ? {
          first_name: params.customerDetails.firstName,
          email: params.customerDetails.email,
          phone: params.customerDetails.phone || '',
        }
      : undefined,
  }

  switch (params.paymentType) {
    case 'qris':
      parameter.payment_type = 'qris'
      parameter.qris = { acquirer: 'gopay' }
      break
    case 'bca_va':
      parameter.payment_type = 'bank_transfer'
      parameter.bank_transfer = { bank: 'bca' }
      break
    case 'bni_va':
      parameter.payment_type = 'bank_transfer'
      parameter.bank_transfer = { bank: 'bni' }
      break
    case 'bri_va':
      parameter.payment_type = 'bank_transfer'
      parameter.bank_transfer = { bank: 'bri' }
      break
    case 'mandiri_va':
      parameter.payment_type = 'echannel'
      parameter.echannel = {
        bill_info1: 'Pembayaran Gadget:',
        bill_info2: order_id.substring(0, 30),
      }
      break
    case 'gopay':
      parameter.payment_type = 'gopay'
      break
    case 'shopeepay':
      parameter.payment_type = 'shopeepay'
      break
    default:
      throw new Error(`Unsupported payment type: ${params.paymentType}`)
  }

  return await core.charge(parameter)
}

export async function checkMidtransTransactionStatus(
  orderNumber: string
): Promise<any> {
  const core = getCoreApiClient()
  return await core.transaction.status(orderNumber)
}
