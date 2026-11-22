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

  // 1. Primary: OpenWA Self-Hosted WhatsApp API Gateway (Free & Unlimited)
  const openwaUrl = process.env.OPENWA_URL || 'http://openwa:2785'
  const openwaApiKey =
    process.env.OPENWA_API_KEY ||
    'owa_k1_3f49466bccc0dc23cb7d1851bbb9fce5137ecf31e8a716281ab4170c8814f6ab'
  const openwaSessionId =
    process.env.OPENWA_SESSION_ID || '3c68a0be-cc2c-4ff0-86c3-ee1e17141693'

  if (openwaApiKey) {
    try {
      const chatId = `${normalizedTo}@c.us`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 12000)

      // Cari sesi yang aktif jika sessionId belum pasti
      let targetSessionId = openwaSessionId
      try {
        const sessionsRes = await fetch(`${openwaUrl}/api/sessions`, {
          headers: { 'X-API-Key': openwaApiKey },
          signal: controller.signal,
        })
        if (sessionsRes.ok) {
          const sessions = await sessionsRes.json()
          if (Array.isArray(sessions) && sessions.length > 0) {
            const connectedSession =
              sessions.find((s: any) => s.status === 'connected') || sessions[0]
            if (connectedSession?.id) {
              targetSessionId = connectedSession.id
            }
          }
        }
      } catch {}

      const openwaRes = await fetch(
        `${openwaUrl}/api/sessions/${targetSessionId}/messages/send-text`,
        {
          method: 'POST',
          headers: {
            'X-API-Key': openwaApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatId,
            text: message,
          }),
          signal: controller.signal,
        }
      )
      clearTimeout(timeoutId)

      const openwaData = await openwaRes.json().catch(() => null)
      if (
        openwaRes.ok &&
        !openwaData?.error &&
        (openwaData?.id || openwaData?.messageId || !openwaData?.statusCode)
      ) {
        return {
          success: true,
          provider: 'OPENWA',
          messageId:
            openwaData?.id || openwaData?.messageId || `openwa-${Date.now()}`,
          cost: 0,
        }
      }
      console.warn('[OPENWA Response]:', openwaData)
    } catch (openwaErr) {
      console.error('[OPENWA Error]:', openwaErr)
    }
  }

  // 2. Secondary: Fonnte WhatsApp Gateway API
  const fonnteToken = process.env.FONNTE_TOKEN
  if (fonnteToken) {
    try {
      const fonnteRes = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          Authorization: fonnteToken,
        },
        body: new URLSearchParams({
          target: normalizedTo,
          message: message,
          countryCode: '62',
        }),
      })
      const fonnteData = await fonnteRes.json().catch(() => null)
      if (
        fonnteRes.ok &&
        (fonnteData?.status === true ||
          fonnteData?.status === 'true' ||
          fonnteData?.status === 1)
      ) {
        return {
          success: true,
          provider: 'FONNTE',
          messageId: fonnteData.id?.[0] || `fonnte-${Date.now()}`,
          cost: 0,
        }
      }
      console.warn('[FONNTE WA Response]:', fonnteData)
    } catch (fonnteErr) {
      console.error('[FONNTE WA Error]:', fonnteErr)
    }
  }

  // 2. Support Wablas WhatsApp Gateway API
  const wablasToken = process.env.WABLAS_TOKEN
  const wablasServer = process.env.WABLAS_SERVER || 'https://pati.wablas.com'
  if (wablasToken) {
    try {
      const wablasRes = await fetch(`${wablasServer}/api/send-message`, {
        method: 'POST',
        headers: {
          Authorization: wablasToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: normalizedTo,
          message: message,
        }),
      })
      const wablasData = await wablasRes.json().catch(() => null)
      if (
        wablasRes.ok &&
        (wablasData?.status === true || wablasData?.status === 'success')
      ) {
        return {
          success: true,
          provider: 'WABLAS',
          messageId:
            wablasData.data?.messages?.[0]?.id || `wablas-${Date.now()}`,
          cost: 0,
        }
      }
      console.warn('[WABLAS WA Response]:', wablasData)
    } catch (wablasErr) {
      console.error('[WABLAS WA Error]:', wablasErr)
    }
  }

  // 3. Support Zenziva WhatsApp Gateway API
  const userkey = process.env.ZENZIVA_USERKEY
  const passkey = process.env.ZENZIVA_PASSKEY
  const apiUrl =
    process.env.ZENZIVA_WA_URL ||
    'https://console.zenziva.net/wareguler/api/sendWA/'

  if (!userkey || !passkey) {
    console.error(
      '[WA GATEWAY] Kredensial gateway belum dikonfigurasi (FONNTE_TOKEN / ZENZIVA_USERKEY)'
    )
    return {
      success: false,
      provider: 'ZENZIVA',
      errorMessage: 'Kredensial WhatsApp gateway belum dikonfigurasi',
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
