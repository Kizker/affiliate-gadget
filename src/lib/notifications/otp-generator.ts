import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { OtpPurpose, OtpChannel, OtpToken } from '@prisma/client'
import { normalizePhone, isValidIndonesianPhone } from './phone-normalizer'

export function generateOtpCode(): string {
  return crypto.randomInt(100000, 1000000).toString()
}

export async function hashOtpCode(code: string): Promise<string> {
  return bcrypt.hash(code, 10)
}

export async function verifyOtpCode(
  code: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(code, hash)
}

function normalizeIdentifier(raw: string): string {
  if (raw.includes('@')) {
    return raw.trim().toLowerCase()
  }
  return normalizePhone(raw)
}

export async function createOtpRecord(params: {
  identifier: string
  purpose: OtpPurpose
  channel: OtpChannel
  userId?: string
}): Promise<{ code: string; otpToken: OtpToken }> {
  const identifier = normalizeIdentifier(params.identifier)
  const code = generateOtpCode()
  const codeHash = await hashOtpCode(code)

  const expireSeconds = parseInt(process.env.OTP_EXPIRE_SECONDS || '300', 10)
  const expiresAt = new Date(Date.now() + expireSeconds * 1000)

  // Invalidate OTP aktif sebelumnya untuk identifier & purpose yang sama
  await db.otpToken.updateMany({
    where: {
      identifier,
      purpose: params.purpose,
      isConsumed: false,
    },
    data: {
      isConsumed: true,
    },
  })

  const otpToken = await db.otpToken.create({
    data: {
      identifier,
      codeHash,
      purpose: params.purpose,
      channel: params.channel,
      expiresAt,
      userId: params.userId || null,
    },
  })

  return { code, otpToken }
}

export type OtpValidationResult = {
  valid: boolean
  error?: 'NOT_FOUND' | 'EXPIRED' | 'MAX_ATTEMPTS_EXCEEDED' | 'INVALID_CODE'
  attemptsLeft?: number
  otpToken?: OtpToken
}

export async function validateOtpRecord(params: {
  identifier: string
  code: string
  purpose: OtpPurpose
}): Promise<OtpValidationResult> {
  const identifier = normalizeIdentifier(params.identifier)
  const maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS || '3', 10)

  const tokenRecord = await db.otpToken.findFirst({
    where: {
      identifier,
      purpose: params.purpose,
      isConsumed: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  if (!tokenRecord) {
    return { valid: false, error: 'NOT_FOUND' }
  }

  if (new Date() > tokenRecord.expiresAt) {
    // Tandai consumed karena expired
    await db.otpToken.update({
      where: { id: tokenRecord.id },
      data: { isConsumed: true },
    })
    return { valid: false, error: 'EXPIRED' }
  }

  if (tokenRecord.attempts >= maxAttempts) {
    await db.otpToken.update({
      where: { id: tokenRecord.id },
      data: { isConsumed: true },
    })
    return { valid: false, error: 'MAX_ATTEMPTS_EXCEEDED', attemptsLeft: 0 }
  }

  const isMatch = await verifyOtpCode(params.code, tokenRecord.codeHash)

  if (!isMatch) {
    const updated = await db.otpToken.update({
      where: { id: tokenRecord.id },
      data: { attempts: { increment: 1 } },
    })
    const attemptsLeft = Math.max(0, maxAttempts - updated.attempts)

    if (attemptsLeft === 0) {
      await db.otpToken.update({
        where: { id: tokenRecord.id },
        data: { isConsumed: true },
      })
    }

    return { valid: false, error: 'INVALID_CODE', attemptsLeft }
  }

  return { valid: true, otpToken: tokenRecord }
}

export async function consumeOtpRecord(id: string): Promise<void> {
  await db.otpToken.update({
    where: { id },
    data: { isConsumed: true },
  })
}

export async function cleanExpiredOtps(): Promise<number> {
  const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const result = await db.otpToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { isConsumed: true, createdAt: { lt: threshold } },
      ],
    },
  })
  return result.count
}
