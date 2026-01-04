/**
 * Chat helper utilities
 */

/**
 * Check if two dates are on the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

/**
 * Format date for chat separator
 * Returns "Hari ini", "Kemarin", or formatted date
 */
export function formatDateSeparator(date: Date): string {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (isSameDay(date, today)) {
    return 'Hari ini'
  } else if (isSameDay(date, yesterday)) {
    return 'Kemarin'
  } else {
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }
}
