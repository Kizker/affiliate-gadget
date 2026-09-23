'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { MessageSquare, ShoppingBag, ArrowLeft } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart-store'

interface MobileTopNavProps {
  chatHref?: string
  backHref?: string
  title?: string
  showBack?: boolean
  subtitle?: string
  onBack?: () => void
}

export function MobileTopNav({
  chatHref = '/dashboard/customer/chat',
  backHref,
  title,
  showBack = false,
  subtitle = 'GADGET SECOND GARANSI',
  onBack,
}: MobileTopNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { status } = useSession()
  const [mounted, setMounted] = useState(false)
  const { items } = useCartStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  const cartCount =
    mounted && status === 'authenticated'
      ? items.reduce((sum, item) => sum + item.quantity, 0)
      : 0

  const isChatActive =
    pathname?.startsWith('/dashboard/customer/chat') ||
    pathname?.startsWith('/dashboard/admin/chat') ||
    pathname?.startsWith('/chat')

  const isCartActive = pathname === '/cart'

  const handleBack = () => {
    if (onBack) {
      onBack()
      return
    }
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname
      window.history.back()

      // Fallback jika tidak ada riwayat navigasi sebelumnya di browser tab
      setTimeout(() => {
        if (
          typeof window !== 'undefined' &&
          window.location.pathname === currentPath
        ) {
          if (backHref) {
            router.push(backHref)
          } else {
            router.push('/')
          }
        }
      }, 250)
      return
    }

    if (backHref) {
      router.push(backHref)
    } else {
      router.push('/')
    }
  }

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95">
      {/* Left: Back Button OR Brand Logo */}
      {showBack ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-slate-200/80 bg-slate-50 text-slate-700 transition-all hover:text-orange-500 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            aria-label="Kembali"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          {title && (
            <h1 className="max-w-[200px] truncate text-base font-extrabold text-slate-900 dark:text-white">
              {title}
            </h1>
          )}
        </div>
      ) : (
        <Link href="/" className="flex items-center gap-2.5">
          <div className="shadow-xs flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 p-1.5">
            <Image
              src="/logo.png"
              alt="AffiliateGadget Logo"
              width={28}
              height={28}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase leading-none tracking-wider text-orange-500">
              {subtitle}
            </span>
            <span className="mt-0.5 text-[17px] font-extrabold leading-tight text-slate-900 dark:text-white">
              AffiliateGadget
            </span>
          </div>
        </Link>
      )}

      {/* Right Action Icons: Chat & Keranjang Belanja */}
      <div className="flex items-center gap-2">
        {/* Chat Icon */}
        <Link
          href={chatHref}
          className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all active:scale-95 ${
            isChatActive
              ? 'shadow-xs border-orange-500 bg-orange-50 text-orange-600 ring-2 ring-orange-500/20 dark:border-orange-500 dark:bg-orange-950/40 dark:text-orange-400'
              : 'border-slate-200/80 bg-slate-50 text-slate-700 hover:text-orange-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
          }`}
          aria-label="Chat"
          title="Chat"
        >
          <MessageSquare className="h-4 w-4" />
        </Link>

        {/* Cart Icon with badge */}
        <Link
          href="/cart"
          className={`relative flex h-9 w-9 items-center justify-center rounded-full border transition-all active:scale-95 ${
            isCartActive
              ? 'shadow-xs border-orange-500 bg-orange-50 text-orange-600 ring-2 ring-orange-500/20 dark:border-orange-500 dark:bg-orange-950/40 dark:text-orange-400'
              : 'border-slate-200/80 bg-slate-50 text-slate-700 hover:text-orange-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
          }`}
          aria-label="Keranjang Belanja"
        >
          <ShoppingBag className="h-4 w-4" />
          {mounted && cartCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-black text-white ring-2 ring-white animate-in zoom-in dark:ring-slate-950">
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
