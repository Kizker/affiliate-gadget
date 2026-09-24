import 'server-only'
import nodemailer from 'nodemailer'
import prisma from '@/lib/db'

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
            product: {
              select: {
                id: true,
                name: true,
              },
            },
            service: {
              select: {
                id: true,
                name: true,
              },
            },
            rentalItem: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    if (!order || !order.user?.email) {
      return { success: false, error: 'Order or customer email not found' }
    }

    const customerEmail = order.user.email
    const customerName = order.user.name || 'Pelanggan Setia'
    const storeName = order.store?.companyName || order.store?.name || 'Affiliate Gadget Official Store'
    const formattedDate = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(order.completedAt || order.updatedAt || new Date())

    const itemsHtml = order.items
      .map((item) => {
        const title =
          item.product?.name ||
          item.service?.name ||
          item.rentalItem?.name ||
          'Gadget Smartphone'
        const variant = item.variantName ? ` (${item.variantName})` : ''
        const itemTotal = item.price * (item.quantity || 1)
        return `
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #1e293b;">
              <strong>${title}</strong>${variant}<br/>
              <span style="font-size: 11px; color: #64748b;">${item.quantity || 1} unit × ${formatRupiah(item.price)}</span>
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 13px; font-weight: 700; color: #0f172a;">
              ${formatRupiah(itemTotal)}
            </td>
          </tr>
        `
      })
      .join('')

    const orderUrl = `${appUrl}/dashboard/customer/orders/${order.id}`

    const htmlBody = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Tanda Bukti Transaksi Selesai — #${order.orderNumber}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    
    <div style="text-align: center; margin-bottom: 24px;">
      <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0;">
        Affiliate<span style="color: #f97316;">Gadget</span>
      </h2>
      <div style="display: inline-block; margin-top: 8px; background-color: #dcfce7; color: #15803d; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 9999px;">
        ✓ TRANSAKSI SELESAI & GARANSI AKTIF
      </div>
    </div>

    <div style="border-top: 1px solid #f1f5f9; padding-top: 20px;">
      <h1 style="font-size: 17px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0;">
        Halo, ${customerName}! 👋
      </h1>
      <p style="font-size: 13px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
        Terima kasih telah berbelanja di <strong>Affiliate Gadget</strong>. Pesanan Anda telah resmi selesai dan garansi 30 hari ganti unit baru Anda kini aktif.
      </p>

      <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 20px; font-size: 12px; border: 1px solid #e2e8f0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 3px 0; color: #64748b;">Nomor Pesanan:</td>
            <td style="padding: 3px 0; text-align: right; font-weight: 700; font-family: monospace;">#${order.orderNumber}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0; color: #64748b;">Tanggal Selesai:</td>
            <td style="padding: 3px 0; text-align: right; font-weight: 600;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0; color: #64748b;">Toko Cabang PT:</td>
            <td style="padding: 3px 0; text-align: right; font-weight: 600;">${storeName}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0; color: #64748b;">Kurir Pengiriman:</td>
            <td style="padding: 3px 0; text-align: right; font-weight: 600;">${(order as any).courier || (order.courierCode ? `${order.courierCode} ${order.courierService || ''}`.trim() : 'JNE Express')} (Resi: ${order.trackingNumber || 'Terverifikasi'})</td>
          </tr>
        </table>
      </div>

      <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 16px 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">
        Rincian Produk
      </h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="background-color: #f1f5f9; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 3px 0; color: #475569;">Subtotal:</td>
            <td style="padding: 3px 0; text-align: right; font-weight: 600;">${formatRupiah(order.subtotal)}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0; color: #475569;">Ongkir & Asuransi:</td>
            <td style="padding: 3px 0; text-align: right; font-weight: 600;">${formatRupiah((order.shippingCost || 0) + (order.insuranceFee || 0))}</td>
          </tr>
          ${
            order.discountAmount
              ? `<tr>
                  <td style="padding: 3px 0; color: #16a34a;">Potongan Diskon:</td>
                  <td style="padding: 3px 0; text-align: right; font-weight: 600; color: #16a34a;">-${formatRupiah(order.discountAmount)}</td>
                </tr>`
              : ''
          }
          <tr style="border-top: 1px solid #cbd5e1;">
            <td style="padding: 8px 0 0 0; font-weight: 800; font-size: 14px; color: #0f172a;">Total Pembayaran:</td>
            <td style="padding: 8px 0 0 0; text-align: right; font-weight: 800; font-size: 15px; color: #ea580c;">${formatRupiah(order.total)}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${orderUrl}" target="_blank" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-size: 13px; font-weight: 700; display: inline-block;">
          Lihat Rincian Pesanan →
        </a>
      </div>
    </div>

    <div style="border-top: 1px solid #f1f5f9; margin-top: 24px; padding-top: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
      © ${new Date().getFullYear()} Affiliate Gadget. Marketplace Multi-PT Terverifikasi se-Indonesia.
    </div>
  </div>
</body>
</html>
    `

    const transporter = await getTransporter()
    if (!transporter) {
      console.info('\n======================================================')
      console.info(`📧 [EMAIL NOTIFIKASI TRANSAKSI SELESAI] To: ${customerEmail}`)
      console.info(`🧾 Order #${order.orderNumber} - Total: ${formatRupiah(order.total)}`)
      console.info(`🔗 Tautan Detail Pesanan: ${orderUrl}`)
      console.info('======================================================\n')
      return { success: true }
    }

    const info = await transporter.sendMail({
      from: fromEmail,
      to: customerEmail,
      subject: `Tanda Bukti Transaksi Selesai — #${order.orderNumber} | Affiliate Gadget`,
      html: htmlBody,
    })

    if (process.env.NODE_ENV !== 'production') {
      const previewUrl = nodemailer.getTestMessageUrl(info)
      if (previewUrl) {
        console.info(`\n📧 [DEV] Completed Order Email Preview: ${previewUrl}\n`)
      }
    }

    return { success: true }
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
    const cancelReason = reason || 'Dibatalkan oleh pembeli atau batas waktu pembayaran habis'

    const htmlBody = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Pemberitahuan Pembatalan Pesanan — #${order.orderNumber}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    
    <div style="text-align: center; margin-bottom: 24px;">
      <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0;">
        Affiliate<span style="color: #f97316;">Gadget</span>
      </h2>
      <div style="display: inline-block; margin-top: 8px; background-color: #fee2e2; color: #b91c1c; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 9999px;">
        ✕ PESANAN DIBATALKAN
      </div>
    </div>

    <div style="border-top: 1px solid #f1f5f9; padding-top: 20px;">
      <h1 style="font-size: 17px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0;">
        Halo, ${customerName}!
      </h1>
      <p style="font-size: 13px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
        Pesanan Anda dengan nomor <strong>#${order.orderNumber}</strong> telah berhasil dibatalkan.
      </p>

      <div style="background-color: #fff1f2; border-radius: 12px; padding: 16px; margin-bottom: 20px; font-size: 12px; border: 1px solid #fecdd3;">
        <p style="margin: 0 0 6px 0; color: #9f1239; font-weight: 700;">Alasan Pembatalan:</p>
        <p style="margin: 0; color: #4c0519; font-style: italic;">"${cancelReason}"</p>
      </div>

      <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 24px; font-size: 12px; border: 1px solid #e2e8f0; line-height: 1.5; color: #64748b;">
        <strong style="color: #0f172a;">Catatan Pembayaran:</strong><br/>
        Tidak ada tagihan yang tertahan untuk pesanan ini. Jika pembayaran Anda sebelumnya sempat terpotong, pengembalian dana otomatis akan diproses ke rekening/dompet digital Anda.
      </div>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${appUrl}/gadget" target="_blank" style="background-color: #f97316; color: #ffffff; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-size: 13px; font-weight: 700; display: inline-block;">
          Jelajahi Gadget Lainnya →
        </a>
      </div>
    </div>

    <div style="border-top: 1px solid #f1f5f9; margin-top: 24px; padding-top: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
      © ${new Date().getFullYear()} Affiliate Gadget. Marketplace Multi-PT Terverifikasi se-Indonesia.
    </div>
  </div>
</body>
</html>
    `

    const transporter = await getTransporter()
    if (!transporter) {
      console.info('\n======================================================')
      console.info(`📧 [EMAIL NOTIFIKASI PESANAN DIBATALKAN] To: ${customerEmail}`)
      console.info(`✕ Order #${order.orderNumber} Dibatalkan: ${cancelReason}`)
      console.info('======================================================\n')
      return { success: true }
    }

    const info = await transporter.sendMail({
      from: fromEmail,
      to: customerEmail,
      subject: `Pemberitahuan Pembatalan Pesanan — #${order.orderNumber} | Affiliate Gadget`,
      html: htmlBody,
    })

    if (process.env.NODE_ENV !== 'production') {
      const previewUrl = nodemailer.getTestMessageUrl(info)
      if (previewUrl) {
        console.info(`\n📧 [DEV] Cancelled Order Email Preview: ${previewUrl}\n`)
      }
    }

    return { success: true }
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
export async function sendOrderRefundedEmail({
  orderId,
  refundAmount,
  reason,
}: {
  orderId: string
  refundAmount?: number
  reason?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        total: true,
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
    const amount = refundAmount ?? order.total
    const refundReason = reason || 'Klaim retur / garansi 30 hari telah disetujui toko'

    const htmlBody = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Bukti Pengembalian Dana (Refund) — #${order.orderNumber}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    
    <div style="text-align: center; margin-bottom: 24px;">
      <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0;">
        Affiliate<span style="color: #f97316;">Gadget</span>
      </h2>
      <div style="display: inline-block; margin-top: 8px; background-color: #dbeafe; color: #1d4ed8; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 9999px;">
        ↩ PENGEMBALIAN DANA BERHASIL (REFUND)
      </div>
    </div>

    <div style="border-top: 1px solid #f1f5f9; padding-top: 20px;">
      <h1 style="font-size: 17px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0;">
        Halo, ${customerName}! 👋
      </h1>
      <p style="font-size: 13px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
        Pengembalian dana untuk pesanan <strong>#${order.orderNumber}</strong> telah berhasil diproses oleh sistem keuangan Affiliate Gadget.
      </p>

      <div style="background-color: #eff6ff; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #bfdbfe; text-align: center;">
        <span style="font-size: 12px; color: #1e40af; font-weight: 600; text-transform: uppercase;">Total Dana yang Dikembalikan:</span>
        <h2 style="font-size: 26px; font-weight: 800; color: #1d4ed8; margin: 6px 0 0 0;">
          ${formatRupiah(amount)}
        </h2>
      </div>

      <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 24px; font-size: 12px; border: 1px solid #e2e8f0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Nomor Pesanan:</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 700; font-family: monospace;">#${order.orderNumber}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Keterangan / Alasan:</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 600;">${refundReason}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Status Transfer:</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 700; color: #16a34a;">Selesai (100% Refund)</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${appUrl}/dashboard/customer/orders" target="_blank" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-size: 13px; font-weight: 700; display: inline-block;">
          Lihat Riwayat Pesanan & Retur →
        </a>
      </div>
    </div>

    <div style="border-top: 1px solid #f1f5f9; margin-top: 24px; padding-top: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
      © ${new Date().getFullYear()} Affiliate Gadget. Marketplace Multi-PT Terverifikasi se-Indonesia.
    </div>
  </div>
</body>
</html>
    `

    const transporter = await getTransporter()
    if (!transporter) {
      console.info('\n======================================================')
      console.info(`📧 [EMAIL BUKTI REFUND BERHASIL] To: ${customerEmail}`)
      console.info(`↩ Order #${order.orderNumber} - Dana Kembali: ${formatRupiah(amount)}`)
      console.info('======================================================\n')
      return { success: true }
    }

    const info = await transporter.sendMail({
      from: fromEmail,
      to: customerEmail,
      subject: `Bukti Pengembalian Dana (Refund) — #${order.orderNumber} | Affiliate Gadget`,
      html: htmlBody,
    })

    if (process.env.NODE_ENV !== 'production') {
      const previewUrl = nodemailer.getTestMessageUrl(info)
      if (previewUrl) {
        console.info(`\n📧 [DEV] Refund Email Preview: ${previewUrl}\n`)
      }
    }

    return { success: true }
  } catch (err) {
    console.error('[Refund Email Error]:', err)
    return { success: false, error: (err as Error).message }
  }
}

