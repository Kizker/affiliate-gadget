import 'server-only'
import nodemailer from 'nodemailer'
import prisma from '@/lib/db'
import { sendEmail } from '@/lib/notifications/email-provider'
import {
  orderCompletedEmailTemplate,
  orderRefundedEmailTemplate,
  orderCancelledEmailTemplate,
  orderComplainedEmailTemplate,
} from '@/lib/notifications/templates/email-templates'

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'
const fromEmail =
  process.env.RESEND_FROM_EMAIL ||
  'Affiliate Gadget <noreply@affiliategadget.id>'

/**
 * Creates a nodemailer transporter.
 * - If SMTP_HOST is configured → uses real SMTP.
 * - Otherwise → uses Ethereal (ephemeral test account) in dev,
 *   or falls back to console logging.
 */
async function getTransporter() {
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10)
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS

  if (smtpHost && smtpUser && smtpPass) {
    return nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })
  }

  // Development fallback: Ethereal test account (emails viewable at ethereal.email)
  if (process.env.NODE_ENV !== 'production') {
    try {
      const testAccount = await nodemailer.createTestAccount()
      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      })
      return transporter
    } catch {
      // Ethereal unavailable — return null for console fallback
      return null
    }
  }

  return null
}

export interface SendVerificationEmailParams {
  to: string
  name: string
  token: string
}

/**
 * Sends an email verification link to the registered user.
 * In development without SMTP config, logs the verification link to the console.
 */
export async function sendVerificationEmail({
  to,
  name,
  token,
}: SendVerificationEmailParams): Promise<{ success: boolean; error?: string }> {
  const verificationUrl = `${appUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`

  const htmlBody = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifikasi Akun Affiliate Gadget</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; padding: 36px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">

    <div style="margin-bottom: 24px; text-align: center;">
      <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0;">
        Affiliate<span style="color: #f97316;">Gadget</span>
      </h2>
      <p style="font-size: 12px; color: #64748b; margin-top: 4px;">Marketplace Gadget Terverifikasi se-Indonesia</p>
    </div>

    <div style="border-top: 1px solid #f1f5f9; padding-top: 24px;">
      <h1 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">
        Halo, ${name || 'Pelanggan'}! 👋
      </h1>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
        Terima kasih telah mendaftar di <strong>Affiliate Gadget</strong>. Untuk mengaktifkan akun Anda dan mulai bertransaksi dengan aman, silakan konfirmasi email Anda dengan mengklik tombol di bawah ini:
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${verificationUrl}" target="_blank" style="background-color: #f97316; color: #ffffff; padding: 14px 28px; border-radius: 9999px; text-decoration: none; font-size: 14px; font-weight: 700; display: inline-block; box-shadow: 0 4px 10px rgba(249, 115, 22, 0.3);">
          Verifikasi Email Sekarang →
        </a>
      </div>

      <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0 0 16px 0;">
        Tautan ini hanya berlaku selama <strong>24 jam</strong>. Jika tombol di atas tidak berfungsi, salin dan tempel tautan berikut ke browser Anda:
      </p>
      <p style="font-size: 11px; word-break: break-all; color: #2563eb; background-color: #eff6ff; padding: 10px; border-radius: 8px; margin: 0 0 24px 0;">
        ${verificationUrl}
      </p>

      <p style="font-size: 12px; color: #94a3b8; margin: 0;">
        Jika Anda tidak merasa mendaftar di Affiliate Gadget, abaikan email ini. Akun Anda tidak akan aktif tanpa verifikasi.
      </p>
    </div>

    <div style="border-top: 1px solid #f1f5f9; margin-top: 32px; padding-top: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
      © ${new Date().getFullYear()} Affiliate Gadget. Seluruh Hak Cipta Dilindungi.
    </div>

  </div>
</body>
</html>
  `

  try {
    const transporter = await getTransporter()

    if (!transporter) {
      // No SMTP configured and Ethereal unavailable — log to console (dev only)
      console.info('\n======================================================')
      console.info(`📧 [DEV EMAIL SIMULATION] To: ${to} (${name})`)
      console.info(`🔗 Verification Link (Valid 24h): ${verificationUrl}`)
      console.info('======================================================\n')
      return { success: true }
    }

    const info = await transporter.sendMail({
      from: fromEmail,
      to,
      subject: 'Verifikasi Akun Anda — Affiliate Gadget',
      html: htmlBody,
    })

    // In dev with Ethereal, log the preview URL
    if (process.env.NODE_ENV !== 'production') {
      const previewUrl = nodemailer.getTestMessageUrl(info)
      if (previewUrl) {
        console.info(`\n📧 [DEV] Email Preview URL: ${previewUrl}\n`)
      }
    }

    return { success: true }
  } catch (err) {
    console.error('[Email Error]:', err)
    return { success: false, error: (err as Error).message }
  }
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. TRANSAKSI SELESAI (Order Completed & Official Receipt)
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function sendOrderCompletedEmail({
  orderId,
}: {
  orderId: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        subtotal: true,
        shippingCost: true,
        insuranceFee: true,
        discountAmount: true,
        total: true,
        courierCode: true,
        courierService: true,
        trackingNumber: true,
        warrantyExpiryDate: true,
        completedAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            companyName: true,
          },
        },
        items: {
          select: {
            id: true,
            price: true,
            quantity: true,
            variantName: true,
            type: true,
            product: { select: { id: true, name: true } },
            service: { select: { id: true, name: true } },
            rentalItem: { select: { id: true, name: true } },
          },
        },
      },
    })

    if (!order || !order.user?.email) {
      return { success: false, error: 'Order or customer email not found' }
    }

    const customerEmail = order.user.email
    const customerName = order.user.name || 'Pelanggan Setia'
    const storeName =
      order.store?.companyName ||
      order.store?.name ||
      'Affiliate Gadget Official Store'
    const courierName = order.courierCode || 'Kurir Logistik'
    const courierService = order.courierService || undefined
    const awbNumber = order.trackingNumber || undefined
    const trackingUrl = awbNumber
      ? `https://berdu.id/cek-resi?resi=${encodeURIComponent(awbNumber)}`
      : undefined

    const warrantyExpiryDate = order.warrantyExpiryDate
      ? new Intl.DateTimeFormat('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(order.warrantyExpiryDate)
      : undefined

    const items = order.items.map((item) => ({
      name:
        item.product?.name ||
        item.service?.name ||
        item.rentalItem?.name ||
        'Gadget Smartphone',
      variant: item.variantName || undefined,
      quantity: item.quantity || 1,
      price: item.price,
    }))

    const viewOrderUrl = `${appUrl}/dashboard/customer/orders/${order.id}`

    const htmlBody = orderCompletedEmailTemplate({
      customerName,
      orderNumber: order.orderNumber,
      storeName,
      courierName,
      courierService,
      awbNumber,
      trackingUrl,
      totalAmount: order.total,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      insuranceFee: order.insuranceFee,
      discountAmount: order.discountAmount,
      items,
      warrantyExpiryDate,
      viewOrderUrl,
    })

    const subject = `Tanda Bukti Transaksi Selesai & Garansi Aktif — #${order.orderNumber} | Affiliate Gadget`

    // Kirim via provider Resend / Dev Mock
    const sendResult = await sendEmail(customerEmail, subject, htmlBody)

    // Optional nodemailer SMTP fallback if configured
    const transporter = await getTransporter()
    if (transporter) {
      await transporter
        .sendMail({
          from: fromEmail,
          to: customerEmail,
          subject,
          html: htmlBody,
        })
        .catch(() => {})
    }

    return { success: sendResult.success, error: sendResult.errorMessage }
  } catch (err) {
    console.error('[Completed Email Error]:', err)
    return { success: false, error: (err as Error).message }
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 2. TRANSAKSI DIBATALKAN (Order Cancelled Confirmation)
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function sendOrderCancelledEmail({
  orderId,
  reason,
}: {
  orderId: string
  reason?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        courierCode: true,
        trackingNumber: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            companyName: true,
          },
        },
      },
    })

    if (!order || !order.user?.email) {
      return { success: false, error: 'Order or customer email not found' }
    }

    const customerEmail = order.user.email
    const customerName = order.user.name || 'Pelanggan'
    const cancellationReason =
      reason || 'Dibatalkan oleh pembeli atau batas waktu pembayaran habis'

    const htmlBody = orderCancelledEmailTemplate({
      customerName,
      orderNumber: order.orderNumber,
      storeName: order.store?.companyName || order.store?.name,
      courierName: order.courierCode || undefined,
      awbNumber: order.trackingNumber || undefined,
      cancellationReason,
      totalAmount: order.total,
      viewOrderUrl: `${appUrl}/gadget`,
    })

    const subject = `Pemberitahuan Pembatalan Pesanan — #${order.orderNumber} | Affiliate Gadget`

    const sendResult = await sendEmail(customerEmail, subject, htmlBody)

    const transporter = await getTransporter()
    if (transporter) {
      await transporter
        .sendMail({
          from: fromEmail,
          to: customerEmail,
          subject,
          html: htmlBody,
        })
        .catch(() => {})
    }

    return { success: sendResult.success, error: sendResult.errorMessage }
  } catch (err) {
    console.error('[Cancelled Email Error]:', err)
    return { success: false, error: (err as Error).message }
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 3. PENGEMBALIAN DANA / REFUND (Order Refund Confirmation)
 * ─────────────────────────────────────────────────────────────────────────────
 */
export interface SendOrderRefundedParams {
  orderId: string
  refundAmount?: number
  reason?: string
  returnCourier?: string
  returnTrackingNumber?: string
  bankName?: string
  bankAccountNumber?: string
  bankAccountHolder?: string
}

export async function sendOrderRefundedEmail({
  orderId,
  refundAmount,
  reason,
  returnCourier,
  returnTrackingNumber,
  bankName,
  bankAccountNumber,
  bankAccountHolder,
}: SendOrderRefundedParams): Promise<{ success: boolean; error?: string }> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        courierCode: true,
        trackingNumber: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            companyName: true,
          },
        },
        items: {
          select: {
            id: true,
            price: true,
            quantity: true,
            variantName: true,
            product: { select: { name: true } },
            service: { select: { name: true } },
            rentalItem: { select: { name: true } },
          },
        },
      },
    })

    if (!order || !order.user?.email) {
      return { success: false, error: 'Order or customer email not found' }
    }

    // Ambil data pengajuan retur terkait jika ada
    const returnReq = await prisma.returnRequest.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    })

    const customerEmail = order.user.email
    const customerName = order.user.name || 'Pelanggan'
    const storeName =
      order.store?.companyName ||
      order.store?.name ||
      'Affiliate Gadget Official Store'
    const courierName = order.courierCode || 'Kurir Logistik'
    const awbNumber = order.trackingNumber || undefined
    const retCourier = returnCourier || returnReq?.returnCourier || undefined
    const retAwb =
      returnTrackingNumber || returnReq?.returnTrackingNumber || undefined
    const finalRefundAmount =
      refundAmount ?? returnReq?.refundAmount ?? order.total
    const refundReason =
      reason ||
      returnReq?.reason ||
      'Klaim Retur & Pengembalian Dana Garansi 30 Hari'
    const refundBank = bankName || returnReq?.bankName || undefined
    const refundAccount =
      bankAccountNumber || returnReq?.bankAccountNumber || undefined
    const refundAccountName =
      bankAccountHolder ||
      returnReq?.bankAccountName ||
      customerName ||
      undefined

    const items = order.items.map((item) => ({
      name:
        item.product?.name ||
        item.service?.name ||
        item.rentalItem?.name ||
        'Gadget Smartphone',
      variant: item.variantName || undefined,
      quantity: item.quantity || 1,
      price: item.price,
    }))

    const viewOrderUrl = `${appUrl}/dashboard/customer/orders/${order.id}`

    const htmlBody = orderRefundedEmailTemplate({
      customerName,
      orderNumber: order.orderNumber,
      storeName,
      courierName,
      awbNumber,
      returnCourier: retCourier,
      returnTrackingNumber: retAwb,
      trackingUrl: retAwb
        ? `https://berdu.id/cek-resi?resi=${encodeURIComponent(retAwb)}`
        : undefined,
      refundAmount: finalRefundAmount,
      refundReason,
      refundBank,
      refundAccount,
      refundAccountName,
      items,
      viewOrderUrl,
    })

    const subject = `Bukti Pengembalian Dana (Refund) — #${order.orderNumber} | Affiliate Gadget`

    const sendResult = await sendEmail(customerEmail, subject, htmlBody)

    const transporter = await getTransporter()
    if (transporter) {
      await transporter
        .sendMail({
          from: fromEmail,
          to: customerEmail,
          subject,
          html: htmlBody,
        })
        .catch(() => {})
    }

    return { success: sendResult.success, error: sendResult.errorMessage }
  } catch (err) {
    console.error('[Refund Email Error]:', err)
    return { success: false, error: (err as Error).message }
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 4. TIKET KOMPLAIN / KLAIM GARANSI (Order Complained Notification)
 * ─────────────────────────────────────────────────────────────────────────────
 */
export interface SendOrderComplainedParams {
  orderId: string
  complaintId?: string
  subject?: string
  description?: string
  status?: string
}

export async function sendOrderComplainedEmail({
  orderId,
  complaintId,
  subject,
  description,
  status,
}: SendOrderComplainedParams): Promise<{ success: boolean; error?: string }> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        courierCode: true,
        trackingNumber: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            companyName: true,
          },
        },
        items: {
          select: {
            id: true,
            price: true,
            quantity: true,
            variantName: true,
            product: { select: { name: true } },
            service: { select: { name: true } },
            rentalItem: { select: { name: true } },
          },
        },
      },
    })

    if (!order || !order.user?.email) {
      return { success: false, error: 'Order or customer email not found' }
    }

    const complaint = complaintId
      ? await prisma.complaint.findUnique({ where: { id: complaintId } })
      : await prisma.complaint.findFirst({
          where: { orderId },
          orderBy: { createdAt: 'desc' },
        })

    const customerEmail = order.user.email
    const customerName = order.user.name || 'Pelanggan'
    const storeName =
      order.store?.companyName ||
      order.store?.name ||
      'Affiliate Gadget Official Store'
    const courierName = order.courierCode || 'Kurir Logistik'
    const awbNumber = order.trackingNumber || undefined
    const trackingUrl = awbNumber
      ? `https://berdu.id/cek-resi?resi=${encodeURIComponent(awbNumber)}`
      : undefined

    const complaintSubject =
      subject || complaint?.subject || 'Kendala Produk / Layanan'
    const complaintDescription =
      description || complaint?.description || 'Menunggu verifikasi teknisi'
    const complaintStatus = status || complaint?.status || 'OPEN'

    const items = order.items.map((item) => ({
      name:
        item.product?.name ||
        item.service?.name ||
        item.rentalItem?.name ||
        'Gadget Smartphone',
      variant: item.variantName || undefined,
      quantity: item.quantity || 1,
      price: item.price,
    }))

    const viewOrderUrl = `${appUrl}/dashboard/customer/orders/${order.id}`

    const htmlBody = orderComplainedEmailTemplate({
      customerName,
      orderNumber: order.orderNumber,
      storeName,
      courierName,
      awbNumber,
      trackingUrl,
      complaintSubject,
      complaintDescription,
      complaintStatus,
      items,
      viewOrderUrl,
    })

    const emailSubject = `Tiket Komplain & Klaim Garansi Diterima — #${order.orderNumber} | Affiliate Gadget`

    const sendResult = await sendEmail(customerEmail, emailSubject, htmlBody)

    const transporter = await getTransporter()
    if (transporter) {
      await transporter
        .sendMail({
          from: fromEmail,
          to: customerEmail,
          subject: emailSubject,
          html: htmlBody,
        })
        .catch(() => {})
    }

    return { success: sendResult.success, error: sendResult.errorMessage }
  } catch (err) {
    console.error('[Complained Email Error]:', err)
    return { success: false, error: (err as Error).message }
  }
}

