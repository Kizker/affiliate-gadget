import {
  OtpPurpose,
  OtpChannel,
  NotificationChannel,
  DeliveryStatus,
} from '@prisma/client'

export type { OtpPurpose, OtpChannel, NotificationChannel, DeliveryStatus }

export interface NotificationResult {
  success: boolean
  provider: string
  messageId?: string
  errorMessage?: string
  cost?: number
}

export interface OtpRequest {
  identifier: string
  purpose: OtpPurpose
  channel: OtpChannel
  userId?: string
}

export interface OtpVerifyParams {
  identifier: string
  code: string
  purpose: OtpPurpose
}

export type TransactionalEvent =
  | 'ORDER_CREATED'
  | 'PAYMENT_VERIFIED'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'ORDER_COMPLETED'
  | 'ORDER_CANCELLED'

export interface TransactionalPayload {
  event: TransactionalEvent
  orderId: string
  orderNumber: string
  userId?: string
  customerName: string
  customerPhone?: string
  customerEmail?: string
  totalAmount?: number
  paymentDeadline?: string
  storeName?: string
  courierName?: string
  awbNumber?: string
  trackingUrl?: string
}

export interface SecurityAlertPayload {
  userId: string
  name: string
  email?: string
  phone?: string
  deviceLabel: string
  ipAddress: string
  location?: string
  loginTime?: string
  revokeUrl?: string
}
