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
  const isChatPage = propIsChatPage ?? pathname === '/dashboard/admin/chat'

  return (
    <footer
      className={`shrink-0 border-t border-slate-200/60 text-center text-[11px] font-medium text-slate-400 dark:border-slate-800 dark:text-slate-500 ${
        isChatPage ? 'py-2.5' : 'py-4'
      } ${className}`}
    >
      <p>© 2026 Affiliate Gadget • Platform Toko Resmi Indonesia</p>
    </footer>
  )
}
