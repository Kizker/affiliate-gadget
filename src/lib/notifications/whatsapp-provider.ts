import { normalizePhone, isValidIndonesianPhone } from './phone-normalizer'
import { NotificationResult } from './types'

export async function sendWhatsApp(
  to: string,
  message: string
): Promise<NotificationResult> {
  const normalizedTo = normalizePhone(to)

  if (!isValidIndonesianPhone(normalizedTo)) {
    return {
      success: false,
      provider: 'ZENZIVA',
      errorMessage: `Nomor telepon tidak valid untuk Indonesia: ${to}`,
    }
  }

  const isMock =
    process.env.NOTIFICATION_MOCK_MODE === 'true' ||
    process.env.WA_MOCK_MODE === 'true'

  if (isMock) {
    console.log(`\n================== [MOCK WHATSAPP OTP] ==================`)
    console.log(`📱 Penerima : ${normalizedTo}`)
    console.log(`💬 Pesan    :\n${message}`)
    console.log(`=========================================================\n`)
    return {
      success: true,
      provider: 'MOCK_WA',
      messageId: `mock-wa-${Date.now()}`,
    }
  }

  const userkey = process.env.ZENZIVA_USERKEY
  const passkey = process.env.ZENZIVA_PASSKEY
  const apiUrl =
    process.env.ZENZIVA_WA_URL ||
    'https://console.zenziva.net/wareguler/api/sendWA/'

  if (!userkey || !passkey) {
    console.error(
      '[ZENZIVA WA] Kredensial belum dikonfigurasi (ZENZIVA_USERKEY / ZENZIVA_PASSKEY)'
    )
    return {
      success: false,
      provider: 'ZENZIVA',
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

    // Zenziva return: status "1" atau 1 = sukses
    if (
      response.ok &&
      data &&
      (data.status === '1' || data.status === 1 || data.status === true)
    ) {
      return {
        success: true,
        provider: 'ZENZIVA',
        messageId: data.messageId || data.id || `zenziva-wa-${Date.now()}`,
        cost: 0,
      }
    }

    const errorMsg =
      data?.text ||
      data?.message ||
      data?.error ||
      `HTTP error ${response.status}`
    console.error(`[ZENZIVA WA Error] ${normalizedTo}:`, errorMsg)
    return {
      success: false,
      provider: 'ZENZIVA',
      errorMessage: String(errorMsg),
    }
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : 'Koneksi ke gateway WA gagal'
    console.error(`[ZENZIVA WA Exception] ${normalizedTo}:`, errorMessage)
    return {
      success: false,
      provider: 'ZENZIVA',
      errorMessage,
    }
  }
}
