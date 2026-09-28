import { auth } from '@/auth'
import { redirect } from 'next/navigation'

/**
 * Sub-route access matrix — defines which roles can access each dashboard sub-path.
 * Keys are path prefixes (without /dashboard/admin), values are allowed roles.
 *
 * Order matters: more specific paths should come first.
 */
export const ROUTE_ACCESS_MATRIX: Record<string, string[]> = {
  // Finance & Laporan — SUPER_ADMIN, STORE_ADMIN (toko sendiri), FINANCE_ADMIN
  '/dashboard/admin/finance': ['SUPER_ADMIN', 'STORE_ADMIN', 'FINANCE_ADMIN'],
  '/dashboard/admin/reports': ['SUPER_ADMIN', 'STORE_ADMIN', 'FINANCE_ADMIN'],

  // Manajemen Pengguna — SUPER_ADMIN only
  '/dashboard/admin/users': ['SUPER_ADMIN'],

  // Kelola Teknisi — SUPER_ADMIN only
  '/dashboard/admin/technicians': ['SUPER_ADMIN'],

  // Voucher — SUPER_ADMIN only
  '/dashboard/admin/vouchers': ['SUPER_ADMIN'],

  // Manajemen Toko/Mitra — SUPER_ADMIN, ADMIN
  '/dashboard/admin/mitras': ['SUPER_ADMIN', 'ADMIN'],

  // Iklan — SUPER_ADMIN, STORE_ADMIN
  '/dashboard/admin/ads': ['SUPER_ADMIN', 'STORE_ADMIN'],

  // Blog — SUPER_ADMIN, CONTENT_EDITOR
  '/dashboard/admin/blog': ['SUPER_ADMIN', 'CONTENT_EDITOR'],

  // Pesanan — SUPER_ADMIN, STORE_ADMIN, STORE_SALES
  '/dashboard/admin/orders': ['SUPER_ADMIN', 'STORE_ADMIN', 'STORE_SALES'],

  // Klaim Garansi & Pengembalian — semua kecuali FINANCE_ADMIN & CONTENT_EDITOR
  '/dashboard/admin/complaints': [
    'SUPER_ADMIN',
    'ADMIN',
    'STORE_ADMIN',
    'STORE_SALES',
  ],
  '/dashboard/admin/returns': [
    'SUPER_ADMIN',
    'ADMIN',
    'STORE_ADMIN',
    'STORE_SALES',
  ],

  // Chat — semua admin & staff toko
  '/dashboard/admin/chat': [
    'SUPER_ADMIN',
    'ADMIN',
    'STORE_ADMIN',
    'STORE_SALES',
  ],

  // Katalog Produk — SUPER_ADMIN, ADMIN, STORE_ADMIN, CONTENT_EDITOR
  '/dashboard/admin/products': [
    'SUPER_ADMIN',
    'ADMIN',
    'STORE_ADMIN',
    'CONTENT_EDITOR',
  ],

  // Pengaturan — SUPER_ADMIN, ADMIN, STORE_ADMIN
  '/dashboard/admin/settings': ['SUPER_ADMIN', 'ADMIN', 'STORE_ADMIN'],
}

/**
 * Server-side page-level auth guard.
 *
 * Usage in a Server Component page:
 * ```ts
 * await requirePageAccess('/dashboard/admin/finance')
 * ```
 *
 * - If not authenticated → redirect to /login
 * - If role not allowed → redirect to their default dashboard page
 */
export async function requirePageAccess(routePrefix: string): Promise<void> {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const role = session.user.role as string
  const allowedRoles = ROUTE_ACCESS_MATRIX[routePrefix]

  if (!allowedRoles) {
    // No restriction defined — allow all authenticated admin staff
    return
  }

  if (!allowedRoles.includes(role)) {
    // Redirect to their own default dashboard root
    redirect('/dashboard/admin')
  }
}

/**
 * Check access programmatically (returns boolean, does NOT redirect).
 * Useful for conditional rendering.
 */
export function canAccess(
  role: string | undefined | null,
  routePrefix: string
): boolean {
  if (!role) return false
  const allowedRoles = ROUTE_ACCESS_MATRIX[routePrefix]
  if (!allowedRoles) return true
  return allowedRoles.includes(role)
}
