/**
 * Helper to determine if a mitra workshop is currently open based on hours string and current time in WIB (UTC+7).
 */
export function isMitraCurrentlyOpen(
  weekdayHours: string | null,
  weekendHours: string | null,
  date: Date = new Date()
): boolean {
  // Convert to WIB (UTC+7)
  const utc = date.getTime() + date.getTimezoneOffset() * 60000
  const wibTime = new Date(utc + 3600000 * 7)

  const dayOfWeek = wibTime.getDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const hoursStr = isWeekend ? weekendHours : weekdayHours

  if (!hoursStr) return false
  const lower = hoursStr.toLowerCase()
  if (
    lower.includes('tutup') ||
    lower.includes('closed') ||
    lower.includes('libur')
  ) {
    return false
  }

  // Parse time range format e.g. "09:00 - 20:00" or "09.00 - 20.00"
  const match = hoursStr.match(
    /(\d{1,2})[:.](\d{2})\s*-\s*(\d{1,2})[:.](\d{2})/
  )
  if (!match) {
    return true
  }

  const openMinutes = parseInt(match[1], 10) * 60 + parseInt(match[2], 10)
  const closeMinutes = parseInt(match[3], 10) * 60 + parseInt(match[4], 10)
  const currentMinutes = wibTime.getHours() * 60 + wibTime.getMinutes()

  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes
}

/**
 * Format string estimasi biaya servis menjadi format currency Rupiah yang konsisten.
 * Contoh: "150000" -> "Rp 150.000", "450000 - 2500000" -> "Rp 450.000 - Rp 2.500.000", "150rb" -> "Rp 150.000".
 */
export function formatServicePrice(rawPrice?: string | null): string {
  if (!rawPrice || !rawPrice.trim()) return 'Hubungi kami'
  const trimmed = rawPrice.trim()

  // Jika teks murni tanpa angka sama sekali (contoh: "Hubungi kami", "Gratis")
  if (!/\d/.test(trimmed)) {
    return trimmed
  }

  // Jika berupa rentang harga (mengandung tanda strip '-')
  if (trimmed.includes('-')) {
    const parts = trimmed.split('-')
    if (parts.length === 2) {
      const p1 = formatServicePrice(parts[0])
      const p2 = formatServicePrice(parts[1])
      if (p1 && p2 && p1 !== 'Hubungi kami' && p2 !== 'Hubungi kami') {
        return `${p1} - ${p2}`
      }
    }
  }

  // Handle shorthand ribuan / jutaan (contoh: 150rb, 150k, 1.5jt)
  const lower = trimmed.toLowerCase()
  if (/\d+\s*(?:k|rb|ribu)\b/i.test(lower)) {
    const numMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:k|rb|ribu)/i)
    if (numMatch) {
      const val = parseFloat(numMatch[1].replace(',', '.')) * 1000
      return `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(val))}`
    }
  }
  if (/\d+\s*(?:jt|juta)\b/i.test(lower)) {
    const numMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:jt|juta)/i)
    if (numMatch) {
      const val = parseFloat(numMatch[1].replace(',', '.')) * 1000000
      return `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(val))}`
    }
  }

  // Bersihkan karakter selain angka
  const digits = trimmed.replace(/[^\d]/g, '')
  if (digits) {
    const num = parseInt(digits, 10)
    if (!isNaN(num) && num > 0) {
      return `Rp ${new Intl.NumberFormat('id-ID').format(num)}`
    }
  }

  return trimmed
}
