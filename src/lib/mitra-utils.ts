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
