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

  const { items } = useCartStore()
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(session?.user?.image || null)

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
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
    if (!mounted || !session) return '/login?callbackUrl=/dashboard/customer/chat'
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
    if ((session.user as any)?.isTechnician || role === 'TECHNICIAN') return '/dashboard/teknisi'
    return '/'
  }

  const navLinks = [
    { href: '/', label: 'Beranda' },
    { href: '/gadget', label: 'Produk' },
    { href: '/toko', label: 'Toko' },
  ]

  const isSearchPage = pathname.startsWith('/gadget') || pathname.startsWith('/toko')

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 shadow-[0_2px_20px_rgba(0,0,0,0.02)]'
          : 'bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border-b border-slate-100/70 dark:border-slate-900'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* 1. Brand Logo (Clean & High Contrast with Official Logo) */}
          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0 group focus:outline-none"
            aria-label="Affiliate Gadget Beranda"
          >
            <img
              src="/logo.png"
              alt="Affiliate Gadget Logo"
              className="h-8 w-8 rounded-xl object-contain shadow-2xs transition-transform duration-200 group-hover:scale-105"
            />
            <span className="text-base font-black tracking-tight text-slate-950 dark:text-white leading-none">
              Affiliate<span className="text-orange-500">Gadget</span>
            </span>
          </Link>

          {/* 2. Center: Dedicated Floating Nav Island (Ultra-Clean Whitespace) */}
          <nav className="hidden md:flex items-center rounded-full bg-slate-100/70 p-1 backdrop-blur-xs border border-slate-200/40 dark:bg-slate-900/60 dark:border-slate-800/60">
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
                      ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-white/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* 3. Right: Utility & Action Cluster */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Minimalist Search Capsule (Hidden on /gadget and /toko where in-page search is active) */}
            {!isSearchPage && (
              <form
                onSubmit={handleSearchSubmit}
                className="hidden lg:flex relative items-center animate-in fade-in duration-200"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari..."
                  className="w-32 xl:w-36 focus:w-48 rounded-full border border-slate-200/70 bg-slate-50/80 py-1.5 pl-8 pr-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-300 focus:border-slate-300 focus:bg-white focus:shadow-xs dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-100 dark:focus:border-slate-700"
                />
                <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </form>
            )}

            {/* Live Chat / Pesan Button (Placed Next to Cart) */}
            <Link
              href={getChatLink()}
              className={`relative flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 active:scale-95 ${
                pathname.startsWith('/dashboard/customer/chat') || pathname.startsWith('/dashboard/admin/chat')
                  ? 'border-slate-900 bg-slate-950 text-white shadow-xs dark:border-white dark:bg-white dark:text-slate-950'
                  : 'border-slate-200/70 bg-white text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
              aria-label="Pesan Live Chat"
              title="Pesan & Live Chat"
            >
              <MessageSquare className="h-4 w-4" />
            </Link>

            {/* Cart Button */}
            <Link
              href="/cart"
              className={`relative flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 active:scale-95 ${
                pathname === '/cart'
                  ? 'border-slate-900 bg-slate-950 text-white shadow-xs dark:border-white dark:bg-white dark:text-slate-950'
                  : 'border-slate-200/70 bg-white text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
              aria-label="Keranjang Belanja"
              title="Keranjang Belanja"
            >
              <ShoppingCart className="h-4 w-4" />
              {mounted && itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9.5px] font-semibold leading-none text-white shadow-xs animate-in zoom-in duration-150">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            {/* User Session Auth Control */}
            {!mounted || status === 'loading' ? (
              <div className="h-8 w-16 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
            ) : session?.user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 rounded-full border border-slate-200/70 bg-white py-1 pl-1 pr-2.5 text-xs font-semibold text-slate-800 shadow-xs transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  {avatarUrl ? (
                    <div className="relative h-6 w-6 overflow-hidden rounded-full border border-slate-200/80 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0">
                      <img
                        src={avatarUrl}
                        alt={session.user.name || 'Avatar'}
                        className="h-full w-full object-cover"
                        onError={() => setAvatarUrl(null)}
                      />
                    </div>
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-white font-black text-[10px] dark:bg-blue-600 shrink-0">
                      {(session.user.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-[80px] truncate hidden sm:inline-block">
                    {session.user.name?.split(' ')[0] || 'Akun'}
                  </span>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150 z-50">
                    <div className="flex items-center gap-3 px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
                      {avatarUrl ? (
                        <div className="relative h-9 w-9 overflow-hidden rounded-full border border-slate-200/80 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0">
                          <img
                            src={avatarUrl}
                            alt={session.user.name || 'Avatar'}
                            className="h-full w-full object-cover"
                            onError={() => setAvatarUrl(null)}
                          />
                        </div>
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-white font-black text-xs shrink-0 dark:bg-blue-600">
                          {(session.user.name || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {session.user.name}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {session.user.email}
                        </p>
                        <span className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {(session.user as any)?.role || 'CUSTOMER'}
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      {((session.user as any)?.role === 'CUSTOMER' || !(session.user as any)?.role) ? (
                        <>
                          <Link
                            href="/dashboard/customer/orders"
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            <ShoppingBag className="h-3.5 w-3.5 text-slate-400" /> Pesanan Saya
                          </Link>
                          <Link
                            href="/dashboard/customer/settings"
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            <User className="h-3.5 w-3.5 text-slate-400" /> Profil Saya
                          </Link>
                          <Link
                            href="/hubungi-kami"
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            <HelpCircle className="h-3.5 w-3.5 text-slate-400" /> Bantuan
                          </Link>
                        </>
                      ) : (
                        <Link
                          href={getDashboardLink()}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <User className="h-3.5 w-3.5 text-slate-400" /> Panel Dashboard
                        </Link>
                      )}
                    </div>

                    <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                      >
                        <LogOut className="h-3.5 w-3.5" /> Keluar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Link
                  href="/login"
                  className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-950 hover:bg-slate-100/70 transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-full bg-orange-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-orange-600 transition-all duration-200 active:scale-95"
                >
                  Daftar
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/70 bg-white text-slate-700 md:hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>

          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="mt-2 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xl md:hidden dark:border-slate-800 dark:bg-slate-900 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Search Input for Mobile (Hidden on /gadget and /toko) */}
            {!isSearchPage && (
              <form onSubmit={handleSearchSubmit} className="mb-3 relative">
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
                    className={`flex items-center justify-between rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                      isActive
                        ? 'bg-slate-950 text-white dark:bg-blue-600'
                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{link.label}</span>
                    <ArrowRight className="h-3 w-3 opacity-40" />
                  </Link>
                )
              })}
            </nav>
          </div>
        )}

      </div>
    </header>
  )
}

export default Navbar
