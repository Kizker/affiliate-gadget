import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Memformat angka atau string ke format ribuan bertitik Indonesia (misal: 27750000 -> 27.750.000)
 */
export function formatRupiahInput(
  value: string | number | undefined | null
): string {
  if (value === undefined || value === null || value === '') return ''
  const clean = String(value).replace(/\D/g, '')
  if (!clean) return ''
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/**
 * Mengambil angka murni (number) dari input berformat ribuan bertitik (misal: 27.750.000 -> 27750000)
 */
export function parseRupiahInput(
  value: string | number | undefined | null
): number {
  if (value === undefined || value === null || value === '') return 0
  const clean = String(value).replace(/\D/g, '')
  return clean ? parseInt(clean, 10) : 0
}

/**
 * Menyembunyikan bagian nama email untuk privasi tampilan UI.
 * Contoh: "bambangsetiawan@gmail.com" -> "bam***@gmail.com"
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email || ''
  const [name, domain] = email.split('@')
  const visibleChars = Math.min(3, Math.max(1, Math.floor(name.length / 2)))
  return `${name.slice(0, visibleChars)}***@${domain}`
}
