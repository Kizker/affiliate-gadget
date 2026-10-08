'use client'

import React from 'react'
import { usePathname } from 'next/navigation'

interface AdminFooterProps {
  className?: string
  isChatPage?: boolean
}

export function AdminFooter({
  className = '',
  isChatPage: propIsChatPage,
}: AdminFooterProps) {
  const pathname = usePathname()
  const isChatPage =
    propIsChatPage ?? pathname?.startsWith('/dashboard/admin/chat')

  // Chat page harus 100% full height chat hub tanpa footer
  if (isChatPage) {
    return null
  }

  return (
    <footer
      className={`shrink-0 border-t border-slate-200/60 py-4 text-center text-[11px] font-medium text-slate-400 dark:border-slate-800 dark:text-slate-500 ${className}`}
    >
      <p>© 2026 Affiliate Gadget • Platform Toko Resmi Indonesia</p>
    </footer>
  )
}
