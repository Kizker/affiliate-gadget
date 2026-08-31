'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart-store'

interface CartIconProps {
    variant?: 'dark' | 'light'
}

export default function CartIcon({ variant = 'dark' }: CartIconProps) {
    const { data: session, status } = useSession()
    const [mounted, setMounted] = useState(false)
    const items = useCartStore((state) => state.items)
    const setUserId = useCartStore((state) => state.setUserId)
    const userId = useCartStore((state) => state.userId)
    const isLight = variant === 'light'

    // Only show cart count after hydration
    useEffect(() => {
        setMounted(true)
    }, [])

    // Sync cart with user session
    useEffect(() => {
        if (status === 'authenticated' && session?.user?.id) {
            if (userId !== session.user.id) {
                setUserId(session.user.id)
            }
        } else if (status === 'unauthenticated') {
            // Clear cart for guest
            if (userId !== null) {
                setUserId(null)
            }
        }
    }, [session, status, userId, setUserId])

    // Only show cart for authenticated customer users
    if (status !== 'authenticated') {
        return null
    }

    // Don't show cart for non-customer roles
    if (session?.user?.role) {
        const role = session.user.role as string
        if (role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'MITRA') {
            return null
        }
    }

    const itemCount = mounted
        ? items.reduce((count, item) => count + item.quantity, 0)
        : 0

    return (
        <Link
            href="/cart"
            className="relative p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={`Shopping cart${mounted && itemCount > 0 ? ` with ${itemCount} items` : ''}`}
        >
            <ShoppingCart
                className={`h-6 w-6 ${isLight ? 'text-gray-700' : 'text-gray-100'
                    }`}
            />
            {mounted && itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-[10px] font-semibold text-white shadow-sm shadow-orange-500/30">
                    {itemCount > 99 ? '99+' : itemCount}
                </span>
            )}
        </Link>
    )
}
