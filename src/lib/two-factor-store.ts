import fs from 'fs'
import path from 'path'

interface StoredLoginOtp {
  code: string
  phone: string
  expiresAt: number
  attempts: number
}

interface TwoFactorData {
  enabledUsers: Record<string, boolean> // userId or email -> boolean
  otps: Record<string, StoredLoginOtp> // email -> StoredLoginOtp
}

// Ensure .data folder exists for persistence
const DATA_DIR = path.join(process.cwd(), '.data')
const DATA_FILE = path.join(DATA_DIR, 'two-factor-store.json')

function loadData(): TwoFactorData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8')
      return JSON.parse(content)
    }
  } catch (e) {
    console.error('Error loading two-factor-store:', e)
  }
  return { enabledUsers: {}, otps: {} }
}

function saveData(data: TwoFactorData) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
  } catch (e) {
    console.error('Error saving two-factor-store:', e)
  }
}

// In-memory cache synced with disk
let cachedData: TwoFactorData = loadData()

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

/**
 * Generates a fresh 6-digit login OTP for an email.
 */
export function createLoginOtp(
  email: string,
  phone: string
): {
  code: string
  whatsappUrl: string
  expiresInSeconds: number
} {
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const data = loadData()
  const key = email.toLowerCase()

  data.otps[key] = {
    code,
    phone,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 mins
    attempts: 0,
  }

  saveData(data)
  cachedData = data

  const normalizedPhone = normalizePhoneForWhatsApp(phone)
  const message = `*AFFILIATE GADGET MARKETPLACE*\n\nKode Verifikasi Login (OTP WhatsApp) Anda adalah: *${code}*\n\nKode ini bersifat rahasia dan berlaku selama 5 menit. Jangan berikan kode ini kepada siapapun.`
  const whatsappUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`

  return {
    code,
    whatsappUrl,
    expiresInSeconds: 300,
  }
}

/**
 * Verifies a login OTP code.
 */
export function verifyLoginOtp(
  email: string,
  inputOtp: string
): { success: boolean; error?: string } {
  const data = loadData()
  const key = email.toLowerCase()
  const stored = data.otps[key]

  if (!stored) {
    return {
      success: false,
      error:
        'Kode OTP belum diminta atau sudah kadaluarsa. Silakan minta kode baru.',
    }
  }

  if (Date.now() > stored.expiresAt) {
    delete data.otps[key]
    saveData(data)
    return {
      success: false,
      error: 'Kode OTP telah kadaluarsa. Silakan minta kode baru.',
    }
  }

  if (stored.attempts >= 3) {
    delete data.otps[key]
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
  delete data.otps[key]
  saveData(data)
  cachedData = data

  return { success: true }
}
