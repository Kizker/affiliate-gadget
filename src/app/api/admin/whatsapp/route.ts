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

    // Jika sesi berstatus created / stopped, panggil start
    if (
      activeSession.status === 'created' ||
      activeSession.status === 'stopped'
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
      } catch {}
    }

    // Ambil QR Code jika status qr_ready
    let qrCode = null
    if (activeSession.status === 'qr_ready') {
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

// POST - Tes Kirim WhatsApp Langsung dari Dashboard
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (
      session?.user?.role !== 'SUPER_ADMIN' &&
      session?.user?.role !== 'ADMIN'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { targetPhone, message } = await request.json()
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
