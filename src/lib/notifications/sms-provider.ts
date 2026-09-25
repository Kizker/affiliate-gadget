import { normalizePhone, isValidIndonesianPhone } from './phone-normalizer'
import { NotificationResult } from './types'

export async function sendSms(
  to: string,
  message: string
): Promise<NotificationResult> {
  const normalizedTo = normalizePhone(to)

  if (!isValidIndonesianPhone(normalizedTo)) {
    return {
      success: false,
      provider: 'ZENZIVA_SMS',
      errorMessage: `Nomor telepon tidak valid untuk Indonesia: ${to}`,
    }
  }

  const isMock =
    process.env.NOTIFICATION_MOCK_MODE === 'true' ||
    process.env.SMS_MOCK_MODE === 'true'

  if (isMock) {
    console.log(`\n================== [MOCK SMS OTP] ==================`)
    console.log(`📱 Penerima : ${normalizedTo}`)
    console.log(`💬 Pesan    :\n${message}`)
    console.log(`====================================================\n`)
    return {
      success: true,
      provider: 'MOCK_SMS',
      messageId: `mock-sms-${Date.now()}`,
      cost: 350,
    }
  }

  const userkey = process.env.ZENZIVA_USERKEY
  const passkey = process.env.ZENZIVA_PASSKEY
  const apiUrl =
    process.env.ZENZIVA_SMS_URL ||
    'https://console.zenziva.net/reguler/api/sendsms/'

  if (!userkey || !passkey) {
    console.error(
      '[ZENZIVA SMS] Kredensial belum dikonfigurasi (ZENZIVA_USERKEY / ZENZIVA_PASSKEY)'
    )
    return {
      success: false,
      provider: 'ZENZIVA_SMS',
      errorMessage: 'Kredensial Zenziva belum dikonfigurasi',
    }
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userkey,
        passkey,
        to: normalizedTo,
        message,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const data = await response.json().catch(() => null)

    if (
      response.ok &&
      data &&
      (data.status === '1' || data.status === 1 || data.status === true)
    ) {
      return {
        success: true,
        provider: 'ZENZIVA_SMS',
        messageId: data.messageId || data.id || `zenziva-sms-${Date.now()}`,
        cost: 350, // Estimasi biaya per SMS reguler Indonesia
      }
    }

    const errorMsg =
      data?.text ||
      data?.message ||
      data?.error ||
      `HTTP error ${response.status}`
    console.error(`[ZENZIVA SMS Error] ${normalizedTo}:`, errorMsg)
    return {
      success: false,
      provider: 'ZENZIVA_SMS',
      errorMessage: String(errorMsg),
    }
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : 'Koneksi ke gateway SMS gagal'
    console.error(`[ZENZIVA SMS Exception] ${normalizedTo}:`, errorMessage)
    return {
      success: false,
      provider: 'ZENZIVA_SMS',
      errorMessage,
    }
  }
}
