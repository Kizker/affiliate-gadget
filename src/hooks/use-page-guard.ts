'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Sub-route access matrix — mirrors the one in src/lib/auth-guard.ts.
 * Maintained in sync. Used for client-side page guard fallback.
 */
const ROUTE_ACCESS_MATRIX: Record<string, string[]> = {
  '/dashboard/admin/finance': ['SUPER_ADMIN', 'STORE_ADMIN', 'FINANCE_ADMIN'],
  '/dashboard/admin/reports': ['SUPER_ADMIN', 'STORE_ADMIN', 'FINANCE_ADMIN'],
  '/dashboard/admin/users': ['SUPER_ADMIN'],
  '/dashboard/admin/technicians': ['SUPER_ADMIN'],
  '/dashboard/admin/vouchers': ['SUPER_ADMIN'],
  '/dashboard/admin/mitras': ['SUPER_ADMIN', 'ADMIN'],
  '/dashboard/admin/ads': ['SUPER_ADMIN', 'STORE_ADMIN'],
  '/dashboard/admin/blog': ['SUPER_ADMIN', 'CONTENT_EDITOR'],
  '/dashboard/admin/orders': ['SUPER_ADMIN', 'STORE_ADMIN', 'STORE_SALES'],
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
  '/dashboard/admin/chat': [
    'SUPER_ADMIN',
    'ADMIN',
    'STORE_ADMIN',
    'STORE_SALES',
  ],
  '/dashboard/admin/products': [
    'SUPER_ADMIN',
    'ADMIN',
    'STORE_ADMIN',
    'CONTENT_EDITOR',
  ],
  '/dashboard/admin/settings': ['SUPER_ADMIN', 'ADMIN', 'STORE_ADMIN'],
}

/**
 * Client-side page access guard hook.
 *
 * Usage:
 * ```ts
 * usePageGuard('/dashboard/admin/finance')
 * ```
 *
 * - While session is loading → renders nothing (returns `loading: true`)
 * - If not authenticated → redirect to /login
 * - If role not allowed → redirect to /dashboard/admin
 * - If allowed → returns `{ loading: false, session }`
 */
export function usePageGuard(routePrefix: string) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.replace('/login')
      return
    }

    const role = session?.user?.role as string | undefined
    if (!role) {
      router.replace('/login')
      return
    }

    const allowedRoles = ROUTE_ACCESS_MATRIX[routePrefix]
    if (allowedRoles && !allowedRoles.includes(role)) {
      router.replace('/dashboard/admin')
    }
  }, [status, session, router, routePrefix])

  const isLoading = status === 'loading'
  const role = session?.user?.role as string | undefined
  const allowedRoles = ROUTE_ACCESS_MATRIX[routePrefix]
  const isAllowed =
    status === 'authenticated' &&
    !!role &&
    (!allowedRoles || allowedRoles.includes(role))

  return { isLoading, isAllowed, session }
}
