'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import {
  LogOut,
  User,
  Menu,
  X,
  ChevronDown,
  ShoppingBag,
  Heart,
  Settings,
  LayoutDashboard,
} from 'lucide-react'
import CartIcon from '@/components/cart/cart-icon'

interface NavbarProps {
  variant?: 'dark' | 'light'
}

export function Navbar({ variant = 'dark' }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [layananOpen, setLayananOpen] = useState(false)
  const { data: session, status } = useSession()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
    setLayananOpen(false)
  }, [])

  const isLight = variant === 'light'

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
    if (mobileMenuOpen) {
      setLayananOpen(false)
    }
  }

  return (
    <nav
      className={`fixed top-0 z-50 w-full transition-all duration-500 ${
        isLight
          ? scrolled || mobileMenuOpen
            ? 'bg-white/95 shadow-lg backdrop-blur-md'
            : 'bg-white/90 shadow-md backdrop-blur-sm'
          : scrolled || mobileMenuOpen
            ? 'bg-gray-900/95 shadow-lg backdrop-blur-md'
            : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between sm:h-20">
          <Link
            href="/"
            className={`bg-gradient-to-r text-2xl font-bold sm:text-3xl ${
              isLight
                ? 'from-cyan-600 to-blue-600'
                : 'from-cyan-400 to-blue-500'
            } bg-clip-text text-transparent`}
          >
            HaloTekno
          </Link>

          {/* Spacer to push everything to the right */}
          <div className="flex-1"></div>

          {/* Desktop Navigation Menu + Auth Buttons - All on the right */}
          <div className="hidden items-center gap-4 md:flex">
            {/* Navigation Links */}
            <div className="group relative">
              <button
                className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors ${
                  isLight
                    ? 'text-gray-700 hover:text-blue-600'
                    : 'text-gray-100 hover:text-cyan-400'
                }`}
              >
                Layanan
                <ChevronDown className="h-4 w-4" />
              </button>
              {/* Dropdown Menu */}
              <div
                className={`invisible absolute left-0 mt-2 w-48 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100 ${
                  isLight ? 'bg-white' : 'bg-gray-800'
                } rounded-lg py-2 shadow-lg`}
              >
                <Link
                  href="/teknisi"
                  className={`block px-4 py-2 text-sm transition-colors ${
                    isLight
                      ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                      : 'text-gray-100 hover:bg-gray-700 hover:text-cyan-400'
                  }`}
                >
                  Servis HP
                </Link>
                <Link
                  href="/sparepart"
                  className={`block px-4 py-2 text-sm transition-colors ${
                    isLight
                      ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                      : 'text-gray-100 hover:bg-gray-700 hover:text-cyan-400'
                  }`}
                >
                  Sparepart
                </Link>
                <Link
                  href="/sewa-alat"
                  className={`block px-4 py-2 text-sm transition-colors ${
                    isLight
                      ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                      : 'text-gray-100 hover:bg-gray-700 hover:text-cyan-400'
                  }`}
                >
                  Sewa Alat
                </Link>
                <Link
                  href="/rekomendasi"
                  className={`block px-4 py-2 text-sm transition-colors ${
                    isLight
                      ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                      : 'text-gray-100 hover:bg-gray-700 hover:text-cyan-400'
                  }`}
                >
                  Direktori Mitra
                </Link>
              </div>
            </div>

            <Link
              href="/about"
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                isLight
                  ? 'text-gray-700 hover:text-blue-600'
                  : 'text-gray-100 hover:text-cyan-400'
              }`}
            >
              Tentang
            </Link>

            <Link
              href="/blog"
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                isLight
                  ? 'text-gray-700 hover:text-blue-600'
                  : 'text-gray-100 hover:text-cyan-400'
              }`}
            >
              Blog
            </Link>

            {/* Cart Icon - Only for customers and mitra */}
            {(!session ||
              (session.user.role !== 'ADMIN' &&
                !session.user.isTechnician)) && (
              <CartIcon variant={isLight ? 'light' : 'dark'} />
            )}

            {status === 'loading' ? (
              <div
                className={`h-8 w-8 border-2 ${
                  isLight ? 'border-blue-600' : 'border-cyan-500'
                } animate-spin rounded-full border-t-transparent`}
              ></div>
            ) : session ? (
              <div className="group relative">
                <button
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isLight
                      ? 'text-gray-700 hover:bg-gray-100'
                      : 'text-gray-100 hover:bg-gray-800'
                  }`}
                >
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${isLight ? 'bg-blue-100' : 'bg-gray-700'}`}
                    >
                      <User
                        className={`h-4 w-4 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`}
                      />
                    </div>
                  )}
                  <span className="max-w-[120px] truncate">
                    {session.user.name || 'Akun Saya'}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {/* Profile Dropdown */}
                <div
                  className={`invisible absolute right-0 mt-2 w-56 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100 ${isLight ? 'bg-white' : 'bg-gray-800'} rounded-xl border py-2 shadow-lg ${isLight ? 'border-gray-200' : 'border-gray-700'}`}
                >
                  <div
                    className={`border-b px-4 py-3 ${isLight ? 'border-gray-200' : 'border-gray-700'}`}
                  >
                    <p
                      className={`text-sm font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}
                    >
                      {session.user.name || 'User'}
                    </p>
                    <p
                      className={`truncate text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}
                    >
                      {session.user.email}
                    </p>
                  </div>
                  <Link
                    href={
                      session.user.role === 'SUPER_ADMIN' ||
                      session.user.role === 'ADMIN'
                        ? '/dashboard/admin'
                        : session.user.role === 'MITRA'
                          ? '/dashboard/mitra'
                          : session.user.isTechnician
                            ? '/dashboard/teknisi'
                            : '/dashboard/customer'
                    }
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      isLight
                        ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                        : 'text-gray-100 hover:bg-gray-700 hover:text-cyan-400'
                    }`}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  {/* Mitra-only menu items */}
                  {session.user.role === 'MITRA' && (
                    <Link
                      href="/dashboard/mitra/profile/edit"
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        isLight
                          ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                          : 'text-gray-100 hover:bg-gray-700 hover:text-cyan-400'
                      }`}
                    >
                      <User className="h-4 w-4" />
                      Edit Profil
                    </Link>
                  )}
                  {/* Technician-only menu items */}
                  {(session.user.role === 'TEKNISI' ||
                    session.user.isTechnician) && (
                    <Link
                      href="/dashboard/teknisi/orders"
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        isLight
                          ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                          : 'text-gray-100 hover:bg-gray-700 hover:text-cyan-400'
                      }`}
                    >
                      <ShoppingBag className="h-4 w-4" />
                      Pesanan Saya
                    </Link>
                  )}
                  {/* Customer-only menu items (exclude technicians) */}
                  {session.user.role === 'CUSTOMER' &&
                    !session.user.isTechnician && (
                      <>
                        <Link
                          href="/dashboard/customer/orders"
                          className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                            isLight
                              ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                              : 'text-gray-100 hover:bg-gray-700 hover:text-cyan-400'
                          }`}
                        >
                          <ShoppingBag className="h-4 w-4" />
                          Pesanan Saya
                        </Link>
                        <Link
                          href="/dashboard/customer/wishlist"
                          className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                            isLight
                              ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                              : 'text-gray-100 hover:bg-gray-700 hover:text-cyan-400'
                          }`}
                        >
                          <Heart className="h-4 w-4" />
                          Wishlist
                        </Link>
                      </>
                    )}
                  {/* Settings link for all users - moved to bottom */}
                  <Link
                    href={
                      session.user.role === 'ADMIN'
                        ? '/dashboard/admin/settings'
                        : session.user.role === 'MITRA'
                          ? '/dashboard/mitra/settings'
                          : session.user.isTechnician
                            ? '/dashboard/teknisi/settings'
                            : '/dashboard/customer/settings'
                    }
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      isLight
                        ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                        : 'text-gray-100 hover:bg-gray-700 hover:text-cyan-400'
                    }`}
                  >
                    <Settings className="h-4 w-4" />
                    Pengaturan
                  </Link>
                  <div
                    className={`my-2 border-t ${isLight ? 'border-gray-200' : 'border-gray-700'}`}
                  ></div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      isLight
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-red-400 hover:bg-gray-700'
                    }`}
                  >
                    <LogOut className="h-4 w-4" />
                    Keluar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className={`px-6 py-3 text-sm font-semibold ${
                    isLight
                      ? 'text-gray-700 hover:text-blue-600'
                      : 'text-gray-100 hover:text-cyan-400'
                  } transition-colors`}
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className={`rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-3 font-semibold text-white hover:shadow-lg ${
                    isLight
                      ? 'hover:shadow-blue-500/50'
                      : 'hover:shadow-cyan-500/50'
                  } transform text-sm transition-all duration-300 hover:scale-105`}
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Burger Button */}
          <button
            onClick={toggleMobileMenu}
            className={`rounded-lg p-2 transition-colors md:hidden ${
              isLight
                ? 'text-gray-700 hover:bg-gray-100'
                : 'text-white hover:bg-gray-800'
            }`}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div
          className={`space-y-2 px-4 py-4 ${
            isLight
              ? 'border-t border-gray-100 bg-white'
              : 'border-t border-gray-800 bg-gray-900'
          }`}
        >
          {/* Layanan Dropdown */}
          <div>
            <button
              onClick={() => setLayananOpen(!layananOpen)}
              className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-left font-medium transition-colors ${
                isLight
                  ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  : 'text-gray-100 hover:bg-gray-800 hover:text-cyan-400'
              }`}
            >
              Layanan
              <ChevronDown
                className={`h-5 w-5 transition-transform duration-200 ${layananOpen ? 'rotate-180' : ''}`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-200 ${layananOpen ? 'max-h-52' : 'max-h-0'}`}
            >
              <div className="space-y-1 py-2 pl-4">
                <Link
                  href="/teknisi"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block rounded-lg px-4 py-2 text-sm transition-colors ${
                    isLight
                      ? 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-cyan-400'
                  }`}
                >
                  Servis HP
                </Link>
                <Link
                  href="/sparepart"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block rounded-lg px-4 py-2 text-sm transition-colors ${
                    isLight
                      ? 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-cyan-400'
                  }`}
                >
                  Sparepart
                </Link>
                <Link
                  href="/sewa-alat"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block rounded-lg px-4 py-2 text-sm transition-colors ${
                    isLight
                      ? 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-cyan-400'
                  }`}
                >
                  Sewa Alat
                </Link>
                <Link
                  href="/rekomendasi"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block rounded-lg px-4 py-2 text-sm transition-colors ${
                    isLight
                      ? 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-cyan-400'
                  }`}
                >
                  Direktori Mitra
                </Link>
              </div>
            </div>
          </div>

          {/* Other Links */}
          <Link
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className={`block rounded-lg px-4 py-3 font-medium transition-colors ${
              isLight
                ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                : 'text-gray-100 hover:bg-gray-800 hover:text-cyan-400'
            }`}
          >
            Tentang
          </Link>

          <Link
            href="/blog"
            onClick={() => setMobileMenuOpen(false)}
            className={`block rounded-lg px-4 py-3 font-medium transition-colors ${
              isLight
                ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                : 'text-gray-100 hover:bg-gray-800 hover:text-cyan-400'
            }`}
          >
            Blog
          </Link>

          {/* Cart Icon - Mobile */}
          <div className="px-4 py-2">
            <CartIcon variant={isLight ? 'light' : 'dark'} />
          </div>

          {/* Divider */}
          <div
            className={`my-3 border-t ${isLight ? 'border-gray-200' : 'border-gray-700'}`}
          ></div>

          {/* Mobile Auth Buttons */}
          {status === 'loading' ? (
            <div className="flex justify-center py-4">
              <div
                className={`h-8 w-8 border-2 ${
                  isLight ? 'border-blue-600' : 'border-cyan-500'
                } animate-spin rounded-full border-t-transparent`}
              ></div>
            </div>
          ) : session ? (
            <div className="space-y-2">
              {/* User Info */}
              <div
                className={`px-4 py-3 ${isLight ? 'bg-gray-50' : 'bg-gray-800'} rounded-lg`}
              >
                <p
                  className={`text-sm font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}
                >
                  {session.user.name || 'User'}
                </p>
                <p
                  className={`truncate text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}
                >
                  {session.user.email}
                </p>
              </div>

              {/* Dashboard Link */}
              <Link
                href={
                  session.user.role === 'SUPER_ADMIN' ||
                  session.user.role === 'ADMIN'
                    ? '/dashboard/admin'
                    : session.user.role === 'MITRA'
                      ? '/dashboard/mitra'
                      : session.user.isTechnician
                        ? '/dashboard/teknisi'
                        : '/dashboard/customer'
                }
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 font-medium transition-colors ${
                  isLight
                    ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                    : 'text-gray-100 hover:bg-gray-800 hover:text-cyan-400'
                }`}
              >
                <LayoutDashboard className="h-5 w-5" />
                Dashboard
              </Link>

              {/* Mitra-only menu items */}
              {session.user.role === 'MITRA' && (
                <Link
                  href="/dashboard/mitra/profile/edit"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 font-medium transition-colors ${
                    isLight
                      ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                      : 'text-gray-100 hover:bg-gray-800 hover:text-cyan-400'
                  }`}
                >
                  <User className="h-5 w-5" />
                  Edit Profil
                </Link>
              )}

              {/* Technician-only menu items */}
              {(session.user.role === 'TEKNISI' ||
                session.user.isTechnician) && (
                <Link
                  href="/dashboard/teknisi/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 font-medium transition-colors ${
                    isLight
                      ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                      : 'text-gray-100 hover:bg-gray-800 hover:text-cyan-400'
                  }`}
                >
                  <ShoppingBag className="h-5 w-5" />
                  Pesanan Saya
                </Link>
              )}

              {/* Customer-only menu items (exclude technicians) */}
              {session.user.role === 'CUSTOMER' &&
                !session.user.isTechnician && (
                  <>
                    <Link
                      href="/dashboard/customer/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 font-medium transition-colors ${
                        isLight
                          ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                          : 'text-gray-100 hover:bg-gray-800 hover:text-cyan-400'
                      }`}
                    >
                      <ShoppingBag className="h-5 w-5" />
                      Pesanan Saya
                    </Link>
                    <Link
                      href="/dashboard/customer/wishlist"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 font-medium transition-colors ${
                        isLight
                          ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                          : 'text-gray-100 hover:bg-gray-800 hover:text-cyan-400'
                      }`}
                    >
                      <Heart className="h-5 w-5" />
                      Wishlist
                    </Link>
                  </>
                )}

              {/* Settings link for all users */}
              <Link
                href={
                  session.user.role === 'ADMIN'
                    ? '/dashboard/admin/settings'
                    : session.user.role === 'MITRA'
                      ? '/dashboard/mitra/settings'
                      : session.user.isTechnician
                        ? '/dashboard/teknisi/settings'
                        : '/dashboard/customer/settings'
                }
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 font-medium transition-colors ${
                  isLight
                    ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                    : 'text-gray-100 hover:bg-gray-800 hover:text-cyan-400'
                }`}
              >
                <Settings className="h-5 w-5" />
                Pengaturan
              </Link>

              {/* Logout Button */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  signOut({ callbackUrl: '/' })
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 font-medium transition-colors ${
                  isLight
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-red-400 hover:bg-gray-800'
                }`}
              >
                <LogOut className="h-5 w-5" />
                Keluar
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className={`block rounded-lg px-4 py-3 text-center font-medium transition-colors ${
                  isLight
                    ? 'text-gray-700 hover:bg-gray-100'
                    : 'text-gray-100 hover:bg-gray-800'
                }`}
              >
                Masuk
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-center font-medium text-white transition-all hover:shadow-lg"
              >
                Daftar
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
