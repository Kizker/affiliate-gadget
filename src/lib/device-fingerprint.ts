import crypto from 'crypto'
import { db } from '@/lib/db'
import { parseUserAgent } from './user-agent-parser'
import { UserDevice } from '@prisma/client'
import { dispatchSecurityAlert } from './notifications'

export interface ClientDeviceInfo {
  userAgent: string
  ipAddress: string
  deviceType: string
  deviceLabel: string
  browser: string
  os: string
  location?: string
}

export function extractClientDeviceInfo(headers: Headers): ClientDeviceInfo {
  const ua = headers.get('user-agent') || 'Unknown Device'
  const forwarded = headers.get('x-forwarded-for')
  const realIp = headers.get('x-real-ip')
  const ipAddress = forwarded
    ? forwarded.split(',')[0].trim()
    : realIp || '127.0.0.1'

  const parsed = parseUserAgent(ua)

  return {
    userAgent: ua,
    ipAddress,
    deviceType: parsed.deviceType,
    deviceLabel: parsed.deviceLabel,
    browser: parsed.browserLabel,
    os: parsed.os,
    location: 'Indonesia',
  }
}

/**
 * Creates a deterministic fingerprint token based on user agent, subnet IP, and userId.
 * Masking the last octet of IPv4 prevents minor dynamic IP changes on the same provider from triggering alerts.
 */
export function generateDeviceToken(
  userAgent: string,
  ipAddress: string,
  userId: string
): string {
  const ipSubnet = ipAddress.includes('.')
    ? ipAddress.split('.').slice(0, 3).join('.') + '.0'
    : ipAddress

  return crypto
    .createHash('sha256')
    .update(`${userId}:${userAgent}:${ipSubnet}`)
    .digest('hex')
}

export async function lookupDevice(
  token: string,
  userId: string
): Promise<UserDevice | null> {
  return db.userDevice.findFirst({
    where: {
      userId,
      deviceToken: token,
    },
  })
}

/**
 * Checks if the current login is from a new or untrusted device.
 * If new, registers it in `user_devices` and triggers security alert for customers.
 */
export async function handleDeviceLogin(params: {
  userId: string
  headers: Headers
  userRole?: string
  name: string
  email?: string
  phone?: string
}): Promise<{ isNewDevice: boolean; device: UserDevice }> {
  const info = extractClientDeviceInfo(params.headers)
  const token = generateDeviceToken(
    info.userAgent,
    info.ipAddress,
    params.userId
  )

  const existing = await lookupDevice(token, params.userId)

  if (existing) {
    // Update last login timestamp
    const updated = await db.userDevice.update({
      where: { id: existing.id },
      data: { lastLoginAt: new Date() },
    })
    return { isNewDevice: false, device: updated }
  }

  // New device detected
  const isFirstDevice =
    (await db.userDevice.count({ where: { userId: params.userId } })) === 0

  const newDevice = await db.userDevice.create({
    data: {
      userId: params.userId,
      deviceToken: token,
      deviceType: info.deviceType,
      deviceLabel: info.deviceLabel,
      browser: info.browser,
      os: info.os,
      ipAddress: info.ipAddress,
      location: info.location,
      isTrusted: isFirstDevice, // First registered device is auto-trusted
      lastLoginAt: new Date(),
    },
  })

  // Jika bukan device pertama, picu Security Alert (Email + WA)
  if (!isFirstDevice) {
    const revokeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/dashboard/customer/security`

    dispatchSecurityAlert({
      userId: params.userId,
      name: params.name,
      email: params.email,
      phone: params.phone,
      deviceLabel: `${info.deviceLabel} (${info.browser})`,
      ipAddress: info.ipAddress,
      location: info.location,
      loginTime: new Date().toLocaleString('id-ID'),
      revokeUrl,
    }).catch((err) => console.error('[SECURITY ALERT ERROR]:', err))
  }

  return { isNewDevice: !isFirstDevice, device: newDevice }
}

export async function getUserDevices(userId: string): Promise<UserDevice[]> {
  return db.userDevice.findMany({
    where: { userId },
    orderBy: { lastLoginAt: 'desc' },
  })
}

export async function removeUserDevice(
  deviceId: string,
  userId: string
): Promise<boolean> {
  const result = await db.userDevice.deleteMany({
    where: { id: deviceId, userId },
  })
  return result.count > 0
}
