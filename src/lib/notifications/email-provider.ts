import { Resend } from 'resend'
import { NotificationResult } from './types'

let resendClient: Resend | null = null

function getResendClient(): Resend | null {
  if (!resendClient && process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<NotificationResult> {
  const isMock = process.env.NOTIFICATION_MOCK_MODE === 'true'

  if (isMock) {
    console.log(`[MOCK EMAIL] Kirim ke: ${to} | Subjek: "${subject}"`)
    return {
      success: true,
      provider: 'MOCK_EMAIL',
      messageId: `mock-email-${Date.now()}`,
    }
  }

  const resend = getResendClient()
  if (!resend) {
    if (process.env.NODE_ENV !== 'production' || isMock) {
      console.log(`[MOCK/DEV EMAIL - RESEND_API_KEY BELUM DIISI] Kirim ke: ${to} | Subjek: "${subject}"`)
      return {
        success: true,
        provider: 'MOCK_EMAIL',
        messageId: `mock-email-${Date.now()}`,
      }
    }
    console.error('[RESEND] API Key belum dikonfigurasi (RESEND_API_KEY)')
    return {
      success: false,
      provider: 'RESEND',
      errorMessage: 'Kredensial Resend belum dikonfigurasi di .env (RESEND_API_KEY)',
    }
  }

  const fromName = process.env.RESEND_FROM_NAME || 'Affiliate Gadget'
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
  const from = `${fromName} <${fromEmail}>`

  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>?/gm, '').trim(),
    })

    if (error) {
      console.error(`[RESEND Error] Kirim ke ${to}:`, error.message)
      return {
        success: false,
        provider: 'RESEND',
        errorMessage: error.message,
      }
    }

    return {
      success: true,
      provider: 'RESEND',
      messageId: data?.id || `resend-${Date.now()}`,
      cost: 0,
    }
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : 'Gagal mengirim email via Resend'
    console.error(`[RESEND Exception] Kirim ke ${to}:`, errorMessage)
    return {
      success: false,
      provider: 'RESEND',
      errorMessage,
    }
  }
}
