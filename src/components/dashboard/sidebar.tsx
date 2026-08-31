'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Wrench,
  Calendar,
  DollarSign,
  MessageSquare,
  BarChart3,
  Store,
  AlertTriangle,
  ExternalLink,
  Smartphone,
  ChevronRight,
  ShieldCheck,
  PanelLeftClose,
  Wallet,
  RotateCcw,
} from 'lucide-react'
import { useSidebar } from '@/context/sidebar-context'

interface NavItem {
  icon: React.ElementType
  label: string
  href: string
  badge?: string
  isLive?: boolean
}

interface NavSection {
  title: string
  items: NavItem[]
}

// Super Admin Navigation (Melihat seluruh aktivitas platform & semua toko)
const superAdminNavSections: NavSection[] = [
  {
    title: 'Utama',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/admin' },
    ],
  },
  {
    title: 'Katalog & Toko',
    items: [
      { icon: Smartphone, label: 'Katalog Gadget', href: '/dashboard/admin/products' },
      { icon: ShoppingCart, label: 'Pesanan', href: '/dashboard/admin/orders' },
      { icon: Store, label: 'Daftar Toko', href: '/dashboard/admin/mitras' },
    ],
  },
  {
    title: 'Operasional',
    items: [
      { icon: ShieldCheck, label: 'Klaim Garansi', href: '/dashboard/admin/complaints' },
      { icon: RotateCcw, label: 'Pengembalian', href: '/dashboard/admin/returns' },
      { icon: BarChart3, label: 'Laporan Finansial', href: '/dashboard/admin/reports' },
    ],
  },
  {
    title: 'Sistem',
    items: [
      { icon: Users, label: 'Kelola Pengguna', href: '/dashboard/admin/users' },
      { icon: Settings, label: 'Pengaturan', href: '/dashboard/admin/settings' },
    ],
  },
]

// Admin Platform Navigation (Mengelola platform tanpa akses detail omzet/pesanan internal per toko)
const adminPlatformNavSections: NavSection[] = [
  {
    title: 'Utama',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/admin' },
    ],
  },
  {
    title: 'Katalog & Toko',
    items: [
      { icon: Smartphone, label: 'Katalog Gadget', href: '/dashboard/admin/products' },
      { icon: Store, label: 'Daftar Toko', href: '/dashboard/admin/mitras' },
    ],
  },
  {
    title: 'Layanan',
    items: [
      { icon: ShieldCheck, label: 'Klaim Garansi', href: '/dashboard/admin/complaints' },
      { icon: RotateCcw, label: 'Pengembalian', href: '/dashboard/admin/returns' },
    ],
  },
  {
    title: 'Sistem',
    items: [
      { icon: Settings, label: 'Pengaturan', href: '/dashboard/admin/settings' },
    ],
  },
]

// Store Admin Navigation (Mengelola toko miliknya sendiri sesuai blueprint)
const storeAdminNavSections: NavSection[] = [
  {
    title: 'Utama',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/admin' },
    ],
  },
  {
    title: 'Operasional',
    items: [
      { icon: Smartphone, label: 'Katalog Gadget', href: '/dashboard/admin/products' },
      { icon: ShoppingCart, label: 'Pesanan', href: '/dashboard/admin/orders' },
      { icon: Wallet, label: 'Keuangan', href: '/dashboard/admin/finance' },
      { icon: MessageSquare, label: 'Pesan', href: '/dashboard/admin/chat' },
      { icon: ShieldCheck, label: 'Klaim Garansi', href: '/dashboard/admin/complaints' },
      { icon: RotateCcw, label: 'Pengembalian', href: '/dashboard/admin/returns' },
    ],
  },
  {
    title: 'Pengaturan',
    items: [
      { icon: Settings, label: 'Profil Toko', href: '/dashboard/admin/settings' },
    ],
  },
]

// Customer Navigation
const customerNavSections: NavSection[] = [
  {
    title: 'Akun Pembeli',
    items: [
      { icon: LayoutDashboard, label: 'Beranda', href: '/' },
      { icon: ShoppingCart, label: 'Pesanan Saya', href: '/dashboard/customer/orders' },
      { icon: ShieldCheck, label: 'Klaim Garansi', href: '/garansi' },
      { icon: Settings, label: 'Pengaturan', href: '/dashboard/customer/settings' },
    ],
  },
]

interface SidebarProps {
  variant?: 'dark' | 'light'
  forceRole?: string
}

export function Sidebar({ variant = 'light', forceRole }: SidebarProps) {
  // Safe use of sidebar context
  let sidebarCtx: ReturnType<typeof useSidebar> | null = null
  try {
    sidebarCtx = useSidebar()
  } catch {
    // Fallback if rendered outside provider
  }

  const [localOpen, setLocalOpen] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()

  const isMobileOpen = sidebarCtx ? sidebarCtx.isMobileOpen : localOpen
  const isCollapsed = sidebarCtx ? sidebarCtx.isCollapsed : false
  const toggleCollapse = () => {
    if (sidebarCtx) {
      sidebarCtx.toggleCollapse()
    }
  }
  const toggleMobile = () => {
    if (sidebarCtx) {
      sidebarCtx.toggleMobile()
    } else {
      setLocalOpen((prev) => !prev)
    }
  }
  const closeMobile = () => {
    if (sidebarCtx) {
      sidebarCtx.closeMobile()
    } else {
      setLocalOpen(false)
    }
  }

  const effectiveRole = forceRole || session?.user.role

  // Determine sections based on user role
  const navSections = useMemo(() => {
    if (effectiveRole === 'CUSTOMER') {
      return customerNavSections
    }
    if (effectiveRole === 'STORE_ADMIN') {
      return storeAdminNavSections
    }
    if (effectiveRole === 'ADMIN') {
      return adminPlatformNavSections
    }
    return superAdminNavSections
  }, [effectiveRole])

  const isLight = variant === 'light'

  // Helper to check if item is active
  const checkIsActive = (href: string) => {
    if (
      href === '/dashboard/admin' ||
      href === '/dashboard/mitra'
    ) {
      return pathname === href
    }
    return pathname === href || (href !== '/' && pathname.startsWith(href + '/'))
  }

  // Get user initials
  const userInitials = useMemo(() => {
    const name = session?.user?.name || 'Admin'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }, [session?.user?.name])

  return (
    <>
      {/* Mobile Menu Toggle Button (Floating when header is not visible) */}
      <button
        onClick={toggleMobile}
        aria-label={isMobileOpen ? 'Tutup Menu Navigasi' : 'Buka Menu Navigasi'}
        className={`fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white/90 text-slate-800 shadow-md backdrop-blur-md transition-all active:scale-95 lg:hidden dark:border-slate-800 dark:bg-slate-900/90 dark:text-white`}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs transition-opacity lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen transform border-r transition-all duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${
          isCollapsed ? 'lg:w-16' : 'lg:w-64'
        } ${
          isLight
            ? 'border-slate-200/80 bg-white shadow-[1px_0_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-950'
            : 'border-slate-800 bg-slate-950 text-white'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Brand Header with Desktop Collapse Button */}
          <div
            className={`flex h-16 items-center border-b border-slate-100 dark:border-slate-800/80 ${
              isCollapsed
                ? 'justify-center px-2'
                : 'justify-between px-4'
            }`}
          >
            {!isCollapsed ? (
              <>
                <Link
                  href="/"
                  className="group flex items-center gap-2.5 transition-opacity hover:opacity-90 min-w-0"
                >
                  <img
                    src="/logo.png"
                    alt="Affiliate Gadget Logo"
                    className="h-7 w-7 rounded-lg object-contain shadow-2xs shrink-0"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-black tracking-tight text-slate-950 dark:text-white leading-tight truncate">
                      Affiliate<span className="text-orange-500">Gadget</span>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 leading-none">
                      Admin
                    </span>
                  </div>
                </Link>

                {/* Desktop Collapse Button */}
                <button
                  onClick={toggleCollapse}
                  aria-label="Sembunyikan Sidebar"
                  title="Sembunyikan Sidebar"
                  className="hidden lg:flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition active:scale-95"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="hidden lg:flex w-full flex-col items-center justify-center">
                <button
                  onClick={toggleCollapse}
                  aria-label="Buka Sidebar Lengkap"
                  className="group relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition active:scale-95"
                >
                  <img
                    src="/logo.png"
                    alt="Logo"
                    className="h-6 w-6 rounded-lg object-contain shadow-2xs group-hover:opacity-0 transition-opacity"
                  />
                  <PanelLeftClose className="absolute h-4 w-4 text-orange-500 rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Tooltip */}
                  <div className="pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 opacity-0 invisible scale-95 group-hover:opacity-100 group-hover:visible group-hover:scale-100 transition-all duration-150 z-50 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-xl dark:bg-white dark:text-slate-950 whitespace-nowrap">
                    Buka Sidebar
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Scrollable Navigation */}
          <nav
            className={`flex-1 overflow-y-auto py-3 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 ${
              isCollapsed ? 'px-2' : 'px-3.5'
            }`}
          >
            <div className="space-y-4">
              {navSections.map((section, idx) => (
                <div key={section.title || idx} className="space-y-1">
                  {/* Micro Section Title or Minimal Divider in Mini Mode */}
                  {!isCollapsed ? (
                    <p className="px-2.5 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {section.title}
                    </p>
                  ) : (
                    idx > 0 && (
                      <div className="my-2 border-t border-slate-100 dark:border-slate-800/80" />
                    )
                  )}

                  {/* Section Links */}
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon
                      const isActive = checkIsActive(item.href)

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={closeMobile}
                          className={`group relative flex items-center rounded-xl text-xs font-medium transition-all duration-150 ${
                            isCollapsed
                              ? 'h-10 w-10 mx-auto justify-center'
                              : 'justify-between px-2.5 py-2'
                          } ${
                            isActive
                              ? 'bg-slate-900 text-white font-semibold shadow-xs dark:bg-white dark:text-slate-950'
                              : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-900/70 dark:hover:text-white'
                          }`}
                        >
                          <div
                            className={`flex items-center gap-2.5 ${
                              isCollapsed ? 'justify-center' : 'truncate'
                            }`}
                          >
                            <Icon
                              className={`h-4 w-4 shrink-0 transition-colors ${
                                isActive
                                  ? 'text-white dark:text-slate-950'
                                  : 'text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-300'
                              }`}
                            />
                            {!isCollapsed && (
                              <span className="truncate">{item.label}</span>
                            )}
                          </div>

                          {/* Expanded Live Indicator & Badge */}
                          {!isCollapsed && item.isLive && (
                            <span className="flex h-2 w-2 items-center justify-center">
                              <span className="absolute h-2 w-2 animate-ping rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            </span>
                          )}

                          {!isCollapsed && item.badge && !item.isLive && (
                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                                isActive
                                  ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-950'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}

                          {/* Collapsed Floating Tooltip on Hover */}
                          {isCollapsed && (
                            <div className="pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 opacity-0 invisible scale-95 group-hover:opacity-100 group-hover:visible group-hover:scale-100 transition-all duration-150 z-50 flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xl dark:bg-white dark:text-slate-950 whitespace-nowrap">
                              <span>{item.label}</span>
                              {item.badge && (
                                <span className="rounded bg-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                                  {item.badge}
                                </span>
                              )}
                              {item.isLive && (
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                              )}
                            </div>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          {/* Footer Area: Public Link & User Profile */}
          <div
            className={`border-t border-slate-100 bg-slate-50/50 dark:border-slate-800/80 dark:bg-slate-950 ${
              isCollapsed ? 'p-2 space-y-2' : 'p-3 space-y-2'
            }`}
          >
            {/* View Public Storefront Link */}
            {!isCollapsed ? (
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                  <span>Lihat Web Publik</span>
                </span>
                <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-600" />
              </Link>
            ) : (
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex h-10 w-10 mx-auto items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
              >
                <ExternalLink className="h-4 w-4" />
                {/* Tooltip */}
                <div className="pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 opacity-0 invisible scale-95 group-hover:opacity-100 group-hover:visible group-hover:scale-100 transition-all duration-150 z-50 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xl dark:bg-white dark:text-slate-950 whitespace-nowrap">
                  Lihat Toko Publik
                </div>
              </Link>
            )}

            {/* User Profile Section */}
            {!isCollapsed ? (
              <div className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-white p-2 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* User Avatar */}
                  {session?.user?.image ? (
                    <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-lg border border-slate-200/80 bg-slate-100 dark:border-slate-700">
                      <img
                        src={session.user.image}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
                    </div>
                  ) : (
                    <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-[11px] font-black text-white dark:bg-white dark:text-slate-950">
                      {userInitials}
                      <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
                    </div>
                  )}

                  {/* User Info */}
                  <div className="flex flex-col min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                      {(session?.user?.name || 'Administrator').replace(/Multi-PT/gi, '').trim() || 'Super Admin'}
                    </p>
                    <span className="truncate text-[10px] font-medium text-slate-400 dark:text-slate-500 leading-none mt-0.5">
                      {effectiveRole === 'STORE_ADMIN'
                        ? 'Akun Toko'
                        : effectiveRole === 'SUPER_ADMIN'
                        ? 'Superadmin Platform'
                        : effectiveRole === 'ADMIN'
                        ? 'Admin Platform'
                        : 'Customer'}
                    </span>
                  </div>
                </div>

                {/* Sign Out Button */}
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  title="Keluar dari Panel Admin"
                  aria-label="Keluar"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="group relative flex flex-col items-center">
                {session?.user?.image ? (
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    aria-label="Keluar"
                    className="relative flex h-10 w-10 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xs hover:opacity-80 transition"
                  >
                    <img
                      src={session.user.image}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
                  </button>
                ) : (
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    aria-label="Keluar"
                    className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-[11px] font-black text-white shadow-2xs hover:bg-red-600 transition-colors dark:bg-white dark:text-slate-950 dark:hover:bg-red-600 dark:hover:text-white"
                  >
                    {userInitials}
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
                  </button>
                )}

                {/* Floating Tooltip with Logout */}
                <div className="pointer-events-none absolute left-full bottom-0 ml-3 opacity-0 invisible scale-95 group-hover:opacity-100 group-hover:visible group-hover:scale-100 transition-all duration-150 z-50 flex flex-col gap-1 rounded-xl bg-slate-900 p-2.5 text-xs text-white shadow-xl dark:bg-slate-800 dark:text-slate-100 whitespace-nowrap min-w-36">
                  <p className="font-bold text-white truncate">
                    {(session?.user?.name || 'Administrator').replace(/Multi-PT/gi, '').trim() || 'Super Admin'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {session?.user?.role || 'SUPER_ADMIN'}
                  </p>
                  <div className="mt-1 border-t border-slate-800 pt-1 text-[10px] text-red-400 font-semibold">
                    Klik untuk Logout ↗
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

    </>
  )
}
