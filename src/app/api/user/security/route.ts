import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/db'
import { parseUserAgent } from '@/lib/user-agent-parser'
import { extractClientIp } from '@/lib/login-security'
import { is2FaEnabled, set2FaEnabled } from '@/lib/two-factor-store'
import { generateDeviceToken } from '@/lib/device-fingerprint'

interface StoredOtp {
  code: string
  phone: string
  expiresAt: number
  attempts: number
}

// In-memory security state stores
const otpStore = new Map<string, StoredOtp>()

// Helper to format timestamp in Indonesian WIB (e.g., "19.39 WIB" or "24 Nov 2026, 19.39 WIB")
function formatDeviceLoginTime(dateInput: Date | string): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (isNaN(d.getTime())) return 'Baru saja'

  const now = new Date()
  const formatterTime = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  })
  const timeStr = formatterTime.format(d).replace(':', '.')

  const formatterDate = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  })
  const dateStr = formatterDate.format(d)
  const todayStr = formatterDate.format(now)

  if (dateStr === todayStr) {
    return `Hari ini, ${timeStr} WIB`
  }

  return `${dateStr}, ${timeStr} WIB`
}

// Helper to normalize phone number to standard international/ID format
function normalizePhoneNumber(rawPhone: string): string {
  let cleaned = rawPhone.replace(/[^0-9]/g, '')
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1)
  }
  return cleaned
}

// ─────────────────────────────────────────────────────────────────────────────
// GET - Retrieve Security, 2FA status, and Active Sessions
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    const userEmail = session?.user?.email

    if (!userId && !userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findFirst({
      where: userId ? { id: userId } : { email: userEmail! },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const twoFactorEnabled =
      is2FaEnabled(user.id) || (user.email ? is2FaEnabled(user.email) : false)

    // Parse current client device from request headers
    const userAgentString = req.headers.get('user-agent') || 'Unknown Device'
    const parsedDevice = parseUserAgent(userAgentString)
    const clientIp = extractClientIp(req)
    const currentLocation =
      clientIp === '127.0.0.1' || clientIp === '::1'
        ? 'Jakarta, Indonesia'
        : 'Indonesia'

    const currentDeviceToken = generateDeviceToken(
      userAgentString,
      clientIp,
      user.id
    )
    const now = new Date()

    // Ensure current device is registered & updated in UserDevice table so both devices see each other!
    try {
      const existingCurrentDevice = await prisma.userDevice.findFirst({
        where: {
          userId: user.id,
          deviceToken: currentDeviceToken,
        },
      })

      if (existingCurrentDevice) {
        await prisma.userDevice.update({
          where: { id: existingCurrentDevice.id },
          data: {
            lastLoginAt: now,
            deviceType: parsedDevice.deviceType,
            deviceLabel: parsedDevice.deviceLabel,
            browser: parsedDevice.browserLabel,
            os: parsedDevice.os,
            ipAddress: clientIp,
          },
        })
      } else {
        await prisma.userDevice.create({
          data: {
            userId: user.id,
            deviceToken: currentDeviceToken,
            deviceType: parsedDevice.deviceType,
            deviceLabel: parsedDevice.deviceLabel,
            browser: parsedDevice.browserLabel,
            os: parsedDevice.os,
            ipAddress: clientIp,
            location: currentLocation,
            isTrusted: true,
            lastLoginAt: now,
          },
        })
      }
    } catch (devErr) {
      console.warn(
        'Warning syncing current device in GET /api/user/security:',
        devErr
      )
    }

    // Fetch all real devices where this user has logged in from database
    let allDbDevices: any[] = []
    try {
      allDbDevices = await prisma.userDevice.findMany({
        where: { userId: user.id },
        orderBy: { lastLoginAt: 'desc' },
      })
    } catch {
      allDbDevices = []
    }

    const currentDbRecord = allDbDevices.find(
      (d) => d.deviceToken === currentDeviceToken
    )

    const currentTimeFormatted = formatDeviceLoginTime(
      currentDbRecord?.lastLoginAt || now
    )

    const currentSession = {
      id: currentDbRecord?.id || 'current-session',
      deviceType: parsedDevice.deviceType,
      deviceLabel: parsedDevice.deviceLabel,
      browser: parsedDevice.browser,
      browserLabel: parsedDevice.browserLabel,
      os: parsedDevice.os,
      location: currentDbRecord?.location || currentLocation,
      ip: clientIp,
      lastActive: currentTimeFormatted,
      loginTime: currentTimeFormatted,
      isCurrent: true,
    }

    // Map all other real devices from database (deduplicated by deviceLabel + os so same device doesn't duplicate if IP changed)
    const seenOtherKeys = new Set<string>()
    seenOtherKeys.add(`${parsedDevice.deviceLabel}|${parsedDevice.os}`)

    const otherSessions = allDbDevices
      .filter((d) => d.deviceToken !== currentDeviceToken)
      .filter((d) => {
        const key = `${d.deviceLabel}|${d.os}`
        if (seenOtherKeys.has(key)) return false
        seenOtherKeys.add(key)
        return true
      })
      .map((d) => {
        const formattedTime = formatDeviceLoginTime(d.lastLoginAt)
        return {
          id: d.id,
          deviceType:
            (d.deviceType as 'desktop' | 'mobile' | 'tablet') || 'mobile',
          deviceLabel: d.deviceLabel,
          browser: d.browser || 'Browser',
          os: d.os || '',
          location: d.location || 'Indonesia',
          lastActive: formattedTime,
          loginTime: formattedTime,
          ip: d.ipAddress || '-',
          isCurrent: false,
        }
      })

    return NextResponse.json({
      twoFactorEnabled,
      phone: user.phone || null,
      currentSession,
      otherSessions,
    })
  } catch (error) {
    console.error('Error fetching user security:', error)
    return NextResponse.json(
      { error: 'Gagal memuat informasi keamanan akun' },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST - OTP WhatsApp & 2FA Management
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    const userEmail = session?.user?.email

    if (!userId && !userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findFirst({
      where: userId ? { id: userId } : { email: userEmail! },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await req.json()
    const { action, otp } = body

    // 1. Action: REQUEST OTP to WhatsApp
    if (action === 'request_otp') {
      if (!user.phone || user.phone.trim().length < 8) {
        return NextResponse.json(
          {
            error:
              'Nomor WhatsApp belum terdaftar. Silakan lengkapi nomor telepon pada profil akun Anda terlebih dahulu.',
          },
          { status: 400 }
        )
      }

      // Generate random 6-digit OTP
      const generatedOtp = Math.floor(
        100000 + Math.random() * 900000
      ).toString()
      const normalizedPhone = normalizePhoneNumber(user.phone)

      // Store in memory with 5 minutes expiry
      otpStore.set(user.id, {
        code: generatedOtp,
        phone: user.phone,
        expiresAt: Date.now() + 5 * 60 * 1000,
        attempts: 0,
      })

      const message = `*AFFILIATE GADGET MARKETPLACE*\n\nKode Verifikasi (OTP) 2 Langkah Anda adalah: *${generatedOtp}*\n\nKode ini bersifat rahasia dan berlaku selama 5 menit. Jangan berikan kode ini kepada siapapun.`
      const whatsappUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`

      // Dispatch automated WhatsApp message via Zenziva
      import('@/lib/notifications/whatsapp-provider').then(
        ({ sendWhatsApp }) => {
          sendWhatsApp(normalizedPhone, message).catch((err) =>
            console.error('[SECURITY OTP DISPATCH ERROR]:', err)
          )
        }
      )

      return NextResponse.json({
        success: true,
        message: 'Kode OTP WhatsApp berhasil dikirim',
        phone: user.phone,
        maskedPhone: user.phone.replace(/(\d{4})\d+(\d{3})/, '$1****$2'),
        otpPreview: generatedOtp,
        whatsappUrl,
        expiresInSeconds: 300,
      })
    }

    // 2. Action: VERIFY OTP
    if (action === 'verify_otp') {
      const stored = otpStore.get(user.id)
      if (!stored) {
        return NextResponse.json(
          {
            error:
              'Kode OTP belum diminta atau sudah kadaluarsa. Silakan minta kode baru.',
          },
          { status: 400 }
        )
      }

      if (Date.now() > stored.expiresAt) {
        otpStore.delete(user.id)
        return NextResponse.json(
          { error: 'Kode OTP telah kadaluarsa. Silakan minta kode baru.' },
          { status: 400 }
        )
      }

      if (stored.attempts >= 3) {
        otpStore.delete(user.id)
        return NextResponse.json(
          {
            error:
              'Terlalu banyak percobaan salah. Silakan minta kode OTP baru.',
          },
          { status: 429 }
        )
      }

      if (!otp || String(otp).trim() !== stored.code) {
        stored.attempts += 1
        return NextResponse.json(
          { error: 'Kode OTP tidak cocok. Periksa kembali WhatsApp Anda.' },
          { status: 400 }
        )
      }

      // Successful OTP Verification
      otpStore.delete(user.id)
      set2FaEnabled(user.id, user.email, true)

      // Sync ke database
      await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorEnabled: true },
      })

      return NextResponse.json({
        success: true,
        message: 'Verifikasi 2 Langkah (OTP WhatsApp) berhasil diaktifkan',
        twoFactorEnabled: true,
      })
    }

    // 3. Action: DISABLE 2FA
    if (action === 'disable_2fa') {
      set2FaEnabled(user.id, user.email, false)
      otpStore.delete(user.id)

      // Sync ke database
      await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorEnabled: false },
      })

      return NextResponse.json({
        success: true,
        message: 'Verifikasi 2 Langkah (OTP WhatsApp) berhasil dinonaktifkan',
        twoFactorEnabled: false,
      })
    }

    return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 })
  } catch (error) {
    console.error('Error in security action:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat memproses keamanan' },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE - Logout Other Devices / Specific Device from UserDevice Table
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    const userEmail = session?.user?.email

    if (!userId && !userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findFirst({
      where: userId ? { id: userId } : { email: userEmail! },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const deviceId = searchParams.get('deviceId')

    if (deviceId) {
      // Delete specific device record
      await prisma.userDevice
        .deleteMany({
          where: {
            id: deviceId,
            userId: user.id,
          },
        })
        .catch(() => {})

      return NextResponse.json({
        success: true,
        message: 'Perangkat berhasil dikeluarkan dari riwayat akses akun',
      })
    }

    // Keep current device, delete all other devices for this user
    const userAgentString = req.headers.get('user-agent') || 'Unknown Device'
    const clientIp = extractClientIp(req)
    const currentDeviceToken = generateDeviceToken(
      userAgentString,
      clientIp,
      user.id
    )

    await prisma.userDevice
      .deleteMany({
        where: {
          userId: user.id,
          deviceToken: { not: currentDeviceToken },
        },
      })
      .catch(() => {})

    return NextResponse.json({
      success: true,
      message: 'Semua perangkat lain telah berhasil dikeluarkan dari akun',
      remainingSessions: 0,
    })
  } catch (error) {
    console.error('Error logging out other devices:', error)
    return NextResponse.json(
      { error: 'Gagal mengeluarkan perangkat lain' },
      { status: 500 }
    )
  }
}
