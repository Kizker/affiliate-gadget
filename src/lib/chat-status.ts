export interface StoreScheduleItem {
  day?: string
  dayOfWeek?: number
  openTime: string
  closeTime: string
  isClosed?: boolean
}

export interface StoreContext {
  id?: string
  name?: string
  isActive?: boolean
  schedules?: StoreScheduleItem[]
}

export interface TechnicianContext {
  id?: string
  isAvailable?: boolean
}

/**
 * Menentukan apakah toko/teknisi sedang dalam jam operasional (Online) atau tutup (Offline).
 * Menghitung waktu berdasarkan zona waktu Indonesia Barat (WIB / UTC+7).
 */
export function isStoreOperational(
  store?: StoreContext | null,
  technician?: TechnicianContext | null,
  checkDate?: Date
): boolean {
  // Jika chat dengan teknisi, cek ketersediaan teknisi
  if (technician && typeof technician.isAvailable === 'boolean') {
    return technician.isAvailable
  }

  // Jika toko eksplisit nonaktif di sistem
  if (store && store.isActive === false) {
    return false
  }

  // Konversi waktu ke WIB (Asia/Jakarta = UTC+7)
  const date = checkDate || new Date()
  const utc = date.getTime() + date.getTimezoneOffset() * 60000
  const wibDate = new Date(utc + 7 * 3600000)

  const dayNames = [
    'SUNDAY',
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
  ]
  const currentDay = dayNames[wibDate.getDay()]
  const hours = wibDate.getHours()
  const minutes = wibDate.getMinutes()
  const currentTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`

  // Cek jadwal hari ini jika toko memiliki jadwal terdaftar
  if (store?.schedules && store.schedules.length > 0) {
    const todaySchedule = store.schedules.find((s) => {
      if (s.day && s.day.toUpperCase() === currentDay) return true
      if (typeof s.dayOfWeek === 'number' && s.dayOfWeek === wibDate.getDay())
        return true
      return false
    })
    if (todaySchedule) {
      if (todaySchedule.isClosed) {
        return false
      }
      if (todaySchedule.openTime && todaySchedule.closeTime) {
        return (
          currentTimeStr >= todaySchedule.openTime &&
          currentTimeStr <= todaySchedule.closeTime
        )
      }
    }
  }

  // Jam operasional standar toko gadget di Indonesia jika belum ada jadwal khusus: 09:00 - 21:00 WIB
  return hours >= 9 && hours < 21
}

export type ChatTickStatus = 'SENT' | 'DELIVERED' | 'READ'

/**
 * Menentukan status centang WhatsApp:
 * - 'READ': Ceklis 2 biru (sudah dibaca oleh salah satu pihak)
 * - 'DELIVERED': Ceklis 2 abu-abu (sudah diterima server & pihak penerima online)
 * - 'SENT': Ceklis 1 abu-abu (pihak penerima/store sedang offline)
 */
export function getChatTickStatus(options: {
  isRead?: boolean
  isRecipientOnline?: boolean
}): ChatTickStatus {
  if (options.isRead) {
    return 'READ'
  }
  if (options.isRecipientOnline) {
    return 'DELIVERED'
  }
  return 'SENT'
}
