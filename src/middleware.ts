import { authConfig } from './auth.config'
import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

const ADMIN_STAFF_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'STORE_ADMIN',
  'STORE_SALES',
  'FINANCE_ADMIN',
  'CONTENT_EDITOR',
]

function getCmsDashboardUrl(role?: string | null, mitraStatus?: string | null): string {
  if (role && ADMIN_STAFF_ROLES.includes(role)) return '/dashboard/admin'
  if (role === 'TECHNICIAN') return '/dashboard/teknisi'
  if (role === 'MITRA') {
    return mitraStatus === 'PENDING' ? '/dashboard/mitra/pending' : '/dashboard/mitra'
  }
  return '/'
}

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  // Route categories
  const isAdminRoute = pathname.startsWith('/dashboard/admin')
  const isMitraRoute = pathname.startsWith('/dashboard/mitra')
  const isTechnicianRoute = pathname.startsWith('/dashboard/teknisi')
  const isDashboardGenericRoute = pathname === '/dashboard' || pathname === '/dashboard/customer'
  const isAuthRoute = pathname === '/login' || pathname === '/register'
  const isCartOrCheckout = pathname.startsWith('/cart') || pathname.startsWith('/checkout')
  const isRootPublicRoute = pathname === '/'

  // Protected routes that require authentication
  const requiresAuth =
    isAdminRoute ||
    isMitraRoute ||
    isTechnicianRoute ||
    pathname.startsWith('/checkout')

  // 1. Unauthenticated users accessing protected routes
  if (requiresAuth && !isLoggedIn) {
    const redirectUrl = new URL('/login', req.url)
    if (pathname.startsWith('/checkout')) {
      redirectUrl.searchParams.set('redirect', pathname)
    }
    return NextResponse.redirect(redirectUrl)
  }

  // 2. Unauthenticated user accessing generic dashboard
  if (isDashboardGenericRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // 3. Authenticated Role-Based Access Control & Automatic Redirection
  if (isLoggedIn && req.auth?.user) {
    const userRole = req.auth.user.role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mitraStatus = (req.auth.user as any).mitraStatus
    const isAdminStaff = !!(userRole && ADMIN_STAFF_ROLES.includes(userRole))
    const isTechnician = userRole === 'TECHNICIAN'
    const isMitra = userRole === 'MITRA'
    const isStaffOrPartner = isAdminStaff || isTechnician || isMitra

    // A. Staff / Admin / Sales Toko / Teknisi / Mitra -> otomatis diarahkan langsung ke panel CMS
    // Tidak diperbolehkan berada di view publik root (/), login, register, cart, atau checkout
    if (isStaffOrPartner) {
      const destinationCms = getCmsDashboardUrl(userRole, mitraStatus)

      // Redirect dari halaman publik root (/), login, register, cart, checkout, atau generic dashboard
      if (isRootPublicRoute || isAuthRoute || isCartOrCheckout || isDashboardGenericRoute) {
        return NextResponse.redirect(new URL(destinationCms, req.url))
      }

      // Proteksi rute Admin CMS (/dashboard/admin)
      if (isAdminRoute && !isAdminStaff) {
        return NextResponse.redirect(new URL(destinationCms, req.url))
      }

      // Proteksi rute Teknisi (/dashboard/teknisi)
      if (isTechnicianRoute && !isTechnician) {
        return NextResponse.redirect(new URL(destinationCms, req.url))
      }

      // Proteksi rute Mitra (/dashboard/mitra)
      if (isMitraRoute) {
        if (!isMitra) {
          return NextResponse.redirect(new URL(destinationCms, req.url))
        }
        if (mitraStatus === 'PENDING' && !pathname.startsWith('/dashboard/mitra/pending')) {
          return NextResponse.redirect(new URL('/dashboard/mitra/pending', req.url))
        }
        if (mitraStatus === 'APPROVED' && pathname.startsWith('/dashboard/mitra/pending')) {
          return NextResponse.redirect(new URL('/dashboard/mitra', req.url))
        }
      }
    } else {
      // B. Customer Role
      // Jika mengakses area dashboard admin/mitra/teknisi/dashboard umum -> kembalikan ke beranda publik
      if (isAdminRoute || isMitraRoute || isTechnicianRoute || isDashboardGenericRoute) {
        return NextResponse.redirect(new URL('/', req.url))
      }
      if (isAuthRoute) {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }
  }

  const response = NextResponse.next()

  // Add Security Headers
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  )
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com https://maps.google.com https://widget.cloudinary.com https://upload-widget.cloudinary.com https://cdn.tiny.cloud; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://widget.cloudinary.com https://cdn.tiny.cloud; img-src 'self' blob: data: https://utfs.io https://lh3.googleusercontent.com https://images.unsplash.com https://res.cloudinary.com https://ui-avatars.com https://maps.gstatic.com https://maps.googleapis.com https://sp.tinymce.com; media-src 'self' blob: data: https://videos.pexels.com https://commondatastorage.googleapis.com; font-src 'self' https://fonts.gstatic.com https://cdn.tiny.cloud; connect-src 'self' https://utfs.io https://api.cloudinary.com https://res.cloudinary.com https://maps.googleapis.com https://cdn.tiny.cloud https://sp.tinymce.com; frame-ancestors 'none';"
  )
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), browsing-topics=()'
  )

  return response
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt, site.webmanifest
     * - Static asset files (.svg, .png, .jpg, .jpeg, .webp, .avif, .ico, .woff2, .mp4, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|site.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|bmp|woff|woff2|ttf|eot|mp4|webm|pdf)$).*)',
  ],
}

