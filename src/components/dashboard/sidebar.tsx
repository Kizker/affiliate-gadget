'use client'

import { useState } from 'react'
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
  MapPin,
  MessageSquare,
  PenSquare,
  BarChart3,
  Store,
  ChevronDown,
  FolderOpen,
  AlertTriangle,
} from 'lucide-react'

const customerMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/customer' },
  {
    icon: ShoppingCart,
    label: 'Pesanan Saya',
    href: '/dashboard/customer/orders',
  },
  { icon: MapPin, label: 'Alamat', href: '/dashboard/customer/addresses' },
  { icon: Settings, label: 'Pengaturan', href: '/dashboard/customer/settings' },
]

// Kelola dropdown items for SUPER_ADMIN
const kelolaItems = [
  { icon: Users, label: 'Kelola User', href: '/dashboard/admin/users' },
  { icon: Wrench, label: 'Teknisi', href: '/dashboard/admin/technicians' },
  { icon: Store, label: 'Mitra', href: '/dashboard/admin/mitras' },
  { icon: Package, label: 'Kelola Produk', href: '/dashboard/admin/products' },
  {
    icon: ShoppingCart,
    label: 'Kelola Order',
    href: '/dashboard/admin/orders',
  },
  {
    icon: AlertTriangle,
    label: 'Komplain',
    href: '/dashboard/admin/complaints',
  },
]

// Full admin menu for SUPER_ADMIN only
const superAdminMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/admin' },
  {
    icon: FolderOpen,
    label: 'Kelola',
    isDropdown: true,
    children: kelolaItems,
  },
  { icon: MessageSquare, label: 'Chat', href: '/dashboard/admin/chat' },
  { icon: PenSquare, label: 'Blog', href: '/dashboard/admin/blog' },
  { icon: BarChart3, label: 'Laporan', href: '/dashboard/admin/reports' },
  { icon: Settings, label: 'Pengaturan', href: '/dashboard/admin/settings' },
]

// Limited menu for ADMIN (Admin Chat) - only orders and chat
const adminChatMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/admin' },
  {
    icon: ShoppingCart,
    label: 'Kelola Order',
    href: '/dashboard/admin/orders',
  },
  { icon: MessageSquare, label: 'Chat', href: '/dashboard/admin/chat' },
  {
    icon: AlertTriangle,
    label: 'Komplain',
    href: '/dashboard/admin/complaints',
  },
  { icon: Settings, label: 'Pengaturan', href: '/dashboard/admin/settings' },
]

const mitraMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/mitra' },
  { icon: Wrench, label: 'Pekerjaan', href: '/dashboard/mitra/jobs' },
  { icon: Calendar, label: 'Jadwal', href: '/dashboard/mitra/schedule' },
  { icon: DollarSign, label: 'Pendapatan', href: '/dashboard/mitra/earnings' },
  { icon: Settings, label: 'Pengaturan', href: '/dashboard/mitra/settings' },
]

interface SidebarProps {
  variant?: 'dark' | 'light'
  forceRole?: 'ADMIN' | 'SUPER_ADMIN' | 'CUSTOMER' | 'MITRA'
}

export function Sidebar({ variant = 'dark', forceRole }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [kelolaOpen, setKelolaOpen] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()

  // Use forceRole if provided, otherwise use session role
  const effectiveRole = forceRole || session?.user.role

  // Determine menu based on role
  const menuItems =
    effectiveRole === 'SUPER_ADMIN'
      ? superAdminMenuItems
      : effectiveRole === 'ADMIN'
        ? adminChatMenuItems
        : effectiveRole === 'MITRA'
          ? mitraMenuItems
          : customerMenuItems

  const isLight = variant === 'light'

  // Check if any kelola item is active
  const isKelolaActive = kelolaItems.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed left-4 top-4 z-50 rounded-lg p-2 lg:hidden ${
          isLight
            ? 'bg-white text-gray-900 shadow-lg'
            : 'bg-gray-800 text-white'
        }`}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-64 transform border-r transition-transform duration-300 lg:sticky ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          isLight
            ? 'border-gray-200 bg-white shadow-sm'
            : 'border-gray-700/50 bg-gray-800/50 backdrop-blur-xl'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="border-b border-gray-200 px-6 py-5">
            <Link
              href="/"
              className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-2xl font-bold text-transparent"
            >
              HaloTekno
            </Link>
          </div>

          {/* User Profile Section */}
          {session?.user && (
            <div className="border-b border-gray-200 px-6 py-4">
              <div
                className={`rounded-lg p-3 ${isLight ? 'bg-gray-50' : 'bg-gray-700/30'}`}
              >
                <p
                  className={`text-xs font-medium uppercase tracking-wide ${isLight ? 'text-gray-500' : 'text-gray-400'}`}
                >
                  Admin
                </p>
                <p
                  className={`mt-1 truncate text-sm font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}
                >
                  {session.user.name}
                </p>
                <p
                  className={`truncate text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}
                >
                  {session.user.email}
                </p>
                <span className="mt-2 inline-block rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                  {session.user.role}
                </span>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-1">
              {menuItems.map((item, index) => {
                const Icon = item.icon

                // Handle dropdown menu
                if (
                  'isDropdown' in item &&
                  item.isDropdown &&
                  'children' in item
                ) {
                  return (
                    <div key={`dropdown-${index}`}>
                      <button
                        onClick={() => setKelolaOpen(!kelolaOpen)}
                        className={`group flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                          isKelolaActive
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                            : isLight
                              ? 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                              : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`h-5 w-5 flex-shrink-0 ${isKelolaActive ? 'text-white' : ''}`}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${kelolaOpen ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {/* Dropdown items */}
                      {kelolaOpen && (
                        <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-4">
                          {item.children.map((child) => {
                            const ChildIcon = child.icon
                            const isChildActive =
                              pathname === child.href ||
                              pathname.startsWith(child.href + '/')
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={() => setIsOpen(false)}
                                className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                                  isChildActive
                                    ? 'bg-blue-50 text-blue-600'
                                    : isLight
                                      ? 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                      : 'text-gray-400 hover:bg-gray-700/30 hover:text-white'
                                }`}
                              >
                                <ChildIcon
                                  className={`h-4 w-4 flex-shrink-0 ${isChildActive ? 'text-blue-600' : ''}`}
                                />
                                <span className="truncate">{child.label}</span>
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                }

                // Regular menu item
                if (!('href' in item) || !item.href) return null
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href as string}
                    onClick={() => setIsOpen(false)}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                        : isLight
                          ? 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                          : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : ''}`}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* Logout */}
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isLight
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-red-400 hover:bg-red-500/10'
              }`}
            >
              <LogOut className="h-5 w-5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
