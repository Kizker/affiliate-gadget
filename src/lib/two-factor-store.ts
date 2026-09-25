import fs from 'fs'
import path from 'path'

export type OtpPurpose =
  | 'LOGIN'
  | 'CHANGE_PASSWORD'
  | 'CHANGE_EMAIL'
  | 'CHANGE_PHONE'

interface StoredLoginOtp {
  code: string
  phone: string
  expiresAt: number
  attempts: number
  purpose?: OtpPurpose
}

interface TwoFactorData {
  enabledUsers: Record<string, boolean> // userId or email -> boolean
  otps: Record<string, StoredLoginOtp> // key -> StoredLoginOtp
}

// Ensure .data folder exists for persistence
const DATA_DIR = path.join(process.cwd(), '.data')

function getStorageFile(): string {
  const workerId = process.env.VITEST_POOL_ID || process.env.VITEST_WORKER_ID
  if (workerId !== undefined) {
    return path.join(DATA_DIR, `two-factor-store-test-${workerId}.json`)
  }
  return path.join(DATA_DIR, 'two-factor-store.json')
}

// In-memory cache synced with disk
let cachedData: TwoFactorData = { enabledUsers: {}, otps: {} }

function loadData(): TwoFactorData {
  const dataFile = getStorageFile()
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true })
      }
      if (fs.existsSync(dataFile)) {
        const content = fs.readFileSync(dataFile, 'utf-8')
        if (content.trim()) {
          const parsed = JSON.parse(content)
          cachedData = parsed
          return parsed
        }
      }
      return { enabledUsers: {}, otps: {} }
    } catch {
      if (attempt === 2) {
        return cachedData || { enabledUsers: {}, otps: {} }
      }
    }
  }
  return cachedData || { enabledUsers: {}, otps: {} }
}

function saveData(data: TwoFactorData) {
  cachedData = data
  const dataFile = getStorageFile()
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    const tempFile = `${dataFile}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8')
    fs.renameSync(tempFile, dataFile)
  } catch {
    try {
      fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf-8')
    } catch (writeErr) {
      console.error('Error saving two-factor-store:', writeErr)
    }
  }
}

cachedData = loadData()

/**
 * Checks if 2FA is enabled for a given user ID or email.
 */
export function is2FaEnabled(userIdOrEmail: string): boolean {
  if (!userIdOrEmail) return false
  const data = loadData()
  return !!data.enabledUsers[userIdOrEmail.toLowerCase()]
}

/**
 * Sets the 2FA enabled status for a given user ID and/or email.
 */
export function set2FaEnabled(
  userId: string,
  email: string | null | undefined,
  enabled: boolean
) {
  const data = loadData()
  if (userId) {
    data.enabledUsers[userId.toLowerCase()] = enabled
  }
  if (email) {
    data.enabledUsers[email.toLowerCase()] = enabled
  }
  cachedData = data
  saveData(data)
}

/**
 * Normalizes phone number to international / WhatsApp format (62...)
 */
export function normalizePhoneForWhatsApp(rawPhone: string): string {
  let cleaned = rawPhone.replace(/[^0-9]/g, '')
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1)
  }
  return cleaned
}

function getOtpMessage(code: string, purpose: OtpPurpose): string {
  switch (purpose) {
    case 'CHANGE_PASSWORD':
      return `*AFFILIATE GADGET MARKETPLACE*\n\nKode Verifikasi WhatsApp untuk *Ganti Kata Sandi* Anda adalah: *${code}*\n\nKode ini bersifat rahasia dan berlaku selama 5 menit. Jangan berikan kode ini kepada siapapun.`
    case 'CHANGE_EMAIL':
      return `*AFFILIATE GADGET MARKETPLACE*\n\nKode Verifikasi WhatsApp untuk *Ganti Alamat Email* Anda adalah: *${code}*\n\nKode ini bersifat rahasia dan berlaku selama 5 menit. Jangan berikan kode ini kepada siapapun.`
    case 'CHANGE_PHONE':
      return `*AFFILIATE GADGET MARKETPLACE*\n\nKode Verifikasi WhatsApp untuk *Ganti Nomor Telepon* Anda adalah: *${code}*\n\nKode ini bersifat rahasia dan berlaku selama 5 menit. Jangan berikan kode ini kepada siapapun.`
    case 'LOGIN':
    default:
      return `*AFFILIATE GADGET MARKETPLACE*\n\nKode Verifikasi Login (OTP WhatsApp) Anda adalah: *${code}*\n\nKode ini bersifat rahasia dan berlaku selama 5 menit. Jangan berikan kode ini kepada siapapun.`
  }
}

/**
 * Generates a fresh 6-digit WhatsApp OTP for a specific purpose (LOGIN, CHANGE_PASSWORD, CHANGE_EMAIL, CHANGE_PHONE).
 */
export function createWhatsAppOtp(
  identifier: string,
  phone: string,
  purpose: OtpPurpose = 'LOGIN'
): {
  code: string
  whatsappUrl: string
  expiresInSeconds: number
  message: string
} {
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const data = loadData()
  const cleanId = identifier.toLowerCase()
  const scopedKey = `${cleanId}:${purpose}`

  const otpRecord: StoredLoginOtp = {
    code,
    phone,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 mins
    attempts: 0,
    purpose,
  }

  data.otps[scopedKey] = otpRecord
  // Maintain backward-compatibility for login
  if (purpose === 'LOGIN') {
    data.otps[cleanId] = otpRecord
  }

  saveData(data)
  cachedData = data

  const normalizedPhone = normalizePhoneForWhatsApp(phone)
  const message = getOtpMessage(code, purpose)
  const whatsappUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`

  // Dispatch via notifications engine if phone is provided
  if (phone) {
    import('@/lib/notifications')
      .then(({ dispatchOtp }) => {
        dispatchOtp({
          identifier: phone,
          purpose: purpose as any,
          channel: 'WHATSAPP',
        }).catch((err) =>
          console.error('[TWO-FACTOR-STORE DISPATCH ERROR]:', err)
        )
      })
      .catch(() => {})
  }

  return {
    code,
    whatsappUrl,
    expiresInSeconds: 300,
    message,
  }
}

/**
 * Backward compatible alias for login OTP creation.
 */
export function createLoginOtp(
  email: string,
  phone: string
): {
  code: string
  whatsappUrl: string
  expiresInSeconds: number
} {
  const result = createWhatsAppOtp(email, phone, 'LOGIN')
  return {
    code: result.code,
    whatsappUrl: result.whatsappUrl,
    expiresInSeconds: result.expiresInSeconds,
  }
}

/**
 * Verifies a WhatsApp OTP code for a specific purpose.
 */
export function verifyWhatsAppOtp(
  identifier: string,
  inputOtp: string,
  purpose: OtpPurpose = 'LOGIN'
): { success: boolean; error?: string } {
  const data = loadData()
  const cleanId = identifier.toLowerCase()
  const scopedKey = `${cleanId}:${purpose}`
  const stored =
    data.otps[scopedKey] ||
    (purpose === 'LOGIN' ? data.otps[cleanId] : undefined)

  if (!stored) {
    return {
      success: false,
      error:
        'Kode OTP belum diminta atau sudah kadaluarsa. Silakan minta kode baru.',
    }
  }

  if (Date.now() > stored.expiresAt) {
    delete data.otps[scopedKey]
    if (purpose === 'LOGIN') delete data.otps[cleanId]
    saveData(data)
    return {
      success: false,
      error: 'Kode OTP telah kadaluarsa. Silakan minta kode baru.',
    }
  }

  if (stored.attempts >= 3) {
    delete data.otps[scopedKey]
    if (purpose === 'LOGIN') delete data.otps[cleanId]
    saveData(data)
    return {
      success: false,
      error:
        'Terlalu banyak percobaan salah. Silakan kirim ulang kode OTP baru.',
    }
  }

  if (!inputOtp || String(inputOtp).trim() !== stored.code) {
    stored.attempts += 1
    saveData(data)
    return {
      success: false,
      error: 'Kode OTP tidak cocok. Periksa kembali pesan WhatsApp Anda.',
    }
  }

  // Verification successful: consume OTP
  delete data.otps[scopedKey]
  if (purpose === 'LOGIN') delete data.otps[cleanId]
  saveData(data)
  cachedData = data

  return { success: true }
}

/**
 * Clears OTPs for a given identifier, optionally scoped by purpose.
 */
export function clearOtp(identifier: string, purpose?: OtpPurpose) {
  const data = loadData()
  const cleanId = identifier.toLowerCase()
  if (purpose) {
    delete data.otps[`${cleanId}:${purpose}`]
    if (purpose === 'LOGIN') delete data.otps[cleanId]
  } else {
    delete data.otps[cleanId]
    delete data.otps[`${cleanId}:LOGIN`]
    delete data.otps[`${cleanId}:CHANGE_PASSWORD`]
    delete data.otps[`${cleanId}:CHANGE_EMAIL`]
  }
  saveData(data)
  cachedData = data
}

/**
 * Backward compatible alias for login OTP verification.
 */
export function verifyLoginOtp(
  email: string,
  inputOtp: string
): { success: boolean; error?: string } {
  return verifyWhatsAppOtp(email, inputOtp, 'LOGIN')
}
