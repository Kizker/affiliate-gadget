'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { MessageSquare, ShoppingBag, ArrowLeft, Search, X } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart-store'

interface MobileTopNavProps {
  chatHref?: string
  backHref?: string
  title?: string
  showBack?: boolean
  subtitle?: string
  onBack?: () => void
  searchable?: boolean
  searchValue?: string
  onSearchChange?: (val: string) => void
  onSearchSubmit?: (e?: React.FormEvent) => void
  onClearSearch?: () => void
  searchPlaceholder?: string
  scrollThreshold?: number
}

export function MobileTopNav({
  chatHref = '/dashboard/customer/chat',
  backHref,
  title,
  showBack = false,
  subtitle = 'GADGET SECOND GARANSI',
  onBack,
  searchable = true,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  onClearSearch,
  searchPlaceholder = 'Cari tipe iPhone, Galaxy, Xiaomi...',
  scrollThreshold = 35,
}: MobileTopNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { status } = useSession()
  const [mounted, setMounted] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [localSearch, setLocalSearch] = useState('')
  const stickyInputRef = useRef<HTMLInputElement>(null)
  const { items } = useCartStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Deteksi scroll: Logo berganti menjadi search bar panjang saat di-scroll
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0
      setIsScrolled(scrollY > scrollThreshold)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [scrollThreshold])

  const cartCount =
    mounted && status === 'authenticated'
      ? items.reduce((sum, item) => sum + item.quantity, 0)
      : 0

  const isChatActive =
    pathname?.startsWith('/dashboard/customer/chat') ||
    pathname?.startsWith('/dashboard/admin/chat')

  const isCartActive = pathname === '/cart'

  const effectiveSearchValue =
    searchValue !== undefined ? searchValue : localSearch

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSearchChange) {
      onSearchChange(e.target.value)
    } else {
      setLocalSearch(e.target.value)
    }
  }

  const handleClear = () => {
    if (onClearSearch) {
      onClearSearch()
    } else {
      setLocalSearch('')
    }
    if (stickyInputRef.current) {
      stickyInputRef.current.focus()
    }
  }

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (stickyInputRef.current) {
      stickyInputRef.current.blur()
    }
    if (onSearchSubmit) {
      onSearchSubmit(e)
    } else if (effectiveSearchValue.trim()) {
      router.push(
        `/gadget?search=${encodeURIComponent(effectiveSearchValue.trim())}`
      )
    }
  }

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
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-100 bg-white/95 px-4 py-2.5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95">
      {/* Left: Back Button OR (Brand Logo vs Smart Sticky Search Bar) */}
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
      ) : searchable && isScrolled ? (
        /* Fitur Search Pintar Sticky saat di-scroll menggantikan Logo */
        <form
          role="search"
          action=""
          onSubmit={handleSubmit}
          className="relative mr-2.5 min-w-0 flex-1 duration-200 animate-in fade-in sm:mr-3"
        >
          {/* Logo Magnifier di sisi kiri input */}
          <button
            type="submit"
            aria-label="Cari produk smartphone"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-500 focus:outline-none"
          >
            <Search className="h-4 w-4" />
          </button>
          <input
            ref={stickyInputRef}
            type="search"
            name="q"
            inputMode="search"
            enterKeyHint="search"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            value={effectiveSearchValue}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.keyCode === 13 || e.which === 13) {
                e.currentTarget.blur()
                handleSubmit(e)
              }
            }}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="shadow-2xs h-9 w-full rounded-2xl border border-slate-200/90 bg-slate-50/90 pl-9 pr-8 text-xs font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-orange-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-900 [&::-webkit-search-cancel-button]:hidden"
          />
          {effectiveSearchValue && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Hapus kata kunci pencarian"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </form>
      ) : (
        /* Brand Logo (Hanya tampil saat di posisi paling atas, tidak sticky saat di-scroll) */
        <Link
          href="/gadget"
          className="flex items-center gap-2.5 duration-200 animate-in fade-in"
          aria-label="AffiliateGadget Beranda"
        >
          <div className="shadow-xs flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 p-1.5">
            <Image
              src="/logo.webp"
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

      {/* Right Action Icons: Chat & Keranjang Belanja (Tetap Sticky di Kanan) */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Chat Icon */}
        <Link
          href={chatHref}
          className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all active:scale-95 ${
            isChatActive
              ? 'shadow-xs border-orange-500 bg-orange-50 text-orange-600 ring-2 ring-orange-500/20 dark:border-orange-500 dark:bg-orange-950/40 dark:text-orange-400'
              : 'border-slate-200/80 bg-slate-50 text-slate-700 hover:text-orange-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
          }`}
          aria-label="Chat Customer Service"
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
