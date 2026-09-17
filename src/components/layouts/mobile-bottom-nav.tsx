'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Home, Smartphone, Store, ShoppingBag, User, LogIn } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart-store'
import { useEffect, useState } from 'react'

interface MobileBottomNavProps {
  activeTab?: 'beranda' | 'katalog' | 'toko' | 'keranjang' | 'akun' | 'none'
  showCartTab?: boolean
}

export function MobileBottomNav({
  activeTab,
  showCartTab = false,
}: MobileBottomNavProps) {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  const { items } = useCartStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  const isLoggedIn = mounted && status === 'authenticated' && !!session?.user
  const accountLabel = isLoggedIn ? 'Akun Saya' : 'Login'

  const itemCount =
    mounted && status === 'authenticated'
      ? items.reduce((sum, item) => sum + item.quantity, 0)
      : 0

  const isChatPage =
    pathname?.startsWith('/dashboard/customer/chat') ||
    pathname?.startsWith('/dashboard/admin/chat') ||
    pathname?.startsWith('/chat')

  const isCartPage = pathname?.startsWith('/cart')

  // Resolve current active tab if not explicitly given
  const currentTab =
    activeTab !== undefined
      ? activeTab
      : isChatPage || isCartPage
        ? 'none'
        : pathname === '/'
          ? 'beranda'
          : pathname.startsWith('/gadget')
            ? 'katalog'
            : pathname.startsWith('/toko')
              ? 'toko'
              : pathname.startsWith('/dashboard') ||
                  pathname.startsWith('/login') ||
                  pathname.startsWith('/register')
                ? 'akun'
                : 'beranda'

  const accountHref = isLoggedIn
    ? session?.user?.role === 'SUPER_ADMIN' ||
      session?.user?.role === 'ADMIN' ||
      session?.user?.role === 'STORE_ADMIN'
      ? '/dashboard/admin'
      : '/dashboard/customer/settings'
    : '/login?callbackUrl=/dashboard/customer/settings'

  return (
    <nav
      aria-label="Mobile Navigation Bar"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/80 bg-white/95 px-4 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.04)] backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95"
    >
      <div className="mx-auto flex max-w-md items-center justify-around">
        {/* 1. Beranda */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center px-3 py-1 transition-colors ${
            currentTab === 'beranda'
              ? 'font-bold text-orange-500'
              : 'font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Home
            className={`h-5 w-5 transition-transform ${
              currentTab === 'beranda' ? 'scale-110 text-orange-500' : ''
            }`}
            strokeWidth={currentTab === 'beranda' ? 2.5 : 1.8}
          />
          <span className="mt-1 text-[10px] tracking-tight">Beranda</span>
        </Link>

        {/* 2. Katalog */}
        <Link
          href="/gadget"
          className={`flex flex-col items-center justify-center px-3 py-1 transition-colors ${
            currentTab === 'katalog'
              ? 'font-bold text-orange-500'
              : 'font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Smartphone
            className={`h-5 w-5 transition-transform ${
              currentTab === 'katalog' ? 'scale-110 text-orange-500' : ''
            }`}
            strokeWidth={currentTab === 'katalog' ? 2.5 : 1.8}
          />
          <span className="mt-1 text-[10px] tracking-tight">Katalog</span>
        </Link>

        {/* 3. Toko */}
        <Link
          href="/toko"
          className={`flex flex-col items-center justify-center px-3 py-1 transition-colors ${
            currentTab === 'toko'
              ? 'font-bold text-orange-500'
              : 'font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Store
            className={`h-5 w-5 transition-transform ${
              currentTab === 'toko' ? 'scale-110 text-orange-500' : ''
            }`}
            strokeWidth={currentTab === 'toko' ? 2.5 : 1.8}
          />
          <span className="mt-1 text-[10px] tracking-tight">Toko</span>
        </Link>

        {/* Optional 4. Keranjang (if enabled) */}
        {showCartTab && (
          <Link
            href="/cart"
            className={`relative flex flex-col items-center justify-center px-3 py-1 transition-colors ${
              currentTab === 'keranjang'
                ? 'font-bold text-orange-500'
                : 'font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <ShoppingBag
                className={`h-5 w-5 transition-transform ${
                  currentTab === 'keranjang' ? 'scale-110 text-orange-500' : ''
                }`}
                strokeWidth={currentTab === 'keranjang' ? 2.5 : 1.8}
              />
              {itemCount > 0 && (
                <span className="absolute -right-2 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </div>
            <span className="mt-1 text-[10px] tracking-tight">Keranjang</span>
          </Link>
        )}

        {/* 4 (or 5). Akun Saya / Login */}
        <Link
          href={accountHref}
          className={`flex flex-col items-center justify-center px-3 py-1 transition-colors ${
            currentTab === 'akun'
              ? 'font-bold text-orange-500'
              : 'font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          {isLoggedIn ? (
            <User
              className={`h-5 w-5 transition-transform ${
                currentTab === 'akun' ? 'scale-110 text-orange-500' : ''
              }`}
              strokeWidth={currentTab === 'akun' ? 2.5 : 1.8}
            />
          ) : (
            <LogIn
              className={`h-5 w-5 transition-transform ${
                currentTab === 'akun' ? 'scale-110 text-orange-500' : ''
              }`}
              strokeWidth={currentTab === 'akun' ? 2.5 : 1.8}
            />
          )}
          <span className="mt-1 text-[10px] tracking-tight">
            {accountLabel}
          </span>
        </Link>
      </div>
    </nav>
  )
}
