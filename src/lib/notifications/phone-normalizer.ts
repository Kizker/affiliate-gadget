/**
 * Phone number normalization and validation utilities for Indonesia (+62)
 */

export function normalizePhone(raw: string): string {
  if (!raw) return ''

  // Hapus semua karakter non-angka
  let cleaned = raw.replace(/\D/g, '')

  // Jika diawali 08xxx -> ubah 0 menjadi 62 -> 628xxx
  if (cleaned.startsWith('08')) {
    cleaned = '62' + cleaned.slice(1)
  }
  // Jika diawali 8xxx -> tambahkan 62 -> 628xxx
  else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned
  }
  // Jika diawali 6208xxx -> perbaiki jadi 628xxx
  else if (cleaned.startsWith('6208')) {
    cleaned = '62' + cleaned.slice(3)
  }

  return cleaned
}

export function isValidIndonesianPhone(raw: string): boolean {
  const normalized = normalizePhone(raw)
  // Nomor HP seluler Indonesia diawali 628 dan panjang 10-15 digit
  return /^628\d{7,12}$/.test(normalized)
}

export function formatPhoneDisplay(raw: string): string {
  const normalized = normalizePhone(raw)
  if (!isValidIndonesianPhone(normalized)) return raw

  // Format ke 08xx-xxxx-xxxx untuk tampilan ramah lokal
  const local = '0' + normalized.slice(2)
  if (local.length <= 10) {
    return `${local.slice(0, 4)}-${local.slice(4, 7)}-${local.slice(7)}`
  }
  return `${local.slice(0, 4)}-${local.slice(4, 8)}-${local.slice(8)}`
}
