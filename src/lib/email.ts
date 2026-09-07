import 'server-only'
import nodemailer from 'nodemailer'

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
