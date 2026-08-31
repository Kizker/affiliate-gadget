import { UserRole } from '@prisma/client'

export const ADMIN_STAFF_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'STORE_ADMIN',
  'STORE_SALES',
  'FINANCE_ADMIN',
  'CONTENT_EDITOR',
] as const

export type AdminStaffRole = (typeof ADMIN_STAFF_ROLES)[number]

export function isAdminStaffRole(role?: string | null): boolean {
  if (!role) return false
  return (ADMIN_STAFF_ROLES as readonly string[]).includes(role)
}

export function isStaffOrPartnerRole(role?: string | null): boolean {
  if (!role) return false
  return (
    isAdminStaffRole(role) ||
    role === 'TECHNICIAN' ||
    role === 'MITRA'
  )
}

export function getDashboardRoute(
  role?: UserRole | string | null,
  mitraStatus?: string | null
): string {
  if (!role) return '/'

  if (isAdminStaffRole(role)) {
    return '/dashboard/admin'
  }

  switch (role) {
    case 'TECHNICIAN':
      return '/dashboard/teknisi'
    case 'MITRA':
      return mitraStatus === 'PENDING'
        ? '/dashboard/mitra/pending'
        : '/dashboard/mitra'
    case 'CUSTOMER':
    default:
      return '/'
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - d.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Baru saja'
  if (minutes < 60) return `${minutes} menit yang lalu`
  if (hours < 24) return `${hours} jam yang lalu`
  if (days < 7) return `${days} hari yang lalu`

  return formatDate(d)
}
