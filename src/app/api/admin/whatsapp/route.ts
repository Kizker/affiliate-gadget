import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

const OPENWA_URL = process.env.OPENWA_URL || 'http://openwa:2785'
const OPENWA_API_KEY =
  process.env.OPENWA_API_KEY ||
  'owa_k1_3f49466bccc0dc23cb7d1851bbb9fce5137ecf31e8a716281ab4170c8814f6ab'
const OPENWA_SESSION_ID =
  process.env.OPENWA_SESSION_ID || '3c68a0be-cc2c-4ff0-86c3-ee1e17141693'

export async function GET() {
  try {
    const session = await auth()
    if (
      session?.user?.role !== 'SUPER_ADMIN' &&
      session?.user?.role !== 'ADMIN'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Ambil daftar sesi dari OpenWA
    let sessions: any[] = []
    try {
      const res = await fetch(`${OPENWA_URL}/api/sessions`, {
        headers: { 'X-API-Key': OPENWA_API_KEY },
        cache: 'no-store',
      })
      if (res.ok) {
        sessions = await res.json()
      }
    } catch (err) {
      console.error('[OpenWA Connect Error]:', err)
      return NextResponse.json({
        success: false,
        error: 'Tidak dapat terhubung ke service OpenWA gateway di port 2785',
        status: 'offline',
      })
    }

    let activeSession =
      sessions.find((s) => s.id === OPENWA_SESSION_ID) || sessions[0]

    // Jika belum ada sesi sama sekali, buatkan otomatis
    if (!activeSession) {
      try {
        const createRes = await fetch(`${OPENWA_URL}/api/sessions`, {
          method: 'POST',
          headers: {
            'X-API-Key': OPENWA_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: 'affiliate-gadget' }),
        })
        if (createRes.ok) {
          activeSession = await createRes.json()
        }
      } catch {}
    }

    if (!activeSession) {
      return NextResponse.json({
        success: false,
        error: 'Sesi OpenWA belum dapat dibuat',
        status: 'error',
      })
    }

    // Jika sesi belum terhubung dan belum siap scan QR (misal disconnected, stopped, created, dll.), otomatis nyalakan sesi
    if (
      activeSession.status !== 'connected' &&
      activeSession.status !== 'qr_ready'
    ) {
      try {
        const startRes = await fetch(
          `${OPENWA_URL}/api/sessions/${activeSession.id}/start`,
          {
            method: 'POST',
            headers: { 'X-API-Key': OPENWA_API_KEY },
          }
        )
        if (startRes.ok) {
          activeSession = await startRes.json()
        }
      } catch (startErr) {
        console.warn('[OpenWA Start Error]:', startErr)
      }
    }

    // Ambil QR Code jika status qr_ready atau jika baru saja di-start
    let qrCode = null
    if (activeSession.status !== 'connected') {
      try {
        const qrRes = await fetch(
          `${OPENWA_URL}/api/sessions/${activeSession.id}/qr`,
          {
            headers: { 'X-API-Key': OPENWA_API_KEY },
            cache: 'no-store',
          }
        )
        if (qrRes.ok) {
          const qrData = await qrRes.json()
          qrCode = qrData.qrCode || null
          if (qrCode) {
            activeSession.status = 'qr_ready'
          }
        }
      } catch {}
    }

    return NextResponse.json({
      success: true,
      gateway: 'OPENWA',
      status: activeSession.status, // 'connected' | 'qr_ready' | 'starting'
      phone: activeSession.phone || null,
      pushName: activeSession.pushName || null,
      sessionId: activeSession.id,
      qrCode,
    })
  } catch (error: any) {
    console.error('Error WhatsApp status:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Tes Kirim WhatsApp atau Restart Sesi QR Code
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (
      session?.user?.role !== 'SUPER_ADMIN' &&
      session?.user?.role !== 'ADMIN'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Aksi 1: Restart sesi untuk mendapatkan QR Code baru
    if (body.action === 'restart') {
      try {
        await fetch(`${OPENWA_URL}/api/sessions/${OPENWA_SESSION_ID}/stop`, {
          method: 'POST',
          headers: { 'X-API-Key': OPENWA_API_KEY },
        }).catch(() => {})

        const startRes = await fetch(
          `${OPENWA_URL}/api/sessions/${OPENWA_SESSION_ID}/start`,
          {
            method: 'POST',
            headers: { 'X-API-Key': OPENWA_API_KEY },
          }
        )
        const startData = await startRes.json().catch(() => null)
        return NextResponse.json({
          success: true,
          message: 'Sesi WhatsApp berhasil dimuat ulang',
          data: startData,
        })
      } catch (err: any) {
        return NextResponse.json(
          { error: err?.message || 'Gagal restart sesi OpenWA' },
          { status: 500 }
        )
      }
    }

    // Aksi 2: Tes Kirim WhatsApp
    const { targetPhone, message } = body
    if (!targetPhone || !message) {
      return NextResponse.json(
        { error: 'Nomor telepon tujuan dan pesan wajib diisi' },
        { status: 400 }
      )
    }

    const { sendWhatsApp } =
      await import('@/lib/notifications/whatsapp-provider')
    const result = await sendWhatsApp(targetPhone, message)

    return NextResponse.json({
      success: result.success,
      provider: result.provider,
      messageId: result.messageId,
      error: result.errorMessage || null,
    })
  } catch (error: any) {
    console.error('Error send test WhatsApp:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
