import { db } from '@/lib/db'
import {
  NotificationChannel,
  OtpChannel,
  OtpPurpose,
  DeliveryStatus,
  NotificationType,
} from '@prisma/client'
import { sendWhatsApp } from './whatsapp-provider'
import { sendSms } from './sms-provider'
import { sendEmail } from './email-provider'
import { createOtpRecord } from './otp-generator'
import {
  otpMessage,
  orderCreatedMessage,
  paymentVerifiedMessage,
  orderShippedMessage,
  orderDeliveredMessage,
  orderCompletedMessage,
  newDeviceAlertMessage,
} from './templates/whatsapp-templates'
import {
  otpEmailTemplate,
  otpPlainText,
  orderCreatedEmailTemplate,
  paymentVerifiedEmailTemplate,
  orderShippedEmailTemplate,
  orderDeliveredEmailTemplate,
  orderCompletedEmailTemplate,
  orderRefundedEmailTemplate,
  orderComplainedEmailTemplate,
  orderCancelledEmailTemplate,
  newDeviceSecurityEmailTemplate,
} from './templates/email-templates'
import {
  NotificationResult,
  TransactionalPayload,
  SecurityAlertPayload,
} from './types'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'

function getPurposeLabel(purpose: OtpPurpose): string {
  switch (purpose) {
    case 'LOGIN':
      return 'Login / Masuk'
    case 'REGISTER':
      return 'Pendaftaran Akun'
    case 'CHANGE_PHONE':
      return 'Perubahan Nomor Telepon'
    case 'CHANGE_EMAIL':
      return 'Perubahan Email'
    case 'CHANGE_PASSWORD':
      return 'Ganti Kata Sandi'
    case 'TRANSACTION_CONFIRMATION':
      return 'Konfirmasi Transaksi'
    default:
      return 'Keamanan Akun'
  }
}

/**
 * Dispatch OTP across requested channel (WhatsApp, SMS, or Email)
 */
export async function dispatchOtp(params: {
  identifier: string
  purpose: OtpPurpose
  channel: OtpChannel
  userId?: string
}): Promise<{ success: boolean; otpId?: string; errorMessage?: string }> {
  try {
    const { code, otpToken } = await createOtpRecord(params)
    const purposeLabel = getPurposeLabel(params.purpose)
    const expireMinutes = Math.floor(
      parseInt(process.env.OTP_EXPIRE_SECONDS || '300', 10) / 60
    )

    let sendResult: NotificationResult

    if (params.channel === 'WHATSAPP') {
      const msg = otpMessage(code, purposeLabel, expireMinutes)
      sendResult = await sendWhatsApp(params.identifier, msg)
    } else if (params.channel === 'SMS') {
      const msg = otpMessage(code, purposeLabel, expireMinutes)
      sendResult = await sendSms(params.identifier, msg)
    } else {
      const html = otpEmailTemplate(code, purposeLabel, expireMinutes)
      const text = otpPlainText(code, purposeLabel, expireMinutes)
      sendResult = await sendEmail(
        params.identifier,
        `Kode Verifikasi OTP - ${purposeLabel}`,
        html,
        text
      )
    }

    // Catat log audit ke database
    await db.notificationLog.create({
      data: {
        userId: params.userId || null,
        channel: params.channel as NotificationChannel,
        provider: sendResult.provider,
        recipient: params.identifier,
        subject: `OTP ${purposeLabel}`,
        status: sendResult.success
          ? DeliveryStatus.SENT
          : DeliveryStatus.FAILED,
        errorMessage: sendResult.errorMessage || null,
        cost: sendResult.cost || 0,
      },
    })

    return {
      success: sendResult.success,
      otpId: otpToken.id,
      errorMessage: sendResult.errorMessage,
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Gagal mengirim OTP'
    console.error('[DISPATCH OTP ERROR]:', errorMessage)
    return { success: false, errorMessage }
  }
}

/**
 * Dispatch transactional notifications across WhatsApp, Email, and In-App notification
 * Non-blocking safe execution.
 */
export async function dispatchTransactional(
  payload: TransactionalPayload
): Promise<void> {
  try {
    const formatRp = (num?: number) =>
      num ? `Rp ${num.toLocaleString('id-ID')}` : 'Rp 0'

    const totalFormatted = formatRp(payload.totalAmount)
    const viewOrderUrl = `${APP_URL}/dashboard/customer/orders/${payload.orderId}`
    const trackUrl =
      payload.trackingUrl || `${APP_URL}/resi?no=${payload.awbNumber || ''}`

    const tasks: Promise<unknown>[] = []

    // 1. WhatsApp Notification
    if (payload.customerPhone) {
      let waMessage = ''
      switch (payload.event) {
        case 'ORDER_CREATED':
          waMessage = orderCreatedMessage(
            payload.customerName,
            payload.orderNumber,
            totalFormatted,
            payload.paymentDeadline || '24 jam'
          )
          break
        case 'PAYMENT_VERIFIED':
          waMessage = paymentVerifiedMessage(
            payload.customerName,
            payload.orderNumber,
            payload.storeName || 'Cabang Toko Resmi'
          )
          break
        case 'ORDER_SHIPPED':
          waMessage = orderShippedMessage(
            payload.customerName,
            payload.orderNumber,
            payload.courierName || 'Kurir Logistik',
            payload.awbNumber || '-',
            trackUrl
          )
          break
        case 'ORDER_DELIVERED':
          waMessage = orderDeliveredMessage(
            payload.customerName,
            payload.orderNumber
          )
          break
        case 'ORDER_COMPLETED':
          waMessage = orderCompletedMessage(
            payload.customerName,
            payload.orderNumber
          )
          break
      }

      if (waMessage) {
        tasks.push(
          (async () => {
            const res = await sendWhatsApp(payload.customerPhone!, waMessage)
            await db.notificationLog.create({
              data: {
                userId: payload.userId || null,
                channel: NotificationChannel.WHATSAPP,
                provider: res.provider,
                recipient: payload.customerPhone!,
                subject: `Order ${payload.event} #${payload.orderNumber}`,
                status: res.success
                  ? DeliveryStatus.SENT
                  : DeliveryStatus.FAILED,
                errorMessage: res.errorMessage || null,
                cost: res.cost || 0,
              },
            })
          })()
        )
      }
    }

    // 2. Email Notification
    if (payload.customerEmail) {
      let emailSubject = ''
      let emailHtml = ''

      switch (payload.event) {
        case 'ORDER_CREATED':
          emailSubject = `Pesanan #${payload.orderNumber} Berhasil Dibuat`
          emailHtml = orderCreatedEmailTemplate({
            customerName: payload.customerName,
            orderNumber: payload.orderNumber,
            totalFormatted,
            paymentDeadline: payload.paymentDeadline,
            viewOrderUrl,
          })
          break
        case 'PAYMENT_VERIFIED':
          emailSubject = `Pembayaran Pesanan #${payload.orderNumber} Terverifikasi`
          emailHtml = paymentVerifiedEmailTemplate({
            customerName: payload.customerName,
            orderNumber: payload.orderNumber,
            totalFormatted,
            storeName: payload.storeName || 'Cabang Toko Resmi',
            viewOrderUrl,
          })
          break
        case 'ORDER_SHIPPED':
          emailSubject = `Pesanan #${payload.orderNumber} Sedang Dikirim (${payload.courierName || 'Kurir'})`
          emailHtml = orderShippedEmailTemplate({
            customerName: payload.customerName,
            orderNumber: payload.orderNumber,
            courier: payload.courierName || 'Kurir Logistik',
            awb: payload.awbNumber || '-',
            trackingUrl: trackUrl,
          })
          break
        case 'ORDER_DELIVERED':
          emailSubject = `Pesanan #${payload.orderNumber} Telah Tiba di Alamat Tujuan`
          emailHtml = orderDeliveredEmailTemplate({
            customerName: payload.customerName,
            orderNumber: payload.orderNumber,
            confirmUrl: viewOrderUrl,
          })
          break
        case 'ORDER_COMPLETED':
          emailSubject = `Tanda Bukti Transaksi Selesai & Garansi Aktif — #${payload.orderNumber}`
          emailHtml = orderCompletedEmailTemplate({
            customerName: payload.customerName,
            orderNumber: payload.orderNumber,
            storeName: payload.storeName,
            courierName: payload.courierName,
            courierService: payload.courierService,
            awbNumber: payload.awbNumber,
            trackingUrl: trackUrl,
            totalAmount: payload.totalAmount,
            subtotal: payload.subtotal,
            shippingCost: payload.shippingCost,
            insuranceFee: payload.insuranceFee,
            discountAmount: payload.discountAmount,
            items: payload.items,
            warrantyExpiryDate: payload.warrantyExpiryDate,
            viewOrderUrl,
          })
          break
        case 'ORDER_RETURNED':
          emailSubject = `Bukti Pengembalian Dana (Refund) — #${payload.orderNumber}`
          emailHtml = orderRefundedEmailTemplate({
            customerName: payload.customerName,
            orderNumber: payload.orderNumber,
            storeName: payload.storeName,
            courierName: payload.courierName,
            awbNumber: payload.awbNumber,
            returnCourier: payload.returnCourier,
            returnTrackingNumber: payload.returnTrackingNumber,
            trackingUrl: trackUrl,
            refundAmount: payload.refundAmount ?? payload.totalAmount,
            refundReason: payload.refundReason,
            refundBank: payload.refundBank,
            refundAccount: payload.refundAccount,
            refundAccountName: payload.refundAccountName,
            items: payload.items,
            viewOrderUrl,
          })
          break
        case 'ORDER_COMPLAINED':
          emailSubject = `Tiket Komplain & Klaim Garansi Diterima — #${payload.orderNumber}`
          emailHtml = orderComplainedEmailTemplate({
            customerName: payload.customerName,
            orderNumber: payload.orderNumber,
            storeName: payload.storeName,
            courierName: payload.courierName,
            awbNumber: payload.awbNumber,
            trackingUrl: trackUrl,
            complaintSubject: payload.complaintSubject,
            complaintDescription: payload.complaintDescription,
            complaintStatus: payload.complaintStatus,
            items: payload.items,
            viewOrderUrl,
          })
          break
        case 'ORDER_CANCELLED':
          emailSubject = `Pemberitahuan Pembatalan Pesanan — #${payload.orderNumber}`
          emailHtml = orderCancelledEmailTemplate({
            customerName: payload.customerName,
            orderNumber: payload.orderNumber,
            storeName: payload.storeName,
            courierName: payload.courierName,
            awbNumber: payload.awbNumber,
            cancellationReason: payload.cancellationReason,
            totalAmount: payload.totalAmount,
            viewOrderUrl,
          })
          break
      }

      if (emailSubject && emailHtml) {
        tasks.push(
          (async () => {
            const res = await sendEmail(
              payload.customerEmail!,
              emailSubject,
              emailHtml
            )
            await db.notificationLog.create({
              data: {
                userId: payload.userId || null,
                channel: NotificationChannel.EMAIL,
                provider: res.provider,
                recipient: payload.customerEmail!,
                subject: emailSubject,
                status: res.success
                  ? DeliveryStatus.SENT
                  : DeliveryStatus.FAILED,
                errorMessage: res.errorMessage || null,
                cost: 0,
              },
            })
          })()
        )
      }
    }

    // 3. In-App Notification (Database table notifications)
    if (payload.userId) {
      let notifType: NotificationType = NotificationType.ORDER_STATUS_CHANGED
      let title = `Status Pesanan #${payload.orderNumber}`
      let message = `Pembaruan status pada pesanan Anda.`

      if (payload.event === 'ORDER_CREATED') {
        notifType = NotificationType.ORDER_CREATED
        title = `Pesanan Dibuat #${payload.orderNumber}`
        message = `Pesanan berhasil dibuat. Segera selesaikan pembayaran sebesar ${totalFormatted}.`
      } else if (payload.event === 'PAYMENT_VERIFIED') {
        notifType = NotificationType.PAYMENT_VERIFIED
        title = `Pembayaran Terverifikasi #${payload.orderNumber}`
        message = `Pembayaran ${totalFormatted} telah berhasil diverifikasi.`
      } else if (payload.event === 'ORDER_SHIPPED') {
        notifType = NotificationType.ORDER_SHIPPED
        title = `Paket Dikirim #${payload.orderNumber}`
        message = `Paket pesanan Anda telah dikirim via ${payload.courierName || 'Kurir'}. No Resi: ${payload.awbNumber || '-'}`
      } else if (payload.event === 'ORDER_DELIVERED') {
        notifType = NotificationType.ORDER_DELIVERED
        title = `Paket Tiba #${payload.orderNumber}`
        message = `Paket telah sampai di tujuan. Silakan periksa unit dan konfirmasi pesanan.`
      } else if (payload.event === 'ORDER_COMPLETED') {
        notifType = NotificationType.ORDER_STATUS_CHANGED
        title = `Pesanan Selesai #${payload.orderNumber}`
        message = `Pesanan #${payload.orderNumber} telah selesai dikonfirmasi. Garansi 30 hari tukar unit baru Anda telah resmi aktif. No Resi: ${payload.awbNumber || '-'}`
      } else if (payload.event === 'ORDER_RETURNED') {
        notifType = NotificationType.ORDER_STATUS_CHANGED
        title = `Retur & Pengembalian Dana Disetujui #${payload.orderNumber}`
        message = `Pengembalian dana untuk pesanan #${payload.orderNumber} telah diproses oleh cabang toko.`
      } else if (payload.event === 'ORDER_COMPLAINED') {
        notifType = NotificationType.NEW_COMPLAINT
        title = `Komplain Diproses #${payload.orderNumber}`
        message = `Tiket komplain pesanan #${payload.orderNumber} sedang ditangani oleh tim teknisi toko.`
      } else if (payload.event === 'ORDER_CANCELLED') {
        notifType = NotificationType.ORDER_STATUS_CHANGED
        title = `Pesanan Dibatalkan #${payload.orderNumber}`
        message = `Pesanan #${payload.orderNumber} telah resmi dibatalkan.`
      }

      tasks.push(
        db.notification.create({
          data: {
            userId: payload.userId,
            type: notifType,
            title,
            message,
            link: viewOrderUrl,
          },
        })
      )
    }

    await Promise.allSettled(tasks)
  } catch (err) {
    console.error('[DISPATCH TRANSACTIONAL ERROR]:', err)
  }
}

/**
 * Dispatch Security Alert (WhatsApp + Email)
 */
export async function dispatchSecurityAlert(
  payload: SecurityAlertPayload
): Promise<void> {
  try {
    const tasks: Promise<unknown>[] = []
    const loginTime = payload.loginTime || new Date().toLocaleString('id-ID')

    if (payload.phone) {
      const waMsg = newDeviceAlertMessage(
        payload.name,
        payload.deviceLabel,
        payload.ipAddress,
        payload.location || 'Indonesia',
        payload.revokeUrl
      )
      tasks.push(
        (async () => {
          const res = await sendWhatsApp(payload.phone!, waMsg)
          await db.notificationLog.create({
            data: {
              userId: payload.userId,
              channel: NotificationChannel.WHATSAPP,
              provider: res.provider,
              recipient: payload.phone!,
              subject: 'Peringatan Login Perangkat Baru',
              status: res.success ? DeliveryStatus.SENT : DeliveryStatus.FAILED,
              errorMessage: res.errorMessage || null,
              cost: res.cost || 0,
            },
          })
        })()
      )
    }

    if (payload.email) {
      const emailHtml = newDeviceSecurityEmailTemplate({
        name: payload.name,
        deviceLabel: payload.deviceLabel,
        ipAddress: payload.ipAddress,
        location: payload.location,
        loginTime,
        revokeUrl: payload.revokeUrl,
      })
      tasks.push(
        (async () => {
          const res = await sendEmail(
            payload.email!,
            'Peringatan Keamanan: Login dari Perangkat Baru',
            emailHtml
          )
          await db.notificationLog.create({
            data: {
              userId: payload.userId,
              channel: NotificationChannel.EMAIL,
              provider: res.provider,
              recipient: payload.email!,
              subject: 'Peringatan Login Perangkat Baru',
              status: res.success ? DeliveryStatus.SENT : DeliveryStatus.FAILED,
              errorMessage: res.errorMessage || null,
              cost: 0,
            },
          })
        })()
      )
    }

    // In-app security alert
    tasks.push(
      db.notification.create({
        data: {
          userId: payload.userId,
          type: NotificationType.SECURITY_ALERT,
          title: 'Peringatan Login Perangkat Baru',
          message: `Login terdeteksi dari ${payload.deviceLabel} (${payload.ipAddress}).`,
          link: '/dashboard/customer/security',
        },
      })
    )

    await Promise.allSettled(tasks)
  } catch (err) {
    console.error('[DISPATCH SECURITY ALERT ERROR]:', err)
  }
}
