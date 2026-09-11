'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  Smartphone,
  Search,
  ShoppingCart,
  ShoppingBag,
  ShieldCheck,
  User,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ArrowRight,
  MessageSquare,
  HelpCircle,
} from 'lucide-react'
import { useCartStore } from '@/lib/store/cart-store'

interface NavbarProps {
  variant?: 'light' | 'dark'
}

export function Navbar({ variant = 'light' }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const { items, setUserId: cartSetUserId } = useCartStore()
  // Guard with mounted & authenticated to prevent hydration mismatch and hide badge when unauthenticated
  const itemCount =
    mounted && status === 'authenticated'
      ? items.reduce((sum, item) => sum + item.quantity, 0)
      : 0
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    session?.user?.image || null
  )

  // Reaktif: sinkronisasi keranjang belanja dengan status sesi NextAuth
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      cartSetUserId(session.user.id)
    } else if (status === 'unauthenticated') {
      // Bersihkan seketika keranjang lokal jika belum login / sudah logout
      cartSetUserId(null)
    }
  }, [status, session?.user?.id, cartSetUserId])

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      const snapContainer = document.getElementById('snap-container')
      const scrollPos = snapContainer ? snapContainer.scrollTop : window.scrollY
      setScrolled(scrollPos > 10)
    }
    // Listen to both window and snap container
    window.addEventListener('scroll', handleScroll, { passive: true })
    const snapContainer = document.getElementById('snap-container')
    if (snapContainer) {
      snapContainer.addEventListener('scroll', handleScroll, { passive: true })
    }
    return () => {
      window.removeEventListener('scroll', handleScroll)
      const el = document.getElementById('snap-container')
      if (el) el.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Sync and fetch profile avatar for active session
  useEffect(() => {
    if (session?.user?.image) {
      setAvatarUrl(session.user.image)
    } else if (session?.user?.id || session?.user?.email) {
      // Fetch latest profile avatar from database if not in cached JWT
      fetch('/api/user/profile')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.user?.image) {
            setAvatarUrl(data.user.image)
          }
        })
        .catch(() => {})
    } else {
      setAvatarUrl(null)
    }
  }, [session?.user])

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setUserDropdownOpen(false)
  }, [pathname])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/gadget?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const getChatLink = () => {
    if (!mounted || !session)
      return '/login?callbackUrl=/dashboard/customer/chat'
    const role = (session.user as any)?.role
    if (
      role === 'SUPER_ADMIN' ||
      role === 'ADMIN' ||
      role === 'STORE_ADMIN' ||
      role === 'STORE_SALES' ||
      role === 'STORE_STAFF' ||
      role === 'FINANCE_ADMIN' ||
      role === 'CONTENT_EDITOR'
    ) {
      return '/dashboard/admin/chat'
    }
    return '/dashboard/customer/chat'
  }

  const getDashboardLink = () => {
    if (!mounted || !session) return '/login'
    const role = (session.user as any)?.role
    if (
      role === 'SUPER_ADMIN' ||
      role === 'ADMIN' ||
      role === 'STORE_ADMIN' ||
      role === 'STORE_SALES' ||
      role === 'STORE_STAFF' ||
      role === 'FINANCE_ADMIN' ||
      role === 'CONTENT_EDITOR'
    ) {
      return '/dashboard/admin'
    }
    if (role === 'MITRA') return '/dashboard/mitra'
    if ((session.user as any)?.isTechnician || role === 'TECHNICIAN')
      return '/dashboard/teknisi'
    return '/'
  }

  const navLinks = [
    { href: '/', label: 'Beranda' },
    { href: '/gadget', label: 'Produk' },
    { href: '/toko', label: 'Toko' },
  ]

  const isSearchPage =
    pathname.startsWith('/gadget') || pathname.startsWith('/toko')

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-slate-200/50 bg-white/85 shadow-[0_2px_20px_rgba(0,0,0,0.02)] backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-950/85'
          : 'border-b border-slate-100/70 bg-white/70 backdrop-blur-md dark:border-slate-900 dark:bg-slate-950/70'
      }`}
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-2 sm:gap-4">
          {/* 1. Brand Logo (Clean & High Contrast with Official Logo) */}
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2 focus:outline-none sm:gap-2.5"
            aria-label="Affiliate Gadget Beranda"
          >
            <img
              src="/logo.png"
              alt="Affiliate Gadget Logo"
              className="shadow-2xs h-7 w-7 rounded-xl object-contain transition-transform duration-200 group-hover:scale-105 sm:h-8 sm:w-8"
            />
            <span className="text-sm font-black leading-none tracking-tight text-slate-950 dark:text-white sm:text-base">
              Affiliate<span className="text-orange-500">Gadget</span>
            </span>
          </Link>

          {/* 2. Center: Dedicated Floating Nav Island (Ultra-Clean Whitespace) */}
          <nav className="backdrop-blur-xs hidden items-center rounded-full border border-slate-200/40 bg-slate-100/70 p-1 dark:border-slate-800/60 dark:bg-slate-900/60 md:flex">
            {navLinks.map((link) => {
              const isActive =
                link.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200 ${
                    isActive
                      ? 'shadow-xs bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                      : 'text-slate-600 hover:bg-white/60 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* 3. Right: Utility & Action Cluster */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            {/* Minimalist Search Capsule (Hidden on /gadget and /toko where in-page search is active) */}
            {!isSearchPage && (
              <form
                onSubmit={handleSearchSubmit}
                className="relative hidden items-center duration-200 animate-in fade-in lg:flex"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari..."
                  className="focus:shadow-xs w-32 rounded-full border border-slate-200/70 bg-slate-50/80 py-1.5 pl-8 pr-3 text-xs font-medium text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-400 focus:w-48 focus:border-slate-300 focus:bg-white dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-100 dark:focus:border-slate-700 xl:w-36"
                />
                <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
              </form>
            )}

            {/* Live Chat / Pesan Button (Placed Next to Cart) */}
            <Link
              href={getChatLink()}
              className={`h-8.5 w-8.5 relative flex items-center justify-center rounded-full border transition-all duration-200 active:scale-95 sm:h-9 sm:w-9 ${
                pathname.startsWith('/dashboard/customer/chat') ||
                pathname.startsWith('/dashboard/admin/chat')
                  ? 'shadow-xs border-slate-900 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950'
                  : 'shadow-xs border-slate-200/70 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
              aria-label="Pesan Live Chat"
              title="Pesan & Live Chat"
            >
              <MessageSquare className="h-4 w-4" />
            </Link>

            {/* Cart Button */}
            <Link
              href="/cart"
              className={`h-8.5 w-8.5 relative flex items-center justify-center rounded-full border transition-all duration-200 active:scale-95 sm:h-9 sm:w-9 ${
                pathname === '/cart'
                  ? 'shadow-xs border-slate-900 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950'
                  : 'shadow-xs border-slate-200/70 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
              aria-label="Keranjang Belanja"
              title="Keranjang Belanja"
            >
              <ShoppingCart className="h-4 w-4" />
              {mounted && itemCount > 0 && (
                <span className="shadow-xs absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9.5px] font-semibold leading-none text-white duration-150 animate-in zoom-in">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            {/* User Session Auth Control */}
            {!mounted || status === 'loading' ? (
              <div className="h-8 w-14 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800 sm:w-16" />
            ) : session?.user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="shadow-xs flex items-center gap-1.5 rounded-full border border-slate-200/70 bg-white p-1 text-xs font-semibold text-slate-800 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 sm:gap-2 sm:py-1 sm:pl-1 sm:pr-2.5"
                >
                  {avatarUrl ? (
                    <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full border border-slate-200/80 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                      <img
                        src={avatarUrl}
                        alt={session.user.name || 'Avatar'}
                        className="h-full w-full object-cover"
                        onError={() => setAvatarUrl(null)}
                      />
                    </div>
                  ) : (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-950 text-[10px] font-black text-white dark:bg-blue-600">
                      {(session.user.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden max-w-[80px] truncate sm:inline-block">
                    {session.user.name?.split(' ')[0] || 'Akun'}
                  </span>
                  <ChevronDown className="hidden h-3 w-3 text-slate-400 sm:inline-block" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-60 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-xl duration-150 animate-in fade-in zoom-in-95 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-3 border-b border-slate-100 px-3 py-2.5 dark:border-slate-800">
                      {avatarUrl ? (
                        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-slate-200/80 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                          <img
                            src={avatarUrl}
                            alt={session.user.name || 'Avatar'}
                            className="h-full w-full object-cover"
                            onError={() => setAvatarUrl(null)}
                          />
                        </div>
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white dark:bg-blue-600">
                          {(session.user.name || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                          {session.user.name}
                        </p>
                        <p className="truncate text-[10px] text-slate-400">
                          {session.user.email}
                        </p>
                        <span className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {(session.user as any)?.role || 'CUSTOMER'}
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      {(session.user as any)?.role === 'CUSTOMER' ||
                      !(session.user as any)?.role ? (
                        <>
                          <Link
                            href="/dashboard/customer/orders"
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            <ShoppingBag className="h-3.5 w-3.5 text-slate-400" />{' '}
                            Pesanan Saya
                          </Link>
                          <Link
                            href="/dashboard/customer/settings"
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            <User className="h-3.5 w-3.5 text-slate-400" />{' '}
                            Profil Saya
                          </Link>
                          <Link
                            href="/hubungi-kami"
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            <HelpCircle className="h-3.5 w-3.5 text-slate-400" />{' '}
                            Bantuan
                          </Link>
                        </>
                      ) : (
                        <Link
                          href={getDashboardLink()}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <User className="h-3.5 w-3.5 text-slate-400" /> Panel
                          Dashboard
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-1 dark:border-slate-800">
                      <button
                        onClick={() => {
                          cartSetUserId(null)
                          signOut({ callbackUrl: '/' })
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                      >
                        <LogOut className="h-3.5 w-3.5" /> Keluar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Mobile icon button: direct link to /login on small screens */}
                <Link
                  href="/login"
                  className="h-8.5 w-8.5 shadow-xs flex items-center justify-center rounded-full border border-slate-200/70 bg-white text-slate-700 transition-all hover:bg-slate-50 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 sm:hidden"
                  aria-label="Masuk Akun"
                  title="Masuk Akun"
                >
                  <User className="h-4 w-4" />
                </Link>

                {/* Tablet & Desktop text buttons */}
                <div className="hidden items-center gap-1 sm:flex">
                  <Link
                    href="/login"
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100/70 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/register"
                    className="shadow-xs inline-flex items-center justify-center rounded-full bg-orange-500 px-3.5 py-1.5 text-xs font-bold text-white transition-all duration-200 hover:bg-orange-600 active:scale-95"
                  >
                    Daftar
                  </Link>
                </div>
              </>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="h-8.5 w-8.5 shadow-xs flex items-center justify-center rounded-full border border-slate-200/70 bg-white text-slate-700 transition-all hover:bg-slate-50 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:h-9 sm:w-9 md:hidden"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="mt-2 rounded-3xl border border-slate-200/80 bg-white p-3.5 shadow-2xl duration-150 animate-in fade-in slide-in-from-top-2 dark:border-slate-800 dark:bg-slate-900 md:hidden">
            {/* Auth Banner for Mobile Guests */}
            {!session?.user && (
              <div className="mb-3 flex items-center justify-between gap-2.5 rounded-2xl border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-800/60">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                      Masuk ke Akun
                    </p>
                    <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                      Nikmati promo & cek pesanan
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="shadow-xs rounded-xl bg-orange-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-600"
                  >
                    Daftar
                  </Link>
                </div>
              </div>
            )}

            {/* Profile Banner for Mobile Logged-in Users */}
            {session?.user && (
              <div className="mb-3 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-800/60">
                {avatarUrl ? (
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-slate-200/80 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                    <img
                      src={avatarUrl}
                      alt={session.user.name || 'Avatar'}
                      className="h-full w-full object-cover"
                      onError={() => setAvatarUrl(null)}
                    />
                  </div>
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white dark:bg-blue-600">
                    {(session.user.name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                    {session.user.name}
                  </p>
                  <p className="truncate text-[10px] text-slate-400">
                    {session.user.email}
                  </p>
                </div>
                <Link
                  href={getDashboardLink()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="shrink-0 rounded-xl bg-slate-950 px-2.5 py-1 text-[11px] font-bold text-white dark:bg-white dark:text-slate-950"
                >
                  Dashboard
                </Link>
              </div>
            )}

            {/* Search Input for Mobile (Hidden on /gadget and /toko) */}
            {!isSearchPage && (
              <form onSubmit={handleSearchSubmit} className="relative mb-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari gadget..."
                  className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs outline-none focus:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              </form>
            )}

            {/* Links List */}
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== '/' && pathname.startsWith(link.href))
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-xs font-bold transition-colors ${
                      isActive
                        ? 'bg-slate-950 text-white dark:bg-blue-600'
                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{link.label}</span>
                    <ArrowRight className="h-3.5 w-3.5 opacity-40" />
                  </Link>
                )
              })}

              <Link
                href="/servis-lcd"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-xs font-bold transition-colors ${
                  pathname === '/servis-lcd'
                    ? 'bg-slate-950 text-white dark:bg-blue-600'
                    : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <span>Servis LCD Kilat</span>
                <ArrowRight className="h-3.5 w-3.5 opacity-40" />
              </Link>

              <Link
                href="/garansi"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-xs font-bold transition-colors ${
                  pathname === '/garansi'
                    ? 'bg-slate-950 text-white dark:bg-blue-600'
                    : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <span>Garansi 30 Hari</span>
                <ArrowRight className="h-3.5 w-3.5 opacity-40" />
              </Link>

              {session?.user && (
                <button
                  type="button"
                  onClick={() => {
                    cartSetUserId(null)
                    setMobileMenuOpen(false)
                    signOut({ callbackUrl: '/' })
                  }}
                  className="mt-2 flex w-full items-center justify-between rounded-xl border border-red-100 bg-red-50/50 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-100 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400"
                >
                  <span className="flex items-center gap-2">
                    <LogOut className="h-3.5 w-3.5" /> Keluar
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 opacity-40" />
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Navbar
